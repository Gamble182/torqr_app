'use client';

import { Analytics } from '@vercel/analytics/next';
import { useConsent } from '@/lib/consent/context';

export function VercelAnalyticsGate() {
  const { consent, hydrated } = useConsent();
  if (!hydrated) return null;
  if (!consent.services.vercelAnalytics) return null;
  return <Analytics />;
}
