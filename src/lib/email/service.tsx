import React from 'react';
import { render } from '@react-email/components';
import { resend, FROM_EMAIL, CAL_COM_URL } from './client';
import { prisma } from '@/lib/prisma';
import { buildUnsubscribeUrl } from './unsubscribe-token';
import { ReminderEmail } from './templates/ReminderEmail';
import { WeeklySummaryEmail } from './templates/WeeklySummaryEmail';
import { format, addDays, subDays, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
type ReminderType = 'REMINDER_4_WEEKS' | 'REMINDER_1_WEEK';

/**
 * Send a maintenance reminder email to a customer.
 * Logs the send to EmailLog. Throws on Resend error.
 */
export async function sendReminder(
  heaterId: string,
  type: ReminderType
): Promise<void> {
  const heater = await prisma.heater.findUnique({
    where: { id: heaterId },
    include: {
      customer: true,
      user: { select: { phone: true } },
    },
  });

  if (!heater?.customer?.email) {
    throw new Error(`Heater ${heaterId}: no customer or no email`);
  }

  const { customer, user } = heater;
  const weeksUntil = type === 'REMINDER_4_WEEKS' ? 4 : 1;
  const maintenanceDate = heater.nextMaintenance
    ? format(heater.nextMaintenance, 'dd.MM.yyyy', { locale: de })
    : 'Unbekannt';

  const html = await render(
    React.createElement(ReminderEmail, {
      customerName: customer.name,
      maintenanceDate,
      heaterManufacturer: heater.manufacturer,
      heaterModel: heater.model,
      heaterSerialNumber: heater.serialNumber,
      weeksUntil,
      calComUrl: CAL_COM_URL,
      maxPhone: user?.phone ?? '',
      unsubscribeUrl: buildUnsubscribeUrl(customer.id),
    })
  );

  const heaterLabel = [heater.manufacturer, heater.model].filter(Boolean).join(' ');
  const weekWord = weeksUntil === 1 ? 'Woche' : 'Wochen';

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: customer.email as string,
    subject: `Wartungserinnerung: Termin in ${weeksUntil} ${weekWord} – ${heaterLabel}`,
    html,
  });

  await prisma.emailLog.create({
    data: {
      customerId: customer.id,
      type,
      resendId: data?.id ?? null,
      error: error ? JSON.stringify(error) : null,
    },
  });

  if (error) {
    throw new Error(`Resend error for heater ${heaterId}: ${JSON.stringify(error)}`);
  }
}

/**
 * Send the weekly summary email to Max.
 * Uses SUMMARY_RECIPIENT_EMAIL env var to find the user and send to them.
 * Outcome is tracked via CronRun, not EmailLog (no customerId required for summary).
 */
export async function sendWeeklySummary(): Promise<{ emailsSent: number }> {
  const recipientEmail = process.env.SUMMARY_RECIPIENT_EMAIL;
  if (!recipientEmail) throw new Error('SUMMARY_RECIPIENT_EMAIL is not set');

  const user = await prisma.user.findUnique({ where: { email: recipientEmail } });
  if (!user) throw new Error(`No user found for SUMMARY_RECIPIENT_EMAIL: ${recipientEmail}`);

  const now = new Date();
  const weekEnd = addDays(now, 7);
  const weekAgo = subDays(now, 7);

  const [upcomingHeaters, overdueHeaters, completedMaintenances] = await Promise.all([
    prisma.heater.findMany({
      where: { userId: user.id, nextMaintenance: { gte: now, lte: weekEnd } },
      include: { customer: { select: { name: true } } },
      orderBy: { nextMaintenance: 'asc' },
    }),
    prisma.heater.findMany({
      where: { userId: user.id, nextMaintenance: { lt: now } },
      include: { customer: { select: { name: true } } },
      orderBy: { nextMaintenance: 'asc' },
    }),
    prisma.maintenance.findMany({
      where: { userId: user.id, date: { gte: weekAgo, lte: now } },
    }),
  ]);

  const weekLabel = `${format(now, 'dd.MM.')} – ${format(weekEnd, 'dd.MM.yyyy')}`;

  const html = await render(
    React.createElement(WeeklySummaryEmail, {
      weekLabel,
      upcomingCount: upcomingHeaters.length,
      overdueCount: overdueHeaters.length,
      completedCount: completedMaintenances.length,
      upcomingList: upcomingHeaters.map((h) => ({
        customerName: h.customer?.name ?? 'Unbekannt',
        date: h.nextMaintenance ? format(h.nextMaintenance, 'dd.MM.yyyy') : '–',
        heaterInfo: [h.manufacturer, h.model].filter(Boolean).join(' '),
      })),
      overdueList: overdueHeaters.map((h) => ({
        customerName: h.customer?.name ?? 'Unbekannt',
        daysOverdue: h.nextMaintenance ? differenceInDays(now, h.nextMaintenance) : 0,
        heaterInfo: [h.manufacturer, h.model].filter(Boolean).join(' '),
      })),
    })
  );

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: recipientEmail,
    subject: `Wochenübersicht ${weekLabel}`,
    html,
  });

  if (error) throw new Error(`Resend error for weekly summary: ${JSON.stringify(error)}`);

  return { emailsSent: 1 };
}
