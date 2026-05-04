'use client';

import { useState } from 'react';
import { useConsent } from '@/lib/consent/context';
import { Button } from '@/components/ui/button';
import { CookieSettingsDialog } from './CookieSettingsDialog';

export function CookieBanner() {
  const { consent, hydrated, acceptAll, rejectAll } = useConsent();
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!hydrated || consent.decided) return null;

  return (
    <>
      <div
        role="dialog"
        aria-labelledby="cookie-banner-title"
        aria-describedby="cookie-banner-description"
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 rounded-lg border border-border bg-background shadow-lg p-5"
      >
        <h2 id="cookie-banner-title" className="text-sm font-semibold text-foreground mb-2">
          Cookies und Tracking
        </h2>
        <p id="cookie-banner-description" className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Wir nutzen technisch notwendige Cookies sowie optional Analyse-Tools (Vercel Analytics,
          PostHog) zur Verbesserung der Seite. Details in der{' '}
          <a href="/datenschutz" className="underline">Datenschutzerklärung</a>.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={acceptAll} size="sm" className="flex-1">Alle akzeptieren</Button>
          <Button onClick={rejectAll} size="sm" variant="outline" className="flex-1">Nur essentielle</Button>
          <Button
            onClick={() => setSettingsOpen(true)}
            size="sm"
            variant="ghost"
            className="flex-1"
          >
            Einstellungen
          </Button>
        </div>
      </div>
      <CookieSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
