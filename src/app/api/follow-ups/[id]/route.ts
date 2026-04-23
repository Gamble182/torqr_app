import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwner } from '@/lib/auth-helpers';
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
    const { userId, companyId } = await requireAuth();

    const rateLimitResponse = await rateLimitByUser(req, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rateLimitResponse) return rateLimitResponse;

    const { id: followUpId } = await params;

    const existing = await prisma.followUpJob.findFirst({
      where: { id: followUpId, companyId },
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
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error updating follow-up:', err);
    return NextResponse.json({ success: false, error: 'Fehler beim Aktualisieren des Nachfolgeauftrags' }, { status: 500 });
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
    const { userId, companyId } = await requireOwner();

    const rateLimitResponse = await rateLimitByUser(req, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rateLimitResponse) return rateLimitResponse;

    const { id: followUpId } = await params;

    const existing = await prisma.followUpJob.findFirst({
      where: { id: followUpId, companyId },
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
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    if (err instanceof Error && err.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: 'Nur Inhaber können Nachfolgeaufträge löschen' }, { status: 403 });
    }
    console.error('Error deleting follow-up:', err);
    return NextResponse.json({ success: false, error: 'Fehler beim Löschen des Nachfolgeauftrags' }, { status: 500 });
  }
}
