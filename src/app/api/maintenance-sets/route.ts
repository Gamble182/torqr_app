import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { maintenanceSetCreateSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { userId, companyId } = await requireOwner();
    const rate = await rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rate) return rate;

    const catalogId = new URL(request.url).searchParams.get('catalogId');
    const sets = await prisma.maintenanceSet.findMany({
      where: { companyId, ...(catalogId ? { catalogId } : {}) },
      include: {
        catalog: { select: { manufacturer: true, name: true, systemType: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ success: true, data: sets });
  } catch (e) {
    return handleError(e, 'Fehler beim Laden der Wartungssets');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, companyId } = await requireOwner();
    const rate = await rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rate) return rate;

    const body = await request.json();
    const { catalogId } = maintenanceSetCreateSchema.parse(body);

    const catalog = await prisma.systemCatalog.findUnique({ where: { id: catalogId } });
    if (!catalog) {
      return NextResponse.json({ success: false, error: 'Katalog-Eintrag nicht gefunden' }, { status: 404 });
    }

    const existing = await prisma.maintenanceSet.findUnique({
      where: { companyId_catalogId: { companyId, catalogId } },
    });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Für dieses Modell existiert bereits ein Wartungsset' }, { status: 409 });
    }

    const set = await prisma.maintenanceSet.create({
      data: { companyId, catalogId },
      include: { catalog: { select: { manufacturer: true, name: true, systemType: true } } },
    });
    return NextResponse.json({ success: true, data: set }, { status: 201 });
  } catch (e) {
    return handleError(e, 'Fehler beim Erstellen des Wartungssets');
  }
}

function handleError(e: unknown, fallback: string) {
  if (e instanceof z.ZodError) {
    return NextResponse.json({ success: false, error: 'Validierungsfehler', details: e.issues }, { status: 400 });
  }
  if (e instanceof Error) {
    if (e.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    if (e.message === 'Forbidden') return NextResponse.json({ success: false, error: 'Nur Inhaber dürfen Wartungssets verwalten' }, { status: 403 });
  }
  console.error(fallback, e);
  return NextResponse.json({ success: false, error: fallback }, { status: 500 });
}
