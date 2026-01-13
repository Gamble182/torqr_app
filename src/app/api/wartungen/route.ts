import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * GET /api/wartungen?status=overdue&days=30
 * Get all scheduled maintenances with filtering
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Get query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all'; // overdue, upcoming, thisWeek, thisMonth, all
    const days = parseInt(searchParams.get('days') || '30'); // time range in days
    const dateFrom = searchParams.get('dateFrom'); // custom date range start
    const dateTo = searchParams.get('dateTo'); // custom date range end

    // 3. Calculate date ranges
    const now = new Date();

    // Use custom date range if provided, otherwise use days
    let futureDate: Date;
    if (dateTo) {
      futureDate = new Date(dateTo);
      futureDate.setHours(23, 59, 59, 999); // End of day
    } else {
      futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
    }

    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const monthFromNow = new Date();
    monthFromNow.setDate(monthFromNow.getDate() + 30);

    // 4. Build where clause based on status
    let nextMaintenanceFilter: Prisma.DateTimeNullableFilter<"Heater"> = { not: null };

    // Handle custom date range if provided
    if (dateFrom && dateTo) {
      const customFrom = new Date(dateFrom);
      customFrom.setHours(0, 0, 0, 0); // Start of day
      nextMaintenanceFilter = {
        gte: customFrom,
        lte: futureDate,
      };
    } else if (status === 'overdue') {
      nextMaintenanceFilter = {
        lt: now,
      };
    } else if (status === 'thisWeek') {
      nextMaintenanceFilter = {
        gte: now,
        lte: weekFromNow,
      };
    } else if (status === 'thisMonth') {
      nextMaintenanceFilter = {
        gte: now,
        lte: monthFromNow,
      };
    } else if (status === 'upcoming') {
      nextMaintenanceFilter = {
        gte: now,
        lte: futureDate,
      };
    } else if (status === 'all') {
      nextMaintenanceFilter = {
        lte: futureDate,
      };
    }

    const where: Prisma.HeaterWhereInput = {
      customer: {
        userId: userId,
      },
      nextMaintenance: nextMaintenanceFilter,
    };

    // 5. Fetch heaters with upcoming/overdue maintenances
    const heaters = await prisma.heater.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            street: true,
            city: true,
            phone: true,
            email: true,
          },
        },
        maintenances: {
          orderBy: {
            date: 'desc',
          },
          take: 1, // Last maintenance
        },
      },
      orderBy: [
        { nextMaintenance: 'asc' }, // Most urgent first
      ],
    });

    // 6. Calculate statistics
    const stats = {
      total: heaters.length,
      overdue: heaters.filter(h => h.nextMaintenance && new Date(h.nextMaintenance) < now).length,
      thisWeek: heaters.filter(h => {
        if (!h.nextMaintenance) return false;
        const date = new Date(h.nextMaintenance);
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return date >= now && date <= weekFromNow;
      }).length,
      thisMonth: heaters.filter(h => {
        if (!h.nextMaintenance) return false;
        const date = new Date(h.nextMaintenance);
        const monthFromNow = new Date();
        monthFromNow.setDate(monthFromNow.getDate() + 30);
        return date >= now && date <= monthFromNow;
      }).length,
    };

    // 7. Return data
    return NextResponse.json({
      success: true,
      data: heaters,
      stats,
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
    console.error('Error fetching wartungen:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Laden der Wartungen',
    }, { status: 500 });
  }
}
