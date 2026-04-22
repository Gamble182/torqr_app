import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/employees/[id]
 * Deactivate or reactivate a technician (OWNER only).
 * Body: { isActive: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, companyId } = await requireOwner();
    const { id: employeeId } = await params;

    // Cannot deactivate yourself
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

    // Cannot deactivate another OWNER
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

    const updated = await prisma.user.update({
      where: { id: employeeId },
      data: {
        isActive,
        deactivatedAt: isActive ? null : new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        deactivatedAt: true,
        createdAt: true,
      },
    });

    // If deactivating, invalidate all sessions
    if (!isActive) {
      await prisma.session.deleteMany({ where: { userId: employeeId } });
    }

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
