import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Impressum von Torqr nach §5 TMG.',
  robots: { index: true, follow: false },
};

export default function ImpressumPage() {
  return (
    <>
      <MarketingHeader />
      <main className="min-h-screen bg-background pt-24">
        <article className="mx-auto max-w-3xl px-6 py-16 prose prose-sm sm:prose-base">
          <h1>Impressum</h1>

          <h2>Angaben gemäß §5 TMG</h2>
          <p>
            {/* TODO: vollständige Adresse + Steuer-ID/USt-ID einfügen */}
            Yannik Dorth<br />
            [Straße + Hausnummer]<br />
            [PLZ] [Ort]<br />
            Deutschland
          </p>

          <h2>Kontakt</h2>
          <p>
            E-Mail: <a href="mailto:hello@torqr.de">hello@torqr.de</a><br />
            {/* Optional: Telefon */}
          </p>

          <h2>Umsatzsteuer-ID</h2>
          <p>{/* TODO: USt-ID einfügen, falls vorhanden — andernfalls Sektion entfernen */}</p>

          <h2>Verantwortlich für den Inhalt nach §55 Abs. 2 RStV</h2>
          <p>Yannik Dorth (Anschrift wie oben)</p>

          <h2>Streitschlichtung</h2>
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
            <a href="https://ec.europa.eu/consumers/odr" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr</a>.
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>

          <h2>Haftung für Inhalte</h2>
          <p>
            Als Diensteanbieter sind wir gemäß §7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den
            allgemeinen Gesetzen verantwortlich. Nach §§8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht
            verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen
            zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
          </p>

          <p className="mt-8"><Link href="/">← Zurück zur Startseite</Link></p>
        </article>
      </main>
      <MarketingFooter />
    </>
  );
}
