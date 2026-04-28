import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth-helpers', () => ({
  requireOwner: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    maintenanceSet: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    systemCatalog: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimitByUser: vi.fn(() => null),
  RATE_LIMIT_PRESETS: { API_USER: { interval: 60_000, maxRequests: 100 } },
}));

import { GET, POST } from '../route';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

const AUTH_OK = {
  userId: 'owner-1',
  companyId: 'co-1',
  role: 'OWNER' as const,
  email: 'o@x.de',
  name: 'Owner',
};

const CATALOG_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

function makeRequest(method: string, body?: unknown, search?: string): Request {
  const url = `http://localhost/api/maintenance-sets${search ? `?${search}` : ''}`;
  return new Request(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('GET /api/maintenance-sets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when no sets exist', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OK);
    vi.mocked(prisma.maintenanceSet.findMany).mockResolvedValue([]);

    const res = await GET(makeRequest('GET') as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('passes catalogId filter to findMany when provided as query param', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OK);
    vi.mocked(prisma.maintenanceSet.findMany).mockResolvedValue([]);

    await GET(makeRequest('GET', undefined, `catalogId=${CATALOG_ID}`) as never);

    expect(vi.mocked(prisma.maintenanceSet.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          companyId: 'co-1',
          catalogId: CATALOG_ID,
        }),
      }),
    );
  });

  it('uses companyId from requireOwner (not from request) for tenant scoping', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OK);
    vi.mocked(prisma.maintenanceSet.findMany).mockResolvedValue([]);

    await GET(makeRequest('GET') as never);

    expect(vi.mocked(prisma.maintenanceSet.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'co-1' }),
      }),
    );
  });

  it('returns 403 when caller is not OWNER', async () => {
    vi.mocked(requireOwner).mockRejectedValue(new Error('Forbidden'));

    const res = await GET(makeRequest('GET') as never);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Nur Inhaber dürfen Wartungssets verwalten');
  });
});

describe('POST /api/maintenance-sets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a new maintenance set with valid catalogId', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OK);
    vi.mocked(prisma.systemCatalog.findUnique).mockResolvedValue({
      id: CATALOG_ID,
      manufacturer: 'Vaillant',
      name: 'ecoTEC plus',
      systemType: 'HEATING',
    } as never);
    vi.mocked(prisma.maintenanceSet.findUnique).mockResolvedValue(null);
    const newSet = {
      id: 'set-1',
      companyId: 'co-1',
      catalogId: CATALOG_ID,
      createdAt: new Date(),
      catalog: { manufacturer: 'Vaillant', name: 'ecoTEC plus', systemType: 'HEATING' },
    };
    vi.mocked(prisma.maintenanceSet.create).mockResolvedValue(newSet as never);

    const res = await POST(makeRequest('POST', { catalogId: CATALOG_ID }) as never);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('set-1');
  });

  it('returns 409 when a set for this catalog already exists', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OK);
    vi.mocked(prisma.systemCatalog.findUnique).mockResolvedValue({
      id: CATALOG_ID,
    } as never);
    vi.mocked(prisma.maintenanceSet.findUnique).mockResolvedValue({
      id: 'existing-set',
      companyId: 'co-1',
      catalogId: CATALOG_ID,
    } as never);

    const res = await POST(makeRequest('POST', { catalogId: CATALOG_ID }) as never);
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Für dieses Modell existiert bereits ein Wartungsset');
  });

  it('returns 404 when catalog entry does not exist', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OK);
    vi.mocked(prisma.systemCatalog.findUnique).mockResolvedValue(null);

    const res = await POST(makeRequest('POST', { catalogId: CATALOG_ID }) as never);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Katalog-Eintrag nicht gefunden');
  });

  it('returns 403 when caller is not OWNER', async () => {
    vi.mocked(requireOwner).mockRejectedValue(new Error('Forbidden'));

    const res = await POST(makeRequest('POST', { catalogId: CATALOG_ID }) as never);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Nur Inhaber dürfen Wartungssets verwalten');
  });

  it('returns 400 for invalid body (missing catalogId)', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OK);

    const res = await POST(makeRequest('POST', { catalogId: 'not-a-uuid' }) as never);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Validierungsfehler');
  });
});
