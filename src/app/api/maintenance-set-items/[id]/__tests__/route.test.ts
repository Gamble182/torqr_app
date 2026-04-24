import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth-helpers', () => ({
  requireOwner: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    maintenanceSetItem: {
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    inventoryItem: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimitByUser: vi.fn(() => null),
  RATE_LIMIT_PRESETS: { API_USER: { interval: 60_000, maxRequests: 100 } },
}));

import { PATCH, DELETE } from '../route';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

const AUTH_OK = {
  userId: 'owner-1',
  companyId: 'co-1',
  role: 'OWNER' as const,
  email: 'o@x.de',
  name: 'Owner',
};

const ITEM_ID = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const INV_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

const MOCK_ITEM = {
  id: ITEM_ID,
  maintenanceSetId: 'set-abc-123',
  category: 'SPARE_PART',
  description: 'Dichtungsring',
  quantity: 2,
  unit: 'Stck',
  required: true,
  sortOrder: 0,
  inventoryItemId: null,
  note: null,
  articleNumber: null,
  maintenanceSet: { companyId: 'co-1' },
};

function makeRequest(body?: unknown): Request {
  return new Request(`http://localhost/api/maintenance-set-items/${ITEM_ID}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
}

function makeParams(id: string = ITEM_ID): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe('PATCH /api/maintenance-set-items/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates item and returns 200 with updated row', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OK);
    vi.mocked(prisma.maintenanceSetItem.findFirst).mockResolvedValue(MOCK_ITEM as never);
    const updated = { ...MOCK_ITEM, description: 'Neuer Ring', quantity: 3 };
    vi.mocked(prisma.maintenanceSetItem.update).mockResolvedValue(updated as never);

    const res = await PATCH(
      makeRequest({ description: 'Neuer Ring', quantity: 3 }) as never,
      makeParams(),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.description).toBe('Neuer Ring');
    expect(vi.mocked(prisma.maintenanceSetItem.findFirst)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ITEM_ID, maintenanceSet: { companyId: 'co-1' } },
      }),
    );
    expect(vi.mocked(prisma.maintenanceSetItem.update)).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: ITEM_ID } }),
    );
  });

  it('returns 404 when item belongs to another tenant (cross-tenant)', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OK);
    vi.mocked(prisma.maintenanceSetItem.findFirst).mockResolvedValue(null);

    const res = await PATCH(makeRequest({ description: 'X' }) as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Teil nicht gefunden');
    expect(vi.mocked(prisma.maintenanceSetItem.update)).not.toHaveBeenCalled();
  });

  it('returns 404 when inventoryItemId belongs to a different tenant', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OK);
    vi.mocked(prisma.maintenanceSetItem.findFirst).mockResolvedValue(MOCK_ITEM as never);
    vi.mocked(prisma.inventoryItem.findFirst).mockResolvedValue(null);

    const res = await PATCH(
      makeRequest({ inventoryItemId: INV_ID }) as never,
      makeParams(),
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Lagerteil nicht gefunden');
    expect(vi.mocked(prisma.inventoryItem.findFirst)).toHaveBeenCalledWith({
      where: { id: INV_ID, companyId: 'co-1' },
    });
    expect(vi.mocked(prisma.maintenanceSetItem.update)).not.toHaveBeenCalled();
  });

  it('returns 403 when caller is a TECHNICIAN', async () => {
    vi.mocked(requireOwner).mockRejectedValue(new Error('Forbidden'));

    const res = await PATCH(makeRequest({ description: 'X' }) as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Nur Inhaber dürfen Wartungssets verwalten');
  });
});

describe('DELETE /api/maintenance-set-items/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes item and returns success', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OK);
    vi.mocked(prisma.maintenanceSetItem.findFirst).mockResolvedValue(MOCK_ITEM as never);
    vi.mocked(prisma.maintenanceSetItem.delete).mockResolvedValue(MOCK_ITEM as never);

    const deleteReq = new Request(
      `http://localhost/api/maintenance-set-items/${ITEM_ID}`,
      { method: 'DELETE' },
    );
    const res = await DELETE(deleteReq as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(vi.mocked(prisma.maintenanceSetItem.delete)).toHaveBeenCalledWith({
      where: { id: ITEM_ID },
    });
  });

  it('returns 404 when item belongs to another tenant (cross-tenant)', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OK);
    vi.mocked(prisma.maintenanceSetItem.findFirst).mockResolvedValue(null);

    const deleteReq = new Request(
      `http://localhost/api/maintenance-set-items/${ITEM_ID}`,
      { method: 'DELETE' },
    );
    const res = await DELETE(deleteReq as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Teil nicht gefunden');
    expect(vi.mocked(prisma.maintenanceSetItem.delete)).not.toHaveBeenCalled();
  });

  it('returns 403 when caller is a TECHNICIAN', async () => {
    vi.mocked(requireOwner).mockRejectedValue(new Error('Forbidden'));

    const deleteReq = new Request(
      `http://localhost/api/maintenance-set-items/${ITEM_ID}`,
      { method: 'DELETE' },
    );
    const res = await DELETE(deleteReq as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Nur Inhaber dürfen Wartungssets verwalten');
  });
});
