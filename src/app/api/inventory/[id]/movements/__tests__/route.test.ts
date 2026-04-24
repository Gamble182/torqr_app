import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth-helpers', () => ({
  requireAuth: vi.fn(),
  requireOwner: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    inventoryItem: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    inventoryMovement: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
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

const ITEM = {
  id: 'inv-1',
  companyId: 'co-1',
  description: 'Dichtring',
  articleNumber: 'ART-42',
  unit: 'Stck',
  minStock: 2,
  currentStock: 5,
};

const MOVEMENTS = [
  {
    id: 'mov-2',
    inventoryItemId: 'inv-1',
    companyId: 'co-1',
    userId: 'owner-1',
    reason: 'RESTOCK',
    quantityChange: 10,
    note: null,
    createdAt: new Date('2026-04-24T10:00:00Z'),
    user: { id: 'owner-1', name: 'Owner' },
  },
  {
    id: 'mov-1',
    inventoryItemId: 'inv-1',
    companyId: 'co-1',
    userId: 'owner-1',
    reason: 'CORRECTION',
    quantityChange: -2,
    note: 'Verlust',
    createdAt: new Date('2026-04-23T09:00:00Z'),
    user: { id: 'owner-1', name: 'Owner' },
  },
];

function makeGetRequest(): Request {
  return new Request('http://localhost/api/inventory/inv-1/movements', {
    method: 'GET',
  });
}

function makePostRequest(body: unknown): Request {
  return new Request('http://localhost/api/inventory/inv-1/movements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeParams(id = 'inv-1'): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------
describe('GET /api/inventory/[id]/movements', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns last 30 movements, newest first', async () => {
    vi.mocked(requireAuth).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.inventoryItem.findFirst).mockResolvedValue(ITEM as never);
    vi.mocked(prisma.inventoryMovement.findMany).mockResolvedValue(MOVEMENTS as never);

    const res = await GET(makeGetRequest() as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(vi.mocked(prisma.inventoryMovement.findMany)).toHaveBeenCalledWith({
      where: { inventoryItemId: 'inv-1' },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { user: { select: { id: true, name: true } } },
    });
  });

  it('GET as TECHNICIAN succeeds → 200', async () => {
    vi.mocked(requireAuth).mockResolvedValue(AUTH_TECHNICIAN);
    vi.mocked(prisma.inventoryItem.findFirst).mockResolvedValue(ITEM as never);
    vi.mocked(prisma.inventoryMovement.findMany).mockResolvedValue([] as never);

    const res = await GET(makeGetRequest() as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('GET cross-tenant → 404', async () => {
    vi.mocked(requireAuth).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.inventoryItem.findFirst).mockResolvedValue(null);

    const res = await GET(makeGetRequest() as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Lagerteil nicht gefunden');
  });
});

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------
describe('POST /api/inventory/[id]/movements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default $transaction mock: callback form passes prisma through as tx
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      if (typeof callback === 'function') {
        return await callback(prisma as never);
      }
      return [];
    });
  });

  it('POST RESTOCK increments currentStock + sets lastRestockedAt', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.inventoryItem.findFirst).mockResolvedValue(ITEM as never);
    const createdMovement = {
      id: 'mov-new',
      inventoryItemId: 'inv-1',
      companyId: 'co-1',
      userId: 'owner-1',
      reason: 'RESTOCK',
      quantityChange: 10,
      note: null,
      createdAt: new Date(),
    };
    vi.mocked(prisma.inventoryMovement.create).mockResolvedValue(createdMovement as never);
    vi.mocked(prisma.inventoryItem.update).mockResolvedValue(ITEM as never);

    const res = await POST(
      makePostRequest({ reason: 'RESTOCK', quantityChange: 10 }) as never,
      makeParams(),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);

    const updateCall = vi.mocked(prisma.inventoryItem.update).mock.calls[0][0];
    expect(updateCall.data.currentStock).toEqual({ increment: 10 });
    expect(updateCall.data.lastRestockedAt).toBeInstanceOf(Date);
  });

  it('POST CORRECTION adjusts currentStock, does NOT touch lastRestockedAt', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.inventoryItem.findFirst).mockResolvedValue(ITEM as never);
    const createdMovement = {
      id: 'mov-new',
      inventoryItemId: 'inv-1',
      companyId: 'co-1',
      userId: 'owner-1',
      reason: 'CORRECTION',
      quantityChange: -3,
      note: 'Verlust',
      createdAt: new Date(),
    };
    vi.mocked(prisma.inventoryMovement.create).mockResolvedValue(createdMovement as never);
    vi.mocked(prisma.inventoryItem.update).mockResolvedValue(ITEM as never);

    const res = await POST(
      makePostRequest({ reason: 'CORRECTION', quantityChange: -3, note: 'Verlust' }) as never,
      makeParams(),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);

    const updateCall = vi.mocked(prisma.inventoryItem.update).mock.calls[0][0];
    expect(updateCall.data.currentStock).toEqual({ increment: -3 });
    expect(updateCall.data).not.toHaveProperty('lastRestockedAt');
  });

  it('POST rejects reason MAINTENANCE_USE → 400 with Zod details', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);

    const res = await POST(
      makePostRequest({ reason: 'MAINTENANCE_USE', quantityChange: 1 }) as never,
      makeParams(),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Validierungsfehler');
    expect(body.details).toBeDefined();
  });

  it('POST rejects quantityChange: 0 → 400 with Zod details', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);

    const res = await POST(
      makePostRequest({ reason: 'RESTOCK', quantityChange: 0 }) as never,
      makeParams(),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Validierungsfehler');
    expect(body.details).toBeDefined();
  });

  it('POST as TECHNICIAN → 403', async () => {
    vi.mocked(requireOwner).mockRejectedValue(new Error('Forbidden'));

    const res = await POST(
      makePostRequest({ reason: 'RESTOCK', quantityChange: 5 }) as never,
      makeParams(),
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Nur Inhaber dürfen Bewegungen buchen');
  });

  it('POST cross-tenant (parent item not found) → 404', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.inventoryItem.findFirst).mockResolvedValue(null);

    const res = await POST(
      makePostRequest({ reason: 'RESTOCK', quantityChange: 5 }) as never,
      makeParams(),
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Lagerteil nicht gefunden');
  });
});
