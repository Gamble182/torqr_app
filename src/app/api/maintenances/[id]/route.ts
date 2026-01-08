import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { deleteMaintenancePhoto } from '@/lib/supabase';

/**
 * GET /api/maintenances/:id
 * Get a single maintenance record
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Get maintenance ID from params
    const { id } = await params;

    // 3. Fetch maintenance with ownership verification
    const maintenance = await prisma.maintenance.findFirst({
      where: {
        id: id,
        heater: {
          customer: {
            userId: userId,
          },
        },
      },
      include: {
        heater: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                street: true,
                city: true,
              },
            },
          },
        },
      },
    });

    // 4. Check if maintenance exists
    if (!maintenance) {
      return NextResponse.json({
        success: false,
        error: 'Wartung nicht gefunden',
      }, { status: 404 });
    }

    // 5. Return maintenance
    return NextResponse.json({
      success: true,
      data: maintenance,
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
    console.error('Error fetching maintenance:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Laden der Wartung',
    }, { status: 500 });
  }
}

/**
 * DELETE /api/maintenances/:id
 * Delete a maintenance record and its photos
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Get maintenance ID from params
    const { id } = await params;

    // 3. Fetch maintenance with ownership verification
    const maintenance = await prisma.maintenance.findFirst({
      where: {
        id: id,
        heater: {
          customer: {
            userId: userId,
          },
        },
      },
    });

    if (!maintenance) {
      return NextResponse.json({
        success: false,
        error: 'Wartung nicht gefunden',
      }, { status: 404 });
    }

    // 4. Delete photos from Supabase Storage
    for (const photoUrl of maintenance.photos) {
      try {
        await deleteMaintenancePhoto(photoUrl);
      } catch (err) {
        console.error('Error deleting photo from storage:', err);
        // Continue deletion even if photo deletion fails
      }
    }

    // 5. Delete maintenance record
    await prisma.maintenance.delete({
      where: {
        id: id,
      },
    });

    // 6. Return success
    return NextResponse.json({
      success: true,
      message: 'Wartung erfolgreich gelöscht',
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
    console.error('Error deleting maintenance:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Löschen der Wartung',
    }, { status: 500 });
  }
}
