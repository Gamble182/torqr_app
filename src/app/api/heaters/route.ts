import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for creating a heater
const createHeaterSchema = z.object({
  customerId: z.string().uuid('Ungültige Kunden-ID'),
  model: z.string().min(1, 'Modell ist erforderlich').max(100, 'Modell zu lang'),
  serialNumber: z.string().max(100, 'Seriennummer zu lang').optional().nullable(),
  installationDate: z.string().datetime('Ungültiges Installationsdatum').optional().nullable(),
  maintenanceInterval: z.enum(['1', '3', '6', '12', '24'], {
    message: 'Wartungsintervall muss 1, 3, 6, 12 oder 24 Monate sein'
  }),
  lastMaintenance: z.string().datetime('Ungültiges Wartungsdatum').optional().nullable(),
});

/**
 * POST /api/heaters
 * Create a new heater for a customer
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Parse and validate request body
    const body = await request.json();
    const validatedData = createHeaterSchema.parse(body);

    // 3. Verify customer belongs to user
    const customer = await prisma.customer.findUnique({
      where: {
        id: validatedData.customerId,
        userId: userId,
      },
    });

    if (!customer) {
      return NextResponse.json({
        success: false,
        error: 'Kunde nicht gefunden',
      }, { status: 404 });
    }

    // 4. Calculate next maintenance date
    const lastMaintenance = validatedData.lastMaintenance
      ? new Date(validatedData.lastMaintenance)
      : new Date();

    const interval = parseInt(validatedData.maintenanceInterval);
    const nextMaintenance = new Date(lastMaintenance);
    nextMaintenance.setMonth(nextMaintenance.getMonth() + interval);

    // 5. Create heater
    const heater = await prisma.heater.create({
      data: {
        customerId: validatedData.customerId,
        model: validatedData.model,
        serialNumber: validatedData.serialNumber || null,
        installationDate: validatedData.installationDate ? new Date(validatedData.installationDate) : null,
        maintenanceInterval: interval,
        lastMaintenance: lastMaintenance,
        nextMaintenance: nextMaintenance,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 6. Return created heater
    return NextResponse.json({
      success: true,
      data: heater,
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
    console.error('Error creating heater:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Erstellen der Heizung',
    }, { status: 500 });
  }
}

/**
 * GET /api/heaters?customerId=xxx
 * Get all heaters for a customer
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Get customer ID from query params
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({
        success: false,
        error: 'Kunden-ID fehlt',
      }, { status: 400 });
    }

    // 3. Verify customer belongs to user
    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
        userId: userId,
      },
    });

    if (!customer) {
      return NextResponse.json({
        success: false,
        error: 'Kunde nicht gefunden',
      }, { status: 404 });
    }

    // 4. Fetch heaters
    const heaters = await prisma.heater.findMany({
      where: {
        customerId: customerId,
      },
      include: {
        maintenances: {
          orderBy: {
            date: 'desc',
          },
          take: 5, // Last 5 maintenances
        },
      },
      orderBy: {
        nextMaintenance: 'asc', // Soonest first
      },
    });

    // 5. Return heaters
    return NextResponse.json({
      success: true,
      data: heaters,
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
    console.error('Error fetching heaters:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Laden der Heizungen',
    }, { status: 500 });
  }
}
