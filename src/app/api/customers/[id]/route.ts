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

// Validation schema for updating a customer
const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  street: z.string().min(1, 'Street is required').max(100, 'Street too long').optional(),
  zipCode: z.string().min(4, 'ZIP code must be at least 4 characters').max(10, 'ZIP code too long').optional(),
  city: z.string().min(1, 'City is required').max(100, 'City too long').optional(),
  phone: z.string().min(1, 'Phone is required').max(20, 'Phone too long').optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')).nullable(),
  heatingType: HeatingTypeEnum.optional(),
  additionalEnergySources: z.array(AdditionalEnergySourceEnum).optional(),
  energyStorageSystems: z.array(EnergyStorageSystemEnum).optional(),
  notes: z.string().max(1000, 'Notes too long').optional().nullable(),
});

/**
 * GET /api/customers/:id
 * Get a single customer by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Get customer ID from params
    const { id } = await params;

    // 3. Fetch customer with heaters
    const customer = await prisma.customer.findUnique({
      where: {
        id: id,
        userId: userId, // Ensure user can only access their own customers
      },
      include: {
        heaters: {
          include: {
            maintenances: {
              orderBy: {
                date: 'desc',
              },
              take: 5, // Last 5 maintenances per heater
            },
          },
          orderBy: {
            nextMaintenance: 'asc',
          },
        },
      },
    });

    // 4. Check if customer exists
    if (!customer) {
      return NextResponse.json({
        success: false,
        error: 'Customer not found',
      }, { status: 404 });
    }

    // 5. Return customer
    return NextResponse.json({
      success: true,
      data: customer,
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
    console.error('Error fetching customer:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch customer',
    }, { status: 500 });
  }
}

/**
 * PATCH /api/customers/:id
 * Update a customer
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Get customer ID from params
    const { id } = await params;

    // 3. Check if customer exists and belongs to user
    const existingCustomer = await prisma.customer.findUnique({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json({
        success: false,
        error: 'Customer not found',
      }, { status: 404 });
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validatedData = updateCustomerSchema.parse(body);

    // 5. Convert empty email string to null
    const email = validatedData.email && validatedData.email.trim() !== ''
      ? validatedData.email
      : null;

    // 6. Update customer
    const updatedCustomer = await prisma.customer.update({
      where: {
        id: id,
      },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.street && { street: validatedData.street }),
        ...(validatedData.zipCode && { zipCode: validatedData.zipCode }),
        ...(validatedData.city && { city: validatedData.city }),
        ...(validatedData.phone && { phone: validatedData.phone }),
        ...(email !== undefined && { email: email }),
        ...(validatedData.heatingType && { heatingType: validatedData.heatingType as any }),
        ...(validatedData.additionalEnergySources !== undefined && { additionalEnergySources: validatedData.additionalEnergySources || [] }),
        ...(validatedData.energyStorageSystems !== undefined && { energyStorageSystems: validatedData.energyStorageSystems || [] }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
      },
    });

    // 7. Return updated customer
    return NextResponse.json({
      success: true,
      data: updatedCustomer,
    });

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
    console.error('Error updating customer:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update customer',
    }, { status: 500 });
  }
}

/**
 * DELETE /api/customers/:id
 * Delete a customer (and all related data via cascade)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Get customer ID from params
    const { id } = await params;

    // 3. Check if customer exists and belongs to user
    const existingCustomer = await prisma.customer.findUnique({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json({
        success: false,
        error: 'Customer not found',
      }, { status: 404 });
    }

    // 4. Delete customer (cascade will delete heaters, maintenances, etc.)
    await prisma.customer.delete({
      where: {
        id: id,
      },
    });

    // 5. Return success
    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully',
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
    console.error('Error deleting customer:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete customer',
    }, { status: 500 });
  }
}
