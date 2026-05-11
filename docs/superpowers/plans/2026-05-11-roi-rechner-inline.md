# ROI-Rechner Inline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static "Was bedeutet das in einem Jahr?" block in `RoiBlock.tsx` with an interactive calculator that lets the visitor adjust *Wartungsverträge* and *Stundensatz* and see the resulting ROI factor, annual time-value, and break-even point update live.

**Architecture:** Pure computation lives in a tiny library function (`src/lib/marketing/roi.ts`) covered by vitest unit tests. The interactive UI is a single client component (`RoiCalculator.tsx`) mounted inside the existing server-rendered `RoiBlock`. No new state-management library, no new endpoints, no persistence — everything is client-local.

**Tech Stack:** React (Next 14 App Router, client component for the calculator), Tailwind, vitest. Numbers formatted with `Intl.NumberFormat('de-DE')` (already used elsewhere in the codebase).

**Constants (derived from existing static copy, locked as named exports for review):**

| Constant | Value | Provenance |
|---|---|---|
| `HOURS_SAVED_PER_CONTRACT_PER_WEEK` | `0.12` | 6 h/week ÷ 50 contracts (existing tile "6 h pro Woche zurück" / "Bei 50 Wartungsverträgen") |
| `WORK_WEEKS_PER_YEAR` | `48` | Existing tile "Bei 40 €/h Stundensatz · 48 Arbeitswochen" |
| `SOLO_TIER_ANNUAL_PRICE_EUR` | `348` | Existing copy "€348/Jahr Solo-Tier" |
| `DEFAULT_CONTRACTS` | `50` | Existing default in static copy |
| `DEFAULT_HOURLY_RATE_EUR` | `40` | Existing default in static copy |
| `MIN_CONTRACTS` / `MAX_CONTRACTS` | `10` / `500` | Reasonable Solo-Betrieb to small-team range |
| `MIN_HOURLY_RATE_EUR` / `MAX_HOURLY_RATE_EUR` | `20` / `150` | Realistic SHK-Stundensatz-Spanne |

If the user changes a constant later, only `roi.ts` and the test file need updating.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/marketing/roi.ts` (create) | Named constants + pure `computeRoi()` function returning `{ savedHoursPerYear, annualValueEur, roiFactor, breakEvenWeeks }` |
| `src/lib/marketing/__tests__/roi.test.ts` (create) | Vitest tests for defaults, linear scaling, hourly-rate scaling, zero-contract edge case |
| `src/components/marketing/RoiCalculator.tsx` (create) | `'use client'` component: two range+number inputs, live result panel, reset button |
| `src/components/marketing/RoiBlock.tsx` (modify) | Replace lines 40–55 (static "Was bedeutet das in einem Jahr?" block + TODO marker) with `<RoiCalculator />` |

---

### Task 1: Pure ROI computation function (TDD)

**Files:**
- Create: `src/lib/marketing/roi.ts`
- Test: `src/lib/marketing/__tests__/roi.test.ts`

- [ ] **Step 1.1: Write the failing test file**

```typescript
// src/lib/marketing/__tests__/roi.test.ts
import { describe, expect, it } from 'vitest';
import {
  computeRoi,
  DEFAULT_CONTRACTS,
  DEFAULT_HOURLY_RATE_EUR,
  HOURS_SAVED_PER_CONTRACT_PER_WEEK,
  SOLO_TIER_ANNUAL_PRICE_EUR,
  WORK_WEEKS_PER_YEAR,
} from '@/lib/marketing/roi';

describe('computeRoi', () => {
  it('matches the existing static-copy baseline (50 contracts, 40 €/h)', () => {
    const result = computeRoi({
      contracts: DEFAULT_CONTRACTS,
      hourlyRate: DEFAULT_HOURLY_RATE_EUR,
    });
    expect(result.savedHoursPerYear).toBeCloseTo(288, 5);
    expect(result.annualValueEur).toBeCloseTo(11520, 5);
    expect(result.roiFactor).toBeCloseTo(11520 / SOLO_TIER_ANNUAL_PRICE_EUR, 5);
    expect(result.breakEvenWeeks).toBeCloseTo(
      52 / (11520 / SOLO_TIER_ANNUAL_PRICE_EUR),
      5,
    );
  });

  it('scales saved hours linearly with contract count', () => {
    const a = computeRoi({ contracts: 50, hourlyRate: 40 });
    const b = computeRoi({ contracts: 100, hourlyRate: 40 });
    expect(b.savedHoursPerYear).toBeCloseTo(a.savedHoursPerYear * 2, 5);
    expect(b.annualValueEur).toBeCloseTo(a.annualValueEur * 2, 5);
    expect(b.roiFactor).toBeCloseTo(a.roiFactor * 2, 5);
  });

  it('scales annual value linearly with hourly rate but leaves saved hours unchanged', () => {
    const a = computeRoi({ contracts: 50, hourlyRate: 40 });
    const b = computeRoi({ contracts: 50, hourlyRate: 80 });
    expect(b.savedHoursPerYear).toBeCloseTo(a.savedHoursPerYear, 5);
    expect(b.annualValueEur).toBeCloseTo(a.annualValueEur * 2, 5);
    expect(b.roiFactor).toBeCloseTo(a.roiFactor * 2, 5);
  });

  it('returns roiFactor 0 and Infinity break-even for zero contracts', () => {
    const result = computeRoi({ contracts: 0, hourlyRate: 40 });
    expect(result.savedHoursPerYear).toBe(0);
    expect(result.annualValueEur).toBe(0);
    expect(result.roiFactor).toBe(0);
    expect(result.breakEvenWeeks).toBe(Infinity);
  });

  it('uses the documented constants', () => {
    expect(HOURS_SAVED_PER_CONTRACT_PER_WEEK).toBe(0.12);
    expect(WORK_WEEKS_PER_YEAR).toBe(48);
    expect(SOLO_TIER_ANNUAL_PRICE_EUR).toBe(348);
  });
});
```

- [ ] **Step 1.2: Run the test to verify it fails**

Run: `npm run test:run -- src/lib/marketing/__tests__/roi.test.ts`
Expected: FAIL with "Cannot find module '@/lib/marketing/roi'"

- [ ] **Step 1.3: Write the minimal implementation**

```typescript
// src/lib/marketing/roi.ts
export const HOURS_SAVED_PER_CONTRACT_PER_WEEK = 0.12;
export const WORK_WEEKS_PER_YEAR = 48;
export const SOLO_TIER_ANNUAL_PRICE_EUR = 348;

export const DEFAULT_CONTRACTS = 50;
export const DEFAULT_HOURLY_RATE_EUR = 40;

export const MIN_CONTRACTS = 10;
export const MAX_CONTRACTS = 500;
export const MIN_HOURLY_RATE_EUR = 20;
export const MAX_HOURLY_RATE_EUR = 150;

export interface RoiInput {
  contracts: number;
  hourlyRate: number;
}

export interface RoiResult {
  savedHoursPerYear: number;
  annualValueEur: number;
  roiFactor: number;
  breakEvenWeeks: number;
}

export function computeRoi({ contracts, hourlyRate }: RoiInput): RoiResult {
  const savedHoursPerYear =
    contracts * HOURS_SAVED_PER_CONTRACT_PER_WEEK * WORK_WEEKS_PER_YEAR;
  const annualValueEur = savedHoursPerYear * hourlyRate;
  const roiFactor =
    annualValueEur === 0 ? 0 : annualValueEur / SOLO_TIER_ANNUAL_PRICE_EUR;
  const breakEvenWeeks = roiFactor === 0 ? Infinity : 52 / roiFactor;
  return { savedHoursPerYear, annualValueEur, roiFactor, breakEvenWeeks };
}
```

- [ ] **Step 1.4: Run the test to verify it passes**

Run: `npm run test:run -- src/lib/marketing/__tests__/roi.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 1.5: Commit**

```bash
git add src/lib/marketing/roi.ts src/lib/marketing/__tests__/roi.test.ts
git commit -m "feat(marketing): add ROI computation library with TDD coverage (#91)"
```

---

### Task 2: Interactive RoiCalculator client component

**Files:**
- Create: `src/components/marketing/RoiCalculator.tsx`

No vitest test for this component — vitest is configured for `environment: 'node'`, no jsdom. Visual + interactive behavior is verified in Task 4 against the running dev server.

- [ ] **Step 2.1: Build the component**

```tsx
// src/components/marketing/RoiCalculator.tsx
'use client';

import { useState } from 'react';
import { RotateCcwIcon } from 'lucide-react';
import {
  computeRoi,
  DEFAULT_CONTRACTS,
  DEFAULT_HOURLY_RATE_EUR,
  MAX_CONTRACTS,
  MAX_HOURLY_RATE_EUR,
  MIN_CONTRACTS,
  MIN_HOURLY_RATE_EUR,
  SOLO_TIER_ANNUAL_PRICE_EUR,
} from '@/lib/marketing/roi';

const integerFormatter = new Intl.NumberFormat('de-DE', {
  maximumFractionDigits: 0,
});
const currencyFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

export function RoiCalculator() {
  const [contracts, setContracts] = useState<number>(DEFAULT_CONTRACTS);
  const [hourlyRate, setHourlyRate] = useState<number>(DEFAULT_HOURLY_RATE_EUR);

  const result = computeRoi({ contracts, hourlyRate });
  const isDefault =
    contracts === DEFAULT_CONTRACTS && hourlyRate === DEFAULT_HOURLY_RATE_EUR;

  return (
    <div className="rounded-xl bg-background border border-border p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-foreground">
          Was bedeutet das für deinen Betrieb?
        </h3>
        {!isDefault && (
          <button
            type="button"
            onClick={() => {
              setContracts(DEFAULT_CONTRACTS);
              setHourlyRate(DEFAULT_HOURLY_RATE_EUR);
            }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcwIcon className="h-3.5 w-3.5" />
            Zurücksetzen
          </button>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 mb-6">
        <SliderField
          label="Wartungsverträge"
          unit="Verträge"
          min={MIN_CONTRACTS}
          max={MAX_CONTRACTS}
          step={1}
          value={contracts}
          onChange={(v) => setContracts(clamp(v, MIN_CONTRACTS, MAX_CONTRACTS))}
        />
        <SliderField
          label="Stundensatz"
          unit="€/h"
          min={MIN_HOURLY_RATE_EUR}
          max={MAX_HOURLY_RATE_EUR}
          step={5}
          value={hourlyRate}
          onChange={(v) =>
            setHourlyRate(clamp(v, MIN_HOURLY_RATE_EUR, MAX_HOURLY_RATE_EUR))
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 pt-6 border-t border-border">
        <ResultTile
          label="Zeit-Wert pro Jahr"
          value={currencyFormatter.format(result.annualValueEur)}
          sub={`${integerFormatter.format(result.savedHoursPerYear)} h gespart`}
        />
        <ResultTile
          label="ROI-Faktor"
          value={`${integerFormatter.format(result.roiFactor)}×`}
          sub={`vs. €${SOLO_TIER_ANNUAL_PRICE_EUR}/Jahr Solo-Tier`}
          highlight
        />
        <ResultTile
          label="Break-even"
          value={
            Number.isFinite(result.breakEvenWeeks)
              ? `${integerFormatter.format(result.breakEvenWeeks)} Wochen`
              : '—'
          }
          sub="bis Torqr sich bezahlt hat"
        />
      </div>

      <p className="mt-6 text-xs italic text-muted-foreground text-center max-w-2xl mx-auto">
        Annahme: ~7 Min administrative Arbeit pro Vertrag pro Woche, die Torqr automatisiert.
        Basis: Pilotkunden-Daten + Business-Model-Canvas 2024. Die ersten 30 Tage sind kostenlos —
        du gehst kein Risiko ein.
      </p>
    </div>
  );
}

interface SliderFieldProps {
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}

function SliderField({
  label,
  unit,
  min,
  max,
  step,
  value,
  onChange,
}: SliderFieldProps) {
  const id = `roi-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          <input
            id={id}
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-20 px-2 py-1 text-sm text-right border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${label} (Schieberegler)`}
        className="w-full accent-primary"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

interface ResultTileProps {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}

function ResultTile({ label, value, sub, highlight = false }: ResultTileProps) {
  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </p>
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

- [ ] **Step 2.2: Verify TypeScript compiles for the new file**

Run: `npx tsc --noEmit src/components/marketing/RoiCalculator.tsx 2>&1 | grep -E "RoiCalculator\.tsx|^error"` (Windows PowerShell: `npx tsc --noEmit src/components/marketing/RoiCalculator.tsx 2>&1 | Select-String "RoiCalculator|error"`)
Expected: No errors mentioning `RoiCalculator.tsx`. Pre-existing analytics-module errors are out of scope.

- [ ] **Step 2.3: Commit**

```bash
git add src/components/marketing/RoiCalculator.tsx
git commit -m "feat(marketing): add interactive RoiCalculator client component (#91)"
```

---

### Task 3: Wire RoiCalculator into RoiBlock and remove TODO marker

**Files:**
- Modify: `src/components/marketing/RoiBlock.tsx`

- [ ] **Step 3.1: Replace the static "Was bedeutet das in einem Jahr?" block + TODO marker**

Open `src/components/marketing/RoiBlock.tsx`. Replace lines 40–56 (the `<div className="rounded-xl bg-background border border-border p-8 text-center">…</div>`, the trailing `<p className="mt-6 text-xs italic …">…</p>`, and the `{/* TODO V2: ROI-Rechner-Tool … */}` marker) with a single `<RoiCalculator />`. Add the import at the top.

The result should look like:

```tsx
// src/components/marketing/RoiBlock.tsx
import { ClockIcon, EuroIcon, ShieldCheckIcon } from 'lucide-react';
import { RoiCalculator } from './RoiCalculator';

const tiles = [
  {
    icon: ClockIcon,
    headline: '6 h pro Woche zurück',
    sub: 'Weniger Excel, weniger Telefon, mehr Werkstatt-Zeit',
  },
  {
    icon: EuroIcon,
    headline: '~12.000 €/Jahr Zeit-Wert',
    sub: 'Bei 40 €/h Stundensatz · 48 Arbeitswochen',
  },
  {
    icon: ShieldCheckIcon,
    headline: '~5 % weniger Kundenabwanderung',
    sub: 'Vergessene Wartungen kosten Kunden — Torqr fängt sie automatisch ab',
  },
];

export function RoiBlock() {
  return (
    <section id="roi" className="py-20 sm:py-28 px-6 border-t border-border bg-brand-50/40">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Was Torqr dir zurückgibt.</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-3 mb-12">
          {tiles.map((t) => (
            <div key={t.headline} className="rounded-xl border border-border bg-background p-8 text-center">
              <t.icon className="h-8 w-8 text-primary mx-auto mb-4" />
              <p className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{t.headline}</p>
              <p className="text-sm text-muted-foreground">{t.sub}</p>
            </div>
          ))}
        </div>

        <RoiCalculator />
      </div>
    </section>
  );
}
```

- [ ] **Step 3.2: Run the full vitest suite**

Run: `npm run test:run`
Expected: PASS — total test count = previous (742) + 5 new from Task 1 = **747 tests**

- [ ] **Step 3.3: Commit**

```bash
git add src/components/marketing/RoiBlock.tsx
git commit -m "feat(marketing): replace static ROI block with interactive calculator (#91)"
```

---

### Task 4: Visual + interactive verification in dev server

This is the manual-verification gate. CLAUDE.md mandates browser verification for UI changes.

- [ ] **Step 4.1: Start the dev server**

Run: `npm run dev`
Expected: Next.js boots on http://localhost:3000.

- [ ] **Step 4.2: Open the landing page**

Navigate to `http://localhost:3000/#roi` and confirm:
- Three top tiles ("6 h pro Woche zurück" / "~12.000 €/Jahr Zeit-Wert" / "~5 % weniger Kundenabwanderung") render unchanged.
- Below the tiles, the interactive `<RoiCalculator />` renders with two slider+input pairs (Wartungsverträge, Stundensatz) and three result tiles (Zeit-Wert pro Jahr, ROI-Faktor, Break-even).
- Default values: 50 Wartungsverträge, 40 €/h.
- Default result tiles: ~12.000 € Zeit-Wert (288 h gespart), 33× ROI-Faktor, 2 Wochen Break-even. (33× rounds to "33", not "35×" — that's because the existing static copy rounded up; the calculator now shows the precise number.)

- [ ] **Step 4.3: Interact with the inputs**

- Move the *Wartungsverträge* slider to 100 → confirm "Zeit-Wert pro Jahr" doubles, "ROI-Faktor" doubles.
- Type 80 in the *Stundensatz* number input → confirm "Zeit-Wert pro Jahr" and "ROI-Faktor" double again from the previous step.
- Move *Wartungsverträge* slider to 10 (minimum) → confirm result tiles stay finite.
- Click "Zurücksetzen" → values return to 50/40, button disappears.

- [ ] **Step 4.4: Mobile-Layout-Check**

Open Chrome DevTools mobile emulator (375 px width) and confirm the calculator stays readable: input/slider rows stack vertically, result tiles stack to one column.

- [ ] **Step 4.5: Production build smoke**

Stop dev server. Run: `npm run build`
Expected: Build succeeds. Pre-existing analytics-module type errors are surfaced but should not be from `RoiCalculator.tsx` / `RoiBlock.tsx` / `roi.ts`.

If new build errors appear in the three new/modified files: **stop, debug, do not commit yet.** If only pre-existing errors appear: proceed.

- [ ] **Step 4.6: No commit needed for verification step**

If anything in 4.1–4.5 fails, fix it and produce an additional commit *before* moving on. Otherwise, mark Task 4 done.

---

## Self-Review Checklist (already run)

- **Spec coverage:** Task 1 covers the pure logic. Task 2 covers the interactive UI. Task 3 wires it in and removes the TODO marker (the spec's literal mention). Task 4 is the verification gate the CLAUDE.md house rules require for UI changes. ✓
- **Placeholder scan:** No "TBD", no "implement later", no "similar to". ✓
- **Type consistency:** `RoiInput`, `RoiResult`, `computeRoi`, all constants used in Task 2 match Task 1 definitions. ✓
- **Conventional Commits:** All commits use `feat(marketing): …` per the project convention. ✓

---

## Open Questions for the Reviewer

1. **Constants are derived from the existing static copy.** If you want different defaults or a different per-contract savings rate (e.g. 7 min/week was an inference), update `src/lib/marketing/roi.ts` and the test will catch any baseline drift.
2. **Pricing tier is hard-coded to Solo (€348/Jahr).** A future enhancement could let visitors choose a tier, but the spec says "ROI-Faktor" singular — Solo is the conservative anchor.
3. **No analytics tracking** is wired into the calculator. If you want a `roi_calculator_interacted` event, ask separately — out of scope for #91.
