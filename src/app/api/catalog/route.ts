import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { catalogCreateSchema } from '@/lib/validations';
import { SystemType, AcSubtype, StorageSubtype } from '@prisma/client';

/**
 * GET /api/catalog?systemType=HEATING
 * Returns all catalog entries, optionally filtered by systemType.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const systemType = request.nextUrl.searchParams.get('systemType') as SystemType | null;

    const entries = await prisma.systemCatalog.findMany({
      where: systemType ? { systemType } : undefined,
      orderBy: [{ manufacturer: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ success: true, data: entries });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error fetching catalog:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Laden des Katalogs' }, { status: 500 });
  }
}

/**
 * POST /api/catalog
 * Create a new catalog entry (contributed by authenticated user).
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();

    const body = await request.json();
    const validated = catalogCreateSchema.parse(body);

    const entry = await prisma.systemCatalog.create({
      data: {
        systemType: validated.systemType as SystemType,
        manufacturer: validated.manufacturer,
        name: validated.name,
        acSubtype: (validated.acSubtype ?? null) as AcSubtype | null,
        storageSubtype: (validated.storageSubtype ?? null) as StorageSubtype | null,
        createdByUserId: userId,
      },
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validierungsfehler', details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ success: false, error: 'Dieser Eintrag existiert bereits im Katalog' }, { status: 409 });
    }
    console.error('Error creating catalog entry:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Erstellen des Katalogeintrags' }, { status: 500 });
  }
}
