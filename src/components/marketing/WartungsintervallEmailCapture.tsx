// src/components/marketing/WartungsintervallEmailCapture.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2Icon, Loader2Icon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { betaLeadSchema, type BetaLeadInput } from '@/lib/validations';
import { trackBetaLeadSubmitted } from '@/lib/analytics/track';

const SOURCE = 'wartungsintervall-rechner';

export function WartungsintervallEmailCapture() {
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BetaLeadInput>({
    resolver: zodResolver(betaLeadSchema),
    defaultValues: { consent: false as never, source: SOURCE },
  });

  const onSubmit = async (data: BetaLeadInput) => {
    setSubmitState('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/beta-leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...data, source: SOURCE }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErrorMsg(j.error ?? 'Etwas ist schiefgelaufen. Bitte versuche es nochmal.');
        setSubmitState('error');
        return;
      }
      setSubmitState('success');
      void trackBetaLeadSubmitted({ tier: null, source: SOURCE });
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Netzwerkfehler');
      setSubmitState('error');
    }
  };

  if (submitState === 'success') {
    return (
      <div className="text-center py-8">
        <CheckCircle2Icon className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Danke!</h3>
        <p className="text-sm text-muted-foreground">
          Wir benachrichtigen dich, sobald die Wartungsprotokoll-Vorlage und der Frühzugriff verfügbar sind.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Honeypot */}
      <input
        type="text"
        {...register('website')}
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />
      <input type="hidden" value={SOURCE} {...register('source')} />

      <div>
        <Label htmlFor="wartungsintervall-email">E-Mail-Adresse *</Label>
        <Input
          id="wartungsintervall-email"
          type="email"
          autoComplete="email"
          {...register('email')}
        />
        {errors.email ? (
          <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="flex items-start gap-3 pt-2">
        <Checkbox
          id="wartungsintervall-consent"
          onCheckedChange={(v) =>
            setValue('consent', (v === true ? true : false) as never)
          }
        />
        <Label
          htmlFor="wartungsintervall-consent"
          className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
        >
          Ich stimme zu, dass meine Angaben zur Bearbeitung meiner Anfrage gespeichert
          und für die Beta-Aufnahme verwendet werden. Details in der{' '}
          <a href="/datenschutz" className="underline">Datenschutzerklärung</a>.
        </Label>
      </div>
      {errors.consent ? (
        <p className="text-xs text-red-600">{errors.consent.message}</p>
      ) : null}

      {submitState === 'error' ? (
        <p className="text-sm text-red-600">{errorMsg}</p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={submitState === 'submitting'}
      >
        {submitState === 'submitting' ? (
          <>
            <Loader2Icon className="h-4 w-4 animate-spin" /> Wird gesendet …
          </>
        ) : (
          'Frühzugriff sichern'
        )}
      </Button>
    </form>
  );
}
