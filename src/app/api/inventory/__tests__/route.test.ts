import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';

vi.mock('@/lib/auth-helpers', () => ({
  requireAuth: vi.fn(),
  requireOwner: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    inventoryItem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimitByUser: vi.fn(() => null),
  RATE_LIMIT_PRESETS: { API_USER: { interval: 60_000, maxRequests: 100 } },
}));

import { GET, POST } from '../route';
import { requireAuth, requireOwner } from '@/lib/auth-helpers';
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

function makeRequest(method: string, body?: unknown, search?: string): Request {
  const url = `http://localhost/api/inventory${search ? `?${search}` : ''}`;
  return new Request(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('GET /api/inventory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns inventory items for caller\'s company', async () => {
    vi.mocked(requireAuth).mockResolvedValue(AUTH_OWNER);
    const items = [
      { id: 'item-1', description: 'Dichtung', companyId: 'co-1', currentStock: new Prisma.Decimal('5'), minStock: new Prisma.Decimal('2') },
      { id: 'item-2', description: 'Filter', companyId: 'co-1', currentStock: new Prisma.Decimal('10'), minStock: new Prisma.Decimal('3') },
    ];
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue(items as never);

    const res = await GET(makeRequest('GET') as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(vi.mocked(prisma.inventoryItem.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { companyId: 'co-1' },
        orderBy: [{ description: 'asc' }],
      }),
    );
  });

  it('GET with ?filter=low returns only items where currentStock < minStock', async () => {
    vi.mocked(requireAuth).mockResolvedValue(AUTH_OWNER);
    const belowMin = {
      id: 'item-1',
      description: 'Dichtung',
      companyId: 'co-1',
      currentStock: new Prisma.Decimal('1'),
      minStock: new Prisma.Decimal('5'),
    };
    const aboveMin = {
      id: 'item-2',
      description: 'Filter',
      companyId: 'co-1',
      currentStock: new Prisma.Decimal('10'),
      minStock: new Prisma.Decimal('3'),
    };
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([belowMin, aboveMin] as never);

    const res = await GET(makeRequest('GET', undefined, 'filter=low') as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe('item-1');
  });

  it('GET as TECHNICIAN succeeds', async () => {
    vi.mocked(requireAuth).mockResolvedValue(AUTH_TECHNICIAN);
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([]);

    const res = await GET(makeRequest('GET') as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new Error('Unauthorized'));

    const res = await GET(makeRequest('GET') as never);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Nicht autorisiert');
  });
});

describe('POST /api/inventory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST as OWNER with articleNumber creates item', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.inventoryItem.findUnique).mockResolvedValue(null);
    const created = {
      id: 'item-new',
      companyId: 'co-1',
      description: 'Neue Dichtung',
      articleNumber: 'ART-001',
      unit: 'Stck',
      minStock: new Prisma.Decimal('2'),
      currentStock: new Prisma.Decimal('0'),
    };
    vi.mocked(prisma.inventoryItem.create).mockResolvedValue(created as never);

    const res = await POST(
      makeRequest('POST', { description: 'Neue Dichtung', articleNumber: 'ART-001', unit: 'Stck', minStock: 2 }) as never,
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('item-new');
  });

  it('POST as OWNER with duplicate articleNumber returns 409', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.inventoryItem.findUnique).mockResolvedValue({
      id: 'existing',
      companyId: 'co-1',
      articleNumber: 'ART-001',
    } as never);

    const res = await POST(
      makeRequest('POST', { description: 'Neue Dichtung', articleNumber: 'ART-001', unit: 'Stck', minStock: 2 }) as never,
    );
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Artikelnummer existiert bereits im Lager');
  });

  it('POST as OWNER with articleNumber: null skips dedup check', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);
    const created = {
      id: 'item-no-art',
      companyId: 'co-1',
      description: 'Generisches Teil',
      articleNumber: null,
      unit: 'Stck',
      minStock: new Prisma.Decimal('0'),
      currentStock: new Prisma.Decimal('0'),
    };
    vi.mocked(prisma.inventoryItem.create).mockResolvedValue(created as never);

    const res = await POST(
      makeRequest('POST', { description: 'Generisches Teil', unit: 'Stck' }) as never,
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(vi.mocked(prisma.inventoryItem.findUnique)).not.toHaveBeenCalled();
  });

  it('POST as TECHNICIAN returns 403', async () => {
    vi.mocked(requireOwner).mockRejectedValue(new Error('Forbidden'));

    const res = await POST(
      makeRequest('POST', { description: 'Teil', unit: 'Stck' }) as never,
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Nur Inhaber dürfen Lagerteile anlegen');
  });
});
