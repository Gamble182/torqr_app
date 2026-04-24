import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId, companyId } = await requireOwner();
    const rate = await rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rate) return rate;

    const set = await prisma.maintenanceSet.findFirst({
      where: { id, companyId },
      include: {
        catalog: true,
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            inventoryItem: {
              select: {
                id: true,
                description: true,
                articleNumber: true,
                unit: true,
                currentStock: true,
                minStock: true,
              },
            },
          },
        },
      },
    });
    if (!set) return NextResponse.json({ success: false, error: 'Wartungsset nicht gefunden' }, { status: 404 });
    return NextResponse.json({ success: true, data: set });
  } catch (e) {
    return handleError(e, 'Fehler beim Laden des Wartungssets');
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { companyId } = await requireOwner();
    const set = await prisma.maintenanceSet.findFirst({ where: { id, companyId } });
    if (!set) return NextResponse.json({ success: false, error: 'Wartungsset nicht gefunden' }, { status: 404 });
    await prisma.maintenanceSet.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e, 'Fehler beim Löschen des Wartungssets');
  }
}

function handleError(e: unknown, fallback: string) {
  if (e instanceof Error) {
    if (e.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    if (e.message === 'Forbidden') return NextResponse.json({ success: false, error: 'Nur Inhaber dürfen Wartungssets verwalten' }, { status: 403 });
  }
  console.error(fallback, e);
  return NextResponse.json({ success: false, error: fallback }, { status: 500 });
}
