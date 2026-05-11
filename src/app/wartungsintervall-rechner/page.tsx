// src/app/wartungsintervall-rechner/page.tsx
import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { WartungsintervallCalculator } from '@/components/marketing/WartungsintervallCalculator';
import { WartungsintervallEmailCapture } from '@/components/marketing/WartungsintervallEmailCapture';

export const metadata: Metadata = {
  title: 'Wartungsintervall-Rechner',
  description:
    'Kostenloser Rechner: Wann muss deine Heizung, Klima, Wasseraufbereitung oder dein Pufferspeicher gewartet werden? Mit KÜO, DIN 4795 und F-Gas-Pflichten.',
  alternates: { canonical: 'https://torqr.de/wartungsintervall-rechner' },
  openGraph: {
    title: 'Wartungsintervall-Rechner für Heizung, Klima & Wasseraufbereitung',
    description:
      'Prüfe in 10 Sekunden, wann deine Anlage das nächste Mal gewartet werden muss — und ob eine gesetzliche Pflicht besteht.',
    url: 'https://torqr.de/wartungsintervall-rechner',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function WartungsintervallRechnerPage() {
  return (
    <>
      <MarketingHeader />
      <main className="min-h-screen bg-background pt-24">
        <section className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-4">
              Kostenloser Rechner
            </p>
            <h1 className="text-3xl sm:text-5xl font-bold text-foreground mb-4">
              Wartungsintervall-Rechner.
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Heizung, Klima, Wasseraufbereitung, Pufferspeicher: In 10 Sekunden weißt
              du, wann die nächste Wartung fällig ist und ob eine gesetzliche Pflicht
              besteht.
            </p>
          </div>
        </section>

        <section className="px-6 pb-12">
          <div className="mx-auto max-w-3xl">
            <WartungsintervallCalculator />
          </div>
        </section>

        <section className="px-6 pb-20 sm:pb-28">
          <div className="mx-auto max-w-xl">
            <div className="rounded-xl border border-border bg-brand-50/40 p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-foreground mb-2 text-center">
                Wartungsprotokoll-Vorlage + Frühzugriff zu Torqr
              </h2>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Trag dich ein und wir schicken dir die Vorlage zu, sobald sie fertig
                ist — plus Beta-Zugang zum Wartungsmanagement-Tool.
              </p>
              <WartungsintervallEmailCapture />
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Torqr Wartungsintervall-Rechner',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            url: 'https://torqr.de/wartungsintervall-rechner',
            description:
              'Kostenloser Rechner für das empfohlene Wartungsintervall von Heizung, Klima, Wasseraufbereitung und Pufferspeicher inklusive gesetzlicher Pflicht-Hinweise.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'EUR',
            },
          }),
        }}
      />
    </>
  );
}
