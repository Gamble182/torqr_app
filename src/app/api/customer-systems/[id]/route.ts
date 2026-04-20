import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { customerSystemUpdateSchema } from '@/lib/validations';

/**
 * GET /api/customer-systems/:id
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const system = await prisma.customerSystem.findFirst({
      where: { id, userId },
      include: {
        catalog: true,
        customer: { select: { id: true, name: true, street: true, city: true } },
        maintenances: { orderBy: { date: 'desc' } },
      },
    });

    if (!system) {
      return NextResponse.json({ success: false, error: 'System nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: system });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error fetching system:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Laden des Systems' }, { status: 500 });
  }
}

/**
 * PATCH /api/customer-systems/:id
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const existing = await prisma.customerSystem.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'System nicht gefunden' }, { status: 404 });
    }

    const body = await request.json();
    const validated = customerSystemUpdateSchema.parse(body);

    let nextMaintenance = existing.nextMaintenance;
    if (validated.maintenanceInterval || validated.lastMaintenance) {
      const interval = validated.maintenanceInterval ?? existing.maintenanceInterval;
      const lastMaintenance = validated.lastMaintenance
        ? new Date(validated.lastMaintenance)
        : existing.lastMaintenance ?? new Date();
      nextMaintenance = new Date(lastMaintenance);
      nextMaintenance.setMonth(nextMaintenance.getMonth() + interval);
    }

    const updated = await prisma.customerSystem.update({
      where: { id },
      data: {
        ...(validated.catalogId !== undefined && { catalogId: validated.catalogId }),
        ...(validated.customerId !== undefined && { customerId: validated.customerId }),
        ...(validated.serialNumber !== undefined && { serialNumber: validated.serialNumber }),
        ...(validated.installationDate !== undefined && {
          installationDate: validated.installationDate ? new Date(validated.installationDate) : null,
        }),
        ...(validated.maintenanceInterval !== undefined && { maintenanceInterval: validated.maintenanceInterval }),
        ...(validated.lastMaintenance !== undefined && {
          lastMaintenance: validated.lastMaintenance ? new Date(validated.lastMaintenance) : null,
        }),
        ...(validated.storageCapacityLiters !== undefined && { storageCapacityLiters: validated.storageCapacityLiters }),
        ...(validated.requiredParts !== undefined && { requiredParts: validated.requiredParts }),
        nextMaintenance,
      },
      include: { catalog: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validierungsfehler', details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error updating system:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Aktualisieren des Systems' }, { status: 500 });
  }
}

/**
 * DELETE /api/customer-systems/:id
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const existing = await prisma.customerSystem.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'System nicht gefunden' }, { status: 404 });
    }

    await prisma.customerSystem.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'System erfolgreich gelöscht' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error deleting system:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Löschen des Systems' }, { status: 500 });
  }
}
