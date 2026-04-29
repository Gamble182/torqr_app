# Public Landing Page — Design Spec

**Date:** 2026-04-29
**Feature:** Öffentliche Marketing-Landingpage für `torqr.de`
**Phase:** V1 (Pre-Launch · Beta-Phase · noch ohne Stripe / Self-Service-Signup)
**Author:** Brainstorming-Session 2026-04-29
**Reference:** `docs/marketing/MARKETING_BRIEFING.md` (Stand 2026-04-28)

---

## Scope Declaration

V1 liefert eine **vollständige öffentliche Single-Page-Landingpage** unter `torqr.de/`, ersetzt den bestehenden Login-Redirect-Placeholder in `src/app/page.tsx`, baut zwei Lead-Capture-Formulare (Beta-Liste + Demo-Anfrage) mit eigener Persistenz und Resend-Notifizierung, und stellt die rechtlich verpflichtenden Sub-Seiten **Datenschutz** und **Impressum** bereit. Visueller Stil ist **Variante A (Industrie-Tech-Cleane) mit B-Touches** (Handwerk-Wärme über "Kennst du das?"-Pain-Block und "Du"-Tonalität).

**Explicit non-goals for V1** (V2-Backlog am Ende):

- Kein Stripe / Self-Service-Signup-Flow
- Keine AGB (mangels Self-Service-Sale-Flow nicht erforderlich; kommt mit Stripe in V2)
- Kein Cal.com auf der Public-Page (Vendor-Strategie offen — mögliche Eigenentwicklung)
- Keine Wartungsteile-Sektion (Marketing-Reife noch nicht entschieden)
- Keine Pilot-Testimonial-Quote (echtes Zitat erst nach 6-Monats-Pilot-Feedback ≈ Juli 2026)
- Kein ROI-Rechner-Tool als eigene Page (Phase-2-Lead-Magnet)
- Kein Demo-Video (V1: animiertes GIF im Hero)
- Keine Wettbewerbsvergleichs-Seite `/vergleich`
- Keine Tag-Manager / Plausible / Posthog Analytics-Integration
- Kein Multi-Language (Deutschland-only laut Briefing-Decision D-5)
- Kein Yannik-Namensnennung außer im rechtlich erforderlichen Impressum
- Keine Anpassung der bestehenden App-Routes (`/dashboard/*`, `/login`, `/register`, `/api/*` bleiben unverändert)

---

## Decision Record

Foundational decisions from the brainstorming session, in order:

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Page-Anatomie: Standard (10 Sektionen)** | Lean (7) wäre zu dünn für Stakeholder-Showpiece. Comprehensive (13+) wäre Phase-2 nach Validierung. Standard balanciert Conversion-Strecke (Pain → Solution → Proof) mit Substanz-Tiefe. |
| 2 | **Hero-Frame: Pain-Killer mit D-2-Tagline-Strip** | Headline "Aus Excel raus. In die Hosentasche rein." holt cold visitor sofort ab. D-2 ("Die Wartungsakte für Heizungsbauer.") als kleiner Tagline-Strip oberhalb anchored die Brand. |
| 3 | **Hero-Visual: Phone + Desktop (Multi-Device-Showpiece)** | Apple-Frame-Smartphone mit Wartungs-Checklist-GIF + Desktop-Browser-Frame mit Dashboard-Übersicht. Stakeholder sieht "echtes Multi-Device-Produkt". |
| 4 | **Pain-Block-Auswahl: A · B · E** (Excel-Chaos · vergessene Termine · Foto-Verlust) | User-Wahl gegen die Standard-Triade. Schiebt Positionierung Richtung "das System, das alles an einem Ort hält" statt "schneller buchen". |
| 5 | **3-Step-Lösung: "Alles an einem Ort · Automatisch erinnert · Mobil dokumentiert"** | Direkt mapping zu Pains A·B·E. Neutrale Verb-Form passend zur Tonalität. |
| 6 | **Feature-Sektion: 4 Features in der Reihenfolge** Mobile Wartungs-Checklist → Foto-Doku → Multi-System → Multi-User | Mobile-First-USP zuerst (universell für Solo), Foto-Doku als Pain-E-Lösung, Multi-System als Substanz-Tiefe, Multi-User als Pro-Tier-Story für Stakeholder. |
| 7 | **Cal.com komplett von der Public-Page entfernt** | User-Decision: Vendor-Strategie offen, mögliche Eigenentwicklung. Marketing-Versprechen werden provider-agnostisch formuliert ("Online-Termin-Buchung", "mit einem Klick gebucht"). |
| 8 | **Wartungsteile komplett von der Public-Page entfernt** | User-Decision: Marketing-Reife noch nicht entschieden. Pro-Tier rechtfertigt sich allein über Multi-User (B2B-marktkonform). |
| 9 | **ROI-Block: 3 Stat-Tiles + Sub-Block + Disclaimer + Phase-2-CTA** | Quantifiziert ohne rechtliche Risiken (Disclaimer kennzeichnet ø-Werte). Inline-CTA auf `/roi-rechner` zunächst ausgeblendet (Tool selbst ist Phase 2). |
| 10 | **Pilot-Programm-Status statt Pilot-Testimonial** | Echtes Zitat erst nach Pilot-6-Monats-Feedback. Honest "wir entwickeln gemeinsam mit Pilotbetrieb"-Block + 3 Substanz-Stats (1 Pilot · 28 Sprints · 324 Tests) signalisiert "early but real". |
| 11 | **Trust-Block: 4 Cards + dezenter Tech-Stack-Logo-Strip** | Vercel/Supabase/Resend sind Infrastruktur (kein User-Lock-in wie Cal.com). DE-SaaS-Standard-Trust-Pattern. AVV-Badge erst in V2 wenn AVV-Vorlage existiert. |
| 12 | **Pricing: 3-up Cards mit Annual-Toggle** | Branchen-Standard, mobile-tauglicher als Vergleichstabelle. Annual-Default (17 % Rabatt = 2 Monate gratis) verbessert LTV. |
| 13 | **CTA-Differenzierung: Solo+Pro → Beta-Liste, Enterprise → Demo-Anfrage** | Solo/Pro werden später Self-Service, Enterprise ist immer Sales-Touch. Differenzierte Form-Targets (zwei Forms, zwei DB-Tabellen). |
| 14 | **Eigenbau-Demo-Form, kein Cal.com / Tally / Typeform** | Konsistent mit "keine 3rd-Party-Vendor-Anzeige". POST → eigene Prisma-Tabelle → Resend-Mail an Yannik. |
| 15 | **FAQ: 6 Fragen (V1-Inhalte unverfeinert)** | Antwort-Verfeinerung als V2 nach echten Beta-User-Fragen. V1 deckt Trial/Multi-System/Excel-Import/Daten-Export/Offline/Mitarbeiter-Skalierung ab. |
| 16 | **Footer: 4 Spalten · Yannik-Name nur im Impressum** | User-Decision: alle CTAs / Copy-Texte ohne Personennamen. "Demo buchen" statt "Demo mit Yannik buchen". Copyright "© 2026 Torqr". |
| 17 | **Datenschutz + Impressum als Pre-Launch-Pflicht-Tasks** | DSGVO Art. 13 + §5 TMG sind harte rechtliche Vorgaben ab dem Moment, wo die Page öffentlich ist und Beta-Liste E-Mail-Adressen sammelt. AGB nicht erforderlich (kein Self-Service-Sale). |
| 18 | **Architektur: Option 1 — Marketing direkt in `src/app/page.tsx` + Co-Files** | Kein Monorepo-Split. `src/app/page.tsx` rendert Marketing-Page-Komponenten aus `src/components/marketing/`. `/datenschutz` + `/impressum` als eigene Routen. Middleware unverändert. |

---

## Page Anatomy

10 Sektionen in Lese-Reihenfolge. Jede Sektion ist ein eigener Server-Component unter `src/components/marketing/`.

| # | Section | Component | Anchor |
|---|---|---|---|
| 1 | Header (sticky) | `MarketingHeader` | — |
| 2 | Hero | `Hero` | `#hero` |
| 3 | Pain-Block "Kennst du das?" | `PainBlock` | `#pain` |
| 4 | 3-Step "Mit Torqr läuft das so" | `ThreeStepSolution` | `#how` |
| 5 | Feature-Sektion (4 alternierende Features) | `FeatureSection` | `#features` |
| 6 | ROI-Block | `RoiBlock` | `#roi` |
| 7 | Pilot-Programm-Status | `PilotStatus` | `#pilot` |
| 8 | Trust-Block | `TrustBlock` | `#trust` |
| 9 | Pricing | `Pricing` | `#pricing` |
| 10 | FAQ | `Faq` | `#faq` |
| 11 | Final-CTA | `FinalCta` | `#cta` |
| 12 | Footer | `MarketingFooter` | — |

---

## Per-Section Detail

### 1. Header (sticky)

| Element | Inhalt / Verhalten |
|---|---|
| Container | `fixed top-0`, `z-50`, `bg-background/80`, `backdrop-blur-lg`, `border-b border-border/50` |
| Brand | `<TorqrWordmark size="sm" theme="light" showTagline={false} />` (links) |
| Nav-Links | Features (`#features`) · Preise (`#pricing`) · FAQ (`#faq`) — nur Desktop, Mobile via Hamburger |
| Buttons | "Anmelden" (`/login`, ghost-variant) · "30 Tage testen" (Beta-Liste-Form-Sprung zu `#cta`, primary-variant) |
| Mobile | `<MobileNavSheet>` (shadcn Sheet) mit Nav-Links + CTAs |

### 2. Hero

| Element | Inhalt |
|---|---|
| Layout | Zweispaltig auf Desktop (`lg:grid-cols-2`), gestapelt auf Mobile |
| Tagline-Strip (oben links) | `▰ DIE WARTUNGSAKTE FÜR HEIZUNGSBAUER` (uppercase, brand-grün, letterspacing-1.5px) |
| Headline | `Aus Excel raus.<br/>In die <span className="text-brand">Hosentasche</span> rein.` (4xl/5xl/6xl responsive) |
| Sub-Headline | "Torqr digitalisiert deine Wartungsplanung — automatische Kunden-Erinnerungen, mobile Vor-Ort-Dokumentation, alle Daten zentral statt verstreut auf Excel und Outlook." |
| Primary-CTA | **"30 Tage testen →"** scrollt zu `#cta` (Final-CTA-Block, der beide Forms inline enthält — Tab "Beta-Liste" preselected) |
| Secondary-CTA | **"Demo buchen"** scrollt zu `#cta` (Tab "Demo-Anfrage" preselected via URL-Hash `#cta-demo`) |
| Sub-Disclaimer | "Keine Kreditkarte · jederzeit kündbar · DSGVO-konform" (kleine Schrift unter Buttons) |
| Visual (rechts) | `HeroVisual`-Komponente: Desktop-Browser-Frame mit Dashboard-Screenshot + überlappendem Apple-Phone-Frame mit Wartungs-Checklist-GIF |

**Hero-Visual-Asset-Ordner:** `public/marketing/hero/`
- `dashboard-desktop.png` — Desktop-Screenshot (Dashboard-Übersicht ohne Cal.com-Termine)
- `wartungs-checklist.gif` — Phone-GIF (3-Step-Wizard-Loop, ~3 s)

### 3. Pain-Block "Kennst du das?"

| Element | Inhalt |
|---|---|
| Sektion-Headline | "Kennst du das?" |
| Sub | "Drei Probleme, die in jedem Heizungsbau-Betrieb wiederkehren — und die Torqr beim Wegräumen hilft." |
| Pain 1 (Card A) | **"Die Excel-Liste vom letzten Jahr — wer pflegt die noch?"** · "Kunden-Adressen, Anlagen, Wartungsdaten in 4 Dateien verteilt, jede mit anderem Stand." |
| Pain 2 (Card B) | **"Wieder ein Anruf, weil die Wartung vergessen wurde."** · "5 % der Termine rutschen durch — und es ist immer der Kunde, der erinnert." |
| Pain 3 (Card E) | **"Wo ist das Foto der Anlage von 2024?"** · "Wartungs-Doku verstreut zwischen WhatsApp, Galerie und Notizen." |
| Layout | 3-up Grid auf Desktop, gestapelt auf Mobile |
| Visual-Treatment | Cards mit hellem Border, dezenter Pain-Indikator (z.B. ⚠ in `#EF9F27`) links oben |

### 4. 3-Step "Mit Torqr läuft das so"

| Step | Headline | Sub | Löst |
|---|---|---|---|
| 1 | **Alles an einem Ort** | "Kunden, Anlagen, Wartungshistorie und Fotos im selben System — mobil und Desktop." | Pain A |
| 2 | **Automatisch erinnert** | "Deine Kunden bekommen 4 Wochen + 1 Woche vor jedem Termin eine Mail. Der Wartungstermin ist mit einem Klick gebucht — ohne Telefon-Pingpong." | Pain B |
| 3 | **Mobil dokumentiert** | "3-Step-Wartungs-Checklist mit Fotos und Notizen, direkt vor Ort am Smartphone. Historie bleibt unveränderlich." | Pain E |

**Visual-Treatment:** 3-up-Layout, jeder Step mit Icon (Lucide: `DatabaseIcon`, `BellRingIcon`, `SmartphoneIcon`), Step-Nummer als großes Bernstein-Numeral (`#EF9F27`).

### 5. Feature-Sektion (alternierend)

4 Feature-Blöcke, alternierend Text-rechts/links. Jeder Block: Eyebrow-Label + Headline + 2-3-Satz-Beschreibung + 2-3 Detail-Bullets + Screenshot/GIF.

| # | Feature-Headline | Eyebrow | Visual |
|---|---|---|---|
| 1 | **Wartung in 30 Sekunden — vor dem Gerät.** | MOBILE WARTUNGS-CHECKLIST | `public/marketing/features/checklist-mobile.gif` (Phone-GIF, 3-Step-Wizard) |
| 2 | **Lückenlose Foto-Doku pro Anlage.** | FOTO-DOKUMENTATION | `public/marketing/features/photo-doku-desktop.png` (Anlagen-Detail mit Lightbox-Galerie) |
| 3 | **Heizung, Klima, Wasser, Energiespeicher — eine App.** | MULTI-SYSTEM & 904 GERÄTE-KATALOG | `public/marketing/features/multisystem-desktop.png` (Anlagen-Liste mit Filter-Chips) |
| 4 | **Mit Mitarbeitern wachsen, ohne System zu wechseln.** | MULTI-USER & WORKLOAD | `public/marketing/features/workload-desktop.png` (Workload-Page mit Stats-Tiles) |

**Detail-Bullets pro Feature** (zu schreiben in der Implementierung — Vorlage):

- Feature 1 (Mobile Checklist): "3-Step-Modal: Checkliste · Notizen+Fotos · Bestätigen" · "Pro Anlagentyp vorgegebene Default-Items, anpassbar" · "Immutable JSON-Snapshot pro Wartung"
- Feature 2 (Foto-Doku): "Bis zu 5 Fotos pro Anlage, JPEG/PNG/WebP" · "Lightbox-Galerie zum Durchblättern" · "Pro Wartung historische Fotos bleiben unveränderlich erhalten"
- Feature 3 (Multi-System): "4 Anlagentypen mit eigenem Katalog" · "904 Hersteller- und Modell-Einträge vorgepflegt" · "Eigene Geräte jederzeit ergänzbar"
- Feature 4 (Multi-User): "OWNER- und TECHNICIAN-Rollen" · "Anlagen-Zuweisung pro Mitarbeiter" · "Workload-Page mit Stats-Tiles und Bulk-Reassign"

### 6. ROI-Block

| Element | Inhalt |
|---|---|
| Sektion-Headline | "Was Torqr dir zurückgibt." |
| 3 Stat-Tiles | ⏱ **6 h pro Woche zurück** ("Weniger Excel, weniger Telefon, mehr Werkstatt-Zeit") · 💶 **~12.000 €/Jahr Zeit-Wert** ("Bei 40 €/h Stundensatz · 48 Arbeitswochen") · 🛡 **~5 % weniger Kundenabwanderung** ("Vergessene Wartungen kosten Kunden — Torqr fängt sie automatisch ab") |
| Sub-Block "Was bedeutet das in einem Jahr?" | "Bei 50 Wartungsverträgen und €348/Jahr Solo-Tier: **ROI-Faktor ~35×**. Break-even nach knapp **zwei Wochen**. Die ersten 30 Tage sind kostenlos — du gehst kein Risiko ein." |
| Disclaimer (klein, kursiv) | "ø-Werte für Solo-Betriebe mit ~50 Wartungsverträgen. Basis: Business-Model-Canvas-Berechnung 2024, validiert mit Pilotkunden-Daten." |
| Inline-CTA (V1 ausgeblendet, V2 aktivieren) | "Rechne deinen eigenen ROI → /roi-rechner" — in V1 als `<!-- TODO V2 -->`-Kommentar im Code |

### 7. Pilot-Programm-Status

| Element | Inhalt |
|---|---|
| Sektion-Headline | "Aktuell in der Beta-Phase." |
| Body-Text | "Wir entwickeln Torqr gemeinsam mit einem aktiven Pilotbetrieb. Die ersten Beta-Plätze sind verfügbar — wir nehmen pro Woche maximal drei neue Heizungsbau-Betriebe auf, um sauberes Onboarding zu garantieren." |
| 3 Mini-Stats | **1** aktiver Pilotbetrieb · **28** Sprints geliefert · **324** grüne Tests |
| CTA | "Beta-Liste eintragen →" scrollt zu `#cta` |
| Pilot-Region-Placeholder | Aktuell **bewusst keine Region nennen** (Pilotkunde anonym halten). Falls Pilotkunde später Region-Freigabe gibt: ergänzen. |

### 8. Trust-Block

| Element | Inhalt |
|---|---|
| Sektion-Headline | "DSGVO-konform aus Deutschland." |
| Sub | "Datenresidenz, Verschlüsselung und Compliance — von Anfang an mitgedacht." |
| Card 1 | 🇪🇺 **Hosting in Frankfurt** · "Supabase eu-central-1 · Vercel EU-Region · keine Daten in Drittländern" |
| Card 2 | 🔒 **Verschlüsselt End-to-End** · "TLS überall · bcrypt für Passwörter · Row-Level-Security auf der Datenbank" |
| Card 3 | ✉ **Doppelt Opt-In für jede Kunden-Mail** · "UWG-konform · jederzeit abbestellbar · stateless HMAC-Unsubscribe" |
| Card 4 | ✅ **324 automatisierte Tests** · "TypeScript strict · CI/CD · Sentry-Monitoring im laufenden Betrieb" |
| Tech-Stack-Logo-Strip (klein, dezent, graustichig) | Vercel · Supabase · Resend (jeweils SVG-Logo, in Graustufen, Höhe ~20 px) |

### 9. Pricing

| Element | Inhalt |
|---|---|
| Sektion-Headline | "Klare Preise. 30 Tage gratis testen." |
| Sub | "Beginne mit dem Tier, der zu deiner Größe passt — wechsle jederzeit." |
| Toggle (oben zentriert) | `[Monatlich]` `[Jährlich · 2 Monate gratis]` (default: **Jährlich**) — clientseitig, `useState` |
| Card "Solo" | €29/Monat (oder €290/Jahr) · "Für den Ein-Mann-Betrieb" · 7 Feature-Bullets · CTA "30 Tage testen →" (Beta-Liste, Tier-Preselect "Solo") |
| Card "Professional" | €49/Monat (oder €490/Jahr) · "Für Teams ab 2 Personen" · "Beliebteste Wahl"-Badge (Bernstein) · alles aus Solo plus 5 weitere Bullets · CTA "30 Tage testen →" (Beta-Liste, Tier-Preselect "Pro") |
| Card "Enterprise" | €99/Monat · "Für Mehr-Standort-Betriebe & Partner" · alles aus Pro plus 5 weitere Bullets · CTA "Demo buchen →" (Demo-Form) |
| Disclaimer-Footer | "Alle Preise zzgl. USt. · 30 Tage gratis · keine Kreditkarte · jederzeit kündbar." |

**Feature-Listen pro Card** (siehe MARKETING_BRIEFING §7.2 + Anpassungen — Cal.com → "Online-Termin-Buchung", Wartungsteile entfernt):

- **Solo:** bis 50 Kunden · Mobile Wartungs-Checklist · Foto-Dokumentation · Multi-System (Heizung · Klima · Wasser · Energiespeicher) · 904 Geräte vorgepflegt · Automatische Kunden-Erinnerungen · Online-Termin-Buchung · Daten-Export (DSGVO Art. 20)
- **Professional (alles aus Solo plus):** bis 150 Kunden · Multi-User mit OWNER/TECHNICIAN-Rollen · Anlagen-Zuweisung an Mitarbeiter · Techniker-Workload-Page · 1× Onboarding-Session (1 h)
- **Enterprise (alles aus Pro plus):** unlimited Kunden · Public API · Custom-Branding (Logo + Farben in E-Mails) · Priority-Support (24-h SLA) · 2× Onboarding-Session (2 h)

### 10. FAQ

| # | Frage | Antwort |
|---|---|---|
| 1 | Was passiert nach den 30 Tagen kostenlos? | "Du wählst den Tier, der zu dir passt — oder du kündigst. Keine Verlängerungs-Falle, keine Kreditkarte im Voraus. Wir erinnern dich rechtzeitig per E-Mail." |
| 2 | Ist Torqr nur für Heizungsbauer geeignet? | "Nein — Torqr unterstützt vier Anlagentypen: Heizung, Klima, Wasseraufbereitung und Energiespeicher (Boiler / Pufferspeicher). 904 Hersteller-Modell-Einträge sind vorgepflegt, eigene kannst du jederzeit ergänzen." |
| 3 | Kann ich meine bestehende Excel-Kundenliste importieren? | "Aktuell legst du Kunden manuell oder über das Anlagen-Modal an — der Geräte-Katalog beschleunigt das deutlich. Ein CSV-Import ist in Vorbereitung. Während der Beta-Phase helfen wir dir gerne beim einmaligen Initial-Import." |
| 4 | Was passiert mit meinen Daten, wenn ich kündige? | "Du bekommst einen vollständigen Daten-Export (DSGVO Art. 20) — Kunden, Anlagen, Wartungs-Historie und Fotos in offenen Formaten. Kein Vendor-Lock-in." |
| 5 | Funktioniert Torqr offline auf der Baustelle? | "Eingeschränkt — die App ist als Progressive Web App (PWA) installierbar und zeigt zwischengespeicherte Daten ohne Netz. Eine echte Offline-Sync mit lokaler Bearbeitung ist auf der Roadmap." |
| 6 | Kann ich später Mitarbeiter hinzufügen? | "Ja — wechsle in den Professional-Tier. Du legst Mitarbeiter mit OWNER- oder TECHNICIAN-Rolle an, weist Anlagen zu und siehst die Workload je Mitarbeiter im Dashboard. Kein neuer Vertrag, kein Daten-Umzug." |

**UI-Pattern:** shadcn Accordion, alle default zu, einzeln aufklappbar.

### 11. Final-CTA-Block

| Element | Inhalt |
|---|---|
| Hintergrund | Brand-Surface `#E6F2E6` (subtil grünlich, hebt Sektion vom hellen Body ab) |
| Headline | "Bereit, deine Wartungssaison neu zu denken?" |
| Sub | "30 Tage gratis · keine Kreditkarte · jederzeit kündbar." |
| Primary-CTA | **30 Tage testen** (öffnet Beta-Liste-Form-Modal oder scrollt zu eingebettetem Form) |
| Secondary-CTA | **Demo buchen** (öffnet Demo-Form-Modal) |
| Form-Embed-Strategie | Final-CTA-Block enthält **beide Forms inline** als shadcn `Tabs` (default-Tab "Beta-Liste"). URL-Hash `#cta-demo` schaltet auf Demo-Tab. Keine Modals — direkt-konvertierbar. |

### 12. Footer

| Spalte | Inhalt |
|---|---|
| **1 — Brand** | TorqrWordmark · Tagline-Klein "Die Wartungsakte für Heizungsbauer" · "Made in Germany 🇩🇪"-Hinweis |
| **2 — Produkt** | Features (`#features`) · Preise (`#pricing`) · FAQ (`#faq`) |
| **3 — Rechtliches** | Datenschutz (`/datenschutz`) · Impressum (`/impressum`) · *AGB (V2-Phase, in V1 noch nicht im Footer)* · *AVV (V2-Phase)* |
| **4 — Kontakt** | E-Mail: `hello@torqr.de` · *(LinkedIn optional, aktuell nicht eingeplant)* |
| Copyright-Zeile (unten, voll-breit) | "© 2026 Torqr · Alle Rechte vorbehalten." |

---

## Visual & Interaction Spec

### Farb-System (aus `src/styles/brand.config.ts`)

| Rolle | Token | Hex | Verwendung |
|---|---|---|---|
| Background | `bg-background` | `#FFFFFF` | Body-Default, Trust-Cards, FAQ-Cards |
| Surface (light brand) | `bg-brand-50` | `#E6F2E6` | Final-CTA-Sektion-Hintergrund, Tagline-Strip |
| Primary | `bg-brand` / `text-primary` | `#008000` | Buttons-Primary, Links, Step-Numerals, Headline-Akzente |
| Primary-deep | `bg-brand-700` | `#004D00` | Hover-States, Footer-Hintergrund (optional) |
| Accent | `bg-accent` / `text-accent` | `#EF9F27` | "Beliebteste Wahl"-Badge, Pricing-Highlight, ROI-Stat-Akzente |
| Accent-light | `bg-accent-light` | `#FAC775` | Highlight-Surfaces |
| Text | `text-foreground` | `#1A1A1A` | Body-Text, Headlines |
| Muted | `text-muted-foreground` | `#666` | Sub-Headlines, Disclaimers |

### Typografie

System-Font-Stack (aus `TorqrWordmark`): `'Segoe UI', system-ui, -apple-system, sans-serif`. Kein Webfont-Loading. Gewichte 400 / 500 / 600.

| Rolle | Class | Größe |
|---|---|---|
| Hero-Headline | `text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]` | mobile 36 px → desktop 60 px |
| Sektion-Headline | `text-3xl sm:text-4xl font-bold` | mobile 30 px → desktop 36 px |
| Card-Headline | `text-base font-semibold` | 16 px |
| Body | `text-base leading-relaxed` | 16 px |
| Sub / Caption | `text-sm text-muted-foreground` | 14 px |
| Disclaimer | `text-xs text-muted-foreground italic` | 12 px |

### Spacing

| Element | Class |
|---|---|
| Page-max-width | `max-w-6xl mx-auto` |
| Sektion-Padding | `py-20 sm:py-28 px-6` |
| Sektion-Inhalt-max-width | `max-w-5xl mx-auto` |
| Card-Padding | `p-6 sm:p-8` |
| Section-Header-Margin | `mb-12 sm:mb-16` |

### Animation

Minimal. Nur:
- Header-Backdrop-Blur beim Scroll (CSS, kein JS)
- Smooth-Scroll für Anchor-Links (`scroll-behavior: smooth` in CSS)
- Button-Hover-Transitions (existing shadcn-Defaults)
- Hero-GIF läuft autonom (kein JS-Trigger)
- **Keine Scroll-Triggered-Animations / Parallax / Framer-Motion in V1.** YAGNI-Prinzip.

### Responsive Breakpoints

| Breakpoint | Verwendung |
|---|---|
| `< sm` (640 px) | Mobile: alles gestapelt, Cards full-width, Header-Hamburger |
| `sm – lg` (640–1024 px) | Tablet: 2-Spalter wo sinnvoll, Cards 2-up |
| `≥ lg` (1024 px) | Desktop: 3-up Cards, Hero Phone+Desktop nebeneinander |

---

## Architecture

### File-Struktur

```
src/
├── app/
│   ├── page.tsx                          # Marketing-Landing (rewrite)
│   ├── datenschutz/page.tsx              # NEW · DSGVO-Pflicht
│   ├── impressum/page.tsx                # NEW · §5 TMG-Pflicht
│   └── api/
│       ├── beta-leads/route.ts           # NEW · POST handler für Beta-Liste
│       └── demo-requests/route.ts        # NEW · POST handler für Demo-Anfragen
├── components/
│   ├── brand/                            # existing — wiederverwenden
│   │   └── TorqrIcon.tsx
│   └── marketing/                        # NEW — alle Landingpage-Sektionen
│       ├── MarketingHeader.tsx
│       ├── Hero.tsx
│       ├── HeroVisual.tsx
│       ├── PainBlock.tsx
│       ├── ThreeStepSolution.tsx
│       ├── FeatureSection.tsx
│       ├── FeatureBlock.tsx              # einzelner alternierender Block
│       ├── RoiBlock.tsx
│       ├── PilotStatus.tsx
│       ├── TrustBlock.tsx
│       ├── TechStackStrip.tsx
│       ├── Pricing.tsx
│       ├── PricingCard.tsx
│       ├── PricingToggle.tsx             # client component (useState)
│       ├── Faq.tsx                       # client component (Accordion)
│       ├── FinalCta.tsx
│       ├── BetaListForm.tsx              # client component (form state)
│       ├── DemoRequestForm.tsx           # client component (form state)
│       └── MarketingFooter.tsx
├── lib/
│   ├── validations.ts                    # extend mit BetaLeadSchema + DemoRequestSchema
│   └── email/
│       ├── service.tsx                   # extend mit sendBetaLeadNotification + sendDemoRequestNotification
│       └── templates/
│           ├── BetaLeadAdminEmail.tsx    # NEW
│           └── DemoRequestAdminEmail.tsx # NEW
└── prisma/
    └── schema.prisma                     # extend mit BetaLead + DemoRequest

public/
└── marketing/
    ├── hero/
    │   ├── dashboard-desktop.png
    │   └── wartungs-checklist.gif
    └── features/
        ├── checklist-mobile.gif
        ├── photo-doku-desktop.png
        ├── multisystem-desktop.png
        └── workload-desktop.png
```

### Component-Boundaries

**Server Components (default, kein "use client"):**
- Alle Sektion-Komponenten außer `PricingToggle`, `Faq`, `BetaListForm`, `DemoRequestForm`, `MobileNavSheet`
- Statische Inhalte werden zur Build-Zeit gerendert → optimale Lighthouse-Performance

**Client Components ("use client"):**
- `PricingToggle` — `useState` für Monatlich/Jährlich
- `Faq` — Accordion-State (shadcn `Accordion`)
- `BetaListForm` + `DemoRequestForm` — `useForm` (react-hook-form), Submit-Handling, Success/Error-States
- `MobileNavSheet` — Sheet-Open-State

**Async Server Component für Header:**
- `MarketingHeader` darf `await auth()` → falls eingeloggt: rechte Buttons werden zu "Zum Dashboard"

### Data Model

**Prisma-Schema-Erweiterungen** (`prisma/schema.prisma`):

```prisma
model BetaLead {
  id          String   @id @default(cuid())
  email       String
  name        String?
  company     String?
  tierInterest String? // "SOLO" | "PRO" | null  (Enterprise geht über DemoRequest, kein Beta-Lead-Eintrag)
  source      String?  // "hero" | "pricing-solo" | "pricing-pro" | "pilot-status" | "direct"  — über URL-Hash beim Form-Load gesetzt
  consent     Boolean  @default(false) // DSGVO-Pflicht-Checkbox, server enforced consent === true
  createdAt   DateTime @default(now())

  @@index([email])
  @@index([createdAt])
}

model DemoRequest {
  id              String   @id @default(cuid())
  email           String
  name            String
  company         String?
  phone           String?
  preferredSlot   String?  // freie Eingabe: "Vormittags KW 19" o.ä.
  message         String?  @db.Text
  source          String?  // "hero" | "pricing-enterprise" | "header" | "direct"
  consent         Boolean  @default(false) // DSGVO-Pflicht-Checkbox, server enforced consent === true
  createdAt       DateTime @default(now())

  @@index([email])
  @@index([createdAt])
}
```

**Bewusst keine `userId`-Foreign-Key:** Lead ist anonym (kein Auth-Kontext). DSGVO-Aufbewahrungs-Logik (Lead-Lifecycle) später separat — Beta-Phase: alle Leads bleiben.

### Form Submission Flow

#### URL-Hash-Routing für Form-Targeting

Alle CTAs scrollen zu `#cta`. Der genaue Hash steuert Tab-Default und Tier-Preselect:

| Hash | Effekt |
|---|---|
| `#cta` | Default-Tab "Beta-Liste", `tierInterest=null` |
| `#cta-beta-solo` | Tab "Beta-Liste", `tierInterest=SOLO`, `source=pricing-solo` |
| `#cta-beta-pro` | Tab "Beta-Liste", `tierInterest=PRO`, `source=pricing-pro` |
| `#cta-pilot` | Tab "Beta-Liste", `tierInterest=null`, `source=pilot-status` |
| `#cta-hero` | Tab "Beta-Liste", `tierInterest=null`, `source=hero` |
| `#cta-demo` | Tab "Demo-Anfrage", `source=hero` oder `pricing-enterprise` (je nach Click-Kontext) |

Hash wird beim Form-Load via `useSearchParams` / `window.location.hash` gelesen.

#### Beta-Liste

1. User füllt `BetaListForm` (E-Mail Pflicht, optional Name + Firma, Tier-Preselect aus URL-Hash, **Consent-Checkbox Pflicht**).
2. Client-Validation via Zod (`BetaLeadSchema` in `src/lib/validations.ts`) — `consent === true` erzwungen.
3. POST `/api/beta-leads` → Route Handler validiert nochmal serverseitig (defense in depth) → `prisma.betaLead.create({ ... })`.
4. Bei Success: `sendBetaLeadNotification({ email, tierInterest, source })` via Resend → Mail an `BETA_LEAD_NOTIFY_EMAIL` (env, default `hello@torqr.de`) mit Lead-Daten.
5. Form zeigt Success-State: "Danke! Wir melden uns innerhalb von 2 Werktagen."

**Rate-Limiting:** 5 Submissions pro IP pro Stunde via existing `rateLimitMiddleware` (NEW preset `BETA_LEAD`).

**Spam-Protection:** Honeypot-Field (`website` hidden field, muss leer sein, sonst silent-200).

#### Demo-Anfrage

1. User füllt `DemoRequestForm` (E-Mail + Name **Pflicht**, Firma + Telefon + Wunschtermin-Freitext + Nachricht optional, **Consent-Checkbox Pflicht**).
2. Client-Validation via Zod (`DemoRequestSchema` in `src/lib/validations.ts`) — `consent === true` erzwungen.
3. POST `/api/demo-requests` → analog zu Beta-Liste.
4. `sendDemoRequestNotification(...)` via Resend mit allen Form-Daten an `DEMO_REQUEST_NOTIFY_EMAIL` (env).
5. Success-State: "Danke! Wir melden uns innerhalb von 1 Werktag mit Terminvorschlägen."

**Rate-Limiting:** 3 Submissions pro IP pro Stunde (`DEMO_REQUEST` preset).

**Spam-Protection:** identisch zu Beta-Liste.

### Routing & Middleware

**Bestehende Middleware (`src/middleware.ts`):**
- Aktuell nur Rate-Limit auf `/api/auth/*`
- **Erweiterung:** Rate-Limit auf `/api/beta-leads` und `/api/demo-requests` über das bestehende Rate-Limit-Middleware-Pattern

**Keine Public-Route-Whitelist nötig:** App ist heute schon "default-public" (Auth-Enforcement passiert page-level, nicht middleware-level). `src/app/page.tsx` redirected logged-in-User zu `/dashboard`, das bleibt.

**Neue Routen sind alle public:**
- `GET /` (Marketing-Landing)
- `GET /datenschutz`
- `GET /impressum`
- `POST /api/beta-leads`
- `POST /api/demo-requests`

### SEO & Meta

**`src/app/layout.tsx`** existing — erweitern um:

```tsx
export const metadata: Metadata = {
  title: 'Torqr · Die Wartungsakte für Heizungsbauer',
  description: 'Torqr digitalisiert deine Wartungsplanung — automatische Kunden-Erinnerungen, mobile Vor-Ort-Dokumentation, alle Daten zentral. 30 Tage gratis testen.',
  keywords: ['Wartungssoftware Heizungsbauer', 'Heizungswartung Software', 'Wartungsplaner', 'Handwerker App', 'SHK Software', 'Heizungswartung digital'],
  openGraph: {
    title: 'Torqr · Die Wartungsakte für Heizungsbauer',
    description: 'Aus Excel raus. In die Hosentasche rein. 30 Tage gratis testen.',
    url: 'https://torqr.de',
    siteName: 'Torqr',
    locale: 'de_DE',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
}
```

**JSON-LD Schema-Markup** (in `src/app/page.tsx`):

```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{
  __html: JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Torqr',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'EUR',
      lowPrice: '29',
      highPrice: '99',
    },
    description: 'Wartungsmanagement-Plattform für Heizungsbau-Betriebe.',
  })
}} />
```

**Sitemap:** Neue `src/app/sitemap.ts` mit Einträgen für `/`, `/datenschutz`, `/impressum`.

**Robots.txt:** Neue `src/app/robots.ts`, allow alle Public-Pages, disallow `/dashboard/*`, `/api/*`, `/admin/*`.

---

## Tests

### Pflicht für V1-Launch

| Test-Typ | Scope | File-Location |
|---|---|---|
| Zod-Schema | `BetaLeadSchema` + `DemoRequestSchema` Validierung (gültig / ungültig / Edge-Cases) | `src/lib/__tests__/validations.test.ts` |
| API-Route-Handler | `POST /api/beta-leads` und `/api/demo-requests`: Happy Path, Validation-Failure, Rate-Limit-Hit, Honeypot-Spam | `src/app/api/__tests__/beta-leads.test.ts` + `demo-requests.test.ts` |
| Form-Components | `BetaListForm` + `DemoRequestForm`: Render, Validation-Anzeige, Success-State, Error-State (mit Mock-Fetch) | `src/components/marketing/__tests__/` |
| Email-Service | `sendBetaLeadNotification` + `sendDemoRequestNotification` Render-Tests (snapshot der React-Email-Templates) | `src/lib/email/__tests__/` |
| Accessibility | jest-axe auf jede Sektion, keine kritischen Verstöße | `src/components/marketing/__tests__/a11y.test.tsx` |

### Empfohlen / V2

- **Lighthouse-Mobile-Score ≥ 90** als CI-Akzeptanz (Vercel Lighthouse Preview)
- **Visual-Regression** (Playwright snapshots der 10 Sektionen)
- **E2E-Form-Submission** (Playwright: Form ausfüllen → Submit → Success-State checken → DB-Lead-Eintrag verifizieren)

### Bestehende Tests dürfen nicht brechen

- 324 grüne Tests im Repo. Anforderung: nach V1-Implementierung **mindestens 324 grün, idealerweise +20–30 neue Tests**.

---

## Pre-Launch Critical Path

| # | Task | Blocker | Aufwand |
|---|------|---------|---------|
| P1 | **Demo-Daten-Seed-Script** (`prisma/seed-marketing-demo.ts`) — anonymisiert, 5 Beispielkunden, 8 Anlagen, 12 Wartungen mit Fotos, Multi-System-Mix | Ja — ohne Seed keine Screenshots | 0,5 Tag |
| P2 | **Hero-GIF + 4 Feature-Screenshots/GIFs** produzieren | Ja — Visuals sind Hero-Conversion-Asset | 0,5–1 Tag |
| P3 | **Datenschutzerklärung** (Generator-Vorlage + Anwalt-Review) | Ja — DSGVO Art. 13 Pflicht | 0,5 Tag + ~3–5 Werktage Anwalt |
| P4 | **Impressum** (§5 TMG) | Ja — gesetzlich Pflicht | 0,5 Tag |
| P5 | **Prisma-Migration** für `BetaLead` + `DemoRequest` | Ja — sonst keine Form-Persistenz | 0,5 Tag |
| P6 | **Resend-Templates** + Service-Methods für Lead-Notifizierung | Ja — sonst keine Lead-Notification | 0,5 Tag |
| P7 | **Zod-Schemas** + API-Routes + Tests | Ja | 1 Tag |
| P8 | **Marketing-Components** (12+ Komponenten) | Ja | 2,5 Tage |
| P9 | **OG-Image** + Favicon-Refresh + Sitemap + Robots | Ja für SEO | 0,5 Tag |
| P10 | **Lighthouse-Mobile ≥ 90** verifizieren | Empfohlen | 0,5 Tag (Optimierungs-Loop) |

**Gesamt-Aufwand-Schätzung V1:** ~7–8 Werktage Solo-Dev-Aufwand (ohne Anwalt-Review-Wartezeit).

---

## V2 Backlog (bewusst aufgeschoben)

| # | Item | Trigger / Bedingung |
|---|------|---------------------|
| V1 | FAQ-Antworten verfeinern | Nach echten Beta-User-Fragen (~Sprint 32) |
| V2 | ROI-Rechner-Tool unter `/roi-rechner` | Nach V1-Launch, eigenes Lead-Magnet (Marketing-Idea #2) |
| V3 | Wartungsteile-Sektion einfügen | Sobald Marketing-Decision Wartungsteile = ja |
| V4 | Pilot-Testimonial-Quote integrieren | Nach 6-Monats-Pilot-Feedback (~Juli 2026) |
| V5 | Cal.com-Sichtbarkeits-Decision umsetzen | Nach interner Vendor-Strategie-Decision |
| V6 | Wettbewerbsvergleichs-Seite `/vergleich` | Wenn 3+ Wettbewerber-Vergleiche Sales-relevant werden |
| V7 | AGB + Stripe-Integration | Wenn Self-Service-Sale-Flow startet |
| V8 | Demo-Video (90 s) ersetzt Hero-GIF | Wenn Video-Asset produziert ist |
| V9 | Plausible / Posthog Analytics-Integration | Vor erster Paid-Ads-Kampagne |
| V10 | Programmatic-SEO Geräte-Katalog-Seiten | Phase-2-Marketing-Hebel (Marketing-Idea #1) |
| V11 | AVV-Vorlage als PDF-Download im Footer | Sobald Anwalt-Review der AVV abgeschlossen |
| V12 | Founder-Story-Block / "Über uns"-Page | Optional, wenn Yannik-Persona Marketing-Hebel werden soll |

---

## Open Questions / Risks

| # | Question / Risk | Mitigation |
|---|-----------------|------------|
| R1 | Anwalt-Review-Wartezeit blockiert Launch | Datenschutz-Review parallel zu Implementierung starten, nicht sequentiell |
| R2 | Hero-GIF zu groß → schlechter LCP | Asset-Budget: GIF max 500 KB, ggf. WebM-Video als Fallback (`<picture>`-Sourcen) |
| R3 | Demo-Daten-Seed produziert versehentlich PII | Seed verwendet ausschließlich erfundene Namen / Adressen / Telefon-Nummern (`Beispiel-Heizung GmbH`, `Musterstr. 1`, etc.) — Code-Review-Punkt |
| R4 | Beta-Liste-Lead-Volumen bricht Resend-Quota (50k/Monat) | Free-Tier reicht für Pre-Launch. Bei plötzlichem Spike: Resend-Plan-Upgrade (€20→€50) |
| R5 | Pilot-Region-Nennung im Pilot-Programm-Block könnte Pilotkunden de-anonymisieren | Ohne Region-Nennung implementieren. Region-Freigabe explizit nachfragen, dann ergänzen. |
| R6 | "Aus Excel raus."-Headline könnte beleidigend wirken auf konservative Heizungsbauer | A/B-Test in V2 mit Briefing-Backup-Headlines möglich. V1: bewusst gewählt für Conversion. |
| R7 | "Beliebteste Wahl"-Badge auf Pro-Tier ist faktisch Fiktion (noch keine Käufer) | In Marketing-Welt branchenüblich. Sobald 10+ zahlende Kunden da sind, Badge faktisch korrekt. Bis dahin: rechtlich grenzwertig wegen UWG-Irreführung — als V2-Risiko notieren, ggf. zu "Empfohlen" abschwächen. |

---

## Success Metrics

V1-Launch ist erfolgreich, wenn:

| Metric | Ziel |
|--------|------|
| Public-Page erreichbar unter `torqr.de/` | ✅ |
| Datenschutz + Impressum erreichbar und Anwalt-reviewed | ✅ |
| Beta-Liste-Form sammelt erste Leads ohne Spam | ≥ 5 echte Leads in 2 Wochen |
| Demo-Anfrage-Form generiert qualifizierte Leads | ≥ 1 Demo gebucht in 4 Wochen |
| Lighthouse-Mobile-Score | ≥ 90 |
| Time to First Byte | < 200 ms |
| Largest Contentful Paint (LCP) | < 2,5 s auf 3G |
| Test-Suite | + 20–30 neue grüne Tests, 0 Regressionen |

---

## Sign-off

Brainstorming-Session abgeschlossen 2026-04-29 mit User-Approval auf alle 18 Foundational Decisions. Nächster Schritt: `superpowers:writing-plans` produziert Phasen-Plan für V1-Implementierung.
