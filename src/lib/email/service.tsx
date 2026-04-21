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
  systemId: string,
  type: ReminderType
): Promise<void> {
  const system = await prisma.customerSystem.findUnique({
    where: { id: systemId },
    include: {
      catalog: true,
      customer: true,
      user: { select: { name: true, email: true, phone: true, companyName: true } },
    },
  });

  if (!system?.customer?.email) {
    throw new Error(`System ${systemId}: no customer or no email`);
  }

  const { catalog, customer, user } = system;
  const weeksUntil = type === 'REMINDER_4_WEEKS' ? 4 : 1;
  const maintenanceDate = system.nextMaintenance
    ? format(system.nextMaintenance, 'dd.MM.yyyy', { locale: de })
    : 'Unbekannt';

  const html = await render(
    React.createElement(ReminderEmail, {
      customerName: customer.name,
      maintenanceDate,
      heaterManufacturer: catalog.manufacturer,
      heaterModel: catalog.name,
      heaterSerialNumber: system.serialNumber,
      weeksUntil,
      calComUrl: CAL_COM_URL
        ? (() => {
            const url = new URL(CAL_COM_URL);
            url.searchParams.set('metadata[customerId]', customer.id);
            url.searchParams.set('metadata[userId]', system.userId);
            url.searchParams.set('metadata[systemId]', system.id);
            if (customer.name) url.searchParams.set('name', customer.name);
            if (customer.email) url.searchParams.set('email', customer.email as string);
            const address = [customer.street, `${customer.zipCode} ${customer.city}`]
              .filter(Boolean).join(', ');
            if (address) url.searchParams.set('location', address);
            return url.toString();
          })()
        : CAL_COM_URL,
      maxPhone: user?.phone ?? '',
      maxEmail: user?.email ?? '',
      maxName: user?.name ?? '',
      maxCompanyName: user?.companyName ?? null,
      unsubscribeUrl: buildUnsubscribeUrl(customer.id),
    })
  );

  const systemLabel = [catalog.manufacturer, catalog.name].filter(Boolean).join(' ');
  const weekWord = weeksUntil === 1 ? 'Woche' : 'Wochen';

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: customer.email as string,
    subject: `Wartungserinnerung – Ihre Anlage: Termin in ${weeksUntil} ${weekWord}`,
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
    throw new Error(`Resend error for system ${systemId}: ${JSON.stringify(error)}`);
  }
}

/**
 * Send the weekly summary email to a user.
 * If userId provided (manual trigger): looks up user by ID.
 * If no userId (cron): falls back to SUMMARY_RECIPIENT_EMAIL env var.
 * Respects the user's emailWeeklySummary preference — returns { emailsSent: 0 } if disabled.
 */
export async function sendWeeklySummary(userId?: string): Promise<{ emailsSent: number }> {
  let user;

  if (userId) {
    user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error(`No user found for userId: ${userId}`);
  } else {
    const recipientEmail = process.env.SUMMARY_RECIPIENT_EMAIL;
    if (!recipientEmail) throw new Error('SUMMARY_RECIPIENT_EMAIL is not set');
    user = await prisma.user.findUnique({ where: { email: recipientEmail } });
    if (!user) throw new Error(`No user found for SUMMARY_RECIPIENT_EMAIL: ${recipientEmail}`);
  }

  if (!user.emailWeeklySummary) {
    return { emailsSent: 0 };
  }

  const now = new Date();
  const weekEnd = addDays(now, 7);
  const weekAgo = subDays(now, 7);

  const [upcomingSystems, overdueSystems, completedMaintenances] = await Promise.all([
    prisma.customerSystem.findMany({
      where: { userId: user.id, nextMaintenance: { gte: now, lte: weekEnd } },
      include: { catalog: true, customer: { select: { name: true } } },
      orderBy: { nextMaintenance: 'asc' },
    }),
    prisma.customerSystem.findMany({
      where: { userId: user.id, nextMaintenance: { lt: now } },
      include: { catalog: true, customer: { select: { name: true } } },
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
      upcomingCount: upcomingSystems.length,
      overdueCount: overdueSystems.length,
      completedCount: completedMaintenances.length,
      upcomingList: upcomingSystems.map((s) => ({
        customerName: s.customer?.name ?? 'Unbekannt',
        date: s.nextMaintenance ? format(s.nextMaintenance, 'dd.MM.yyyy') : '–',
        heaterInfo: [s.catalog.manufacturer, s.catalog.name].filter(Boolean).join(' '),
      })),
      overdueList: overdueSystems.map((s) => ({
        customerName: s.customer?.name ?? 'Unbekannt',
        daysOverdue: s.nextMaintenance ? differenceInDays(now, s.nextMaintenance) : 0,
        heaterInfo: [s.catalog.manufacturer, s.catalog.name].filter(Boolean).join(' '),
      })),
    })
  );

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: user.email,
    subject: `Wochenübersicht ${weekLabel}`,
    html,
  });

  if (error) throw new Error(`Resend error for weekly summary: ${JSON.stringify(error)}`);

  return { emailsSent: 1 };
}
