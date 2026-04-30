import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from 'lucide-react';

const stats = [
  { value: '1', label: 'Aktiver Pilotbetrieb' },
  { value: '28', label: 'Sprints geliefert' },
  { value: '324', label: 'Grüne Tests' },
];

export function PilotStatus() {
  return (
    <section id="pilot" className="py-20 sm:py-28 px-6 border-t border-border bg-background">
      <div className="mx-auto max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/30 bg-brand-accent-surface text-xs uppercase tracking-[1.5px] text-amber-900 font-medium mb-6">
          ▰ Aktuell in der Beta-Phase
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
          Wir entwickeln Torqr <span className="text-primary">gemeinsam</span> mit echten Heizungsbauern.
        </h2>

        <p className="mt-6 text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Aktuell läuft Torqr mit einem aktiven Pilotbetrieb. Die ersten Beta-Plätze sind verfügbar —
          wir nehmen pro Woche maximal drei neue Heizungsbau-Betriebe auf, um sauberes Onboarding zu garantieren.
        </p>

        <div className="mt-10 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl sm:text-4xl font-bold text-primary">{s.value}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <Link href="#cta-pilot">
            <Button size="lg">Beta-Liste eintragen <ArrowRightIcon className="h-4 w-4" /></Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
