import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const search = req.nextUrl.searchParams.get('search') ?? '';
    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1'));
    const pageSize = 25;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { companyName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          companyName: true,
          createdAt: true,
          _count: {
            select: { customers: true, customerSystems: true, maintenances: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    // Attach last login from LoginLog
    const userIds = users.map((u) => u.id);
    const lastLogins = await prisma.loginLog.findMany({
      where: { userId: { in: userIds }, success: true },
      select: { userId: true, createdAt: true },
      distinct: ['userId'],
      orderBy: { createdAt: 'desc' },
    });
    const lastLoginMap = Object.fromEntries(
      lastLogins.map((l) => [l.userId, l.createdAt])
    );

    const enriched = users.map((u) => ({
      ...u,
      lastLogin: lastLoginMap[u.id] ?? null,
    }));

    return NextResponse.json({
      success: true,
      data: enriched,
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
