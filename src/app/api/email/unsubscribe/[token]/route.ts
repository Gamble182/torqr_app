import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseUnsubscribePath, verifyUnsubscribeToken } from '@/lib/email/unsubscribe-token';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token: combined } = await params;
  const parsed = parseUnsubscribePath(combined);

  if (!parsed) {
    return NextResponse.json({ error: 'Ungültiger Link' }, { status: 400 });
  }

  const { customerId, token } = parsed;

  if (!verifyUnsubscribeToken(customerId, token)) {
    return NextResponse.json({ error: 'Ungültiger oder abgelaufener Link' }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 });
  }

  if (customer.emailOptIn === 'UNSUBSCRIBED') {
    return NextResponse.json({ ok: true, alreadyUnsubscribed: true });
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: { emailOptIn: 'UNSUBSCRIBED', unsubscribedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
