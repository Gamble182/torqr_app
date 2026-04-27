import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth-helpers', () => ({
  requireOwner: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    customerSystem: {
      findFirst: vi.fn(),
    },
    maintenanceSetItem: {
      findFirst: vi.fn(),
    },
    inventoryItem: {
      findFirst: vi.fn(),
    },
    customerSystemPartOverride: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimitByUser: vi.fn(() => null),
  RATE_LIMIT_PRESETS: { API_USER: { interval: 60_000, maxRequests: 100 } },
}));

import { POST } from '../route';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

const AUTH_OWNER = {
  userId: 'owner-1',
  companyId: 'co-1',
  role: 'OWNER' as const,
  email: 'o@x.de',
  name: 'Owner',
};

const SYSTEM_ID = 'aaaa1111-9c0b-4ef8-bb6d-6bb9bd380a11';
const CATALOG_ID = 'bbbb2222-9c0b-4ef8-bb6d-6bb9bd380a11';
const SET_ITEM_ID = 'cccc3333-9c0b-4ef8-bb6d-6bb9bd380a11';
const INV_ID = 'dddd4444-9c0b-4ef8-bb6d-6bb9bd380a11';

const SYSTEM = {
  id: SYSTEM_ID,
  companyId: 'co-1',
  catalogId: CATALOG_ID,
};

function makeRequest(body: unknown): Request {
  return new Request(`http://localhost/api/customer-systems/${SYSTEM_ID}/overrides`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeParams(id = SYSTEM_ID): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe('POST /api/customer-systems/[id]/overrides', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- ADD branch ----------------------------------------------------------

  it('POST ADD with valid payload → 201, persists with all ADD fields', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue(SYSTEM as never);
    const created = {
      id: 'ovr-1',
      customerSystemId: SYSTEM_ID,
      action: 'ADD',
      category: 'SPARE_PART',
      description: 'Spezial-Dichtung',
      articleNumber: 'ART-X',
      quantity: 2,
      unit: 'Stck',
      required: true,
      note: 'Nur für dieses Gerät',
      sortOrder: 5,
      inventoryItemId: null,
      excludedSetItemId: null,
      createdAt: new Date(),
    };
    vi.mocked(prisma.customerSystemPartOverride.create).mockResolvedValue(created as never);

    const res = await POST(
      makeRequest({
        action: 'ADD',
        category: 'SPARE_PART',
        description: 'Spezial-Dichtung',
        articleNumber: 'ART-X',
        quantity: 2,
        unit: 'Stck',
        required: true,
        note: 'Nur für dieses Gerät',
        sortOrder: 5,
      }) as never,
      makeParams(),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('ovr-1');

    const createCall = vi.mocked(prisma.customerSystemPartOverride.create).mock.calls[0][0];
    expect(createCall.data).toEqual(
      expect.objectContaining({
        customerSystemId: SYSTEM_ID,
        action: 'ADD',
        category: 'SPARE_PART',
        description: 'Spezial-Dichtung',
        articleNumber: 'ART-X',
        quantity: 2,
        unit: 'Stck',
        required: true,
        note: 'Nur für dieses Gerät',
        sortOrder: 5,
        inventoryItemId: null,
      }),
    );
    // EXCLUDE-only field must NOT be set on ADD branch.
    expect(createCall.data).not.toHaveProperty('excludedSetItemId');
  });

  it('POST ADD with TOOL + inventoryItemId → 400 (Zod refine)', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);

    const res = await POST(
      makeRequest({
        action: 'ADD',
        category: 'TOOL',
        description: 'Spezialschlüssel',
        quantity: 1,
        unit: 'Stck',
        inventoryItemId: INV_ID,
      }) as never,
      makeParams(),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Validierungsfehler');
    expect(body.details).toBeDefined();
    expect(vi.mocked(prisma.customerSystemPartOverride.create)).not.toHaveBeenCalled();
  });

  it('POST ADD with foreign-company inventoryItemId → 404', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue(SYSTEM as never);
    vi.mocked(prisma.inventoryItem.findFirst).mockResolvedValue(null);

    const res = await POST(
      makeRequest({
        action: 'ADD',
        category: 'SPARE_PART',
        description: 'Dichtring',
        quantity: 1,
        unit: 'Stck',
        inventoryItemId: INV_ID,
      }) as never,
      makeParams(),
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Lagerteil nicht gefunden');
    // Tenant scoping must be enforced via companyId from requireOwner.
    expect(vi.mocked(prisma.inventoryItem.findFirst)).toHaveBeenCalledWith({
      where: { id: INV_ID, companyId: 'co-1' },
    });
    expect(vi.mocked(prisma.customerSystemPartOverride.create)).not.toHaveBeenCalled();
  });

  it('POST ADD with invalid payload (missing description) → 400', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);

    const res = await POST(
      makeRequest({
        action: 'ADD',
        category: 'SPARE_PART',
        // description missing
        quantity: 1,
        unit: 'Stck',
      }) as never,
      makeParams(),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Validierungsfehler');
    expect(body.details).toBeDefined();
  });

  it('POST ADD with quantity ≤ 0 → 400', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);

    const res = await POST(
      makeRequest({
        action: 'ADD',
        category: 'SPARE_PART',
        description: 'Dichtring',
        quantity: 0,
        unit: 'Stck',
      }) as never,
      makeParams(),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Validierungsfehler');
  });

  // --- EXCLUDE branch -------------------------------------------------------

  it('POST EXCLUDE with valid excludedSetItemId (same company, same catalog) → 201', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue(SYSTEM as never);
    vi.mocked(prisma.maintenanceSetItem.findFirst).mockResolvedValue({
      id: SET_ITEM_ID,
      maintenanceSetId: 'set-1',
    } as never);
    const created = {
      id: 'ovr-excl',
      customerSystemId: SYSTEM_ID,
      action: 'EXCLUDE',
      excludedSetItemId: SET_ITEM_ID,
      createdAt: new Date(),
    };
    vi.mocked(prisma.customerSystemPartOverride.create).mockResolvedValue(created as never);

    const res = await POST(
      makeRequest({
        action: 'EXCLUDE',
        excludedSetItemId: SET_ITEM_ID,
      }) as never,
      makeParams(),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('ovr-excl');

    // Cross-tenant guard: where-clause MUST scope by companyId AND catalogId of system.
    expect(vi.mocked(prisma.maintenanceSetItem.findFirst)).toHaveBeenCalledWith({
      where: {
        id: SET_ITEM_ID,
        maintenanceSet: { companyId: 'co-1', catalogId: CATALOG_ID },
      },
    });

    const createCall = vi.mocked(prisma.customerSystemPartOverride.create).mock.calls[0][0];
    expect(createCall.data).toEqual({
      customerSystemId: SYSTEM_ID,
      action: 'EXCLUDE',
      excludedSetItemId: SET_ITEM_ID,
    });
  });

  it('POST EXCLUDE with excludedSetItemId from other-company set → 404', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue(SYSTEM as never);
    vi.mocked(prisma.maintenanceSetItem.findFirst).mockResolvedValue(null);

    const res = await POST(
      makeRequest({
        action: 'EXCLUDE',
        excludedSetItemId: SET_ITEM_ID,
      }) as never,
      makeParams(),
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Standard-Teil nicht gefunden');
    expect(vi.mocked(prisma.customerSystemPartOverride.create)).not.toHaveBeenCalled();
  });

  it('POST EXCLUDE with set item from caller company but different catalog → 404 (where-clause asserts catalogId filter)', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue(SYSTEM as never);
    // The route passes catalogId in the where-clause, so a Prisma findFirst
    // for a set-item belonging to a DIFFERENT catalogId returns null.
    vi.mocked(prisma.maintenanceSetItem.findFirst).mockResolvedValue(null);

    const res = await POST(
      makeRequest({
        action: 'EXCLUDE',
        excludedSetItemId: SET_ITEM_ID,
      }) as never,
      makeParams(),
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Standard-Teil nicht gefunden');
    // Locking the where-clause shape so future refactors cannot silently
    // drop the catalogId filter (Decision §4 — load-bearing).
    expect(vi.mocked(prisma.maintenanceSetItem.findFirst)).toHaveBeenCalledWith({
      where: {
        id: SET_ITEM_ID,
        maintenanceSet: { companyId: 'co-1', catalogId: CATALOG_ID },
      },
    });
  });

  // --- Auth + tenant guards -------------------------------------------------

  it('POST when system is not in caller company → 404', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue(null);

    const res = await POST(
      makeRequest({
        action: 'EXCLUDE',
        excludedSetItemId: SET_ITEM_ID,
      }) as never,
      makeParams(),
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('System nicht gefunden');
    expect(vi.mocked(prisma.maintenanceSetItem.findFirst)).not.toHaveBeenCalled();
    expect(vi.mocked(prisma.customerSystemPartOverride.create)).not.toHaveBeenCalled();
  });

  it('POST as TECHNICIAN → 403', async () => {
    vi.mocked(requireOwner).mockRejectedValue(new Error('Forbidden'));

    const res = await POST(
      makeRequest({
        action: 'EXCLUDE',
        excludedSetItemId: SET_ITEM_ID,
      }) as never,
      makeParams(),
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Nur Inhaber dürfen Abweichungen anlegen');
  });

  it('POST without auth → 401', async () => {
    vi.mocked(requireOwner).mockRejectedValue(new Error('Unauthorized'));

    const res = await POST(
      makeRequest({
        action: 'EXCLUDE',
        excludedSetItemId: SET_ITEM_ID,
      }) as never,
      makeParams(),
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Nicht autorisiert');
  });
});
