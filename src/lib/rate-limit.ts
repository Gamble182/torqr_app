import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per interval
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * In-memory fallback store. Used when Upstash Redis is not configured (local dev / CI tests).
 * This store resets on every Vercel cold start and does NOT shard across instances — so it must
 * never be relied on in production.
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (record.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

/**
 * Resolve Upstash REST credentials. Supports multiple env var naming conventions so the same
 * code works across manual config, legacy Vercel KV, and the current Vercel Marketplace
 * "Upstash For Redis" integration (which injects `UP_KV_REST_API_*`).
 */
function resolveUpstashCredentials(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    process.env.UP_KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    process.env.UP_KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

/**
 * Upstash client (null when env vars are missing — triggers in-memory fallback).
 */
const upstashCredentials = resolveUpstashCredentials();
const redis = upstashCredentials
  ? new Redis({ url: upstashCredentials.url, token: upstashCredentials.token })
  : null;

/**
 * One limiter per (interval, maxRequests) combination. Cached so we don't rebuild limiters on
 * every call. Keyed by `${interval}:${maxRequests}` and uses a sliding-window algorithm.
 */
const limiterCache = new Map<string, Ratelimit>();

function getLimiter(config: RateLimitConfig): Ratelimit | null {
  if (!redis) return null;
  const key = `${config.interval}:${config.maxRequests}`;
  let limiter = limiterCache.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.interval} ms`),
      analytics: false,
      prefix: 'torqr:ratelimit',
    });
    limiterCache.set(key, limiter);
  }
  return limiter;
}

function inMemoryCheck(identifier: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || record.resetTime < now) {
    const resetTime = now + config.interval;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return { success: true, remaining: config.maxRequests - 1, resetTime };
  }

  if (record.count >= config.maxRequests) {
    return { success: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  rateLimitStore.set(identifier, record);
  return {
    success: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Core rate limiter. Uses Upstash Redis when configured, otherwise an in-memory Map.
 * On Upstash transport errors we fail OPEN to keep the product available.
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig = { interval: 60_000, maxRequests: 10 }
): Promise<RateLimitResult> {
  const limiter = getLimiter(config);
  if (!limiter) {
    return inMemoryCheck(identifier, config);
  }

  try {
    const { success, remaining, reset } = await limiter.limit(identifier);
    return { success, remaining, resetTime: reset };
  } catch (err) {
    console.error('Upstash rate limit failed (fail-open):', err);
    return { success: true, remaining: config.maxRequests, resetTime: Date.now() + config.interval };
  }
}

/**
 * Get client identifier from request headers.
 */
export function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  const ip =
    cfConnectingIp ||
    realIp ||
    (forwarded ? forwarded.split(',')[0].trim() : null) ||
    'unknown';

  return ip;
}

function buildLimitResponse(result: RateLimitResult, config: RateLimitConfig) {
  const retryAfter = Math.max(1, Math.ceil((result.resetTime - Date.now()) / 1000));

  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetTime.toString(),
      },
    }
  );
}

/**
 * IP-based rate limit middleware. Returns a Response if blocked, null otherwise.
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  config: RateLimitConfig = { interval: 60_000, maxRequests: 10 }
): Promise<Response | null> {
  const identifier = `ip:${getClientIdentifier(request)}`;
  const result = await rateLimit(identifier, config);
  if (!result.success) {
    return buildLimitResponse(result, config);
  }
  return null;
}

/**
 * User-based rate limit for authenticated endpoints.
 */
export async function rateLimitByUser(
  _request: NextRequest,
  userId: string,
  config: RateLimitConfig = { interval: 60_000, maxRequests: 100 }
): Promise<Response | null> {
  const identifier = `user:${userId}`;
  const result = await rateLimit(identifier, config);
  if (!result.success) {
    return buildLimitResponse(result, config);
  }
  return null;
}

export const RATE_LIMIT_PRESETS = {
  LOGIN: { interval: 15 * 60 * 1000, maxRequests: 10 },
  REGISTER: { interval: 15 * 60 * 1000, maxRequests: 5 },
  API_USER: { interval: 60 * 1000, maxRequests: 100 },
  FILE_UPLOAD: { interval: 60 * 1000, maxRequests: 10 },
  BETA_LEAD: { interval: 60 * 60 * 1000, maxRequests: 5 },
  DEMO_REQUEST: { interval: 60 * 60 * 1000, maxRequests: 3 },
} as const;
