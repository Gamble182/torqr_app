import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth-helpers', () => ({
  requireOwner: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    customerSystemPartOverride: {
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimitByUser: vi.fn(() => null),
  RATE_LIMIT_PRESETS: { API_USER: { interval: 60_000, maxRequests: 100 } },
}));

import { DELETE } from '../route';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

const AUTH_OWNER = {
  userId: 'owner-1',
  companyId: 'co-1',
  role: 'OWNER' as const,
  email: 'o@x.de',
  name: 'Owner',
};

const OVERRIDE_ID = 'eeee5555-9c0b-4ef8-bb6d-6bb9bd380a11';

function makeRequest(): Request {
  return new Request(`http://localhost/api/overrides/${OVERRIDE_ID}`, {
    method: 'DELETE',
  });
}

function makeParams(id = OVERRIDE_ID): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe('DELETE /api/overrides/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('DELETE happy path → 200, deletes the override', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);
    vi.mocked(prisma.customerSystemPartOverride.findFirst).mockResolvedValue({
      id: OVERRIDE_ID,
      customerSystemId: 'sys-1',
      action: 'ADD',
    } as never);
    vi.mocked(prisma.customerSystemPartOverride.delete).mockResolvedValue({
      id: OVERRIDE_ID,
    } as never);

    const res = await DELETE(makeRequest() as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    // Cross-tenant guard: where-clause MUST scope by customerSystem.companyId.
    // Pinned shape — refactors must not drop the relational tenant filter.
    expect(vi.mocked(prisma.customerSystemPartOverride.findFirst)).toHaveBeenCalledWith({
      where: { id: OVERRIDE_ID, customerSystem: { companyId: 'co-1' } },
    });
    expect(vi.mocked(prisma.customerSystemPartOverride.delete)).toHaveBeenCalledWith({
      where: { id: OVERRIDE_ID },
    });
  });

  it('DELETE as TECHNICIAN → 403', async () => {
    vi.mocked(requireOwner).mockRejectedValue(new Error('Forbidden'));

    const res = await DELETE(makeRequest() as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Nur Inhaber dürfen Abweichungen löschen');
    expect(vi.mocked(prisma.customerSystemPartOverride.findFirst)).not.toHaveBeenCalled();
    expect(vi.mocked(prisma.customerSystemPartOverride.delete)).not.toHaveBeenCalled();
  });

  it('DELETE cross-tenant (override belongs to another company) → 404, no delete', async () => {
    vi.mocked(requireOwner).mockResolvedValue(AUTH_OWNER);
    // findFirst with companyId filter returns null when override is in another tenant.
    vi.mocked(prisma.customerSystemPartOverride.findFirst).mockResolvedValue(null);

    const res = await DELETE(makeRequest() as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Abweichung nicht gefunden');
    // Critical: must not attempt delete after guard fail (would leak intent / could break with raw id).
    expect(vi.mocked(prisma.customerSystemPartOverride.delete)).not.toHaveBeenCalled();
    // Pin where-shape so the relational tenant filter cannot be silently dropped.
    expect(vi.mocked(prisma.customerSystemPartOverride.findFirst)).toHaveBeenCalledWith({
      where: { id: OVERRIDE_ID, customerSystem: { companyId: 'co-1' } },
    });
  });

  it('DELETE without auth → 401', async () => {
    vi.mocked(requireOwner).mockRejectedValue(new Error('Unauthorized'));

    const res = await DELETE(makeRequest() as never, makeParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Nicht autorisiert');
    expect(vi.mocked(prisma.customerSystemPartOverride.findFirst)).not.toHaveBeenCalled();
    expect(vi.mocked(prisma.customerSystemPartOverride.delete)).not.toHaveBeenCalled();
  });
});
