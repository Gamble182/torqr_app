'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { CheckCircle2Icon, Loader2Icon } from 'lucide-react';
import { betaLeadSchema, type BetaLeadInput } from '@/lib/validations';

export function BetaListForm() {
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BetaLeadInput>({
    resolver: zodResolver(betaLeadSchema),
    defaultValues: { consent: false as never },
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (hash === '#cta-beta-solo') {
      setValue('tierInterest', 'SOLO');
      setValue('source', 'pricing-solo');
    } else if (hash === '#cta-beta-pro') {
      setValue('tierInterest', 'PRO');
      setValue('source', 'pricing-pro');
    } else if (hash === '#cta-pilot') {
      setValue('source', 'pilot-status');
    } else if (hash === '#cta-hero') {
      setValue('source', 'hero');
    } else {
      setValue('source', 'direct');
    }
  }, [setValue]);

  const onSubmit = async (data: BetaLeadInput) => {
    setSubmitState('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/beta-leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErrorMsg(j.error ?? 'Etwas ist schiefgelaufen. Bitte versuche es nochmal.');
        setSubmitState('error');
        return;
      }
      setSubmitState('success');
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
        <p className="text-sm text-muted-foreground">Wir melden uns innerhalb von 2 Werktagen.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Honeypot */}
      <input type="text" {...register('website')} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <div>
        <Label htmlFor="beta-email">E-Mail-Adresse *</Label>
        <Input id="beta-email" type="email" autoComplete="email" {...register('email')} />
        {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="beta-name">Name (optional)</Label>
          <Input id="beta-name" type="text" autoComplete="name" {...register('name')} />
        </div>
        <div>
          <Label htmlFor="beta-company">Firma (optional)</Label>
          <Input id="beta-company" type="text" autoComplete="organization" {...register('company')} />
        </div>
      </div>

      <div className="flex items-start gap-3 pt-2">
        <Checkbox id="beta-consent" onCheckedChange={(v) => setValue('consent', (v === true ? true : false) as never)} />
        <Label htmlFor="beta-consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
          Ich stimme zu, dass meine Angaben zur Bearbeitung meiner Anfrage gespeichert und für die Beta-Aufnahme
          verwendet werden. Details in der{' '}
          <a href="/datenschutz" className="underline">Datenschutzerklärung</a>.
        </Label>
      </div>
      {errors.consent ? <p className="text-xs text-red-600">{errors.consent.message}</p> : null}

      {submitState === 'error' ? <p className="text-sm text-red-600">{errorMsg}</p> : null}

      <Button type="submit" size="lg" className="w-full" disabled={submitState === 'submitting'}>
        {submitState === 'submitting' ? <><Loader2Icon className="h-4 w-4 animate-spin" /> Wird gesendet …</> : 'Beta-Liste eintragen'}
      </Button>
    </form>
  );
}
