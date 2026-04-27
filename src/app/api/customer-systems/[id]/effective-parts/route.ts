import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { getEffectivePartsForSystem } from '@/lib/maintenance-parts';

/**
 * GET /api/customer-systems/:id/effective-parts
 *
 * Returns the resolved effective parts list for a customer system
 * (DEFAULT set items minus EXCLUDE overrides, plus ADD overrides).
 *
 * Authorization:
 * - OWNER: any system in their tenant.
 * - TECHNICIAN: only systems assigned to them (assignedToUserId === userId);
 *   otherwise 403 "Zugriff verweigert".
 *
 * Tenant scoping is enforced via companyId both on the system lookup
 * and inside getEffectivePartsForSystem.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId, companyId, role } = await requireAuth();
    const rate = await rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rate) return rate;

    const system = await prisma.customerSystem.findFirst({
      where: { id, companyId },
      select: { id: true, assignedToUserId: true },
    });

    if (!system) {
      return NextResponse.json(
        { success: false, error: 'System nicht gefunden' },
        { status: 404 },
      );
    }

    if (role === 'TECHNICIAN' && system.assignedToUserId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Zugriff verweigert' },
        { status: 403 },
      );
    }

    const parts = await getEffectivePartsForSystem(id, companyId);
    return NextResponse.json({ success: true, data: parts });
  } catch (e) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Nicht autorisiert' },
        { status: 401 },
      );
    }
    console.error('effective-parts', e);
    return NextResponse.json(
      { success: false, error: 'Serverfehler' },
      { status: 500 },
    );
  }
}
