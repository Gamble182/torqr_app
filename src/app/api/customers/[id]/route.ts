import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { customerUpdateSchema } from '@/lib/validations';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { computeOptInData } from '@/lib/email/opt-in';

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

    // 2. Rate limiting
    const rateLimitResponse = rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 3. Get customer ID from params
    const { id } = await params;

    // 4. Check if customer exists and belongs to user
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
    const validatedData = customerUpdateSchema.parse(body);

    // 5. Compute opt-in — preserve UNSUBSCRIBED unless email changes
    const email = validatedData.email?.trim() || null;
    const emailChanged = email !== null && email !== existingCustomer.email;
    const preserveUnsubscribed =
      existingCustomer.emailOptIn === 'UNSUBSCRIBED' && !emailChanged;

    const optInData = preserveUnsubscribed
      ? { emailOptIn: 'UNSUBSCRIBED' as const, optInConfirmedAt: existingCustomer.optInConfirmedAt }
      : computeOptInData(email, validatedData.suppressEmail ?? false);

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
        email,
        emailOptIn: optInData.emailOptIn,
        optInConfirmedAt: optInData.optInConfirmedAt,
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
