# Graph Report - .graphify-marketing-staging  (2026-04-30)

## Corpus Check
- 39 files · ~103,287 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 490 nodes · 611 edges · 55 communities detected
- Extraction: 89% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Brand Voice & Anti-Tonality|Brand Voice & Anti-Tonality]]
- [[_COMMUNITY_Audience Segments, CTAs & FAQ|Audience Segments, CTAs & FAQ]]
- [[_COMMUNITY_Mobile Dashboard Capabilities|Mobile Dashboard Capabilities]]
- [[_COMMUNITY_Page Chrome & Trust Signals|Page Chrome & Trust Signals]]
- [[_COMMUNITY_Color Token Palette|Color Token Palette]]
- [[_COMMUNITY_Hero Section & Persona|Hero Section & Persona]]
- [[_COMMUNITY_Dashboard App Brand Tokens|Dashboard App Brand Tokens]]
- [[_COMMUNITY_Mobile-First Feature Claims|Mobile-First Feature Claims]]
- [[_COMMUNITY_Multi-System Feature|Multi-System Feature]]
- [[_COMMUNITY_Pilot Status & Social Proof|Pilot Status & Social Proof]]
- [[_COMMUNITY_WorkloadDisposition Feature|Workload/Disposition Feature]]
- [[_COMMUNITY_Photo Documentation Feature|Photo Documentation Feature]]
- [[_COMMUNITY_GTM Channels & Phases|GTM Channels & Phases]]
- [[_COMMUNITY_Lead Capture Forms (BetaDemo)|Lead Capture Forms (Beta/Demo)]]
- [[_COMMUNITY_Logo & Accent Palette|Logo & Accent Palette]]
- [[_COMMUNITY_Strategic Marketing Docs|Strategic Marketing Docs]]
- [[_COMMUNITY_OG Metadata & Root Layout|OG Metadata & Root Layout]]
- [[_COMMUNITY_TorqrIcon Component|TorqrIcon Component]]
- [[_COMMUNITY_BetaListForm onSubmit|BetaListForm onSubmit]]
- [[_COMMUNITY_DemoRequestForm onSubmit|DemoRequestForm onSubmit]]
- [[_COMMUNITY_Faq Component|Faq Component]]
- [[_COMMUNITY_FeatureBlock Component|FeatureBlock Component]]
- [[_COMMUNITY_FinalCta Component|FinalCta Component]]
- [[_COMMUNITY_Hero Component|Hero Component]]
- [[_COMMUNITY_HeroVisual Component|HeroVisual Component]]
- [[_COMMUNITY_Impressum Page|Impressum Page]]
- [[_COMMUNITY_Landing Page (Home)|Landing Page (Home)]]
- [[_COMMUNITY_MarketingFooter Component|MarketingFooter Component]]
- [[_COMMUNITY_PainBlock Component|PainBlock Component]]
- [[_COMMUNITY_PilotStatus Component|PilotStatus Component]]
- [[_COMMUNITY_PricingToggle Component|PricingToggle Component]]
- [[_COMMUNITY_RoiBlock Component|RoiBlock Component]]
- [[_COMMUNITY_RootLayout Component|RootLayout Component]]
- [[_COMMUNITY_TechStackStrip Component|TechStackStrip Component]]
- [[_COMMUNITY_ThreeStepSolution Component|ThreeStepSolution Component]]
- [[_COMMUNITY_TrustBlock Component|TrustBlock Component]]
- [[_COMMUNITY_Annual Billing Rationale|Annual Billing Rationale]]
- [[_COMMUNITY_brand.config.ts|brand.config.ts]]
- [[_COMMUNITY_tailwind.config.ts|tailwind.config.ts]]
- [[_COMMUNITY_Datenschutz Page|Datenschutz Page]]
- [[_COMMUNITY_FeatureSection Component|FeatureSection Component]]
- [[_COMMUNITY_MarketingHeader Component|MarketingHeader Component]]
- [[_COMMUNITY_MobileNavSheet Component|MobileNavSheet Component]]
- [[_COMMUNITY_Pricing Component|Pricing Component]]
- [[_COMMUNITY_PricingCard Component|PricingCard Component]]
- [[_COMMUNITY_Unit Economics ARPU|Unit Economics: ARPU]]
- [[_COMMUNITY_Unit Economics LTV|Unit Economics: LTV]]
- [[_COMMUNITY_Unit Economics CAC|Unit Economics: CAC]]
- [[_COMMUNITY_Pilot Contract Pricing|Pilot Contract Pricing]]
- [[_COMMUNITY_White-Label Add-On|White-Label Add-On]]
- [[_COMMUNITY_Brand Mission|Brand Mission]]
- [[_COMMUNITY_Status Color Overdue|Status Color: Overdue]]
- [[_COMMUNITY_Status Color Info|Status Color: Info]]
- [[_COMMUNITY_Typography Weights|Typography Weights]]
- [[_COMMUNITY_Backup Headline|Backup Headline]]

## God Nodes (most connected - your core abstractions)
1. `Torqr (Produkt)` - 52 edges
2. `Hero Image — Dashboard Desktop Screenshot` - 22 edges
3. `Hero GIF: wartungs-checklist.gif` - 22 edges
4. `email-template.html (Wartungsbenachrichtigung)` - 16 edges
5. `Workflow: Mobile Dashboard — Kunden- und Wartungsübersicht` - 16 edges
6. `MarketingHeader` - 14 edges
7. `Home (landing-page.tsx)` - 14 edges
8. `MarketingFooter` - 12 edges
9. `TorqrWordmark` - 12 edges
10. `Public Landing Page (torqr.de)` - 10 edges

## Surprising Connections (you probably didn't know these)
- `email-template.html (Wartungsbenachrichtigung)` --uses_brand_token--> `Logo Icon variant: ghost (rgba white 0.15)`  [INFERRED]
  .graphify-marketing-staging/brand_spec/email-template.html → .graphify-marketing-staging/code/TorqrIcon.tsx
- `email-template.html (Wartungsbenachrichtigung)` --uses_brand_token--> `Background-Alt #F7F7F7`  [EXTRACTED]
  .graphify-marketing-staging/brand_spec/email-template.html → .graphify-marketing-staging/brand_spec/brand.config.ts
- `email-template.html (Wartungsbenachrichtigung)` --uses_brand_token--> `Border #E0E0E0`  [EXTRACTED]
  .graphify-marketing-staging/brand_spec/email-template.html → .graphify-marketing-staging/brand_spec/brand.config.ts
- `Headline: 'Aus Excel raus. In die Hosentasche rein.'` --addresses_pain--> `Pain: Excel-Liste chaotisch — 4 Dateien, jede mit anderem Stand`  [INFERRED]
  .graphify-marketing-staging/code/Hero.tsx → .graphify-marketing-staging/code/PainBlock.tsx
- `Feature: Alles an einem Ort (Kunden, Anlagen, Historie, Fotos)` --addresses_pain--> `Pain: Excel-Liste chaotisch — 4 Dateien, jede mit anderem Stand`  [INFERRED]
  .graphify-marketing-staging/code/ThreeStepSolution.tsx → .graphify-marketing-staging/code/PainBlock.tsx

## Hyperedges (group relationships)
- **All Pricing Tiers (Solo / Professional / Enterprise)** — tier_solo, tier_professional, tier_enterprise [EXTRACTED 1.00]
- **Pilot Social Proof Stats (1 Pilot, 28 Sprints, 324 Tests, 3/Woche, Co-Development)** — social_proof_pilot_active, social_proof_28_sprints, social_proof_324_tests, social_proof_max_3_per_week, social_proof_co_development [EXTRACTED 1.00]
- **DSGVO/Trust Signals (Hosting, E2E, Opt-In, Tests, DSGVO)** — trust_hosting_frankfurt, trust_e2e_encryption, trust_double_optin, trust_324_tests, trust_dsgvo_konform [EXTRACTED 1.00]
- **Landing-Page Composition (Home → 10 marketing sections)** —  [EXTRACTED 1.00]
- **Design Token Triangle (globals.css ↔ tailwind.config.ts ↔ brand.config.ts)** —  [INFERRED 0.90]
- **Brand-Grün family (#008000 / #006600 / #004D00 / #4DA64D / #E6F2E6)** —  [EXTRACTED 1.00]
- **Bernstein/Amber family (#EF9F27 / #FAC775 / #FAEEDA / #BA7517)** —  [EXTRACTED 1.00]
- **TorqrWordmark used across header, footer, and email surfaces** —  [INFERRED 0.90]
- **Legal footprint (Impressum §5 TMG + Datenschutz DSGVO + AVV processors)** —  [EXTRACTED 1.00]
- **Marketing page anchor targets shared by header + footer + mobile nav** —  [EXTRACTED 1.00]
- **Vollständige Landing-Page-Sektion-Sequenz (10 Sektionen Lese-Reihenfolge)** — section:header, section:hero, section:pain_block, section:three_step_solution, section:feature_section, section:roi_block, section:pilot_status, section:trust_block, section:pricing, section:faq, section:final_cta, section:footer [EXTRACTED 1.00]
- **Pricing-Tier-Set (Solo/Professional/Enterprise mit Trial+Annual+Cal.com)** — pricing:tier_solo, pricing:tier_professional, pricing:tier_enterprise, pricing:trial_30_tage, pricing:annual_discount, pricing:cal_com_all_tiers [EXTRACTED 1.00]
- **Brand-Token-System (Farben + Status-Semantik + Typografie)** — color:brand_primary_008000, color:brand_primary_dark_006600, color:brand_primary_deep_004D00, color:brand_surface_E6F2E6, color:accent_EF9F27, color:accent_light_FAC775, color:accent_surface_FAEEDA, color:status_ok, color:status_due, color:status_overdue, color:status_info, typo:segoe_ui_stack, typo:weights_400_500_600 [EXTRACTED 1.00]

## Communities

### Community 0 - "Brand Voice & Anti-Tonality"
Cohesion: 0.03
Nodes (77): ICP: Ein-Mann-Heizungsbau-Betrieb in Deutschland (~15.000 Betriebe TAM), Sekundär: Heizungsbau-Teams 2-5 Mitarbeiter (OWNER/TECHNICIAN-Rollen), Sekundär: Klempner, Lüftungsbauer, Schornsteinfeger (gleicher Wartungs-Workflow), Anrede 'Du' im Marketing/Outbound an Heizungsbauer (Decision D-6), Anrede 'Sie' in Endkunden-E-Mails (Senioren-Empfänger, Decision D-6), Anti-Tonalität: 'revolutionär', 'next-gen', 'Game-changer', 'AI-powered' VERBOTEN, Microcopy: Keine Emojis in Produkt-UI/E-Mails (Marketing erlaubt), Tone of Voice: ruhig, technisch, sachlich, nüchtern, kein Marketing-Hype (+69 more)

### Community 1 - "Audience Segments, CTAs & FAQ"
Cohesion: 0.06
Nodes (54): Target Audience: Heizungsbauer / SHK-Betriebe, Audience Segment: Mehr-Standort-Betriebe & Partner (Enterprise), Audience Segment: Ein-Mann-Betrieb (Solo), Audience Segment: Teams ab 2 Personen (Professional), BetaListForm Component, Primary CTA: '30 Tage testen', Secondary CTA: 'Demo buchen', CTA-Microcopy: 'Keine Kreditkarte · jederzeit kündbar · DSGVO-konform' (+46 more)

### Community 2 - "Mobile Dashboard Capabilities"
Cohesion: 0.06
Nodes (42): Brand-Token: Heartbeat/EKG-Icon (Logo-Symbol), Brand-Token: Torqr-Grün (Primary, Logo + CTA-Buttons), Brand-Token: Torqr Wortmarke, Capability: Pipeline anstehender Wartungen mit Status-Tracking, Capability: KPI-Übersicht in Echtzeit (Kunden, Systeme, Überfällig, Nicht zugewiesen, Nächste 30 Tage), Capability: Mobile-first Dashboard (Smartphone-Layout), Capability: One-Tap Wartung-Abschluss direkt aus der Kundenkarte, Capability: Responsives Layout (Mobile-first, 1-spaltig auf schmalem Viewport) (+34 more)

### Community 3 - "Page Chrome & Trust Signals"
Cohesion: 0.07
Nodes (40): CTA: 30 Tage testen, Headline: Die Wartungsakte für Heizungsbauer, Trust signal: Made in Germany, MarketingFooter, MarketingHeader, MobileNavSheet, @/components/ui/button, @/components/ui/sheet (+32 more)

### Community 4 - "Color Token Palette"
Cohesion: 0.11
Nodes (37): App-Name: torqr, Bernstein/Amber #EF9F27 (accent), Bernstein dunkel #BA7517, Bernstein hell #FAC775, Bernstein Surface #FAEEDA, Background #FFFFFF, Background-Alt #F7F7F7, Border #E0E0E0 (+29 more)

### Community 5 - "Hero Section & Persona"
Cohesion: 0.07
Nodes (33): Asset: dashboard-desktop.png (Desktop-Browser-Frame), Asset: wartungs-checklist.gif (Phone-GIF, 3-Step-Wizard-Loop), Persona: Max der Heizungsbauer (Solo-Betrieb, 35-50, niedrige Tech-Affinität), Component: FeatureSection.tsx + FeatureBlock.tsx, Component: Hero.tsx + HeroVisual.tsx, Component: MarketingHeader.tsx, Component: PainBlock.tsx, Component: ThreeStepSolution.tsx (+25 more)

### Community 6 - "Dashboard App Brand Tokens"
Cohesion: 0.09
Nodes (23): Brand Token: Neutral White Canvas (Content-Bereich), Brand Token: Primary Green (Sidebar + CTA-Buttons), Brand Token: Warning Amber (überfällige Wartung Highlight), Brand Token: Torqr-Wortmarke im Sidebar-Header, Capability: Zeitraum-Filter '30 Tage', Capability: KPI-Kacheln (Kunden gesamt, Systeme, Überfällig, Nicht zugewiesen, Nächste 30 Tage), Capability: Schnellaktion 'Erledigt'-Button pro Wartung, Capability: 'Letzte Wartungen' mit Erledigt-Datum (+15 more)

### Community 7 - "Mobile-First Feature Claims"
Cohesion: 0.15
Nodes (18): Brand Token: Torqr-Grün (Logo-Quadrat, Action-Buttons, Status-Indikatoren), Brand Token: Torqr-Wortmarke + EKG-Logo, Capability: Vor-Ort-tauglicher Dashboard-Überblick auf dem Smartphone, Capability: Touch-optimierte Aktionen (große Buttons, Daumen-bedienbar), Claim: 'Im Heizungskeller nutzbar', Claim: 'Touch-optimiert', Copy: Beispieldaten 'Schmidt & Söhne GbR' (Hamburg), 'Familie Becker' (Köln), Vaillant ecoTEC plus VCW 1-5, Copy: 'Dashboard — Übersicht über Ihre Kunden und anstehende Wartungen' (+10 more)

### Community 8 - "Multi-System Feature"
Cohesion: 0.16
Nodes (18): Capability — Zuweisungsfilter und Volltext-Suche über alle Systeme, Capability — Heterogene Anlagentypen unterstützt (Gas-Brennwert Vaillant, Wärmepumpe Daikin, Wasseraufbereitung BWT, Warmwasserspeicher Stiebel Eltron), Capability — Wartungsstatus pro System sichtbar (Diese Woche, Bald fällig, nächste Wartung mit Datum), Capability — Mehrere Heizungs-/HLK-Systeme pro Kunde abbildbar (gleicher Kunde mehrfach: Familie Müller, Becker, Wagner), Marketing-Claim — 'Komplexe Anlagen abbildbar', Marketing-Claim — Voller Überblick aller Kundensysteme auf einen Blick, Marketing-Claim — 'Multi-System pro Kunde', Copy — Suchfeld-Placeholder 'Suche nach Gerät, Hersteller, Kunde oder Ort…' (+10 more)

### Community 9 - "Pilot Status & Social Proof"
Cohesion: 0.14
Nodes (16): CTA: 'Beta-Liste eintragen', PilotStatus Component, Social Proof: 28 Sprints geliefert, Social Proof: 324 Grüne Tests, Positioning: 'gemeinsam mit echten Heizungsbauern entwickelt', Scarcity Proof: max. 3 neue Heizungsbau-Betriebe pro Woche, Social Proof: 1 Aktiver Pilotbetrieb, Tech Stack: Resend (Email) (+8 more)

### Community 10 - "Workload/Disposition Feature"
Cohesion: 0.18
Nodes (14): Action: Erledigt button per maintenance row, Capability: Dashboard — Overview of customers and pending maintenance, Feature claim: Mitarbeiter-Auslastung, Feature claim: Team-Kapazitaet, Feature claim: Termin-Disposition, Workload / Dashboard Desktop View, KPI: Kunden gesamt (5), KPI: Naechste 30 Tage (8) (+6 more)

### Community 11 - "Photo Documentation Feature"
Cohesion: 0.23
Nodes (12): Capability: Foto-Upload pro Anlage (Hinzuefuegen-Button, 1/5 Counter), Marketing-Claim: Anlagenzustand visuell dokumentiert, Marketing-Claim: Beweissicherung, Marketing-Claim: Foto-Dokumentation, Feature Image: Foto-Dokumentation (Desktop), Foto-Thumbnail: installierte Klimaanlage am Fenster (Anlagenzustand), Sektion 'Fotos 1/5' mit Thumbnail-Galerie und Hinzufuegen-Button, Kunde: Familie Mueller, Musterstr. 1, Berlin / Zustaendiger Techniker: Demo Techniker (+4 more)

### Community 12 - "GTM Channels & Phases"
Cohesion: 0.18
Nodes (11): Kanal: Buchhaltungs-Tool-Integrationen (Lexoffice, SevDesk), Kanal: Content-Marketing (Wartungspflicht-Artikel, ROI-Rechner, Templates), Kanal: Hersteller-Pro-Programme (Bosch Pro, Vaillant, Viessmann), Kanal: Innungen / Handwerkskammern (Co-Marketing, Mitglieder-Rabatt), Kanal: LinkedIn / Handwerk-Foren (organischer Content), Kanal: Paid Ads Google/Meta (€500-1k/Monat, später), Kanal: SEO (Long-tail Wartungsplaner, Heizungswartung Software, etc.), GTM Phase 1: MVP mit Pilotkunde (läuft) (+3 more)

### Community 13 - "Lead Capture Forms (Beta/Demo)"
Cohesion: 0.18
Nodes (11): Component: Faq.tsx (Accordion), Component: FinalCta.tsx + BetaListForm.tsx + DemoRequestForm.tsx, Component: MarketingFooter.tsx, Data Model: BetaLead (email, tierInterest SOLO|PRO, source, consent), Data Model: DemoRequest (email, name, phone, preferredSlot, message, consent), Rationale: Solo+Pro → Beta-Liste, Enterprise → Demo-Anfrage; differenzierte Form-Targets mit zwei DB-Tabellen, Rationale: Eigenbau-Form (kein Cal.com/Tally/Typeform) konsistent mit 'keine 3rd-Party-Vendor-Anzeige', Rationale: Yannik-Name nur im Impressum, alle CTAs ohne Personennamen ('Demo buchen' statt 'Demo mit Yannik buchen') (+3 more)

### Community 14 - "Logo & Accent Palette"
Cohesion: 0.2
Nodes (10): Logo-Konzept: Puls/Diagnose-Linie auf abgerundetem grünem Quadrat, Accent Bernstein #EF9F27, Accent-Light #FAC775, Accent-Surface #FAEEDA, Brand-Primary #008000 (Industriegrün), Brand-Primary-Dark #006600, Brand-Primary-Deep #004D00, Brand-Surface #E6F2E6 (light brand) (+2 more)

### Community 15 - "Strategic Marketing Docs"
Cohesion: 0.33
Nodes (6): Torqr Brand Spec, Public Landing Page — Design Spec, Public Landing Page V1 Implementation Plan, Rationale: Cal.com komplett von Public-Page entfernt, weil Vendor-Strategie offen — provider-agnostische Formulierung 'Online-Termin-Buchung', Rationale: Standard-Anatomie 10 Sektionen — Lean (7) zu dünn für Stakeholder-Showpiece, Comprehensive (13+) Phase-2, Value Prop: 'Online-Buchung ohne Telefon-Pingpong' (Cal.com)

### Community 16 - "OG Metadata & Root Layout"
Cohesion: 0.4
Nodes (5): OG-Tagline: Aus Excel raus. In die Hosentasche rein., @/components/Providers, RootLayout, /og-image.png (1200x630), OpenGraph metadata (de_DE)

### Community 17 - "TorqrIcon Component"
Cohesion: 0.67
Nodes (1): TorqrIcon()

### Community 18 - "BetaListForm onSubmit"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "DemoRequestForm onSubmit"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Faq Component"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "FeatureBlock Component"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "FinalCta Component"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Hero Component"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "HeroVisual Component"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Impressum Page"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Landing Page (Home)"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "MarketingFooter Component"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "PainBlock Component"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "PilotStatus Component"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "PricingToggle Component"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "RoiBlock Component"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "RootLayout Component"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "TechStackStrip Component"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "ThreeStepSolution Component"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "TrustBlock Component"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Annual Billing Rationale"
Cohesion: 1.0
Nodes (2): Annual-Billing-Discount: 2 Monate gratis (~17% Rabatt), Rationale: Annual-Default verbessert LTV (17% Rabatt = 2 Monate gratis, Standard im Markt)

### Community 37 - "brand.config.ts"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "tailwind.config.ts"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Datenschutz Page"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "FeatureSection Component"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "MarketingHeader Component"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "MobileNavSheet Component"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Pricing Component"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "PricingCard Component"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Unit Economics: ARPU"
Cohesion: 1.0
Nodes (1): Unit Economics: ARPU €39/Monat (gewichtet 60/30/10)

### Community 46 - "Unit Economics: LTV"
Cohesion: 1.0
Nodes (1): Unit Economics: LTV ~€1.330

### Community 47 - "Unit Economics: CAC"
Cohesion: 1.0
Nodes (1): Unit Economics: CAC blended Ziel <€50

### Community 48 - "Pilot Contract Pricing"
Cohesion: 1.0
Nodes (1): Pilotkunden-Sondervertrag: €5.000 einmalig (NICHT SaaS-Modell)

### Community 49 - "White-Label Add-On"
Cohesion: 1.0
Nodes (1): Add-On: White-Label-Lizenz €500/Monat pro Innung/Verband

### Community 50 - "Brand Mission"
Cohesion: 1.0
Nodes (1): Brand-Mission: Wartungs-Overhead von ~8h auf <2h pro Woche reduzieren

### Community 51 - "Status Color: Overdue"
Cohesion: 1.0
Nodes (1): Status: overdue (Surface #FAECE7 / Border #F5C4B3 / Text #712B13)

### Community 52 - "Status Color: Info"
Cohesion: 1.0
Nodes (1): Status: info (Surface #E6F1FB / Border #B5D4F4 / Text #0C447C)

### Community 53 - "Typography Weights"
Cohesion: 1.0
Nodes (1): Schriftgewichte: 400 Body / 500 Buttons-Subheads / 600 Headlines-Wordmark

### Community 54 - "Backup Headline"
Cohesion: 1.0
Nodes (1): Backup-Headline: 'Termine. Anlagen. Teile. In einer App.'

## Knowledge Gaps
- **205 isolated node(s):** `HeroVisual (Desktop+Phone Mockup)`, `FeatureBlock Component (reusable)`, `CTA: 'Beta-Liste eintragen'`, `Pricing Promise: 'Jährlich · 2 Monate gratis'`, `Feature: PWA-Installation (eingeschränkt offline)` (+200 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `BetaListForm onSubmit`** (2 nodes): `onSubmit()`, `BetaListForm.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `DemoRequestForm onSubmit`** (2 nodes): `onSubmit()`, `DemoRequestForm.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Faq Component`** (2 nodes): `Faq()`, `Faq.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `FeatureBlock Component`** (2 nodes): `FeatureBlock()`, `FeatureBlock.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `FinalCta Component`** (2 nodes): `setFromHash()`, `FinalCta.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Hero Component`** (2 nodes): `Hero.tsx`, `Hero()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `HeroVisual Component`** (2 nodes): `HeroVisual.tsx`, `HeroVisual()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Impressum Page`** (2 nodes): `impressum-page.tsx`, `ImpressumPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Landing Page (Home)`** (2 nodes): `landing-page.tsx`, `Home()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `MarketingFooter Component`** (2 nodes): `MarketingFooter.tsx`, `MarketingFooter()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PainBlock Component`** (2 nodes): `PainBlock.tsx`, `PainBlock()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PilotStatus Component`** (2 nodes): `PilotStatus.tsx`, `PilotStatus()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PricingToggle Component`** (2 nodes): `PricingToggle.tsx`, `PricingProvider()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `RoiBlock Component`** (2 nodes): `RoiBlock.tsx`, `RoiBlock()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `RootLayout Component`** (2 nodes): `root-layout.tsx`, `RootLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `TechStackStrip Component`** (2 nodes): `TechStackStrip.tsx`, `TechStackStrip()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ThreeStepSolution Component`** (2 nodes): `ThreeStepSolution.tsx`, `ThreeStepSolution()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `TrustBlock Component`** (2 nodes): `TrustBlock.tsx`, `TrustBlock()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Annual Billing Rationale`** (2 nodes): `Annual-Billing-Discount: 2 Monate gratis (~17% Rabatt)`, `Rationale: Annual-Default verbessert LTV (17% Rabatt = 2 Monate gratis, Standard im Markt)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `brand.config.ts`** (1 nodes): `brand.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `tailwind.config.ts`** (1 nodes): `tailwind.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Datenschutz Page`** (1 nodes): `datenschutz-page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `FeatureSection Component`** (1 nodes): `FeatureSection.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `MarketingHeader Component`** (1 nodes): `MarketingHeader.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `MobileNavSheet Component`** (1 nodes): `MobileNavSheet.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Pricing Component`** (1 nodes): `Pricing.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PricingCard Component`** (1 nodes): `PricingCard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Unit Economics: ARPU`** (1 nodes): `Unit Economics: ARPU €39/Monat (gewichtet 60/30/10)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Unit Economics: LTV`** (1 nodes): `Unit Economics: LTV ~€1.330`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Unit Economics: CAC`** (1 nodes): `Unit Economics: CAC blended Ziel <€50`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Pilot Contract Pricing`** (1 nodes): `Pilotkunden-Sondervertrag: €5.000 einmalig (NICHT SaaS-Modell)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `White-Label Add-On`** (1 nodes): `Add-On: White-Label-Lizenz €500/Monat pro Innung/Verband`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Brand Mission`** (1 nodes): `Brand-Mission: Wartungs-Overhead von ~8h auf <2h pro Woche reduzieren`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Status Color: Overdue`** (1 nodes): `Status: overdue (Surface #FAECE7 / Border #F5C4B3 / Text #712B13)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Status Color: Info`** (1 nodes): `Status: info (Surface #E6F1FB / Border #B5D4F4 / Text #0C447C)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Typography Weights`** (1 nodes): `Schriftgewichte: 400 Body / 500 Buttons-Subheads / 600 Headlines-Wordmark`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backup Headline`** (1 nodes): `Backup-Headline: 'Termine. Anlagen. Teile. In einer App.'`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Torqr (Produkt)` connect `Brand Voice & Anti-Tonality` to `Hero Section & Persona`, `Logo & Accent Palette`, `Strategic Marketing Docs`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `TorqrWordmark` connect `Color Token Palette` to `Page Chrome & Trust Signals`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `Workflow: Mobile Dashboard-Übersicht mit KPI-Kacheln und anstehenden Wartungen` connect `Mobile-First Feature Claims` to `Mobile Dashboard Capabilities`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Hero Image — Dashboard Desktop Screenshot` (e.g. with `Marketing Claim: 'Volle Übersicht über Kunden und anstehende Wartungen'` and `Marketing Claim: Moderne, aufgeräumte SaaS-Oberfläche (kein Excel-Workflow)`) actually correct?**
  _`Hero Image — Dashboard Desktop Screenshot` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `Hero GIF: wartungs-checklist.gif` (e.g. with `Marketing-Claim: 'Zentrale Wartungsübersicht — alle Kunden & Systeme auf einen Blick'` and `Marketing-Claim: 'Mobile-first für den Außendienst'`) actually correct?**
  _`Hero GIF: wartungs-checklist.gif` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `HeroVisual (Desktop+Phone Mockup)`, `FeatureBlock Component (reusable)`, `CTA: 'Beta-Liste eintragen'` to the rest of the system?**
  _205 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Brand Voice & Anti-Tonality` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._