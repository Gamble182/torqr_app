import { describe, it, expect, beforeEach } from 'vitest';
import { loadConsent, saveConsent, resetConsent } from '../storage';
import { CONSENT_STORAGE_KEY, DEFAULT_CONSENT, type ConsentState } from '../types';

const memoryStore = new Map<string, string>();
const fakeStorage: Storage = {
  get length() { return memoryStore.size; },
  clear: () => memoryStore.clear(),
  getItem: (k) => memoryStore.get(k) ?? null,
  setItem: (k, v) => { memoryStore.set(k, v); },
  removeItem: (k) => { memoryStore.delete(k); },
  key: (i) => Array.from(memoryStore.keys())[i] ?? null,
};

beforeEach(() => {
  memoryStore.clear();
  // @ts-expect-error — mocking window for node test env
  globalThis.window = { localStorage: fakeStorage };
});

describe('consent storage', () => {
  it('returns DEFAULT_CONSENT when nothing stored', () => {
    expect(loadConsent()).toEqual(DEFAULT_CONSENT);
  });

  it('round-trips a saved state', () => {
    const state: ConsentState = {
      version: 1,
      decided: true,
      services: { vercelAnalytics: true, posthog: false },
      decidedAt: '2026-05-04T10:00:00.000Z',
    };
    saveConsent(state);
    expect(loadConsent()).toEqual(state);
  });

  it('returns DEFAULT_CONSENT when version mismatch', () => {
    memoryStore.set(CONSENT_STORAGE_KEY, JSON.stringify({ ...DEFAULT_CONSENT, version: 99 }));
    expect(loadConsent()).toEqual(DEFAULT_CONSENT);
  });

  it('returns DEFAULT_CONSENT when JSON malformed', () => {
    memoryStore.set(CONSENT_STORAGE_KEY, '{broken');
    expect(loadConsent()).toEqual(DEFAULT_CONSENT);
  });

  it('returns DEFAULT_CONSENT when stored shape is incomplete (matching version, missing services)', () => {
    memoryStore.set(CONSENT_STORAGE_KEY, JSON.stringify({ version: 1, decided: true }));
    expect(loadConsent()).toEqual(DEFAULT_CONSENT);
  });

  it('resetConsent removes the key', () => {
    saveConsent({ ...DEFAULT_CONSENT, decided: true });
    resetConsent();
    expect(memoryStore.has(CONSENT_STORAGE_KEY)).toBe(false);
  });

  it('loadConsent is SSR-safe (no window)', () => {
    // @ts-expect-error — simulate SSR
    delete globalThis.window;
    expect(loadConsent()).toEqual(DEFAULT_CONSENT);
  });
});
