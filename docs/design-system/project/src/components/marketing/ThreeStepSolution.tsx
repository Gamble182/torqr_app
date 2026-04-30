// src/components/marketing/ThreeStepSolution.tsx
import { DatabaseIcon, BellRingIcon, SmartphoneIcon } from 'lucide-react';

const steps = [
  {
    icon: DatabaseIcon,
    title: 'Alles an einem Ort',
    body: 'Kunden, Anlagen, Wartungshistorie und Fotos im selben System — mobil und Desktop.',
  },
  {
    icon: BellRingIcon,
    title: 'Automatisch erinnert',
    body: 'Deine Kunden bekommen 4 Wochen + 1 Woche vor jedem Termin eine Mail. Der Wartungstermin ist mit einem Klick gebucht — ohne Telefon-Pingpong.',
  },
  {
    icon: SmartphoneIcon,
    title: 'Mobil dokumentiert',
    body: '3-Step-Wartungs-Checklist mit Fotos und Notizen, direkt vor Ort am Smartphone. Historie bleibt unveränderlich.',
  },
];

export function ThreeStepSolution() {
  return (
    <section id="how" className="py-20 sm:py-28 px-6 border-t border-border bg-brand-50/40">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Mit Torqr läuft das so.</h2>
        </div>

        <div className="grid gap-10 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="text-center sm:text-left">
              <div className="flex items-baseline justify-center sm:justify-start gap-3 mb-4">
                <span className="text-5xl font-bold text-accent">{i + 1}</span>
                <s.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
