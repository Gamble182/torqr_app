import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { inventoryItemUpdateSchema } from '@/lib/validations';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId, companyId } = await requireAuth();
    const rate = await rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rate) return rate;
    const item = await prisma.inventoryItem.findFirst({ where: { id, companyId } });
    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Lagerteil nicht gefunden' },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: item });
  } catch (e) {
    return inventoryErr(e);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId, companyId } = await requireOwner();
    const rate = await rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rate) return rate;
    const body = await request.json();
    const data = inventoryItemUpdateSchema.parse(body);

    const item = await prisma.inventoryItem.findFirst({ where: { id, companyId } });
    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Lagerteil nicht gefunden' },
        { status: 404 },
      );
    }

    if (data.articleNumber && data.articleNumber !== item.articleNumber) {
      const dup = await prisma.inventoryItem.findUnique({
        where: { companyId_articleNumber: { companyId, articleNumber: data.articleNumber } },
      });
      if (dup && dup.id !== id) {
        return NextResponse.json(
          { success: false, error: 'Artikelnummer existiert bereits im Lager' },
          { status: 409 },
        );
      }
    }

    const updated = await prisma.inventoryItem.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validierungsfehler', details: e.issues },
        { status: 400 },
      );
    }
    return inventoryErr(e);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId, companyId } = await requireOwner();
    const rate = await rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rate) return rate;

    const item = await prisma.inventoryItem.findFirst({ where: { id, companyId } });
    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Lagerteil nicht gefunden' },
        { status: 404 },
      );
    }

    const [setRefs, overrideRefs] = await Promise.all([
      prisma.maintenanceSetItem.count({ where: { inventoryItemId: id } }),
      prisma.customerSystemPartOverride.count({ where: { inventoryItemId: id } }),
    ]);
    const total = setRefs + overrideRefs;
    if (total > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Teil wird noch in ${total} Wartungsset-Einträgen verwendet — zuerst dort entfernen.`,
        },
        { status: 400 },
      );
    }

    await prisma.inventoryItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return inventoryErr(e);
  }
}

function inventoryErr(e: unknown) {
  if (e instanceof Error) {
    if (e.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    if (e.message === 'Forbidden') {
      return NextResponse.json(
        { success: false, error: 'Nur Inhaber dürfen Lager ändern' },
        { status: 403 },
      );
    }
  }
  console.error(e);
  return NextResponse.json({ success: false, error: 'Serverfehler' }, { status: 500 });
}
