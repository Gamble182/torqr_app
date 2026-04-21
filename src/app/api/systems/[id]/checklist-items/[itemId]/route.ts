import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

/**
 * DELETE /api/systems/[id]/checklist-items/[itemId]
 * Deletes a custom checklist item. Ownership verified via system → customer → userId chain.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { userId } = await requireAuth();

    const rateLimitResponse = rateLimitByUser(req, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rateLimitResponse) return rateLimitResponse;

    const { id: systemId, itemId } = await params;

    // Ownership check: item must belong to a system that belongs to this user
    const item = await prisma.customerSystemChecklistItem.findFirst({
      where: {
        id: itemId,
        customerSystem: { id: systemId, userId },
      },
      select: { id: true },
    });

    if (!item) {
      return NextResponse.json({ success: false, error: 'Eintrag nicht gefunden' }, { status: 404 });
    }

    await prisma.customerSystemChecklistItem.delete({ where: { id: itemId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
