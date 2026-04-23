import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Fail-closed: refuse all requests if the secret is not configured
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[cal-webhook] CAL_WEBHOOK_SECRET is not configured — refusing request');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  // Verify Cal.com HMAC-SHA256 signature
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

  let parsed: { triggerEvent?: string; payload?: Record<string, unknown> };
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { triggerEvent, payload: data } = parsed;

  switch (triggerEvent) {
    case 'BOOKING_CREATED':
      return handleBookingCreated(data ?? {}, triggerEvent);
    case 'BOOKING_RESCHEDULED':
      return handleBookingRescheduled(data ?? {});
    case 'BOOKING_CANCELLED':
      return handleBookingCancelled(data ?? {});
    default:
      return NextResponse.json({ received: true });
  }
}

async function handleBookingCreated(data: Record<string, unknown>, triggerEvent: string) {
  const bookingUid = (data.uid ?? data.bookingId) as string | undefined;
  const startTime = data.startTime ? new Date(data.startTime as string) : null;
  const endTime = data.endTime ? new Date(data.endTime as string) : null;
  const title = (data.title as string) ?? null;
  const attendees = (data.attendees as { name?: string; email?: string }[]) ?? [];
  const attendee = attendees[0] ?? null;
  const attendeeEmail = attendee?.email ?? null;
  const attendeeName = attendee?.name ?? null;
  const organizerEmail = (data.organizer as { email?: string } | undefined)?.email ?? null;

  // Cal.com passes ?metadata[key]=value URL params back in payload.metadata.
  // Reminder emails embed customerId + userId directly, making this a reliable
  // direct lookup. Falls back to email matching for direct (non-email) bookings.
  const metadata = (data.metadata ?? {}) as Record<string, string>;
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
        where: { id: metaCustomerId, companyId: user.companyId },
      })
    : null;

  if (!customer && attendeeEmail) {
    customer = await prisma.customer.findFirst({
      where: {
        email: { equals: attendeeEmail, mode: 'insensitive' },
        companyId: user.companyId,
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
      where: { id: metaSystemId, companyId: user.companyId },
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

async function handleBookingRescheduled(data: Record<string, unknown>) {
  const newUid = (data.uid ?? data.bookingId) as string | undefined;
  const oldUid =
    (data.rescheduledFromUid as string | undefined) ??
    ((data.fromReschedule as { uid?: string } | undefined)?.uid) ??
    (data.rescheduledBy as string | undefined);

  if (!newUid || !oldUid) {
    console.error('[cal-webhook] BOOKING_RESCHEDULED missing uid or rescheduledFromUid', { newUid, oldUid });
    return NextResponse.json({ received: true });
  }

  const original = await prisma.booking.findUnique({
    where: { calBookingUid: oldUid },
  });

  if (!original) {
    console.warn(`[cal-webhook] RESCHEDULED: original ${oldUid} not found — inserting new row only`);
  }

  const startTime = data.startTime ? new Date(data.startTime as string) : null;
  const endTime = data.endTime ? new Date(data.endTime as string) : null;
  if (!startTime) {
    console.error('[cal-webhook] RESCHEDULED missing startTime');
    return NextResponse.json({ received: true });
  }

  const attendees = (data.attendees as { name?: string; email?: string }[]) ?? [];
  const attendee = attendees[0] ?? null;
  const metadata = (data.metadata ?? {}) as Record<string, string>;

  if (original) {
    await prisma.booking.update({
      where: { calBookingUid: oldUid },
      data: {
        status: 'RESCHEDULED',
        rescheduledToUid: newUid,
        rescheduledAt: new Date(),
      },
    });
  }

  const companyId = original?.companyId ?? null;
  const userId = original?.userId ?? metadata.userId ?? null;
  const customerId = original?.customerId ?? metadata.customerId ?? null;
  const systemId = original?.systemId ?? metadata.systemId ?? null;

  if (!companyId || !userId) {
    console.warn('[cal-webhook] RESCHEDULED: cannot resolve companyId/userId — skipping insert');
    return NextResponse.json({ received: true });
  }

  const newBooking = await prisma.booking.upsert({
    where: { calBookingUid: newUid },
    update: {
      triggerEvent: 'BOOKING_RESCHEDULED',
      startTime,
      endTime,
      status: 'CONFIRMED',
      rescheduledFromUid: oldUid,
      title: (data.title as string) ?? null,
      attendeeName: attendee?.name ?? null,
      attendeeEmail: attendee?.email ?? null,
    },
    create: {
      calBookingUid: newUid,
      triggerEvent: 'BOOKING_RESCHEDULED',
      startTime,
      endTime,
      status: 'CONFIRMED',
      rescheduledFromUid: oldUid,
      title: (data.title as string) ?? null,
      attendeeName: attendee?.name ?? null,
      attendeeEmail: attendee?.email ?? null,
      companyId,
      userId,
      customerId,
      systemId,
    },
  });

  // Fire-and-forget reschedule email — the module may not export this fn yet (Task 11);
  // silently ignore. Runtime is still correct once Task 11 lands.
  if (customerId) {
    try {
      const emailModule = await import('@/lib/email/service');
      const fn = (emailModule as Record<string, unknown>).sendBookingReschedule as
        | ((id: string) => Promise<void>)
        | undefined;
      if (fn) {
        fn(newBooking.id).catch((err) =>
          console.error(`[cal-webhook] reschedule email failed for ${newBooking.id}:`, err)
        );
      }
    } catch (err) {
      console.warn(`[cal-webhook] email module not ready for reschedule: `, err);
    }
  }

  console.info(`[cal-webhook] RESCHEDULED ${oldUid} -> ${newUid}`);
  return NextResponse.json({ received: true });
}

async function handleBookingCancelled(data: Record<string, unknown>) {
  const uid = (data.uid ?? data.bookingId) as string | undefined;
  if (!uid) {
    console.error('[cal-webhook] BOOKING_CANCELLED missing uid');
    return NextResponse.json({ received: true });
  }

  const reason =
    (data.cancellationReason as string | undefined) ??
    (data.cancelReason as string | undefined) ??
    null;

  const existing = await prisma.booking.findUnique({ where: { calBookingUid: uid } });
  if (!existing) {
    console.warn(`[cal-webhook] CANCELLED: booking ${uid} not found — ignoring`);
    return NextResponse.json({ received: true });
  }

  const updated = await prisma.booking.update({
    where: { calBookingUid: uid },
    data: {
      status: 'CANCELLED',
      cancelReason: reason,
      cancelledAt: new Date(),
    },
  });

  if (existing.customerId) {
    try {
      const emailModule = await import('@/lib/email/service');
      const fn = (emailModule as Record<string, unknown>).sendBookingCancellation as
        | ((id: string) => Promise<void>)
        | undefined;
      if (fn) {
        fn(updated.id).catch((err) =>
          console.error(`[cal-webhook] cancel email failed for ${updated.id}:`, err)
        );
      }
    } catch (err) {
      console.warn(`[cal-webhook] email module not ready for cancel: `, err);
    }
  }

  console.info(`[cal-webhook] CANCELLED ${uid}`);
  return NextResponse.json({ received: true });
}
