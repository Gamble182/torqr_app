import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { maintenanceSetItemsReorderSchema } from '@/lib/validations';

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
    const { items } = maintenanceSetItemsReorderSchema.parse(body);

    const set = await prisma.maintenanceSet.findFirst({ where: { id, companyId } });
    if (!set)
      return NextResponse.json(
        { success: false, error: 'Wartungsset nicht gefunden' },
        { status: 404 },
      );

    const itemIds = items.map((i) => i.id);
    const found = await prisma.maintenanceSetItem.findMany({
      where: { id: { in: itemIds }, maintenanceSetId: id },
      select: { id: true },
    });
    if (found.length !== itemIds.length) {
      return NextResponse.json({ success: false, error: 'Ungültige Item-IDs' }, { status: 400 });
    }

    await prisma.$transaction(
      items.map((it) =>
        prisma.maintenanceSetItem.update({ where: { id: it.id }, data: { sortOrder: it.sortOrder } }),
      ),
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json(
        { success: false, error: 'Validierungsfehler', details: e.issues },
        { status: 400 },
      );
    if (e instanceof Error) {
      if (e.message === 'Unauthorized')
        return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
      if (e.message === 'Forbidden')
        return NextResponse.json(
          { success: false, error: 'Nur Inhaber dürfen Wartungssets verwalten' },
          { status: 403 },
        );
    }
    console.error('reorder', e);
    return NextResponse.json({ success: false, error: 'Serverfehler' }, { status: 500 });
  }
}
