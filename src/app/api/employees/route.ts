import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { employeeCreateSchema } from '@/lib/validations';
import { hashPassword } from '@/lib/password';
import { randomBytes } from 'crypto';

export async function GET() {
  try {
    const { companyId } = await requireOwner();

    const employees = await prisma.user.findMany({
      where: { companyId },
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
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });

    const now = new Date();
    const [totalByUser, overdueByUser] = await Promise.all([
      prisma.customerSystem.groupBy({
        by: ['assignedToUserId'],
        where: { companyId, assignedToUserId: { not: null } },
        _count: { _all: true },
      }),
      prisma.customerSystem.groupBy({
        by: ['assignedToUserId'],
        where: {
          companyId,
          assignedToUserId: { not: null },
          nextMaintenance: { lt: now },
        },
        _count: { _all: true },
      }),
    ]);

    const totalMap = new Map<string, number>(
      totalByUser
        .filter((g) => g.assignedToUserId !== null)
        .map((g) => [g.assignedToUserId as string, g._count._all])
    );
    const overdueMap = new Map<string, number>(
      overdueByUser
        .filter((g) => g.assignedToUserId !== null)
        .map((g) => [g.assignedToUserId as string, g._count._all])
    );

    const withWorkload = employees.map((e) => ({
      ...e,
      workload: {
        assignedSystemsCount: totalMap.get(e.id) ?? 0,
        overdueSystemsCount: overdueMap.get(e.id) ?? 0,
      },
    }));

    return NextResponse.json({ success: true, data: withWorkload });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    if (message === 'Forbidden') {
      return NextResponse.json({ success: false, error: 'Nur Inhaber können Mitarbeiter verwalten' }, { status: 403 });
    }
    console.error('Error fetching employees:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Laden der Mitarbeiter' }, { status: 500 });
  }
}

/**
 * POST /api/employees
 * Create a new technician account (OWNER only).
 * Generates a temporary password that must be changed on first login.
 */
export async function POST(request: NextRequest) {
  try {
    const { companyId } = await requireOwner();

    const body = await request.json();
    const validated = employeeCreateSchema.parse(body);

    // Check if email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
      select: { id: true },
    });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Diese E-Mail-Adresse wird bereits verwendet' },
        { status: 409 }
      );
    }

    // Generate temporary password (12 chars, alphanumeric)
    const tempPassword = randomBytes(9).toString('base64url').slice(0, 12);
    const passwordHash = await hashPassword(tempPassword);

    const employee = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        phone: validated.phone || null,
        passwordHash,
        companyId,
        role: 'TECHNICIAN',
        mustChangePassword: true,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { ...employee, tempPassword },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validierungsfehler', details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    if (message === 'Forbidden') {
      return NextResponse.json({ success: false, error: 'Nur Inhaber können Mitarbeiter anlegen' }, { status: 403 });
    }
    console.error('Error creating employee:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Anlegen des Mitarbeiters' }, { status: 500 });
  }
}
