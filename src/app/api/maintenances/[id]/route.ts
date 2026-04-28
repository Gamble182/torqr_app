import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { maintenanceUpdateSchema } from '@/lib/validations';
import { deleteMaintenancePhoto } from '@/lib/supabase';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

/**
 * GET /api/maintenances/:id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = await requireAuth();
    const { id } = await params;

    const maintenance = await prisma.maintenance.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        system: {
          include: {
            catalog: true,
            customer: { select: { id: true, name: true, street: true, city: true } },
          },
        },
      },
    });

    if (!maintenance) {
      return NextResponse.json({ success: false, error: 'Wartung nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: maintenance });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error fetching maintenance:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Laden der Wartung' }, { status: 500 });
  }
}

/**
 * PATCH /api/maintenances/:id
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = await requireAuth();
    const { id } = await params;

    const body = await request.json();
    const validated = maintenanceUpdateSchema.parse(body);

    if (!validated.date) {
      return NextResponse.json({ success: false, error: 'Datum ist erforderlich' }, { status: 400 });
    }

    const existingMaintenance = await prisma.maintenance.findFirst({
      where: { id, companyId },
    });

    if (!existingMaintenance) {
      return NextResponse.json({ success: false, error: 'Wartung nicht gefunden' }, { status: 404 });
    }

    const updatedMaintenance = await prisma.maintenance.update({
      where: { id, companyId },
      data: {
        date: new Date(validated.date),
        notes: validated.notes ?? null,
        ...(validated.photos !== undefined && { photos: validated.photos }),
      },
      include: {
        system: {
          include: {
            catalog: true,
            customer: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedMaintenance, message: 'Wartung erfolgreich aktualisiert' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validierungsfehler', details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error updating maintenance:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Aktualisieren der Wartung' }, { status: 500 });
  }
}

/**
 * DELETE /api/maintenances/:id
 *
 * R1 reversal: when a maintenance row is deleted, every related
 * `MAINTENANCE_USE` inventory movement is reversed by inserting an
 * opposite-sign `CORRECTION` movement and incrementing the linked
 * stock back. The original movements are detached (`maintenanceId`
 * set to null) BEFORE the maintenance row is removed so the FK
 * cascade does not delete the historical audit trail.
 *
 * Photo cleanup runs AFTER the transaction commits — if the
 * reversal/delete rolls back, the maintenance row still exists and
 * its photos must remain intact (otherwise we would orphan the row
 * from its files on retry).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, companyId } = await requireOwner();

    const rateLimitResponse = await rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;

    const maintenance = await prisma.maintenance.findFirst({
      where: { id, companyId },
    });

    if (!maintenance) {
      return NextResponse.json({ success: false, error: 'Wartung nicht gefunden' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Defense-in-depth: scope movement queries by companyId even though
      // the maintenance row was already verified to belong to this tenant.
      const movements = await tx.inventoryMovement.findMany({
        where: { maintenanceId: id, companyId, reason: 'MAINTENANCE_USE' },
      });

      for (const m of movements) {
        await tx.inventoryMovement.create({
          data: {
            companyId,
            inventoryItemId: m.inventoryItemId,
            quantityChange: m.quantityChange.neg(),
            reason: 'CORRECTION',
            maintenanceId: null,
            note: 'Rückbuchung: Wartung gelöscht',
            userId,
          },
        });

        await tx.inventoryItem.update({
          where: { id: m.inventoryItemId },
          data: { currentStock: { increment: m.quantityChange.abs() } },
        });
      }

      // Detach the original MAINTENANCE_USE movements so the FK cascade
      // on `Maintenance` deletion does not wipe the historical audit
      // trail. They remain visible with `maintenanceId = null`.
      await tx.inventoryMovement.updateMany({
        where: { maintenanceId: id, companyId, reason: 'MAINTENANCE_USE' },
        data: { maintenanceId: null },
      });

      await tx.maintenance.delete({ where: { id } });
    });

    // Post-commit photo cleanup. Deliberately outside the transaction:
    // Supabase storage is not transactional, and if the DB rollback
    // had wiped photos that the row still references, we would orphan
    // the maintenance row on retry. Per-photo errors are swallowed —
    // an unreachable storage object should not break the API contract.
    for (const photoUrl of maintenance.photos) {
      try {
        await deleteMaintenancePhoto(photoUrl);
      } catch (err) {
        console.error('Error deleting photo from storage:', err);
      }
    }

    return NextResponse.json({ success: true, message: 'Wartung erfolgreich gelöscht' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: 'Nur Inhaber können Wartungen löschen' }, { status: 403 });
    }
    console.error('Error deleting maintenance:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Löschen der Wartung' }, { status: 500 });
  }
}
