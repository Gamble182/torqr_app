import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { getEffectivePartsForSystem } from '@/lib/maintenance-parts';

/**
 * GET /api/bookings/:id/packing-list
 *
 * Returns a packing-list DTO for a booking: the booking itself,
 * the customer, the assigned system (incl. catalog + system technician),
 * the booking technician, and the resolved effective parts list.
 *
 * Authorization:
 * - OWNER: any booking in their tenant.
 * - TECHNICIAN: only bookings assigned to them (assignedToUserId === userId);
 *   otherwise 403 "Zugriff verweigert".
 *
 * Tenant scoping is enforced via companyId on the booking lookup
 * and inside getEffectivePartsForSystem.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId, companyId, role } = await requireAuth();
    const rate = await rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rate) return rate;

    const booking = await prisma.booking.findFirst({
      where: { id, companyId },
      include: {
        customer: true,
        system: {
          include: {
            catalog: true,
            assignedTo: { select: { id: true, name: true } },
          },
        },
        assignedTo: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Termin nicht gefunden' },
        { status: 404 },
      );
    }

    if (role === 'TECHNICIAN' && booking.assignedToUserId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Zugriff verweigert' },
        { status: 403 },
      );
    }

    const effectiveParts = booking.systemId
      ? await getEffectivePartsForSystem(booking.systemId, companyId)
      : [];

    return NextResponse.json({
      success: true,
      data: {
        booking: {
          id: booking.id,
          startTime: booking.startTime,
          endTime: booking.endTime,
          title: booking.title,
        },
        customer: booking.customer,
        system: booking.system,
        technician: booking.assignedTo ?? booking.user,
        effectiveParts,
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Nicht autorisiert' },
        { status: 401 },
      );
    }
    console.error('packing-list', e);
    return NextResponse.json(
      { success: false, error: 'Serverfehler' },
      { status: 500 },
    );
  }
}
