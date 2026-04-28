import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth-helpers', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    customerSystem: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimitByUser: vi.fn(() => null),
  RATE_LIMIT_PRESETS: { API_USER: { interval: 60_000, maxRequests: 100 } },
}));

vi.mock('@/lib/maintenance-parts', () => ({
  getEffectivePartsForSystem: vi.fn(),
}));

import { GET } from '../route';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getEffectivePartsForSystem } from '@/lib/maintenance-parts';

const SYSTEM_ID = 'aaaa1111-9c0b-4ef8-bb6d-6bb9bd380a11';
const OWNER_ID = 'owner-1';
const TECH_ID = 'tech-1';
const OTHER_USER_ID = 'tech-other';

const AUTH_OWNER = {
  userId: OWNER_ID,
  companyId: 'co-1',
  role: 'OWNER' as const,
  email: 'o@x.de',
  name: 'Owner',
};

const AUTH_TECH = {
  userId: TECH_ID,
  companyId: 'co-1',
  role: 'TECHNICIAN' as const,
  email: 't@x.de',
  name: 'Tech',
};

const SENTINEL_PARTS = [
  {
    source: 'DEFAULT',
    setItemId: 'set-item-1',
    category: 'WEAR',
    description: 'O-Ring',
    articleNumber: 'OR-1',
    quantity: 1,
    unit: 'Stck',
    required: true,
    note: null,
    sortOrder: 0,
    inventoryItem: null,
  },
];

function makeRequest(): Request {
  return new Request(
    `http://localhost/api/customer-systems/${SYSTEM_ID}/effective-parts`,
    { method: 'GET' },
  );
}

function makeParams(id = SYSTEM_ID): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe('GET /api/customer-systems/[id]/effective-parts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('OWNER GET, system in tenant → 200 with resolver output', async () => {
    vi.mocked(requireAuth).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue({
      id: SYSTEM_ID,
      assignedToUserId: null,
    } as never);
    vi.mocked(getEffectivePartsForSystem).mockResolvedValue(SENTINEL_PARTS as never);

    const res = await GET(makeRequest() as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(SENTINEL_PARTS);
    expect(vi.mocked(getEffectivePartsForSystem)).toHaveBeenCalledWith(SYSTEM_ID, 'co-1');
  });

  it('OWNER GET, system NOT in tenant → 404, resolver not called', async () => {
    vi.mocked(requireAuth).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue(null);

    const res = await GET(makeRequest() as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('System nicht gefunden');
    expect(vi.mocked(getEffectivePartsForSystem)).not.toHaveBeenCalled();
  });

  it('TECHNICIAN GET, system assigned to caller → 200', async () => {
    vi.mocked(requireAuth).mockResolvedValue(AUTH_TECH);
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue({
      id: SYSTEM_ID,
      assignedToUserId: TECH_ID,
    } as never);
    vi.mocked(getEffectivePartsForSystem).mockResolvedValue(SENTINEL_PARTS as never);

    const res = await GET(makeRequest() as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(SENTINEL_PARTS);
    expect(vi.mocked(getEffectivePartsForSystem)).toHaveBeenCalledWith(SYSTEM_ID, 'co-1');
  });

  it('TECHNICIAN GET, system assigned to a different user → 403 "Zugriff verweigert", resolver not called', async () => {
    vi.mocked(requireAuth).mockResolvedValue(AUTH_TECH);
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue({
      id: SYSTEM_ID,
      assignedToUserId: OTHER_USER_ID,
    } as never);

    const res = await GET(makeRequest() as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Zugriff verweigert');
    expect(vi.mocked(getEffectivePartsForSystem)).not.toHaveBeenCalled();
  });

  it('TECHNICIAN GET, system unassigned (assignedToUserId === null) → 403', async () => {
    vi.mocked(requireAuth).mockResolvedValue(AUTH_TECH);
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue({
      id: SYSTEM_ID,
      assignedToUserId: null,
    } as never);

    const res = await GET(makeRequest() as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Zugriff verweigert');
    expect(vi.mocked(getEffectivePartsForSystem)).not.toHaveBeenCalled();
  });

  it('Unauthorized → 401, no findFirst, no resolver', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new Error('Unauthorized'));

    const res = await GET(makeRequest() as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Nicht autorisiert');
    expect(vi.mocked(prisma.customerSystem.findFirst)).not.toHaveBeenCalled();
    expect(vi.mocked(getEffectivePartsForSystem)).not.toHaveBeenCalled();
  });

  it('findFirst SELECT shape pin: only id + assignedToUserId, scoped by id + companyId', async () => {
    vi.mocked(requireAuth).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue({
      id: SYSTEM_ID,
      assignedToUserId: null,
    } as never);
    vi.mocked(getEffectivePartsForSystem).mockResolvedValue([] as never);

    await GET(makeRequest() as never, makeParams());

    expect(vi.mocked(prisma.customerSystem.findFirst)).toHaveBeenCalledWith({
      where: { id: SYSTEM_ID, companyId: 'co-1' },
      select: { id: true, assignedToUserId: true },
    });
  });
});
