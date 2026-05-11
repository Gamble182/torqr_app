import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export const metadata: Metadata = {
  title: 'Allgemeine Geschäftsbedingungen',
  description:
    'Allgemeine Geschäftsbedingungen (AGB) von Torqr für Unternehmer i.S.v. § 14 BGB. B2B-only, Beta-Phase, Laufzeit, Haftung, Gerichtsstand.',
  robots: { index: true, follow: true },
};

export default function AgbPage() {
  return (
    <>
      <MarketingHeader />
      <main className="min-h-screen bg-background pt-24">
        <article className="mx-auto max-w-3xl px-6 py-16 prose prose-sm sm:prose-base">
          <h1>Allgemeine Geschäftsbedingungen (AGB)</h1>
          <p className="text-muted-foreground">
            Stand: <time>{new Date().toLocaleDateString('de-DE')}</time>
          </p>

          <p>
            Diese Allgemeinen Geschäftsbedingungen regeln das Vertragsverhältnis zwischen
          </p>
          <p>
            <strong>Yannik Dorth, Puller Weg 2, 35794 Mengerskirchen, Deutschland</strong> (im
            Folgenden &quot;Anbieter&quot;)
          </p>
          <p>
            und dem Vertragspartner (im Folgenden &quot;Kunde&quot;) über die Nutzung der
            Software-as-a-Service-Lösung <strong>Torqr</strong> (im Folgenden &quot;Plattform&quot;).
          </p>

          <h2>§ 1 Geltungsbereich und Vertragspartner</h2>
          <p>
            (1) Die vorliegenden Allgemeinen Geschäftsbedingungen gelten ausschließlich gegenüber{' '}
            <strong>Unternehmern</strong> im Sinne des § 14 BGB, juristischen Personen des
            öffentlichen Rechts und öffentlich-rechtlichen Sondervermögen. Sie gelten nicht gegenüber
            Verbrauchern im Sinne des § 13 BGB.
          </p>
          <p>
            (2) Mit Abschluss des Vertrags bestätigt der Kunde, dass er den Vertrag in Ausübung
            seiner gewerblichen oder selbständigen beruflichen Tätigkeit schließt. Der Anbieter ist
            berechtigt, einen entsprechenden Nachweis zu verlangen und die Plattform für Verbraucher
            nicht freizuschalten.
          </p>
          <p>
            (3) Diese AGB gelten ausschließlich. Entgegenstehende oder von diesen AGB abweichende
            Bedingungen des Kunden werden nicht Vertragsbestandteil, es sei denn, der Anbieter hätte
            ihrer Geltung ausdrücklich schriftlich zugestimmt.
          </p>
          <p>
            (4) Es gilt die zum Zeitpunkt des Vertragsschlusses jeweils aktuelle Fassung dieser AGB.
            Änderungen werden dem Kunden in Textform mit angemessener Frist angekündigt; sie gelten
            als genehmigt, wenn der Kunde nicht innerhalb von sechs Wochen ab Zugang widerspricht.
            Der Anbieter wird in der Änderungsmitteilung gesondert auf die Folgen des Schweigens
            hinweisen.
          </p>

          <h2>§ 2 Vertragsgegenstand und Leistungsumfang</h2>
          <p>
            (1) Gegenstand des Vertrags ist die Bereitstellung der Plattform Torqr als
            Software-as-a-Service. Torqr unterstützt Heizungsbauer-Fachbetriebe (SHK-Fachbetriebe)
            bei der Verwaltung von Endkunden, Heizungsanlagen, Wartungsterminen und der dazugehörigen
            Dokumentation und Kommunikation.
          </p>
          <p>
            (2) Der konkrete Funktionsumfang der jeweiligen Tarife sowie die zugehörigen Preise
            ergeben sich aus der <strong>Leistungsbeschreibung auf der Preisseite</strong> des
            Anbieters unter <Link href="/preise">/preise</Link> (im Folgenden &quot;Preisseite&quot;)
            in der bei Vertragsschluss geltenden Fassung. Die Leistungsbeschreibung wird
            Vertragsbestandteil.
          </p>
          <p>
            (3) Der Anbieter ist berechtigt, den Funktionsumfang weiterzuentwickeln, anzupassen oder
            einzelne Funktionen durch gleichwertige Funktionen zu ersetzen, soweit dies dem Kunden
            zumutbar ist. Eine wesentliche Verschlechterung des Funktionsumfangs außerhalb der
            Beta-Phase (§ 4) ist nur mit Zustimmung des Kunden oder gegen ein außerordentliches
            Kündigungsrecht zulässig.
          </p>
          <p>
            (4) Der Anbieter erbringt keine Erfolgsleistung. Insbesondere wird keine bestimmte
            Wirtschaftlichkeit oder Effizienz beim Kunden geschuldet.
          </p>

          <h2>§ 3 Vertragsschluss</h2>
          <p>(1) Die Darstellung der Plattform auf torqr.de stellt kein bindendes Angebot dar.</p>
          <p>
            (2) Der Kunde gibt durch Absenden des Registrierungs- oder Bestellformulars ein
            verbindliches Angebot auf Vertragsschluss ab. Der Vertrag kommt erst mit ausdrücklicher
            Annahme durch den Anbieter — typischerweise per Bestätigungs-E-Mail an die vom Kunden
            hinterlegte Adresse und Freischaltung des Zugangs — zustande.
          </p>
          <p>
            (3) Der Anbieter ist berechtigt, die Annahme ohne Angabe von Gründen abzulehnen,
            insbesondere bei berechtigten Zweifeln an der Unternehmer-Eigenschaft, an der Bonität
            oder bei begründetem Missbrauchsverdacht.
          </p>
          <p>
            (4) Der Vertragstext wird vom Anbieter im Kundenkonto gespeichert. Der Kunde kann diese
            AGB jederzeit unter <Link href="/agb">/agb</Link> abrufen und herunterladen.
          </p>

          <h2>§ 4 Beta-Phase</h2>
          <p>
            (1) Die Plattform befindet sich derzeit in einer <strong>Beta-Phase</strong>. In dieser
            Phase wird die Plattform ausgewählten Pilotkunden zur Verfügung gestellt, um Funktionen
            unter realen Bedingungen zu erproben und Feedback einzuholen.
          </p>
          <p>(2) Während der Beta-Phase gilt abweichend von den nachfolgenden Bestimmungen:</p>
          <p>
            a) Die Nutzung der Plattform ist <strong>kostenfrei</strong>, soweit nicht im Einzelfall
            etwas anderes vereinbart ist;
          </p>
          <p>
            b) Der Kunde erklärt sich bereit, <strong>Rückmeldung</strong> zu Funktion, Stabilität und
            Bedienbarkeit zu geben, soweit dies mit zumutbarem Aufwand möglich ist;
          </p>
          <p>
            c) Der Anbieter erbringt <strong>keine vereinbarte Verfügbarkeit</strong> und gewährt
            keinen Service-Level. Wartungsfenster und ungeplante Ausfälle sind ohne Vorankündigung
            zulässig;
          </p>
          <p>
            d) Funktionen können ohne Vorankündigung verändert, deaktiviert oder hinzugefügt werden;
          </p>
          <p>
            e) Der Vertrag ist beiderseitig{' '}
            <strong>jederzeit ohne Frist und ohne Angabe von Gründen</strong> in Textform kündbar.
          </p>
          <p>
            (3) Der Anbieter wird das Ende der Beta-Phase mit einer Frist von mindestens{' '}
            <strong>30 Tagen</strong> in Textform ankündigen. Der Kunde erhält zu diesem Zeitpunkt
            das Angebot, in einen Production-Tarif zu wechseln; geschieht dies nicht, endet der
            Vertrag automatisch mit Ablauf der Ankündigungsfrist.
          </p>
          <p>
            (4) Die Regelungen zur Datensicherheit (§ 8), zur Vertraulichkeit (§ 10), zum Datenschutz
            (§ 8) und zur Haftung (§ 9) gelten auch während der Beta-Phase.
          </p>

          <h2>§ 5 Preise und Zahlungsbedingungen</h2>
          <p>
            (1) Außerhalb der Beta-Phase (§ 4) richten sich die geschuldeten Entgelte nach der zum
            Zeitpunkt des Vertragsschlusses geltenden Preisseite. Preise verstehen sich in Euro. Da
            der Anbieter die Kleinunternehmerregelung nach § 19 UStG in Anspruch nimmt, wird keine
            Umsatzsteuer ausgewiesen.
          </p>
          <p>
            (2) Sofern nicht anders vereinbart, erfolgt die Abrechnung{' '}
            <strong>monatlich im Voraus</strong>. Der Abrechnungszeitraum beginnt mit dem Tag der
            Freischaltung und verlängert sich jeweils um einen Monat, sofern keine Partei den Vertrag
            fristgerecht kündigt.
          </p>
          <p>
            (3) Rechnungen werden in elektronischer Form an die vom Kunden hinterlegte
            Rechnungs-E-Mail-Adresse versandt. Der Kunde stimmt dem ausdrücklich zu.
          </p>
          <p>
            (4) Zahlungen sind ohne Abzug innerhalb von <strong>14 Tagen</strong> nach Rechnungserhalt
            fällig. Bei Vereinbarung von Lastschrift- oder Kreditkarteneinzug erfolgt der Einzug
            entsprechend der vereinbarten Zahlungsdienstleister-Konditionen.
          </p>
          <p>
            (5) Bei Zahlungsverzug ist der Anbieter berechtigt, Verzugszinsen in gesetzlicher Höhe
            (§ 288 BGB) zu verlangen sowie nach Mahnung den Zugang zur Plattform vorübergehend zu
            sperren, bis der Verzug ausgeglichen ist. § 11 Abs. 4 bleibt unberührt.
          </p>
          <p>
            (6) Der Anbieter darf die Preise mit einer Ankündigungsfrist von mindestens{' '}
            <strong>acht Wochen</strong> in Textform anpassen. Der Kunde hat das Recht, dem Vertrag
            innerhalb dieser Frist zum Wirksamkeitsdatum der Preisanpassung zu kündigen.
          </p>

          <h2>§ 6 Pflichten des Kunden</h2>
          <p>
            (1) Der Kunde ist verpflichtet, seine Zugangsdaten geheim zu halten, sie ausschließlich
            befugten Mitarbeitern zur Verfügung zu stellen und bei Verdacht auf unbefugte Nutzung den
            Anbieter unverzüglich zu informieren.
          </p>
          <p>
            (2) Der Kunde stellt sicher, dass die Daten, die er in die Plattform einpflegt
            (insbesondere Endkunden- und Anlagendaten), inhaltlich korrekt sind und rechtmäßig
            verarbeitet werden dürfen. Der Kunde ist für die Einholung erforderlicher Einwilligungen
            seiner Endkunden, für die Erfüllung von Informationspflichten nach Art. 13/14 DSGVO und
            für eine etwaige Pflicht zur Folgenabschätzung selbst verantwortlich.
          </p>
          <p>
            (3){' '}
            <strong>
              Vor dem ersten Hochladen von personenbezogenen Endkundendaten in die Plattform
            </strong>{' '}
            ist der Abschluss eines Auftragsverarbeitungs­vertrags (AVV) gemäß Art. 28 DSGVO zwischen
            dem Kunden und dem Anbieter zwingend erforderlich. Der Mustervertrag steht unter{' '}
            <Link href="/avv">/avv</Link> zur Verfügung. Auf Verlangen wird der Anbieter den AVV in
            unterschriebener Form zur Verfügung stellen.
          </p>
          <p>
            (4) Der Kunde darf die Plattform nicht in einer Weise nutzen, die geltendes Recht oder
            Rechte Dritter verletzt. Insbesondere ist es untersagt, automatisierte Massen-Anfragen
            zu stellen, die Plattform per Reverse-Engineering nachzubilden oder Inhalte, Funktionen
            oder Sicherheitsmechanismen zu umgehen.
          </p>
          <p>
            (5) Der Kunde hat eine{' '}
            <strong>eigene angemessene Datensicherung</strong> vorzunehmen. Der Anbieter erstellt
            zwar systemseitig Backups (§ 8 Abs. 4), eine alleinige Datenhaltung beim Anbieter ist
            jedoch nicht geschuldet.
          </p>

          <h2>§ 7 Verfügbarkeit, Wartung und Support</h2>
          <p>
            (1) Außerhalb der Beta-Phase strebt der Anbieter eine durchschnittliche Verfügbarkeit
            der Plattform von <strong>99 %</strong> im Jahresmittel an, gemessen außerhalb
            angekündigter Wartungsfenster (Best-Effort).
          </p>
          <p>
            (2) Notwendige Wartungsarbeiten werden, soweit möglich, in nutzungsschwachen Zeiten und
            mit vorheriger Ankündigung in Textform oder über die Plattform durchgeführt.
          </p>
          <p>
            (3) Notfall-Wartungen zur Behebung sicherheitskritischer Probleme können auch ohne
            vorherige Ankündigung erfolgen.
          </p>
          <p>
            (4) Support-Anfragen sind per E-Mail an{' '}
            <a href="mailto:hello@torqr.de">hello@torqr.de</a> zu richten. Der Anbieter bemüht sich um
            Beantwortung innerhalb von <strong>zwei Werktagen</strong>. Ein bestimmter
            Reaktionszeitraum oder eine bestimmte Bearbeitungszeit wird außerhalb gesonderter
            Vereinbarungen nicht geschuldet.
          </p>

          <h2>§ 8 Datenschutz und Auftragsverarbeitung</h2>
          <p>
            (1) Beide Parteien beachten die einschlägigen datenschutzrechtlichen Bestimmungen,
            insbesondere die DSGVO und das BDSG.
          </p>
          <p>
            (2) Die Verarbeitung personenbezogener Daten des Kunden (Account- und Nutzungsdaten)
            durch den Anbieter ist in der Datenschutzerklärung unter{' '}
            <Link href="/datenschutz">/datenschutz</Link> beschrieben.
          </p>
          <p>
            (3) Soweit der Kunde personenbezogene Daten Dritter (insbesondere seiner Endkunden) in
            die Plattform einpflegt, ist der Kunde insoweit Verantwortlicher im Sinne des Art. 4
            Nr. 7 DSGVO und der Anbieter Auftragsverarbeiter. Es gelten zusätzlich die Bestimmungen
            des AVV (siehe <Link href="/avv">/avv</Link> und § 6 Abs. 3).
          </p>
          <p>
            (4) Der Anbieter sichert die in der Plattform verarbeiteten Daten täglich und bewahrt
            die Sicherungen mindestens <strong>sieben Tage</strong> rollierend auf.
            Wiederherstellungs-Leistungen können auf Verlangen des Kunden gegen gesondertes Entgelt
            erbracht werden, soweit dies technisch möglich und mit zumutbarem Aufwand verbunden ist.
          </p>

          <h2>§ 9 Haftung</h2>
          <p>
            (1) Der Anbieter haftet uneingeschränkt für Schäden aus der Verletzung des Lebens, des
            Körpers oder der Gesundheit, die auf einer fahrlässigen oder vorsätzlichen
            Pflichtverletzung des Anbieters beruhen, sowie für Schäden, die auf einer vorsätzlichen
            oder grob fahrlässigen Pflichtverletzung des Anbieters beruhen.
          </p>
          <p>
            (2) Bei der Verletzung von Pflichten, deren Erfüllung die ordnungsgemäße Durchführung des
            Vertrags überhaupt erst ermöglicht und auf deren Einhaltung der Kunde regelmäßig vertrauen
            darf (<strong>Kardinalpflichten</strong>), haftet der Anbieter auch bei leichter
            Fahrlässigkeit, jedoch begrenzt auf den vertragstypischen, vorhersehbaren Schaden.
          </p>
          <p>
            (3) Eine weitergehende Haftung des Anbieters ist ausgeschlossen. Insbesondere ist die
            Haftung für mittelbare Schäden, entgangenen Gewinn, ausgebliebene Einsparungen und
            Vermögensschäden in Fällen leichter Fahrlässigkeit, die keine Kardinalpflicht betreffen,
            ausgeschlossen.
          </p>
          <p>
            (4) Die Haftung des Anbieters bei leichter Fahrlässigkeit ist insgesamt auf den im
            jeweiligen Vertragsjahr vom Kunden gezahlten Betrag, mindestens jedoch auf 5.000 Euro,
            beschränkt.
          </p>
          <p>
            (5) Die Haftung nach dem Produkthaftungsgesetz sowie für übernommene Garantien bleibt
            unberührt.
          </p>
          <p>
            (6) Die Beschränkungen dieses § 9 gelten auch zugunsten gesetzlicher Vertreter und
            Erfüllungsgehilfen des Anbieters.
          </p>
          <p>
            (7) Eine verschuldensunabhängige Haftung des Anbieters für anfängliche Mängel nach
            § 536 a Abs. 1 Alt. 1 BGB ist ausgeschlossen.
          </p>

          <h2>§ 10 Vertraulichkeit</h2>
          <p>
            (1) Die Parteien werden alle vertraulichen Informationen der jeweils anderen Partei, von
            denen sie im Rahmen dieses Vertrags Kenntnis erlangen, vertraulich behandeln. Als
            vertraulich gelten alle Informationen, die als solche gekennzeichnet sind oder ihrer
            Natur nach erkennbar vertraulich sind.
          </p>
          <p>
            (2) Die Vertraulichkeitspflicht gilt auch für die Dauer von <strong>drei Jahren</strong>{' '}
            nach Beendigung des Vertrags.
          </p>
          <p>
            (3) Ausgenommen sind Informationen, die (a) bei Empfang bereits öffentlich bekannt waren
            oder es ohne Verschulden des Empfängers werden, (b) der Empfänger nachweislich bereits
            vor Übermittlung kannte, (c) der Empfänger rechtmäßig von einem Dritten erhält oder
            (d) aufgrund gesetzlicher oder behördlicher Verpflichtung offenzulegen sind.
          </p>

          <h2>§ 11 Laufzeit und Kündigung</h2>
          <p>(1) Der Vertrag wird auf unbestimmte Zeit geschlossen.</p>
          <p>
            (2) Beide Parteien können den Vertrag ordentlich mit einer Frist von einem Monat zum Ende
            eines Abrechnungszeitraums in Textform kündigen.
          </p>
          <p>
            (3) In der Beta-Phase gilt § 4 Abs. 2 lit. e (jederzeitige Kündbarkeit ohne Frist).
          </p>
          <p>
            (4) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt. Ein
            wichtiger Grund liegt für den Anbieter insbesondere vor, wenn der Kunde mit Zahlungen in
            Höhe eines Monatsentgelts oder mehr in Verzug ist und trotz Mahnung mit angemessener
            Frist nicht ausgleicht, oder wenn der Kunde wiederholt und schwerwiegend gegen § 6
            verstößt.
          </p>
          <p>
            (5) Nach Beendigung des Vertrags wird der Anbieter dem Kunden die im Account
            gespeicherten Daten innerhalb von <strong>30 Tagen</strong> in einem strukturierten,
            gängigen Format zum Export bereitstellen. Spätestens <strong>90 Tage</strong> nach
            Vertragsende werden die Daten gelöscht, soweit nicht gesetzliche Aufbewahrungspflichten
            entgegenstehen.
          </p>

          <h2>§ 12 Schlussbestimmungen</h2>
          <p>
            (1) Es gilt das <strong>Recht der Bundesrepublik Deutschland</strong> unter Ausschluss
            des UN-Kaufrechts und des deutschen Internationalen Privatrechts, soweit dieses
            ausländisches Recht zur Anwendung beruft.
          </p>
          <p>
            (2) <strong>Ausschließlicher Gerichtsstand</strong> für alle Streitigkeiten aus oder im
            Zusammenhang mit diesem Vertrag ist — soweit der Kunde Kaufmann, juristische Person des
            öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen ist — der Sitz des
            Anbieters, derzeit Mengerskirchen. Der Anbieter ist jedoch berechtigt, den Kunden auch an
            dessen allgemeinem Gerichtsstand zu verklagen.
          </p>
          <p>
            (3) Änderungen oder Ergänzungen dieses Vertrags bedürfen der{' '}
            <strong>Textform</strong>. Dies gilt auch für die Aufhebung dieser Klausel.
          </p>
          <p>
            (4) Sollten einzelne Bestimmungen dieses Vertrags ganz oder teilweise unwirksam sein oder
            werden, so bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. Die Parteien werden
            die unwirksame Bestimmung durch eine wirksame Bestimmung ersetzen, die dem
            wirtschaftlichen Zweck der unwirksamen Bestimmung am nächsten kommt. Entsprechendes gilt
            im Fall einer Regelungslücke.
          </p>
          <p>
            (5) Die Übertragung von Rechten und Pflichten aus diesem Vertrag durch den Kunden auf
            Dritte bedarf der vorherigen Zustimmung des Anbieters in Textform. Der Anbieter ist
            berechtigt, Rechte und Pflichten ohne Zustimmung des Kunden auf einen Rechtsnachfolger
            zu übertragen, soweit dies im Rahmen einer Geschäftsübertragung geschieht; der Kunde ist
            in diesem Fall zur außerordentlichen Kündigung innerhalb von vier Wochen ab Mitteilung
            berechtigt.
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
