import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwner } from '@/lib/auth-helpers';
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
    const { companyId } = await requireAuth();

    // 2. Get customer ID from params
    const { id } = await params;

    // 3. Fetch customer
    const customer = await prisma.customer.findUnique({
      where: {
        id: id,
        companyId,
      },
    });

    // 4. Check if customer exists
    if (!customer) {
      return NextResponse.json({
        success: false,
        error: 'Kunde nicht gefunden',
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
        error: 'Nicht autorisiert',
      }, { status: 401 });
    }

    // Handle other errors
    console.error('Error fetching customer:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Laden des Kunden',
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
    const { userId, companyId } = await requireAuth();

    // 2. Rate limiting
    const rateLimitResponse = await rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 3. Get customer ID from params
    const { id } = await params;

    // 4. Check if customer exists and belongs to user
    const existingCustomer = await prisma.customer.findUnique({
      where: {
        id: id,
        companyId,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json({
        success: false,
        error: 'Kunde nicht gefunden',
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
        companyId,
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
    console.error('Error updating customer:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Aktualisieren des Kunden',
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
    // 1. Authenticate user — OWNER only for delete
    const { companyId } = await requireOwner();

    // 2. Get customer ID from params
    const { id } = await params;

    // 3. Check if customer exists and belongs to company
    const existingCustomer = await prisma.customer.findUnique({
      where: { id, companyId },
    });

    if (!existingCustomer) {
      return NextResponse.json({ success: false, error: 'Kunde nicht gefunden' }, { status: 404 });
    }

    // 4. Delete customer (cascade will delete systems, maintenances, etc.)
    await prisma.customer.delete({ where: { id, companyId } });

    return NextResponse.json({ success: true, message: 'Kunde erfolgreich gelöscht' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: 'Nur Inhaber können Kunden löschen' }, { status: 403 });
    }
    console.error('Error deleting customer:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Löschen des Kunden' }, { status: 500 });
  }
}
