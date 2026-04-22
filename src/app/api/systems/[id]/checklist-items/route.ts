import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { checklistItemCreateSchema } from '@/lib/validations';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

async function verifySystemOwnership(systemId: string, companyId: string) {
  return prisma.customerSystem.findFirst({
    where: { id: systemId, companyId },
    select: { id: true },
  });
}

/**
 * GET /api/systems/[id]/checklist-items
 * Returns custom checklist items for a system, ordered by sortOrder then createdAt.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = await requireAuth();
    const { id: systemId } = await params;

    const system = await verifySystemOwnership(systemId, companyId);
    if (!system) {
      return NextResponse.json({ success: false, error: 'System nicht gefunden' }, { status: 404 });
    }

    const items = await prisma.customerSystemChecklistItem.findMany({
      where: { customerSystemId: systemId },
      select: { id: true, label: true, sortOrder: true, createdAt: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({ success: true, data: items });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/systems/[id]/checklist-items
 * Adds a custom checklist item to the system.
 * Body: { label: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, companyId } = await requireAuth();

    const rateLimitResponse = rateLimitByUser(req, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rateLimitResponse) return rateLimitResponse;

    const { id: systemId } = await params;

    const system = await verifySystemOwnership(systemId, companyId);
    if (!system) {
      return NextResponse.json({ success: false, error: 'System nicht gefunden' }, { status: 404 });
    }

    const body = await req.json();
    const { label } = checklistItemCreateSchema.parse(body);

    // Compute next sortOrder: max existing + 1, starting at 0
    const aggregate = await prisma.customerSystemChecklistItem.aggregate({
      where: { customerSystemId: systemId },
      _max: { sortOrder: true },
    });
    const nextSortOrder = (aggregate._max.sortOrder ?? -1) + 1;

    const item = await prisma.customerSystemChecklistItem.create({
      data: { customerSystemId: systemId, label, sortOrder: nextSortOrder },
      select: { id: true, label: true, sortOrder: true, createdAt: true },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validierungsfehler', details: err.issues },
        { status: 400 }
      );
    }
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
