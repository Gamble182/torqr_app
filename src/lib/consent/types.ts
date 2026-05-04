// src/lib/consent/types.ts
export const CONSENT_VERSION = 1;
export const CONSENT_STORAGE_KEY = 'torqr-consent-v1';

export type ServiceConsent = {
  vercelAnalytics: boolean;
  posthog: boolean;
};

export type ConsentState = {
  version: number;
  decided: boolean;
  services: ServiceConsent;
  decidedAt: string | null;
};

export const DEFAULT_CONSENT: ConsentState = {
  version: CONSENT_VERSION,
  decided: false,
  services: { vercelAnalytics: false, posthog: false },
  decidedAt: null,
};
