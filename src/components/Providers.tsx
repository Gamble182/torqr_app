'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import { ReactNode } from 'react';
import { ReactQueryProvider } from '@/lib/react-query';
import { ConsentProvider } from '@/lib/consent/context';
import { PostHogConsentProvider } from '@/lib/analytics/posthog-provider';
import { VercelAnalyticsGate } from '@/lib/analytics/vercel-analytics-gate';
import { CookieBanner } from '@/components/marketing/CookieBanner';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ReactQueryProvider>
        <ConsentProvider>
          <PostHogConsentProvider>
            {children}
            <Toaster position="top-right" richColors />
            <VercelAnalyticsGate />
            <CookieBanner />
          </PostHogConsentProvider>
        </ConsentProvider>
      </ReactQueryProvider>
    </SessionProvider>
  );
}
