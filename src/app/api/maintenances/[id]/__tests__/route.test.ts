import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Prisma } from '@prisma/client';

vi.mock('@/lib/auth-helpers', () => ({
  requireAuth: vi.fn(),
  requireOwner: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    maintenance: {
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    inventoryMovement: {
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    inventoryItem: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimitByUser: vi.fn(() => null),
  RATE_LIMIT_PRESETS: { API_USER: { interval: 60_000, maxRequests: 100 } },
}));

vi.mock('@/lib/supabase', () => ({
  deleteMaintenancePhoto: vi.fn(),
}));

import { DELETE } from '../route';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { deleteMaintenancePhoto } from '@/lib/supabase';

const AUTH_OWNER = {
  userId: 'owner-1',
  companyId: 'co-1',
  role: 'OWNER' as const,
  email: 'o@x.de',
  name: 'Owner',
};

// UUIDs follow the strict v1-v8 format (third group starts 1-8, fourth 8/9/a/b)
const MAINTENANCE_ID = '22222222-2222-4222-8222-222222222222';
const INV_ID_A = '33333333-3333-4333-8333-333333333333';
const INV_ID_B = '44444444-4444-4444-8444-444444444444';
const INV_ID_C = '55555555-5555-4555-8555-555555555555';
const MOVEMENT_ID_1 = '66666666-6666-4666-8666-666666666666';
const MOVEMENT_ID_2 = '77777777-7777-4777-8777-777777777777';
const MOVEMENT_ID_3 = '88888888-8888-4888-8888-888888888888';

/**
 * Decimal stub. The DELETE handler calls `.neg()` and `.abs()` on
 * `quantityChange`. We mint a minimal duck-typed object that returns
 * fresh stubs from those methods so `expect.objectContaining` works.
 */
function mockDecimal(n: number): Prisma.Decimal {
  return {
    neg: () => mockDecimal(-n),
    abs: () => mockDecimal(Math.abs(n)),
    toString: () => n.toString(),
    valueOf: () => n,
  } as unknown as Prisma.Decimal;
}

function makeRequest(): Request {
  return new Request(`http://localhost/api/maintenances/${MAINTENANCE_ID}`, {
    method: 'DELETE',
  });
}

const PARAMS = { params: Promise.resolve({ id: MAINTENANCE_ID }) };

function maintenanceRow(photos: string[] = []) {
  return {
    id: MAINTENANCE_ID,
    systemId: 'sys-1',
    companyId: 'co-1',
    userId: 'tech-1',
    date: new Date('2026-04-27T00:00:00.000Z'),
    notes: null,
    photos,
    checklistData: null,
  };
}

describe('DELETE /api/maintenances/[id] — R1 reversal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.maintenance.findFirst).mockResolvedValue(maintenanceRow() as never);
    vi.mocked(prisma.maintenance.delete).mockResolvedValue(maintenanceRow() as never);
    vi.mocked(prisma.inventoryMovement.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.inventoryMovement.create).mockResolvedValue({ id: 'mov-new' } as never);
    vi.mocked(prisma.inventoryMovement.updateMany).mockResolvedValue({ count: 0 } as never);
    vi.mocked(prisma.inventoryItem.update).mockResolvedValue({ id: INV_ID_A } as never);
    // $transaction passes prisma through as `tx` so nested calls hit our mocks.
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: unknown) => {
      if (typeof callback === 'function') {
        return await (callback as (tx: typeof prisma) => Promise<unknown>)(prisma);
      }
      return [];
    });
  });

  // -------------------------------------------------------------------------
  // Case 1: OWNER, no related movements, no photos — unchanged behavior
  // -------------------------------------------------------------------------
  it('OWNER with no related movements and no photos returns 200 and deletes', async () => {
    const res = await DELETE(makeRequest() as never, PARAMS);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, message: 'Wartung erfolgreich gelöscht' });

    // Pin the findMany shape — must include companyId guard (Decision §4)
    expect(prisma.inventoryMovement.findMany).toHaveBeenCalledWith({
      where: { maintenanceId: MAINTENANCE_ID, companyId: 'co-1', reason: 'MAINTENANCE_USE' },
    });

    // No movements found → no reversal calls
    expect(prisma.inventoryMovement.create).not.toHaveBeenCalled();
    expect(prisma.inventoryItem.update).not.toHaveBeenCalled();

    // updateMany still called — implementer must NOT conditionally skip it
    expect(prisma.inventoryMovement.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.inventoryMovement.updateMany).toHaveBeenCalledWith({
      where: { maintenanceId: MAINTENANCE_ID, companyId: 'co-1', reason: 'MAINTENANCE_USE' },
      data: { maintenanceId: null },
    });

    expect(prisma.maintenance.delete).toHaveBeenCalledWith({ where: { id: MAINTENANCE_ID } });

    // No photos to delete
    expect(deleteMaintenancePhoto).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Case 2: OWNER, 3 MAINTENANCE_USE movements — full reversal
  // -------------------------------------------------------------------------
  it('OWNER with 3 MAINTENANCE_USE movements inserts 3 CORRECTION reversals and restores stock', async () => {
    vi.mocked(prisma.inventoryMovement.findMany).mockResolvedValue([
      {
        id: MOVEMENT_ID_1,
        companyId: 'co-1',
        inventoryItemId: INV_ID_A,
        quantityChange: mockDecimal(-2),
        reason: 'MAINTENANCE_USE',
        maintenanceId: MAINTENANCE_ID,
        userId: 'tech-1',
      },
      {
        id: MOVEMENT_ID_2,
        companyId: 'co-1',
        inventoryItemId: INV_ID_B,
        quantityChange: mockDecimal(-5),
        reason: 'MAINTENANCE_USE',
        maintenanceId: MAINTENANCE_ID,
        userId: 'tech-1',
      },
      {
        id: MOVEMENT_ID_3,
        companyId: 'co-1',
        inventoryItemId: INV_ID_C,
        quantityChange: mockDecimal(-1),
        reason: 'MAINTENANCE_USE',
        maintenanceId: MAINTENANCE_ID,
        userId: 'tech-1',
      },
    ] as never);
    vi.mocked(prisma.inventoryMovement.updateMany).mockResolvedValue({ count: 3 } as never);

    const res = await DELETE(makeRequest() as never, PARAMS);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    // 3 CORRECTION movements inserted — opposite-sign, null maintenanceId, German note, audit userId
    expect(prisma.inventoryMovement.create).toHaveBeenCalledTimes(3);

    const createCalls = vi.mocked(prisma.inventoryMovement.create).mock.calls;
    for (const [arg] of createCalls) {
      expect(arg.data).toMatchObject({
        companyId: 'co-1',
        reason: 'CORRECTION',
        maintenanceId: null,
        note: 'Rückbuchung: Wartung gelöscht',
        userId: 'owner-1',
      });
      expect(arg.data.inventoryItemId).toBeDefined();
      expect(arg.data.quantityChange).toBeDefined();
    }

    // Verify the per-movement quantityChange is the negation (positive) of the original
    expect(Number(createCalls[0][0].data.quantityChange)).toBe(2);
    expect(Number(createCalls[1][0].data.quantityChange)).toBe(5);
    expect(Number(createCalls[2][0].data.quantityChange)).toBe(1);

    // Stock incremented by abs(originalQty) per movement
    expect(prisma.inventoryItem.update).toHaveBeenCalledTimes(3);
    const updateCalls = vi.mocked(prisma.inventoryItem.update).mock.calls;
    expect(updateCalls[0][0].where).toEqual({ id: INV_ID_A });
    expect(Number((updateCalls[0][0].data as { currentStock: { increment: number } }).currentStock.increment)).toBe(2);
    expect(updateCalls[1][0].where).toEqual({ id: INV_ID_B });
    expect(Number((updateCalls[1][0].data as { currentStock: { increment: number } }).currentStock.increment)).toBe(5);
    expect(updateCalls[2][0].where).toEqual({ id: INV_ID_C });
    expect(Number((updateCalls[2][0].data as { currentStock: { increment: number } }).currentStock.increment)).toBe(1);

    // Originals detached (maintenanceId = null) so cascade doesn't wipe history
    expect(prisma.inventoryMovement.updateMany).toHaveBeenCalledWith({
      where: { maintenanceId: MAINTENANCE_ID, companyId: 'co-1', reason: 'MAINTENANCE_USE' },
      data: { maintenanceId: null },
    });

    expect(prisma.maintenance.delete).toHaveBeenCalledWith({ where: { id: MAINTENANCE_ID } });
  });

  // -------------------------------------------------------------------------
  // Case 3: OWNER with photos — cleanup runs AFTER transaction commits
  // -------------------------------------------------------------------------
  it('OWNER with photos calls deleteMaintenancePhoto once per URL after the transaction', async () => {
    const photos = [
      'https://x.supabase.co/storage/v1/object/public/maintenance-photos/co-1/a.jpg',
      'https://x.supabase.co/storage/v1/object/public/maintenance-photos/co-1/b.jpg',
    ];
    vi.mocked(prisma.maintenance.findFirst).mockResolvedValue(maintenanceRow(photos) as never);

    // Track call order across $transaction and deleteMaintenancePhoto
    const callOrder: string[] = [];
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: unknown) => {
      callOrder.push('transaction');
      if (typeof callback === 'function') {
        return await (callback as (tx: typeof prisma) => Promise<unknown>)(prisma);
      }
      return [];
    });
    vi.mocked(deleteMaintenancePhoto).mockImplementation(async () => {
      callOrder.push('photo');
    });

    const res = await DELETE(makeRequest() as never, PARAMS);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    expect(deleteMaintenancePhoto).toHaveBeenCalledTimes(2);
    expect(deleteMaintenancePhoto).toHaveBeenNthCalledWith(1, photos[0]);
    expect(deleteMaintenancePhoto).toHaveBeenNthCalledWith(2, photos[1]);

    // Order: transaction first, then photo cleanup
    expect(callOrder).toEqual(['transaction', 'photo', 'photo']);
  });

  // -------------------------------------------------------------------------
  // Case 4: TECHNICIAN → 403, no DB access at all
  // -------------------------------------------------------------------------
  it('TECHNICIAN (Forbidden) returns 403 and skips findFirst/transaction/delete/photos', async () => {
    vi.mocked(requireOwner).mockRejectedValue(new Error('Forbidden'));

    const res = await DELETE(makeRequest() as never, PARAMS);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body).toEqual({ success: false, error: 'Nur Inhaber können Wartungen löschen' });

    expect(prisma.maintenance.findFirst).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.inventoryMovement.findMany).not.toHaveBeenCalled();
    expect(prisma.maintenance.delete).not.toHaveBeenCalled();
    expect(deleteMaintenancePhoto).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Case 5: maintenance not found / cross-tenant → 404
  // -------------------------------------------------------------------------
  it('returns 404 when maintenance is not found, no transaction or delete', async () => {
    vi.mocked(prisma.maintenance.findFirst).mockResolvedValue(null);

    const res = await DELETE(makeRequest() as never, PARAMS);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ success: false, error: 'Wartung nicht gefunden' });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.inventoryMovement.findMany).not.toHaveBeenCalled();
    expect(prisma.maintenance.delete).not.toHaveBeenCalled();
    expect(deleteMaintenancePhoto).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Case 6: atomicity — throw inside transaction → 500, no delete, no photos
  // -------------------------------------------------------------------------
  it('atomicity: inventoryMovement.create throws → 500, maintenance.delete and photos skipped', async () => {
    vi.mocked(prisma.maintenance.findFirst).mockResolvedValue(
      maintenanceRow(['https://x.supabase.co/storage/v1/object/public/maintenance-photos/co-1/a.jpg']) as never,
    );
    vi.mocked(prisma.inventoryMovement.findMany).mockResolvedValue([
      {
        id: MOVEMENT_ID_1,
        companyId: 'co-1',
        inventoryItemId: INV_ID_A,
        quantityChange: mockDecimal(-2),
        reason: 'MAINTENANCE_USE',
        maintenanceId: MAINTENANCE_ID,
        userId: 'tech-1',
      },
    ] as never);
    vi.mocked(prisma.inventoryMovement.create).mockRejectedValue(new Error('DB blew up'));

    const res = await DELETE(makeRequest() as never, PARAMS);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ success: false, error: 'Fehler beim Löschen der Wartung' });

    // Transaction was attempted; the throw bubbled up before delete + photos
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.maintenance.delete).not.toHaveBeenCalled();
    expect(deleteMaintenancePhoto).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Case 7: Unauthorized → 401
  // -------------------------------------------------------------------------
  it('returns 401 when requireOwner throws Unauthorized', async () => {
    vi.mocked(requireOwner).mockRejectedValue(new Error('Unauthorized'));

    const res = await DELETE(makeRequest() as never, PARAMS);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ success: false, error: 'Nicht autorisiert' });

    expect(prisma.maintenance.findFirst).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(deleteMaintenancePhoto).not.toHaveBeenCalled();
  });
});
