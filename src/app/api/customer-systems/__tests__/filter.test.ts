import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth-helpers', () => ({
  requireAuth: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    customerSystem: { findMany: vi.fn() },
    customer: { findUnique: vi.fn() },
  },
}));

import { GET } from '../route';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

function makeRequest(qs: string): Request {
  return new Request(`http://x/api/customer-systems${qs}`);
}

describe('GET /api/customer-systems — assignee filter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue({
      userId: 'owner-1', companyId: 'co-1', role: 'OWNER', email: 'o@x.de', name: 'O',
    });
    vi.mocked(prisma.customerSystem.findMany).mockResolvedValue([] as never);
  });

  it('applies assignedToUserId: null when assignee=unassigned', async () => {
    await GET(makeRequest('?assignee=unassigned') as never);
    const args = vi.mocked(prisma.customerSystem.findMany).mock.calls[0]![0] as {
      where: { assignedToUserId?: unknown };
    };
    expect(args.where.assignedToUserId).toBeNull();
  });

  it('applies assignedToUserId: <id> when assignee is a uuid', async () => {
    await GET(makeRequest('?assignee=11111111-1111-4111-8111-111111111111') as never);
    const args = vi.mocked(prisma.customerSystem.findMany).mock.calls[0]![0] as {
      where: { assignedToUserId?: unknown };
    };
    expect(args.where.assignedToUserId).toBe('11111111-1111-4111-8111-111111111111');
  });

  it('does not filter when assignee=all', async () => {
    await GET(makeRequest('?assignee=all') as never);
    const args = vi.mocked(prisma.customerSystem.findMany).mock.calls[0]![0] as {
      where: { assignedToUserId?: unknown };
    };
    expect(args.where.assignedToUserId).toBeUndefined();
  });

  it('rejects invalid assignee value with 400', async () => {
    const res = await GET(makeRequest('?assignee=garbage') as never);
    expect(res.status).toBe(400);
  });

  it('TECHNICIAN role always filters by own userId regardless of assignee param', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      userId: 'tech-1', companyId: 'co-1', role: 'TECHNICIAN', email: 't@x.de', name: 'T',
    });
    await GET(makeRequest('?assignee=unassigned') as never);
    const args = vi.mocked(prisma.customerSystem.findMany).mock.calls[0]![0] as {
      where: { assignedToUserId?: unknown };
    };
    expect(args.where.assignedToUserId).toBe('tech-1');
  });
});
