# Torqr — Marketing Briefing

> **Dokument-Status:** Living Document
> **Letzte Aktualisierung:** 2026-04-28
> **Zielgruppe dieses Dokuments:** Marketing-Agent / externe Kreativpartner für Landingpage, Brand-Management, Angebotsvarianten, Content & Akquise.
> **Stand der Software:** Sprint 28 abgeschlossen — Wartungsteile/Materialmanagement Phase A live in Produktion.

---

## 0. TL;DR (für den Marketing-Agent)

- **Was:** Torqr ist eine **DSGVO-konforme SaaS-Wartungsmanagement-Plattform für Heizungsbauer und vergleichbares Handwerk** (Klima, Wasseraufbereitung, Energiespeicher).
- **Wer:** Primär **Ein-Mann-Heizungsbaubetriebe** in Deutschland (~15.000 Betriebe), erweiterbar auf kleine Teams (2–5 Personen) mit OWNER/TECHNICIAN-Rollen.
- **Warum:** Reduziert administrativen Wartungs-Overhead von **~8 h/Woche auf <2 h/Woche** durch automatisierte Erinnerungen, mobile Vor-Ort-Dokumentation, Cal.com-Buchungsflow und Materialplanung.
- **Wie:** Mobile-first Web-App (PWA-tauglich), live unter **torqr.de**, Cloud-Hosting via Vercel + Supabase EU.
- **Stand heute:** Production-ready mit aktivem Pilotkunden, 28 Sprints geliefert, **324 grüne Tests**, kein laufender SaaS-Verkauf — Marketing-Launch steht aus.
- **Brand-Ton:** Ruhig, technisch, deutsch, leicht pulsierend (Diagnose-Linien-Icon). Farben: **Industriegrün #008000** + **Bernstein-Akzent #EF9F27**.

**Wichtigster Marketing-Auftrag jetzt:** Landingpage `torqr.de`, Pricing-Story (Solo/Pro/Enterprise), Trust-Signal-Bausteine (DSGVO, Hosting EU), erste Akquise-Strecke (SEO + Innungs-/Forum-Outbound).

---

## 0.5 Decisions Log (entschieden 2026-04-28)

Die folgenden strategischen Punkte sind **bereits entschieden** und werden vom Marketing-Agent nicht mehr aufgemacht. Detail-Begründungen in den jeweiligen Sektionen.

| # | Decision | Wert | Quelle |
|---|---|---|---|
| D-1 | **Markenname** | **Torqr** (Domain `torqr.de` läuft, Wordmark + Brand-Spec ausgearbeitet, internationalisierbar) | §1.3 |
| D-2 | **Tagline-Hauptrichtung** | **Pragmatisch-funktional**, Hauptkandidat: *"Die Wartungsakte für Heizungsbauer."* (Validierung mit Pilotkunden + 3 Kollegen folgt) | §11.1 |
| D-3 | **Trial-Modell** | **30 Tage Free Trial**, danach bezahlt. Begründung: Wartungssaisonalität — User braucht Zeit, den Erinnerungs-Effekt zu spüren. | §7.3 |
| D-4 | **Tier-Gating** | Solo single-user / Pro Multi-User+Wartungsteile / Enterprise Unlimited+API+Custom-Branding+Priority-Support. Cal.com-Integration in **allen** Tiers (Kern-USP). | §7.2 |
| D-5 | **Zielregion** | **Nur Deutschland**, Sprache **ausschließlich Deutsch**. DACH-/EN-Expansion frühestens 2027 nach SaaS-Validierung. | §3.3 |
| D-6 | **Anrede** | **"Du"** auf Landingpage / Marketing (Heizungsbauer untereinander), **"Sie"** in Endkunden-Mails (Wartungs-Empfänger sind oft Senioren). | §2.4 |
| D-7 | **Pilotkunden-Story** | **Anonymisiert** (Branche + Betriebsgröße + Zitat, **kein Name, kein Foto**) als Fallback-Standard. Volle Namens-/Bildfreigabe optional, falls Pilotkunde explizit zustimmt. | §11.6 |
| D-8 | **Marketing-Agent-Mandat** | **Bewusst offen gelassen.** Wird im Erstgespräch mit dem Agenten geklärt (Tendenz: Konzepte + Designs + Texte + ggf. Code-Beiträge). | §12.4 |

### Bewusst offen geblieben (weiterhin zu klären)

- **White-Label-Strategie** (#83): Innungen aktiv ansprechen oder nur on-demand?
- **Internationalisierung-Zeitpunkt:** Englisch frühestens 2027 — konkreter Trigger wann?

---

## 1. Produkt-Identität

### 1.1 Was Torqr ist

Torqr ist die **digitale Wartungsakte für Heizungsbauer**: Eine Web-App, die Kunden, Anlagen, Wartungstermine, Materialverbrauch und Kundenkommunikation in **einem System** abbildet — speziell zugeschnitten auf den Workflow eines Heizungs-/Klima-Handwerkbetriebs, nicht eine generische Handwerker-CRM-Lösung.

**Kerngedanke:** Eine Wartung beginnt nicht in der Werkstatt mit einem Excel-Sheet, sondern beim Kunden vor der Therme — und endet mit einem Foto im Smartphone. Torqr ist auf genau diesen Pfad optimiert.

### 1.2 Was Torqr **nicht** ist

- Kein generisches Handwerker-ERP (kein Faktura, keine Buchhaltung, keine Lohnabrechnung).
- Kein "Excel mit besserer UI" — Torqr automatisiert proaktiv (Erinnerungen, Berechnungen, Material).
- Keine selbstgebaute Kalender-/Booking-Engine — bewusste Integration mit **Cal.com v2** (siehe §6).
- Keine native Mobile-App (noch nicht) — installierbar als PWA, alles browserbasiert.

### 1.3 Markenname & Etymologie

- **Markenname:** **Torqr** — abgeleitet vom englischen *"torque" / "torquer"* (Drehmoment).
- **Ursprünglicher Arbeitstitel** (Dezember 2024): *"Drehmoment"* — wurde aus Sprach-/Domain-Gründen zu "Torqr" anglisiert.
- **Bedeutung:** Drehmoment = präziser, gerichteter Kraftstoß. Übertragen auf das Produkt: präzise, mobile, gerichtete Werkzeuge für den Techniker, kein "schwerer" SaaS-Bauchladen.
- **Domain (live):** [`torqr.de`](https://torqr.de)
- **Wordmark-Komponente im Code:** `<TorqrWordmark />` mit optionalem Tagline-Slot.

---

## 2. Brand-System

> Vollständige technische Spec: [`docs/brand_spec/BRAND_SPEC.md`](../brand_spec/BRAND_SPEC.md)
> Brand-Tokens im Code: `src/styles/brand.config.ts` + `tailwind.config.ts`
> Komponenten: `src/components/brand/TorqrIcon.tsx`

### 2.1 Logo & Icon

**Konzept:** Puls / Diagnose-Linie auf abgerundetem grünem Quadrat — visuelles Anker-Bild für *"Anlage wird live geprüft"*.

| Element | Spezifikation |
|---|---|
| Container | Abgerundetes Quadrat (rx 22, iOS-Stil) |
| Hintergrund | `#008000` (default), `#004D00` (dark), transparent (ghost) |
| Puls-Linie | `polyline`, weiß, stroke-width 5.5 |
| Akzent-Punkt | Kreis r=6 in `#EF9F27` (Bernstein) — visuell der "EKG-Pulser" |

**Größen-Skala (px):** 20 (Favicon) · 32 (Nav) · 48 (Cards) · 72 (Splash) · 96 (App-Icon).

### 2.2 Farbsystem

| Rolle | Token | Hex | Tailwind |
|---|---|---|---|
| Primär | `brand.primary` | `#008000` | `bg-brand` |
| Primär dunkel | `brand.primaryDark` | `#006600` | `bg-brand-600` |
| Primär tief | `brand.primaryDeep` | `#004D00` | `bg-brand-700` |
| Primär Surface | `brand.surface` | `#E6F2E6` | `bg-brand-50` |
| Akzent | `brand.accent` | `#EF9F27` | `bg-accent` |
| Akzent hell | `brand.accentLight` | `#FAC775` | `bg-accent-light` |
| Akzent Surface | `brand.accentSurface` | `#FAEEDA` | `bg-accent-surface` |

**Status-Semantik (in der App durchgehend genutzt — auch Marketing-relevant für Demos / Screenshots):**

| Status | Bedeutung | Surface | Border | Text |
|---|---|---|---|---|
| ok | Gewartet, OK | `#E6F2E6` | `#99CC99` | `#006600` |
| due | Wartung bald | `#FAEEDA` | `#FAC775` | `#633806` |
| overdue | Überfällig | `#FAECE7` | `#F5C4B3` | `#712B13` |
| info | Hinweis | `#E6F1FB` | `#B5D4F4` | `#0C447C` |

### 2.3 Typografie

System-Font-Stack (`'Segoe UI', system-ui, -apple-system, sans-serif`) — bewusste Entscheidung gegen Webfonts:
- Schnellere Ladezeit (kein FOUT)
- Native Wirkung auf Smartphone (Max nutzt iPhone → San Francisco)
- Vertraute Typo für die wenig tech-affine Zielgruppe

**Gewichte:** 400 (Body), 500 (Buttons/Subheads), 600 (Headlines/Wordmark).

### 2.4 Tonalität (Copy-Voice)

- **Sprache:** Deutsch, durchgehend. Keine Englisch-Versionen vor 2027 (Decision D-5).
- **Anrede (Decision D-6):**
  - **Landingpage / Marketing-Material / Outbound-Mails an Heizungsbauer → "Du".** Begründung: Zielgruppe (selbständige Handwerker) duzt sich untereinander, andere Handwerker-Tools (Tooltime, Plancraft) machen es ebenso. Wirkt direkter, weniger Anzug-Aura.
  - **Endkunden-E-Mails (Wartungserinnerung, Booking-Confirmation an die Privathaushalte) → "Sie".** Begründung: Endkunden-Empfänger sind häufig Senioren, "Du" wäre übergriffig.
  - **Inhouse-Techniker-UI → "Du".**
- **Stil:** Sachlich, technisch korrekt, ohne Fachjargon-Ballast. Keine Marketing-Floskeln ("revolutionär", "next-gen") — die Zielgruppe ist nüchtern.
- **Emojis:** In Produktcopy & E-Mails **nicht** einsetzen. (Im Dashboard sparsam für Status-Indikation OK.)
- **Beispiel-Tonfall (Reminder-Mail):**
  > *"Sehr geehrter Herr Müller, Ihre Heizung (Viessmann Vitodens 200) ist in ca. 4 Wochen wieder zur Wartung fällig. Wir werden uns zeitnah bei Ihnen melden."*
- **Marketing-Anti-Tonfall:** "Game-changer für die Heiz-Branche!" → **nein**.

---

## 3. Zielgruppe & Markt

### 3.1 Primärpersona — "Max, der Heizungsbauer"

| Attribut | Wert |
|---|---|
| Rolle | Selbständiger Ein-Mann-Heizungsbau-Betrieb |
| Alter | 35–50 |
| Tech-Affinität | Niedrig bis mittel |
| Endkundenbasis | 50–100 Wartungsverträge |
| Aktuelle Tools | Excel, Telefon, Papier, Outlook |
| Schmerzpunkt | ~8 h/Woche Verwaltungs-Overhead, ~5 % verlorene Termine durch vergessene Erinnerungen |
| Geräte | Smartphone (primär), Laptop in Werkstatt (sekundär) |
| Sprache | Deutsch (kein internationales Geschäft) |

**Wichtigster Insight:** Max will *keine* zusätzliche "Software-Disziplin" lernen. Die App muss in der Pause auf der Baustelle bedienbar sein — sonst stirbt die Adoption.

### 3.2 Sekundärsegmente (post-Pilot)

1. **Kleine Heizungsbau-Teams** (2–5 Mitarbeiter) — Inhaber + 1–4 Techniker. **Bereits Architektur-seitig abgedeckt** durch Sprint 23 (Company-as-Tenant, OWNER/TECHNICIAN-Rollen, Workload-Management seit Sprint 24).
2. **Weitere Handwerk-Trades:** Klempner, Lüftungsbauer, Schornsteinfeger — gleicher Wartungsintervall-Workflow. **Im Datenmodell bereits unterstützt** durch generisches `SystemCatalog` (4 Typen: Heizung, Klima, Wasseraufbereitung, Energiespeicher; 904 Katalog-Einträge).
3. **DACH-Expansion:** Österreich, Schweiz — UI ist Deutsch, technisch keine Blocker. **Aktuell bewusst nicht aktiv adressiert (Decision D-5).**

### 3.3 Markt (TAM/SAM/SOM)

**Zielregion-Decision (D-5):** Phase 1–3 ausschließlich **Deutschland**. Englisch-/DACH-Expansion frühestens **2027**, nach Validierung in DE. Begründung: TAM von 15.000 Betrieben in DE allein reicht für mehrere Jahre Wachstum, AT/CH bringen zusätzliche Steuer-/AVV-Komplexität ohne nennenswerten ROI vor SaaS-Etablierung.

| Schicht | Größe | Quelle / Annahme |
|---|---|---|
| TAM (Total Addressable Market) | ~15.000 Ein-Mann-Heizungsbaubetriebe DE | Aus BMC, Schätzung ZDH/Innungsdaten |
| SAM (Serviceable Available Market) | ~5.000 mit Smartphone + Bereitschaft zu €29/Monat | Konservative Annahme: ~33 % Tech-Adoptions-Quote |
| SOM Jahr 1 (Realistic) | 100 Kunden = €3.900 MRR | BMC-Annahme |
| SOM Jahr 2 (Realistic) | 200–300 Kunden = €7.800–11.700 MRR | BMC-Annahme |
| Erweitert (Klima/Wasser/Energie) | +30–50 % | Datenmodell unterstützt es; Markt-Validierung offen |

> **Wichtig für Marketing-Story:** Die ursprüngliche BMC-Rechnung (Dez 2024) ging von **reinem Heizungs-Markt** aus. Seit Sprint 11 ist Torqr **Multi-System** — das wurde im Pricing-Modell noch nicht reflektiert.

---

## 4. Value Proposition

### 4.1 Quantifizierter Mehrwert (für Endkunde Max)

| Effekt | Wert/Jahr |
|---|---|
| Zeitersparnis: 6 h/Woche × 48 Wochen × 40 €/h | **~12.480 €** |
| Vermiedene Kundenabwanderung (5 % Churn) | **~3.000–5.000 €** |
| **Gesamt-Mehrwert/Jahr** | **~15.000–17.000 €** |
| **Kosten Solo-Tier (€29 × 12)** | **€348** |
| **ROI** | **~40–50× pro Jahr** |

### 4.2 Funktionale Versprechen (Marketing-Claims, alle heute haltbar)

1. **"Nie wieder vergessene Wartung."** Automatische 4-Wochen- + 1-Wochen-Erinnerungs-E-Mails an Endkunden. Doppelt opt-in. Stateless HMAC-Unsubscribe. Live seit Sprint 4.
2. **"Wartung in 30 Sekunden — vor der Therme."** Mobile Checklist-Modal, 3-Step-Wizard mit Fotos und Notizen. Live seit Sprint 18.
3. **"Online-Buchung ohne Telefon-Pingpong."** Kunde bekommt Cal.com-Link in der Erinnerungsmail, bucht selbst. Reschedule + Cancel direkt aus Torqr. Live seit Sprint 25.
4. **"Du weißt vor jedem Termin, welche Teile mitkommen."** Wartungssets pro Anlagentyp + Override pro Anlage + Lagerverwaltung mit Mindestbestand-Alarm. Live seit Sprint 28.
5. **"Mit Mitarbeitern wachsen, ohne System zu wechseln."** Multi-User Company-Modell, Rollen, Anlagen-Zuweisung, Techniker-Auslastungs-Übersicht. Live seit Sprint 23/24.
6. **"DSGVO-konform aus Deutschland."** Hosting EU-Region (Frankfurt), Supabase eu-central-1, Resend für E-Mail, doppeltes Opt-In, Auftragsverarbeitungsvertrag-fähig.
7. **"Ein System für alle Anlagentypen."** Heizung, Klima, Wasseraufbereitung, Energiespeicher — 904 Katalog-Geräte vorgepflegt, eigene ergänzbar. Live seit Sprint 11.

### 4.3 Emotionale Versprechen

- **Souveränität** statt Hektik: "Du gehst in die Wartungssaison hinein und weißt, dass nichts durchrutscht."
- **Professionalität** vor Kunden: Erinnerungsmails sehen aus, als hätte ein Büro dahinter geantwortet — nicht ein gestresster Techniker.
- **Eigentum am Datenbestand:** Kunde, Anlage, Foto-Historie gehört dem Betrieb — keine Vendor-Lock-in-Sorgen (Daten exportierbar; Code-Eigentum verhandelbar im Solo-Setup).

---

## 5. Aktueller Feature-Stand (Stand 2026-04-28)

> Vollständige Sprint-Historie & Migration-Notes: [`docs/BACKLOG.md`](../BACKLOG.md) → "Completed / Resolved"

### 5.1 Was heute live ist

#### Kunden- & Anlagenverwaltung
- Kundenverwaltung mit Adresse, Telefon (Click-to-Call), E-Mail (Click-to-Mail), Notizen.
- **Multi-System-Modell**: Pro Kunde beliebig viele Anlagen, 4 Anlagentypen (Heizung, Klima, Wasseraufbereitung, Energiespeicher).
- **Globaler Geräte-Katalog**: 904 vorgepflegte Hersteller/Modell-Einträge (224 Heizung, 346 Klima, 125 Wasser, 209 Energiespeicher inkl. Boiler/Pufferspeicher).
- Eigene Geräte ergänzbar via Inline-Modal.
- Subtypen für Klima (Single-/Multi-Split 2–5) und Energiespeicher (Boiler/Pufferspeicher).
- **Foto-Dokumentation pro Anlage**: bis zu 5 Fotos, JPEG/PNG/WebP, max. 5 MB, Lightbox-Galerie. Live seit Sprint 27.

#### Wartungsmanagement
- **Digitale Checkliste**: 3-Step-Modal (Checkliste → Notizen + Fotos → Bestätigen).
- Pro System-Typ vorgegebene Default-Items (10 Heizung, 7 Klima, 6 Wasser, 6 Energiespeicher), zusätzlich pro-Anlage anpassbar.
- Immutable JSON-Snapshot pro Wartung — historische Checklisten bleiben unverändert.
- Automatische Berechnung des nächsten Wartungstermins.
- Wartungshistorie pro Anlage mit Foto-Galerie.
- **Follow-Up-Jobs** (Nachfolgeaufträge) pro Anlage.

#### Wartungsteile & Materialmanagement (Sprint 28, brandneu)
- **MaintenanceSet-Bibliothek** pro Mandant: Wiederverwendbare Teilelisten (z. B. "Standard-Wartung Vitodens 200").
- **Customer-System-Overrides**: ADD-Items (zusätzlich) und EXCLUDE-Items (rausnehmen) pro Anlage.
- **InventoryItem** mit Mindestbestand & Bewegungshistorie (RESTOCK / CORRECTION / MAINTENANCE_USE / MANUAL_ADJUSTMENT).
- Automatische Lagerbuchung bei Wartungsabschluss (Step 2.5 "Teileverbrauch" im Checklist-Modal).
- **On-demand Packliste** als Druckansicht zum Termin.
- **Dashboard-Karte** "Mindestbestand unterschritten" (nur OWNER).
- Wochenübersicht-E-Mail um Lager-Sektion erweitert.

#### Terminmanagement & Cal.com-Integration
- **Cal.com v2 Webhook**: Booking-Daten landen direkt in Torqr (Customer-Resolution via Metadata oder E-Mail-Fallback).
- **In-App Reschedule + Cancel**: Termine über Cal.com-API umbuchen oder absagen, ohne Tool-Wechsel.
- **Termine-Page** (`/dashboard/termine`): Listenansicht + Monatskalender, 8 Filter (Zeitraum/Status/Techniker/Kunde/System/Quelle), Booking-Detail-Drawer.
- Zwei E-Mail-Templates: `BookingRescheduleEmail`, `BookingCancellationEmail`.
- HMAC-SHA256-Signatur-Verifikation auf Webhook (fail closed).
- Manuelle Buchung (Office-Side) via `BookingFormModal` mit automatischem Confirmation-Mail-Versand.

#### E-Mail-Automatisierung (Resend + React Email)
- **Reminder-Mails**: 4 Wochen + 1 Woche vor `nextMaintenance`, deduplikiert per 30-Tage-Fenster.
- **Wochenübersicht** (Mo 07:00 UTC): Termine diese Woche / fällig + ungebucht / überfällig / Rückblick / Lager.
- **Booking-Confirmation** bei manueller Buchung.
- **Customizable Templates**: User kann `reminderGreeting` + `reminderBody` (mit `{customerName}`-Platzhalter) im Account anpassen.
- **Doppelt Opt-In**: Customer.emailOptIn-Status (NONE/PENDING/CONFIRMED/UNSUBSCRIBED) — UWG-konform.
- **Stateless HMAC-Unsubscribe-Token**: kein DB-Roundtrip beim Abmelden.
- **EmailLog** & **CronRun** mit Sentry-Monitoring.

#### Multi-User / Multi-Mandant (Company-as-Tenant)
- **Company-Modell** als Tenant-Boundary — alle 19 API-Routes scopen über `companyId`.
- **Rollen**: OWNER (voller Zugriff), TECHNICIAN (eingeschränkt — kein Delete, keine Mitarbeiter, nur eigene zugewiesene Anlagen).
- **Mitarbeiter-Verwaltung** (OWNER only): Anlegen mit Temp-Passwort + `mustChangePassword`-Flow, Aktivieren/Deaktivieren mit Session-Invalidation.
- **Anlagen-Zuweisung**: `assignedToUserId` pro CustomerSystem, Auto-Reassign bei Mitarbeiter-Deaktivierung.
- **Techniker-Workload-Page**: Stats-Tiles, gruppierte Anlagen-Liste pro Mitarbeiter, Bulk-Reassign-Modal.
- **Rollenbewusstes Dashboard**: OWNER sieht Company-weit, TECHNICIAN sieht "Meine Woche".
- **Rollenbewusste Wochenübersicht**: Pro User (OWNER → company-wide, TECHNICIAN → eigene Anlagen).

#### Sicherheit & Compliance
- NextAuth v5 (E-Mail/Passwort), bcrypt SALT_ROUNDS=12.
- HTTPS-only via Vercel.
- **Supabase RLS** deny-all auf allen 13 öffentlichen Tabellen — Datenzugriff ausschließlich via Prisma + Service Role Key.
- **Rate Limiting** über Upstash Redis (sliding window, fail-open) auf 10 sensiblen Endpoints + Middleware.
- Storage-Bucket `maintenance-photos` ohne öffentliches Listing.
- **Sentry** für Error-Monitoring.
- DSGVO: Datenminimierung, Zweckbindung, doppelt Opt-In, Recht-auf-Löschen via Account-Delete (Sprint 22).

#### Admin-Panel (interne Plattform-Sicht)
- `/admin` gated by `ADMIN_EMAILS` Env.
- Read-only: User-Liste, User-Detail, EmailLog, CronRun-Monitor.
- **Wichtig:** Das ist ein **Plattform-Admin** für *uns* (Yannik), kein Kunden-Feature.

#### Mobile / UX
- Mobile-first (44 px Touch-Targets, iOS-Auto-Zoom-Fix mit `text-base`).
- Responsive Breakpoints (sm/md/lg/xl).
- PWA-tauglich (Manifest + Icon — installierbar auf Home Screen).
- Click-to-Call & Click-to-Mail durchgängig.
- 324 grüne Tests (Vitest), TypeScript-strict, kein `any`.

### 5.2 Was nicht live ist (für Marketing-Roadmap relevant)

| Feature | Status | Quelle |
|---|---|---|
| CSV/Excel-Import (Tooltime-Migration) | Backlog #25, Medium | BACKLOG.md |
| Drag-and-Drop-Reschedule im Kalender | Backlog #63, Low | BACKLOG.md |
| Wochen-/Tagesansicht im Kalender | Backlog #64, Low | BACKLOG.md |
| Multi-System-Booking (mehrere Anlagen pro Termin) | Backlog #33, Medium | BACKLOG.md |
| **PDF-Arbeitsbericht** (Wartungsprotokoll-Export) | Maybe M-1, vom Pilotkunden gewünscht | BACKLOG.md |
| Native iOS/Android-App | Roadmap 2027 | ursprüngliche Planung |
| **Echte Offline-Fähigkeit** (Service Worker + Sync) | Geplant aber nicht umgesetzt | PROJEKT_DOKUMENTATION (veraltet) |
| Bestellworkflow / OCR-PDF-Import / Hersteller-Kataloge | Wartungsteile Phase B–D, Backlog N-2/N-5/N-9 | BACKLOG.md |

---

## 6. Tech-Stack & Performance (Trust Signals)

> Marketing-relevant nur insoweit es **Vertrauen** und **Compliance** stützt — keine Bachelor-Arbeit auf der Landingpage.

| Layer | Technologie | Marketing-Story |
|---|---|---|
| Framework | Next.js 16 (App Router) + React 19 | Modernste Web-Generation, schnelle Time-to-Interactive |
| Sprache | TypeScript 5 (strict) | Wenig Bugs by design |
| Styling | Tailwind CSS 4 + shadcn/ui | Konsistentes, hochwertiges UI-System |
| Auth | NextAuth v5 + bcrypt (12 rounds) + Sessions | Industriestandard |
| ORM / DB | Prisma 7 / PostgreSQL via Supabase | Relationales, transaktionssicheres Datenmodell |
| Hosting | Vercel (Production + Preview, EU-Region) | Auto-SSL, globales CDN, automatische Deployments |
| DB-Region | Supabase **eu-central-1** (Frankfurt) | DSGVO/Datenresidenz |
| E-Mail | Resend + React Email | Hohe Zustellraten, professionelle Templates |
| Buchung | Cal.com v2 API + Webhook | Selbstbedien-Booking ohne eigenes Kalendersystem |
| Cache/Rate-Limit | Upstash Redis | Skalierbar, fail-open |
| Monitoring | Sentry | Live-Fehler-Erfassung |
| Tests | Vitest, 324 grüne Cases | Qualitätsversprechen |

**Performance (intern verifiziert):**
- First Contentful Paint < 1,5 s
- Time to Interactive < 3,0 s auf 3G
- Lighthouse Score 90+ (Performance)

**Domain & DNS:** `torqr.de` über Cloudflare, SPF/DKIM für `noreply@torqr.de` konfiguriert.

---

## 7. Pricing-Strategie & Angebotsvarianten

### 7.1 Aktueller Zustand

- **Pilotkunde**: Einzelvertrag, **5.000 € einmalig** (2.000 € sofort + 3.000 € nach 6-Monats-Testphase) als "Freundschaftspreis" — **dies ist NICHT das künftige SaaS-Modell**.
- **SaaS-Pricing ist entworfen, aber noch nicht aktiviert** (kein Stripe/Paddle, kein Self-Service-Sign-up, kein Billing-System).

### 7.2 SaaS-Tier-Struktur (Decision D-4)

**Drei Tiers, fixe Preise, klares Gating. Cal.com-Buchungs-Integration in allen Tiers** (Kern-USP — eine Pro-Gate-Schranke würde Solo entwerten).

| Feature / Tier | **Solo €29** | **Professional €49** | **Enterprise €99** |
|---|---|---|---|
| Kundenlimit | bis **50** | bis **150** | **unlimited** |
| Anlagen-Limit | unlimited | unlimited | unlimited |
| Anlagentypen (Heizung/Klima/Wasser/Energiespeicher) | ✅ alle 4 | ✅ alle 4 | ✅ alle 4 |
| Mobile Wartungs-Checkliste | ✅ | ✅ | ✅ |
| Foto-Dokumentation pro Anlage | ✅ | ✅ | ✅ |
| Follow-Up-Jobs | ✅ | ✅ | ✅ |
| **E-Mail-Erinnerungen (Endkunde)** | ✅ | ✅ | ✅ |
| **Cal.com-Buchungs-Integration** | ✅ | ✅ | ✅ |
| **Termine-Page** (Reschedule + Cancel) | ✅ | ✅ | ✅ |
| Wochenübersicht-E-Mail | ✅ | ✅ | ✅ |
| Customizable Reminder-Templates | ✅ | ✅ | ✅ |
| **Multi-User / TECHNICIAN-Rollen** | ❌ Single-User only | ✅ | ✅ |
| **Wartungsteile-Sets + Lager-Modul** | ❌ | ✅ | ✅ |
| Techniker-Workload-Page | n/a | ✅ | ✅ |
| Anlagen-Zuweisung an Mitarbeiter | n/a | ✅ | ✅ |
| Public API | ❌ | ❌ | ✅ |
| Custom-Branding (Logo + Farben in E-Mails) | ❌ | ❌ | ✅ |
| Priority-Support (24-h SLA) | ❌ | ❌ | ✅ |
| Onboarding-Session inklusive | ❌ | 1× 1 h | 1× 2 h |
| Daten-Export (DSGVO Art. 20, Self-Service) | ✅ | ✅ | ✅ |

**Tier-Logik in Marketing-Worten:**
- **Solo (€29) — "Excel raus, Smartphone rein."** Der komplette Kern-Workflow für den Ein-Mann-Betrieb: Kunden, Anlagen, Wartungen, Erinnerungen, Cal.com-Buchungslink, Termine-Page. Was fehlt: Mitarbeiter und Lager.
- **Professional (€49) — "Wachsen ohne Tool-Wechsel."** Sobald der erste Techniker dazukommt oder Wartungsteile zentral gemanagt werden sollen. Multi-User, Rollen, Workload, vollständiges Lager-Modul.
- **Enterprise (€99) — "Eigene Marke, eigene API, eigener Support."** Für Mehr-Standort-Betriebe, White-Label-Partner und alle, die Torqr in eigene Systeme integrieren wollen.

**Add-ons / Upsells (außerhalb der Tiers):**
- Custom-Integration (z. B. Lexoffice/SevDesk): **500–2.000 € einmalig**
- White-Label-Lizenz für Innungen/Verbände: **500 €/Monat pro Partner**
- Zusätzliche Onboarding-Schulung: **200–500 € pro Session**
- DSGVO-Auftragsverarbeitungsvertrag (AVV): **inklusive in allen Tiers**

### 7.3 Trial- & Billing-Modell (Decision D-3)

- **30 Tage Free Trial** für alle Tiers, ohne Kreditkarte. Begründung: Heizungswartung ist saisonal — User braucht Zeit, den Erinnerungs-Effekt überhaupt erleben zu können (4-Wochen-Reminder taktet einmal in den 30 Tagen).
- **Bezahlt-Konversion am Tag 31.** Reminder-E-Mail an Tag 25 + Tag 28 + Tag 30.
- **Annual-Billing-Discount: 2 Monate gratis** bei Jahresabo (= 17 % Rabatt). Standard im Markt, verbessert LTV.
- **Annual zuerst empfehlen** im Pricing-Toggle (Default-Position), Monthly als Sekundär-Option.

### 7.4 Unit Economics (BMC-Annahme, weiterhin gültig)

- **ARPU** (gewichteter Durchschnitt 60/30/10 Solo/Pro/Enterprise): €39/Monat
- **CAC-Korridor**: organisch <€20/Kunde, paid <€100, blended Ziel **<€50**
- **LTV** (€39 × 36 Monate × 95 % Retention): **~€1.330**
- **LTV:CAC Ziel:** >**3:1** (Industrie-Benchmark), realistisch erreichbar **~26:1** bei organisch-dominanter Akquise
- **Break-even bei €39 ARPU:** ~3 Kunden für Hosting, ~30 Kunden für Hosting + €1k/Monat Marketing

### 7.4 Kostenseite (Hosting/Variable)

| Posten | Kosten/Monat (geschätzt) |
|---|---|
| Vercel Pro | €20 |
| Supabase Pro (eu-central-1) | €25 |
| Resend (bis 50k Mails) | €20 |
| Upstash Redis (Marketplace) | <€5 |
| Sentry | €0 (Free Tier) → €26 (Growth) |
| Domain | ~€1 |
| **Fix gesamt** | **€66–92 / Monat** |

**Break-even bei €39 ARPU:** 2–3 zahlende Kunden decken Hosting, ~20–30 decken Hosting + bescheidenes Marketing-Budget.

---

## 8. Wettbewerb & Positioning

> Daten primär aus BMC (Dez 2024) — Marketing-Agent sollte Aktualität validieren.

### 8.1 Direkte Wettbewerber

| Anbieter | Preis/Monat | Stärke | Schwäche | Torqr-Differenzierung |
|---|---|---|---|---|
| **Handwerker-Office** | €30–60 | Etabliert, alle Trades | Komplex, Overkill für Solo | Spezialisiert, schlanker, mobil |
| **meetergo** | €39 | Modernes Scheduling | Kein Wartungsintervall-Fokus | Wartungsspezifische Automation |
| **simpleSystem** | €79 | All-in-One (CRM + Faktura) | Steile Lernkurve, teuer | Macht eine Sache richtig |
| **Excel + Outlook** | €0 | Kostenlos, vertraut | 8h/Woche Verlust, fehleranfällig | Direktes Substitut |

### 8.2 Positioning-Statement (Vorschlag, Marketing kann verfeinern)

> **"Torqr ist die spezialisierte Wartungsmanagement-Plattform für Heizungsbauer, die ihre Wartungssaison aus der Hosentasche steuern wollen — ohne den Komplexitäts- und Kosten-Ballast generischer Handwerker-Software."**

### 8.3 Marktlücken (von Torqr besetzbar)

- **Mobile-first für Solo-Betriebe:** Mitbewerber sind Desktop-zentriert.
- **Wartungsintervall-Spezialisierung:** Mitbewerber sind Allgemein-Scheduling-Tools.
- **DSGVO-Story aus Deutschland:** Internationale Mitbewerber haben US-Cloud-Stack.
- **<€30-Einstieg:** Solo-Tier-Preispunkt unbesetzt.
- **Multi-System-Datenmodell** (Heizung + Klima + Wasser + Energiespeicher in einem System) — Mitbewerber sind meist heizungsspezifisch ODER allgemein, selten "Energietechnik-übergreifend".

---

## 9. Go-to-Market — Kanäle & Hebel

### 9.1 Phasen-Modell (BMC, leicht aktualisiert)

| Phase | Status heute | Ziel | Kanäle |
|---|---|---|---|
| 1. MVP mit Pilot | ✅ läuft | Validierung | direkt 1:1 |
| 2. Beta (5–10 Heizungsbauer) | ⏳ noch nicht gestartet | Multi-User-Validierung, Testimonials | Referrals aus Pilotkunden-Netzwerk |
| 3. SaaS-Launch | 🔲 offen — wartet auf Marketing | erste 50 zahlende Kunden | SEO, Innungs-Outbound, Paid |
| 4. Skalierung | 🔲 2027 | 200–300 Kunden, andere Trades | Partnerschaften, White-Label |

**Sofortige Marketing-Engpässe (zu lösen):**
- Es gibt **keine öffentliche Landingpage** — `torqr.de` zeigt direkt das Login.
- Es gibt **keinen Self-Service-Signup** — Kunden müssen manuell angelegt werden.
- Es gibt **kein Billing-System** — Stripe/Paddle-Integration steht aus.
- Es gibt **keine Sales-Materialien** (Pitchdeck, One-Pager, Case Study).

### 9.2 Kanäle (Empfehlung)

**Organisch (Priorität hoch):**
- **SEO-Targeting:** "Wartungsplaner Heizungsbauer", "Heizungswartung Software", "Handwerker Wartung App", "Wartungsintervalle digital". Long-tail-Strategie statt Konkurrenz um generische Begriffe.
- **Content-Marketing-Themen:**
  - "Heizungswartung-Pflicht: Was Sie 2026 wissen müssen" (Linkbait)
  - "Wartungsintervalle nach Gerätetyp: Übersicht"
  - "DSGVO-konforme Kundenkommunikation für Heizungsbauer"
  - "Excel vs. Wartungssoftware: ROI-Rechner"
- **Free Tools (Lead-Magneten):** Wartungsintervall-Rechner, Vorlagen-Download (Wartungsprotokoll-PDF, Kundenkartei-Excel-Template).

**Partnerschaften (Priorität mittel):**
- **Innungen / Handwerkskammern**: Co-Marketing, Mitglieder-Rabatt.
- **Hersteller-Pro-Programme** (Bosch Pro, Vaillant, Viessmann): Distribution über Partner-Newsletter. Bonus: Im Datenmodell sind Hersteller-Kataloge bereits explizit ein zukünftiges Integrations-Thema (Backlog N-9).
- **Buchhaltungs-Tools** (Lexoffice, SevDesk): Integration als Verkaufs-Hebel.

**Paid (Priorität niedrig zu Beginn):**
- Google Ads (Budget-Korridor €500–1.000/Monat) — erst, wenn organisch validiert.
- Facebook/Instagram-Targeting auf "Handwerk-Selbständige Deutschland".

**Community:**
- Handwerk-Foren (myhammer, Handwerker-Treff, Reddit r/handwerk).
- LinkedIn organischer Content (Yannik als technischer Macher, Pilotkunde als Kronzeuge).

### 9.3 Trust-Signal-Bausteine (für Landingpage)

- **DSGVO-Logo + EU-Hosting-Zeile**: "Daten in Frankfurt, eu-central-1".
- **Pilotkunden-Testimonial** (sobald Freigabe vorliegt): kurzes Zitat + Foto-Wand.
- **Live-Stats** (vorsichtig): "Verwaltete Wartungen", "Verschickte Erinnerungen" — sobald Zahlen relevant sind.
- **Tech-Trust:** "Hosting Vercel · Datenbank Supabase EU · E-Mail Resend" — als kleine Logo-Reihe.
- **Sicherheits-Story:** Bcrypt, Rate Limiting, RLS, Sentry — knapp gehalten, vermutlich Sub-Page "Sicherheit".

---

## 10. Compliance & Recht (für Marketing-Texte zu beachten)

> Vollständige juristische Grundlage: [`docs/archive/agent-04-gdpr-compliance-framework.md`](../archive/agent-04-gdpr-compliance-framework.md)

- **Verantwortlicher (Art. 4 Nr. 7 DSGVO):** der jeweilige Heizungsbau-Betrieb (Kunde von Torqr).
- **Auftragsverarbeiter:** Torqr-Plattform (Yannik Dorth als Anbieter). **Auftragsverarbeitungsvertrag (AVV/Art. 28)** muss Bestandteil des Onboardings werden — Marketing-Texte dürfen das nicht versprechen, ohne dass die Vertragsvorlage steht.
- **Rechtsgrundlagen:**
  - Vertrags-Erfüllung (Art. 6(1)(b)): Kontaktdaten, Wartungs-Historie.
  - Einwilligung (Art. 6(1)(a)): E-Mail-Erinnerungen → **doppelt opt-in zwingend** (UWG §7).
- **Marketing-Disclaimer-Hygiene:** Datenschutzerklärung, Impressum, Cookie-Banner (sofern Tracking) müssen vor Launch stehen — derzeit existieren keine öffentlichen Marketing-Seiten, also auch keine dieser Pflicht-Seiten.
- **Marketing-Emails an Endkunden** (Inhaber-zu-Inhaber, B2B-Akquise): UWG §7 Abs. 2 Nr. 2 — Werbe-Emails an Gewerbe nur mit Einwilligung oder bei mutmaßlichem Interesse aus konkretem Anlass. Cold-E-Mail-Akquise = riskant; **LinkedIn-Outreach + organische Kanäle bevorzugen**.
- **Aufbewahrungsfristen** für Wartungsprotokolle: bis zu 10 Jahre (BGB §195/199 Produkthaftung) — Werbe-Aussage "Lückenlose Doku" ist haltbar, "Sie löschen alles auf Knopfdruck" wäre missverständlich.

---

## 11. Inhalte, die der Marketing-Agent direkt verwenden kann

### 11.1 Headline-Optionen

**Hauptkandidat (Decision D-2):** *"Die Wartungsakte für Heizungsbauer."* — pragmatisch-funktional, sofort verständlich, kein Hype, passt zur Zielgruppen-Tonalität. **Validierung mit Pilotkunden + 3 Kollegen offen** (Backlog #80).

**Backup-Kandidaten** (für A/B-Testing oder unterschiedliche Kanäle):

- "Aus Excel raus. In die Hosentasche rein." — Pain-killer-Tonalität, gut für Paid-Ads.
- "Nie wieder vergessene Wartung." — fokussiert auf den schärfsten Schmerzpunkt.
- "6 Stunden pro Woche zurück." — quantifiziert, gut für ROI-getriebene Argumentation.
- "Termine. Anlagen. Teile. In einer App." — feature-summarisch, gut für Innungs-/Fach-Kontext.

**Nicht verwenden** (Anti-Tonalität): "Revolutioniere deine Wartung", "Game-changer", "AI-powered", "next generation".

### 11.2 Sub-Headlines / Lead-Texte

- *"Torqr ersetzt deine Excel-Liste durch ein System, das deine Kunden selbst an die Wartung erinnert. DSGVO-konform, mobile-first, made in Germany."*
- *"50 Kunden, 70 Anlagen, eine Wartungssaison — ohne Zettelwirtschaft. Torqr verwaltet Termine, Erinnerungen und Materialbedarf für Heizungsbau-Betriebe."*

### 11.3 Feature-Bullet-Set (kompakt für Hero / One-Pager)

- ⚡ **30-Sekunden-Wartung** vor der Therme (Mobile Checklist + Foto)
- 📅 **Cal.com-Buchungs-Link** in jeder Erinnerungsmail — der Kunde bucht selbst
- 📦 **Mindestbestand-Alarm** für Wartungsteile, automatische Lagerbuchung
- 👥 **Multi-User mit Rollen**, Mitarbeiter-Zuweisung, Workload-Übersicht
- 🇪🇺 **DSGVO-konformer EU-Stack**: Frankfurt-Region, Resend, doppelt Opt-In
- 🔌 **Multi-System**: Heizung, Klima, Wasseraufbereitung, Energiespeicher
- 📱 **Mobile-first PWA** — installierbar wie eine App, ohne Store

(Hinweis: Emojis in Marketing-Material erlaubt. In Produkt-UI/E-Mails sparsamer.)

### 11.4 Quantifizierte Beweis-Aussagen

- "**6 Stunden pro Woche** weniger Verwaltungsaufwand."
- "**ROI > 25×** im ersten Jahr (Solo-Tier)."
- "**904 Hersteller/Modell-Kombinationen** vorgepflegt."
- "**324 automatisierte Tests** — wir testen, bevor du es merkst."
- "Hosting **eu-central-1 (Frankfurt)** — keine Daten in Drittländern."

### 11.5 FAQ-Skelett (zu erweitern)

1. *Brauche ich eine eigene Cal.com-Lizenz?* — Aktuell ja (Pilot-Setup). Ein Multi-Tenant-Cal.com-Konzept ist im Backlog (#51).
2. *Funktioniert Torqr offline auf der Baustelle?* — Eingeschränkt (PWA-Cache). Echte Offline-Sync ist auf der Roadmap.
3. *Kann ich meine Excel-Kundenliste importieren?* — Geplant (Backlog #25), aktuell manuelle Anlage.
4. *Was passiert mit meinen Daten, wenn ich kündige?* — Vollständiger Daten-Export ist DSGVO-Pflicht (Art. 20). Aktuell technisch via DB-Dump möglich, Self-Service-Export im Backlog.
5. *Welche Heizungstypen werden unterstützt?* — Alle gängigen: Gas, Öl, Wärmepumpe (Luft/Erde/Wasser), Pellet, Hybrid, BHKW, Fernwärme. Plus Klima, Warmwasseraufbereitung, Energiespeicher.

### 11.6 Pilotkunden-Testimonial-Briefing (zur Einholung)

**Verwendungs-Standard (Decision D-7):** Pilotkunden-Aussagen werden **anonymisiert** verwendet (Branche + Betriebsgröße + Zitat, **kein Name, kein Foto**). Volle Namens-/Bildfreigabe nur, wenn der Pilotkunde explizit schriftlich zustimmt — dann als Premium-Asset einsetzen, nicht als Standard.

**Beispiel-Format (anonymisiert):**

> *"Seit Torqr ruft mich kein Kunde mehr an, weil seine Wartung vergessen wurde — die App macht das selbst."*
> — Heizungsbau-Betrieb (Ein-Personen, Norddeutschland)

Sobald der Pilotkunde Feedback nach 6 Monaten gibt, sollen folgende drei Punkte abgefragt werden — als O-Ton-Material für die Landingpage:

1. *"Wieviel Zeit hat dir Torqr in der letzten Wartungssaison gespart — geschätzt?"*
2. *"Was war der Moment, an dem du gemerkt hast, dass Excel zurück nicht mehr geht?"*
3. *"Würdest du es einem Kollegen empfehlen — und warum?"*

**Freigabe-Vermerk** zwingend einholen (E-Mail genügt): *"Ich erlaube die Verwendung des obigen Zitats in anonymisierter Form (Branche + Betriebsgröße + Region) für Marketing-Zwecke von Torqr."*

---

## 12. Offene Marketing-Topics (Backlog für den Agent)

Diese Liste ist nicht-exhaustiv und soll vom Marketing-Agent in eine eigene Roadmap überführt werden. Parallel werden die wichtigsten als Backlog-Items in [`docs/BACKLOG.md`](../BACKLOG.md) eingetragen (siehe §13).

### 12.1 Kreativ / Content
1. **Landingpage `torqr.de`** vollständig konzipieren + bauen (heute: nur Login).
2. **Pricing-Seite** mit klar abgegrenzten Tiers (Solo / Professional / Enterprise).
3. **One-Pager / Pitchdeck** für Innungs-Termine.
4. **Demo-Video** (90 Sekunden, Smartphone-Hand-Recording).
5. **Drei Blog-Cornerstone-Artikel** (SEO-Anker).
6. **Case Study** mit Pilotkunden (nach 6 Monaten Daten).
7. **Email-Drip-Onboarding-Strecke** für Self-Service-Signups (sobald Signup live ist).

### 12.2 Operativ / Tooling
8. **Stripe oder Paddle** als Billing-System einrichten (Tier-Kalibrierung).
9. **Self-Service-Signup-Flow** (Free Trial → Tier-Wahl → Onboarding).
10. **Datenschutzerklärung + Impressum + Cookie-Banner** für `torqr.de`.
11. **AVV-Vertragsvorlage** (Art. 28 DSGVO) als Download.
12. **Analytics** einrichten (Plausible oder Vercel Analytics + Posthog) — DSGVO-konform.
13. **CRM-Light** für Lead-Management (Outbound-Tracking, Innungen, Pilotkunden-Funnel).

### 12.3 Brand / Identity
14. **Wordmark-Variationen** (horizontal, vertikal, monochrom).
15. **Social-Media-Asset-Pack** (LinkedIn, Instagram, Facebook).
16. **Pitch-Slides-Template** im Brand-Stil.
17. **Tagline finalisieren** — aktuell offen.
18. **Mailing-Templates** für B2B-Outbound (an Innungen, Verbände).

### 12.4 Strategisch — Status

**Bereits entschieden (siehe §0.5 Decisions Log):**
- ✅ Markenname → **Torqr** (D-1)
- ✅ Trial-Modell → **30 Tage Free Trial** (D-3)
- ✅ Tier-Gating → siehe §7.2 (D-4)
- ✅ Zielregion → **nur Deutschland** (D-5)
- ✅ Anrede → **"Du" Marketing / "Sie" Endkunden** (D-6)
- ✅ Pilotkunden-Story → **anonymisiert als Standard** (D-7)
- ✅ Tagline-Hauptkandidat → *"Die Wartungsakte für Heizungsbauer."* (D-2, Validierung offen)

**Weiterhin zu klären (Empfehlung des Marketing-Agents erwünscht):**
1. **White-Label-Strategie:** offensiv Innungen ansprechen oder defensiv on-demand? (Backlog #83)
2. **Internationalisierung-Trigger:** Bei welchem MRR/Kunden-Stand starten wir Englisch-Version? Frühestens 2027.
3. **Marketing-Agent-Mandat (D-8 bewusst offen):** Im Erstgespräch mit dem Agent klären — Tendenz: Konzepte + Designs + Texte + ggf. Code-Beiträge.

---

## 13. Quellen-Index

### 13.1 Aktive (= verlässliche) Quellen

| Pfad | Inhalt | Gültigkeit |
|---|---|---|
| [`docs/BACKLOG.md`](../BACKLOG.md) | Single source of truth für Features (offen + abgeschlossen, alle 28 Sprints) | **aktuell** |
| [`docs/EMAIL-SYSTEM.md`](../EMAIL-SYSTEM.md) | Email-Architektur, Cron-Jobs, Templates, Opt-In-Flow | aktuell (Sprint 19) |
| [`docs/brand_spec/BRAND_SPEC.md`](../brand_spec/BRAND_SPEC.md) | Logo, Farben, Typografie, Komponenten | aktuell |
| [`docs/development/TIMESHEET.md`](../development/TIMESHEET.md) | MVP-Aufwands- & Wertberechnung (Solo-Dev-Äquivalenz) | aktuell |
| [`prisma/schema.prisma`](../../prisma/schema.prisma) | Datenmodell-Wahrheit | **aktuell** |
| [`src/lib/email/templates/`](../../src/lib/email/templates/) | React-Email-Templates (Reminder, BookingConfirmation, BookingReschedule, BookingCancellation, WeeklySummary) | aktuell |
| [`docs/operations/sprint-28-rollback-plan.md`](../operations/sprint-28-rollback-plan.md) | Frischeste Operations-/Rollback-Story für Trust-Signal-Argumentation | aktuell |

### 13.2 Sekundär nutzbar (mit Vorsicht)

| Pfad | Inhalt | Achtung |
|---|---|---|
| [`docs/business/PROJEKT_DOKUMENTATION.md`](../business/PROJEKT_DOKUMENTATION.md) | Funktionsübersicht für Pilotkunden | **Stand Jan 2026 — bezieht sich auf altes Heater-Modell, Email als "Phase 7 Q1 2026 geplant" obwohl seit April live**. Nur als historisches Pilot-Onboarding-Dokument zu lesen. Banner ergänzt. |
| [`docs/business/KOSTENAUFSTELLUNG_TORQR.md`](../business/KOSTENAUFSTELLUNG_TORQR.md) | Pilotkunden-Preiskalkulation (5.000 €) | Nur **internes Dokument** für Pilotkunden-Vertrag — **nicht das SaaS-Pricing**. |
| [`docs/archive/agent-01-business-model-canvas.md`](../archive/agent-01-business-model-canvas.md) | Vollständiger BMC | Stand Dez 2024. TAM/Persona/Wettbewerb-Daten gültig. Roadmap-Daten teilweise überholt — Multi-User & Email sind heute live. |
| [`docs/archive/agent-01-mvp-scope-definition.md`](../archive/agent-01-mvp-scope-definition.md) | MoSCoW-Feature-Matrix MVP | Stand Dez 2024. Großteil der "MUST" + "SHOULD" sind heute live. Nützlich als Historien-Referenz. |
| [`docs/archive/agent-04-gdpr-compliance-framework.md`](../archive/agent-04-gdpr-compliance-framework.md) | GDPR-Framework | Stand Dez 2024. Rechtliche Inhalte gültig; AVV-Vorlage muss noch konkret erstellt werden. |
| [`docs/architecture/ARCHITECTURE.md`](../architecture/ARCHITECTURE.md) | React-Query- & Component-Architektur | Stand Jan 2026 — Multi-Tenant-Architektur (Sprint 23+) fehlt. Für Marketing irrelevant; für techn. Tiefe siehe `docs/superpowers/specs/`. |

### 13.3 Veraltet — nicht für Marketing verwenden

- `docs/archive/PROJECT-STATE-2026-01-13.md`
- `docs/archive/CURRENT-STATUS-2026-01-13.md`
- `docs/archive/DEVELOPMENT-PROGRESS.md`
- `docs/archive/PRESENTATION-CHECKLIST-2026-01-14.md`
- `docs/archive/MAX_DEMO_PLAN.md`

Diese Dokumente sind Snapshots aus der Pilot-Anbahnung (Januar 2026) und beschreiben einen Produktstand, den es so nicht mehr gibt (Heater statt CustomerSystem, kein Multi-User, kein Wartungsteile-Modul).

---

## 14. Kurz-Briefing (Copy-Paste-fähig für den Agent)

> *"Du übernimmst das Marketing für Torqr (torqr.de) — eine in Deutschland gehostete SaaS-Plattform für Heizungsbau-Betriebe, mit der Wartungstermine, Anlagen, Mitarbeiter und Materialverbrauch in einer mobilen Web-App gemanagt werden. Die Software ist Production-ready, hat einen aktiven Pilotkunden, aber noch keine Landingpage und keinen Self-Service-Signup.*
>
> *Bereits entschieden (nicht aufmachen): Markenname Torqr, Tagline-Hauptkandidat 'Die Wartungsakte für Heizungsbauer.', 30-Tage-Free-Trial, drei Tiers Solo €29 / Professional €49 / Enterprise €99 mit fixem Feature-Gating (Multi-User + Wartungsteile-Lager ab Pro, API + Custom-Branding ab Enterprise, Cal.com-Buchung in allen Tiers), nur Deutschland, Anrede 'Du' im Marketing und 'Sie' in Endkunden-Mails, Pilotkunden-Zitate anonymisiert.*
>
> *Erste Aufgabe: Konzept und Bau einer Landingpage `torqr.de` mit Hero, Feature-Sektion, Pricing-Tiers, Trust-Signalen (DSGVO, EU-Hosting Frankfurt, Multi-User-Rollen), FAQ, und einem klaren CTA für die Beta-Phase.*
>
> *Ton: sachlich-technisch, deutsch, kein Tech-Hype, keine Anglizismen wenn vermeidbar.*
>
> *Vollständiges Briefing inkl. Brand-System, Feature-Stand 2026-04-28, Wettbewerb, Decisions Log, offene Topics: docs/marketing/MARKETING_BRIEFING.md.*
>
> *Backlog der konkreten Marketing-Tasks (#67–#86): docs/BACKLOG.md → Sektion 'Marketing & Go-to-Market'."*

---

## 15. Versions- & Pflege-Hinweise

- **Dieses Dokument** ist die **einzige** für Marketing maßgebliche Quelle.
- Bei Feature-Releases (= jeder Merge nach `main`, der Marketing-relevante Funktionalität verändert): §5 aktualisieren.
- Bei Pricing- / Tier-Änderungen: §7 aktualisieren.
- Bei Brand-Änderungen: §2 aus `docs/brand_spec/BRAND_SPEC.md` resyncen.
- Bei neuen offenen Marketing-Tasks: §12 ergänzen + Backlog-Item in `docs/BACKLOG.md` § "Marketing & Go-to-Market" anlegen.

---

*Erstellt: 2026-04-28 · Pflegender: Yannik Dorth · Co-Authored-By: Claude Opus 4.7*
