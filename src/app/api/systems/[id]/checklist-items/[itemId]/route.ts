import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

/**
 * DELETE /api/systems/[id]/checklist-items/[itemId]
 * Deletes a custom checklist item. OWNER only.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { userId, companyId } = await requireOwner();

    const rateLimitResponse = await rateLimitByUser(req, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rateLimitResponse) return rateLimitResponse;

    const { id: systemId, itemId } = await params;

    // Ownership check: item must belong to a system that belongs to this company
    const item = await prisma.customerSystemChecklistItem.findFirst({
      where: {
        id: itemId,
        customerSystem: { id: systemId, companyId },
      },
      select: { id: true },
    });

    if (!item) {
      return NextResponse.json({ success: false, error: 'Eintrag nicht gefunden' }, { status: 404 });
    }

    await prisma.customerSystemChecklistItem.delete({ where: { id: itemId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    if (err instanceof Error && err.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: 'Nur Inhaber können Checklisteneinträge löschen' }, { status: 403 });
    }
    console.error('Error deleting checklist item:', err);
    return NextResponse.json({ success: false, error: 'Fehler beim Löschen des Checklisteneintrags' }, { status: 500 });
  }
}
