import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { followUpJobUpdateSchema } from '@/lib/validations';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

/**
 * PATCH /api/follow-ups/[id]
 * Updates a follow-up job (toggle complete, edit label/description).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();

    const rateLimitResponse = rateLimitByUser(req, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rateLimitResponse) return rateLimitResponse;

    const { id: followUpId } = await params;

    const existing = await prisma.followUpJob.findFirst({
      where: { id: followUpId, userId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Nachfolgeauftrag nicht gefunden' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validated = followUpJobUpdateSchema.parse(body);

    // Handle completedAt based on completed flag change
    const data: Prisma.FollowUpJobUpdateInput = { ...validated };
    if (validated.completed !== undefined) {
      if (validated.completed && !existing.completed) {
        data.completedAt = new Date();
      } else if (!validated.completed && existing.completed) {
        data.completedAt = null;
      }
    }

    const updated = await prisma.followUpJob.update({
      where: { id: followUpId },
      data,
    });

    return NextResponse.json({ success: true, data: updated });
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

/**
 * DELETE /api/follow-ups/[id]
 * Deletes a follow-up job.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();

    const rateLimitResponse = rateLimitByUser(req, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rateLimitResponse) return rateLimitResponse;

    const { id: followUpId } = await params;

    const existing = await prisma.followUpJob.findFirst({
      where: { id: followUpId, userId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Nachfolgeauftrag nicht gefunden' },
        { status: 404 }
      );
    }

    await prisma.followUpJob.delete({ where: { id: followUpId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
