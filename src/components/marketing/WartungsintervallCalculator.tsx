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
