import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export const metadata: Metadata = {
  title: 'Auftragsverarbeitungsvertrag (AVV)',
  description:
    'Mustervertrag zur Auftragsverarbeitung nach Art. 28 DSGVO zwischen Heizungsbauer-Kunden und Torqr. Druckfertige Version.',
  robots: { index: true, follow: true },
};

export default function AvvPage() {
  return (
    <>
      {/* Print-CSS: blendet Marketing-Chrome (Header, Footer, Back-Link) sowie das globale Cookie-Banner-Overlay
          beim Drucken bzw. PDF-Export aus. Greift sowohl Tailwind-`print:hidden`-Klassen als auch potentiell
          global gerenderte Cookie-Banner-Container ab. */}
      <style>{`
        @media print {
          [data-cookie-banner],
          [data-consent-banner] {
            display: none !important;
          }
          body {
            background: white !important;
          }
          a {
            color: inherit !important;
            text-decoration: none !important;
          }
          .avv-printable {
            padding-top: 0 !important;
          }
          .avv-printable article {
            max-width: 100% !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div className="print:hidden">
        <MarketingHeader />
      </div>

      <main className="avv-printable min-h-screen bg-background pt-24 print:pt-0">
        <article className="mx-auto max-w-3xl px-6 py-16 prose prose-sm sm:prose-base print:max-w-none print:px-0 print:py-0">
          <h1>Auftragsverarbeitungs­vertrag (AVV) nach Art. 28 DSGVO</h1>
          <p className="text-muted-foreground">
            Stand: <time>{new Date().toLocaleDateString('de-DE')}</time>
          </p>

          <p>
            Dieser Auftragsverarbeitungs­vertrag (im Folgenden &quot;AVV&quot; oder
            &quot;Vertrag&quot;) ergänzt den zwischen den Parteien geschlossenen Hauptvertrag über die
            Nutzung der Software-as-a-Service-Lösung <strong>Torqr</strong> (im Folgenden
            &quot;Hauptvertrag&quot;) und regelt die Verarbeitung personenbezogener Daten gemäß
            Art. 28 DSGVO.
          </p>

          <p className="rounded border border-muted-foreground/30 bg-muted/30 p-4 text-sm print:hidden">
            <strong>Hinweis:</strong> Diese Seite ist druckfertig. Über die Druckfunktion Ihres
            Browsers (Strg + P / Cmd + P) können Sie ein PDF speichern. Vor dem Druck bestätigen Sie
            bitte ggf. den Cookie-Banner. Eine unterschriebene Fassung erhalten Sie auf Anfrage unter{' '}
            <a href="mailto:hello@torqr.de">hello@torqr.de</a>.
          </p>

          <h2>§ 1 Vertragsparteien</h2>
          <p>
            <strong>Verantwortlicher</strong> (im Folgenden &quot;Auftraggeber&quot;) — vom
            Auftraggeber auszufüllen:
          </p>
          <p>
            Firma: [FIRMA]
            <br />
            Anschrift: [STRASSE, PLZ, ORT]
            <br />
            Vertretungsberechtigt: [NAME]
            <br />
            E-Mail: [KONTAKT-EMAIL]
          </p>
          <p>
            <strong>Auftragsverarbeiter</strong> (im Folgenden &quot;Auftragnehmer&quot;):
          </p>
          <p>
            Yannik Dorth (Einzelunternehmer)
            <br />
            Puller Weg 2<br />
            35794 Mengerskirchen
            <br />
            Deutschland
            <br />
            E-Mail: <a href="mailto:hello@torqr.de">hello@torqr.de</a>
          </p>

          <h2>§ 2 Gegenstand und Dauer der Verarbeitung</h2>
          <p>
            (1) <strong>Gegenstand</strong> der Verarbeitung ist die Bereitstellung und der Betrieb
            der Plattform Torqr zur Unterstützung des Auftraggebers bei der Verwaltung von
            Endkunden, Heizungsanlagen, Wartungsterminen und der zugehörigen Dokumentation und
            Kommunikation.
          </p>
          <p>
            (2) Die <strong>Dauer</strong> der Auftragsverarbeitung entspricht der Laufzeit des
            Hauptvertrags. Nach Beendigung des Hauptvertrags gilt § 12 dieses Vertrags.
          </p>

          <h2>§ 3 Art und Zweck der Verarbeitung</h2>
          <p>
            (1) <strong>Art der Verarbeitung:</strong> Erhebung, Erfassung, Organisation, Ordnen,
            Speichern, Anpassen, Abfragen, Verwendung, Übermittlung, Verbreitung, Abgleich,
            Verknüpfung, Einschränkung, Löschung und Vernichtung personenbezogener Daten im Rahmen
            des Hauptvertrags, einschließlich des automatisierten Versands von Wartungs-Erinnerungen
            per E-Mail an Endkunden des Auftraggebers.
          </p>
          <p>
            (2) <strong>Zweck</strong> der Verarbeitung ist die Erbringung der vereinbarten
            SaaS-Leistungen für den Auftraggeber gemäß Hauptvertrag.
          </p>
          <p>
            (3) Eine weitergehende Verarbeitung der Daten für eigene Zwecke des Auftragnehmers findet{' '}
            <strong>nicht</strong> statt.
          </p>

          <h2>§ 4 Art der personenbezogenen Daten</h2>
          <p>Gegenstand der Verarbeitung sind die folgenden Datenarten:</p>
          <ul>
            <li>
              <strong>Stammdaten:</strong> Vorname, Nachname, Anrede, Anschrift, ggf.
              Firmenbezeichnung
            </li>
            <li>
              <strong>Kontaktdaten:</strong> E-Mail-Adresse, Telefonnummer
            </li>
            <li>
              <strong>Anlagendaten:</strong> Hersteller, Modell, Baujahr, Standort, Installations- und
              Wartungshistorie
            </li>
            <li>
              <strong>Auftragsdaten:</strong> Wartungstermine, Wartungsumfang, eingesetzte
              Ersatzteile, Notizen des Technikers
            </li>
            <li>
              <strong>Dokumentations-Inhalte:</strong> Fotos und Notizen zu Wartungseinsätzen, soweit
              vom Auftraggeber hochgeladen
            </li>
            <li>
              <strong>Kommunikations-Metadaten:</strong> Versand- und Lese-Status der vom System
              versendeten E-Mails
            </li>
          </ul>

          <h2>§ 5 Kategorien betroffener Personen</h2>
          <p>Von der Verarbeitung sind die folgenden Personenkreise betroffen:</p>
          <ul>
            <li>
              <strong>Endkunden</strong> des Auftraggebers (Anlagenbetreiber, Hauseigentümer, Mieter)
            </li>
            <li>
              <strong>Ansprechpartner</strong> bei Endkunden, soweit vom Auftraggeber eingepflegt
            </li>
            <li>
              <strong>Mitarbeiter</strong> des Auftraggebers, die Zugriff auf die Plattform haben
              (deren Daten werden vom Auftraggeber selbst angelegt)
            </li>
          </ul>

          <h2>§ 6 Pflichten des Auftragnehmers</h2>
          <p>
            (1) Der Auftragnehmer verarbeitet personenbezogene Daten ausschließlich im Rahmen der
            Vereinbarungen und nach <strong>dokumentierten Weisungen</strong> des Auftraggebers
            (§ 11). Die im Hauptvertrag, in dieser Vereinbarung und in der Standard-Konfiguration der
            Plattform enthaltenen Festlegungen gelten als anfänglich dokumentierte Weisungen.
          </p>
          <p>
            (2) Der Auftragnehmer informiert den Auftraggeber unverzüglich, wenn er der Auffassung
            ist, dass eine Weisung gegen datenschutzrechtliche Vorschriften verstößt. Der
            Auftragnehmer ist berechtigt, die Durchführung der entsprechenden Weisung bis zu einer
            Bestätigung oder Änderung durch den Auftraggeber auszusetzen.
          </p>
          <p>
            (3) Der Auftragnehmer <strong>verpflichtet</strong> alle mit der Verarbeitung befassten
            Personen schriftlich zur Vertraulichkeit oder sichert ab, dass sie einer angemessenen
            gesetzlichen Verschwiegenheitspflicht unterliegen. Die Verpflichtung wirkt auch nach
            Beendigung des Auftrags fort.
          </p>
          <p>
            (4) Der Auftragnehmer trifft die nach Art. 32 DSGVO erforderlichen{' '}
            <strong>technischen und organisatorischen Maßnahmen</strong> zur Sicherheit der
            Verarbeitung; diese ergeben sich aus § 7 sowie der Anlage &quot;TOM&quot; zu diesem
            Vertrag.
          </p>
          <p>
            (5) Der Auftragnehmer <strong>unterstützt</strong> den Auftraggeber im Rahmen seiner
            Möglichkeiten
          </p>
          <p>
            a) bei der Beantwortung von Anträgen betroffener Personen auf Wahrnehmung der Rechte aus
            Art. 15 bis 22 DSGVO,
          </p>
          <p>b) bei der Einhaltung der in Art. 32 bis 36 DSGVO genannten Pflichten,</p>
          <p>
            c) bei der Durchführung einer ggf. erforderlichen Datenschutz-Folgenabschätzung nach
            Art. 35 DSGVO.
          </p>
          <p>
            (6) Der Auftragnehmer <strong>meldet</strong> dem Auftraggeber Verletzungen des Schutzes
            personenbezogener Daten i.S.d. Art. 33 DSGVO unverzüglich, spätestens jedoch innerhalb
            von <strong>72 Stunden</strong> nach Kenntnis. Die Meldung enthält die in Art. 33 Abs. 3
            DSGVO genannten Angaben, soweit dem Auftragnehmer bekannt.
          </p>
          <p>
            (7) Der Auftragnehmer benennt eine <strong>Kontaktstelle</strong> für Datenschutzfragen:{' '}
            <a href="mailto:hello@torqr.de">hello@torqr.de</a>.
          </p>
          <p>
            (8) Der Auftragnehmer führt ein <strong>Verzeichnis</strong> aller Kategorien von im
            Auftrag eines Verantwortlichen durchgeführten Tätigkeiten der Verarbeitung gemäß Art. 30
            Abs. 2 DSGVO.
          </p>

          <h2>§ 7 Technische und organisatorische Maßnahmen (Art. 32 DSGVO)</h2>
          <p>
            Die zum Zeitpunkt des Vertragsschlusses bestehenden technischen und organisatorischen
            Maßnahmen ergeben sich aus der nachstehenden Übersicht. Der Auftragnehmer ist berechtigt,
            diese Maßnahmen weiterzuentwickeln, solange das vereinbarte Schutzniveau nicht
            unterschritten wird.
          </p>

          <h3>7.1 Vertraulichkeit (Art. 32 Abs. 1 lit. b DSGVO)</h3>
          <ul>
            <li>
              <strong>Zutrittskontrolle:</strong> Verarbeitung ausschließlich in
              Cloud-Rechenzentren der eingesetzten Auftragsverarbeiter (Vercel, Supabase, Upstash,
              Cal.com, PostHog, Resend), für die zertifizierte Zutrittskontrollkonzepte (ISO 27001
              oder vergleichbar) vorliegen.
            </li>
            <li>
              <strong>Zugangskontrolle:</strong> Authentifizierung der Plattformnutzer per
              E-Mail/Passwort mit bcrypt-Hashing (Cost-Faktor ≥ 12). Optionale
              Mehr-Faktor-Authentifizierung. Verwaltungszugänge des Auftragnehmers ausschließlich
              über persönliche Konten mit Mehr-Faktor-Authentifizierung. Keine geteilten
              Administrator-Accounts.
            </li>
            <li>
              <strong>Zugriffskontrolle:</strong> Tenant-Isolation auf Applikations­ebene durch
              zwingendes Scoping aller Datenzugriffe auf eine companyId. Endkundendaten eines
              Auftraggebers sind für andere Auftraggeber technisch nicht erreichbar.
            </li>
            <li>
              <strong>Trennungskontrolle:</strong> Logische Trennung der Daten unterschiedlicher
              Auftraggeber innerhalb einer gemeinsamen Datenbank durch tenant-gebundene
              Identifikatoren; getrennte Datenbank-Schemata für Produktiv-, Test- und
              Entwicklungsumgebungen.
            </li>
            <li>
              <strong>Pseudonymisierung:</strong> Wo technisch möglich (z.B. Analyse-Tooling) werden
              Daten pseudonymisiert verarbeitet. Endkundendaten werden zur Erfüllung des
              Hauptvertragszwecks im Klartext verarbeitet, was eine Pseudonymisierung in der
              Hauptverarbeitung ausschließt.
            </li>
          </ul>

          <h3>7.2 Integrität (Art. 32 Abs. 1 lit. b DSGVO)</h3>
          <ul>
            <li>
              <strong>Weitergabekontrolle / Transportverschlüsselung:</strong> Sämtliche
              Datenübertragungen zwischen Browser/Mobilgerät und Plattform sowie zwischen Plattform
              und Subunternehmern erfolgen verschlüsselt (TLS 1.3 wo verfügbar, mindestens TLS 1.2).
              HTTP wird auf HTTPS umgeleitet (HSTS).
            </li>
            <li>
              <strong>Eingabekontrolle:</strong> Protokollierung von Anmelde-, Lösch- und
              Veränderungsereignissen auf Account-Ebene. Audit-Logs werden mindestens 30 Tage
              aufbewahrt.
            </li>
            <li>
              <strong>Verschlüsselung at-rest:</strong> Datenbank und Object Storage werden mit
              AES-256 verschlüsselt auf Speichermedien abgelegt.
            </li>
          </ul>

          <h3>7.3 Verfügbarkeit und Belastbarkeit (Art. 32 Abs. 1 lit. b DSGVO)</h3>
          <ul>
            <li>
              <strong>Backups:</strong> Tägliche, automatische Datenbank-Backups, mindestens 7 Tage
              rollierend aufbewahrt; Object-Storage-Versionierung für Foto-Uploads.
            </li>
            <li>
              <strong>Redundanz:</strong> Hosting in einer EU-Region mit
              Multi-AZ-Datenbankreplikation durch den Datenbankanbieter (Supabase) und automatischer
              Wiederherstellung im Fehlerfall.
            </li>
            <li>
              <strong>Notfallplan:</strong> Dokumentierte Wiederanlauf­prozedur für
              Account-Recovery und Datenbank-Restore; jährlicher Test-Restore.
            </li>
          </ul>

          <h3>7.4 Verfahren zur regelmäßigen Überprüfung (Art. 32 Abs. 1 lit. d DSGVO)</h3>
          <ul>
            <li>
              <strong>Datenschutz-Management:</strong> Jährliche Überprüfung dieser Vereinbarung,
              der eingesetzten Subunternehmer und der getroffenen TOMs auf Aktualität.
            </li>
            <li>
              <strong>Incident-Response-Prozess:</strong> Dokumentierter Prozess für die Behandlung
              von Datenpannen mit den 72-Stunden-Meldepflichten nach Art. 33 DSGVO.
            </li>
            <li>
              <strong>Schwachstellen-Management:</strong> Abonnement der Sicherheitshinweise der
              eingesetzten Bibliotheken und Cloud-Anbieter; zeitnahe Einspielung
              sicherheitsrelevanter Updates.
            </li>
          </ul>

          <h2>§ 8 Subunternehmer (weitere Auftragsverarbeiter)</h2>
          <p>
            (1) Der Auftraggeber stimmt der Einschaltung der nachstehend genannten Subunternehmer
            (Unterauftragsverarbeiter) als allgemeine schriftliche Genehmigung im Sinne des Art. 28
            Abs. 2 DSGVO zu:
          </p>
          <ul>
            <li>
              <strong>Vercel Inc.</strong> — US-Mutterhaus, Verarbeitung in EU-Region. Hosting,
              optional Vercel Analytics. Drittlandbezug: DPF + SCC.
            </li>
            <li>
              <strong>PostHog Inc.</strong> — US-Mutterhaus, EU-Server (Frankfurt am Main).
              Optionales Product Analytics. Drittlandbezug: DPF + SCC.
            </li>
            <li>
              <strong>Supabase Inc.</strong> — US-Mutterhaus, eu-central-1 (Frankfurt am Main).
              Datenbank + Object Storage. Drittlandbezug: DPF + SCC.
            </li>
            <li>
              <strong>Resend, Inc.</strong> — US-Mutterhaus, EU-Versandregion. Transaktionaler
              E-Mail-Versand. Drittlandbezug: DPF + SCC.
            </li>
            <li>
              <strong>Upstash, Inc.</strong> — EU-Region. Rate-Limiting / Caching. Drittlandbezug:
              SCC.
            </li>
            <li>
              <strong>Cal.com, Inc.</strong> — Verarbeitung in EU-Region. Buchungssystem für
              Wartungstermine. Drittlandbezug: DPF + SCC.
            </li>
          </ul>
          <p>
            (2) Mit allen Subunternehmern bestehen Auftragsverarbeitungs­verträge auf einem dem
            vorliegenden Vertrag entsprechenden Schutzniveau.
          </p>
          <p>
            (3) Der Auftragnehmer wird beabsichtigte Änderungen in Bezug auf die Hinzuziehung oder
            Ersetzung weiterer Auftragsverarbeiter <strong>vorab</strong> in Textform anzeigen. Der
            Auftraggeber kann der Änderung aus wichtigem Grund — insbesondere wenn das Schutzniveau
            gefährdet ist — innerhalb von <strong>vier Wochen</strong> widersprechen. Im Fall eines
            berechtigten Widerspruchs steht beiden Parteien ein außerordentliches Kündigungsrecht
            des Hauptvertrags zu.
          </p>
          <p>
            (4) Eine aktuelle Subunternehmer-Liste kann jederzeit unter{' '}
            <a href="mailto:hello@torqr.de">hello@torqr.de</a> angefordert werden.
          </p>

          <h2>§ 9 Rechte und Pflichten des Auftraggebers</h2>
          <p>
            (1) Der Auftraggeber ist <strong>Verantwortlicher</strong> im Sinne von Art. 4 Nr. 7
            DSGVO für die Rechtmäßigkeit der Verarbeitung der von ihm in die Plattform eingepflegten
            personenbezogenen Daten.
          </p>
          <p>
            (2) Der Auftraggeber bleibt für die <strong>Information der betroffenen Personen</strong>{' '}
            und die Wahrung ihrer Rechte nach Art. 13 bis 22 DSGVO verantwortlich.
          </p>
          <p>
            (3) Der Auftraggeber hat das Recht, sich von der Einhaltung der vereinbarten technischen
            und organisatorischen Maßnahmen durch den Auftragnehmer im Rahmen einer{' '}
            <strong>Kontrolle</strong> zu überzeugen. Die Kontrolle wird mit angemessener
            Vorankündigung (mindestens 30 Tage), während der üblichen Geschäftszeiten, ohne Störung
            des Betriebsablaufs und höchstens einmal pro Jahr durchgeführt. Auf Wunsch des
            Auftragnehmers ist die Kontrolle durch einen zur Verschwiegenheit verpflichteten
            Sachverständigen durchzuführen.
          </p>
          <p>
            (4) Der Auftragnehmer kann seinen Nachweispflichten in zumutbarem Umfang durch die
            Vorlage von Zertifikaten, Selbstauskunfts­berichten oder Auditberichten der eingesetzten
            Cloud-Anbieter genügen.
          </p>

          <h2>§ 10 Mitteilungspflichten</h2>
          <p>(1) Der Auftragnehmer informiert den Auftraggeber unverzüglich, sobald ihm</p>
          <p>
            a) Anfragen oder Maßnahmen einer Aufsichtsbehörde gegenüber dem Auftragnehmer im
            Zusammenhang mit den im Auftrag verarbeiteten Daten bekannt werden,
          </p>
          <p>
            b) Beschlagnahmungs- oder Sicherstellungsmaßnahmen, Insolvenzverfahren oder
            Vergleichsverfahren, die diesen Vertrag betreffen, drohen oder ergehen.
          </p>
          <p>
            (2) Der Auftragnehmer informiert den Auftraggeber zudem unverzüglich über Anfragen von{' '}
            <strong>betroffenen Personen</strong>, die sich direkt an den Auftragnehmer wenden, und
            leitet diese Anfragen, soweit der Bezug zum Auftraggeber zweifelsfrei zugeordnet werden
            kann, an diesen weiter.
          </p>
          <p>
            (3) Mitteilungen erfolgen über die im Account hinterlegte Datenschutz-Kontakt-E-Mail-Adresse
            des Auftraggebers; alternativ über jede dem Auftragnehmer bekannte Kontaktadresse.
          </p>

          <h2>§ 11 Weisungsrecht des Auftraggebers</h2>
          <p>
            (1) Die Verarbeitung erfolgt ausschließlich auf{' '}
            <strong>dokumentierte Weisungen</strong> des Auftraggebers. Als Standard-Weisung gelten
            die im Hauptvertrag und in diesem Vertrag festgelegten Verarbeitungen.
          </p>
          <p>
            (2) Einzelweisungen, die vom Standard abweichen, bedürfen der Textform (z.B. E-Mail an{' '}
            <a href="mailto:hello@torqr.de">hello@torqr.de</a>). Mündliche Weisungen sind unverzüglich
            in Textform zu bestätigen.
          </p>
          <p>
            (3) Der Auftragnehmer dokumentiert Weisungen und deren Umsetzung; die Dokumentation wird
            mindestens für die Dauer des Vertrags und drei Jahre darüber hinaus aufbewahrt.
          </p>
          <p>
            (4) Weisungen, die über das vertraglich vereinbarte Leistungs­spektrum hinausgehen,
            werden als <strong>Auftragserweiterung</strong> behandelt. Der Auftragnehmer kann die
            Umsetzung von einem zusätzlichen Vergütungs­ansatz abhängig machen.
          </p>

          <h2>§ 12 Beendigung — Rückgabe und Löschung</h2>
          <p>
            (1) Nach Beendigung des Hauptvertrags hat der Auftraggeber <strong>30 Tage</strong> lang
            Gelegenheit, seine Daten in einem strukturierten, gängigen Format aus der Plattform zu
            exportieren.
          </p>
          <p>
            (2) Spätestens <strong>90 Tage</strong> nach Beendigung des Hauptvertrags löscht der
            Auftragnehmer alle dem Auftraggeber zuzuordnenden Daten vollständig — einschließlich der
            bei Subunternehmern gespeicherten Daten —, soweit nicht eine gesetzliche
            Aufbewahrungspflicht entgegensteht.
          </p>
          <p>
            (3) Backups werden gemäß ihrer rollierenden Aufbewahrungs­zyklen automatisch
            überschrieben. Eine darüber hinausgehende vorzeitige Löschung von Backups schuldet der
            Auftragnehmer nicht.
          </p>
          <p>
            (4) Auf Verlangen des Auftraggebers stellt der Auftragnehmer eine schriftliche
            Löschbestätigung in Textform aus.
          </p>

          <h2>§ 13 Haftung</h2>
          <p>
            (1) Die Haftung der Parteien gegenüber betroffenen Personen richtet sich nach{' '}
            <strong>Art. 82 DSGVO</strong>.
          </p>
          <p>
            (2) Im Innenverhältnis zwischen Auftraggeber und Auftragnehmer richtet sich die Haftung
            nach den Bestimmungen des Hauptvertrags. Die dortigen Haftungs­regelungen gelten
            entsprechend, soweit dieser Vertrag keine Sonderregelung enthält.
          </p>
          <p>
            (3) Bei Forderungen Dritter aufgrund von Pflichtverletzungen einer Partei stellt diese
            die jeweils andere Partei in dem ihr zurechenbaren Umfang von Ansprüchen frei.
          </p>

          <h2>§ 14 Schlussbestimmungen</h2>
          <p>
            (1) Sollten die Daten des Auftraggebers beim Auftragnehmer durch Pfändung oder
            Beschlagnahme, durch ein Insolvenz- oder Vergleichsverfahren oder durch sonstige
            Ereignisse oder Maßnahmen Dritter gefährdet werden, so hat der Auftragnehmer den
            Auftraggeber unverzüglich darüber zu informieren. Der Auftragnehmer wird alle in diesem
            Zusammenhang Verantwortlichen unverzüglich darüber informieren, dass die Hoheit und das
            Eigentum an den Daten ausschließlich beim Auftraggeber als Verantwortlichem im Sinne der
            DSGVO liegen.
          </p>
          <p>
            (2) <strong>Änderungen und Ergänzungen</strong> dieses Vertrags bedürfen der Textform.
            Dies gilt auch für die Aufhebung dieses Schriftform­erfordernisses.
          </p>
          <p>
            (3) Sollten einzelne Bestimmungen dieses Vertrags ganz oder teilweise unwirksam sein
            oder werden, so bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. Die Parteien
            werden die unwirksame Bestimmung durch eine wirksame ersetzen, die ihrem
            wirtschaftlichen Zweck am nächsten kommt.
          </p>
          <p>
            (4) Es gilt das <strong>Recht der Bundesrepublik Deutschland</strong> unter Ausschluss
            des UN-Kaufrechts.
          </p>
          <p>
            (5) <strong>Ausschließlicher Gerichtsstand</strong> für alle Streitigkeiten aus oder im
            Zusammenhang mit diesem Vertrag ist — soweit der Auftraggeber Kaufmann, juristische
            Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen ist — der Sitz
            des Auftragnehmers (Mengerskirchen). Der Auftragnehmer ist jedoch berechtigt, den
            Auftraggeber auch an dessen allgemeinem Gerichtsstand zu verklagen.
          </p>
          <p>
            (6) Bei Widersprüchen zwischen dem Hauptvertrag und diesem AVV gehen die Regelungen
            dieses AVV in Bezug auf die Auftragsverarbeitung <strong>vor</strong>.
          </p>

          <h2>Unterschriften</h2>
          <p>
            <strong>Auftraggeber</strong>
            <br />
            Ort, Datum: [ORT], [DATUM]
          </p>
          <p>
            ___________________________________
            <br />
            Name: [NAME]
            <br />
            Funktion: [FUNKTION]
          </p>

          <p className="mt-12">
            <strong>Auftragnehmer</strong>
            <br />
            Ort, Datum: Mengerskirchen, [DATUM]
          </p>
          <p>
            ___________________________________
            <br />
            Yannik Dorth
          </p>

          <p className="mt-8 print:hidden">
            <Link href="/">← Zurück zur Startseite</Link>
          </p>
        </article>
      </main>

      <div className="print:hidden">
        <MarketingFooter />
      </div>
    </>
  );
}
