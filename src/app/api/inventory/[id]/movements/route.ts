import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { inventoryMovementCreateSchema } from '@/lib/validations';
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

    const movements = await prisma.inventoryMovement.findMany({
      where: { inventoryItemId: id },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { user: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ success: true, data: movements });
  } catch (e) {
    return movementErr(e);
  }
}

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
    const data = inventoryMovementCreateSchema.parse(body);

    const item = await prisma.inventoryItem.findFirst({ where: { id, companyId } });
    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Lagerteil nicht gefunden' },
        { status: 404 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const movement = await tx.inventoryMovement.create({
        data: {
          companyId,
          inventoryItemId: id,
          userId,
          reason: data.reason,
          quantityChange: data.quantityChange,
          note: data.note ?? null,
        },
      });
      await tx.inventoryItem.update({
        where: { id },
        data: {
          currentStock: { increment: data.quantityChange },
          ...(data.reason === 'RESTOCK' ? { lastRestockedAt: new Date() } : {}),
        },
      });
      return movement;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validierungsfehler', details: e.issues },
        { status: 400 },
      );
    }
    return movementErr(e);
  }
}

function movementErr(e: unknown) {
  if (e instanceof Error) {
    if (e.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    if (e.message === 'Forbidden') {
      return NextResponse.json(
        { success: false, error: 'Nur Inhaber dürfen Bewegungen buchen' },
        { status: 403 },
      );
    }
  }
  console.error(e);
  return NextResponse.json({ success: false, error: 'Serverfehler' }, { status: 500 });
}
