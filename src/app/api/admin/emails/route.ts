import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { EmailType } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const type = req.nextUrl.searchParams.get('type') ?? '';
    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1'));
    const pageSize = 50;

    const where = type && Object.values(EmailType).includes(type as EmailType)
      ? { type: type as EmailType }
      : {};

    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        select: {
          id: true,
          type: true,
          sentAt: true,
          resendId: true,
          error: true,
          customer: {
            select: {
              id: true,
              name: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { sentAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.emailLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
