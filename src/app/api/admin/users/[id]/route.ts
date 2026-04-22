import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        company: { select: { id: true, name: true } },
        phone: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { customers: true, customerSystems: true, maintenances: true, bookings: true },
        },
        customers: {
          select: {
            id: true,
            name: true,
            city: true,
            createdAt: true,
            emailOptIn: true,
            _count: { select: { customerSystems: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 });
    }

    const [emailLogs, lastLogin] = await Promise.all([
      prisma.emailLog.findMany({
        where: { customer: { userId: id } },
        select: {
          id: true, type: true, sentAt: true, resendId: true, error: true,
          customer: { select: { name: true } },
        },
        orderBy: { sentAt: 'desc' },
        take: 20,
      }),
      prisma.loginLog.findFirst({
        where: { userId: id, success: true },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, ipAddress: true },
      }),
    ]);

    return NextResponse.json({ success: true, data: { ...user, companyName: user.company?.name ?? null, emailLogs, lastLogin } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
