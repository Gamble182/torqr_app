import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Prisma } from '@prisma/client';

vi.mock('@/lib/auth-helpers', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    customerSystem: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    maintenance: {
      create: vi.fn(),
      update: vi.fn(),
    },
    inventoryItem: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    inventoryMovement: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimitByUser: vi.fn(() => null),
  RATE_LIMIT_PRESETS: { API_USER: { interval: 60_000, maxRequests: 100 } },
}));

import { POST } from '../route';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

const AUTH_OWNER = {
  userId: 'owner-1',
  companyId: 'co-1',
  role: 'OWNER' as const,
  email: 'o@x.de',
  name: 'Owner',
};

// UUIDs must satisfy the strict v1-v8 / nil / max format used by uuidSchema
// (z.uuid()): third group starts with 1-8, fourth group with 8/9/a/b.
const SYSTEM = {
  id: '11111111-1111-4111-8111-111111111111',
  companyId: 'co-1',
  catalogId: 'cat-1',
  maintenanceInterval: 12,
};

const MAINTENANCE_ID = '22222222-2222-4222-8222-222222222222';
const INV_ID_A = '33333333-3333-4333-8333-333333333333';
const INV_ID_B = '44444444-4444-4444-8444-444444444444';
const FOREIGN_INV_ID = '55555555-5555-4555-8555-555555555555';
const SET_ITEM_ID = '66666666-6666-4666-8666-666666666666';

/**
 * Decimal stub. The route only calls `.lt(0)` and `.toString()` on
 * `currentStock`. We avoid importing the actual Prisma.Decimal class
 * (heavyweight) and instead mint a minimal duck-typed object.
 */
function mockDecimal(n: number): Prisma.Decimal {
  return {
    lt: (x: number) => n < x,
    toString: () => n.toString(),
  } as unknown as Prisma.Decimal;
}

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/maintenances', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function createdMaintenance() {
  return {
    id: MAINTENANCE_ID,
    systemId: SYSTEM.id,
    companyId: 'co-1',
    userId: 'owner-1',
    date: new Date('2026-04-27T00:00:00.000Z'),
    notes: null,
    photos: [],
    checklistData: null,
    system: {
      id: SYSTEM.id,
      catalog: { id: 'cat-1' },
      customer: { id: 'cust-1', name: 'Kunde' },
    },
  };
}

describe('POST /api/maintenances — partsUsed transactional handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue(SYSTEM as never);
    vi.mocked(prisma.maintenance.create).mockResolvedValue(createdMaintenance() as never);
    vi.mocked(prisma.maintenance.update).mockResolvedValue(createdMaintenance() as never);
    vi.mocked(prisma.customerSystem.update).mockResolvedValue(SYSTEM as never);
    // $transaction passes prisma through as `tx` so nested calls hit our mocks.
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: unknown) => {
      if (typeof callback === 'function') {
        return await (callback as (tx: typeof prisma) => Promise<unknown>)(prisma);
      }
      return [];
    });
  });

  // -------------------------------------------------------------------------
  // Case 1: empty partsUsed — preserves existing behavior
  // -------------------------------------------------------------------------
  it('with partsUsed=[] returns 201 with empty warnings, no inventory calls', async () => {
    const res = await POST(
      makeRequest({
        systemId: SYSTEM.id,
        date: '2026-04-27T00:00:00.000Z',
        partsUsed: [],
      }) as never,
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(MAINTENANCE_ID);
    expect(body.negativeStockWarnings).toEqual([]);

    expect(prisma.inventoryItem.findFirst).not.toHaveBeenCalled();
    expect(prisma.inventoryMovement.create).not.toHaveBeenCalled();
    expect(prisma.inventoryItem.update).not.toHaveBeenCalled();

    // Snapshot still merged into checklistData (empty array)
    const updateCall = vi.mocked(prisma.maintenance.update).mock.calls[0][0];
    expect(updateCall.where).toEqual({ id: MAINTENANCE_ID });
    expect(updateCall.data.checklistData).toEqual({ partsUsed: [] });

    // Existing post-create behavior preserved
    expect(prisma.customerSystem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: SYSTEM.id },
        data: expect.objectContaining({
          lastMaintenance: expect.any(Date),
          nextMaintenance: expect.any(Date),
        }),
      }),
    );
  });

  // -------------------------------------------------------------------------
  // Case 2: linked entry decrements stock and creates movement
  // -------------------------------------------------------------------------
  it('with one linked entry creates MAINTENANCE_USE movement and decrements stock', async () => {
    vi.mocked(prisma.inventoryItem.findFirst).mockResolvedValue({
      id: INV_ID_A,
      companyId: 'co-1',
      currentStock: mockDecimal(5),
    } as never);
    vi.mocked(prisma.inventoryItem.update).mockResolvedValue({
      id: INV_ID_A,
      currentStock: mockDecimal(3),
    } as never);
    vi.mocked(prisma.inventoryMovement.create).mockResolvedValue({ id: 'mov-1' } as never);

    const res = await POST(
      makeRequest({
        systemId: SYSTEM.id,
        partsUsed: [
          {
            sourceType: 'AD_HOC',
            inventoryItemId: INV_ID_A,
            description: 'Dichtring',
            quantity: 2,
            unit: 'Stck',
          },
        ],
      }) as never,
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.negativeStockWarnings).toEqual([]);

    expect(prisma.inventoryItem.findFirst).toHaveBeenCalledWith({
      where: { id: INV_ID_A, companyId: 'co-1' },
    });

    expect(prisma.inventoryMovement.create).toHaveBeenCalledWith({
      data: {
        companyId: 'co-1',
        inventoryItemId: INV_ID_A,
        quantityChange: -2,
        reason: 'MAINTENANCE_USE',
        maintenanceId: MAINTENANCE_ID,
        userId: 'owner-1',
      },
    });

    expect(prisma.inventoryItem.update).toHaveBeenCalledWith({
      where: { id: INV_ID_A },
      data: { currentStock: { decrement: 2 } },
    });
  });

  // -------------------------------------------------------------------------
  // Case 3: AD_HOC entry without inventoryItemId — snapshot only
  // -------------------------------------------------------------------------
  it('with AD_HOC entry missing inventoryItemId persists snapshot but creates no movement', async () => {
    const res = await POST(
      makeRequest({
        systemId: SYSTEM.id,
        partsUsed: [
          {
            sourceType: 'AD_HOC',
            description: 'Manuell',
            quantity: 1,
            unit: 'Stck',
          },
        ],
      }) as never,
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.negativeStockWarnings).toEqual([]);

    expect(prisma.inventoryItem.findFirst).not.toHaveBeenCalled();
    expect(prisma.inventoryMovement.create).not.toHaveBeenCalled();
    expect(prisma.inventoryItem.update).not.toHaveBeenCalled();

    const updateCall = vi.mocked(prisma.maintenance.update).mock.calls[0][0];
    const data = updateCall.data as { checklistData: { partsUsed: unknown[] } };
    expect(data.checklistData.partsUsed).toHaveLength(1);
    expect(data.checklistData.partsUsed[0]).toMatchObject({
      sourceType: 'AD_HOC',
      description: 'Manuell',
      quantity: 1,
    });
  });

  // -------------------------------------------------------------------------
  // Case 4: stock allowed to go negative — N3 policy emits warning
  // -------------------------------------------------------------------------
  it('with decrement below zero returns 201 plus negativeStockWarnings, stock not clamped', async () => {
    vi.mocked(prisma.inventoryItem.findFirst).mockResolvedValue({
      id: INV_ID_A,
      companyId: 'co-1',
      currentStock: mockDecimal(2),
    } as never);
    vi.mocked(prisma.inventoryItem.update).mockResolvedValue({
      id: INV_ID_A,
      currentStock: mockDecimal(-5),
    } as never);
    vi.mocked(prisma.inventoryMovement.create).mockResolvedValue({ id: 'mov-1' } as never);

    const res = await POST(
      makeRequest({
        systemId: SYSTEM.id,
        partsUsed: [
          {
            sourceType: 'AD_HOC',
            inventoryItemId: INV_ID_A,
            description: 'Dichtring',
            quantity: 7,
            unit: 'Stck',
          },
        ],
      }) as never,
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.negativeStockWarnings).toEqual([
      { inventoryItemId: INV_ID_A, newStock: '-5' },
    ]);

    // Movement IS still created — no clamp
    expect(prisma.inventoryMovement.create).toHaveBeenCalledTimes(1);
    expect(prisma.inventoryItem.update).toHaveBeenCalledWith({
      where: { id: INV_ID_A },
      data: { currentStock: { decrement: 7 } },
    });
  });

  // -------------------------------------------------------------------------
  // Case 5: cross-tenant inventoryItemId — findFirst returns null → 500
  // -------------------------------------------------------------------------
  it('with cross-tenant inventoryItemId throws and returns 500', async () => {
    // findFirst returns null — simulating an item from another tenant.
    vi.mocked(prisma.inventoryItem.findFirst).mockResolvedValue(null);

    const res = await POST(
      makeRequest({
        systemId: SYSTEM.id,
        partsUsed: [
          {
            sourceType: 'AD_HOC',
            inventoryItemId: FOREIGN_INV_ID,
            description: 'Foreign',
            quantity: 1,
            unit: 'Stck',
          },
        ],
      }) as never,
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Fehler beim Erstellen der Wartung');

    // Cross-tenant guard: companyId MUST be in the where clause.
    expect(prisma.inventoryItem.findFirst).toHaveBeenCalledWith({
      where: { id: FOREIGN_INV_ID, companyId: 'co-1' },
    });

    // Nothing persisted past the throw
    expect(prisma.inventoryMovement.create).not.toHaveBeenCalled();
    expect(prisma.inventoryItem.update).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Case 6: atomicity — throw inside callback bubbles up; no 201 leaks
  // -------------------------------------------------------------------------
  it('atomicity: throw inside transaction propagates as 500, no success response', async () => {
    // Same trigger as case 5 but asserts the response shape boundary —
    // under the mock-mode $transaction, the throw propagates instead of
    // a real rollback. In production this triggers Postgres rollback
    // (verified manually in Task 35).
    vi.mocked(prisma.inventoryItem.findFirst).mockResolvedValue(null);

    const res = await POST(
      makeRequest({
        systemId: SYSTEM.id,
        partsUsed: [
          {
            sourceType: 'AD_HOC',
            inventoryItemId: FOREIGN_INV_ID,
            description: 'Foreign',
            quantity: 1,
            unit: 'Stck',
          },
        ],
      }) as never,
    );
    const body = await res.json();

    expect(res.status).not.toBe(201);
    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    // The maintenance.create runs first inside the callback (mock returns
    // a row), but the throw on the loop's findFirst stops the callback.
    // The OUTER `result` value is never read because the catch block runs.
    expect(prisma.customerSystem.update).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Case 7: mixed entries — one linked, one ad-hoc
  // -------------------------------------------------------------------------
  it('with mixed entries snapshots both but creates only one movement', async () => {
    vi.mocked(prisma.inventoryItem.findFirst).mockResolvedValue({
      id: INV_ID_B,
      companyId: 'co-1',
      currentStock: mockDecimal(10),
    } as never);
    vi.mocked(prisma.inventoryItem.update).mockResolvedValue({
      id: INV_ID_B,
      currentStock: mockDecimal(9),
    } as never);
    vi.mocked(prisma.inventoryMovement.create).mockResolvedValue({ id: 'mov-1' } as never);

    const res = await POST(
      makeRequest({
        systemId: SYSTEM.id,
        partsUsed: [
          {
            sourceType: 'DEFAULT',
            setItemId: SET_ITEM_ID,
            description: 'Filter (default, no inv link)',
            quantity: 1,
            unit: 'Stck',
          },
          {
            sourceType: 'AD_HOC',
            inventoryItemId: INV_ID_B,
            description: 'Schraube',
            quantity: 1,
            unit: 'Stck',
          },
        ],
      }) as never,
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);

    // Only the entry with inventoryItemId triggers findFirst/movement/update
    expect(prisma.inventoryItem.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.inventoryItem.findFirst).toHaveBeenCalledWith({
      where: { id: INV_ID_B, companyId: 'co-1' },
    });
    expect(prisma.inventoryMovement.create).toHaveBeenCalledTimes(1);
    expect(prisma.inventoryItem.update).toHaveBeenCalledTimes(1);

    // Both entries snapshotted
    const updateCall = vi.mocked(prisma.maintenance.update).mock.calls[0][0];
    const data = updateCall.data as { checklistData: { partsUsed: unknown[] } };
    expect(data.checklistData.partsUsed).toHaveLength(2);
  });

  // -------------------------------------------------------------------------
  // Case 8: regression — system not found / cross-tenant → 404
  // -------------------------------------------------------------------------
  it('regression: system cross-tenant returns 404 and skips $transaction', async () => {
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue(null);

    const res = await POST(
      makeRequest({
        systemId: SYSTEM.id,
        partsUsed: [],
      }) as never,
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('System nicht gefunden');

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.maintenance.create).not.toHaveBeenCalled();
  });
});
