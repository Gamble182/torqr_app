import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { customerCreateSchema } from '@/lib/validations';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { computeOptInData } from '@/lib/email/opt-in';

/**
 * POST /api/customers
 * Create a new customer
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
    const validatedData = customerCreateSchema.parse(body);

    // 3. Convert empty email string to null and compute opt-in status
    const email = validatedData.email?.trim() || null;
    const optInData = computeOptInData(email, validatedData.suppressEmail ?? false);

    // 4. Create customer in database
    const customer = await prisma.customer.create({
      data: {
        name: validatedData.name,
        street: validatedData.street,
        zipCode: validatedData.zipCode,
        city: validatedData.city,
        phone: validatedData.phone,
        email,
        emailOptIn: optInData.emailOptIn,
        optInConfirmedAt: optInData.optInConfirmedAt,
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
