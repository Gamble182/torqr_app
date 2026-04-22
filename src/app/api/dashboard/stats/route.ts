import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

/**
 * GET /api/dashboard/stats?days=30
 *
 * OWNER: Company-wide stats — all systems, all maintenances.
 * TECHNICIAN: "Meine Woche" — only systems assigned to self + own maintenances.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, companyId, role } = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const isOwner = role === 'OWNER';

    // Technicians see only their assigned systems; owners see all company systems
    const systemScope: Prisma.CustomerSystemWhereInput = isOwner
      ? { companyId }
      : { companyId, assignedToUserId: userId };

    // Technicians see only their own maintenances; owners see all
    const maintenanceScope: Prisma.MaintenanceWhereInput = isOwner
      ? { companyId }
      : { companyId, userId };

    const [
      totalCustomers,
      totalSystems,
      overdueMaintenances,
      upcomingMaintenances,
      upcomingSystemsList,
      recentMaintenances,
    ] = await Promise.all([
      prisma.customer.count({ where: { companyId } }),

      prisma.customerSystem.count({ where: systemScope }),

      prisma.customerSystem.count({
        where: { ...systemScope, nextMaintenance: { lt: now } },
      }),

      prisma.customerSystem.count({
        where: { ...systemScope, nextMaintenance: { gte: now, lte: futureDate } },
      }),

      prisma.customerSystem.findMany({
        where: { ...systemScope, nextMaintenance: { gte: now, lte: futureDate } },
        include: {
          catalog: true,
          customer: { select: { id: true, name: true, city: true, phone: true } },
          assignedTo: { select: { id: true, name: true } },
        },
        orderBy: { nextMaintenance: 'asc' },
        take: 10,
      }),

      prisma.maintenance.findMany({
        where: maintenanceScope,
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

    // For OWNER only: find systems/bookings assigned to deactivated users
    let unassignedAfterDeactivation: unknown[] = [];
    if (isOwner) {
      unassignedAfterDeactivation = await prisma.customerSystem.findMany({
        where: {
          companyId,
          assignedToUserId: { not: null },
          assignedTo: { isActive: false },
        },
        include: {
          catalog: true,
          customer: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
        },
        orderBy: { nextMaintenance: 'asc' },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        role,
        totalCustomers,
        totalSystems,
        overdueMaintenances,
        upcomingMaintenances,
        upcomingSystemsList,
        recentMaintenances,
        unassignedAfterDeactivation,
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
