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

  // Cal.com passes ?metadata[key]=value URL params back in payload.metadata.
  // Reminder emails embed customerId + userId directly, making this a reliable
  // direct lookup. Falls back to email matching for direct (non-email) bookings.
  const metadata = (data?.metadata ?? {}) as Record<string, string>;
  const metaCustomerId = metadata.customerId ?? null;
  const metaUserId = metadata.userId ?? null;
  const metaSystemId = metadata.systemId ?? null;

  if (!bookingUid || !startTime) {
    console.error('[cal-webhook] Missing uid or startTime', { bookingUid, startTime });
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // --- Resolve user ---
  // Strategy 1: metadata userId (from reminder email link — most reliable)
  // Strategy 2: organizer email (Cal.com account owner)
  let user = metaUserId
    ? await prisma.user.findUnique({ where: { id: metaUserId }, select: { id: true, companyId: true, email: true } })
    : null;

  if (!user && organizerEmail) {
    user = await prisma.user.findUnique({ where: { email: organizerEmail }, select: { id: true, companyId: true, email: true } });
  }

  if (!user) {
    console.warn(`[cal-webhook] No user resolved — metaUserId: ${metaUserId}, organizer: ${organizerEmail}`);
    return NextResponse.json({ received: true });
  }

  // --- Resolve customer ---
  // Strategy 1: metadata customerId (from reminder email link — exact match)
  // Strategy 2: attendee email within the resolved user's customer scope
  let customer = metaCustomerId
    ? await prisma.customer.findFirst({
        where: { id: metaCustomerId, userId: user.id },
      })
    : null;

  if (!customer && attendeeEmail) {
    customer = await prisma.customer.findFirst({
      where: {
        email: { equals: attendeeEmail, mode: 'insensitive' },
        userId: user.id,
      },
    });
    if (customer) {
      console.info(`[cal-webhook] Customer matched via email fallback: ${customer.id}`);
    }
  }

  if (!customer) {
    console.info(`[cal-webhook] No customer matched — booking stored without customerId`);
  }

  // --- Resolve system ---
  // Validate that the systemId from metadata belongs to the resolved user (scope check)
  let system = null;
  if (metaSystemId) {
    system = await prisma.customerSystem.findFirst({
      where: { id: metaSystemId, userId: user.id },
    });
    if (!system) {
      console.warn(`[cal-webhook] systemId ${metaSystemId} not found for user ${user.id} — ignored`);
    }
  }

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
      systemId: system?.id ?? null,
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
      companyId: user.companyId,
      userId: user.id,
      customerId: customer?.id ?? null,
      systemId: system?.id ?? null,
    },
  });

  console.info(`[cal-webhook] Booking ${bookingUid} stored — customer: ${customer?.id ?? 'unmatched'}, system: ${system?.id ?? 'unmatched'}, strategy: ${metaCustomerId ? 'metadata' : 'email'}`);
  return NextResponse.json({ received: true });
}
