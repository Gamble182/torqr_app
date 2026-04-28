import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwner } from '@/lib/auth-helpers';
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
    const { companyId } = await requireAuth();
    const { id } = await params;

    const now = new Date();
    const system = await prisma.customerSystem.findFirst({
      where: { id, companyId },
      include: {
        catalog: true,
        customer: { select: { id: true, name: true, street: true, city: true } },
        assignedTo: { select: { id: true, name: true } },
        maintenances: { orderBy: { date: 'desc' } },
        bookings: {
          where: { startTime: { gte: now }, status: 'CONFIRMED' },
          orderBy: { startTime: 'asc' },
          take: 1,
          select: { id: true, startTime: true, endTime: true, calBookingUid: true },
        },
        partOverrides: { orderBy: { sortOrder: 'asc' } },
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
    const { companyId, role } = await requireAuth();
    const { id } = await params;

    const existing = await prisma.customerSystem.findFirst({ where: { id, companyId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'System nicht gefunden' }, { status: 404 });
    }

    const body = await request.json();
    const validated = customerSystemUpdateSchema.parse(body);

    // Validate new customerId belongs to same company
    if (validated.customerId !== undefined && validated.customerId !== existing.customerId) {
      const newCustomer = await prisma.customer.findFirst({
        where: { id: validated.customerId, companyId },
        select: { id: true },
      });
      if (!newCustomer) {
        return NextResponse.json(
          { success: false, error: 'Kunde nicht gefunden' },
          { status: 400 }
        );
      }
    }

    // Only OWNER can assign technicians
    if (validated.assignedToUserId !== undefined && role !== 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Nur Inhaber können Techniker zuweisen' },
        { status: 403 }
      );
    }

    // Validate assigned user belongs to same company and is active
    if (validated.assignedToUserId) {
      const assignee = await prisma.user.findFirst({
        where: { id: validated.assignedToUserId, companyId, isActive: true },
        select: { id: true },
      });
      if (!assignee) {
        return NextResponse.json(
          { success: false, error: 'Mitarbeiter nicht gefunden oder nicht aktiv' },
          { status: 400 }
        );
      }
    }

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
      where: { id, companyId },
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
        ...(validated.assignedToUserId !== undefined && {
          assignedToUserId: validated.assignedToUserId,
        }),
        nextMaintenance,
      },
      include: {
        catalog: true,
        assignedTo: { select: { id: true, name: true } },
      },
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
    const { companyId } = await requireOwner();
    const { id } = await params;

    const existing = await prisma.customerSystem.findFirst({ where: { id, companyId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'System nicht gefunden' }, { status: 404 });
    }

    await prisma.customerSystem.delete({ where: { id, companyId } });

    return NextResponse.json({ success: true, message: 'System erfolgreich gelöscht' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: 'Nur Inhaber können Systeme löschen' }, { status: 403 });
    }
    console.error('Error deleting system:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Löschen des Systems' }, { status: 500 });
  }
}
