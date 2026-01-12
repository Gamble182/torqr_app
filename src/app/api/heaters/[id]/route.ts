import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating a heater
const updateHeaterSchema = z.object({
  customerId: z.string().uuid('Ungültige Kunden-ID').optional().nullable(),
  model: z.string().min(1, 'Modell ist erforderlich').max(100, 'Modell zu lang').optional(),
  serialNumber: z.string().max(100, 'Seriennummer zu lang').optional().nullable(),
  installationDate: z.string().datetime('Ungültiges Installationsdatum').optional().nullable(),
  maintenanceInterval: z.enum(['1', '3', '6', '12', '24'], {
    message: 'Wartungsintervall muss 1, 3, 6, 12 oder 24 Monate sein'
  }).optional(),
  lastMaintenance: z.string().datetime('Ungültiges Wartungsdatum').optional().nullable(),
  requiredParts: z.string().optional().nullable(),

  // Heating System Information
  heaterType: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),

  // Heat Storage
  hasStorage: z.boolean().optional(),
  storageManufacturer: z.string().optional().nullable(),
  storageModel: z.string().optional().nullable(),
  storageCapacity: z.number().int().positive().optional().nullable(),

  // Battery
  hasBattery: z.boolean().optional(),
  batteryManufacturer: z.string().optional().nullable(),
  batteryModel: z.string().optional().nullable(),
  batteryCapacity: z.number().positive().optional().nullable(),
});

/**
 * GET /api/heaters/:id
 * Get a single heater by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Get heater ID from params
    const { id } = await params;

    // 3. Fetch heater with customer verification
    const heater = await prisma.heater.findFirst({
      where: {
        id: id,
        customer: {
          userId: userId, // Ensure user owns the customer
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            street: true,
            city: true,
          },
        },
        maintenances: {
          orderBy: {
            date: 'desc',
          },
        },
      },
    });

    // 4. Check if heater exists
    if (!heater) {
      return NextResponse.json({
        success: false,
        error: 'Heizung nicht gefunden',
      }, { status: 404 });
    }

    // 5. Return heater
    return NextResponse.json({
      success: true,
      data: heater,
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
    console.error('Error fetching heater:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Laden der Heizung',
    }, { status: 500 });
  }
}

/**
 * PATCH /api/heaters/:id
 * Update a heater
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Get heater ID from params
    const { id } = await params;

    // 3. Check if heater exists and belongs to user
    const existingHeater = await prisma.heater.findFirst({
      where: {
        id: id,
        customer: {
          userId: userId,
        },
      },
    });

    if (!existingHeater) {
      return NextResponse.json({
        success: false,
        error: 'Heizung nicht gefunden',
      }, { status: 404 });
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validatedData = updateHeaterSchema.parse(body);

    // 5. Recalculate next maintenance if interval or lastMaintenance changed
    let nextMaintenance = existingHeater.nextMaintenance;

    if (validatedData.maintenanceInterval || validatedData.lastMaintenance) {
      const interval = validatedData.maintenanceInterval
        ? parseInt(validatedData.maintenanceInterval)
        : existingHeater.maintenanceInterval;

      const lastMaintenance = validatedData.lastMaintenance
        ? new Date(validatedData.lastMaintenance)
        : existingHeater.lastMaintenance || new Date();

      nextMaintenance = new Date(lastMaintenance);
      nextMaintenance.setMonth(nextMaintenance.getMonth() + interval);
    }

    // 6. Update heater
    const updatedHeater = await prisma.heater.update({
      where: {
        id: id,
      },
      data: {
        ...(validatedData.customerId !== undefined && { customerId: validatedData.customerId }),
        ...(validatedData.model && { model: validatedData.model }),
        ...(validatedData.serialNumber !== undefined && { serialNumber: validatedData.serialNumber }),
        ...(validatedData.installationDate !== undefined && {
          installationDate: validatedData.installationDate ? new Date(validatedData.installationDate) : null
        }),
        ...(validatedData.maintenanceInterval && {
          maintenanceInterval: parseInt(validatedData.maintenanceInterval)
        }),
        ...(validatedData.lastMaintenance !== undefined && {
          lastMaintenance: validatedData.lastMaintenance ? new Date(validatedData.lastMaintenance) : null
        }),
        ...(validatedData.requiredParts !== undefined && { requiredParts: validatedData.requiredParts }),

        // Heating System Information
        ...(validatedData.heaterType !== undefined && { heaterType: validatedData.heaterType }),
        ...(validatedData.manufacturer !== undefined && { manufacturer: validatedData.manufacturer }),

        // Heat Storage
        ...(validatedData.hasStorage !== undefined && { hasStorage: validatedData.hasStorage }),
        ...(validatedData.storageManufacturer !== undefined && { storageManufacturer: validatedData.storageManufacturer }),
        ...(validatedData.storageModel !== undefined && { storageModel: validatedData.storageModel }),
        ...(validatedData.storageCapacity !== undefined && { storageCapacity: validatedData.storageCapacity }),

        // Battery
        ...(validatedData.hasBattery !== undefined && { hasBattery: validatedData.hasBattery }),
        ...(validatedData.batteryManufacturer !== undefined && { batteryManufacturer: validatedData.batteryManufacturer }),
        ...(validatedData.batteryModel !== undefined && { batteryModel: validatedData.batteryModel }),
        ...(validatedData.batteryCapacity !== undefined && { batteryCapacity: validatedData.batteryCapacity }),

        nextMaintenance: nextMaintenance,
      },
    });

    // 7. Return updated heater
    return NextResponse.json({
      success: true,
      data: updatedHeater,
    });

  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validierungsfehler',
        details: error.issues,
      }, { status: 400 });
    }

    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({
        success: false,
        error: 'Nicht autorisiert',
      }, { status: 401 });
    }

    // Handle other errors
    console.error('Error updating heater:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Aktualisieren der Heizung',
    }, { status: 500 });
  }
}

/**
 * DELETE /api/heaters/:id
 * Delete a heater (and all related maintenances via cascade)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Get heater ID from params
    const { id } = await params;

    // 3. Check if heater exists and belongs to user
    const existingHeater = await prisma.heater.findFirst({
      where: {
        id: id,
        customer: {
          userId: userId,
        },
      },
    });

    if (!existingHeater) {
      return NextResponse.json({
        success: false,
        error: 'Heizung nicht gefunden',
      }, { status: 404 });
    }

    // 4. Delete heater (cascade will delete maintenances and photos)
    await prisma.heater.delete({
      where: {
        id: id,
      },
    });

    // 5. Return success
    return NextResponse.json({
      success: true,
      message: 'Heizung erfolgreich gelöscht',
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
    console.error('Error deleting heater:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Löschen der Heizung',
    }, { status: 500 });
  }
}
