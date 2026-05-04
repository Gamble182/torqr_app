// src/lib/consent/storage.ts
import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  DEFAULT_CONSENT,
  type ConsentState,
} from './types';

export function loadConsent(): ConsentState {
  if (typeof window === 'undefined') return DEFAULT_CONSENT;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return DEFAULT_CONSENT;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== CONSENT_VERSION) return DEFAULT_CONSENT;
    if (
      typeof parsed.decided !== 'boolean' ||
      typeof parsed.services?.vercelAnalytics !== 'boolean' ||
      typeof parsed.services?.posthog !== 'boolean'
    ) return DEFAULT_CONSENT;
    return parsed;
  } catch {
    return DEFAULT_CONSENT;
  }
}

export function saveConsent(state: ConsentState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded or storage disabled — silent no-op
  }
}

export function resetConsent(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // no-op
  }
}
