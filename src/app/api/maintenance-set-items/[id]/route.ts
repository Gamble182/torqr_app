import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { maintenanceSetItemUpdateSchema } from '@/lib/validations';

async function loadItem(itemId: string, companyId: string) {
  return prisma.maintenanceSetItem.findFirst({
    where: { id: itemId, maintenanceSet: { companyId } },
    include: { maintenanceSet: { select: { companyId: true } } },
  });
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
    const data = maintenanceSetItemUpdateSchema.parse(body);

    const item = await loadItem(id, companyId);
    if (!item)
      return NextResponse.json({ success: false, error: 'Teil nicht gefunden' }, { status: 404 });

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

    const updated = await prisma.maintenanceSetItem.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json(
        { success: false, error: 'Validierungsfehler', details: e.issues },
        { status: 400 },
      );
    return errorJson(e);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { companyId } = await requireOwner();
    const item = await loadItem(id, companyId);
    if (!item)
      return NextResponse.json({ success: false, error: 'Teil nicht gefunden' }, { status: 404 });
    await prisma.maintenanceSetItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return errorJson(e);
  }
}

function errorJson(e: unknown) {
  if (e instanceof Error) {
    if (e.message === 'Unauthorized')
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    if (e.message === 'Forbidden')
      return NextResponse.json(
        { success: false, error: 'Nur Inhaber dürfen Wartungssets verwalten' },
        { status: 403 },
      );
  }
  console.error(e);
  return NextResponse.json({ success: false, error: 'Serverfehler' }, { status: 500 });
}
