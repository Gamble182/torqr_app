import React from 'react';
import { render } from '@react-email/components';
import { resend, FROM_EMAIL, CAL_COM_URL } from './client';
import { prisma } from '@/lib/prisma';
import { buildUnsubscribeUrl } from './unsubscribe-token';
import { ReminderEmail } from './templates/ReminderEmail';
import { WeeklySummaryEmail } from './templates/WeeklySummaryEmail';
import { BookingConfirmationEmail } from './templates/BookingConfirmationEmail';
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
      user: { select: { name: true, email: true, phone: true, reminderGreeting: true, reminderBody: true, company: { select: { name: true } } } },
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

  const customGreeting = user?.reminderGreeting
    ? user.reminderGreeting.replace('{customerName}', customer.name)
    : undefined;
  const customBody = user?.reminderBody
    ? user.reminderBody.replace('{customerName}', customer.name)
    : undefined;

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
      maxCompanyName: user?.company?.name ?? null,
      unsubscribeUrl: buildUnsubscribeUrl(customer.id),
      customGreeting,
      customBody,
    })
  );

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
 * Send a booking confirmation email to a customer.
 * Called after a manual booking is created by office staff.
 * No-ops silently if the customer has no email.
 */
export async function sendBookingConfirmation(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: true,
      system: {
        include: {
          catalog: true,
          user: { select: { name: true, email: true, phone: true, company: { select: { name: true } } } },
        },
      },
    },
  });

  if (!booking?.customer?.email || !booking.system) return;

  const { customer, system } = booking;
  const { catalog, user } = system;

  const appointmentDate = format(booking.startTime, "EEEE, dd. MMMM yyyy", { locale: de });
  const appointmentTime = format(booking.startTime, "HH:mm 'Uhr'", { locale: de });

  const html = await render(
    React.createElement(BookingConfirmationEmail, {
      customerName: customer.name,
      appointmentDate,
      appointmentTime,
      heaterManufacturer: catalog.manufacturer,
      heaterModel: catalog.name,
      heaterSerialNumber: system.serialNumber,
      maxPhone: user?.phone ?? '',
      maxEmail: user?.email ?? '',
      maxName: user?.name ?? '',
      maxCompanyName: user?.company?.name ?? null,
    })
  );

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: customer.email as string,
    subject: `Ihr Wartungstermin am ${appointmentDate}`,
    html,
  });

  await prisma.emailLog.create({
    data: {
      customerId: customer.id,
      type: 'BOOKING_CONFIRMATION',
      resendId: data?.id ?? null,
      error: error ? JSON.stringify(error) : null,
    },
  });

  if (error) {
    throw new Error(`Resend error for booking ${bookingId}: ${JSON.stringify(error)}`);
  }
}

/**
 * Send the weekly summary email to a single user.
 * Role-aware: OWNER gets company-wide data, TECHNICIAN gets only assigned systems + own maintenances.
 * Respects the user's emailWeeklySummary preference — returns { emailsSent: 0 } if disabled.
 */
export async function sendWeeklySummary(userId?: string): Promise<{ emailsSent: number }> {
  let user;

  if (userId) {
    user = await prisma.user.findUnique({ where: { id: userId }, include: { company: true } });
    if (!user) throw new Error(`No user found for userId: ${userId}`);
  } else {
    const recipientEmail = process.env.SUMMARY_RECIPIENT_EMAIL;
    if (!recipientEmail) throw new Error('SUMMARY_RECIPIENT_EMAIL is not set');
    user = await prisma.user.findUnique({ where: { email: recipientEmail }, include: { company: true } });
    if (!user) throw new Error(`No user found for SUMMARY_RECIPIENT_EMAIL: ${recipientEmail}`);
  }

  if (!user.emailWeeklySummary) {
    return { emailsSent: 0 };
  }

  const now = new Date();
  const weekEnd = addDays(now, 7);
  const weekAgo = subDays(now, 7);

  const LIST_LIMIT = 10;

  const isOwner = user.role === 'OWNER';

  // Scope queries by role: OWNER sees company-wide, TECHNICIAN sees only assigned systems
  const systemScope = isOwner
    ? { companyId: user.companyId }
    : { companyId: user.companyId, assignedToUserId: user.id };

  const maintenanceScope = isOwner
    ? { companyId: user.companyId }
    : { companyId: user.companyId, userId: user.id };

  const bookingScope = isOwner
    ? { companyId: user.companyId }
    : { companyId: user.companyId, userId: user.id };

  const [
    bookingsRaw,
    dueSystemsRaw,
    overdueRaw,
    completedMaintenances,
    reminderLogs,
    customerCount,
    systemCount,
  ] = await Promise.all([
    prisma.booking.findMany({
      where: {
        ...bookingScope,
        status: 'CONFIRMED',
        startTime: { gte: now, lte: weekEnd },
      },
      include: {
        customer: { select: { name: true } },
        system: { include: { catalog: true } },
      },
      orderBy: { startTime: 'asc' },
    }),
    prisma.customerSystem.findMany({
      where: {
        ...systemScope,
        nextMaintenance: { gte: now, lte: weekEnd },
      },
      include: {
        catalog: true,
        customer: { select: { name: true } },
        bookings: {
          where: { status: 'CONFIRMED', startTime: { gte: now } },
          select: { id: true },
          take: 1,
        },
      },
      orderBy: { nextMaintenance: 'asc' },
    }),
    prisma.customerSystem.findMany({
      where: {
        ...systemScope,
        nextMaintenance: { lt: now },
      },
      include: {
        catalog: true,
        customer: { select: { name: true } },
      },
      orderBy: { nextMaintenance: 'asc' },
    }),
    prisma.maintenance.findMany({
      where: { ...maintenanceScope, date: { gte: weekAgo, lte: now } },
      select: { id: true },
    }),
    prisma.emailLog.count({
      where: {
        sentAt: { gte: weekAgo, lte: now },
        type: { in: ['REMINDER_4_WEEKS', 'REMINDER_1_WEEK'] },
        customer: { companyId: user.companyId },
      },
    }),
    prisma.customer.count({ where: { companyId: user.companyId } }),
    prisma.customerSystem.count({ where: systemScope }),
  ]);

  const bookingsAttendedLastWeek = await prisma.booking.count({
    where: {
      ...bookingScope,
      status: 'CONFIRMED',
      startTime: { gte: weekAgo, lte: now },
    },
  });

  const dueUnbookedAll = dueSystemsRaw.filter((s) => s.bookings.length === 0);

  const bookingsThisWeek = bookingsRaw.slice(0, LIST_LIMIT).map((b) => ({
    customerName: b.customer?.name ?? 'Unbekannt',
    systemInfo: b.system
      ? [b.system.catalog.manufacturer, b.system.catalog.name].filter(Boolean).join(' ')
      : '–',
    dateTime: `${format(b.startTime, 'EE, dd.MM.', { locale: de })} · ${format(b.startTime, "HH:mm 'Uhr'", { locale: de })}`,
  }));

  const dueUnbooked = dueUnbookedAll.slice(0, LIST_LIMIT).map((s) => ({
    customerName: s.customer?.name ?? 'Unbekannt',
    systemInfo: [s.catalog.manufacturer, s.catalog.name].filter(Boolean).join(' '),
    dueDate: s.nextMaintenance ? format(s.nextMaintenance, 'dd.MM.yyyy') : '–',
  }));

  const overdue = overdueRaw.slice(0, LIST_LIMIT).map((s) => ({
    customerName: s.customer?.name ?? 'Unbekannt',
    systemInfo: [s.catalog.manufacturer, s.catalog.name].filter(Boolean).join(' '),
    daysOverdue: s.nextMaintenance ? differenceInDays(now, s.nextMaintenance) : 0,
  }));

  const weekLabel = `${format(now, 'dd.MM.')} – ${format(weekEnd, 'dd.MM.yyyy')}`;

  const html = await render(
    React.createElement(WeeklySummaryEmail, {
      userName: user.name,
      weekLabel,
      bookingsThisWeek,
      bookingsThisWeekMore: bookingsRaw.length > LIST_LIMIT ? bookingsRaw.length - LIST_LIMIT : undefined,
      dueUnbooked,
      dueUnbookedMore: dueUnbookedAll.length > LIST_LIMIT ? dueUnbookedAll.length - LIST_LIMIT : undefined,
      overdue,
      overdueMore: overdueRaw.length > LIST_LIMIT ? overdueRaw.length - LIST_LIMIT : undefined,
      retro: {
        maintenancesCompleted: completedMaintenances.length,
        bookingsAttended: bookingsAttendedLastWeek,
        remindersSent: reminderLogs,
      },
      totals: {
        customers: customerCount,
        systems: systemCount,
      },
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

/**
 * Send weekly summary to all active users who have the preference enabled.
 * Called by the cron job. Returns total emails sent.
 */
export async function sendWeeklySummaryToAll(): Promise<{ emailsSent: number; errors: string[] }> {
  const users = await prisma.user.findMany({
    where: { isActive: true, emailWeeklySummary: true },
    select: { id: true },
  });

  let emailsSent = 0;
  const errors: string[] = [];

  for (const user of users) {
    try {
      const result = await sendWeeklySummary(user.id);
      emailsSent += result.emailsSent;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`User ${user.id}: ${msg}`);
      console.error(`[weekly-summary] Failed for user ${user.id}:`, msg);
    }
  }

  return { emailsSent, errors };
}
