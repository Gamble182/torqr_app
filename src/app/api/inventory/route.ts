import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { inventoryItemCreateSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { userId, companyId } = await requireAuth();
    const rate = await rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rate) return rate;

    const filter = new URL(request.url).searchParams.get('filter');
    const items = await prisma.inventoryItem.findMany({
      where: { companyId },
      orderBy: [{ description: 'asc' }],
    });
    const filtered = filter === 'low'
      ? items.filter((i) => i.currentStock.lt(i.minStock))
      : items;
    return NextResponse.json({ success: true, data: filtered });
  } catch (e) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('GET inventory', e);
    return NextResponse.json({ success: false, error: 'Fehler beim Laden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, companyId } = await requireOwner();
    const rate = await rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rate) return rate;

    const body = await request.json();
    const data = inventoryItemCreateSchema.parse(body);

    if (data.articleNumber) {
      const dup = await prisma.inventoryItem.findUnique({
        where: { companyId_articleNumber: { companyId, articleNumber: data.articleNumber } },
      });
      if (dup) {
        return NextResponse.json(
          { success: false, error: 'Artikelnummer existiert bereits im Lager' },
          { status: 409 },
        );
      }
    }

    const item = await prisma.inventoryItem.create({
      data: { companyId, ...data, articleNumber: data.articleNumber ?? null },
    });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validierungsfehler', details: e.issues },
        { status: 400 },
      );
    }
    if (e instanceof Error) {
      if (e.message === 'Unauthorized') {
        return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
      }
      if (e.message === 'Forbidden') {
        return NextResponse.json(
          { success: false, error: 'Nur Inhaber dürfen Lagerteile anlegen' },
          { status: 403 },
        );
      }
    }
    console.error('POST inventory', e);
    return NextResponse.json({ success: false, error: 'Fehler beim Anlegen' }, { status: 500 });
  }
}
