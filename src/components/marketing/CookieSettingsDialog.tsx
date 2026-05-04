'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useConsent } from '@/lib/consent/context';

export function CookieSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { consent, setServices } = useConsent();
  const [draftVercel, setDraftVercel] = useState(consent.services.vercelAnalytics);
  const [draftPostHog, setDraftPostHog] = useState(consent.services.posthog);

  useEffect(() => {
    if (open) {
      setDraftVercel(consent.services.vercelAnalytics);
      setDraftPostHog(consent.services.posthog);
    }
  }, [open, consent.services.vercelAnalytics, consent.services.posthog]);

  const onSave = () => {
    setServices({ vercelAnalytics: draftVercel, posthog: draftPostHog });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cookie-Einstellungen</DialogTitle>
          <DialogDescription>
            Wähle aus, welche Dienste du erlaubst. Du kannst deine Auswahl jederzeit ändern.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label htmlFor="essential" className="text-sm font-medium">Essentielle Cookies</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Login-Session, Sicherheit. Immer aktiv.
              </p>
            </div>
            <Switch id="essential" checked disabled />
          </div>

          <div className="flex items-start justify-between gap-4 pt-3 border-t border-border">
            <div>
              <Label htmlFor="vercel" className="text-sm font-medium">Vercel Analytics</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Anonyme Seitenaufrufe und Performance-Daten. Keine Cookies.
              </p>
            </div>
            <Switch id="vercel" checked={draftVercel} onCheckedChange={setDraftVercel} />
          </div>

          <div className="flex items-start justify-between gap-4 pt-3 border-t border-border">
            <div>
              <Label htmlFor="posthog" className="text-sm font-medium">PostHog Product Analytics</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Anonyme Nutzungsanalyse zur Produktverbesserung. EU-Server (Frankfurt).
              </p>
            </div>
            <Switch id="posthog" checked={draftPostHog} onCheckedChange={setDraftPostHog} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onSave}>Speichern und schließen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
