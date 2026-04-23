import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { rateLimitMiddleware, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { userRegistrationSchema, safeValidateRequest } from '@/lib/validations';

export async function POST(request: NextRequest) {
  // Apply rate limiting: 5 registration attempts per 15 minutes
  const rateLimitResponse = await rateLimitMiddleware(
    request,
    RATE_LIMIT_PRESETS.REGISTER
  );

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();

    // Validate input using the validation library
    const validationResult = safeValidateRequest(userRegistrationSchema, body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validierung fehlgeschlagen',
          details: validationResult.errors,
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create Company + OWNER User in a single transaction
    const user = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {},
      });

      return tx.user.create({
        data: {
          email: validatedData.email,
          passwordHash,
          name: validatedData.name,
          phone: validatedData.phone,
          companyId: company.id,
          role: 'OWNER',
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          createdAt: true,
        },
      });
    });

    return NextResponse.json(
      {
        message: 'Registrierung erfolgreich',
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle other errors
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Registrierung' },
      { status: 500 }
    );
  }
}
