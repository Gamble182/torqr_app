import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { followUpJobCreateSchema } from '@/lib/validations';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

async function verifySystemOwnership(systemId: string, userId: string) {
  return prisma.customerSystem.findFirst({
    where: { id: systemId, userId },
    select: { id: true },
  });
}

/**
 * GET /api/systems/[id]/follow-ups
 * Returns all follow-up jobs for a system, ordered by createdAt desc.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: systemId } = await params;

    const system = await verifySystemOwnership(systemId, userId);
    if (!system) {
      return NextResponse.json(
        { success: false, error: 'System nicht gefunden' },
        { status: 404 }
      );
    }

    const followUps = await prisma.followUpJob.findMany({
      where: { systemId, userId },
      orderBy: [{ completed: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ success: true, data: followUps });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/systems/[id]/follow-ups
 * Creates a follow-up job for a system.
 * Body: { label, description?, photos?, maintenanceId? }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();

    const rateLimitResponse = rateLimitByUser(req, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rateLimitResponse) return rateLimitResponse;

    const { id: systemId } = await params;

    const system = await verifySystemOwnership(systemId, userId);
    if (!system) {
      return NextResponse.json(
        { success: false, error: 'System nicht gefunden' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validated = followUpJobCreateSchema.parse(body);

    const followUp = await prisma.followUpJob.create({
      data: {
        label: validated.label,
        description: validated.description ?? null,
        photos: validated.photos ?? [],
        systemId,
        userId,
        maintenanceId: validated.maintenanceId ?? null,
      },
    });

    return NextResponse.json({ success: true, data: followUp }, { status: 201 });
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
