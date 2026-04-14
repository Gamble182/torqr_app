import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verify Cal.com HMAC-SHA256 signature
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (secret) {
    const signature = req.headers.get('x-cal-signature-256');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    try {
      const sigBuf = Buffer.from(signature, 'hex');
      const expBuf = Buffer.from(expected, 'hex');
      if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  let parsed: { triggerEvent?: string; payload?: Record<string, unknown> };
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { triggerEvent, payload: data } = parsed;

  // Only process BOOKING_CREATED; return 200 for all others to prevent retries
  if (triggerEvent !== 'BOOKING_CREATED') {
    return NextResponse.json({ received: true });
  }

  const bookingUid = (data?.uid ?? data?.bookingId) as string | undefined;
  const startTime = data?.startTime ? new Date(data.startTime as string) : null;
  const endTime = data?.endTime ? new Date(data.endTime as string) : null;
  const title = (data?.title as string) ?? null;
  const attendees = (data?.attendees as { name?: string; email?: string }[]) ?? [];
  const attendee = attendees[0] ?? null;
  const attendeeEmail = attendee?.email ?? null;
  const attendeeName = attendee?.name ?? null;
  const organizerEmail = (data?.organizer as { email?: string } | undefined)?.email ?? null;

  if (!bookingUid || !startTime) {
    console.error('[cal-webhook] Missing uid or startTime', { bookingUid, startTime });
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Resolve user by organizer email (the Cal.com account owner = our technician)
  const user = organizerEmail
    ? await prisma.user.findUnique({ where: { email: organizerEmail } })
    : null;

  if (!user) {
    console.warn(`[cal-webhook] No user for organizer: ${organizerEmail} — ignoring`);
    return NextResponse.json({ received: true });
  }

  // Match attendee email to an existing customer of this user
  const customer = attendeeEmail
    ? await prisma.customer.findFirst({
        where: { email: attendeeEmail, userId: user.id },
      })
    : null;

  // Upsert — idempotent if Cal.com retries
  await prisma.booking.upsert({
    where: { calBookingUid: bookingUid },
    update: {
      triggerEvent: triggerEvent ?? 'BOOKING_CREATED',
      startTime,
      endTime,
      title,
      attendeeName,
      attendeeEmail,
      status: 'CONFIRMED',
      customerId: customer?.id ?? null,
    },
    create: {
      calBookingUid: bookingUid,
      triggerEvent: triggerEvent ?? 'BOOKING_CREATED',
      startTime,
      endTime,
      title,
      attendeeName,
      attendeeEmail,
      status: 'CONFIRMED',
      userId: user.id,
      customerId: customer?.id ?? null,
    },
  });

  console.info(`[cal-webhook] Booking ${bookingUid} stored — customer: ${customer?.id ?? 'unmatched'}`);
  return NextResponse.json({ received: true });
}
