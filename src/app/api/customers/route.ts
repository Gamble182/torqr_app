import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Enum values for validation
const HeatingTypeEnum = z.enum([
  'GAS', 'OIL', 'DISTRICT_HEATING', 'HEAT_PUMP_AIR', 'HEAT_PUMP_GROUND',
  'HEAT_PUMP_WATER', 'PELLET_BIOMASS', 'NIGHT_STORAGE', 'ELECTRIC_DIRECT',
  'HYBRID', 'CHP'
]);

const AdditionalEnergySourceEnum = z.enum([
  'PHOTOVOLTAIC', 'SOLAR_THERMAL', 'SMALL_WIND'
]);

const EnergyStorageSystemEnum = z.enum([
  'BATTERY_STORAGE', 'HEAT_STORAGE'
]);

// Validation schema for creating a customer
const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  street: z.string().min(1, 'Street is required').max(100, 'Street too long'),
  zipCode: z.string().min(4, 'ZIP code must be at least 4 characters').max(10, 'ZIP code too long'),
  city: z.string().min(1, 'City is required').max(100, 'City too long'),
  phone: z.string().min(1, 'Phone is required').max(20, 'Phone too long'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  heatingType: HeatingTypeEnum, // REQUIRED
  additionalEnergySources: z.array(AdditionalEnergySourceEnum).optional().default([]),
  energyStorageSystems: z.array(EnergyStorageSystemEnum).optional().default([]),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

/**
 * POST /api/customers
 * Create a new customer
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Parse and validate request body
    const body = await request.json();
    const validatedData = createCustomerSchema.parse(body);

    // 3. Convert empty email string to null
    const email = validatedData.email && validatedData.email.trim() !== ''
      ? validatedData.email
      : null;

    // 4. Create customer in database
    const customer = await prisma.customer.create({
      data: {
        name: validatedData.name,
        street: validatedData.street,
        zipCode: validatedData.zipCode,
        city: validatedData.city,
        phone: validatedData.phone,
        email: email,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        heatingType: validatedData.heatingType as any, // REQUIRED field
        additionalEnergySources: validatedData.additionalEnergySources || [],
        energyStorageSystems: validatedData.energyStorageSystems || [],
        notes: validatedData.notes || null,
        userId: userId,
      },
    });

    // 5. Return created customer
    return NextResponse.json({
      success: true,
      data: customer,
    }, { status: 201 });

  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.issues,
      }, { status: 400 });
    }

    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      }, { status: 401 });
    }

    // Handle other errors
    console.error('Error creating customer:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create customer',
    }, { status: 500 });
  }
}

/**
 * GET /api/customers
 * List all customers for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Get query parameters for search/filter
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // 3. Build where clause for search
    const whereClause = {
      userId: userId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { street: { contains: search, mode: 'insensitive' as const } },
          { city: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search } },
        ],
      }),
    };

    // 4. Fetch customers with their heaters
    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        heaters: {
          select: {
            id: true,
            model: true,
            nextMaintenance: true,
          },
          orderBy: {
            nextMaintenance: 'asc',
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    // 5. Return customers
    return NextResponse.json({
      success: true,
      data: customers,
      count: customers.length,
    });

  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      }, { status: 401 });
    }

    // Handle other errors
    console.error('Error fetching customers:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch customers',
    }, { status: 500 });
  }
}
