import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { sendReminder } from '@/lib/email/service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = await requireOwner();
    const { id: customerId } = await params;

    const body = await req.json().catch(() => ({})) as { systemId?: string };
    const { systemId } = body;

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, companyId },
      select: { id: true, email: true, name: true },
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Kunde nicht gefunden' }, { status: 404 });
    }

    if (!customer.email) {
      return NextResponse.json(
        { success: false, error: 'Dieser Kunde hat keine E-Mail-Adresse hinterlegt' },
        { status: 400 }
      );
    }

    const system = systemId
      ? await prisma.customerSystem.findFirst({ where: { id: systemId, customerId, companyId } })
      : await prisma.customerSystem.findFirst({ where: { customerId, companyId }, orderBy: { createdAt: 'asc' } });

    if (!system) {
      return NextResponse.json({ success: false, error: 'System nicht gefunden' }, { status: 404 });
    }

    await sendReminder(system.id, 'REMINDER_1_WEEK');

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    if (message === 'Forbidden') {
      return NextResponse.json({ success: false, error: 'Nur Inhaber können Erinnerungen senden' }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
