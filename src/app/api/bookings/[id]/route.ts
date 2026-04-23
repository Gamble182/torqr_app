import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { bookingRescheduleSchema, bookingCancelSchema } from '@/lib/validations';
import { sendBookingReschedule, sendBookingCancellation } from '@/lib/email/service';
import { rescheduleCalBooking, cancelCalBooking, CalComApiError } from '@/lib/cal-com/client';

/**
 * GET /api/bookings/[id]
 * Returns a single booking with full detail for the edit/cancel modals.
 * Tenant-scoped via companyId; TECHNICIAN can only see bookings assigned to them.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, companyId, role } = await requireAuth();
    const { id } = await params;

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        companyId,
        ...(role === 'TECHNICIAN'
          ? { OR: [{ assignedToUserId: userId }, { system: { assignedToUserId: userId } }] }
          : {}),
      },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true, emailOptIn: true } },
        system: {
          select: {
            id: true,
            serialNumber: true,
            catalog: { select: { manufacturer: true, name: true, systemType: true } },
          },
        },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Termin nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error fetching booking:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Laden des Termins' }, { status: 500 });
  }
}

function isManual(triggerEvent: string): boolean {
  return triggerEvent === 'BOOKING_MANUAL';
}

/**
 * PATCH /api/bookings/[id]
 * Reschedules a confirmed booking — manual path updates DB directly,
 * Cal.com path calls v2 API then mirrors the new booking into DB.
 * OWNER only.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = await requireOwner();
    const { id } = await params;
    const body = await request.json();
    const validated = bookingRescheduleSchema.parse(body);

    const existing = await prisma.booking.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Termin nicht gefunden' }, { status: 404 });
    }
    if (existing.status !== 'CONFIRMED') {
      return NextResponse.json(
        { success: false, error: 'Nur bestätigte Termine können verschoben werden' },
        { status: 409 }
      );
    }

    const newStart = new Date(validated.startTime);
    const newEnd = validated.endTime ? new Date(validated.endTime) : null;
    const oldStart = existing.startTime;

    if (isManual(existing.triggerEvent)) {
      const updated = await prisma.booking.update({
        where: { id },
        data: {
          startTime: newStart,
          endTime: newEnd,
          rescheduledAt: new Date(),
        },
      });

      if (validated.notifyCustomer && existing.customerId) {
        sendBookingReschedule(updated.id, oldStart, validated.reason ?? null).catch((err) =>
          console.error(`[bookings] reschedule email failed for ${updated.id}:`, err)
        );
      }

      return NextResponse.json({ success: true, data: updated });
    }

    // Cal.com branch: call v2 API, mirror into DB, fire email.
    // If CAL_COM_API_KEY is unset, surface a clear error.
    if (!process.env.CAL_COM_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Cal.com API key not configured — reschedule via Cal.com dashboard required' },
        { status: 503 }
      );
    }

    console.info(`[bookings] cal reschedule: booking=${existing.id} oldUid=${existing.calBookingUid} newStart=${newStart.toISOString()}`);
    const { newUid } = await rescheduleCalBooking({
      uid: existing.calBookingUid,
      startTime: newStart,
      reschedulingReason: validated.reason ?? undefined,
    });

    await prisma.booking.update({
      where: { id: existing.id },
      data: {
        status: 'RESCHEDULED',
        rescheduledToUid: newUid,
        rescheduledAt: new Date(),
      },
    });

    const newBooking = await prisma.booking.upsert({
      where: { calBookingUid: newUid },
      update: {
        startTime: newStart,
        endTime: newEnd,
        triggerEvent: 'BOOKING_RESCHEDULED',
        status: 'CONFIRMED',
        rescheduledFromUid: existing.calBookingUid,
      },
      create: {
        calBookingUid: newUid,
        triggerEvent: 'BOOKING_RESCHEDULED',
        startTime: newStart,
        endTime: newEnd,
        status: 'CONFIRMED',
        rescheduledFromUid: existing.calBookingUid,
        companyId: existing.companyId,
        userId: existing.userId,
        customerId: existing.customerId,
        systemId: existing.systemId,
        assignedToUserId: existing.assignedToUserId,
      },
    });

    if (validated.notifyCustomer && existing.customerId) {
      sendBookingReschedule(newBooking.id, oldStart, validated.reason ?? null).catch((err) =>
        console.error(`[bookings] cal reschedule email failed for ${newBooking.id}:`, err)
      );
    }

    return NextResponse.json({ success: true, data: newBooking });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validierungsfehler', details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: 'Nur Inhaber können Termine verschieben' }, { status: 403 });
    }
    if (error instanceof CalComApiError) {
      return NextResponse.json(
        { success: false, error: 'Cal.com-Fehler beim Verschieben', details: String(error.body) },
        { status: 502 }
      );
    }
    console.error('Error rescheduling booking:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Verschieben des Termins' }, { status: 500 });
  }
}

/**
 * DELETE /api/bookings/[id]
 * Cancels a confirmed booking — manual path updates DB directly,
 * Cal.com path calls v2 cancel API first then mirrors status into DB.
 * TECHNICIAN can cancel their own assigned bookings; OWNER can cancel any.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, companyId, role } = await requireAuth();
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const validated = bookingCancelSchema.parse(body);

    const existing = await prisma.booking.findFirst({
      where: {
        id,
        companyId,
        ...(role === 'TECHNICIAN'
          ? { OR: [{ assignedToUserId: userId }, { system: { assignedToUserId: userId } }] }
          : {}),
      },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Termin nicht gefunden' }, { status: 404 });
    }
    if (existing.status !== 'CONFIRMED') {
      return NextResponse.json(
        { success: false, error: 'Nur bestätigte Termine können storniert werden' },
        { status: 409 }
      );
    }

    if (!isManual(existing.triggerEvent)) {
      if (!process.env.CAL_COM_API_KEY) {
        return NextResponse.json(
          { success: false, error: 'Cal.com API key not configured' },
          { status: 503 }
        );
      }
      await cancelCalBooking({
        uid: existing.calBookingUid,
        cancellationReason: validated.reason ?? undefined,
      });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelReason: validated.reason ?? null,
        cancelledAt: new Date(),
      },
    });

    if (validated.notifyCustomer && existing.customerId) {
      sendBookingCancellation(updated.id, validated.reason ?? null).catch((err) =>
        console.error(`[bookings] cancel email failed for ${updated.id}:`, err)
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validierungsfehler', details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    if (error instanceof CalComApiError) {
      return NextResponse.json(
        { success: false, error: 'Cal.com-Fehler beim Stornieren', details: String(error.body) },
        { status: 502 }
      );
    }
    console.error('Error cancelling booking:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Stornieren des Termins' }, { status: 500 });
  }
}
