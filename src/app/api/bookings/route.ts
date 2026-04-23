import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { manualBookingCreateSchema, bookingListQuerySchema } from '@/lib/validations';
import { sendBookingConfirmation } from '@/lib/email/service';

/**
 * GET /api/bookings
 * Returns bookings for the authenticated company with rich filtering.
 * TECHNICIAN role is scoped to their assigned bookings/systems.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, companyId, role } = await requireAuth();

    const { searchParams } = new URL(request.url);
    const parsed = bookingListQuerySchema.safeParse({
      range: searchParams.get('range') ?? undefined,
      status: searchParams.getAll('status').length > 0 ? searchParams.getAll('status') : undefined,
      assignee: searchParams.get('assignee') ?? undefined,
      customerId: searchParams.get('customerId') ?? undefined,
      systemType: searchParams.get('systemType') ?? undefined,
      source: searchParams.get('source') ?? undefined,
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Ungültige Filterparameter', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const f = parsed.data;
    const now = new Date();
    const where: Prisma.BookingWhereInput = { companyId };

    if (role === 'TECHNICIAN') {
      where.OR = [
        { assignedToUserId: userId },
        { system: { assignedToUserId: userId } },
      ];
    }

    if (f.customerId) where.customerId = f.customerId;

    if (role === 'OWNER' && f.assignee) {
      where.assignedToUserId = f.assignee === 'unassigned' ? null : f.assignee;
    }

    if (f.systemType && f.systemType !== 'all') {
      where.system = { ...(where.system as object | undefined), catalog: { systemType: f.systemType } };
    }

    if (f.source === 'manual') where.triggerEvent = 'BOOKING_MANUAL';
    else if (f.source === 'cal') where.triggerEvent = { not: 'BOOKING_MANUAL' };

    if (f.status) {
      const statusArr = Array.isArray(f.status) ? f.status : [f.status];
      where.status = { in: statusArr };
    } else {
      where.status = { in: ['CONFIRMED', 'RESCHEDULED'] };
    }

    if (f.from || f.to) {
      where.startTime = {};
      if (f.from) (where.startTime as Prisma.DateTimeFilter).gte = new Date(f.from);
      if (f.to) (where.startTime as Prisma.DateTimeFilter).lte = new Date(f.to);
    } else if (f.range === 'upcoming') {
      where.startTime = { gte: now };
    } else if (f.range === 'week') {
      const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      where.startTime = { gte: now, lte: weekLater };
    } else if (f.range === 'month') {
      const monthLater = new Date(now);
      monthLater.setMonth(monthLater.getMonth() + 1);
      where.startTime = { gte: now, lte: monthLater };
    } else if (f.range === 'past') {
      where.startTime = { lt: now };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        system: {
          select: {
            id: true,
            serialNumber: true,
            catalog: { select: { manufacturer: true, name: true, systemType: true } },
          },
        },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: [
        { startTime: f.range === 'past' ? 'desc' : 'asc' },
      ],
      take: f.limit,
    });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Laden der Termine' }, { status: 500 });
  }
}

/**
 * POST /api/bookings
 * Manually create a booking on behalf of a customer (office-side booking).
 * Sends a confirmation email if the linked customer has an email address.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, companyId } = await requireOwner();

    const body = await request.json();
    const validated = manualBookingCreateSchema.parse(body);

    // Validate system belongs to this company
    const system = await prisma.customerSystem.findFirst({
      where: { id: validated.systemId, companyId },
      include: { customer: { select: { id: true } } },
    });
    if (!system) {
      return NextResponse.json({ success: false, error: 'System nicht gefunden' }, { status: 404 });
    }

    const booking = await prisma.booking.create({
      data: {
        calBookingUid: `manual-${randomUUID()}`,
        triggerEvent: 'BOOKING_MANUAL',
        startTime: new Date(validated.startTime),
        endTime: validated.endTime ? new Date(validated.endTime) : null,
        status: 'CONFIRMED',
        companyId,
        userId,
        customerId: system.customer?.id ?? null,
        systemId: system.id,
      },
    });

    // Fire-and-forget — confirmation email failure must not block the response
    if (system.customer?.id) {
      sendBookingConfirmation(booking.id).catch((err) =>
        console.error(`[bookings] Confirmation email failed for booking ${booking.id}:`, err)
      );
    }

    return NextResponse.json({ success: true, data: booking }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validierungsfehler', details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: 'Nur Inhaber können Termine erstellen' }, { status: 403 });
    }
    console.error('Error creating booking:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Erstellen des Termins' }, { status: 500 });
  }
}
