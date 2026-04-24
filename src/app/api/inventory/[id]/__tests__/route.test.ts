import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth-helpers', () => ({
  requireAuth: vi.fn(),
  requireOwner: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    inventoryItem: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    maintenanceSetItem: {
      count: vi.fn(),
    },
    customerSystemPartOverride: {
      count: vi.fn(),
    },
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimitByUser: vi.fn(() => null),
  RATE_LIMIT_PRESETS: { API_USER: { interval: 60_000, maxRequests: 100 } },
}));

import { GET, PATCH, DELETE } from '../route';
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

function makeRequest(method: string, body?: unknown): Request {
  return new Request('http://localhost/api/inventory/inv-1', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

function makeParams(id = 'inv-1'): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------
describe('GET /api/inventory/[id]', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns item for OWNER', async () => {
    vi.mocked(requireAuth).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.inventoryItem.findFirst).mockResolvedValue(ITEM as never);

    const res = await GET(makeRequest('GET') as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('inv-1');
    expect(vi.mocked(prisma.inventoryItem.findFirst)).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'inv-1', companyId: 'co-1' } }),
    );
  });

  it('returns item for TECHNICIAN', async () => {
    vi.mocked(requireAuth).mockResolvedValue(AUTH_TECHNICIAN);
    vi.mocked(prisma.inventoryItem.findFirst).mockResolvedValue(ITEM as never);

    const res = await GET(makeRequest('GET') as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 404 when item belongs to other tenant (cross-tenant)', async () => {
    vi.mocked(requireAuth).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.inventoryItem.findFirst).mockResolvedValue(null);

    const res = await GET(makeRequest('GET') as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Lagerteil nicht gefunden');
  });
});

// ---------------------------------------------------------------------------
// PATCH
// ---------------------------------------------------------------------------
describe('PATCH /api/inventory/[id]', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('PATCH as OWNER updates description and minStock', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.inventoryItem.findFirst).mockResolvedValue(ITEM as never);
    vi.mocked(prisma.inventoryItem.findUnique).mockResolvedValue(null);
    const updated = { ...ITEM, description: 'Neuer Name', minStock: 10 };
    vi.mocked(prisma.inventoryItem.update).mockResolvedValue(updated as never);

    const res = await PATCH(
      makeRequest('PATCH', { description: 'Neuer Name', minStock: 10 }) as never,
      makeParams(),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.description).toBe('Neuer Name');
  });

  it('PATCH rejects currentStock in body → 400 with Zod details', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.inventoryItem.findFirst).mockResolvedValue(ITEM as never);

    const res = await PATCH(
      makeRequest('PATCH', { currentStock: 99 }) as never,
      makeParams(),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Validierungsfehler');
    expect(body.details).toBeDefined();
  });

  it('PATCH with duplicate articleNumber → 409', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.inventoryItem.findFirst).mockResolvedValue(ITEM as never);
    // findUnique returns ANOTHER item with same articleNumber
    vi.mocked(prisma.inventoryItem.findUnique).mockResolvedValue({
      id: 'inv-OTHER',
      companyId: 'co-1',
      articleNumber: 'ART-99',
    } as never);

    const res = await PATCH(
      makeRequest('PATCH', { articleNumber: 'ART-99' }) as never,
      makeParams(),
    );
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Artikelnummer existiert bereits im Lager');
  });

  it('PATCH allows articleNumber change if uniqueness hit is the same row (dup.id === id)', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);
    // findFirst returns item with its CURRENT articleNumber (ART-OLD)
    vi.mocked(prisma.inventoryItem.findFirst).mockResolvedValue({ ...ITEM, articleNumber: 'ART-OLD' } as never);
    // findUnique returns the SAME row (same id) — outer guard evaluates true (ART-NEW !== ART-OLD),
    // but dup.id === id so it is NOT treated as a conflict
    vi.mocked(prisma.inventoryItem.findUnique).mockResolvedValue({ ...ITEM, articleNumber: 'ART-NEW' } as never);
    vi.mocked(prisma.inventoryItem.update).mockResolvedValue({ ...ITEM, articleNumber: 'ART-NEW' } as never);

    const res = await PATCH(
      makeRequest('PATCH', { articleNumber: 'ART-NEW' }) as never,
      makeParams(),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(vi.mocked(prisma.inventoryItem.findUnique)).toHaveBeenCalled();
    expect(vi.mocked(prisma.inventoryItem.update)).toHaveBeenCalled();
  });

  it('PATCH as TECHNICIAN → 403', async () => {
    vi.mocked(requireOwner).mockRejectedValue(new Error('Forbidden'));

    const res = await PATCH(
      makeRequest('PATCH', { description: 'Test' }) as never,
      makeParams(),
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Nur Inhaber dürfen Lager ändern');
  });
});

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------
describe('DELETE /api/inventory/[id]', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('DELETE blocked when references exist → 400 with count in message', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.inventoryItem.findFirst).mockResolvedValue(ITEM as never);
    vi.mocked(prisma.maintenanceSetItem.count).mockResolvedValue(3);
    vi.mocked(prisma.customerSystemPartOverride.count).mockResolvedValue(2);

    const res = await DELETE(makeRequest('DELETE') as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('5');
    expect(body.error).toContain('Wartungsset-Einträgen');
  });

  it('DELETE succeeds when no references exist', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.inventoryItem.findFirst).mockResolvedValue(ITEM as never);
    vi.mocked(prisma.maintenanceSetItem.count).mockResolvedValue(0);
    vi.mocked(prisma.customerSystemPartOverride.count).mockResolvedValue(0);
    vi.mocked(prisma.inventoryItem.delete).mockResolvedValue(ITEM as never);

    const res = await DELETE(makeRequest('DELETE') as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(vi.mocked(prisma.inventoryItem.delete)).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'inv-1' } }),
    );
  });

  it('DELETE as TECHNICIAN → 403', async () => {
    vi.mocked(requireOwner).mockRejectedValue(new Error('Forbidden'));

    const res = await DELETE(makeRequest('DELETE') as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Nur Inhaber dürfen Lager ändern');
  });

  it('DELETE cross-tenant → 404', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.inventoryItem.findFirst).mockResolvedValue(null);

    const res = await DELETE(makeRequest('DELETE') as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Lagerteil nicht gefunden');
  });
});
