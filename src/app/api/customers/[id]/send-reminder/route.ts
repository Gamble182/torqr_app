import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { sendReminder } from '@/lib/email/service';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: customerId } = await params;

    // Verify customer belongs to this user
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, userId: true, email: true, name: true },
    });

    if (!customer || customer.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Kunde nicht gefunden' },
        { status: 404 }
      );
    }

    if (!customer.email) {
      return NextResponse.json(
        { success: false, error: 'Dieser Kunde hat keine E-Mail-Adresse hinterlegt' },
        { status: 400 }
      );
    }

    // Find the first heater for this customer that belongs to this user
    const heater = await prisma.heater.findFirst({
      where: { customerId, userId },
      orderBy: { createdAt: 'asc' },
    });

    if (!heater) {
      return NextResponse.json(
        { success: false, error: 'Dieser Kunde hat noch keine Heizsysteme' },
        { status: 400 }
      );
    }

    await sendReminder(heater.id, 'REMINDER_1_WEEK');

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
