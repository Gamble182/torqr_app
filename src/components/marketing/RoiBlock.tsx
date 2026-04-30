// src/components/marketing/RoiBlock.tsx
import { ClockIcon, EuroIcon, ShieldCheckIcon } from 'lucide-react';

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

        <div className="rounded-xl bg-background border border-border p-8 text-center">
          <h3 className="text-base font-semibold text-foreground mb-3">Was bedeutet das in einem Jahr?</h3>
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Bei 50 Wartungsverträgen und €348/Jahr Solo-Tier:{' '}
            <strong className="text-foreground">ROI-Faktor ~35×.</strong> Break-even nach knapp{' '}
            <strong className="text-foreground">zwei Wochen.</strong> Die ersten 30 Tage sind kostenlos —
            du gehst kein Risiko ein.
          </p>
        </div>

        <p className="mt-6 text-xs italic text-muted-foreground text-center max-w-2xl mx-auto">
          ø-Werte für Solo-Betriebe mit ~50 Wartungsverträgen. Basis: Business-Model-Canvas-Berechnung 2024,
          validiert mit Pilotkunden-Daten.
        </p>

        {/* TODO V2: ROI-Rechner-Tool — Inline-CTA aktivieren wenn /roi-rechner live ist */}
      </div>
    </section>
  );
}
