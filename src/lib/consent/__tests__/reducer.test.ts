// src/lib/consent/__tests__/reducer.test.ts
import { describe, it, expect } from 'vitest';
import { consentReducer } from '../reducer';
import { DEFAULT_CONSENT, type ConsentState } from '../types';

describe('consentReducer', () => {
  it('hydrate replaces full state', () => {
    const next: ConsentState = {
      version: 1, decided: true,
      services: { vercelAnalytics: true, posthog: false },
      decidedAt: '2026-05-04T08:00:00.000Z',
    };
    expect(consentReducer(DEFAULT_CONSENT, { type: 'hydrate', state: next })).toEqual(next);
  });

  it('accept_all sets both services true and decided=true', () => {
    const result = consentReducer(DEFAULT_CONSENT, { type: 'accept_all' });
    expect(result.decided).toBe(true);
    expect(result.services).toEqual({ vercelAnalytics: true, posthog: true });
    expect(result.decidedAt).not.toBeNull();
  });

  it('reject_all sets both services false and decided=true', () => {
    const result = consentReducer(DEFAULT_CONSENT, { type: 'reject_all' });
    expect(result.decided).toBe(true);
    expect(result.services).toEqual({ vercelAnalytics: false, posthog: false });
    expect(result.decidedAt).not.toBeNull();
  });

  it('set_services merges partial updates and marks decided', () => {
    const result = consentReducer(DEFAULT_CONSENT, {
      type: 'set_services',
      services: { posthog: true },
    });
    expect(result.decided).toBe(true);
    expect(result.services).toEqual({ vercelAnalytics: false, posthog: true });
  });

  it('reopen toggles decided back to false but keeps services', () => {
    const decided: ConsentState = {
      version: 1, decided: true,
      services: { vercelAnalytics: true, posthog: false },
      decidedAt: '2026-05-04T08:00:00.000Z',
    };
    const result = consentReducer(decided, { type: 'reopen' });
    expect(result.decided).toBe(false);
    expect(result.services).toEqual(decided.services);
  });
});
