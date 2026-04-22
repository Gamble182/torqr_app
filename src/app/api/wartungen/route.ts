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
    const { userId, companyId, role } = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all';
    const daysRaw = parseInt(searchParams.get('days') || '30');
    const days = Number.isFinite(daysRaw) && daysRaw > 0 ? daysRaw : 30;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const now = new Date();

    let futureDate: Date;
    if (dateTo) {
      futureDate = new Date(dateTo);
      futureDate.setHours(23, 59, 59, 999);
    } else {
      futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
    }

    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const monthFromNow = new Date();
    monthFromNow.setDate(monthFromNow.getDate() + 30);

    let nextMaintenanceFilter: Prisma.DateTimeNullableFilter<'CustomerSystem'> = { not: null };

    if (dateFrom && dateTo) {
      const customFrom = new Date(dateFrom);
      customFrom.setHours(0, 0, 0, 0);
      nextMaintenanceFilter = { gte: customFrom, lte: futureDate };
    } else if (status === 'overdue') {
      nextMaintenanceFilter = { lt: now };
    } else if (status === 'thisWeek') {
      nextMaintenanceFilter = { gte: now, lte: weekFromNow };
    } else if (status === 'thisMonth') {
      nextMaintenanceFilter = { gte: now, lte: monthFromNow };
    } else if (status === 'upcoming') {
      nextMaintenanceFilter = { gte: now, lte: futureDate };
    } else if (status === 'all') {
      nextMaintenanceFilter = { lte: futureDate };
    }

    const systems = await prisma.customerSystem.findMany({
      where: {
        companyId,
        ...(role === 'TECHNICIAN' && { assignedToUserId: userId }),
        nextMaintenance: nextMaintenanceFilter,
      },
      include: {
        catalog: true,
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
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ nextMaintenance: 'asc' }],
    });

    const stats = {
      total: systems.length,
      overdue: systems.filter(s => s.nextMaintenance && new Date(s.nextMaintenance) < now).length,
      thisWeek: systems.filter(s => {
        if (!s.nextMaintenance) return false;
        const date = new Date(s.nextMaintenance);
        return date >= now && date <= weekFromNow;
      }).length,
      thisMonth: systems.filter(s => {
        if (!s.nextMaintenance) return false;
        const date = new Date(s.nextMaintenance);
        return date >= now && date <= monthFromNow;
      }).length,
    };

    return NextResponse.json({ success: true, data: systems, stats });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error fetching wartungen:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Laden der Wartungen' }, { status: 500 });
  }
}
