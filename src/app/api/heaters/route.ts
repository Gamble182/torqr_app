import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { heaterCreateSchema } from '@/lib/validations';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

/**
 * POST /api/heaters
 * Create a new heater for a customer
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Rate limiting
    const rateLimitResponse = rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const validatedData = heaterCreateSchema.parse(body);

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
      error: 'Fehler beim Erstellen des Heizsystems',
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
    const where: Prisma.HeaterWhereInput = {
      userId: userId, // Filter by heater owner
      ...(customerId && { customerId }), // Add customerId if provided
      ...(search && {
        OR: [
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
        ],
      }),
    };

    // If customerId provided, verify customer belongs to user
    if (customerId) {
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
      error: 'Fehler beim Laden der Heizsysteme',
    }, { status: 500 });
  }
}
