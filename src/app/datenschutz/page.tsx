import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung',
  description: 'Datenschutzerklärung von Torqr nach DSGVO und BDSG.',
  robots: { index: true, follow: false },
};

export default function DatenschutzPage() {
  return (
    <>
      <MarketingHeader />
      <main className="min-h-screen bg-background pt-24">
        <article className="mx-auto max-w-3xl px-6 py-16 prose prose-sm sm:prose-base">
          <h1>Datenschutzerklärung</h1>
          <p className="text-muted-foreground">Stand: <time>{new Date().toLocaleDateString('de-DE')}</time></p>

          <h2>1. Verantwortlicher</h2>
          <p>
            Verantwortlich für die Datenverarbeitung auf dieser Website ist:<br />
            {/* TODO Anwalt: vollständige Verantwortlichen-Angaben aus Impressum übernehmen */}
            Torqr — Inhaber: Yannik Dorth<br />
            E-Mail: <a href="mailto:hello@torqr.de">hello@torqr.de</a>
          </p>

          <h2>2. Erhebung und Verarbeitung personenbezogener Daten</h2>
          <p>
            Beim Besuch dieser Website werden technisch notwendige Daten (z. B. IP-Adresse, Browser-Typ,
            besuchte Seiten) automatisch erfasst und für die sichere Bereitstellung der Website verarbeitet.
            Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).
          </p>

          <h2>3. Beta-Liste / Demo-Anfrage</h2>
          <p>
            Wenn du dich in die Beta-Liste einträgst oder eine Demo anfragst, verarbeiten wir die von dir
            übermittelten Angaben (E-Mail, Name, Firma, Telefon, Wunschtermin, Nachricht) zur Bearbeitung
            deiner Anfrage. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung) und Art. 6 Abs. 1
            lit. a DSGVO (Einwilligung).
          </p>
          <p>
            Die Daten werden für maximal 24 Monate aufbewahrt, danach gelöscht — sofern nicht gesetzliche
            Aufbewahrungsfristen entgegenstehen.
          </p>

          <h2>4. Hosting und Auftragsverarbeiter</h2>
          <p>
            {/* TODO Anwalt: konkrete AVV-Status-Sätze pro Dienstleister */}
            Wir nutzen folgende Auftragsverarbeiter:
          </p>
          <ul>
            <li>Vercel Inc. (Hosting der Anwendung) — Standort EU-Region, Auftragsverarbeitungsvertrag abgeschlossen</li>
            <li>Vercel Inc. (Vercel Analytics, optional nach Einwilligung) — anonyme Performance- und Seitenaufruf-Daten ohne Cookies, EU-Region</li>
            <li>PostHog Inc. (Product Analytics, optional nach Einwilligung) — Server-Region EU (Frankfurt), Auftragsverarbeitungsvertrag abgeschlossen</li>
            <li>Supabase Inc. (Datenbank) — Server-Region eu-central-1 (Frankfurt), Auftragsverarbeitungsvertrag abgeschlossen</li>
            <li>Resend (E-Mail-Versand) — Auftragsverarbeitungsvertrag abgeschlossen</li>
            <li>Upstash (Rate-Limiting) — Auftragsverarbeitungsvertrag abgeschlossen</li>
          </ul>

          <h2>5. Deine Rechte</h2>
          <p>
            Du hast jederzeit das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17),
            Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21)
            nach DSGVO. Außerdem hast du das Recht auf Beschwerde bei der zuständigen Aufsichtsbehörde.
          </p>

          <h2>6. Cookies und Analyse-Tools</h2>
          <p>
            Diese Website setzt technisch notwendige Cookies ein (Login-Session, Sicherheit) sowie
            optional — nach deiner ausdrücklichen Einwilligung — Analyse-Tools von Vercel und PostHog.
            Vor deiner Einwilligung wird kein Analyse-Code geladen oder ausgeführt.
          </p>
          <p>
            Du kannst deine Einwilligung jederzeit ändern oder widerrufen über den Link
            &quot;Cookie-Einstellungen&quot; im Footer der Seite.
          </p>
          <ul>
            <li>
              <strong>Vercel Analytics</strong> (Vercel Inc.) — anonyme Seitenaufrufe und
              Performance-Daten. Setzt keine Cookies. Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO.
            </li>
            <li>
              <strong>PostHog</strong> (PostHog Inc., EU-Server in Frankfurt) — anonyme Nutzungsanalyse
              für Produktverbesserung. Person Profiles nur bei expliziter Identifikation
              (identified_only-Modus), keine Auto-Capture, keine Session-Replays.
              Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO.
            </li>
          </ul>

          <h2>7. Kontakt</h2>
          <p>
            Bei Fragen zum Datenschutz wende dich an{' '}
            <a href="mailto:hello@torqr.de">hello@torqr.de</a>.
          </p>

          <p className="text-xs text-muted-foreground italic mt-12">
            Diese Datenschutzerklärung wurde initial mit Hilfe der Vorlage von datenschutz-generator.de
            erstellt und durch einen Anwalt reviewed.
          </p>

          <p className="mt-8"><Link href="/">← Zurück zur Startseite</Link></p>
        </article>
      </main>
      <MarketingFooter />
    </>
  );
}
