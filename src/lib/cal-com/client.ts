/**
 * Thin wrapper around the Cal.com v2 REST API.
 *
 * Only reschedule + cancel are supported — booking creation stays on the
 * Cal.com side via reminder links. Called from server-side API routes.
 */

const DEFAULT_BASE = 'https://api.cal.com/v2';

export class CalComApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message?: string
  ) {
    super(message ?? `Cal.com API error ${status}`);
    this.name = 'CalComApiError';
  }
}

function apiKey(): string {
  const key = process.env.CAL_COM_API_KEY;
  if (!key) {
    throw new Error('CAL_COM_API_KEY is not set — Cal.com reschedule/cancel is disabled');
  }
  return key;
}

function base(): string {
  return process.env.CAL_COM_API_BASE || DEFAULT_BASE;
}

async function callJson<T>(url: string, body: unknown): Promise<T> {
  const started = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const duration = Date.now() - started;

  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  if (!res.ok) {
    console.error(`[cal-com] ${url} status=${res.status} duration=${duration}ms`);
    throw new CalComApiError(res.status, parsed, `Cal.com API error ${res.status}`);
  }
  console.info(`[cal-com] ${url} status=${res.status} duration=${duration}ms`);
  return parsed as T;
}

export async function rescheduleCalBooking(params: {
  uid: string;
  startTime: Date;
  reschedulingReason?: string;
}): Promise<{ newUid: string }> {
  const response = await callJson<{ data?: { uid?: string }; uid?: string }>(
    `${base()}/bookings/${params.uid}/reschedule`,
    {
      start: params.startTime.toISOString(),
      ...(params.reschedulingReason ? { reschedulingReason: params.reschedulingReason } : {}),
    }
  );
  const newUid = response.data?.uid ?? response.uid;
  if (!newUid) {
    throw new CalComApiError(200, response, 'Cal.com reschedule: no uid returned');
  }
  return { newUid };
}

export async function cancelCalBooking(params: {
  uid: string;
  cancellationReason?: string;
}): Promise<void> {
  await callJson<unknown>(
    `${base()}/bookings/${params.uid}/cancel`,
    params.cancellationReason ? { cancellationReason: params.cancellationReason } : {}
  );
}
