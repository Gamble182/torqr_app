import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockCreate, mockSendNotify } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockSendNotify: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { demoRequest: { create: mockCreate } },
}));

vi.mock('@/lib/email/service', () => ({
  sendDemoRequestNotification: mockSendNotify,
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimitMiddleware: vi.fn(async () => null),
  RATE_LIMIT_PRESETS: { DEMO_REQUEST: { interval: 60 * 60 * 1000, maxRequests: 3 } },
}));

import { POST } from '../route';

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/demo-requests', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /api/demo-requests', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockSendNotify.mockReset();
  });

  it('akzeptiert gültige Anfrage', async () => {
    mockCreate.mockResolvedValue({ id: 'x' });
    mockSendNotify.mockResolvedValue({ ok: true });

    const res = await POST(makeRequest({ email: 'a@b.de', name: 'Max', consent: true }));
    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalled();
  });

  it('lehnt fehlenden Namen ab', async () => {
    const res = await POST(makeRequest({ email: 'a@b.de', consent: true }));
    expect(res.status).toBe(400);
  });
});
