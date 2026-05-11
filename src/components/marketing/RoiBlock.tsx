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
    sub: 'Vergessene Wartungen kosten Kunden — Torqr fängt sie ab',
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
              <p className="text-2xl sm:text-3xl font-bold text-foreground mb-2 text-balance">{t.headline}</p>
              <p className="text-sm text-muted-foreground text-balance">{t.sub}</p>
            </div>
          ))}
        </div>

        <RoiCalculator />
      </div>
    </section>
  );
}
