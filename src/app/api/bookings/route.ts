import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/bookings?customerId=xxx
 * Returns bookings for the authenticated user, optionally filtered by customer.
 * Ordered: upcoming first, then past (desc).
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    const bookings = await prisma.booking.findMany({
      where: {
        userId,
        ...(customerId ? { customerId } : {}),
      },
      include: {
        customer: { select: { id: true, name: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
