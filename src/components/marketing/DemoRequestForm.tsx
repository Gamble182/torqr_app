'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { CheckCircle2Icon, Loader2Icon } from 'lucide-react';
import { demoRequestSchema, type DemoRequestInput } from '@/lib/validations';

export function DemoRequestForm() {
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register, handleSubmit, setValue, formState: { errors },
  } = useForm<DemoRequestInput>({
    resolver: zodResolver(demoRequestSchema),
    defaultValues: { consent: (false as never) },
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (hash === '#cta-demo' && document.referrer.includes('pricing')) {
      setValue('source', 'pricing-enterprise');
    } else if (hash === '#cta-demo') {
      setValue('source', 'hero');
    } else {
      setValue('source', 'direct');
    }
  }, [setValue]);

  const onSubmit = async (data: DemoRequestInput) => {
    setSubmitState('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/demo-requests', {
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
        <p className="text-sm text-muted-foreground">Wir melden uns innerhalb von 1 Werktag mit Terminvorschlägen.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="text" {...register('website')} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="demo-name">Name *</Label>
          <Input id="demo-name" type="text" autoComplete="name" {...register('name')} />
          {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
        </div>
        <div>
          <Label htmlFor="demo-email">E-Mail *</Label>
          <Input id="demo-email" type="email" autoComplete="email" {...register('email')} />
          {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="demo-company">Firma (optional)</Label>
          <Input id="demo-company" type="text" autoComplete="organization" {...register('company')} />
        </div>
        <div>
          <Label htmlFor="demo-phone">Telefon (optional)</Label>
          <Input id="demo-phone" type="tel" autoComplete="tel" {...register('phone')} />
        </div>
      </div>

      <div>
        <Label htmlFor="demo-slot">Wunschtermin-Bereich (optional)</Label>
        <Input id="demo-slot" type="text" placeholder="z. B. Vormittags KW 19" {...register('preferredSlot')} />
      </div>

      <div>
        <Label htmlFor="demo-message">Nachricht (optional)</Label>
        <Textarea id="demo-message" rows={3} {...register('message')} />
      </div>

      <div className="flex items-start gap-3 pt-2">
        <Checkbox id="demo-consent" onCheckedChange={(v) => setValue('consent', (v === true) as never)} />
        <Label htmlFor="demo-consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
          Ich stimme zu, dass meine Angaben zur Bearbeitung meiner Demo-Anfrage gespeichert und verwendet werden.
          Details in der <a href="/datenschutz" className="underline">Datenschutzerklärung</a>.
        </Label>
      </div>
      {errors.consent ? <p className="text-xs text-red-600">{errors.consent.message}</p> : null}

      {submitState === 'error' ? <p className="text-sm text-red-600">{errorMsg}</p> : null}

      <Button type="submit" size="lg" className="w-full" disabled={submitState === 'submitting'}>
        {submitState === 'submitting' ? <><Loader2Icon className="h-4 w-4 animate-spin" /> Wird gesendet …</> : 'Demo-Anfrage senden'}
      </Button>
    </form>
  );
}
