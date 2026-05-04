// src/components/marketing/CookieSettingsLink.tsx
'use client';

import { useConsent } from '@/lib/consent/context';

export function CookieSettingsLink({ className }: { className?: string }) {
  const { reopen } = useConsent();
  return (
    <button type="button" onClick={reopen} className={className ?? 'underline text-foreground hover:text-primary'}>
      Cookie-Einstellungen
    </button>
  );
}
