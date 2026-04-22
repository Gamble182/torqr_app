import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { manualBookingCreateSchema } from '@/lib/validations';
import { sendBookingConfirmation } from '@/lib/email/service';

/**
 * GET /api/bookings?customerId=xxx
 * Returns bookings for the authenticated user, optionally filtered by customer.
 * Ordered: upcoming first, then past (desc).
 */
export async function GET(request: NextRequest) {
  try {
    const { companyId } = await requireAuth();

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    const bookings = await prisma.booking.findMany({
      where: {
        companyId,
        ...(customerId ? { customerId } : {}),
      },
      include: {
        customer: { select: { id: true, name: true } },
        system: { select: { id: true, catalog: { select: { manufacturer: true, name: true } } } },
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
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
