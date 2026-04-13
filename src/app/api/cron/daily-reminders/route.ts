import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendReminder } from '@/lib/email/service';
import { addDays } from 'date-fns';

type ReminderType = 'REMINDER_4_WEEKS' | 'REMINDER_1_WEEK';

function verifyCronSecret(request: NextRequest): boolean {
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

/**
 * Returns heater IDs eligible for a reminder of the given type today.
 * Window: ±1 day around target (28 or 7 days from now).
 * Dedup: skips customers who already received this type within the last 30 days.
 */
async function getEligibleHeaterIds(type: ReminderType): Promise<string[]> {
  const now = new Date();
  const targetDays = type === 'REMINDER_4_WEEKS' ? 28 : 7;
  const windowStart = addDays(now, targetDays - 1);
  const windowEnd = addDays(now, targetDays + 1);
  const dedupeFrom = addDays(now, -30);

  const heaters = await prisma.heater.findMany({
    where: {
      nextMaintenance: { gte: windowStart, lte: windowEnd },
      customer: {
        emailOptIn: 'CONFIRMED',
        email: { not: null },
        emailLogs: {
          none: {
            type,
            sentAt: { gte: dedupeFrom },
          },
        },
      },
    },
    select: { id: true },
  });

  return heaters.map((h) => h.id);
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cronRun = await prisma.cronRun.create({
    data: { jobType: 'daily_reminders' },
  });

  const errors: string[] = [];
  let emailsSent = 0;

  for (const type of ['REMINDER_4_WEEKS', 'REMINDER_1_WEEK'] as ReminderType[]) {
    const heaterIds = await getEligibleHeaterIds(type);

    for (const heaterId of heaterIds) {
      try {
        await sendReminder(heaterId, type);
        emailsSent++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${heaterId}: ${msg}`);
        console.error(`[daily-reminders] Failed for heater ${heaterId}:`, err);
      }
    }
  }

  const status = emailsSent === 0 && errors.length > 0 ? 'FAILED' : 'SUCCESS';

  await prisma.cronRun.update({
    where: { id: cronRun.id },
    data: {
      completedAt: new Date(),
      status,
      emailsSent,
      errors: errors.length > 0 ? JSON.stringify(errors) : null,
    },
  });

  return NextResponse.json({ ok: true, emailsSent, errors });
}
