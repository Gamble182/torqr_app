import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for creating a maintenance record
const createMaintenanceSchema = z.object({
  heaterId: z.string().uuid('Ungültige Heizungs-ID'),
  date: z.string().datetime('Ungültiges Datum'),
  notes: z.string().max(1000, 'Notizen zu lang').optional().nullable(),
  photos: z.array(z.string().url('Ungültige Foto-URL')).optional(),
});

/**
 * POST /api/maintenances
 * Create a new maintenance record and update heater dates
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Parse and validate request body
    const body = await request.json();
    const validatedData = createMaintenanceSchema.parse(body);

    // 3. Verify heater belongs to user
    const heater = await prisma.heater.findFirst({
      where: {
        id: validatedData.heaterId,
        customer: {
          userId: userId,
        },
      },
    });

    if (!heater) {
      return NextResponse.json({
        success: false,
        error: 'Heizung nicht gefunden',
      }, { status: 404 });
    }

    // 4. Calculate next maintenance date
    const maintenanceDate = new Date(validatedData.date);
    const nextMaintenance = new Date(maintenanceDate);
    nextMaintenance.setMonth(nextMaintenance.getMonth() + heater.maintenanceInterval);

    // 5. Create maintenance record and update heater in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create maintenance record with photos
      const maintenance = await tx.maintenance.create({
        data: {
          heaterId: validatedData.heaterId,
          userId: userId,
          date: maintenanceDate,
          notes: validatedData.notes || null,
          photos: validatedData.photos || [],
        },
        include: {
          heater: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Update heater dates
      await tx.heater.update({
        where: {
          id: validatedData.heaterId,
        },
        data: {
          lastMaintenance: maintenanceDate,
          nextMaintenance: nextMaintenance,
        },
      });

      return maintenance;
    });

    // 6. Return created maintenance
    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 });

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
    console.error('Error creating maintenance:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Erstellen der Wartung',
    }, { status: 500 });
  }
}

/**
 * GET /api/maintenances?heaterId=xxx
 * Get all maintenance records for a heater
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Get heater ID from query params
    const searchParams = request.nextUrl.searchParams;
    const heaterId = searchParams.get('heaterId');

    if (!heaterId) {
      return NextResponse.json({
        success: false,
        error: 'Heizungs-ID fehlt',
      }, { status: 400 });
    }

    // 3. Verify heater belongs to user
    const heater = await prisma.heater.findFirst({
      where: {
        id: heaterId,
        customer: {
          userId: userId,
        },
      },
    });

    if (!heater) {
      return NextResponse.json({
        success: false,
        error: 'Heizung nicht gefunden',
      }, { status: 404 });
    }

    // 4. Fetch maintenances
    const maintenances = await prisma.maintenance.findMany({
      where: {
        heaterId: heaterId,
      },
      orderBy: {
        date: 'desc', // Most recent first
      },
    });

    // 5. Return maintenances
    return NextResponse.json({
      success: true,
      data: maintenances,
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
    console.error('Error fetching maintenances:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Laden der Wartungen',
    }, { status: 500 });
  }
}
