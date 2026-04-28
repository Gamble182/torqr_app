import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth-helpers', () => ({
  requireOwner: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    maintenanceSet: {
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimitByUser: vi.fn(() => null),
  RATE_LIMIT_PRESETS: { API_USER: { interval: 60_000, maxRequests: 100 } },
}));

import { GET, DELETE } from '../route';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

const AUTH_OK = {
  userId: 'owner-1',
  companyId: 'co-1',
  role: 'OWNER' as const,
  email: 'o@x.de',
  name: 'Owner',
};

const SET_ID = 'set-abc-123';

function makeRequest(method: string): Request {
  return new Request(`http://localhost/api/maintenance-sets/${SET_ID}`, { method });
}

function makeParams(id: string = SET_ID): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

const MOCK_INVENTORY_ITEM = {
  id: 'inv-1',
  description: 'Filter',
  articleNumber: 'ART-001',
  unit: 'Stück',
  currentStock: 10,
  minStock: 2,
};

const MOCK_SET_WITH_ITEMS = {
  id: SET_ID,
  companyId: 'co-1',
  catalogId: 'cat-1',
  createdAt: new Date(),
  catalog: { manufacturer: 'Vaillant', name: 'ecoTEC plus', systemType: 'HEATING' },
  items: [
    {
      id: 'item-1',
      maintenanceSetId: SET_ID,
      inventoryItemId: 'inv-1',
      sortOrder: 1,
      quantity: 1,
      inventoryItem: MOCK_INVENTORY_ITEM,
    },
    {
      id: 'item-2',
      maintenanceSetId: SET_ID,
      inventoryItemId: 'inv-2',
      sortOrder: 2,
      quantity: 2,
      inventoryItem: { ...MOCK_INVENTORY_ITEM, id: 'inv-2', description: 'Dichtung' },
    },
  ],
};

describe('GET /api/maintenance-sets/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns set with items ordered by sortOrder', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OK);
    vi.mocked(prisma.maintenanceSet.findFirst).mockResolvedValue(MOCK_SET_WITH_ITEMS as never);

    const res = await GET(makeRequest('GET') as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(SET_ID);
    expect(vi.mocked(prisma.maintenanceSet.findFirst)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: SET_ID, companyId: 'co-1' },
        include: expect.objectContaining({
          items: expect.objectContaining({
            orderBy: { sortOrder: 'asc' },
          }),
        }),
      }),
    );
  });

  it('returns 404 when set belongs to another tenant (cross-tenant)', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OK);
    vi.mocked(prisma.maintenanceSet.findFirst).mockResolvedValue(null);

    const res = await GET(makeRequest('GET') as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Wartungsset nicht gefunden');
  });

  it('returns 403 when caller is a TECHNICIAN', async () => {
    vi.mocked(requireOwner).mockRejectedValue(new Error('Forbidden'));

    const res = await GET(makeRequest('GET') as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Nur Inhaber dürfen Wartungssets verwalten');
  });
});

describe('DELETE /api/maintenance-sets/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('removes an existing set and returns success', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OK);
    vi.mocked(prisma.maintenanceSet.findFirst).mockResolvedValue(MOCK_SET_WITH_ITEMS as never);
    vi.mocked(prisma.maintenanceSet.delete).mockResolvedValue(MOCK_SET_WITH_ITEMS as never);

    const res = await DELETE(makeRequest('DELETE') as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(vi.mocked(prisma.maintenanceSet.findFirst)).toHaveBeenCalledWith({
      where: { id: SET_ID, companyId: 'co-1' },
    });
    expect(vi.mocked(prisma.maintenanceSet.delete)).toHaveBeenCalledWith({
      where: { id: SET_ID },
    });
  });

  it('returns 404 when set belongs to another tenant (cross-tenant)', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OK);
    vi.mocked(prisma.maintenanceSet.findFirst).mockResolvedValue(null);

    const res = await DELETE(makeRequest('DELETE') as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Wartungsset nicht gefunden');
    expect(vi.mocked(prisma.maintenanceSet.delete)).not.toHaveBeenCalled();
  });

  it('returns 403 when caller is a TECHNICIAN', async () => {
    vi.mocked(requireOwner).mockRejectedValue(new Error('Forbidden'));

    const res = await DELETE(makeRequest('DELETE') as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Nur Inhaber dürfen Wartungssets verwalten');
  });
});
