'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useConsent } from '@/lib/consent/context';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

export function PostHogProvider({ children }: { children: ReactNode }) {
  const { consent, hydrated } = useConsent();
  const initialized = useRef(false);

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
    })();
  }, [consent.services.posthog, hydrated]);

  // Honor revocation: stop capturing if user disables after init
  useEffect(() => {
    if (!initialized.current) return;
    if (consent.services.posthog) return;
    void (async () => {
      const { default: posthog } = await import('posthog-js');
      if (typeof posthog.opt_out_capturing === 'function') posthog.opt_out_capturing();
    })();
  }, [consent.services.posthog]);

  return <>{children}</>;
}
