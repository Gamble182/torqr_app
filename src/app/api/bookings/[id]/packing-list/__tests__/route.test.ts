import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth-helpers', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    booking: {
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

const BOOKING_ID = 'bk-aaaa1111-9c0b-4ef8-bb6d-6bb9bd380a11';
const SYSTEM_ID = 'sys-bbbb2222-9c0b-4ef8-bb6d-6bb9bd380a22';
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

const SENTINEL_CUSTOMER = {
  id: 'cust-1',
  name: 'Mustermann GmbH',
  email: 'kunde@example.de',
  phone: '+49 123',
};

const SENTINEL_SYSTEM = {
  id: SYSTEM_ID,
  serialNumber: 'SN-1',
  catalog: { manufacturer: 'Viessmann', name: 'Vitodens 200', systemType: 'GAS' },
  assignedTo: { id: TECH_ID, name: 'Tech' },
};

const SENTINEL_TECHNICIAN = { id: TECH_ID, name: 'Tech' };
const SENTINEL_USER = { id: 'creator-1', name: 'Creator' };

function makeBooking(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: BOOKING_ID,
    startTime: new Date('2026-05-01T08:00:00.000Z'),
    endTime: new Date('2026-05-01T10:00:00.000Z'),
    title: 'Wartung',
    systemId: SYSTEM_ID,
    assignedToUserId: TECH_ID,
    customer: SENTINEL_CUSTOMER,
    system: SENTINEL_SYSTEM,
    assignedTo: SENTINEL_TECHNICIAN,
    user: SENTINEL_USER,
    ...overrides,
  };
}

function makeRequest(): Request {
  return new Request(
    `http://localhost/api/bookings/${BOOKING_ID}/packing-list`,
    { method: 'GET' },
  );
}

function makeParams(id = BOOKING_ID): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe('GET /api/bookings/[id]/packing-list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('OWNER GET, booking in tenant → 200 with booking, customer, system, technician, effectiveParts', async () => {
    vi.mocked(requireAuth).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.booking.findFirst).mockResolvedValue(makeBooking() as never);
    vi.mocked(getEffectivePartsForSystem).mockResolvedValue(SENTINEL_PARTS as never);

    const res = await GET(makeRequest() as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.booking).toEqual({
      id: BOOKING_ID,
      startTime: new Date('2026-05-01T08:00:00.000Z').toISOString(),
      endTime: new Date('2026-05-01T10:00:00.000Z').toISOString(),
      title: 'Wartung',
    });
    expect(body.data.customer).toEqual(SENTINEL_CUSTOMER);
    expect(body.data.system).toEqual(SENTINEL_SYSTEM);
    expect(body.data.technician).toEqual(SENTINEL_TECHNICIAN);
    expect(body.data.effectiveParts).toEqual(SENTINEL_PARTS);
    expect(vi.mocked(getEffectivePartsForSystem)).toHaveBeenCalledWith(SYSTEM_ID, 'co-1');
  });

  it('TECHNICIAN GET own assigned booking → 200', async () => {
    vi.mocked(requireAuth).mockResolvedValue(AUTH_TECH);
    vi.mocked(prisma.booking.findFirst).mockResolvedValue(
      makeBooking({ assignedToUserId: TECH_ID }) as never,
    );
    vi.mocked(getEffectivePartsForSystem).mockResolvedValue(SENTINEL_PARTS as never);

    const res = await GET(makeRequest() as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.effectiveParts).toEqual(SENTINEL_PARTS);
    expect(vi.mocked(getEffectivePartsForSystem)).toHaveBeenCalledWith(SYSTEM_ID, 'co-1');
  });

  it('TECHNICIAN GET booking assigned to other user → 403 "Zugriff verweigert", resolver not called', async () => {
    vi.mocked(requireAuth).mockResolvedValue(AUTH_TECH);
    vi.mocked(prisma.booking.findFirst).mockResolvedValue(
      makeBooking({ assignedToUserId: OTHER_USER_ID }) as never,
    );

    const res = await GET(makeRequest() as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Zugriff verweigert');
    expect(vi.mocked(getEffectivePartsForSystem)).not.toHaveBeenCalled();
  });

  it('Cross-tenant booking (findFirst returns null) → 404 "Termin nicht gefunden", resolver not called', async () => {
    vi.mocked(requireAuth).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.booking.findFirst).mockResolvedValue(null);

    const res = await GET(makeRequest() as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Termin nicht gefunden');
    expect(vi.mocked(getEffectivePartsForSystem)).not.toHaveBeenCalled();
  });

  it('Booking without systemId → 200 with effectiveParts: [] and system: null, resolver not called', async () => {
    vi.mocked(requireAuth).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.booking.findFirst).mockResolvedValue(
      makeBooking({ systemId: null, system: null }) as never,
    );

    const res = await GET(makeRequest() as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.system).toBeNull();
    expect(body.data.effectiveParts).toEqual([]);
    expect(vi.mocked(getEffectivePartsForSystem)).not.toHaveBeenCalled();
  });

  it('Unauthorized → 401, no findFirst, no resolver', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new Error('Unauthorized'));

    const res = await GET(makeRequest() as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Nicht autorisiert');
    expect(vi.mocked(prisma.booking.findFirst)).not.toHaveBeenCalled();
    expect(vi.mocked(getEffectivePartsForSystem)).not.toHaveBeenCalled();
  });

  it('findFirst INCLUDE shape pin: where { id, companyId } and include carries customer/system/assignedTo/user', async () => {
    vi.mocked(requireAuth).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.booking.findFirst).mockResolvedValue(makeBooking() as never);
    vi.mocked(getEffectivePartsForSystem).mockResolvedValue([] as never);

    await GET(makeRequest() as never, makeParams());

    expect(vi.mocked(prisma.booking.findFirst)).toHaveBeenCalledWith({
      where: { id: BOOKING_ID, companyId: 'co-1' },
      include: {
        customer: true,
        system: {
          include: {
            catalog: true,
            assignedTo: { select: { id: true, name: true } },
          },
        },
        assignedTo: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    });
  });

  it('Resolver delegation pin: getEffectivePartsForSystem called with (booking.systemId, companyId)', async () => {
    vi.mocked(requireAuth).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.booking.findFirst).mockResolvedValue(makeBooking() as never);
    vi.mocked(getEffectivePartsForSystem).mockResolvedValue(SENTINEL_PARTS as never);

    await GET(makeRequest() as never, makeParams());

    expect(vi.mocked(getEffectivePartsForSystem)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(getEffectivePartsForSystem)).toHaveBeenCalledWith(SYSTEM_ID, 'co-1');
  });
});
