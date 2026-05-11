# Wartungsintervall-Rechner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone, SEO-indexable Lead-Magnet-Tool at `/wartungsintervall-rechner` that lets a visitor pick System-Type (HEATING/AC/WATER_TREATMENT/ENERGY_STORAGE) + Baujahr and instantly see the recommended Wartungsintervall in months, whether maintenance is legally required, and a short Begründung. Below the result, an inline Email-Capture-Form reuses the existing `/api/beta-leads` endpoint with `source='wartungsintervall-rechner'`.

**Architecture:** Pure computation lives in `src/lib/marketing/wartungsintervall.ts` (no I/O, no React) covered by vitest unit tests — same shape as the existing `roi.ts` lib. The interactive UI is a single client component `WartungsintervallCalculator.tsx` (mirrors `RoiCalculator.tsx` patterns) plus a sibling `WartungsintervallEmailCapture.tsx` (slim, derived from `BetaListForm.tsx`). The page itself is a regular App Router server component at `src/app/wartungsintervall-rechner/page.tsx`, wrapped with the standard `MarketingHeader` + `MarketingFooter`, including `Metadata` and JSON-LD `WebApplication` schema for SEO. No new API routes — the email submission reuses `POST /api/beta-leads`, which already accepts arbitrary `source` strings.

**Tech Stack:** Next.js 14 App Router (server component for the page, client components for the calculator + form), React Hook Form + Zod resolver for the form, Tailwind, lucide-react icons, vitest. German UI strings, English code/comments/identifiers per CLAUDE.md.

**Out of scope for this plan (deferred to a follow-up):**
- PDF generation (`@react-pdf/renderer`) of a Wartungsprotokoll. The handover explicitly scope-cuts this to Phase 2.
- Any change to `/api/beta-leads` (it already supports arbitrary `source` strings).
- New analytics events. The existing `trackBetaLeadSubmitted({ source: 'wartungsintervall-rechner' })` covers conversion attribution.
- The optional `leistung_kw` input listed in the handover spec is **deliberately omitted**. None of the four base rules vary by kW (the F-Gas threshold "≥ 3 kg CO₂-Äquivalent" is about refrigerant mass, not heating power, and lives in the Begründungs-Text). Adding a kW input that has zero effect on the computed result would confuse users. If a future requirement actually keys on kW (e.g. BImSchV-Pflicht-Brennleistung > 100 kW), extend the lib + tests at that point.

---

## Domain Rules (locked as constants — single source of truth)

These rules are codified in `wartungsintervall.ts` and not derived at runtime from `heating-systems.json`. The catalog file holds manufacturers/models, not maintenance intervals.

| SystemType | Empfohlen (Monate) | Gesetzliche Pflicht | Begründungs-Snippet |
|---|---|---|---|
| `HEATING` | 12 | Ja | "KÜO und DIN 4795 — Heizungsanlagen sind jährlich wartungspflichtig. Hersteller setzen 12 Monate als Garantie-Bedingung voraus." |
| `AC` | 12 | Ja | "EU F-Gas-Verordnung 517/2014 — Klimaanlagen ab 3 kg CO₂-Äquivalent Füllmenge sind jährlich dichtigkeitsprüfpflichtig." |
| `WATER_TREATMENT` | 12 | Nein | "Keine gesetzliche Wartungspflicht. Trinkwasser-Hygiene erfordert jährlichen Filter- und Salz-Check." |
| `ENERGY_STORAGE` | 24 | Nein | "Keine gesetzliche Wartungspflicht. Anoden-Prüfung und Spülung alle 24 Monate verhindert Korrosionsschäden." |

**Anlagenalter-Augmentation:** Wenn `currentYear - baujahr >= 15`, hängt die Funktion einen zusätzlichen Hinweis-Satz an die Begründung an: *"Hinweis: Bei einem Anlagenalter von N Jahren empfehlen wir zusätzliche Sicht- und Funktionskontrollen zwischen den Hauptwartungen."* Die Zahl `empfohlenInMonaten` bleibt unverändert (deterministisch, kein Wendepunkt-Verhalten).

**Defaults für die UI:**
- `DEFAULT_SYSTEM_TYPE = 'HEATING'`
- `DEFAULT_BAUJAHR_OFFSET_YEARS = 5` (UI berechnet zur Render-Zeit `new Date().getFullYear() - 5`)

**Baujahr-Range:** `MIN_BAUJAHR = 1900`, `MAX_BAUJAHR` = aktuelles Jahr (zur Laufzeit). Out-of-range wirft `RangeError`.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/lib/marketing/wartungsintervall.ts` | Create | Named constants + pure `computeWartungsintervall()` returning `{ empfohlenInMonaten, gesetzlichePflicht, begruendung, isAltAnlage }` |
| `src/lib/marketing/__tests__/wartungsintervall.test.ts` | Create | vitest tests: all 4 system types, alt-Anlagen-Augmentation, baujahr validation, exposed constants |
| `src/components/marketing/WartungsintervallCalculator.tsx` | Create | `'use client'` — system-type RadioGroup-like selector, baujahr number+range input, live result tile, reset button |
| `src/components/marketing/WartungsintervallEmailCapture.tsx` | Create | `'use client'` — slim email-only form (email + consent + honeypot), POSTs to `/api/beta-leads` with hardcoded `source='wartungsintervall-rechner'` |
| `src/app/wartungsintervall-rechner/page.tsx` | Create | Server component: `MarketingHeader` + Hero + `<WartungsintervallCalculator />` + `<WartungsintervallEmailCapture />` + `MarketingFooter` + `Metadata` + JSON-LD WebApplication schema |
| `src/components/marketing/Faq.tsx` | Modify | Add one FAQ entry linking to the new page |
| `src/components/marketing/MarketingFooter.tsx` | Modify | Add link "Wartungsintervall-Rechner" to the "Produkt" column |

---

### Task 1: Pure-Function Lib (TDD)

**Files:**
- Create: `src/lib/marketing/wartungsintervall.ts`
- Create (test): `src/lib/marketing/__tests__/wartungsintervall.test.ts`

- [ ] **Step 1.1: Write the failing test file**

```typescript
// src/lib/marketing/__tests__/wartungsintervall.test.ts
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  computeWartungsintervall,
  DEFAULT_SYSTEM_TYPE,
  DEFAULT_BAUJAHR_OFFSET_YEARS,
  MIN_BAUJAHR,
  OLD_SYSTEM_THRESHOLD_YEARS,
  SYSTEM_TYPE_KEYS,
  type SystemTypeKey,
} from '@/lib/marketing/wartungsintervall';

const FIXED_NOW = new Date('2026-05-11T12:00:00Z');

describe('computeWartungsintervall', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 12 months mandatory for HEATING with KÜO/DIN reference', () => {
    const r = computeWartungsintervall({ systemType: 'HEATING', baujahr: 2020 });
    expect(r.empfohlenInMonaten).toBe(12);
    expect(r.gesetzlichePflicht).toBe(true);
    expect(r.begruendung).toMatch(/KÜO/);
    expect(r.begruendung).toMatch(/DIN 4795/);
    expect(r.isAltAnlage).toBe(false);
  });

  it('returns 12 months mandatory for AC with F-Gas reference', () => {
    const r = computeWartungsintervall({ systemType: 'AC', baujahr: 2022 });
    expect(r.empfohlenInMonaten).toBe(12);
    expect(r.gesetzlichePflicht).toBe(true);
    expect(r.begruendung).toMatch(/F-Gas|517\/2014/);
  });

  it('returns 12 months optional for WATER_TREATMENT', () => {
    const r = computeWartungsintervall({ systemType: 'WATER_TREATMENT', baujahr: 2018 });
    expect(r.empfohlenInMonaten).toBe(12);
    expect(r.gesetzlichePflicht).toBe(false);
    expect(r.begruendung).toMatch(/Trinkwasser/);
  });

  it('returns 24 months optional for ENERGY_STORAGE with Anoden reference', () => {
    const r = computeWartungsintervall({ systemType: 'ENERGY_STORAGE', baujahr: 2015 });
    expect(r.empfohlenInMonaten).toBe(24);
    expect(r.gesetzlichePflicht).toBe(false);
    expect(r.begruendung).toMatch(/Anode/);
  });

  it('appends Anlagenalter-Hinweis when system is >= 15 years old (HEATING)', () => {
    const r = computeWartungsintervall({ systemType: 'HEATING', baujahr: 2026 - 15 });
    expect(r.isAltAnlage).toBe(true);
    expect(r.empfohlenInMonaten).toBe(12);
    expect(r.begruendung).toMatch(/Anlagenalter von 15 Jahren/);
    expect(r.begruendung).toMatch(/Sicht- und Funktionskontrollen/);
  });

  it('does NOT append Anlagenalter-Hinweis when system is 14 years old', () => {
    const r = computeWartungsintervall({ systemType: 'HEATING', baujahr: 2026 - 14 });
    expect(r.isAltAnlage).toBe(false);
    expect(r.begruendung).not.toMatch(/Sicht- und Funktionskontrollen/);
  });

  it('throws RangeError for baujahr in the future', () => {
    expect(() =>
      computeWartungsintervall({ systemType: 'HEATING', baujahr: 2027 }),
    ).toThrow(RangeError);
  });

  it('throws RangeError for baujahr before MIN_BAUJAHR', () => {
    expect(() =>
      computeWartungsintervall({ systemType: 'HEATING', baujahr: 1899 }),
    ).toThrow(RangeError);
  });

  it('throws RangeError for non-integer baujahr', () => {
    expect(() =>
      computeWartungsintervall({ systemType: 'HEATING', baujahr: 2020.5 }),
    ).toThrow(RangeError);
  });

  it('exposes SYSTEM_TYPE_KEYS with all 4 SystemType enum values', () => {
    const expected: SystemTypeKey[] = ['HEATING', 'AC', 'WATER_TREATMENT', 'ENERGY_STORAGE'];
    expect(SYSTEM_TYPE_KEYS).toEqual(expected);
  });

  it('exposes documented defaults and constants', () => {
    expect(DEFAULT_SYSTEM_TYPE).toBe('HEATING');
    expect(DEFAULT_BAUJAHR_OFFSET_YEARS).toBe(5);
    expect(MIN_BAUJAHR).toBe(1900);
    expect(OLD_SYSTEM_THRESHOLD_YEARS).toBe(15);
  });
});
```

- [ ] **Step 1.2: Run the test to verify it fails**

Run (PowerShell):
```powershell
npm run test:run -- src/lib/marketing/__tests__/wartungsintervall.test.ts
```
Expected: FAIL with `Cannot find module '@/lib/marketing/wartungsintervall'`.

- [ ] **Step 1.3: Write the minimal implementation**

```typescript
// src/lib/marketing/wartungsintervall.ts
export const SYSTEM_TYPE_KEYS = [
  'HEATING',
  'AC',
  'WATER_TREATMENT',
  'ENERGY_STORAGE',
] as const;

export type SystemTypeKey = (typeof SYSTEM_TYPE_KEYS)[number];

export const DEFAULT_SYSTEM_TYPE: SystemTypeKey = 'HEATING';
export const DEFAULT_BAUJAHR_OFFSET_YEARS = 5;
export const MIN_BAUJAHR = 1900;
export const OLD_SYSTEM_THRESHOLD_YEARS = 15;

export interface WartungsintervallInput {
  systemType: SystemTypeKey;
  baujahr: number;
}

export interface WartungsintervallResult {
  empfohlenInMonaten: number;
  gesetzlichePflicht: boolean;
  begruendung: string;
  isAltAnlage: boolean;
}

interface BaseRule {
  months: number;
  legallyRequired: boolean;
  baseReason: string;
}

const BASE_RULES: Record<SystemTypeKey, BaseRule> = {
  HEATING: {
    months: 12,
    legallyRequired: true,
    baseReason:
      'Heizungsanlagen unterliegen nach KÜO und DIN 4795 einer jährlichen Wartungspflicht. Hersteller setzen 12 Monate i. d. R. als Garantie-Bedingung voraus.',
  },
  AC: {
    months: 12,
    legallyRequired: true,
    baseReason:
      'Klimaanlagen ab 3 kg CO₂-Äquivalent F-Gas-Füllmenge sind nach EU 517/2014 jährlich dichtigkeitsprüfpflichtig. Hersteller empfehlen 12-Monats-Wartung.',
  },
  WATER_TREATMENT: {
    months: 12,
    legallyRequired: false,
    baseReason:
      'Wasseraufbereitungs-Anlagen (Enthärtung, Filtration) haben keine gesetzliche Wartungspflicht. Trinkwasser-Hygiene erfordert jedoch jährlichen Filter- und Salz-Check.',
  },
  ENERGY_STORAGE: {
    months: 24,
    legallyRequired: false,
    baseReason:
      'Pufferspeicher und Warmwasser-Boiler benötigen keine gesetzliche Wartung. Anoden-Prüfung und Spülung alle 24 Monate verhindert Korrosionsschäden.',
  },
};

export function computeWartungsintervall({
  systemType,
  baujahr,
}: WartungsintervallInput): WartungsintervallResult {
  const currentYear = new Date().getFullYear();
  if (
    !Number.isInteger(baujahr) ||
    baujahr < MIN_BAUJAHR ||
    baujahr > currentYear
  ) {
    throw new RangeError(
      `Baujahr muss eine ganze Zahl zwischen ${MIN_BAUJAHR} und ${currentYear} sein.`,
    );
  }
  const rule = BASE_RULES[systemType];
  const alterJahre = currentYear - baujahr;
  const isAltAnlage = alterJahre >= OLD_SYSTEM_THRESHOLD_YEARS;
  const begruendung = isAltAnlage
    ? `${rule.baseReason} Hinweis: Bei einem Anlagenalter von ${alterJahre} Jahren empfehlen wir zusätzliche Sicht- und Funktionskontrollen zwischen den Hauptwartungen.`
    : rule.baseReason;
  return {
    empfohlenInMonaten: rule.months,
    gesetzlichePflicht: rule.legallyRequired,
    begruendung,
    isAltAnlage,
  };
}
```

- [ ] **Step 1.4: Run the test to verify it passes**

Run (PowerShell):
```powershell
npm run test:run -- src/lib/marketing/__tests__/wartungsintervall.test.ts
```
Expected: 11 tests pass, 0 fail.

- [ ] **Step 1.5: Commit**

```powershell
git add src/lib/marketing/wartungsintervall.ts src/lib/marketing/__tests__/wartungsintervall.test.ts
git commit -m "feat(marketing): add wartungsintervall pure-function lib + tests (#75)"
```

---

### Task 2: Wartungsintervall Calculator Client Component

**Files:**
- Create: `src/components/marketing/WartungsintervallCalculator.tsx`

- [ ] **Step 2.1: Create the calculator skeleton with selector, baujahr input, live result tile**

```typescript
// src/components/marketing/WartungsintervallCalculator.tsx
'use client';

import { useState } from 'react';
import { RotateCcwIcon, AlertTriangleIcon, ShieldCheckIcon, InfoIcon } from 'lucide-react';
import {
  computeWartungsintervall,
  DEFAULT_BAUJAHR_OFFSET_YEARS,
  DEFAULT_SYSTEM_TYPE,
  MIN_BAUJAHR,
  SYSTEM_TYPE_KEYS,
  type SystemTypeKey,
} from '@/lib/marketing/wartungsintervall';

const SYSTEM_TYPE_LABELS: Record<SystemTypeKey, string> = {
  HEATING: 'Heizung',
  AC: 'Klima',
  WATER_TREATMENT: 'Wasseraufbereitung',
  ENERGY_STORAGE: 'Pufferspeicher / Boiler',
};

const integerFormatter = new Intl.NumberFormat('de-DE', {
  maximumFractionDigits: 0,
});

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

export function WartungsintervallCalculator() {
  const currentYear = new Date().getFullYear();
  const defaultBaujahr = currentYear - DEFAULT_BAUJAHR_OFFSET_YEARS;

  const [systemType, setSystemType] = useState<SystemTypeKey>(DEFAULT_SYSTEM_TYPE);
  const [baujahr, setBaujahr] = useState<number>(defaultBaujahr);

  const result = computeWartungsintervall({ systemType, baujahr });
  const isDefault = systemType === DEFAULT_SYSTEM_TYPE && baujahr === defaultBaujahr;

  return (
    <div className="rounded-xl bg-background border border-border p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-foreground">
          Wann muss deine Anlage gewartet werden?
        </h3>
        {!isDefault && (
          <button
            type="button"
            onClick={() => {
              setSystemType(DEFAULT_SYSTEM_TYPE);
              setBaujahr(defaultBaujahr);
            }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcwIcon className="h-3.5 w-3.5" />
            Zurücksetzen
          </button>
        )}
      </div>

      <fieldset className="mb-6">
        <legend className="block text-sm font-medium text-foreground mb-2">
          Anlagentyp
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {SYSTEM_TYPE_KEYS.map((key) => (
            <label
              key={key}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors ${
                systemType === key
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-foreground/30'
              }`}
            >
              <input
                type="radio"
                name="wartungsintervall-systemtype"
                value={key}
                checked={systemType === key}
                onChange={() => setSystemType(key)}
                className="accent-primary"
              />
              {SYSTEM_TYPE_LABELS[key]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mb-6 space-y-2">
        <div className="flex items-baseline justify-between">
          <label
            htmlFor="wartungsintervall-baujahr"
            className="text-sm font-medium text-foreground"
          >
            Baujahr
          </label>
          <input
            id="wartungsintervall-baujahr"
            type="number"
            min={MIN_BAUJAHR}
            max={currentYear}
            step={1}
            value={baujahr}
            onChange={(e) =>
              setBaujahr(clamp(Number(e.target.value), MIN_BAUJAHR, currentYear))
            }
            className="w-24 px-2 py-1 text-sm text-right border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <input
          type="range"
          min={MIN_BAUJAHR}
          max={currentYear}
          step={1}
          value={baujahr}
          onChange={(e) =>
            setBaujahr(clamp(Number(e.target.value), MIN_BAUJAHR, currentYear))
          }
          aria-label="Baujahr (Schieberegler)"
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{MIN_BAUJAHR}</span>
          <span>{currentYear}</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 pt-6 border-t border-border">
        <ResultTile
          label="Empfohlenes Intervall"
          value={`${integerFormatter.format(result.empfohlenInMonaten)} Monate`}
          sub={
            result.empfohlenInMonaten === 12
              ? 'Jährliche Wartung'
              : 'Zweijährliche Wartung'
          }
          highlight
        />
        <ResultTile
          label="Gesetzliche Pflicht"
          value={result.gesetzlichePflicht ? 'Ja' : 'Nein'}
          sub={result.gesetzlichePflicht ? 'Vorgeschrieben' : 'Empfehlung'}
          icon={
            result.gesetzlichePflicht ? (
              <ShieldCheckIcon className="h-5 w-5 text-primary" aria-hidden />
            ) : (
              <InfoIcon className="h-5 w-5 text-muted-foreground" aria-hidden />
            )
          }
        />
        <ResultTile
          label="Anlagenalter"
          value={`${integerFormatter.format(currentYear - baujahr)} Jahre`}
          sub={result.isAltAnlage ? 'Alt-Anlage' : 'Im üblichen Rahmen'}
          icon={
            result.isAltAnlage ? (
              <AlertTriangleIcon className="h-5 w-5 text-amber-600" aria-hidden />
            ) : null
          }
        />
      </div>

      <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
        {result.begruendung}
      </p>

      <p className="mt-4 text-xs italic text-muted-foreground">
        Hinweis: Rechtsgrundlagen können regional und je nach Anlagenkonfiguration abweichen. Konkrete Wartungspflichten klärst du am besten direkt mit dem Hersteller oder einem Schornsteinfeger-Termin.
      </p>
    </div>
  );
}

interface ResultTileProps {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
  icon?: React.ReactNode;
}

function ResultTile({ label, value, sub, highlight = false, icon }: ResultTileProps) {
  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </p>
      {icon ? <div className="flex justify-center mb-1">{icon}</div> : null}
      <p
        className={`text-2xl sm:text-3xl font-bold mb-1 ${
          highlight ? 'text-primary' : 'text-foreground'
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
```

- [ ] **Step 2.2: Verify the component compiles (no runtime mount yet)**

Run (PowerShell):
```powershell
npx tsc --noEmit
```
Expected: no NEW errors mentioning `WartungsintervallCalculator` or `wartungsintervall` (pre-existing errors outside these files are fine; filter visually).

- [ ] **Step 2.3: Commit**

```powershell
git add src/components/marketing/WartungsintervallCalculator.tsx
git commit -m "feat(marketing): add WartungsintervallCalculator client component (#75)"
```

---

### Task 3: Email Capture Sub-Component

**Files:**
- Create: `src/components/marketing/WartungsintervallEmailCapture.tsx`

This component is a slim variant of `BetaListForm.tsx`: only email + consent, no tier-interest, hardcoded `source='wartungsintervall-rechner'`, no URL-hash logic. Reuses the existing `betaLeadSchema` (which already supports `source` as optional string ≤60 chars) and the existing `POST /api/beta-leads` endpoint unchanged.

- [ ] **Step 3.1: Create the slim email-capture component**

```typescript
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
```

- [ ] **Step 3.2: Verify it compiles**

Run (PowerShell):
```powershell
npx tsc --noEmit
```
Expected: no NEW errors mentioning `WartungsintervallEmailCapture`.

- [ ] **Step 3.3: Commit**

```powershell
git add src/components/marketing/WartungsintervallEmailCapture.tsx
git commit -m "feat(marketing): add WartungsintervallEmailCapture form (#75)"
```

---

### Task 4: Dedicated SEO Page Route

**Files:**
- Create: `src/app/wartungsintervall-rechner/page.tsx`

- [ ] **Step 4.1: Create the page route with Hero, Calculator mount, Email-Capture mount, Metadata, JSON-LD**

```typescript
// src/app/wartungsintervall-rechner/page.tsx
import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { WartungsintervallCalculator } from '@/components/marketing/WartungsintervallCalculator';
import { WartungsintervallEmailCapture } from '@/components/marketing/WartungsintervallEmailCapture';

export const metadata: Metadata = {
  title: 'Wartungsintervall-Rechner | Torqr',
  description:
    'Wann muss deine Heizung, Klima-Anlage, Wasseraufbereitung oder dein Pufferspeicher gewartet werden? Kostenloser Rechner mit gesetzlichen Pflichten (KÜO, DIN 4795, F-Gas-Verordnung).',
  alternates: { canonical: 'https://torqr.de/wartungsintervall-rechner' },
  openGraph: {
    title: 'Wartungsintervall-Rechner für Heizung, Klima & Wasseraufbereitung',
    description:
      'Prüfe in 10 Sekunden, wann deine Anlage das nächste Mal gewartet werden muss — und ob eine gesetzliche Pflicht besteht.',
    url: 'https://torqr.de/wartungsintervall-rechner',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function WartungsintervallRechnerPage() {
  return (
    <>
      <MarketingHeader />
      <main className="min-h-screen bg-background pt-24">
        <section className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-4">
              Kostenloser Rechner
            </p>
            <h1 className="text-3xl sm:text-5xl font-bold text-foreground mb-4">
              Wartungsintervall-Rechner.
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Heizung, Klima, Wasseraufbereitung, Pufferspeicher: In 10 Sekunden weißt
              du, wann die nächste Wartung fällig ist und ob eine gesetzliche Pflicht
              besteht.
            </p>
          </div>
        </section>

        <section className="px-6 pb-12">
          <div className="mx-auto max-w-3xl">
            <WartungsintervallCalculator />
          </div>
        </section>

        <section className="px-6 pb-20 sm:pb-28">
          <div className="mx-auto max-w-xl">
            <div className="rounded-xl border border-border bg-brand-50/40 p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-foreground mb-2 text-center">
                Wartungsprotokoll-Vorlage + Frühzugriff zu Torqr
              </h2>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Trag dich ein und wir schicken dir die Vorlage zu, sobald sie fertig
                ist — plus Beta-Zugang zum Wartungsmanagement-Tool.
              </p>
              <WartungsintervallEmailCapture />
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Torqr Wartungsintervall-Rechner',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            url: 'https://torqr.de/wartungsintervall-rechner',
            description:
              'Kostenloser Rechner für das empfohlene Wartungsintervall von Heizung, Klima, Wasseraufbereitung und Pufferspeicher inklusive gesetzlicher Pflicht-Hinweise.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'EUR',
            },
          }),
        }}
      />
    </>
  );
}
```

- [ ] **Step 4.2: Build the project to verify routing + types**

Run (PowerShell):
```powershell
npm run build
```
Expected: build succeeds; the new route appears in the build output (e.g. `Route (app)` table lists `/wartungsintervall-rechner` as static).

- [ ] **Step 4.3: Start dev server and browser-verify the page**

Run (PowerShell, in a fresh terminal):
```powershell
npm run dev
```
Then in a browser open: `http://localhost:3000/wartungsintervall-rechner`

Manually verify:
- Header + Footer render
- Hero copy visible
- Calculator: switching system type updates the result tile and the Begründung text
- Setting baujahr to (currentYear - 20) shows the "Alt-Anlage" badge and appends the Anlagenalter-Hinweis sentence
- Email-Capture: enter invalid email → red error message; enter valid email + tick consent + submit → success screen (network tab: POST /api/beta-leads returns 201)

If port 3000 is occupied (orphan dev server from earlier):
```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

- [ ] **Step 4.4: Commit**

```powershell
git add src/app/wartungsintervall-rechner/page.tsx
git commit -m "feat(marketing): add /wartungsintervall-rechner page with SEO metadata + JSON-LD (#75)"
```

---

### Task 5: Cross-Links (FAQ + Footer)

**Files:**
- Modify: `src/components/marketing/Faq.tsx`
- Modify: `src/components/marketing/MarketingFooter.tsx`

- [ ] **Step 5.1: Add FAQ entry pointing at /wartungsintervall-rechner**

In `src/components/marketing/Faq.tsx`, insert a new entry into the `faqs` array immediately after the existing "Ist Torqr nur für Heizungsbauer geeignet?" entry (so it lives in the upper half of the list where most users see it). The replacement text below shows the unique anchor + the new entry so the Edit is unambiguous:

Replace:
```tsx
  {
    q: 'Ist Torqr nur für Heizungsbauer geeignet?',
    a: 'Nein — Torqr unterstützt vier Anlagentypen: Heizung, Klima, Wasseraufbereitung und Energiespeicher (Boiler / Pufferspeicher). 904 Hersteller-Modell-Einträge sind vorgepflegt, eigene kannst du jederzeit ergänzen.',
  },
  {
    q: 'Kann ich meine bestehende Excel-Kundenliste importieren?',
```
with:
```tsx
  {
    q: 'Ist Torqr nur für Heizungsbauer geeignet?',
    a: 'Nein — Torqr unterstützt vier Anlagentypen: Heizung, Klima, Wasseraufbereitung und Energiespeicher (Boiler / Pufferspeicher). 904 Hersteller-Modell-Einträge sind vorgepflegt, eigene kannst du jederzeit ergänzen.',
  },
  {
    q: 'Wie oft muss meine Anlage gewartet werden?',
    a: 'Heizung und Klima sind in der Regel jährlich wartungspflichtig (KÜO, DIN 4795, F-Gas-Verordnung). Wasseraufbereitung und Pufferspeicher haben keine gesetzliche Pflicht, sind aber alle 12–24 Monate sinnvoll. Genaue Empfehlung pro Anlagentyp und Baujahr im kostenlosen <a class="underline" href="/wartungsintervall-rechner">Wartungsintervall-Rechner</a>.',
  },
  {
    q: 'Kann ich meine bestehende Excel-Kundenliste importieren?',
```

Note: the `<a>` tag is rendered inside `AccordionContent`, which already accepts arbitrary children. The existing code passes the answer as a raw string into the React child slot — switch to `dangerouslySetInnerHTML` only if the inline `<a>` does not render. Inspect after the edit; if rendered as escaped text, replace the answer with JSX (split string + `<Link>` element) instead. To avoid that branch entirely, prefer the JSX form from the start:

Alternative (preferred, no HTML-string-rendering question):
```tsx
import Link from 'next/link';
// ...
  {
    q: 'Wie oft muss meine Anlage gewartet werden?',
    a: (
      <>
        Heizung und Klima sind in der Regel jährlich wartungspflichtig (KÜO,
        DIN 4795, F-Gas-Verordnung). Wasseraufbereitung und Pufferspeicher haben
        keine gesetzliche Pflicht, sind aber alle 12–24 Monate sinnvoll. Genaue
        Empfehlung pro Anlagentyp und Baujahr im kostenlosen{' '}
        <Link href="/wartungsintervall-rechner" className="underline">
          Wartungsintervall-Rechner
        </Link>
        .
      </>
    ),
  },
```

If you take the JSX form, also widen the `faqs` array element type so it accepts `ReactNode` for `a`:

Change:
```tsx
const faqs = [
```
to:
```tsx
import type { ReactNode } from 'react';
const faqs: Array<{ q: string; a: ReactNode }> = [
```

And keep all existing entries (strings are valid `ReactNode`). The render `<AccordionContent>{f.a}</AccordionContent>` continues to work unchanged.

- [ ] **Step 5.2: Add the footer link in the "Produkt" column of `MarketingFooter.tsx`**

Replace:
```tsx
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Produkt</p>
            <ul className="space-y-2 text-sm">
              <li><a href="/#features" className="text-foreground hover:text-primary">Features</a></li>
              <li><a href="/#pricing" className="text-foreground hover:text-primary">Preise</a></li>
              <li><a href="/#faq" className="text-foreground hover:text-primary">FAQ</a></li>
            </ul>
          </div>
```
with:
```tsx
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Produkt</p>
            <ul className="space-y-2 text-sm">
              <li><a href="/#features" className="text-foreground hover:text-primary">Features</a></li>
              <li><a href="/#pricing" className="text-foreground hover:text-primary">Preise</a></li>
              <li><a href="/#faq" className="text-foreground hover:text-primary">FAQ</a></li>
              <li><Link href="/wartungsintervall-rechner" className="text-foreground hover:text-primary">Wartungsintervall-Rechner</Link></li>
            </ul>
          </div>
```

`Link` is already imported at the top of the file (`import Link from 'next/link';`), so no additional import is needed.

- [ ] **Step 5.3: Verify build is clean**

Run (PowerShell):
```powershell
npm run build
```
Expected: build succeeds, no NEW warnings or errors mentioning `Faq` or `MarketingFooter`.

- [ ] **Step 5.4: Commit**

```powershell
git add src/components/marketing/Faq.tsx src/components/marketing/MarketingFooter.tsx
git commit -m "feat(marketing): link to wartungsintervall-rechner from FAQ + footer (#75)"
```

---

### Task 6: Final Quality Gate + Backlog Update

- [ ] **Step 6.1: Run the full test suite**

Run (PowerShell):
```powershell
npm run test:run
```
Expected: 758 tests pass (747 prior + 11 new wartungsintervall tests), 0 fail. If the prior baseline differs from 747, the delta should still be +11.

- [ ] **Step 6.2: Run the production build one more time**

Run (PowerShell):
```powershell
npm run build
```
Expected: clean build, `/wartungsintervall-rechner` listed in the build output as a static route.

- [ ] **Step 6.3: Manual browser verification (golden path)**

If dev server is not running:
```powershell
npm run dev
```
Then exercise each of these in the browser at `http://localhost:3000/wartungsintervall-rechner`:

1. **HEATING / Baujahr 2020** → "12 Monate", "Gesetzliche Pflicht: Ja", Begründung erwähnt KÜO und DIN 4795. Alt-Anlage: nein.
2. **AC / Baujahr 2024** → "12 Monate", "Gesetzliche Pflicht: Ja", Begründung erwähnt F-Gas / EU 517/2014. Alt-Anlage: nein.
3. **WATER_TREATMENT / Baujahr 2018** → "12 Monate", "Gesetzliche Pflicht: Nein", Begründung erwähnt Trinkwasser-Hygiene.
4. **ENERGY_STORAGE / Baujahr 2015** → "24 Monate", "Gesetzliche Pflicht: Nein", Begründung erwähnt Anode/Korrosion. Alt-Anlage: nein.
5. **HEATING / Baujahr (currentYear − 20)** → "12 Monate" + Alt-Anlage-Badge sichtbar + Begründung enthält "Anlagenalter von 20 Jahren" + "Sicht- und Funktionskontrollen".
6. **Reset-Button** erscheint sobald Eingabe vom Default abweicht, klick stellt Default-Werte wieder her.

- [ ] **Step 6.4: Manual browser verification (email-capture E2E)**

1. In Browser-DevTools-Network-Tab öffnen.
2. Form: Email = `test+sprint32@example.de`, Consent angehakt, Submit.
3. Network: `POST /api/beta-leads` → Status `201 Created`, Response `{"ok": true}`.
4. Form-Replacement: Success-Screen mit Checkmark erscheint.
5. (Optional, falls Prisma-DB lokal greifbar) Verify, dass ein neuer `BetaLead`-Row mit `source='wartungsintervall-rechner'` in der Datenbank steht:
   ```powershell
   npx prisma studio
   ```
   und dort die Tabelle `BetaLead` auf den neuen Eintrag prüfen.
6. Validierung-Negativfall: invalid email (z. B. `foo`) → roter Fehler unter dem Email-Feld, kein Submit-Request abgeschickt.
7. Honeypot-Defense: Browser-DevTools → das versteckte `website`-Input mit Wert "spam" füllen → Submit → erwartetes Verhalten: 400 vom API (Network-Tab) + Error-Banner. Da das Honeypot-Feld `display:none` ist, lässt es sich nur via DevTools setzen.

- [ ] **Step 6.5: Update BACKLOG.md — move #75 to Sprint 32 Completed**

Open `docs/BACKLOG.md` and locate the line for item #75 (Lead-Magnet-Tools / Wartungsintervall-Rechner) in the *open* section. Move it to the *Sprint 32 Completed* section with today's date `2026-05-11` and a one-line summary: *"Wartungsintervall-Rechner als Standalone-Tool + Email-Capture unter /wartungsintervall-rechner. PDF-Vorlage ist Phase 2."* If a Sprint 32 Completed section does not yet exist, create it directly above the existing Sprint 31 Completed section using the same heading style.

- [ ] **Step 6.6: Final commit (BACKLOG + any small fixes uncovered during verification)**

```powershell
git add docs/BACKLOG.md
git commit -m "docs(backlog): mark #75 Wartungsintervall-Rechner as Sprint 32 completed"
```

If verification surfaced any fix (typo, layout glitch, missing alt-text), commit it separately with an explicit `fix(marketing): ...` message before the BACKLOG commit so the history reads cleanly.

---

## Verification Summary

After Task 6 is complete, you should be able to attest to all of the following:

- `npm run test:run` → all green, +11 new tests.
- `npm run build` → clean, `/wartungsintervall-rechner` listed as a static route.
- `npx tsc --noEmit` → no new errors introduced by the plan's files.
- Manual browser walk-through covers 4 system types + alt-Anlage hint + email-capture happy path + invalid-email rejection.
- FAQ on `/` has a new entry "Wie oft muss meine Anlage gewartet werden?" linking to the new page.
- Footer "Produkt" column has a "Wartungsintervall-Rechner" link.
- `BACKLOG.md` reflects #75 as completed in Sprint 32.

---

## Notes for the Engineer

- **Tenant isolation is irrelevant here** — this is a public marketing route with no authenticated state. The only DB write happens via `/api/beta-leads`, which is already public and rate-limited (`RATE_LIMIT_PRESETS.BETA_LEAD = 5 req / hour / IP`).
- **No new analytics event needed** — `trackBetaLeadSubmitted({ tier: null, source: 'wartungsintervall-rechner' })` reuses the existing `beta_lead_submitted` PostHog event. The `source` property makes the conversion-source filterable in PostHog without code changes.
- **No new dependency installs.** All packages used (`react-hook-form`, `@hookform/resolvers/zod`, `zod`, `lucide-react`, `next/link`) are already in `package.json`.
- **Why no PDF / no download:** the handover explicitly scope-cuts `@react-pdf/renderer` to Phase 2. The "Frühzugriff sichern" CTA in the email-capture sets honest user expectations: they receive the protocol later, not on submit.
- **Why a dedicated route (not inline on `/`):** the standalone URL is a discoverable surface for SEO + outbound link-sharing. The handover explicitly asks for this.
- **Style consistency:** every visible string is in German; every identifier in English. No hex literals — only Tailwind tokens (`text-primary`, `bg-brand-50/40`, etc.).
