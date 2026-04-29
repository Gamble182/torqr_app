import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { demoRequestSchema } from '@/lib/validations';
import { rateLimitMiddleware, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { sendDemoRequestNotification } from '@/lib/email/service';

export async function POST(request: NextRequest) {
  const rl = await rateLimitMiddleware(request, RATE_LIMIT_PRESETS.DEMO_REQUEST);
  if (rl) return rl;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = demoRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const optionalString = (s?: string) => (s && s.length > 0 ? s : null);

  try {
    await prisma.demoRequest.create({
      data: {
        email: d.email,
        name: d.name,
        company: optionalString(d.company),
        phone: optionalString(d.phone),
        preferredSlot: optionalString(d.preferredSlot),
        message: optionalString(d.message),
        source: d.source ?? null,
        consent: d.consent,
      },
    });
  } catch (e) {
    console.error('[demo-requests] DB error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  await sendDemoRequestNotification({
    email: d.email,
    name: d.name,
    company: optionalString(d.company),
    phone: optionalString(d.phone),
    preferredSlot: optionalString(d.preferredSlot),
    message: optionalString(d.message),
    source: d.source,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
