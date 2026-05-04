'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useConsent } from '@/lib/consent/context';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

// Module-level instance reference — set once after dynamic import completes.
// Eliminates a race where revocation could fire opt_out_capturing before init resolved.
let posthogInstance: typeof import('posthog-js').default | null = null;

export function PostHogConsentProvider({ children }: { children: ReactNode }) {
  const { consent, hydrated } = useConsent();
  const initialized = useRef(false);
  const consentRef = useRef(consent);

  // Keep consentRef current so async callbacks can read the latest value
  useEffect(() => {
    consentRef.current = consent;
  });

  // Lazy-init only when consent is granted
  useEffect(() => {
    if (!hydrated) return;
    if (!consent.services.posthog) return;
    if (initialized.current) return;
    if (!POSTHOG_KEY) return;
    initialized.current = true;
    void (async () => {
      const { default: posthog } = await import('posthog-js');
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        person_profiles: 'identified_only',
        autocapture: false,
        capture_pageview: 'history_change',
        disable_session_recording: true,
      });
      posthogInstance = posthog;
      // If user revoked during the import await, honor it now
      if (!consentRef.current.services.posthog) {
        if (typeof posthog.opt_out_capturing === 'function') posthog.opt_out_capturing();
      }
    })();
  }, [consent.services.posthog, hydrated]);

  // Honor revocation post-init: stop capturing if user disables after init completed
  useEffect(() => {
    if (!posthogInstance) return; // not yet initialized — first effect's IIFE will handle late revocation
    if (consent.services.posthog) return;
    if (typeof posthogInstance.opt_out_capturing === 'function') posthogInstance.opt_out_capturing();
  }, [consent.services.posthog]);

  return <>{children}</>;
}
