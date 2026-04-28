import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

/**
 * DELETE /api/overrides/:id
 *
 * Removes a per-system override (ADD or EXCLUDE).
 *
 * Cross-tenant guard: the override must belong to a CustomerSystem owned by
 * the caller's company — enforced via the relational filter
 * `customerSystem: { companyId }` on findFirst.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId, companyId } = await requireOwner();
    const rate = await rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rate) return rate;

    const override = await prisma.customerSystemPartOverride.findFirst({
      where: { id, customerSystem: { companyId } },
    });
    if (!override) {
      return NextResponse.json(
        { success: false, error: 'Abweichung nicht gefunden' },
        { status: 404 },
      );
    }

    await prisma.customerSystemPartOverride.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === 'Unauthorized') {
        return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
      }
      if (e.message === 'Forbidden') {
        return NextResponse.json(
          { success: false, error: 'Nur Inhaber dürfen Abweichungen löschen' },
          { status: 403 },
        );
      }
    }
    console.error('override DELETE', e);
    return NextResponse.json({ success: false, error: 'Serverfehler' }, { status: 500 });
  }
}
