// src/components/marketing/PainBlock.tsx
import { AlertTriangleIcon } from 'lucide-react';

const pains = [
  {
    title: 'Die Excel-Liste vom letzten Jahr — wer pflegt die noch?',
    body: 'Kunden-Adressen, Anlagen, Wartungsdaten in 4 Dateien verteilt, jede mit anderem Stand.',
  },
  {
    title: 'Wieder ein Anruf, weil die Wartung vergessen wurde.',
    body: '5 % der Termine rutschen durch — und es ist immer der Kunde, der erinnert.',
  },
  {
    title: 'Wo ist das Foto der Anlage von 2024?',
    body: 'Wartungs-Doku verstreut zwischen WhatsApp, Galerie und Notizen.',
  },
];

export function PainBlock() {
  return (
    <section id="pain" className="py-20 sm:py-28 px-6 border-t border-border bg-background">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Kennst du das?</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Drei Probleme, die in jedem Heizungsbau-Betrieb wiederkehren — und die Torqr beim
            Wegräumen hilft.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {pains.map((p) => (
            <div key={p.title} className="rounded-xl border border-border bg-card p-6">
              <AlertTriangleIcon className="h-5 w-5 text-accent mb-4" />
              <h3 className="text-base font-semibold text-foreground mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
