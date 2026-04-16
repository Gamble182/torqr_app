import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await requireAdmin();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      totalCustomers,
      totalHeaters,
      totalMaintenances,
      emailsLast7Days,
      lastCronRuns,
      recentEmailErrors,
      recentCronErrors,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.customer.count(),
      prisma.heater.count(),
      prisma.maintenance.count(),
      prisma.emailLog.count({
        where: { sentAt: { gte: sevenDaysAgo } },
      }),
      prisma.cronRun.findMany({
        orderBy: { startedAt: 'desc' },
        take: 10,
        select: { jobType: true, startedAt: true, status: true, emailsSent: true },
      }),
      prisma.emailLog.findMany({
        where: { error: { not: null }, sentAt: { gte: sevenDaysAgo } },
        select: { id: true, type: true, sentAt: true, error: true, customerId: true },
        orderBy: { sentAt: 'desc' },
        take: 5,
      }),
      prisma.cronRun.findMany({
        where: { status: 'FAILED', startedAt: { gte: sevenDaysAgo } },
        orderBy: { startedAt: 'desc' },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalCustomers,
        totalHeaters,
        totalMaintenances,
        emailsLast7Days,
        lastCronRuns,
        recentEmailErrors,
        recentCronErrors,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error('[admin/stats]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
