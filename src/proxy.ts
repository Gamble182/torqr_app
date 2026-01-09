import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimitMiddleware, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

export function proxy(request: NextRequest) {
  // Apply rate limiting to login endpoint
  if (
    request.nextUrl.pathname.startsWith('/api/auth/signin') ||
    request.nextUrl.pathname.startsWith('/api/auth/callback/credentials')
  ) {
    const rateLimitResponse = rateLimitMiddleware(
      request,
      RATE_LIMIT_PRESETS.LOGIN
    );

    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/api/auth/:path*',
    // Exclude static files and images
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
