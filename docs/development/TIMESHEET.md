# Torqr MVP — Entwicklungszeiterfassung

**Projekt:** Torqr — Kundenverwaltungs- und Wartungsplattform
**Entwickler:** Y. Dorth
**Stundensatz:** 95 €/Std — *günstig für Senior Full-Stack (Marktüblich 90–130 €/h)*
**Stand:** 2026-04-28

---

## Executive Summary

| Metrik | Wert |
|---|---|
| Echtzeit gesamt (deine Arbeit mit Claude) | **~80 h** (Teil 1: ~20 h · Teil 2: ~50 h · Teil 3: ~10 h) |
| Solo-Dev-Äquivalenz gesamt (Senior Full-Stack, ohne KI) | **~539 h** (Teil 1: 145 h · Teil 2: 312 h · Teil 3: 82 h) |
| Effizienzfaktor (Solo / Echtzeit) | **~6.7 ×** |
| MVP-Wert @ 95 €/h | **~51.205 €** |

*95 €/h ist auf der günstigen Seite des marktüblichen Bands für Senior Full-Stack-Entwicklung (90–130 €/h). Der Effizienzfaktor zeigt, welchen Solo-Dev-Aufwand dieselbe Leistung konventionell gebunden hätte.*

*Teil 2 ist Git-basiert geschätzt (Tier S/M/L/XL). Teil 3 wird ab der nächsten Sitzung automatisch über Hooks ergänzt.*

---

## Teil 1 — MVP-Start (11.12.2025 – 09.01.2026)

> Historische Erfassung, unverändert. Sprints 1–5 mit detaillierter Phasen-Aufschlüsselung. Stundensatz 90–110 €/h (Originalkalkulation).

### 1. Geschätzte Entwicklungszeit (Standard Solo-Entwicklung)

Diese Kalkulation basiert auf realistischen Zeitschätzungen für einen erfahrenen Full-Stack-Entwickler ohne KI-Assistenz.

#### Phase 1: Projekt-Setup & Architektur (11.-12.12.2025)
| Aufgabe | Geschätzte Zeit |
|---------|-----------------|
| Next.js 14 Projekt-Setup, Konfiguration | 2h |
| Prisma Schema Design & Datenbankmodellierung | 3h |
| TypeScript Konfiguration & Types Setup | 2h |
| UI Library Integration (shadcn/ui, Tailwind) | 3h |
| Git Repository & Dokumentation | 1h |
| **Summe Phase 1** | **11h** |

#### Phase 2: Sprint 1 - Authentifizierung & Sicherheit (12.-15.12.2025)
| Aufgabe | Geschätzte Zeit |
|---------|-----------------|
| Session-basierte Authentifizierung (Lucia) | 6h |
| Login/Registrierung UI & Formvalidierung | 4h |
| Middleware & Protected Routes | 3h |
| Password Hashing (Argon2) Integration | 2h |
| Auth Helper Functions & Session Management | 3h |
| Fehlerbehandlung & Toast Notifications | 2h |
| Testing & Debugging | 3h |
| **Summe Sprint 1** | **23h** |

#### Phase 3: Sprint 2 - Kundenverwaltung (07.-08.01.2026)
| Aufgabe | Geschätzte Zeit |
|---------|-----------------|
| Customer CRUD API (4 Endpoints) | 8h |
| Zod Validation Schemas | 2h |
| Customer List Page mit Suche & Filter | 6h |
| Customer Detail Page | 4h |
| Customer Create/Edit Modal | 5h |
| Delete Confirmation & Error Handling | 2h |
| Responsive Design & UI Polish | 3h |
| Testing & Bug Fixes | 4h |
| **Summe Sprint 2** | **34h** |

#### Phase 4: Sprint 3 - Heizungsverwaltung & Wartungen (08.-09.01.2026)
| Aufgabe | Geschätzte Zeit |
|---------|-----------------|
| Heater CRUD API (6 Endpoints) | 10h |
| Maintenance API mit Photo Upload | 8h |
| Supabase Storage Integration | 4h |
| Heater Form Modal & Validierung | 5h |
| Maintenance Form mit Multi-Photo Upload | 6h |
| Maintenance History Component | 4h |
| Auto-Berechnung Wartungstermine | 3h |
| Wartungswarnungen & Badges | 2h |
| Transaction-basierte DB Updates | 3h |
| Photo Preview & Fullscreen Viewer | 2h |
| Testing & Debugging | 5h |
| **Summe Sprint 3** | **52h** |

#### Phase 5: Sprint 5 - Dashboard Statistiken (09.01.2026)
| Aufgabe | Geschätzte Zeit |
|---------|-----------------|
| Dashboard Statistics API | 3h |
| Dashboard UI mit 4 Stat Cards | 4h |
| Loading States & Error Handling | 2h |
| Responsive Grid Layout | 2h |
| Testing & Integration | 2h |
| **Summe Sprint 5** | **13h** |

#### Zusätzliche Arbeiten
| Aufgabe | Geschätzte Zeit |
|---------|-----------------|
| Code Reviews & Refactoring | 4h |
| Dokumentation (README, API Docs) | 3h |
| Git Commits & Version Control | 2h |
| Bug Fixing & Hotfixes | 3h |
| **Summe Zusätzlich** | **12h** |

---

#### **Gesamtsumme Geschätzte Entwicklungszeit: 145 Stunden**

**Minimale Schätzung (optimale Bedingungen):** 120 Stunden
**Realistische Schätzung (inkl. Debugging):** 145 Stunden
**Mit Puffer (komplexe Bugs):** 160 Stunden

---

### 2. Tatsächlich Investierte Zeit (Mit Entwicklungsassistenz)

Basierend auf Git-Commits, Session-Timestamps und Entwicklungsprotokoll.

#### Entwicklungssitzungen

| Datum | Zeitraum | Dauer | Aktivitäten |
|-------|----------|-------|-------------|
| **11.12.2025** | 15:21 - 16:04 | 0.7h | Initial commit, Projekt-Setup |
| **11.12.2025** | 20:25 - 23:07 | 2.7h | Next.js App Setup, Basis-Konfiguration |
| **12.12.2025** | 10:36 - 11:00 | 0.4h | Login & Auth Success |
| **15.12.2025** | 11:04 - 13:26 | 2.4h | Authentication, Middleware, Sprint 1 abgeschlossen |
| **17.12.2025** | 14:20 - 14:30 | 0.2h | Auth Helpers |
| **07.01.2026** | 14:00 - 14:43 | 0.7h | DB Connection, User CRUD API |
| **08.01.2026** | 08:59 - 10:36 | 1.6h | Sprint 2: Customer Management komplett |
| **08.01.2026** | 14:39 - 15:54 | 1.3h | Sprint 3: Heater & Maintenance (Teil 1) |
| **08.01.2026** | 15:00 - 15:54 | 0.9h | Sprint 3: Photo Upload & Maintenance History |
| **09.01.2026** | 08:59 - 09:15 | 0.3h | Dashboard Statistics |
| **Zusätzlich** | - | 7-10h | Konzeption, Planung, Reviews, Testing |

#### **Gesamtsumme Tatsächliche Zeit: ~18-22 Stunden**

**Aktive Coding-Sessions:** 11.2 Stunden
**Konzeption & Planung:** 4-6 Stunden
**Testing & Debugging:** 3-5 Stunden
**Gesamt:** 18-22 Stunden

---

### 3. Effizienzanalyse

| Metrik | Wert |
|--------|------|
| Geschätzte Solo-Zeit | 145h |
| Tatsächliche Zeit | 20h (Durchschnitt) |
| **Zeitersparnis** | **125h (86%)** |
| **Effizienzsteigerung** | **7.25x schneller** |

#### Zeitersparnis nach Phase

| Phase | Geschätzt | Tatsächlich | Ersparnis |
|-------|-----------|-------------|-----------|
| Setup & Architektur | 11h | 1.5h | 86% |
| Sprint 1 (Auth) | 23h | 3.5h | 85% |
| Sprint 2 (Customers) | 34h | 2.2h | 94% |
| Sprint 3 (Heaters/Maintenance) | 52h | 6.5h | 87% |
| Sprint 5 (Dashboard) | 13h | 1.3h | 90% |
| Zusätzlich | 12h | 5h | 58% |

---

### 4. MVP-Preiskalkulation

#### Option A: Realistische Entwicklungszeit-Basis
```
Basis: 145 Stunden geschätzte Entwicklungszeit
Stundensatz: 90-110 €/Std

Kalkulation (90€):  145h × 90€  = 13.050 €
Kalkulation (110€): 145h × 110€ = 15.950 €

Empfohlener Preis: 13.000 - 16.000 €
```

#### Option B: Minimale Basis (Wettbewerbsfähig)
```
Basis: 120 Stunden (optimistisch)
Stundensatz: 90-110 €/Std

Kalkulation (90€):  120h × 90€  = 10.800 €
Kalkulation (110€): 120h × 110€ = 13.200 €

Empfohlener Preis: 10.800 - 13.200 €
```

#### Option C: Wertbasierte Preisgestaltung
```
Basis: 160 Stunden (mit Puffer für Debugging)
Stundensatz: 100€/Std (Durchschnitt)

Kalkulation: 160h × 100€ = 16.000 €

Empfohlener Preis: 15.000 - 18.000 €
(Inkl. Wert für moderne Architektur, Sicherheit, UX)
```

---

### 5. Feature-Übersicht (Verkaufsargument)

#### Implementierte Features

##### Core Features
- **Authentifizierung & Sicherheit**
  - Session-basiertes Login/Registrierung
  - Argon2 Password Hashing
  - Protected Routes & Middleware
  - Sichere Session-Verwaltung

- **Kundenverwaltung**
  - Vollständiges CRUD (Create, Read, Update, Delete)
  - Detaillierte Kundenprofile
  - Adressverwaltung
  - Kontaktinformationen

- **Heizungsverwaltung**
  - Heizungserfassung pro Kunde
  - Modell, Seriennummer, Installationsdatum
  - Wartungsintervalle (1-24 Monate)
  - Automatische Wartungstermin-Berechnung

- **Wartungstracking**
  - Wartungshistorie mit Notizen
  - Multi-Photo Upload (bis 5 Fotos)
  - Foto-Viewer mit Fullscreen
  - Cloud-Storage (Supabase)

- **Dashboard & Statistiken**
  - Echtzeit-Statistiken
  - Überfällige Wartungen (kritisch)
  - Anstehende Wartungen (Warnung)
  - Kunden- & Heizungsübersicht

##### UI/UX Features
- Modernes, responsives Design
- Toast-Benachrichtigungen
- Loading States
- Fehlerbehandlung
- Deutsche Lokalisierung

##### Technische Qualität
- TypeScript (100% typsicher)
- Next.js 14 App Router
- Prisma ORM
- Transaction-basierte DB Updates
- RESTful API Design
- Zod Validation

---

### 6. Empfohlene Preisstrategie für ersten Kunden

#### Staffelpreise
1. **Early Adopter Preis:** 10.500 € (Rabatt für Feedback & Testimonial)
2. **Standard MVP Preis:** 13.500 € (Empfohlen)
3. **Premium (mit Support):** 16.000 € (inkl. 3 Monate Support & Anpassungen)

#### Begründung gegenüber Kunde
- "Das MVP basiert auf ~140 Stunden Entwicklungsarbeit"
- "Moderne Tech-Stack mit Best Practices"
- "Vollständig typsicher, skalierbar & wartbar"
- "Production-ready mit Authentifizierung & Sicherheit"
- "Responsive Design für Desktop & Mobile"

---

### 7. ROI-Analyse (ursprünglich)

| Metrik | Wert |
|--------|------|
| Investierte Zeit | 20h |
| Ihre Kosten (100€/h) | 2.000 € |
| MVP-Verkaufspreis | 13.500 € |
| **Gewinn** | **11.500 €** |
| **ROI** | **575%** |
| **Stundenlohn (effektiv)** | **675 €/h** |

---

### Zusammenfassung Teil 1

- **MVP-Wert:** 13.000 – 16.000 €
- **Entwicklungszeit:** 145 Stunden (geschätzt für Solo-Dev)
- **Tatsächlicher Aufwand:** ~20 Stunden
- **Effizienzsteigerung:** 7× schneller
- **Empfohlener Verkaufspreis:** 13.500 € (Standard)

*Dokumentation Teil 1 erstellt am:* 09.01.2026 · *Version:* 1.0

---

## Teil 2 — Retro-Rekonstruktion (10.01.2026 – 22.04.2026)

> Git-basierte Schätzung. Eine Zeile pro Arbeitstag (nur Tage mit ≥1 Commit). Tier S/M/L/XL bestimmt beide Werte gemeinsam.

Tier-Referenz:

| Tier | Echtzeit (du) | Solo-Dev-Äquiv. | Typisches Beispiel |
|---|---|---|---|
| S | 30 min | 2 h | Typo / Copy / 1-Datei-Tweak |
| M | 1 h | 6 h | Einzelfeature, 2–5 Dateien |
| L | 3 h | 16 h | Neue Seite / Flow / Multi-File-Refactor |
| XL | 5 h | 32 h | Sprint-Scope (Model / Migration / Cross-Cutting) |

| Datum | Tier | Echtzeit | Solo-Dev-Äquiv. | Sprint / Bereich | Aktivitäten | Commits |
|---|---|---|---|---|---|---|
| 2026-01-12 | XL | 5 h | 32 h | Heizungs-Overhaul + Deploy | Heizungssystem erweitert (DE-Heizungstypen, Konfig), Kundenliste modernisiert, Wartungsmanagement, Dashboard mit Upcoming/Recent, Prisma 7 + Vercel Deployment-Fixes, deutsche Login-Texte | 23 |
| 2026-01-13 | XL | 5 h | 32 h | React Query + v1.0 Release | React Query + Komponenten-Architektur-Umbau, Quick-Wartung vom Dashboard, umfangreiche Doku (Projektdoku, Demo-Checklist, Sprint 3/4), v1.0.0 Production-Release | 13 |
| 2026-01-14 | S | 30 min | 2 h | Dokumentation | Doku-Merge, Development-Branch-Sync | 3 |
| 2026-01-15 | S | 30 min | 2 h | Kostenschätzung | Kostenaufstellung | 1 |
| 2026-03-06 | S | 30 min | 2 h | Trivial | Test-Commit | 1 |
| 2026-04-09 | S | 30 min | 2 h | Login-Logging | Login Activity Logging | 1 |
| 2026-04-13 | XL | 5 h | 32 h | Sprint 4 — Email Automation | Resend-Client, React-Email-Templates (Reminder + Weekly Summary), Daily- & Weekly-Cron-Routes, HMAC-Unsubscribe-Token + öffentliche Seite, Customer-Form Email-Suppress-Toggle, Vitest-Test-Infrastruktur | 14 |
| 2026-04-14 | L | 3 h | 16 h | Cal.com Integration + Fixes | Cal.com Webhook-Handler (HMAC-SHA256), Customer-Booking-Page, Email-Opt-In-Indicator, Hydration-Fix Dashboard, Unsubscribe via APP_URL, Reminder-Template-Verbesserung | 9 |
| 2026-04-15 | XL | 5 h | 32 h | Account-Page Foundation | User-Modell (companyName, emailWeeklySummary, reminderGreeting/Body), /api/user/* Routes (profile, password, preferences, send-weekly-summary), Zod-Schemas, useUser React-Query-Hook, Account-Cards (Profile, Password, Notifications, Email-Actions) | 13 |
| 2026-04-16 | XL | 5 h | 32 h | Account + Mobile + Sprint 7 + Admin-Basis | Account-Page Merge, Mobile Responsiveness (iOS-Zoom-Fix, 44 px Touch-Targets, responsive Forms), Sprint 7 Bugfixes (#16/#17 Cache-Invalidation, #19/#21 Pflichtfelder, #12 Manueller Reminder), Admin-Panel Foundation (requireAdmin, /api/admin/stats, /api/admin/users) | 24 |
| 2026-04-17 | XL | 5 h | 32 h | Admin-Panel komplett + System-Overhaul-Spec | Admin-UI komplett (Layout, Overview, Users, User-Detail, Email-Log, Cron-Monitor), useAdmin React-Query-Hooks, System-Model-Overhaul Design-Spec, Backlog-Restrukturierung, Account-Page Admin-Link | 11 |
| 2026-04-20 | XL | 5 h | 32 h | Sprint 11 — System-Model-Overhaul | SystemCatalog + CustomerSystem Prisma-Models (AcSubtype/StorageSubtype Enums), Heater→CustomerSystem Migration (API, Email, Maintenance), GET/POST /api/catalog + customer-systems CRUD, SystemTypeSelector + CatalogPicker + SystemAssignmentModal, Seed mit 224 Heizungs-Einträgen | 14 |
| 2026-04-21 | XL | 5 h | 32 h | Sprints 18 + 19 + 20 + Rebrand + Audit | Digitale Wartungs-Checklist (3-Step-Modal, per-SystemType Defaults, CustomerSystemChecklistItem Model), Weekly-Summary-Rework (Section-Layout, 7 parallele Queries), Editable Email-Templates mit Platzhaltern, Follow-Up-Jobs (Model, API, Hook, UI, Badge), Install-Date-Checkbox, Rebranding (Green/Amber + Pulse-Icon), Sentry-Config, umfassender Codebase-Audit | 54 |
| 2026-04-22 | XL | 5 h | 32 h | Sprints 21 + 22 + 23 + Catalog + Timesheet | Credential-Rotation, RLS deny-all auf allen 13 Tabellen, Supabase-Migration auf neues Projekt (eu-central-1), Delete-Account / Danger Zone, Company-Multi-User Architektur (companyId-Scoping über 19 API-Routes, OWNER/TECHNICIAN-Rollen, Employee-Management, Technician-Assignment, rollenbewusstes Dashboard + Weekly-Summary), Turbopack-Fix via Admin-Auth-Split, Catalog-Validation-Fix + Seed-Erweiterung (904 Einträge), Timesheet Auto-Track Spec + Plan + Implementation | 33 |

---

## Teil 3 — Live-Tracking (ab erster Hook-Sitzung)

> Echtzeit ist **gemessen** (Summe der Hook-erfassten Sitzungsdauern). Solo-Dev-Äquivalenz weiterhin per Tier (KI-Beurteilung).

| Datum | Tier | Echtzeit (gem.) | Solo-Dev-Äquiv. | Sprint / Bereich | Aktivitäten | Commits |
|---|---|---|---|---|---|---|
| 2026-04-23 | XL | 5 h | 32 h | Sprints 24 + 25 + 26 + 27 | **Sprint 24** Technician Workload Management (AssigneeBadge, Employee-Detail-Page, URL-driven Assignee-Filter, Auto-Reassign bei Deaktivierung, 8 neue Tests). **Sprint 25** Termine-Page + Cal.com Reschedule/Cancel (volle `/dashboard/termine` Seite mit List+Kalender, Booking-Details-Drawer, Reschedule+Cancel-Modals, Cal.com v2 API-Client, 2 neue Email-Templates, Booking-Status-Metadaten + Migration, HMAC-Fail-Closed-Fix). **Sprint 26** React-Query-Konsistenz + Permission-Hardening + Rate-Limiting (wartungen + customer-edit Pages auf useQuery, 3 Components auf useMutation, DELETE-Routes auf requireOwner #57, Upstash-Redis-Rate-Limiter #59/#66). **Sprint 27** System-Photos (up to 5 photos pro CustomerSystem, Variant-B-Permissions, SystemPhotosCard, 12 neue Tests, Migration live auf Prod-Supabase). **Bugfixes** Termine-Dropdown-Clip + FileList-live-Reference. Hook-Sessions nur fragmentarisch erfasst (11 Min in 3 Konsultations-Blips) — Hauptarbeit per Git-Timespan rekonstruiert. | 66 |
| 2026-04-24 | S | 0 h | 2 h | Sprint 28 — Wartungsteile Phase A (Foundation) | Versehentlicher `kundenwartungsteile`-Reference-Folder-Commit auf Feature-Branch korrigiert (cherry-pick → main als `680c962`, anschließend `git reset --mixed HEAD~1` auf Feature). Pre-Session-2-Cleanup ohne Feature-Code-Änderung. Hauptarbeit dieses Sprints findet in chained Sessions am 04-27 statt. | 1 |
| 2026-04-27 | XL | 2.3 h | 32 h | Sprint 28 — Wartungsteile Phase A (Tasks 12–31) | Wartungsteile-Materialmanagement Phase A in 8 chained Sessions (4–11) via subagent-driven-development executiert. **API-Schicht (Tasks 12–18):** POST/DELETE Customer-System-Overrides mit Cross-Tenant-FK-Guards (Decision §4); GET effective-parts mit TECHNICIAN-Assignee-Scoping; POST /api/maintenances erweitert um partsUsed (transaktional, MAINTENANCE_USE-Movements + negativeStockWarnings, N3-Policy); DELETE mit R1-Reversal über CORRECTION-Movements; GET /api/bookings/[id]/packing-list; dashboard/stats inventoryBelowMinStockCount (OWNER-only). **Hooks (Tasks 19–21):** 11 React Query Hooks über 5 Files (Decimal-as-string, ApiResponse-Envelope, Decision §13). **UI-Schicht (Tasks 22–31):** Sidebar-Nav-Erweiterung mit OWNER-Low-Stock-Badge; volle `/dashboard/wartungssets` List- + Detail-Pages (RHF + zodResolver, TOOL→inventoryItemId-Clearing); `/dashboard/lager`-Page mit Status-Badge + Filter; InventoryDrawer mit Bewegungshistorie + RESTOCK/CORRECTION-Forms + shadcn AlertDialog; PartsListCard auf System-Detail mit ADD/EXCLUDE-Override-Management (Server-GET-Include-Erweiterung + Sleeper-queryKey-Bug-Fix); MaintenanceChecklistModal um Step 2.5 "Teileverbrauch" erweitert (4-Step-Wizard, partsUsed-Submit-Flow, negativeStockWarnings-Toasts); Packing-List Print-View mit Drawer-Button; LowStockDashboardCard auf `/dashboard`; WeeklySummaryEmail Lager-Section. ~6 Fix-Rounds aus Code-Quality-Reviews (badge-variants, mounted-step, sibling-card-layout, queryKey-Invalidation, 409-cache-invalidation, set-reference-stability). **Cross-cutting:** Decision §13 (Strict-Hook-Typing) etabliert; Decision §4 durchgehend angewandt; Vitest-Startup-Flakiness auf Windows mehrfach beobachtet (Re-Run-Workaround dokumentiert). Echtzeit: 1.2 h hook-erfasst (Sessions 6–8) + ~1.1 h per Commit-Timestamps geschätzt (Sessions 9–11 chained, 13:55–15:02). | 37 |
| 2026-04-28 | L | 2.7 h | 16 h | Sprint 28 — Wartungsteile Phase A Abschluss (Sessions 13 + 14) | **Pilot-Test-Feedback (6 Issues):** Einheit-Dropdown via `<datalist>` in 4 Forms (set-item, override, ad-hoc, inventory) mit neuer `src/lib/units.ts`-Konstante; EXCLUDE-Picker auf Multi-Select mit Checkboxen + Accent-Ring-Hover umgebaut; `useUpdateCustomerSystem` invalidiert jetzt `['employee']`/`['employees']`; manuelle `POST /api/bookings` erbt `system.assignedToUserId`, `packing-list`-ACL akzeptiert Booking- ODER System-Assignee (+ neuer Vitest); idempotentes `scripts/create-storage-buckets.ts` (Bucket `maintenance-photos` fehlte auf neuem Supabase-Projekt — angelegt). **Task 36 (destructive):** `customer_systems.requiredParts` aus Schema gedroppt, Migration `20260428061650_drop_customer_systems_required_parts` generiert, Code-Refs aus 5 Dateien entfernt, einmaliges Migrations-Script gelöscht, SQL-NOTE über Drift-Zeile in der additiven Migration ergänzt (Decision §1). **Operativer Lapsus dokumentiert:** `prisma migrate dev` lief direkt gegen Prod-Supabase (Single-Project-POC-Topologie ohne separate Dev-DB) — Datenmäßig ohne Schaden, da Task 32 schon vorher gelaufen war, aber Lesson-Learned im Runbook festgehalten. **Task 37:** BACKLOG.md um N-1..N-12 (Phase B+) und Sprint-28-Sign-Off ergänzt. **Merge:** `feature/wartungsteile-phase-a` → `main` (no-ff, 96 Files, +18.439 / -1.590 LOC, 65 Commits). **Restoration-Anker:** Git-Tag `pre-sprint-28-2026-04-28` auf `668523c` gesetzt. **Operations-Doc:** `docs/operations/sprint-28-rollback-plan.md` + `sprint-28-rollback.sql` — zwei-stufiger Plan (soft via Feature-Flag, hard via Reverse-SQL mit Verifikations-Asserts in TX gewrappt) inklusive Pre-Rollback-Safety-Checkliste, pg_dump-Vorlage, Vercel-Promote-Pfad, Verifikations-Tabelle, Rollback-Log-Vorlage. Final: 324/324 Tests, tsc clean, build green. | 12 |
<!-- Auto-appended at session start by CLAUDE.md "Timesheet Auto-Update" rule -->
