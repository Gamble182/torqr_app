// src/components/marketing/FeatureSection.tsx
import { FeatureBlock } from './FeatureBlock';

const features = [
  {
    eyebrow: 'MOBILE WARTUNGS-CHECKLIST',
    title: 'Wartung in 30 Sekunden — vor dem Gerät.',
    description: 'Drei klick-schnelle Schritte mit Fotos, Notizen und Bestätigung. Direkt am Smartphone, direkt vor der Anlage.',
    bullets: [
      '3-Step-Modal: Checkliste · Notizen+Fotos · Bestätigen',
      'Pro Anlagentyp vorgegebene Default-Items, anpassbar',
      'Immutable JSON-Snapshot pro Wartung — Historie unveränderlich',
    ],
    imageSrc: '/marketing/features/checklist-mobile.gif',
    imageAlt: 'Mobile Wartungs-Checklist als 3-Step-Wizard',
    isGif: true,
  },
  {
    eyebrow: 'FOTO-DOKUMENTATION',
    title: 'Lückenlose Foto-Doku pro Anlage.',
    description: 'Bis zu 5 Fotos pro Anlage. Alle Bilder bleiben pro Wartung historisch erhalten — keine versehentlichen Löschungen.',
    bullets: [
      'Bis zu 5 Fotos pro Anlage, JPEG/PNG/WebP',
      'Lightbox-Galerie zum Durchblättern',
      'Historische Wartungs-Fotos bleiben unveränderlich erhalten',
    ],
    imageSrc: '/marketing/features/photo-doku-desktop.png',
    imageAlt: 'Anlagen-Detail-Page mit Foto-Galerie und Lightbox',
  },
  {
    eyebrow: 'MULTI-SYSTEM & 904 GERÄTE-KATALOG',
    title: 'Heizung, Klima, Wasser, Energiespeicher — eine App.',
    description: 'Vier Anlagentypen mit eigenem Hersteller- und Modell-Katalog. 904 Einträge vorgepflegt, eigene jederzeit ergänzbar.',
    bullets: [
      'Vier Anlagentypen (Heizung · Klima · Wasseraufbereitung · Energiespeicher)',
      '904 Hersteller- und Modell-Einträge vorgepflegt',
      'Eigene Geräte jederzeit ergänzbar',
    ],
    imageSrc: '/marketing/features/multisystem-desktop.png',
    imageAlt: 'Anlagen-Liste mit Multi-System-Filter-Chips',
  },
  {
    eyebrow: 'MULTI-USER & WORKLOAD',
    title: 'Mit Mitarbeitern wachsen, ohne System zu wechseln.',
    description: 'Sobald du den ersten Techniker einstellst, läuft Torqr mit. Mit klaren Rollen, Anlagen-Zuweisung und einer Workload-Übersicht.',
    bullets: [
      'OWNER- und TECHNICIAN-Rollen mit feinkörnigen Rechten',
      'Anlagen-Zuweisung pro Mitarbeiter, Bulk-Reassign',
      'Workload-Page mit Stats-Tiles je Mitarbeiter',
    ],
    imageSrc: '/marketing/features/workload-desktop.png',
    imageAlt: 'Techniker-Workload-Page mit Stats-Tiles',
  },
];

export function FeatureSection() {
  return (
    <section id="features" className="py-20 sm:py-28 px-6 border-t border-border bg-background">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Was Torqr für dich tut.</h2>
        </div>

        <div className="space-y-20 sm:space-y-28">
          {features.map((f, i) => (
            <FeatureBlock key={f.eyebrow} {...f} reverse={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
