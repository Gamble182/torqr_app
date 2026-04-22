import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWeeklySummaryToAll } from '@/lib/email/service';

function verifyCronSecret(request: NextRequest): boolean {
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cronRun = await prisma.cronRun.create({
    data: { jobType: 'weekly_summary' },
  });

  try {
    const { emailsSent, errors } = await sendWeeklySummaryToAll();

    await prisma.cronRun.update({
      where: { id: cronRun.id },
      data: {
        completedAt: new Date(),
        status: errors.length > 0 && emailsSent === 0 ? 'FAILED' : 'SUCCESS',
        emailsSent,
        errors: errors.length > 0 ? JSON.stringify(errors) : null,
      },
    });

    return NextResponse.json({ ok: true, emailsSent, errors });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[weekly-summary] Failed:', err);

    await prisma.cronRun.update({
      where: { id: cronRun.id },
      data: {
        completedAt: new Date(),
        status: 'FAILED',
        errors: JSON.stringify([msg]),
      },
    });

    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
