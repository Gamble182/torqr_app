import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth-helpers', () => ({
  requireAuth: vi.fn(),
  requireOwner: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    customerSystem: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/rate-limit', async () => {
  const actual = await vi.importActual<typeof import('@/lib/rate-limit')>('@/lib/rate-limit');
  return {
    ...actual,
    rateLimitByUser: vi.fn().mockResolvedValue(null),
  };
});

vi.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: vi.fn(),
  deleteMaintenancePhoto: vi.fn().mockResolvedValue(undefined),
}));

import { POST, DELETE } from '../route';
import { requireAuth, requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getSupabaseAdmin } from '@/lib/supabase';

function makeRequest(formData?: FormData, jsonBody?: unknown): Request {
  if (formData) {
    return new Request('http://localhost/api/systems/sys-1/photos', {
      method: 'POST',
      body: formData,
    });
  }
  return new Request('http://localhost/api/systems/sys-1/photos', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jsonBody ?? {}),
  });
}

function mockSupabase(uploadError: { message: string } | null = null) {
  const upload = vi.fn().mockResolvedValue({ error: uploadError });
  const getPublicUrl = vi
    .fn()
    .mockReturnValue({ data: { publicUrl: 'https://cdn.example/photo.jpg' } });
  vi.mocked(getSupabaseAdmin).mockReturnValue({
    storage: { from: () => ({ upload, getPublicUrl }) },
  } as never);
  return { upload, getPublicUrl };
}

function makeValidFile(mime = 'image/jpeg', size = 1024): File {
  const buf = new Uint8Array(size);
  return new File([buf], 'photo.jpg', { type: mime });
}

const OWNER_CTX = {
  userId: 'owner-1',
  companyId: 'co-1',
  role: 'OWNER' as const,
  email: 'o@x.de',
  name: 'Owner',
};

const TECH_CTX = {
  userId: 'tech-1',
  companyId: 'co-1',
  role: 'TECHNICIAN' as const,
  email: 't@x.de',
  name: 'Tech',
};

describe('POST /api/systems/[id]/photos', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uploads a photo and returns the updated photos array (OWNER)', async () => {
    vi.mocked(requireAuth).mockResolvedValue(OWNER_CTX);
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue({
      id: 'sys-1',
      assignedToUserId: null,
      photos: [],
    } as never);
    vi.mocked(prisma.customerSystem.update).mockResolvedValue({
      photos: ['https://cdn.example/photo.jpg'],
    } as never);
    mockSupabase();

    const fd = new FormData();
    fd.append('file', makeValidFile());
    const res = await POST(makeRequest(fd) as never, {
      params: Promise.resolve({ id: 'sys-1' }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.url).toBe('https://cdn.example/photo.jpg');
    expect(body.photos).toEqual(['https://cdn.example/photo.jpg']);
  });

  it('rejects TECHNICIAN when system is not assigned to them', async () => {
    vi.mocked(requireAuth).mockResolvedValue(TECH_CTX);
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue({
      id: 'sys-1',
      assignedToUserId: 'other-user',
      photos: [],
    } as never);

    const fd = new FormData();
    fd.append('file', makeValidFile());
    const res = await POST(makeRequest(fd) as never, {
      params: Promise.resolve({ id: 'sys-1' }),
    });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
  });

  it('allows TECHNICIAN when system is assigned to them', async () => {
    vi.mocked(requireAuth).mockResolvedValue(TECH_CTX);
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue({
      id: 'sys-1',
      assignedToUserId: 'tech-1',
      photos: [],
    } as never);
    vi.mocked(prisma.customerSystem.update).mockResolvedValue({
      photos: ['https://cdn.example/photo.jpg'],
    } as never);
    mockSupabase();

    const fd = new FormData();
    fd.append('file', makeValidFile());
    const res = await POST(makeRequest(fd) as never, {
      params: Promise.resolve({ id: 'sys-1' }),
    });

    expect(res.status).toBe(200);
  });

  it('returns 404 when system is not in the company', async () => {
    vi.mocked(requireAuth).mockResolvedValue(OWNER_CTX);
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue(null);

    const fd = new FormData();
    fd.append('file', makeValidFile());
    const res = await POST(makeRequest(fd) as never, {
      params: Promise.resolve({ id: 'sys-1' }),
    });
    expect(res.status).toBe(404);
  });

  it('rejects when the 5-photo limit is already reached', async () => {
    vi.mocked(requireAuth).mockResolvedValue(OWNER_CTX);
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue({
      id: 'sys-1',
      assignedToUserId: null,
      photos: ['a', 'b', 'c', 'd', 'e'],
    } as never);

    const fd = new FormData();
    fd.append('file', makeValidFile());
    const res = await POST(makeRequest(fd) as never, {
      params: Promise.resolve({ id: 'sys-1' }),
    });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/Maximal 5 Fotos/);
  });

  it('rejects unsupported MIME types', async () => {
    vi.mocked(requireAuth).mockResolvedValue(OWNER_CTX);
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue({
      id: 'sys-1',
      assignedToUserId: null,
      photos: [],
    } as never);

    const fd = new FormData();
    fd.append('file', makeValidFile('image/gif'));
    const res = await POST(makeRequest(fd) as never, {
      params: Promise.resolve({ id: 'sys-1' }),
    });

    expect(res.status).toBe(400);
  });

  it('rejects files larger than 5MB', async () => {
    vi.mocked(requireAuth).mockResolvedValue(OWNER_CTX);
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue({
      id: 'sys-1',
      assignedToUserId: null,
      photos: [],
    } as never);

    const fd = new FormData();
    fd.append('file', makeValidFile('image/jpeg', 6 * 1024 * 1024));
    const res = await POST(makeRequest(fd) as never, {
      params: Promise.resolve({ id: 'sys-1' }),
    });

    expect(res.status).toBe(400);
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new Error('Unauthorized'));

    const fd = new FormData();
    fd.append('file', makeValidFile());
    const res = await POST(makeRequest(fd) as never, {
      params: Promise.resolve({ id: 'sys-1' }),
    });

    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/systems/[id]/photos', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes a photo from the array (OWNER)', async () => {
    vi.mocked(requireOwner).mockResolvedValue(OWNER_CTX);
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue({
      id: 'sys-1',
      photos: ['https://cdn.example/a.jpg', 'https://cdn.example/b.jpg'],
    } as never);
    vi.mocked(prisma.customerSystem.update).mockResolvedValue({
      photos: ['https://cdn.example/b.jpg'],
    } as never);

    const res = await DELETE(
      makeRequest(undefined, { url: 'https://cdn.example/a.jpg' }) as never,
      { params: Promise.resolve({ id: 'sys-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.photos).toEqual(['https://cdn.example/b.jpg']);
  });

  it('returns 403 when TECHNICIAN attempts to delete', async () => {
    vi.mocked(requireOwner).mockRejectedValue(new Error('Forbidden'));

    const res = await DELETE(
      makeRequest(undefined, { url: 'https://cdn.example/a.jpg' }) as never,
      { params: Promise.resolve({ id: 'sys-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toMatch(/Nur Inhaber/);
  });

  it('returns 404 when the URL is not in the photos array', async () => {
    vi.mocked(requireOwner).mockResolvedValue(OWNER_CTX);
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue({
      id: 'sys-1',
      photos: ['https://cdn.example/a.jpg'],
    } as never);

    const res = await DELETE(
      makeRequest(undefined, { url: 'https://cdn.example/missing.jpg' }) as never,
      { params: Promise.resolve({ id: 'sys-1' }) }
    );

    expect(res.status).toBe(404);
  });

  it('returns 404 when the system is not in the company', async () => {
    vi.mocked(requireOwner).mockResolvedValue(OWNER_CTX);
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue(null);

    const res = await DELETE(
      makeRequest(undefined, { url: 'https://cdn.example/a.jpg' }) as never,
      { params: Promise.resolve({ id: 'sys-1' }) }
    );

    expect(res.status).toBe(404);
  });

  it('validates the URL shape', async () => {
    vi.mocked(requireOwner).mockResolvedValue(OWNER_CTX);

    const res = await DELETE(
      makeRequest(undefined, { url: 'not-a-url' }) as never,
      { params: Promise.resolve({ id: 'sys-1' }) }
    );

    expect(res.status).toBe(400);
  });
});
