import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Impressum von Torqr nach § 5 Digitale-Dienste-Gesetz (DDG).',
  robots: { index: true, follow: false },
};

export default function ImpressumPage() {
  return (
    <>
      <MarketingHeader />
      <main className="min-h-screen bg-background pt-24">
        <article className="mx-auto max-w-3xl px-6 py-16 prose prose-sm sm:prose-base">
          <h1>Impressum</h1>

          <h2>1. Angaben gemäß § 5 DDG</h2>
          <p>
            Anbieter dieses Telemediendienstes nach § 5 Digitale-Dienste-Gesetz (DDG):
          </p>
          <p>
            <strong>Yannik Dorth</strong>
            <br />
            Puller Weg 2<br />
            35794 Mengerskirchen<br />
            Deutschland
          </p>

          <h2>2. Kontakt</h2>
          <p>
            E-Mail: <a href="mailto:hello@torqr.de">hello@torqr.de</a>
          </p>

          <h2>3. Umsatzsteuer</h2>
          <p>
            Der Anbieter nimmt die Kleinunternehmerregelung nach{' '}
            <strong>§ 19 Abs. 1 UStG</strong> in Anspruch. Aus diesem Grund wird in Rechnungen keine
            Umsatzsteuer ausgewiesen und es wird keine Umsatzsteuer-Identifikationsnummer nach § 27 a
            UStG geführt.
          </p>

          <h2>4. Berufsbezeichnung und berufsrechtliche Regelungen</h2>
          <p>
            Tätigkeitsbezeichnung: Software-Entwicklung und Betrieb von Software-as-a-Service-Diensten.
          </p>
          <p>
            Eine berufsständische Kammer- oder Aufsichtspflicht besteht für diese Tätigkeit nicht.
          </p>

          <h2>5. Streitschlichtung</h2>
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit,
            abrufbar unter{' '}
            <a
              href="https://ec.europa.eu/consumers/odr"
              rel="noopener noreferrer"
            >
              https://ec.europa.eu/consumers/odr
            </a>
            .
          </p>
          <p>
            Wir richten unser Angebot überwiegend an Unternehmer im Sinne des § 14 BGB;
            verbraucherrechtliche Schlichtungsverfahren sind insoweit nicht eröffnet. Im Übrigen sind
            wir nach <strong>§ 36 Abs. 1 VSBG</strong> weder bereit noch verpflichtet, an einem
            Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>

          <h2>6. Haftung für Inhalte</h2>
          <p>
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten
            nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als
            Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
            Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
            Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von
            Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche
            Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung
            möglich. Bei Bekanntwerden entsprechender Rechtsverletzungen werden wir diese Inhalte
            umgehend entfernen.
          </p>

          <h2>7. Haftung für Links</h2>
          <p>
            Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen
            Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
            Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
            Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf
            mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der
            Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten
            ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei
            Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
          </p>

          <h2>8. Urheberrecht</h2>
          <p>
            Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
            dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
            der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen
            Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind
            nur für den privaten, nicht kommerziellen Gebrauch gestattet.
          </p>
          <p>
            Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die
            Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche
            gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden,
            bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen
            werden wir derartige Inhalte umgehend entfernen.
          </p>

          <p className="mt-8">
            <Link href="/">← Zurück zur Startseite</Link>
          </p>
        </article>
      </main>
      <MarketingFooter />
    </>
  );
}
