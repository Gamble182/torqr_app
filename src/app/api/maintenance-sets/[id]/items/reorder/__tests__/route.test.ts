import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth-helpers', () => ({
  requireOwner: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    maintenanceSet: {
      findFirst: vi.fn(),
    },
    maintenanceSetItem: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimitByUser: vi.fn(() => null),
  RATE_LIMIT_PRESETS: { API_USER: { interval: 60_000, maxRequests: 100 } },
}));

import { PATCH } from '../route';
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

const REORDER_ITEMS = [
  { id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', sortOrder: 0 },
  { id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', sortOrder: 1 },
  { id: 'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', sortOrder: 2 },
];

const MOCK_SET = {
  id: SET_ID,
  companyId: 'co-1',
  catalogId: 'cat-1',
  createdAt: new Date(),
};

function makeRequest(body: unknown): Request {
  return new Request(
    `http://localhost/api/maintenance-sets/${SET_ID}/items/reorder`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
}

function makeParams(id: string = SET_ID): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe('PATCH /api/maintenance-sets/[id]/items/reorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies sortOrder transactionally and returns success', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OK);
    vi.mocked(prisma.maintenanceSet.findFirst).mockResolvedValue(MOCK_SET as never);
    vi.mocked(prisma.maintenanceSetItem.findMany).mockResolvedValue(
      REORDER_ITEMS.map((i) => ({ id: i.id })) as never,
    );
    vi.mocked(prisma.$transaction).mockImplementation(async (ops) => {
      return Array.isArray(ops) ? ops.map(() => ({ id: 'x' })) : [];
    });

    const res = await PATCH(makeRequest({ items: REORDER_ITEMS }) as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(vi.mocked(prisma.maintenanceSet.findFirst)).toHaveBeenCalledWith({
      where: { id: SET_ID, companyId: 'co-1' },
    });
    expect(vi.mocked(prisma.maintenanceSetItem.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: REORDER_ITEMS.map((i) => i.id) }, maintenanceSetId: SET_ID },
      }),
    );
    const txCall = vi.mocked(prisma.$transaction).mock.calls[0][0];
    expect(Array.isArray(txCall)).toBe(true);
    expect((txCall as unknown as unknown[]).length).toBe(REORDER_ITEMS.length);
  });

  it('returns 400 when some item IDs do not belong to the set', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OK);
    vi.mocked(prisma.maintenanceSet.findFirst).mockResolvedValue(MOCK_SET as never);
    // Only 2 of 3 IDs found → invalid IDs
    vi.mocked(prisma.maintenanceSetItem.findMany).mockResolvedValue(
      [{ id: REORDER_ITEMS[0].id }, { id: REORDER_ITEMS[1].id }] as never,
    );

    const res = await PATCH(makeRequest({ items: REORDER_ITEMS }) as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Ungültige Item-IDs');
    expect(vi.mocked(prisma.$transaction)).not.toHaveBeenCalled();
  });

  it('returns 404 when set belongs to another tenant (cross-tenant)', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OK);
    vi.mocked(prisma.maintenanceSet.findFirst).mockResolvedValue(null);

    const res = await PATCH(makeRequest({ items: REORDER_ITEMS }) as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Wartungsset nicht gefunden');
    expect(vi.mocked(prisma.$transaction)).not.toHaveBeenCalled();
  });

  it('returns 403 when caller is a TECHNICIAN', async () => {
    vi.mocked(requireOwner).mockRejectedValue(new Error('Forbidden'));

    const res = await PATCH(makeRequest({ items: REORDER_ITEMS }) as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Nur Inhaber dürfen Wartungssets verwalten');
  });
});
