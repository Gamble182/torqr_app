'use client';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

const faqs = [
  {
    q: 'Was passiert nach den 30 Tagen kostenlos?',
    a: 'Du wählst den Tier, der zu dir passt — oder du kündigst. Keine Verlängerungs-Falle, keine Kreditkarte im Voraus. Wir erinnern dich rechtzeitig per E-Mail.',
  },
  {
    q: 'Ist Torqr nur für Heizungsbauer geeignet?',
    a: 'Nein — Torqr unterstützt vier Anlagentypen: Heizung, Klima, Wasseraufbereitung und Energiespeicher (Boiler / Pufferspeicher). 904 Hersteller-Modell-Einträge sind vorgepflegt, eigene kannst du jederzeit ergänzen.',
  },
  {
    q: 'Kann ich meine bestehende Excel-Kundenliste importieren?',
    a: 'Aktuell legst du Kunden manuell oder über das Anlagen-Modal an — der Geräte-Katalog beschleunigt das deutlich. Ein CSV-Import ist in Vorbereitung. Während der Beta-Phase helfen wir dir gerne beim einmaligen Initial-Import.',
  },
  {
    q: 'Was passiert mit meinen Daten, wenn ich kündige?',
    a: 'Du bekommst einen vollständigen Daten-Export (DSGVO Art. 20) — Kunden, Anlagen, Wartungs-Historie und Fotos in offenen Formaten. Kein Vendor-Lock-in.',
  },
  {
    q: 'Funktioniert Torqr offline auf der Baustelle?',
    a: 'Eingeschränkt — die App ist als Progressive Web App (PWA) installierbar und zeigt zwischengespeicherte Daten ohne Netz. Eine echte Offline-Sync mit lokaler Bearbeitung ist auf der Roadmap.',
  },
  {
    q: 'Kann ich später Mitarbeiter hinzufügen?',
    a: 'Ja — wechsle in den Professional-Tier. Du legst Mitarbeiter mit OWNER- oder TECHNICIAN-Rolle an, weist Anlagen zu und siehst die Workload je Mitarbeiter im Dashboard. Kein neuer Vertrag, kein Daten-Umzug.',
  },
];

export function Faq() {
  return (
    <section id="faq" className="py-20 sm:py-28 px-6 border-t border-border bg-background">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Häufige Fragen.</h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base font-medium">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
