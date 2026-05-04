import { describe, it, expect, beforeEach, vi } from 'vitest';

const captureMock = vi.fn();

vi.mock('posthog-js', () => ({
  default: {
    __loaded: false as boolean,
    capture: captureMock,
  },
}));

beforeEach(() => {
  captureMock.mockReset();
  // @ts-expect-error mock window for node env
  globalThis.window = {};
  process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test';
});

describe('track helpers', () => {
  it('trackBetaLeadSubmitted is a no-op when posthog is not loaded', async () => {
    const { trackBetaLeadSubmitted } = await import('../track');
    const posthog = (await import('posthog-js')).default as unknown as { __loaded: boolean };
    posthog.__loaded = false;
    await trackBetaLeadSubmitted({ tier: 'SOLO', source: 'hero' });
    expect(captureMock).not.toHaveBeenCalled();
  });

  it('trackBetaLeadSubmitted captures with props when loaded', async () => {
    const { trackBetaLeadSubmitted } = await import('../track');
    const posthog = (await import('posthog-js')).default as unknown as { __loaded: boolean };
    posthog.__loaded = true;
    await trackBetaLeadSubmitted({ tier: 'PRO', source: 'pricing-pro' });
    expect(captureMock).toHaveBeenCalledWith('beta_lead_submitted', {
      tier: 'PRO',
      source: 'pricing-pro',
    });
  });

  it('trackDemoRequestSubmitted captures when loaded', async () => {
    const { trackDemoRequestSubmitted } = await import('../track');
    const posthog = (await import('posthog-js')).default as unknown as { __loaded: boolean };
    posthog.__loaded = true;
    await trackDemoRequestSubmitted({ source: 'final-cta' });
    expect(captureMock).toHaveBeenCalledWith('demo_request_submitted', {
      source: 'final-cta',
    });
  });

  it('is a no-op when window is undefined (SSR)', async () => {
    // @ts-expect-error simulate SSR
    delete globalThis.window;
    const { trackBetaLeadSubmitted } = await import('../track');
    await trackBetaLeadSubmitted({ tier: 'SOLO' });
    expect(captureMock).not.toHaveBeenCalled();
  });
});
