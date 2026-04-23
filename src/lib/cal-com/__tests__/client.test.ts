import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CalComApiError,
  cancelCalBooking,
  rescheduleCalBooking,
} from '@/lib/cal-com/client';

describe('cal-com client', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.CAL_COM_API_KEY = 'test-key';
    process.env.CAL_COM_API_BASE = 'https://api.example.test/v2';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('throws if CAL_COM_API_KEY is missing', async () => {
    delete process.env.CAL_COM_API_KEY;
    await expect(
      rescheduleCalBooking({ uid: 'u1', startTime: new Date('2026-05-01T09:00:00Z') })
    ).rejects.toThrow(/CAL_COM_API_KEY/);
  });

  it('posts to /bookings/{uid}/reschedule with Bearer auth and returns new uid', async () => {
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { uid: 'new-uid-123' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
    global.fetch = mock as unknown as typeof fetch;

    const result = await rescheduleCalBooking({
      uid: 'old-uid',
      startTime: new Date('2026-05-01T09:00:00Z'),
      reschedulingReason: 'Kunde verschoben',
    });

    expect(result.newUid).toBe('new-uid-123');
    expect(mock).toHaveBeenCalledWith(
      'https://api.example.test/v2/bookings/old-uid/reschedule',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
          'Content-Type': 'application/json',
        }),
      })
    );
    const call = mock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(call.body as string)).toEqual({
      start: '2026-05-01T09:00:00.000Z',
      reschedulingReason: 'Kunde verschoben',
    });
  });

  it('throws CalComApiError on non-2xx reschedule', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'bad' }), { status: 422 })
    ) as unknown as typeof fetch;

    await expect(
      rescheduleCalBooking({ uid: 'u', startTime: new Date() })
    ).rejects.toBeInstanceOf(CalComApiError);
  });

  it('posts to /bookings/{uid}/cancel with reason', async () => {
    const mock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    global.fetch = mock as unknown as typeof fetch;

    await cancelCalBooking({ uid: 'u1', cancellationReason: 'Kunde abwesend' });

    expect(mock).toHaveBeenCalledWith(
      'https://api.example.test/v2/bookings/u1/cancel',
      expect.objectContaining({ method: 'POST' })
    );
    const call = mock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(call.body as string)).toEqual({ cancellationReason: 'Kunde abwesend' });
  });

  it('falls back to default base URL when CAL_COM_API_BASE is unset', async () => {
    delete process.env.CAL_COM_API_BASE;
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { uid: 'x' } }), { status: 200 })
    );
    global.fetch = mock as unknown as typeof fetch;

    await rescheduleCalBooking({ uid: 'u', startTime: new Date('2026-05-01T09:00:00Z') });
    expect(mock.mock.calls[0][0]).toBe('https://api.cal.com/v2/bookings/u/reschedule');
  });
});
