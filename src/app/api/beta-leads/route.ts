import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { betaLeadSchema } from '@/lib/validations';
import { rateLimitMiddleware, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { sendBetaLeadNotification } from '@/lib/email/service';

export async function POST(request: NextRequest) {
  const rl = await rateLimitMiddleware(request, RATE_LIMIT_PRESETS.BETA_LEAD);
  if (rl) return rl;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = betaLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { email, name, company, tierInterest, source, consent } = parsed.data;

  try {
    await prisma.betaLead.create({
      data: {
        email,
        name: name && name.length > 0 ? name : null,
        company: company && company.length > 0 ? company : null,
        tierInterest: tierInterest ?? null,
        source: source ?? null,
        consent,
      },
    });
  } catch (e) {
    console.error('[beta-leads] DB error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  // Fire-and-forget notification (don't fail user if email fails)
  await sendBetaLeadNotification({ email, name, company, tierInterest, source });

  return NextResponse.json({ ok: true }, { status: 201 });
}
