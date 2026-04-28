import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { maintenanceSetItemCreateSchema } from '@/lib/validations';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId, companyId } = await requireOwner();
    const rate = await rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rate) return rate;

    const body = await request.json();
    const data = maintenanceSetItemCreateSchema.parse(body);

    const set = await prisma.maintenanceSet.findFirst({ where: { id, companyId } });
    if (!set)
      return NextResponse.json(
        { success: false, error: 'Wartungsset nicht gefunden' },
        { status: 404 },
      );

    if (data.inventoryItemId) {
      const inv = await prisma.inventoryItem.findFirst({
        where: { id: data.inventoryItemId, companyId },
      });
      if (!inv)
        return NextResponse.json(
          { success: false, error: 'Lagerteil nicht gefunden' },
          { status: 404 },
        );
    }

    const item = await prisma.maintenanceSetItem.create({
      data: { maintenanceSetId: id, ...data },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json(
        { success: false, error: 'Validierungsfehler', details: e.issues },
        { status: 400 },
      );
    if (e instanceof Error) {
      if (e.message === 'Unauthorized')
        return NextResponse.json(
          { success: false, error: 'Nicht autorisiert' },
          { status: 401 },
        );
      if (e.message === 'Forbidden')
        return NextResponse.json(
          { success: false, error: 'Nur Inhaber dürfen Wartungssets verwalten' },
          { status: 403 },
        );
    }
    console.error('POST set item', e);
    return NextResponse.json(
      { success: false, error: 'Fehler beim Anlegen' },
      { status: 500 },
    );
  }
}
