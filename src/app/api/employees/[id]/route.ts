// src/app/api/employees/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

type SystemStatus = 'overdue' | 'due-soon' | 'ok' | 'scheduled';

function deriveStatus(nextMaintenance: Date | null, hasUpcomingBooking: boolean, now: Date): SystemStatus {
  if (hasUpcomingBooking) return 'scheduled';
  if (!nextMaintenance) return 'ok';
  const diffMs = nextMaintenance.getTime() - now.getTime();
  if (diffMs < 0) return 'overdue';
  if (diffMs <= 30 * 86400000) return 'due-soon';
  return 'ok';
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = await requireOwner();
    const { id: employeeId } = await params;

    const employee = await prisma.user.findFirst({
      where: { id: employeeId, companyId },
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        isActive: true, deactivatedAt: true, createdAt: true,
      },
    });
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Mitarbeiter nicht gefunden' }, { status: 404 });
    }

    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 86400000);
    const last30 = new Date(now.getTime() - 30 * 86400000);

    const [
      assignedSystemsCount,
      assignedSystems,
      overdueSystemsCount,
      dueSoonSystemsCount,
      maintenancesLast30Days,
      recentActivity,
    ] = await Promise.all([
      prisma.customerSystem.count({
        where: { companyId, assignedToUserId: employeeId },
      }),
      prisma.customerSystem.findMany({
        where: { companyId, assignedToUserId: employeeId },
        include: {
          catalog: { select: { systemType: true, manufacturer: true, name: true } },
          customer: { select: { id: true, name: true, city: true } },
          bookings: {
            where: { startTime: { gte: now }, status: 'CONFIRMED' },
            orderBy: { startTime: 'asc' },
            take: 1,
            select: { startTime: true },
          },
        },
        orderBy: [{ customer: { name: 'asc' } }, { nextMaintenance: 'asc' }],
      }),
      prisma.customerSystem.count({
        where: { companyId, assignedToUserId: employeeId, nextMaintenance: { lt: now } },
      }),
      prisma.customerSystem.count({
        where: {
          companyId,
          assignedToUserId: employeeId,
          nextMaintenance: { gte: now, lte: in30 },
        },
      }),
      prisma.maintenance.count({
        where: { companyId, userId: employeeId, date: { gte: last30 } },
      }),
      prisma.maintenance.findMany({
        where: { companyId, userId: employeeId },
        include: {
          system: {
            select: {
              id: true,
              catalog: { select: { manufacturer: true, name: true } },
              customer: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { date: 'desc' },
        take: 10,
      }),
    ]);

    // Group systems by customer
    const groupMap = new Map<string, {
      customer: { id: string; name: string; city: string };
      systems: Array<{
        id: string;
        label: string;
        systemType: string;
        nextMaintenance: string | null;
        status: SystemStatus;
        bookedAt: string | null;
      }>;
    }>();

    for (const s of assignedSystems) {
      const key = s.customer.id;
      if (!groupMap.has(key)) {
        groupMap.set(key, { customer: s.customer, systems: [] });
      }
      const bookedAt = s.bookings[0]?.startTime ?? null;
      groupMap.get(key)!.systems.push({
        id: s.id,
        label: `${s.catalog.manufacturer} ${s.catalog.name}`,
        systemType: s.catalog.systemType,
        nextMaintenance: s.nextMaintenance ? s.nextMaintenance.toISOString() : null,
        status: deriveStatus(s.nextMaintenance, !!bookedAt, now),
        bookedAt: bookedAt ? bookedAt.toISOString() : null,
      });
    }

    const assignedSystemsGrouped = Array.from(groupMap.values());
    const assignedCustomersCount = assignedSystemsGrouped.length;

    const detail = {
      ...employee,
      stats: {
        assignedSystemsCount,
        assignedCustomersCount,
        overdueSystemsCount,
        dueSoonSystemsCount,
        maintenancesLast30Days,
      },
      assignedSystems: assignedSystemsGrouped,
      recentActivity: recentActivity.map((m) => ({
        id: m.id,
        date: m.date.toISOString(),
        customer: m.system.customer,
        system: {
          id: m.system.id,
          label: `${m.system.catalog.manufacturer} ${m.system.catalog.name}`,
        },
      })),
    };

    return NextResponse.json({ success: true, data: detail });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    if (message === 'Forbidden') {
      return NextResponse.json({ success: false, error: 'Nur Inhaber können Mitarbeiter verwalten' }, { status: 403 });
    }
    console.error('Error fetching employee detail:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Laden des Mitarbeiters' }, { status: 500 });
  }
}

/**
 * PATCH /api/employees/[id]
 * Deactivate or reactivate a technician (OWNER only).
 * On deactivation: transactionally reassigns all assigned systems to the OWNER.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, companyId } = await requireOwner();
    const { id: employeeId } = await params;

    if (employeeId === userId) {
      return NextResponse.json(
        { success: false, error: 'Sie können sich nicht selbst deaktivieren' },
        { status: 400 }
      );
    }

    const employee = await prisma.user.findFirst({
      where: { id: employeeId, companyId },
      select: { id: true, role: true, isActive: true },
    });
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Mitarbeiter nicht gefunden' }, { status: 404 });
    }
    if (employee.role === 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Inhaber können nicht deaktiviert werden' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { isActive } = body as { isActive?: boolean };

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isActive muss ein Boolean sein' },
        { status: 400 }
      );
    }

    // Deactivation path: atomic update + reassign + session invalidation
    if (isActive === false) {
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
          where: { id: employeeId },
          data: { isActive: false, deactivatedAt: new Date() },
          select: {
            id: true, name: true, email: true, phone: true, role: true,
            isActive: true, deactivatedAt: true, createdAt: true,
          },
        });
        const reassign = await tx.customerSystem.updateMany({
          where: { companyId, assignedToUserId: employeeId },
          data: { assignedToUserId: userId },
        });
        await tx.session.deleteMany({ where: { userId: employeeId } });
        return { updated, reassignedCount: reassign.count };
      });

      return NextResponse.json({
        success: true,
        data: { ...result.updated, reassignedCount: result.reassignedCount },
      });
    }

    // Reactivation path: simple update
    const updated = await prisma.user.update({
      where: { id: employeeId },
      data: { isActive: true, deactivatedAt: null },
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        isActive: true, deactivatedAt: true, createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    if (message === 'Forbidden') {
      return NextResponse.json({ success: false, error: 'Nur Inhaber können Mitarbeiter verwalten' }, { status: 403 });
    }
    console.error('Error updating employee:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Aktualisieren des Mitarbeiters' }, { status: 500 });
  }
}
