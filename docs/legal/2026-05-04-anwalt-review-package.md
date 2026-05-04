# Anwalt-Review-Paket — Datenschutzerklärung + Impressum

**Mandant:** Yannik Dorth (Einzelunternehmer, *Torqr*)
**Stand:** 2026-05-04
**Backlog-Referenz:** [#69 — Datenschutz + Impressum vor Public-Launch finalisieren](../BACKLOG.md)
**Live-URL (vor Public-Launch):** https://torqr.de

---

## 1. Mandant + Geschäftsmodell

**Rechtsform:** Einzelunternehmer (kein eingetragener Kaufmann, keine GmbH).
**Inhaber:** Yannik Dorth, Puller Weg 2, 35794 Mengerskirchen.
**Geschäftszweck:** Entwicklung und Betrieb der SaaS-Plattform *Torqr* — eine Wartungsmanagement-Software für **Heizungsbauer / SHK-Fachbetriebe in Deutschland**.

**Geschäftsmodell:**
- B2B-SaaS, monatlich/jährlich abrechnete Tiers (Solo €29 / Professional €49 / Enterprise €99)
- Aktuell *Beta-Phase* — Pilotkunden, keine Self-Service-Bezahlung implementiert
- Zielgruppe: deutsche Heizungsbauer-Betriebe (1-50 Mitarbeiter)
- Phase 1-3: ausschließlich Deutschland, Sprache nur Deutsch
- Endkunden des Heizungsbauers (deren Kunden) bekommen automatisierte Wartungs-Erinnerungs-E-Mails — sind selbst keine Torqr-Vertragspartner, ihre Daten verarbeitet Torqr im Auftrag des Heizungsbauers

**Datenverarbeitung — was passiert konkret:**
1. **Heizungsbauer registriert sich** → User-Account in Postgres (Supabase, Frankfurt)
2. **Heizungsbauer pflegt seine Endkunden + deren Heizungsanlagen** ein → tenant-scoped DB-Records (jeder Heizungsbauer sieht nur seine eigenen Daten — strict per `companyId`-Scoping enforced auf jeder API-Route)
3. **Cron-Job** schickt automatisierte Wartungs-Erinnerungen (E-Mail an Endkunden via Resend)
4. **Endkunde** klickt Cal.com-Link und bucht Termin → Webhook updated DB
5. **Heizungsbauer** dokumentiert Wartung in Mobile-App (Foto-Upload zu Supabase Storage, Wartungsteile-Liste, Notizen)

**Marketing-Site (torqr.de):**
- Statisches Landing (Next.js, Vercel-Hosting EU)
- Beta-Liste-Formular + Demo-Anfrage-Formular (POST → Postgres + Admin-Notification-E-Mail)
- Cookie-Banner mit 3 Optionen (Alle akzeptieren / Nur essentielle / Einstellungen)
- Optional nach Consent: Vercel Analytics + PostHog (EU-Server Frankfurt)

---

## 2. Was zu prüfen ist

Zwei Dokumente, beide live unter torqr.de:

| Dokument | URL | Pfad im Code |
|---|---|---|
| Datenschutzerklärung | https://torqr.de/datenschutz | `src/app/datenschutz/page.tsx` |
| Impressum | https://torqr.de/impressum | `src/app/impressum/page.tsx` |

Vollständiger Text beider Dokumente unten in **Abschnitt 5** und **Abschnitt 6** abgedruckt — der Anwalt braucht keinen Repo-Zugang.

---

## 3. Konkrete Anforderungen ans Anwalts-Review

### 3.1 Pflicht-Checks (müssen abgenommen werden vor Public-Launch)

1. **DSGVO-Konformität der Datenschutzerklärung gesamt** — vollständig nach Art. 13/14 DSGVO?
2. **§5 TMG-Konformität des Impressums** — alle Pflichtangaben drin? USt-ID nicht angegeben (siehe 4.3) — okay so?
3. **Cookie-Banner / Consent-Gate-Beschreibung in §6 Datenschutzerklärung** ist neu (2026-05-04 hinzugefügt) — entspricht das ECJ Planet49 + DSK-Guidance? Insbesondere:
   - Reicht die Beschreibung "Vor deiner Einwilligung wird kein Analyse-Code geladen" als Compliance-Aussage?
   - Ist die Rechtsgrundlage Art. 6 Abs. 1 lit. a für Vercel Analytics (cookieless!) und PostHog korrekt?
   - Muss die Cookie-Lebensdauer / der Speicherort (LocalStorage statt Cookie) explizit genannt werden?
4. **Auftragsverarbeiter-Liste in §4** — alle 6 Dienstleister korrekt benannt? Müssen die genauen Vertragspartner-Adressen angegeben werden, oder reicht der Firmenname?
5. **Streitschlichtung im Impressum** — die OS-Plattform-Verlinkung + Nicht-Bereitschaft zur Verbraucherschlichtung — formal korrekt für B2B-SaaS? (Wir haben fast nur B2B-Kunden, aber Endkunden des Heizungsbauers könnten als Verbraucher qualifizieren.)
6. **Verantwortlich nach §55 Abs. 2 RStV** — RStV ist seit 2020 abgelöst durch MStV (Medienstaatsvertrag) §18 Abs. 2 — soll der Verweis aktualisiert werden?

### 3.2 Wenn der Anwalt zusätzliches Risiko sieht (optional, aber willkommen)

- Brauchen wir bei aktueller Größe einen **Datenschutzbeauftragten**? (Einzelunternehmer, ~5-10 Pilotkunden, < 20 verarbeitende Personen — vermutlich nein, aber bitte bestätigen)
- Reicht die aktuelle Form für die geplante **Self-Service-Akquise** (Phase 2 ab Mitte 2026 mit Stripe/Paddle), oder müssen wir vorher AGBs / Widerrufsbelehrung / EWR-spezifische Texte ergänzen?
- **AVV-Vertragsvorlage (Art. 28 DSGVO)** als PDF-Download für Heizungsbauer-Kunden — separat als Backlog #70 geplant. Will der Anwalt einen Entwurf liefern oder reicht ein Standard aus dem GDD-Pool?
- Risiko-Hinweise zu **Endkunden-E-Mails (Wartungs-Erinnerungen)**: Heizungsbauer ist Verantwortlicher, Torqr ist Auftragsverarbeiter — ist die jetzige Datenschutzerklärung (die nur Torqr-eigene Verarbeitung beschreibt) ausreichend? Brauchen wir einen Hinweis-Satz für die Endkunden, dass die E-Mail im Auftrag eines Heizungsbauers verschickt wird?

### 3.3 Format der gewünschten Rückmeldung

- **Bevorzugt:** PDF mit Redlines + nummerierten Kommentaren pro Abschnitt
- **Alternativ:** Word/Markdown mit Track Changes
- **Mindest-Lieferumfang:** Konkrete Textvorschläge für jede Stelle, die wir ändern müssen (kein "muss überarbeitet werden" ohne Vorschlag)
- Unklarheiten / Annahmen, die der Anwalt für die Antwort getroffen hat, bitte am Anfang auflisten

**Ziel-Turnaround:** 2-4 Werktage (kein harter Launch-Termin, aber Public-Launch + Outbound-Akquise hängt daran).

---

## 4. Faktische Hintergrundinfos für den Anwalt

### 4.1 Verantwortlicher (vollständige Angaben)

- **Name:** Yannik Dorth
- **Anschrift:** Puller Weg 2, 35794 Mengerskirchen, Deutschland
- **E-Mail:** hello@torqr.de
- **Rechtsform:** Einzelunternehmer
- **Handelsregister:** keiner (kein Kaufmann nach HGB)
- **Tätigkeit:** Software-Entwicklung + Betrieb von Torqr

### 4.2 Datenschutzbeauftragter

Aktuell **nicht benannt**. Begründung: Einzelunternehmer ohne Mitarbeiter, keine Kerntätigkeit der Verarbeitung sensibler Daten i.S.d. Art. 9 DSGVO, < 20 Personen ständig mit Verarbeitung beschäftigt. Bitte vom Anwalt bestätigen oder gegenteilige Empfehlung geben.

### 4.3 USt-IdNr. / Steuerliche Angaben

Aktuell **kein** USt-IdNr.-Eintrag im Impressum. Begründung: Kleinunternehmerregelung nach §19 UStG aktiv (Umsatz unter 22.000 € im Vorjahr). Bitte bestätigen, ob ein Hinweis nötig ist (z. B. "Umsatzsteuer-ID nicht ausgewiesen, da Kleinunternehmerregelung gemäß §19 UStG").

### 4.4 Datenfluss-Übersicht (technisch)

Folgende Daten werden verarbeitet, welche Rechtsgrundlage und welcher Auftragsverarbeiter ist beteiligt:

| Datenart | Quelle | Speicherort | Rechtsgrundlage | Aufbewahrung |
|---|---|---|---|---|
| User-Account (Heizungsbauer): E-Mail, Name, Firma, Telefon, gehashtes Passwort | Registrierung | Supabase EU (Frankfurt) | Art. 6(1)(b) Vertragserfüllung | Bis Account-Löschung + ggf. handelsrechtliche Aufbewahrung |
| Endkunden des Heizungsbauers: Name, Adresse, E-Mail, Telefon | Eingabe durch Heizungsbauer | Supabase EU | Art. 6(1)(b) Vertragserfüllung (zwischen Heizungsbauer und Endkunde) — Torqr = Auftragsverarbeiter | Bis Heizungsbauer löscht, max. 3 Jahre |
| Heizungsanlage-Daten: Hersteller, Modell, Installationsdatum | Eingabe durch Heizungsbauer | Supabase EU | Art. 6(1)(b) | Bis Löschung |
| Wartungs-Fotos (vor Ort) | Mobile-App-Upload | Supabase Storage EU | Art. 6(1)(b) | Bis Löschung |
| Beta-Lead / Demo-Anfrage von Marketing-Site: E-Mail, Name, Firma, optional Telefon, Wunschtermin, Nachricht | Marketing-Formular | Supabase EU | Art. 6(1)(b) Vertragsanbahnung + Art. 6(1)(a) Einwilligung | Max. 24 Monate |
| Webserver-Logs: IP, User-Agent, Pfad, Zeitstempel | HTTP-Request | Vercel EU | Art. 6(1)(f) berechtigtes Interesse (Sicherheit) | 30 Tage |
| Cookie-Consent-Entscheidung | LocalStorage des Browsers | Browser des Users | Art. 6(1)(a) Einwilligung — Speicherung selbst auf Basis berechtigtes Interesse zur Dokumentation | Bis User Browser-Storage löscht |
| Vercel Analytics (nach Consent): anonyme Pageviews, Performance | Vercel-Edge | Vercel EU (cookieless) | Art. 6(1)(a) | 30 Tage rolling |
| PostHog (nach Consent): anonyme Nutzungsanalyse, Conversion-Events | PostHog EU (Frankfurt) | PostHog EU | Art. 6(1)(a) | 12 Monate (PostHog default) |
| Cal.com Buchungen: Endkunden-E-Mail, Termin, evtl. Adresse | Cal.com Webhook | Supabase EU | Art. 6(1)(b) | Bis Heizungsbauer löscht |
| E-Mail-Versand-Logs: Empfänger, Typ, Zeitstempel, Status | Resend + Supabase | Beides | Art. 6(1)(b) | 12 Monate |

### 4.5 Auftragsverarbeiter — Stand der AVV-Verträge

| Anbieter | Region | AVV abgeschlossen? | Standardvertragsklauseln nötig? |
|---|---|---|---|
| Vercel Inc. (Hosting) | EU-Region (auswählbar) | ✅ ja, via Vercel-Account-Settings akzeptiert | Vercel ist US-Konzern → ja, SCCs Teil des AVV |
| Vercel Inc. (Vercel Analytics) | EU-Region | ✅ derselbe Vercel-AVV deckt das ab | dito |
| PostHog Inc. | EU-Server (Frankfurt) | ⚠️ AVV als Standard-PDF von PostHog verfügbar, aktuell **noch nicht unterzeichnet** — geplant vor Public-Launch | US-Konzern → SCCs nötig |
| Supabase Inc. | eu-central-1 (Frankfurt) | ✅ ja, via Supabase-Account akzeptiert | US-Konzern → SCCs |
| Resend, Inc. | EU-Server | ✅ ja, akzeptiert | US-Konzern → SCCs |
| Upstash, Inc. (Redis Rate-Limiting) | EU-Region | ✅ ja, akzeptiert | US-Konzern → SCCs |
| Sentry (Error-Monitoring, server-side only) | EU (Frankfurt) | ⚠️ **noch nicht** — geplant. Sentry verarbeitet IPs + Stack-Traces. | US-Konzern → SCCs |

**Hinweis an Anwalt:** Sentry läuft als Error-Monitoring im Server-Bundle UND im Client-Bundle. Wir haben es aktuell nicht in §4 der Datenschutzerklärung erwähnt — sollten wir das nachholen?

### 4.6 Cookie-Banner / Consent-System (technische Beschreibung)

Implementiert seit 2026-05-04 (siehe `docs/superpowers/plans/2026-05-04-cookie-consent-and-analytics.md`):

- **Beim ersten Besuch** erscheint ein Banner unten rechts mit drei Buttons (alle gleichgewichtet als `outline`-Variante, um ECJ Planet49 + DSK-Dark-Pattern-Verbot zu erfüllen):
  - "Alle akzeptieren" → setzt Vercel Analytics + PostHog auf true
  - "Nur essentielle" → beide Services bleiben false
  - "Einstellungen" → öffnet Dialog mit Per-Service-Toggles (Vercel Analytics, PostHog) + "Speichern und schließen" / "Abbrechen"
- **Persistenz:** Browser-LocalStorage Key `torqr-consent-v1` mit JSON `{ version, decided, services: { vercelAnalytics, posthog }, decidedAt: ISO }`
- **Vor Consent-Entscheidung:** Es wird **kein einziges Byte** PostHog-Code in den Browser geladen. Technisch wird `posthog-js` per `await import('posthog-js')` dynamisch nachgeladen, erst nachdem `consent.services.posthog === true` ist. Vercel Analytics analog: das `<Analytics />`-Component rendert nur unter Consent-Bedingung.
- **Widerruf:** Über den Footer-Link "Cookie-Einstellungen" — ruft `reopen()` auf, Banner erscheint erneut, neue Auswahl überschreibt vorherige. Bei Widerruf einer aktiven Service-Erlaubnis wird `posthog.opt_out_capturing()` aufgerufen.
- **PostHog-Konfiguration** (nur falls Anwalt Details prüfen will):
  - `api_host: https://eu.i.posthog.com`
  - `person_profiles: 'identified_only'` (keine anonymen Profile)
  - `autocapture: false` (kein automatisches Click/Scroll/Form-Tracking)
  - `disable_session_recording: true` (keine Session-Replays)
  - `capture_pageview: 'history_change'` (nur Pageviews)
  - Conversion-Events: `beta_lead_submitted`, `demo_request_submitted` (jeweils mit Tier + Source-Attribut)

### 4.7 Tech-Stack (für Background-Verständnis)

- Next.js 16 App Router (TypeScript), Hosting: Vercel EU
- Datenbank: Supabase PostgreSQL (Frankfurt) + Supabase Storage (Foto-Upload)
- Auth: NextAuth v5, Email/Passwort, bcrypt
- E-Mail: Resend
- Booking: Cal.com (Webhook + API v2)
- Rate-Limiting: Upstash Redis EU
- Error-Monitoring: Sentry (Frankfurt)
- Analytics (consent-gated): Vercel Analytics + PostHog EU

---

## 5. Aktueller Text — Datenschutzerklärung (live unter torqr.de/datenschutz)

> *Stand: wird automatisch auf Aufrufdatum gesetzt (`new Date().toLocaleDateString('de-DE')`)*

### 1. Verantwortlicher

Verantwortlich für die Datenverarbeitung auf dieser Website ist:
*[TODO Anwalt: vollständige Verantwortlichen-Angaben aus Impressum übernehmen]*
Torqr — Inhaber: Yannik Dorth
E-Mail: hello@torqr.de

### 2. Erhebung und Verarbeitung personenbezogener Daten

Beim Besuch dieser Website werden technisch notwendige Daten (z. B. IP-Adresse, Browser-Typ, besuchte Seiten) automatisch erfasst und für die sichere Bereitstellung der Website verarbeitet. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).

### 3. Beta-Liste / Demo-Anfrage

Wenn du dich in die Beta-Liste einträgst oder eine Demo anfragst, verarbeiten wir die von dir übermittelten Angaben (E-Mail, Name, Firma, Telefon, Wunschtermin, Nachricht) zur Bearbeitung deiner Anfrage. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung) und Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).

Die Daten werden für maximal 24 Monate aufbewahrt, danach gelöscht — sofern nicht gesetzliche Aufbewahrungsfristen entgegenstehen.

### 4. Hosting und Auftragsverarbeiter

*[TODO Anwalt: konkrete AVV-Status-Sätze pro Dienstleister]*

Wir nutzen folgende Auftragsverarbeiter:

- Vercel Inc. (Hosting der Anwendung) — Standort EU-Region, Auftragsverarbeitungsvertrag abgeschlossen
- Vercel Inc. (Vercel Analytics, optional nach Einwilligung) — anonyme Performance- und Seitenaufruf-Daten ohne Cookies, EU-Region
- PostHog Inc. (Product Analytics, optional nach Einwilligung) — Server-Region EU (Frankfurt), Auftragsverarbeitungsvertrag abgeschlossen
- Supabase Inc. (Datenbank) — Server-Region eu-central-1 (Frankfurt), Auftragsverarbeitungsvertrag abgeschlossen
- Resend (E-Mail-Versand) — Auftragsverarbeitungsvertrag abgeschlossen
- Upstash (Rate-Limiting) — Auftragsverarbeitungsvertrag abgeschlossen

### 5. Deine Rechte

Du hast jederzeit das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21) nach DSGVO. Außerdem hast du das Recht auf Beschwerde bei der zuständigen Aufsichtsbehörde.

### 6. Cookies und Analyse-Tools

Diese Website setzt technisch notwendige Cookies ein (Login-Session, Sicherheit) sowie optional — nach deiner ausdrücklichen Einwilligung — Analyse-Tools von Vercel und PostHog. Vor deiner Einwilligung wird kein Analyse-Code geladen oder ausgeführt.

Du kannst deine Einwilligung jederzeit ändern oder widerrufen über den Link "Cookie-Einstellungen" im Footer der Seite.

- **Vercel Analytics** (Vercel Inc.) — anonyme Seitenaufrufe und Performance-Daten. Setzt keine Cookies. Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO.
- **PostHog** (PostHog Inc., EU-Server in Frankfurt) — anonyme Nutzungsanalyse für Produktverbesserung. Person Profiles nur bei expliziter Identifikation (identified_only-Modus), keine Auto-Capture, keine Session-Replays. Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO.

### 7. Kontakt

Bei Fragen zum Datenschutz wende dich an hello@torqr.de.

> *Diese Datenschutzerklärung wurde initial mit Hilfe der Vorlage von datenschutz-generator.de erstellt und durch einen Anwalt reviewed.*

**Markierte Stellen mit `TODO Anwalt`:** §1 (vollständige Verantwortlichen-Angaben) und §4 (konkrete AVV-Status-Sätze).

---

## 6. Aktueller Text — Impressum (live unter torqr.de/impressum)

### Angaben gemäß §5 TMG

Yannik Dorth
Puller Weg 2
35794 Mengerskirchen
Deutschland

### Kontakt

E-Mail: hello@torqr.de

### Verantwortlich für den Inhalt nach §55 Abs. 2 RStV

Yannik Dorth (Anschrift wie oben)

### Streitschlichtung

Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr. Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.

### Haftung für Inhalte

Als Diensteanbieter sind wir gemäß §7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.

---

## 7. Workflow nach Anwalts-Rückmeldung

Nach Erhalt der Redlines:

1. Yannik / Claude integriert die Änderungen in `src/app/datenschutz/page.tsx` und `src/app/impressum/page.tsx`
2. PR-Review (intern), Test-Run, Deploy auf Vercel Production
3. Cookie-Banner erneut testen (DSGVO-Smoke aus Sprint 30 Tag 2 reproduzieren)
4. Backlog-Item #69 als resolved markieren
5. AVV-Vertragsvorlage (#70) nach Anwalt-Empfehlung anstoßen, falls separat notwendig

---

## 8. Kontakt für Rückfragen

**Mandant:** Yannik Dorth · y.dorth182@gmx.de · *(Telefon auf Anfrage)*

Anwalt darf Rückfragen direkt per E-Mail an hello@torqr.de oder an die persönliche Adresse senden.
