import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/customers/[id]/email-logs
 * Returns the email log for a specific customer, scoped to the authenticated user.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = await requireAuth();
    const { id: customerId } = await params;

    // Verify customer belongs to this company
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, companyId },
      select: { id: true },
    });
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Kunde nicht gefunden' }, { status: 404 });
    }

    const logs = await prisma.emailLog.findMany({
      where: { customerId },
      select: {
        id: true,
        type: true,
        sentAt: true,
        error: true,
      },
      orderBy: { sentAt: 'desc' },
      take: 30,
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
