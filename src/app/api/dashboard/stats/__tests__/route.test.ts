import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth-helpers', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    customer: { count: vi.fn() },
    customerSystem: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    maintenance: {
      findMany: vi.fn(),
    },
    inventoryItem: {
      findMany: vi.fn(),
    },
  },
}));

import { GET } from '../route';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

const AUTH_OWNER = {
  userId: 'owner-1',
  companyId: 'co-1',
  role: 'OWNER' as const,
  email: 'o@x.de',
  name: 'Owner',
};

const AUTH_TECHNICIAN = {
  userId: 'tech-1',
  companyId: 'co-1',
  role: 'TECHNICIAN' as const,
  email: 't@x.de',
  name: 'Tech',
};

function makeRequest(search?: string): NextRequest {
  const url = `http://localhost/api/dashboard/stats${search ? `?${search}` : ''}`;
  return new NextRequest(url, { method: 'GET' });
}

function setupBaselineMocks() {
  vi.mocked(prisma.customer.count).mockResolvedValue(0);
  vi.mocked(prisma.customerSystem.count).mockResolvedValue(0);
  vi.mocked(prisma.customerSystem.findMany).mockResolvedValue([] as never);
  vi.mocked(prisma.maintenance.findMany).mockResolvedValue([] as never);
}

describe('GET /api/dashboard/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('OWNER response includes inventoryBelowMinStockCount counting items with currentStock < minStock', async () => {
    vi.mocked(requireAuth).mockResolvedValue(AUTH_OWNER);
    setupBaselineMocks();

    // 3 below threshold, 2 above
    const items = [
      { currentStock: new Prisma.Decimal('1'), minStock: new Prisma.Decimal('5') },
      { currentStock: new Prisma.Decimal('0'), minStock: new Prisma.Decimal('2') },
      { currentStock: new Prisma.Decimal('4.5'), minStock: new Prisma.Decimal('5') },
      { currentStock: new Prisma.Decimal('10'), minStock: new Prisma.Decimal('3') },
      { currentStock: new Prisma.Decimal('5'), minStock: new Prisma.Decimal('5') }, // equal, NOT below
    ];
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue(items as never);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.role).toBe('OWNER');
    expect(body.data.inventoryBelowMinStockCount).toBe(3);
  });

  it('OWNER response includes inventoryBelowMinStockCount: 0 when no inventory items', async () => {
    vi.mocked(requireAuth).mockResolvedValue(AUTH_OWNER);
    setupBaselineMocks();
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([] as never);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.inventoryBelowMinStockCount).toBe(0);
  });

  it('TECHNICIAN response does NOT include inventoryBelowMinStockCount and does not query inventory', async () => {
    vi.mocked(requireAuth).mockResolvedValue(AUTH_TECHNICIAN);
    setupBaselineMocks();

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.role).toBe('TECHNICIAN');
    expect(body.data).not.toHaveProperty('inventoryBelowMinStockCount');
    expect(vi.mocked(prisma.inventoryItem.findMany)).not.toHaveBeenCalled();
  });

  it('OWNER inventory query is tenant-scoped with minimal field selection', async () => {
    vi.mocked(requireAuth).mockResolvedValue(AUTH_OWNER);
    setupBaselineMocks();
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([] as never);

    await GET(makeRequest());

    expect(vi.mocked(prisma.inventoryItem.findMany)).toHaveBeenCalledWith({
      where: { companyId: 'co-1' },
      select: { currentStock: true, minStock: true },
    });
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new Error('Unauthorized'));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Nicht autorisiert');
  });
});
