import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for the authenticated user
 */
export async function GET() {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Calculate all statistics in parallel
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [
      totalCustomers,
      totalHeaters,
      overdueMaintenances,
      upcomingMaintenances,
    ] = await Promise.all([
      // Total customers count
      prisma.customer.count({
        where: {
          userId: userId,
        },
      }),

      // Total heaters count
      prisma.heater.count({
        where: {
          customer: {
            userId: userId,
          },
        },
      }),

      // Overdue maintenances (nextMaintenance < now)
      prisma.heater.count({
        where: {
          customer: {
            userId: userId,
          },
          nextMaintenance: {
            lt: now,
          },
        },
      }),

      // Upcoming maintenances (nextMaintenance between now and 30 days)
      prisma.heater.count({
        where: {
          customer: {
            userId: userId,
          },
          nextMaintenance: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
        },
      }),
    ]);

    // 3. Return statistics
    return NextResponse.json({
      success: true,
      data: {
        totalCustomers,
        totalHeaters,
        overdueMaintenances,
        upcomingMaintenances,
      },
    });

  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({
        success: false,
        error: 'Nicht autorisiert',
      }, { status: 401 });
    }

    // Handle other errors
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Laden der Statistiken',
    }, { status: 500 });
  }
}
