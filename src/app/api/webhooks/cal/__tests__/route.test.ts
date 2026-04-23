import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    booking: { upsert: vi.fn(), findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
    user: { findUnique: vi.fn() },
    customer: { findFirst: vi.fn() },
    customerSystem: { findFirst: vi.fn() },
  },
}));

vi.mock('@/lib/email/service', () => ({
  sendBookingReschedule: vi.fn(),
  sendBookingCancellation: vi.fn(),
}));

import { POST } from '@/app/api/webhooks/cal/route';

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://torqr.de/api/webhooks/cal', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest;
}

describe('POST /api/webhooks/cal — HMAC', () => {
  const originalSecret = process.env.CAL_WEBHOOK_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.CAL_WEBHOOK_SECRET = originalSecret;
  });

  it('returns 500 when CAL_WEBHOOK_SECRET is unset (fail-closed)', async () => {
    delete process.env.CAL_WEBHOOK_SECRET;
    const res = await POST(makeRequest({ triggerEvent: 'BOOKING_CREATED', payload: {} }));
    expect(res.status).toBe(500);
  });

  it('returns 401 when signature header is missing', async () => {
    process.env.CAL_WEBHOOK_SECRET = 'secret';
    const res = await POST(makeRequest({ triggerEvent: 'BOOKING_CREATED', payload: {} }));
    expect(res.status).toBe(401);
  });
});

import { createHmac } from 'crypto';
import { prisma } from '@/lib/prisma';

function signedRequest(event: string, payload: Record<string, unknown>) {
  process.env.CAL_WEBHOOK_SECRET = 'secret';
  const body = JSON.stringify({ triggerEvent: event, payload });
  const sig = createHmac('sha256', 'secret').update(body).digest('hex');
  return makeRequest(body, { 'x-cal-signature-256': sig });
}

describe('POST /api/webhooks/cal — BOOKING_RESCHEDULED', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CAL_WEBHOOK_SECRET = 'secret';
  });

  it('marks the original booking as RESCHEDULED and inserts the new booking', async () => {
    (prisma.booking.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'old-db-id',
      calBookingUid: 'OLD_UID',
      companyId: 'c1',
      userId: 'u1',
      customerId: 'cust1',
      systemId: 'sys1',
    });
    (prisma.booking.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (prisma.booking.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'new-db-id' });

    const res = await POST(
      signedRequest('BOOKING_RESCHEDULED', {
        uid: 'NEW_UID',
        rescheduledFromUid: 'OLD_UID',
        startTime: '2026-05-10T09:00:00Z',
        endTime: '2026-05-10T10:00:00Z',
        attendees: [{ name: 'Max Müller', email: 'max@example.com' }],
        organizer: { email: 'owner@example.com' },
        metadata: { customerId: 'cust1', userId: 'u1', systemId: 'sys1' },
      })
    );

    expect(res.status).toBe(200);
    expect(prisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { calBookingUid: 'OLD_UID' },
        data: expect.objectContaining({
          status: 'RESCHEDULED',
          rescheduledToUid: 'NEW_UID',
        }),
      })
    );
    expect(prisma.booking.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { calBookingUid: 'NEW_UID' },
        create: expect.objectContaining({
          calBookingUid: 'NEW_UID',
          triggerEvent: 'BOOKING_RESCHEDULED',
          rescheduledFromUid: 'OLD_UID',
          status: 'CONFIRMED',
        }),
      })
    );
  });
});

describe('POST /api/webhooks/cal — BOOKING_CANCELLED', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CAL_WEBHOOK_SECRET = 'secret';
  });

  it('marks the booking as CANCELLED with reason + timestamp', async () => {
    (prisma.booking.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'db-id',
      calBookingUid: 'U1',
      customerId: 'cust1',
    });
    (prisma.booking.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'db-id',
    });

    const res = await POST(
      signedRequest('BOOKING_CANCELLED', {
        uid: 'U1',
        cancellationReason: 'Krankheit',
      })
    );

    expect(res.status).toBe(200);
    expect(prisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { calBookingUid: 'U1' },
        data: expect.objectContaining({
          status: 'CANCELLED',
          cancelReason: 'Krankheit',
        }),
      })
    );
  });
});
