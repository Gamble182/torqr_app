import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for creating a heater
const createHeaterSchema = z.object({
  customerId: z.string().uuid('Ungültige Kunden-ID').optional().nullable(),
  model: z.string().min(1, 'Modell ist erforderlich').max(100, 'Modell zu lang'),
  serialNumber: z.string().max(100, 'Seriennummer zu lang').optional().nullable(),
  installationDate: z.string().datetime('Ungültiges Installationsdatum').optional().nullable(),
  maintenanceInterval: z.enum(['1', '3', '6', '12', '24'], {
    message: 'Wartungsintervall muss 1, 3, 6, 12 oder 24 Monate sein'
  }),
  lastMaintenance: z.string().datetime('Ungültiges Wartungsdatum').optional().nullable(),

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

  requiredParts: z.string().optional().nullable(),
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

    // 3. Verify customer belongs to user (if customerId provided)
    if (validatedData.customerId) {
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
        userId: userId, // Owner of the heater
        customerId: validatedData.customerId || null,
        model: validatedData.model,
        serialNumber: validatedData.serialNumber || null,
        installationDate: validatedData.installationDate ? new Date(validatedData.installationDate) : null,
        maintenanceInterval: interval,
        lastMaintenance: lastMaintenance,
        nextMaintenance: nextMaintenance,
        requiredParts: validatedData.requiredParts || null,

        // Heating System Information
        heaterType: validatedData.heaterType || null,
        manufacturer: validatedData.manufacturer || null,

        // Heat Storage
        hasStorage: validatedData.hasStorage || false,
        storageManufacturer: validatedData.storageManufacturer || null,
        storageModel: validatedData.storageModel || null,
        storageCapacity: validatedData.storageCapacity || null,

        // Battery
        hasBattery: validatedData.hasBattery || false,
        batteryManufacturer: validatedData.batteryManufacturer || null,
        batteryModel: validatedData.batteryModel || null,
        batteryCapacity: validatedData.batteryCapacity || null,
      },
      include: {
        customer: validatedData.customerId ? {
          select: {
            id: true,
            name: true,
          },
        } : false,
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
 * GET /api/heaters?customerId=xxx&search=xxx
 * Get heaters - optionally filtered by customer or search query
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Get query params
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const search = searchParams.get('search') || '';

    // 3. Build where clause
    let where: any = {
      userId: userId, // Filter by heater owner
    };

    // If customerId provided, filter by that customer
    if (customerId) {
      // Verify customer belongs to user
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

      where.customerId = customerId;
    }

    // Add search filter if provided
    if (search) {
      where.OR = [
        { model: { contains: search, mode: 'insensitive' as const } },
        { serialNumber: { contains: search, mode: 'insensitive' as const } },
        {
          customer: {
            is: {
              name: { contains: search, mode: 'insensitive' as const }
            }
          }
        },
        {
          customer: {
            is: {
              city: { contains: search, mode: 'insensitive' as const }
            }
          }
        },
      ];
    }

    // 4. Fetch heaters
    const heaters = await prisma.heater.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            street: true,
            city: true,
            phone: true,
          },
        },
        _count: {
          select: {
            maintenances: true,
          },
        },
        maintenances: customerId ? {
          orderBy: {
            date: 'desc',
          },
          take: 5, // Last 5 maintenances (only when viewing single customer)
        } : false,
      },
      orderBy: [
        { nextMaintenance: 'asc' }, // Soonest maintenance first
        { customer: { name: 'asc' } },
      ],
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
