import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }));

vi.mock('../client', () => ({
  resend: { emails: { send: mockSend } },
  FROM_EMAIL: 'Torqr <noreply@torqr.de>',
  CAL_COM_URL: '',
}));

// Prisma is referenced by other service functions; stub minimally so import succeeds.
vi.mock('@/lib/prisma', () => ({
  prisma: {
    customer: { findUnique: vi.fn(), count: vi.fn() },
    customerSystem: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    booking: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    maintenance: { findMany: vi.fn() },
    emailLog: { create: vi.fn(), count: vi.fn() },
    user: { findUnique: vi.fn(), findMany: vi.fn() },
    inventoryItem: { findMany: vi.fn() },
  },
}));

import { sendBetaLeadNotification, sendDemoRequestNotification } from '../service';

describe('sendBetaLeadNotification', () => {
  beforeEach(() => mockSend.mockReset());

  it('schickt E-Mail mit Subject inkl. Tier', async () => {
    mockSend.mockResolvedValue({ data: { id: 'x' }, error: null });
    const result = await sendBetaLeadNotification({ email: 'test@torqr.de', tierInterest: 'SOLO' });
    expect(result.ok).toBe(true);
    expect(mockSend).toHaveBeenCalled();
    const [args] = mockSend.mock.calls[0];
    expect(args.subject).toContain('SOLO');
    expect(args.subject).toContain('test@torqr.de');
    expect(args.replyTo).toBe('test@torqr.de');
    expect(args.to).toBeDefined();
  });

  it('Subject ohne Tier-Suffix wenn tierInterest fehlt', async () => {
    mockSend.mockResolvedValue({ data: { id: 'x' }, error: null });
    const result = await sendBetaLeadNotification({ email: 'lead@torqr.de' });
    expect(result.ok).toBe(true);
    const [args] = mockSend.mock.calls[0];
    expect(args.subject).toBe('[Torqr Beta] Neuer Lead: lead@torqr.de');
  });

  it('gibt error zurück wenn Resend fehlschlägt', async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: 'Quota exceeded' } });
    const result = await sendBetaLeadNotification({ email: 'test@torqr.de' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('Quota exceeded');
    }
  });

});

describe('sendDemoRequestNotification', () => {
  beforeEach(() => mockSend.mockReset());

  it('schickt E-Mail mit Name im Subject', async () => {
    mockSend.mockResolvedValue({ data: { id: 'x' }, error: null });
    const result = await sendDemoRequestNotification({ email: 'a@b.de', name: 'Max' });
    expect(result.ok).toBe(true);
    const [args] = mockSend.mock.calls[0];
    expect(args.subject).toContain('Max');
    expect(args.subject).toContain('a@b.de');
    expect(args.replyTo).toBe('a@b.de');
  });

  it('gibt error zurück wenn Resend fehlschlägt', async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: 'Bounced' } });
    const result = await sendDemoRequestNotification({ email: 'a@b.de', name: 'Max' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('Bounced');
    }
  });
});
