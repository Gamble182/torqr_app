import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth-helpers', () => ({
  requireOwner: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    maintenanceSet: {
      findFirst: vi.fn(),
    },
    inventoryItem: {
      findFirst: vi.fn(),
    },
    maintenanceSetItem: {
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

const AUTH_OK = {
  userId: 'owner-1',
  companyId: 'co-1',
  role: 'OWNER' as const,
  email: 'o@x.de',
  name: 'Owner',
};

const SET_ID = 'set-abc-123';
const INV_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

const MOCK_SET = {
  id: SET_ID,
  companyId: 'co-1',
  catalogId: 'cat-1',
  createdAt: new Date(),
};

const VALID_PART_BODY = {
  category: 'SPARE_PART',
  description: 'Dichtungsring',
  quantity: 2,
  unit: 'Stck',
};

const VALID_PART_BODY_WITH_INV = {
  ...VALID_PART_BODY,
  inventoryItemId: INV_ID,
};

function makeRequest(body: unknown): Request {
  return new Request(`http://localhost/api/maintenance-sets/${SET_ID}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeParams(id: string = SET_ID): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe('POST /api/maintenance-sets/[id]/items', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates item scoped to parent set and returns 201', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OK);
    vi.mocked(prisma.maintenanceSet.findFirst).mockResolvedValue(MOCK_SET as never);
    const newItem = {
      id: 'item-new-1',
      maintenanceSetId: SET_ID,
      category: 'SPARE_PART',
      description: 'Dichtungsring',
      quantity: 2,
      unit: 'Stck',
      required: true,
      sortOrder: 0,
      inventoryItemId: null,
      note: null,
      articleNumber: null,
    };
    vi.mocked(prisma.maintenanceSetItem.create).mockResolvedValue(newItem as never);

    const res = await POST(makeRequest(VALID_PART_BODY) as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('item-new-1');
    expect(vi.mocked(prisma.maintenanceSet.findFirst)).toHaveBeenCalledWith({
      where: { id: SET_ID, companyId: 'co-1' },
    });
    expect(vi.mocked(prisma.maintenanceSetItem.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ maintenanceSetId: SET_ID }),
      }),
    );
  });

  it('returns 400 when category is TOOL and inventoryItemId is provided (Zod refine)', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OK);

    const toolWithInv = {
      category: 'TOOL',
      description: 'Manometer',
      quantity: 1,
      unit: 'Stck',
      inventoryItemId: INV_ID,
    };

    const res = await POST(makeRequest(toolWithInv) as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Validierungsfehler');
    expect(body.details).toBeDefined();
    expect(body.details[0].message).toBe('Werkzeug darf nicht an ein Lagerteil gebunden sein');
  });

  it('returns 404 when parent set does not belong to the caller\'s company', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OK);
    vi.mocked(prisma.maintenanceSet.findFirst).mockResolvedValue(null);

    const res = await POST(makeRequest(VALID_PART_BODY) as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Wartungsset nicht gefunden');
    expect(vi.mocked(prisma.maintenanceSetItem.create)).not.toHaveBeenCalled();
  });

  it('returns 404 when inventoryItemId belongs to a different tenant (cross-tenant guard)', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OK);
    vi.mocked(prisma.maintenanceSet.findFirst).mockResolvedValue(MOCK_SET as never);
    // inventoryItem not found for this companyId → cross-tenant attempt
    vi.mocked(prisma.inventoryItem.findFirst).mockResolvedValue(null);

    const res = await POST(makeRequest(VALID_PART_BODY_WITH_INV) as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Lagerteil nicht gefunden');
    // Verify the guard uses companyId from auth, not from request
    expect(vi.mocked(prisma.inventoryItem.findFirst)).toHaveBeenCalledWith({
      where: { id: INV_ID, companyId: 'co-1' },
    });
    expect(vi.mocked(prisma.maintenanceSetItem.create)).not.toHaveBeenCalled();
  });

  it('returns 403 when caller is a TECHNICIAN', async () => {
    vi.mocked(requireOwner).mockRejectedValue(new Error('Forbidden'));

    const res = await POST(makeRequest(VALID_PART_BODY) as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Nur Inhaber dürfen Wartungssets verwalten');
  });
});
