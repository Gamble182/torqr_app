import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/dashboard/stats?days=30
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const [
      totalCustomers,
      totalSystems,
      overdueMaintenances,
      upcomingMaintenances,
      upcomingSystemsList,
      recentMaintenances,
    ] = await Promise.all([
      prisma.customer.count({ where: { userId } }),

      prisma.customerSystem.count({ where: { userId } }),

      prisma.customerSystem.count({
        where: { userId, nextMaintenance: { lt: now } },
      }),

      prisma.customerSystem.count({
        where: { userId, nextMaintenance: { gte: now, lte: futureDate } },
      }),

      prisma.customerSystem.findMany({
        where: { userId, nextMaintenance: { gte: now, lte: futureDate } },
        include: {
          catalog: true,
          customer: { select: { id: true, name: true, city: true, phone: true } },
        },
        orderBy: { nextMaintenance: 'asc' },
        take: 10,
      }),

      prisma.maintenance.findMany({
        where: { user: { id: userId } },
        include: {
          system: {
            include: {
              catalog: true,
              customer: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { date: 'desc' },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalCustomers,
        totalSystems,
        overdueMaintenances,
        upcomingMaintenances,
        upcomingSystemsList,
        recentMaintenances,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Laden der Statistiken' }, { status: 500 });
  }
}
