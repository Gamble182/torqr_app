import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung',
  description:
    'Datenschutzerklärung von Torqr nach DSGVO, BDSG und TDDDG. Verarbeitete Daten, Rechtsgrundlagen, Auftragsverarbeiter und Betroffenenrechte.',
  robots: { index: true, follow: false },
};

export default function DatenschutzPage() {
  return (
    <>
      <MarketingHeader />
      <main className="min-h-screen bg-background pt-24">
        <article className="mx-auto max-w-3xl px-6 py-16 prose prose-sm sm:prose-base">
          <h1>Datenschutzerklärung</h1>
          <p className="text-muted-foreground">
            Stand: <time>{new Date().toLocaleDateString('de-DE')}</time>
          </p>

          <p>
            Diese Datenschutzerklärung informiert Sie nach Art. 13 und 14 DSGVO über die Verarbeitung
            personenbezogener Daten beim Besuch und der Nutzung der Internetseite{' '}
            <strong>torqr.de</strong> sowie der dort angebotenen Wartungsmanagement-Plattform Torqr
            (im Folgenden &quot;Torqr&quot; oder &quot;die Plattform&quot;).
          </p>

          <h2>1. Verantwortlicher</h2>
          <p>Verantwortlicher im Sinne des Art. 4 Nr. 7 DSGVO ist:</p>
          <p>
            <strong>Yannik Dorth</strong>
            <br />
            Puller Weg 2<br />
            35794 Mengerskirchen<br />
            Deutschland
          </p>
          <p>
            E-Mail: <a href="mailto:hello@torqr.de">hello@torqr.de</a>
          </p>
          <p>
            Ein Datenschutzbeauftragter ist nicht bestellt, da die gesetzlichen Voraussetzungen nach
            Art. 37 DSGVO i.V.m. § 38 BDSG (mehr als 20 ständig mit der automatisierten Verarbeitung
            beschäftigte Personen, Kerntätigkeit umfangreicher Verarbeitung besonderer Kategorien
            personenbezogener Daten) nicht erfüllt sind. Datenschutzanfragen richten Sie bitte direkt
            an die oben genannte E-Mail-Adresse.
          </p>

          <h2>2. Rollen und Verantwortlichkeiten</h2>
          <p>
            Torqr wird sowohl als <strong>eigener Verantwortlicher</strong> als auch als{' '}
            <strong>Auftragsverarbeiter</strong> tätig. Diese beiden Rollen sind strikt zu
            unterscheiden:
          </p>

          <h3>2.1 Torqr als eigener Verantwortlicher</h3>
          <p>
            Bezogen auf personenbezogene Daten, die wir <strong>selbst</strong> und{' '}
            <strong>aus eigenem Antrieb</strong> verarbeiten — insbesondere:
          </p>
          <ul>
            <li>
              Daten der Heizungsbauer-Kunden (Account-Inhaber): Name, E-Mail, Firma, Telefon,
              Passwort-Hash, Rollenzuordnung
            </li>
            <li>
              Daten der Mitarbeiter eines Heizungsbauer-Kunden, soweit dieser sie selbst anlegt
            </li>
            <li>Daten von Beta-Liste- und Demo-Anfrage-Interessenten von der Marketing-Seite</li>
            <li>Server-Logfile-Daten und (nach Einwilligung) Analyse-Daten</li>
          </ul>
          <p>
            Für diese Daten ist Torqr Verantwortlicher; die vorliegende Datenschutzerklärung
            beschreibt deren Verarbeitung vollständig.
          </p>

          <h3>2.2 Torqr als Auftragsverarbeiter</h3>
          <p>
            Bezogen auf personenbezogene Daten der <strong>Endkunden</strong> (insbesondere
            Anlagenbetreiber), die ein Heizungsbauer-Kunde in die Plattform einpflegt — insbesondere:
          </p>
          <ul>
            <li>Namen, Anschriften, E-Mail-Adressen, Telefonnummern der Endkunden</li>
            <li>
              Daten der Heizungsanlagen (Standort, Hersteller, Modell, Installations- und
              Wartungshistorie)
            </li>
            <li>Foto-Dokumentation aus Wartungseinsätzen</li>
            <li>Cal.com-Buchungsdaten der Endkunden</li>
          </ul>
          <p>
            Hier ist <strong>der jeweilige Heizungsbauer-Kunde Verantwortlicher</strong> im Sinne der
            DSGVO. Torqr verarbeitet diese Daten ausschließlich auf dessen dokumentierte Weisung als
            Auftragsverarbeiter im Sinne des Art. 28 DSGVO. Die Einzelheiten dieser
            Auftragsverarbeitung regelt der Auftragsverarbeitungsvertrag (AVV), abrufbar unter{' '}
            <Link href="/avv">/avv</Link>.
          </p>
          <p>
            <strong>Hinweis für Endkunden:</strong> Sollten Sie als Endkunde eines Heizungsbauers
            Daten in Torqr finden oder eine Wartungs-Erinnerung von uns erhalten haben und
            Betroffenenrechte geltend machen wollen, richten Sie diese bitte primär an Ihren
            Heizungsbauer. Dieser ist Verantwortlicher für Ihre Daten; Torqr leitet eingehende
            Anfragen umgehend an ihn weiter.
          </p>

          <h2>3. Erhebung beim Besuch der Website</h2>
          <p>
            Beim Aufruf von torqr.de werden technisch notwendige Daten automatisch durch unseren
            Hosting-Anbieter Vercel erfasst und in Server-Logfiles verarbeitet. Im Einzelnen:
          </p>
          <ul>
            <li>IP-Adresse des anfragenden Endgeräts</li>
            <li>Datum und Uhrzeit des Zugriffs</li>
            <li>Aufgerufene URL und HTTP-Status</li>
            <li>User-Agent (Browser, Betriebssystem)</li>
            <li>Referrer-URL (sofern vom Browser übermittelt)</li>
          </ul>
          <p>
            <strong>Zweck:</strong> Bereitstellung der Website, Abwehr von Angriffen, Diagnose
            technischer Fehler.
          </p>
          <p>
            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse
            liegt in der sicheren und stabilen Bereitstellung des Dienstes. Eine Verknüpfung dieser
            Daten mit anderen Datenquellen findet nicht statt; eine Identifizierung einzelner Nutzer
            erfolgt nicht.
          </p>
          <p>
            <strong>Speicherdauer:</strong> 30 Tage, anschließend automatische Löschung. Bei
            konkretem Anlass (Angriff, Missbrauch) können einzelne Datensätze länger gespeichert
            werden, bis der Vorfall abschließend bearbeitet ist.
          </p>

          <h2>4. Kontaktaufnahme, Beta-Liste und Demo-Anfrage</h2>
          <p>
            Wenn Sie sich über das Beta-Liste- oder Demo-Anfrage-Formular auf torqr.de eintragen oder
            uns per E-Mail kontaktieren, verarbeiten wir die übermittelten Angaben — typischerweise
            E-Mail, Name, Firma, Telefon, gewünschter Demo-Termin und Nachrichtentext — zur
            Bearbeitung Ihrer Anfrage und zur Vorbereitung eines möglichen Vertragsverhältnisses.
          </p>
          <p>
            <strong>Rechtsgrundlagen:</strong> Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen)
            sowie ergänzend Art. 6 Abs. 1 lit. a DSGVO (Einwilligung), soweit Sie das Formular
            freiwillig ausfüllen.
          </p>
          <p>
            <strong>Speicherdauer:</strong> Bis zu 24 Monate nach Ihrem letzten Kontakt, sofern kein
            Vertragsverhältnis zustande kommt. Bei Vertragsschluss werden die Daten in das
            Kundenkonto überführt und nach den dort geltenden Regeln aufbewahrt. Sie können der
            weiteren Speicherung jederzeit widersprechen.
          </p>

          <h2>5. Nutzung der Plattform durch Heizungsbauer-Kunden</h2>
          <p>
            Wenn Sie sich als Heizungsbauer-Kunde bei Torqr registrieren, verarbeiten wir die für den
            Vertrag erforderlichen Daten:
          </p>
          <ul>
            <li>
              <strong>Account-Stammdaten</strong> (E-Mail, Name, Firma, Telefon, Passwort-Hash) zur
              Vertragserfüllung und Authentifizierung — Rechtsgrundlage Art. 6 Abs. 1 lit. b DSGVO.
              Aufbewahrung bis Account-Löschung; danach nach handels- und steuerrechtlichen Pflichten
              (i.d.R. 6 oder 10 Jahre).
            </li>
            <li>
              <strong>Mitarbeiter-Daten</strong> (vom Kunden angelegt) zur Bereitstellung der
              Mehrbenutzer-Funktionen — Rechtsgrundlage Art. 6 Abs. 1 lit. b DSGVO. Aufbewahrung bis
              Kunde löscht oder Account beendet.
            </li>
            <li>
              <strong>Endkunden- und Anlagendaten</strong> (vom Kunden eingepflegt) zum
              Wartungsmanagement im Auftrag — Rechtsgrundlage Art. 28 DSGVO (Auftragsverarbeitung —
              siehe Abschnitt 2.2). Aufbewahrung bis Kunde löscht oder Account beendet.
            </li>
            <li>
              <strong>Wartungs-Fotos</strong> zur Dokumentation des Heizungsbauer-Kunden — Art. 28
              DSGVO. Aufbewahrung bis Kunde löscht.
            </li>
            <li>
              <strong>E-Mail-Versand-Logs</strong> (Wartungserinnerungen, Bestätigungen) zum Nachweis
              des Versands und zur Fehlerdiagnose — Art. 6 Abs. 1 lit. f DSGVO und Art. 28 DSGVO.
              Aufbewahrung 12 Monate.
            </li>
          </ul>
          <p>
            Die Daten werden in einer in der Europäischen Union betriebenen Datenbank gespeichert
            (Supabase, Region eu-central-1, Frankfurt am Main).
          </p>

          <h2>6. Auftragsverarbeiter und Drittland-Übermittlung</h2>
          <p>
            Zur Erbringung des Dienstes setzen wir die folgenden externen Dienstleister als{' '}
            <strong>Auftragsverarbeiter</strong> im Sinne des Art. 28 DSGVO ein. Mit allen Anbietern
            bestehen Auftragsverarbeitungsverträge; bei US-Mutterhäusern stützen sich die
            Datenflüsse zusätzlich auf das <strong>EU-US Data Privacy Framework (DPF)</strong> als
            Angemessenheitsbeschluss (Durchführungsbeschluss (EU) 2023/1795 der Europäischen
            Kommission vom 10.07.2023) und auf die{' '}
            <strong>EU-Standardvertragsklauseln (SCC)</strong> als Fallback nach Art. 46 Abs. 2 lit.
            c DSGVO.
          </p>
          <ul>
            <li>
              <strong>Vercel Inc.</strong> (Hosting): US-Mutterhaus, Verarbeitung in EU-Region.
              Server-Logs, ausgelieferte Inhalte. AVV vorhanden. Drittland-Grundlage: DPF + SCC.
            </li>
            <li>
              <strong>Vercel Inc.</strong> (Vercel Analytics, optional nach Einwilligung): cookieless;
              anonyme Pageviews und Performance-Metriken. AVV identisch zum Hosting. DPF + SCC.
            </li>
            <li>
              <strong>PostHog Inc.</strong> (Product Analytics, optional nach Einwilligung):
              US-Mutterhaus, Server in EU (Frankfurt am Main). Anonyme Nutzungs- und
              Conversion-Events. AVV vorhanden. DPF + SCC.
            </li>
            <li>
              <strong>Supabase Inc.</strong> (Datenbank + Object Storage): US-Mutterhaus, Verarbeitung
              in eu-central-1 (Frankfurt am Main). Account-, Endkunden-, Anlagen- und Foto-Daten. AVV
              vorhanden. DPF + SCC.
            </li>
            <li>
              <strong>Resend, Inc.</strong> (transaktionaler E-Mail-Versand): US-Mutterhaus,
              EU-Versandregion. Empfänger-E-Mail, Betreff, Versand-Metadaten. AVV vorhanden. DPF +
              SCC.
            </li>
            <li>
              <strong>Upstash, Inc.</strong> (Redis-Rate-Limiting): EU-Region. IP-Adressen zur
              Begrenzung der Anfragen, nur kurzzeitig. AVV vorhanden. Drittland-Grundlage: SCC.
            </li>
            <li>
              <strong>Cal.com, Inc.</strong> (Buchungssystem für Wartungstermine): Verarbeitung in
              EU-Region. Endkunden-E-Mail, Termin, ggf. Anschrift. AVV vorhanden. DPF + SCC.
            </li>
          </ul>
          <p>
            Eine Übermittlung in unsichere Drittländer (ohne Angemessenheitsbeschluss und ohne
            geeignete Garantien nach Art. 46 DSGVO) findet nicht statt. Eine aktuelle Liste der
            Unterauftragsverarbeiter erhalten Sie auf Anfrage unter{' '}
            <a href="mailto:hello@torqr.de">hello@torqr.de</a> oder im AVV unter{' '}
            <Link href="/avv">/avv</Link>.
          </p>

          <h2>7. Cookies und Analyse-Tools (TDDDG § 25)</h2>
          <p>
            Wir speichern Informationen nur dann auf Ihrem Endgerät oder rufen solche ab, wenn dies
            entweder <strong>unbedingt erforderlich</strong> für die Bereitstellung der von Ihnen
            angeforderten Funktion ist (TDDDG § 25 Abs. 2 Nr. 2) oder Sie zuvor{' '}
            <strong>ausdrücklich eingewilligt</strong> haben (TDDDG § 25 Abs. 1, Art. 6 Abs. 1 lit. a
            DSGVO).
          </p>

          <h3>7.1 Unbedingt erforderliche Speicherung</h3>
          <ul>
            <li>Login-Session-Cookie nach erfolgreicher Anmeldung (nur im eingeloggten Bereich)</li>
            <li>Sicherheits-Cookies zur Abwehr von Cross-Site-Request-Forgery (CSRF)</li>
            <li>
              Speicherung Ihrer Cookie-Consent-Entscheidung im Browser-LocalStorage (Schlüssel{' '}
              <code>torqr-consent-v1</code>) — zwingend erforderlich, um Ihre Entscheidung
              respektieren zu können
            </li>
          </ul>
          <p>
            Diese Speicherung erfolgt ohne Einwilligung; Rechtsgrundlage ist Art. 6 Abs. 1 lit. f
            DSGVO i.V.m. § 25 Abs. 2 Nr. 2 TDDDG.
          </p>

          <h3>7.2 Einwilligungsbasierte Analyse-Tools</h3>
          <p>
            Beim ersten Besuch erscheint ein Cookie-Banner mit drei gleichgewichtigen Optionen
            (&quot;Alle akzeptieren&quot;, &quot;Nur essentielle&quot;, &quot;Einstellungen&quot;)
            sowie einer granularen Auswahlmöglichkeit für die jeweiligen Dienste.{' '}
            <strong>
              Vor Ihrer Einwilligung wird kein Analyse-Code geladen oder ausgeführt
            </strong>{' '}
            (die jeweilige JavaScript-Bibliothek wird erst dynamisch nachgeladen, nachdem Ihre
            Zustimmung vorliegt).
          </p>
          <p>
            Sie können Ihre Einwilligung jederzeit über den Link{' '}
            <strong>&quot;Cookie-Einstellungen&quot;</strong> im Footer dieser Seite ändern oder
            vollständig widerrufen. Bereits durchgeführte Verarbeitungen bleiben davon unberührt.
          </p>
          <ul>
            <li>
              <strong>Vercel Analytics</strong> (Vercel Inc.) — anonyme Performance- und
              Seitenaufruf-Statistik; keine Cookies, kein Fingerprinting, IP-Anonymisierung.
              Speicherdauer: 30 Tage (rollierend). Drittland: siehe Abschnitt 6. Rechtsgrundlage: Art.
              6 Abs. 1 lit. a DSGVO i.V.m. § 25 Abs. 1 TDDDG.
            </li>
            <li>
              <strong>PostHog</strong> (PostHog Inc., EU-Server in Frankfurt) — anonyme
              Produktnutzungsanalyse, Conversion-Tracking; Pageviews (history_change), definierte
              Conversion-Events (z.B. <code>beta_lead_submitted</code>); kein Autocapture, kein
              Session-Replay, identified-only-Modus (keine anonymen Profile). Speicherdauer: 12
              Monate. Drittland: siehe Abschnitt 6. Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO i.V.m.
              § 25 Abs. 1 TDDDG.
            </li>
          </ul>

          <h2>8. Rechte der betroffenen Person</h2>
          <p>Sie haben jederzeit das Recht,</p>
          <ul>
            <li>
              <strong>Auskunft</strong> über die zu Ihrer Person gespeicherten Daten zu verlangen
              (Art. 15 DSGVO),
            </li>
            <li>die <strong>Berichtigung</strong> unrichtiger Daten zu verlangen (Art. 16 DSGVO),</li>
            <li>
              die <strong>Löschung</strong> Ihrer Daten zu verlangen (Art. 17 DSGVO), soweit nicht
              gesetzliche Aufbewahrungspflichten entgegenstehen,
            </li>
            <li>
              die <strong>Einschränkung der Verarbeitung</strong> zu verlangen (Art. 18 DSGVO),
            </li>
            <li>
              <strong>Datenübertragbarkeit</strong> zu verlangen, d.h. die Bereitstellung Ihrer Daten
              in einem strukturierten, gängigen und maschinenlesbaren Format (Art. 20 DSGVO),
            </li>
            <li>
              der Verarbeitung aus Gründen Ihrer besonderen Situation oder zu Zwecken der
              Direktwerbung zu <strong>widersprechen</strong> (Art. 21 DSGVO),
            </li>
            <li>
              eine erteilte <strong>Einwilligung</strong> mit Wirkung für die Zukunft jederzeit zu{' '}
              <strong>widerrufen</strong> (Art. 7 Abs. 3 DSGVO).
            </li>
          </ul>
          <p>
            Wir bearbeiten Ihre Anfrage in der Regel innerhalb von 30 Tagen, in komplexen Fällen
            spätestens nach drei Monaten.
          </p>

          <h3>Beschwerderecht</h3>
          <p>
            Sie haben ferner das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
            Für Torqr ist zuständig:
          </p>
          <p>
            <strong>Der Hessische Beauftragte für Datenschutz und Informationsfreiheit (HBDI)</strong>
            <br />
            Postfach 31 63
            <br />
            65021 Wiesbaden
            <br />
            Tel.: +49 611 1408-0
            <br />
            <a href="https://datenschutz.hessen.de" rel="noopener noreferrer">
              datenschutz.hessen.de
            </a>
          </p>

          <h2>9. Kontakt und Aktualisierung</h2>
          <p>
            Datenschutzanfragen, Auskunfts- und Löschersuchen sowie sonstige Fragen richten Sie bitte
            an <a href="mailto:hello@torqr.de">hello@torqr.de</a>.
          </p>
          <p>
            Wir behalten uns vor, diese Datenschutzerklärung zu aktualisieren, wenn sich die
            zugrunde liegende Verarbeitung oder die Rechtslage ändert. Maßgeblich ist die jeweils auf
            dieser Seite veröffentlichte Fassung. Das aktuelle Stand-Datum wird oben angezeigt.
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
