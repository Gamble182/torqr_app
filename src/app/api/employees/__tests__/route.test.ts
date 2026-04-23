import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth-helpers', () => ({
  requireOwner: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    customerSystem: {
      groupBy: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
    },
    maintenance: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { GET } from '../route';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

describe('GET /api/employees', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns employees with workload counts per user', async () => {
    vi.mocked(requireOwner).mockResolvedValue({
      userId: 'owner-1',
      companyId: 'co-1',
      role: 'OWNER',
      email: 'o@x.de',
      name: 'Owner',
    });
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: 'u1', name: 'Tech A', email: 'a@x.de', phone: null, role: 'TECHNICIAN', isActive: true, deactivatedAt: null, createdAt: new Date() } as never,
      { id: 'u2', name: 'Tech B', email: 'b@x.de', phone: null, role: 'TECHNICIAN', isActive: true, deactivatedAt: null, createdAt: new Date() } as never,
    ]);
    vi.mocked(prisma.customerSystem.groupBy).mockImplementation(async (args: unknown) => {
      const a = args as { where: { nextMaintenance?: unknown } };
      if (a.where.nextMaintenance) {
        return [{ assignedToUserId: 'u1', _count: { _all: 2 } }] as never;
      }
      return [
        { assignedToUserId: 'u1', _count: { _all: 5 } },
        { assignedToUserId: 'u2', _count: { _all: 3 } },
      ] as never;
    });

    const res = await GET();
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    const u1 = body.data.find((e: { id: string }) => e.id === 'u1');
    expect(u1.workload).toEqual({ assignedSystemsCount: 5, overdueSystemsCount: 2 });
    const u2 = body.data.find((e: { id: string }) => e.id === 'u2');
    expect(u2.workload).toEqual({ assignedSystemsCount: 3, overdueSystemsCount: 0 });
  });

  it('returns 403 when requester is not OWNER', async () => {
    vi.mocked(requireOwner).mockRejectedValue(new Error('Forbidden'));
    const res = await GET();
    expect(res.status).toBe(403);
  });
});
