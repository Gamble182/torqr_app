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
