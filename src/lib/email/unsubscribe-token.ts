import { createHmac, timingSafeEqual } from 'crypto';

function getSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) throw new Error('UNSUBSCRIBE_SECRET is not set');
  return secret;
}

export function generateUnsubscribeToken(customerId: string): string {
  return createHmac('sha256', getSecret()).update(customerId).digest('hex');
}

export function verifyUnsubscribeToken(customerId: string, token: string): boolean {
  const expected = generateUnsubscribeToken(customerId);
  try {
    const expectedBuf = Buffer.from(expected, 'hex');
    const tokenBuf = Buffer.from(token, 'hex');
    if (expectedBuf.length !== tokenBuf.length) return false;
    return timingSafeEqual(expectedBuf, tokenBuf);
  } catch {
    return false;
  }
}

// Path format: "<customerId>.<hmacToken>"
// Uses lastIndexOf so UUIDs (which contain hyphens) are handled correctly
export function buildUnsubscribePath(customerId: string): string {
  return `${customerId}.${generateUnsubscribeToken(customerId)}`;
}

export function parseUnsubscribePath(
  path: string
): { customerId: string; token: string } | null {
  const dotIndex = path.lastIndexOf('.');
  if (dotIndex === -1) return null;
  return {
    customerId: path.slice(0, dotIndex),
    token: path.slice(dotIndex + 1),
  };
}

export function buildUnsubscribeUrl(customerId: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/unsubscribe/${buildUnsubscribePath(customerId)}`;
}
