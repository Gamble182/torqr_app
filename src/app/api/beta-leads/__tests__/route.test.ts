import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockCreate, mockSendNotify } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockSendNotify: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { betaLead: { create: mockCreate } },
}));

vi.mock('@/lib/email/service', () => ({
  sendBetaLeadNotification: mockSendNotify,
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimitMiddleware: vi.fn(async () => null),
  RATE_LIMIT_PRESETS: { BETA_LEAD: { interval: 60 * 60 * 1000, maxRequests: 5 } },
}));

import { POST } from '../route';

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/beta-leads', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /api/beta-leads', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockSendNotify.mockReset();
  });

  it('akzeptiert gültigen Lead', async () => {
    mockCreate.mockResolvedValue({ id: 'x' });
    mockSendNotify.mockResolvedValue({ ok: true });

    const res = await POST(makeRequest({ email: 'a@b.de', consent: true }));
    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalled();
    expect(mockSendNotify).toHaveBeenCalled();
  });

  it('lehnt ungültige Eingabe mit 400 ab', async () => {
    const res = await POST(makeRequest({ email: 'invalid', consent: true }));
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('lehnt fehlenden Consent mit 400 ab', async () => {
    const res = await POST(makeRequest({ email: 'a@b.de', consent: false }));
    expect(res.status).toBe(400);
  });

  it('Honeypot: gibt 400 zurück, persistiert aber nicht', async () => {
    const res = await POST(makeRequest({ email: 'a@b.de', consent: true, website: 'spam' }));
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
