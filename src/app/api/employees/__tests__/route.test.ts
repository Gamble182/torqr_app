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
import { GET as GET_DETAIL } from '../[id]/route';
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
    (vi.mocked(prisma.customerSystem.groupBy) as unknown as {
      mockImplementation: (fn: (args: { where: { nextMaintenance?: unknown } }) => Promise<unknown>) => void;
    }).mockImplementation((args) => {
      if (args.where.nextMaintenance) {
        return Promise.resolve([{ assignedToUserId: 'u1', _count: { _all: 2 } }]);
      }
      return Promise.resolve([
        { assignedToUserId: 'u1', _count: { _all: 5 } },
        { assignedToUserId: 'u2', _count: { _all: 3 } },
      ]);
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

describe('GET /api/employees/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 for non-OWNER', async () => {
    vi.mocked(requireOwner).mockRejectedValue(new Error('Forbidden'));
    const res = await GET_DETAIL(new Request('http://x/api/employees/u1') as never, {
      params: Promise.resolve({ id: 'u1' }),
    });
    expect(res.status).toBe(403);
  });

  it('returns 404 when employee not found in company', async () => {
    vi.mocked(requireOwner).mockResolvedValue({
      userId: 'owner-1', companyId: 'co-1', role: 'OWNER', email: 'o@x.de', name: 'O',
    });
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    const res = await GET_DETAIL(new Request('http://x/api/employees/u1') as never, {
      params: Promise.resolve({ id: 'u1' }),
    });
    expect(res.status).toBe(404);
  });

  it('returns detail shape with stats, grouped systems, and recent activity', async () => {
    vi.mocked(requireOwner).mockResolvedValue({
      userId: 'owner-1', companyId: 'co-1', role: 'OWNER', email: 'o@x.de', name: 'O',
    });
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: 'u1', name: 'Tech A', email: 'a@x.de', phone: '+49',
      role: 'TECHNICIAN', isActive: true, deactivatedAt: null, createdAt: new Date(),
    } as never);
    vi.mocked(prisma.customerSystem.count).mockResolvedValue(5 as never);
    vi.mocked(prisma.customerSystem.findMany).mockResolvedValue([
      {
        id: 's1', nextMaintenance: new Date(Date.now() - 86400000),
        catalog: { systemType: 'HEATING', manufacturer: 'Vaillant', name: 'ecoTEC' },
        customer: { id: 'c1', name: 'Müller', city: 'Berlin' },
        bookings: [],
      },
      {
        id: 's2', nextMaintenance: new Date(Date.now() + 86400000 * 10),
        catalog: { systemType: 'AC', manufacturer: 'Daikin', name: 'Perfera' },
        customer: { id: 'c1', name: 'Müller', city: 'Berlin' },
        bookings: [{ startTime: new Date(Date.now() + 86400000 * 2) }],
      },
    ] as never);
    vi.mocked(prisma.maintenance.count).mockResolvedValue(3 as never);
    vi.mocked(prisma.maintenance.findMany).mockResolvedValue([
      {
        id: 'm1', date: new Date(),
        system: {
          id: 's1', catalog: { manufacturer: 'Vaillant', name: 'ecoTEC' },
          customer: { id: 'c1', name: 'Müller' },
        },
      },
    ] as never);

    const res = await GET_DETAIL(new Request('http://x/api/employees/u1') as never, {
      params: Promise.resolve({ id: 'u1' }),
    });
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data.id).toBe('u1');
    expect(body.data.stats.assignedSystemsCount).toBe(5);
    expect(body.data.stats.overdueSystemsCount).toBeGreaterThanOrEqual(1);
    expect(body.data.stats.maintenancesLast30Days).toBe(3);
    expect(body.data.assignedSystems).toHaveLength(1); // one customer group
    expect(body.data.assignedSystems[0].systems).toHaveLength(2);
    expect(body.data.recentActivity).toHaveLength(1);
  });
});
