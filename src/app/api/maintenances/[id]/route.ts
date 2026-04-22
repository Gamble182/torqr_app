import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { deleteMaintenancePhoto } from '@/lib/supabase';

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
    const { date, notes } = body;

    if (!date) {
      return NextResponse.json({ success: false, error: 'Datum ist erforderlich' }, { status: 400 });
    }

    const existingMaintenance = await prisma.maintenance.findFirst({
      where: { id, companyId },
    });

    if (!existingMaintenance) {
      return NextResponse.json({ success: false, error: 'Wartung nicht gefunden' }, { status: 404 });
    }

    const updatedMaintenance = await prisma.maintenance.update({
      where: { id },
      data: {
        date: new Date(date),
        notes: notes || null,
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
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error updating maintenance:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Aktualisieren der Wartung' }, { status: 500 });
  }
}

/**
 * DELETE /api/maintenances/:id
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = await requireAuth();
    const { id } = await params;

    const maintenance = await prisma.maintenance.findFirst({
      where: { id, companyId },
    });

    if (!maintenance) {
      return NextResponse.json({ success: false, error: 'Wartung nicht gefunden' }, { status: 404 });
    }

    for (const photoUrl of maintenance.photos) {
      try {
        await deleteMaintenancePhoto(photoUrl);
      } catch (err) {
        console.error('Error deleting photo from storage:', err);
      }
    }

    await prisma.maintenance.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Wartung erfolgreich gelöscht' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error deleting maintenance:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Löschen der Wartung' }, { status: 500 });
  }
}
