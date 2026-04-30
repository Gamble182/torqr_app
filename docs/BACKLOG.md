# Backlog — Torqr

> Single source of truth for all planned, in-progress, and completed work.
> Open items are prioritized and assigned to sprints as needed.
> All completed work is recorded here for traceability.

---

## Format

| # | Area | Description | Priority | Found |
|---|------|-------------|----------|-------|

Priority levels: **Critical** · **High** · **Medium** · **Low**

---

## Open Items

### Architecture & Security

| # | Area | Description | Priority | Found |
|---|------|-------------|----------|-------|
| 49 | Infra | Delete old Supabase project (`vvsmxzebaoslofigxakt`, eu-west-1) — migrated to new project (`hwagqyywixhhorhjtydt`, eu-central-1) via Vercel integration. Delete once confident everything works. | Low | 2026-04-22 |
| 60 | Architecture | `CatalogPicker` "Ändern" button passes `entries[0]` to `onChange` when clearing — semantically incorrect. `onChange` signature should support `null` entry for clear action. | Low | 2026-04-22 |

### Workload & Scheduling — Upcoming Features

| # | Area | Description | Priority | Found |
|---|------|-------------|----------|-------|
| 63 | Feature | Drag-and-drop rescheduling on calendar view. | Low | 2026-04-23 |
| 64 | Feature | Weekly/daily calendar modes. | Low | 2026-04-23 |

### System Model — Follow-up

_(no open items)_

### Cal.com Booking Integration

Booking is functional (webhook + customer resolution + system link + Terminiert badge). One follow-up remains.

| # | Area | Description | Priority | Found |
|---|------|-------------|----------|-------|
| 33 | Feature | Multi-system booking — if a customer has multiple systems with the same maintenance interval, allow selecting all for a single appointment. | Medium | 2026-04-16 |

### Cal.com Configuration

Generic "Wartungstermin" event type configured (60 min, Mon–Fri 7:30–17:00). Per-system-type event types deferred until pilot feedback.

| # | Area | Description | Priority | Found |
|---|------|-------------|----------|-------|
| 42 | Config | Per-system-type event durations — different Cal.com event types per system type (Wärmepumpe, Gas, Öl, etc.) if pilot customer needs it. Deferred until feedback. | Low | 2026-04-16 |
| 44 | Config | Target email — booking confirmation currently goes to personal email. Change to business address when available. | Low | 2026-04-16 |
| 51 | Decision | Cal.com multi-tenant strategy — current single-account setup doesn't scale beyond pilot. Options: Cal.com Teams, per-user Cal.com accounts, or custom booking UI via Cal.com API. Decide post-pilot. | Low | 2026-04-22 |
| 52 | Testing | Test full booking flow end-to-end — customer receives reminder, clicks Cal.com link, books, webhook fires, booking appears in torqr dashboard. | Medium | 2026-04-22 |
| 11 | Decision | Calendar integration strategy — recommendation: do NOT build own calendar. Use Cal.com for scheduling, let users sync to Google/Outlook via Cal.com. Embed iframe if needed later. | Low | 2026-04-14 |

### Email System

_(no open items)_

### Field Service & Mobile

Features for technicians working on-site. Digital checklist (#35) is live. Follow-up jobs (#27) are live.

_(no open items)_

### Workforce & Scheduling

_(no open items — calendar view shipped as part of Sprint 25 Termine page)_

### Data Import

| # | Area | Description | Priority | Found |
|---|------|-------------|----------|-------|
| 25 | Feature | CSV/Excel customer import — import customers from external tools (e.g. Tooltime export). Map columns to Customer model fields. | Medium | 2026-04-16 |

### Architecture & Account

_(no open items)_

### Bookkeeping

| # | Area | Description | Priority | Found |
|---|------|-------------|----------|-------|

### Marketing & Go-to-Market

Marketing-Briefing als Single Source of Truth: [`docs/marketing/MARKETING_BRIEFING.md`](./marketing/MARKETING_BRIEFING.md). Items hier sind die operativen Folge-Tasks, die der Marketing-Agent oder ein externer Partner umsetzen kann.

| # | Area | Description | Priority | Found |
|---|------|-------------|----------|-------|
| 69 | Compliance | **Datenschutz + Impressum vor Public-Launch finalisieren** — Pages existieren als Skeleton (Sprint 29), aber: 4× `TODO Anwalt`-Marker in Datenschutz brauchen Anwalt-Review · Impressum-Adresse `[Straße + Hausnummer]` und `[PLZ] [Ort]` durch echte Werte ersetzen · USt-ID einfügen oder Sektion entfernen · Cookie-Banner-Entscheidung (aktuell nur Auth-Session-Cookie, technisch optional, aber DSGVO-Best-Practice). | Critical (vor Public-Launch) | 2026-04-28 |
| 87 | Marketing | **Hero/Feature-GIFs optimieren** — beide aktuelle GIFs (`wartungs-checklist.gif`, `checklist-mobile.gif`) sind 7.9 MB → page-weight 16 MB → Lighthouse Mobile Performance 75. Target: ≤ 500 KB pro GIF via gifsicle/ezgif. Ohne Fix bleibt Performance unter dem 90er-Target. | High (vor Public-Launch) | 2026-04-30 |
| 88 | Marketing | **`workload-desktop.png` Screenshot fehlt** — Feature-Block #4 (Multi-User & Workload) zeigt sonst broken-image. Speicherpfad: `public/marketing/features/workload-desktop.png` (1440×900, ≤ 500 KB). | High (vor Public-Launch) | 2026-04-30 |
| 89 | Marketing | **OG-Image (`public/og-image.png`) fehlt** — 1200×630 Wordmark + Tagline + Hero-Headline. Ohne dies zeigen Social-Shares (LinkedIn, Facebook, WhatsApp) blanke Vorschau. | High (vor Public-Launch) | 2026-04-30 |
| 90 | A11y | **Color-Contrast-Findings (axe-CLI)** — Hero-Badge `border-brand-200` und 3× TechStackStrip-Logos (`text-foreground/80` + `opacity-60`) unter WCAG AA. Lighthouse A11y trotzdem 97/100. Polish-Item, nicht-blockierend. | Medium | 2026-04-30 |
| 91 | Marketing | **ROI-Rechner-Tool** als V2-Inline-CTA in `RoiBlock` (TODO-Marker in [RoiBlock.tsx](../src/components/marketing/RoiBlock.tsx) hinterlegt). Interaktives Tool: Wartungsverträge × Stundensatz → ROI-Faktor. Lead-Magnet-Potenzial (siehe #75). | Medium | 2026-04-30 |
| 92 | Decision | **Cal.com Multi-Customer-Strategie** — aktuell ein einziger Event-Type für alle Pilot-Kunden. Bei mehreren Kunden gleichzeitig: Pro Kunde eigenes Event-Type / Routing über metadata `customerId` / Bezahlmodell. Decision vor Phase-2 (≥ 5 Kunden) nötig. | Medium | 2026-04-30 |
| 70 | Compliance | **AVV-Vertragsvorlage** (Art. 28 DSGVO) als PDF-Download im Onboarding. Voraussetzung für seriöse B2B-Akquise. | High | 2026-04-28 |
| 71 | Marketing | **Self-Service-Signup + Billing-Integration** (Stripe oder Paddle). Voraussetzung für SaaS-Phase. Aktuell sind Kundenanlage + Bezahlung manuell. | High | 2026-04-28 |
| 72 | Marketing | **Pitchdeck + One-Pager** für Innungs-/Handwerkskammer-Termine. PDF, brand-konform. | Medium | 2026-04-28 |
| 73 | Marketing | **Demo-Video** (~90 s, Smartphone-Hand-Recording) für Landingpage und Outbound. | Medium | 2026-04-28 |
| 74 | Marketing | **3 SEO-Cornerstone-Artikel** veröffentlichen: "Heizungswartung-Pflicht 2026", "Wartungsintervalle nach Gerätetyp", "DSGVO-konforme Kundenkommunikation für Heizungsbauer". | Medium | 2026-04-28 |
| 75 | Marketing | **Lead-Magnet-Tools**: Wartungsintervall-Rechner + Wartungsprotokoll-PDF-Vorlage als kostenloser Download (Email-Capture). | Medium | 2026-04-28 |
| 76 | Marketing | **Pilotkunden-Case-Study** (nach 6 Monaten Daten — ab Mitte 2026): Zeitersparnis-Quote, Zitat, Foto. Voraussetzung: Pilotkunden-Freigabe + Daten-Tracking. | Medium | 2026-04-28 |
| 77 | Marketing | **DSGVO-konforme Analytics** einrichten (Plausible oder Vercel Analytics + Posthog) — vor Launch der Landingpage. | Medium | 2026-04-28 |
| 78 | Brand | **Wordmark-Variationen** (horizontal, vertikal, monochrom, Negativ) als SVG-Set. | Medium | 2026-04-28 |
| 79 | Brand | **Social-Media-Asset-Pack** (LinkedIn, Instagram, Facebook) im Brand-Stil. | Low | 2026-04-28 |
| 80 | Brand | **Tagline-Validierung** — Hauptkandidat *"Die Wartungsakte für Heizungsbauer."* (Decision D-2) mit Pilotkunden + 3 Kollegen testen. Backup-Optionen siehe Briefing §11.1. | Medium | 2026-04-28 |
| 83 | Decision | **White-Label-Strategie**: Innungen aktiv ansprechen oder nur on-demand? Pricing-Modell klären (500 €/Monat pro Partner aus BMC). | Low | 2026-04-28 |
| 84 | Marketing | **CRM-Light für Lead-Management** (Outbound an Innungen, Pilotkunden-Funnel, Beta-Liste). Optionen: HubSpot Free, Notion-Datenbank, Airtable. | Low | 2026-04-28 |
| 85 | Marketing | **Email-Drip-Onboarding-Strecke** für Self-Service-Signups. Voraussetzung: #71 + #82. | Medium (nach #71) | 2026-04-28 |
| 86 | Marketing | **Daten-Export für DSGVO-Pflicht (Art. 20)** als Self-Service-Funktion (kein Marketing-Item per se, aber FAQ-relevant: "Was passiert mit meinen Daten beim Kündigen?"). Aktuell nur per DB-Dump möglich. | Medium | 2026-04-28 |

---

## Maybe / Future

Ideas worth keeping in mind but not planned for current sprints. No implementation until explicitly decided.

| # | Area | Description | Notes |
|---|------|-------------|-------|
| M-1 | Feature | PDF / Arbeitsbericht — export a completed maintenance checklist as a PDF work report for the customer. Would require a PDF generation library (e.g. `@react-pdf/renderer`) or a server-side rendering approach. | Requested by pilot customer context. Deferred until checklist feature is validated in production. |
| M-2 | Feature | Measurement fields on checklist — allow custom checklist items to capture numeric values (e.g. flue gas temperature, pressure reading) instead of just checkboxes. | Revisit after pilot feedback. |
| M-3 | Feature | Drag-and-drop reordering of custom checklist items per `CustomerSystem`. | Low priority; `sortOrder` field is already in the schema to support this later. |
| N-1 | Feature | **Packliste per E-Mail senden** (L2 variant) — owner requests packing list via email button; new `PackingListEmail` React-Email template. | Phase B. |
| N-2 | Feature | **Bestellworkflow** — order suggestions from low-stock alerts, supplier link templates, order status tracking. | Phase B. |
| N-3 | Feature | **Echtzeit-Lager-Alert-Mail** — S3 variant; per-event email on first threshold breach with debounce. | Phase B. |
| N-4 | Feature | **Multi-Wartungstyp** — add `maintenanceType: STANDARD \| INSPECTION \| EMERGENCY` to `MaintenanceSet`. | Additive schema change. |
| N-5 | Feature | **PDF-Import für Wartungssets** — install tesseract/ocrmypdf/poppler; parse manufacturer service-parts PDFs. | Phase B; requires OCR toolchain. Seed material exists at `kundenaustausch/Wartungsteile/wartungsheft_bosch_junkers.json` (30 sets / 163 parts, manually transcribed). |
| N-6 | Feature | **Per-Item-Foto** auf MaintenanceSetItem für Vor-Ort-Identifikation. | Phase B. |
| N-7 | Feature | **CSV/XLSX-Bulk-Import** for InventoryItems and MaintenanceSetItems. | Combine with #25. |
| N-8 | Integration | **Drittanbieter-Lager-Integration** (Sortly / Doron / Fifo). | Phase C. |
| N-9 | Integration | **Hersteller-Teile-Kataloge** (Bosch Pro, Grünbeck). | Phase D. |
| N-10 | Architecture | **Community-Wartungssets** — global defaults + tenant overrides (Variante C aus Spec Q1). | Phase D. |
| N-11 | UX | **Drag-and-Drop Reorder** für MaintenanceSetItems (Phase A ↑↓ only). | Pair with M-3. |
| N-12 | Testing | **Integration-test DB provisioning** — disposable Supabase test branch so Prisma query-shape bugs (relation names, include shapes) get caught before runtime. Phase A used `vi.mock('@/lib/prisma')` everywhere; trade-off documented in runbook Decision §9. | Phase B; revisit if pilot ops uncovers query-shape regressions. |

---

## Completed / Resolved

Items are grouped by sprint / work session, ordered newest first.

### Sprint 29 — Public Landingpage V1 (2026-04-29 → 2026-04-30)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 67 | Marketing | **Landingpage `torqr.de`** — Marketing-Landing ersetzt Login-Redirect-Placeholder. 10-Sektionen (MarketingHeader · Hero · Pain · 3-Step · Features · ROI · Pilot-Status · Trust · Pricing · FAQ · Final-CTA · MarketingFooter). Spec: `docs/superpowers/specs/2026-04-29-landingpage-design.md`. Plan: `docs/superpowers/plans/2026-04-29-landingpage.md` (35 Tasks). | 2026-04-30 |
| 68 | Marketing | **Pricing-Seite mit 3 Tiers** — `Pricing.tsx` mit Solo €29 / Professional €49 (highlight) / Enterprise €99, Monthly/Annual-Toggle (Annual = -2 Monate), Tier-spezifische Hash-CTAs (`#cta-beta-solo`, `#cta-beta-pro`, `#cta-demo`) mit Preselect im FinalCta-Form. | 2026-04-30 |
| — | Backend | **Beta-Lead + Demo-Request Persistenz** — Prisma-Models `BetaLead` + `DemoRequest`, Migration `20260429120000_landing_page_leads`, `/api/beta-leads` + `/api/demo-requests` Routes mit Zod-Validation, Rate-Limit (`BETA_LEAD` + `DEMO_REQUEST` Presets), Honeypot-Spam-Protection, DSGVO-Consent-Pflicht. | 2026-04-30 |
| — | Email | **Admin-Notification-Templates** — `BetaLeadAdminEmail.tsx` + `DemoRequestAdminEmail.tsx` (React Email), `sendBetaLeadNotification` + `sendDemoRequestNotification` in `email/service.tsx`. | 2026-04-30 |
| — | SEO | **SEO-Metadata + Structured Data** — `metadataBase`, OpenGraph, Twitter, JSON-LD `SoftwareApplication`-Schema, `sitemap.ts` (Home + Datenschutz + Impressum), `robots.ts` (Disallow `/dashboard/`, `/api/`, `/admin/`). | 2026-04-30 |
| — | Legal | **Datenschutz + Impressum als Skeleton-Pages** — `/datenschutz` + `/impressum` mit Pflicht-Sektionen (DSGVO Art. 6/15-21, §5 TMG, AVV-Liste, Streitschlichtung). 4× `TODO Anwalt`-Marker + Adresse-Platzhalter intentional → Pre-Launch-Tasks im Open-Backlog #69. | 2026-04-30 |
| — | Test | **348/348 Tests grün** — Tenant-Isolation-Audit erweitert um `EXEMPT_ROUTES` für public Marketing-Forms (`beta-leads`, `demo-requests`). Lighthouse Mobile: A11y 97 · BP 100 · SEO 100 · Performance 75 (siehe Open #87). | 2026-04-30 |

### Marketing-Decisions (2026-04-28)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 81 | Decision | **Marken-Strategie:** Torqr beibehalten — Domain läuft, Wordmark + Brand-Spec ausgearbeitet, internationalisierbar. (Decision D-1, dokumentiert in `MARKETING_BRIEFING.md` §0.5) | 2026-04-28 |
| 82 | Decision | **Trial-Modell:** 30 Tage Free Trial ohne Kreditkarte für alle Tiers. Begründung: Wartungs-Saisonalität, User braucht ≥1 Reminder-Zyklus. Annual-Discount: 2 Monate gratis. (Decision D-3, `MARKETING_BRIEFING.md` §7.3) | 2026-04-28 |
| — | Decision | **Tier-Gating:** Solo single-user / Professional Multi-User+Wartungsteile / Enterprise +API+Custom-Branding+Priority-Support. Cal.com-Buchung in allen Tiers (Kern-USP). (Decision D-4, `MARKETING_BRIEFING.md` §7.2) | 2026-04-28 |
| — | Decision | **Zielregion:** Phase 1–3 ausschließlich Deutschland, Sprache nur Deutsch. DACH/EN frühestens 2027. (Decision D-5) | 2026-04-28 |
| — | Decision | **Anrede:** "Du" auf Landingpage / Marketing / Outbound an Heizungsbauer; "Sie" in Endkunden-Mails (Reminder, Booking-Confirmation). (Decision D-6) | 2026-04-28 |
| — | Decision | **Pilotkunden-Testimonials anonymisiert als Standard** (Branche + Betriebsgröße + Zitat, kein Name, kein Foto). Volle Freigabe nur bei expliziter schriftlicher Zustimmung. (Decision D-7) | 2026-04-28 |
| — | Decision | **Tagline-Hauptkandidat:** *"Die Wartungsakte für Heizungsbauer."* — Validierung mit Pilotkunden + 3 Kollegen offen (siehe #80). (Decision D-2) | 2026-04-28 |

### Sprint 28 — Wartungsteile & Materialmanagement Phase A (2026-04-28)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| — | Feature | MaintenanceSet library (tenant-scoped) + CustomerSystem ADD/EXCLUDE overrides + InventoryItem with movements (RESTOCK/CORRECTION/MAINTENANCE_USE/MANUAL_ADJUSTMENT) + MaintenanceChecklistModal Step 2.5 Teileverbrauch + on-demand packing-list print view + Dashboard `LowStockDashboardCard` + WeeklySummary Lager section. Migration: legacy `CustomerSystem.requiredParts` text lifted to ADD overrides, then column dropped. Pilot-test follow-ups: unit dropdown via `<datalist>` in 4 forms; multi-select EXCLUDE picker with checkboxes + accent-ring hover; employee-cache invalidation on system reassignment; `assignedToUserId` inheritance for manual bookings + system-fallback in packing-list ACL; `maintenance-photos` Supabase bucket auto-provisioned via `scripts/create-storage-buckets.ts`. Spec: `docs/superpowers/specs/2026-04-24-wartungsteile-materialmanagement-phase-a-design.md`. Plan: `docs/superpowers/plans/2026-04-24-wartungsteile-materialmanagement-phase-a.md`. Runbook: `docs/superpowers/plans/2026-04-24-wartungsteile-execution-runbook.md`. | 2026-04-28 |

### Sprint 27 — System Photos (2026-04-23)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 34 | Feature | Photos per `CustomerSystem` — up to 5 per system, max 5MB each (JPEG/PNG/WebP). New `SystemPhotosCard` on `/dashboard/systems/[id]` between Wartungsplan and FollowUpSection: grid + lightbox + batch upload. Permission model (Variant B): OWNER + TECHNICIAN upload, OWNER-only delete. Server guards TECHNICIAN to own assigned systems. Stored in Supabase `maintenance-photos` bucket at `{userId}/systems/{systemId}/{ts}.{ext}`. 12 new vitest cases; tenant-isolation audit updated. Migration `20260423131104_add_system_photos` applied to production. Spec: `docs/superpowers/specs/2026-04-23-system-photos-design.md`. | 2026-04-23 |
| — | Bugfix | Termine row "..."-Menü war durch `overflow-hidden` am Wrapper abgeschnitten — entfernt. Gerundete Ecken bleiben erhalten (Row-Contents überragen Border nicht). | 2026-04-23 |
| — | Bugfix | System-Foto-Upload tat nichts beim Dateiauswahl-Dialog. Root cause: `e.target.files` ist live — `e.target.value = ''` leerte die FileList, bevor iteriert werden konnte. Fix: `Array.from()` vor dem Reset. | 2026-04-23 |

### Sprint 26 — React Query Consistency + Permission Hardening + Rate Limiting (2026-04-23)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 55 | Architecture | `/dashboard/wartungen` + `/dashboard/customers/[id]/edit` migrated from `useEffect`/`useCallback` + direct `fetch` to React Query. New `useWartungen(filters)` hook in `src/hooks/useWartungen.ts`; customer-edit now consumes existing `useCustomer` + `useUpdateCustomer`. | 2026-04-23 |
| 56 | Architecture | `MaintenanceHistory`, `MaintenanceChecklistModal`, `BookingFormModal` migrated from direct `fetch()` + manual `queryClient.invalidateQueries` to `useMutation` hooks. New `useCreateMaintenance` + `useDeleteMaintenance` (`src/hooks/useMaintenances.ts`); new `useCreateBooking` in `useBookings.ts`; `useCreateFollowUpJob` now accepts `{ silent: true }` for bulk-create contexts. `MaintenanceHistory.onDelete` prop removed; parent page simplified. | 2026-04-23 |
| 57 | Security | `DELETE /api/follow-ups/[id]` and `DELETE /api/systems/[id]/checklist-items/[itemId]` now require `requireOwner()` (was `requireAuth()`) + return 403 with German message. Aligns with permission matrix: delete = OWNER only. | 2026-04-23 |
| 59 | Infra | Rate limiter migrated from in-memory `Map` to Upstash Redis (sliding window via `@upstash/ratelimit`). `src/lib/rate-limit.ts` exports async `rateLimit`/`rateLimitMiddleware`/`rateLimitByUser`; all 10 callsites + `src/middleware.ts` updated to `await`. Fails open on Upstash transport errors. In-memory fallback retained when Upstash env vars are missing (dev + CI). | 2026-04-23 |
| 66 | Infra | Upstash Redis provisioned via Vercel Marketplace (`upstash-kv-amber-bridge`). Code resolver now accepts 3 env-var naming conventions (canonical `UPSTASH_REDIS_REST_*`, legacy Vercel KV, current Marketplace `UP_KV_REST_API_*`) — no manual aliasing. Deployed to production, verified healthy. | 2026-04-23 |
| 65 | Infra | `CAL_COM_API_KEY` deployed to Vercel + `20260423120000_termine_page` Prisma migration applied to production Supabase. Cal.com reschedule/cancel flow now live. | 2026-04-23 |
| — | Bugfix | `/dashboard/wartungen` page displayed `heater.model` which does not exist on the `CustomerSystem` API response (leftover from pre-Sprint 11 `Heater` model). Now uses `catalog.manufacturer` + `catalog.name` consistently via `getSystemLabel()`. | 2026-04-23 |

### Sprint 25 — Termine Page + Cal.com Reschedule/Cancel (2026-04-23)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 62 | Feature | Termine page — full /dashboard/termine list + monthly calendar view, filters (time/status/technician/customer/system/source), in-app reschedule + cancel via Cal.com v2 API or direct DB update (manual bookings), customer notification emails (BookingRescheduleEmail, BookingCancellationEmail), source icon + legend. Spec: docs/superpowers/specs/2026-04-23-termine-page-design.md. Plan: docs/superpowers/plans/2026-04-23-termine-page.md. | 2026-04-23 |
| 58 | Security | Cal.com webhook HMAC verification now fails CLOSED when CAL_WEBHOOK_SECRET is unset (was fail-open). Added vitest coverage. | 2026-04-23 |
| 45 | Config | Cal.com cancellation flow verified end-to-end — webhook handles BOOKING_CANCELLED, DELETE /api/bookings/[id] + CancelBookingModal implemented with customer notification email. | 2026-04-23 |
| 37 | Feature (partial) | Technician calendar view — monthly grid + filters shipped as part of the Termine page. Vacation/sick days + auto-rebook emails remain deferred as a separate feature. | 2026-04-23 (partial) |
| — | DB | Prisma migration 20260423120000_termine_page adds 5 nullable columns to Booking (cancelReason, cancelledAt, rescheduledFromUid, rescheduledToUid, rescheduledAt) + 2 EmailType values (BOOKING_RESCHEDULED, BOOKING_CANCELLED) + 2 indexes. Migration file committed; run `npx prisma migrate deploy --config config/prisma.config.ts` to apply. | 2026-04-23 |
| — | Infra | Cal.com v2 API client at src/lib/cal-com/client.ts (reschedule + cancel, with CalComApiError + Bearer auth). 5 vitest cases cover auth, URL construction, error handling, default-base fallback. | 2026-04-23 |
| — | Webhook | Extended Cal.com webhook to handle BOOKING_RESCHEDULED (marks original as RESCHEDULED, inserts new row with rescheduledFromUid) and BOOKING_CANCELLED (sets status + cancelReason + cancelledAt). Dynamic email-service import is safe against pre-Task-11 state. | 2026-04-23 |
| — | Email | Two new React Email templates: BookingRescheduleEmail (old/new date comparison) and BookingCancellationEmail (with optional rebook link via Cal.com metadata pre-fill). German copy, matches existing brand. | 2026-04-23 |
| — | API | Extended GET /api/bookings with 8 filter params (range, status[], assignee, customerId, systemType, source, from, to, limit). New GET /api/bookings/[id], PATCH (manual + Cal.com branches), DELETE (manual + Cal.com branches), all tenant-scoped via companyId with TECHNICIAN own-only restriction on DELETE. | 2026-04-23 |
| — | Hooks | Extended useBookings with full filter object (backwards-compatible with customerId string form). New useBooking(id), useRescheduleBooking, useCancelBooking mutations with query invalidation. | 2026-04-23 |
| — | UI | Full Termine page: TermineFilters (URL-driven), TermineList (row actions), BookingDetailsDrawer, TermineCalendar (monthly grid with click-outside collapse), RescheduleBookingModal, CancelBookingModal. All components in src/components/termine/. | 2026-04-23 |

### Sprint 24 — Technician Workload Management (2026-04-23)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 61 | Feature | Technician workload management — new `AssigneeBadge` component on systems list + customer detail (OWNER only); new `/dashboard/employees/[id]` page with header, 4-tile stats grid, customer-grouped assigned systems with per-row + bulk reassign modal, and last-10 recent maintenance activity; Mitarbeiter list rows clickable with workload column + overdue pill; URL-driven `?assignee=` filter on `/dashboard/systems`; dashboard "Nicht zugewiesen" tile replacing the old orphaned-after-deactivation warning; deactivation now silently reassigns all systems to OWNER in a single transaction with a toast showing the count. Spec: `docs/superpowers/specs/2026-04-23-technician-workload-management-design.md`. Plan: `docs/superpowers/plans/2026-04-23-technician-workload-management.md`. | 2026-04-23 |
| — | API | `GET /api/employees` returns per-employee `workload: { assignedSystemsCount, overdueSystemsCount }` via two parallel `customerSystem.groupBy` queries (no N+1). | 2026-04-23 |
| — | API | New `GET /api/employees/[id]` returns `{ stats, assignedSystems (grouped by customer), recentActivity }` via 6 parallel Prisma queries. | 2026-04-23 |
| — | API | `GET /api/customer-systems` now accepts `?assignee=all\|unassigned\|<uuid>` via `assigneeFilterSchema`. TECHNICIAN role always scoped to own userId regardless of param. | 2026-04-23 |
| — | API | `GET /api/dashboard/stats` replaces `unassignedAfterDeactivation` list with a single `unassignedSystemsCount` count. | 2026-04-23 |
| — | API | `PATCH /api/employees/[id]` deactivation now wraps `user.update` + `customerSystem.updateMany` (reassign to OWNER) + `session.deleteMany` in a single `$transaction`; returns `reassignedCount`. | 2026-04-23 |
| — | Hooks | `useEmployee(id)`, `useBulkReassignSystems` (Promise.allSettled with partial-success toast), plus extended `useToggleEmployee` with contextual success messaging. | 2026-04-23 |
| — | Testing | 8 new vitest cases covering employees workload, detail shape, assignee filter variants, auto-reassign transaction, self-deactivation block, reactivation. Full suite: 122/122 passing. | 2026-04-23 |
| — | Bugfix | `maintenanceCreateSchema`/`maintenanceUpdateSchema` `notes` field was rejecting `null` payloads from the client (Zod `.optional()` only accepts `undefined`). Switched to `.optional().nullable()`. | 2026-04-23 |
| — | UI | All form submit buttons standardised to `h-11` on both mobile + desktop (was `h-11 sm:h-9`, producing visual mismatch with 44 px inputs). 7 files. | 2026-04-23 |
| — | UI | Sidebar now shows "Inhaber" / "Techniker" role badge next to user name. | 2026-04-23 |

### Catalog fix & expansion (2026-04-22)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| — | Bugfix | `catalogCreateSchema` rejected `null` for `acSubtype`/`storageSubtype` (`.optional()` accepts `undefined` only) — `POST /api/catalog` returned 400 "Validierungsfehler" when adding a new heating/water entry from the CatalogPicker dialog. Switched to `.nullish()`; AC refine tightened to also reject `null`. | 2026-04-22 |
| — | Infra | Re-seeded `SystemCatalog` on the new Supabase DB (migration left it empty). Added `src/config/additional-catalog.json` with ~680 entries covering AC (346), water treatment (125), and energy storage (209, split BOILER / BUFFER_TANK). Extended `prisma/seed.ts` to upsert all four `SystemType` enums. Total catalog: 904 entries. Idempotent — re-running refreshes `storageSubtype` classification. | 2026-04-22 |
| — | Feature | `CatalogPicker` "Neues Gerät hinzufügen" form now renders a conditional subtype `<select>` when `systemType` is `AC` (Single-/Multi-Split 2–5) or `ENERGY_STORAGE` (Boiler / Pufferspeicher). `canSubmit` guard blocks submit until required subtype is chosen, so the server-side Zod refine never rejects the payload. | 2026-04-22 |

### Sprint 23 — Company Multi-User Architecture (2026-04-22)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| — | Bugfix | Vercel build failure on Next 16 / Turbopack — `src/app/admin/layout.tsx` (client) imported `isAdminEmail` from `src/lib/admin-auth.ts`, which also exported `requireAdmin` with a dynamic `import('@/lib/auth')`. Turbopack traced the dynamic import into the client bundle, pulling `next/headers` + `prisma`/`pg` (dns/net/tls/fs) into the browser. Fix: split `isAdminEmail` into `src/lib/admin-email.ts` (pure, no deps), keep `requireAdmin` in `admin-auth.ts` with a static `auth` import, convert admin layout to a server component that calls `requireAdmin()` and redirects on `Forbidden`/`Unauthorized`, and extract nav/signout into `AdminLayoutShell` client component. Also fixed a latent gating bug (client-side `process.env.ADMIN_EMAILS` was always `undefined` → admin UI was unreachable). | 2026-04-22 |
| — | Architecture | User-as-Tenant → Company-as-Tenant migration. `Company` model added. All tenant-scoped tables (`Customer`, `CustomerSystem`, `Maintenance`, `Booking`, `FollowUpJob`, `EmailLog`) now have `companyId` FK. All 19 API routes migrated from `userId` to `companyId` scoping. `userId` retained as audit field on create operations only. Full decision record: `docs/superpowers/specs/2026-04-22-company-multi-user-architecture.md`. | 2026-04-22 |
| — | Auth | `requireAuth()` now returns `{ userId, companyId, role, email, name }`. New `requireOwner()` and `requireRole()` helpers. `UserRole` enum (OWNER, TECHNICIAN) on User model. JWT/session callbacks load role from DB on every refresh. Deactivated users get token invalidated immediately. | 2026-04-22 |
| 26 | Feature | Employee management — "Mitarbeiter" page (OWNER only). Create technician with temp password + `mustChangePassword` flag. Activate/deactivate (never delete to preserve history). `isActive` flag blocks login. Session invalidation on deactivation. `useEmployees` hook with `enabled` option. | 2026-04-22 |
| — | Feature | Technician assignment — `assignedToUserId` nullable FK on `CustomerSystem`. OWNER-only assignment via PATCH endpoint with company membership + active status validation. Dropdown on system detail page for OWNER, read-only display for TECHNICIAN. | 2026-04-22 |
| — | Feature | Role-aware dashboard — OWNER sees company-wide stats, TECHNICIAN sees "Meine Woche" (only assigned systems + own maintenances). "Unassigned after deactivation" warning card for OWNER when systems are assigned to deactivated users. | 2026-04-22 |
| — | Feature | Role-aware weekly summary — cron now iterates all active users with `emailWeeklySummary` enabled. OWNER gets company-wide data, TECHNICIAN gets only assigned systems + own maintenances. `sendWeeklySummaryToAll()` function with per-user error handling. | 2026-04-22 |
| — | Security | Permission matrix enforced — DELETE operations require `requireOwner()`. Bookings POST restricted to OWNER only. Send-reminder restricted to OWNER only. Technician assignment restricted to OWNER only. Nav items filtered by role. Delete/booking buttons hidden for TECHNICIAN. | 2026-04-22 |
| — | Feature | Company name setup modal — shown once for OWNER when `company.name` is null. Ensures company identity is set before employees are created. | 2026-04-22 |
| — | Testing | Tenant isolation audit test updated — checks all route files for `companyId` scoping (tenant routes) or `userId` scoping (user routes). Catches uncategorised new routes. Pre-existing stale entry for `sentry-example-api` removed. | 2026-04-22 |
| 53 | Feature | TECHNICIAN list filtering — `customer-systems`, `wartungen`, and `bookings` GET routes now scope to assigned systems / own bookings for TECHNICIAN role. OWNER sees all company data. Consistent with dashboard stats scoping. | 2026-04-22 |
| 54 | Feature | Must-change-password flow — `ProtectedRoute` redirects to `/dashboard/change-password` when `mustChangePassword: true`. Change-password page with validation + `POST /api/user/force-change-password` API route that sets `mustChangePassword: false`. Session refresh after change. | 2026-04-22 |
| — | Docs | CLAUDE.md updated with Company-as-Tenant isolation rules, role helpers, exception list, and multi-tenancy section. | 2026-04-22 |

### Sprint 22 — Account Cleanup + Delete Account (2026-04-22)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 48 | Cleanup | Supabase client cleanup — removed dead `uploadMaintenancePhoto()`, anon client singleton, and `supabase` convenience object. Switched `deleteMaintenancePhoto()` to use admin client (bypasses RLS). | 2026-04-22 |
| 14 | Feature | Delete account / danger zone — `DELETE /api/user/account` with password verification, Supabase storage cleanup, cascading DB delete. `DangerZoneCard` with `AlertDialog` confirmation on account page. Redirects to login after deletion. | 2026-04-22 |
| 41 | Config | Business hours — Mon–Fri 7:30–17:00 Europe/Berlin configured in Cal.com availability settings. | 2026-04-22 |
| 43 | Config | Booking location — changed from "Online Call" to "In Person (Organizer Address)" with business address. | 2026-04-22 |
| 50 | Security | RLS deny-all policies applied to all 12 public tables on new Supabase project (`hwagqyywixhhorhjtydt`). RLS was already enabled but had no explicit policies — now each table has a named `deny_all` policy. | 2026-04-22 |

### Sprint 21 — Security Hardening + Supabase Migration (2026-04-22)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| — | Security | Full credential rotation — DB password, Supabase service role key, Resend API key, Cal.com webhook secret, Sentry auth token, AUTH_SECRET, CRON_SECRET, UNSUBSCRIBE_SECRET. All Vercel env vars marked sensitive where applicable. | 2026-04-22 |
| — | Security | RLS enabled on all 13 public tables with deny-all policy. Fixes Supabase "tables publicly accessible" critical alert. All data access goes through Prisma + service role key (bypasses RLS). | 2026-04-22 |
| — | Security | Storage bucket `maintenance-photos` recreated without broad SELECT policy. Fixes "public bucket allows listing" warning. Public URLs still work, but file listing is blocked. | 2026-04-22 |
| — | Infra | Migrated to new Supabase project (`hwagqyywixhhorhjtydt`, eu-central-1) via Vercel integration. All 6 Prisma migrations applied. Storage bucket configured with 5MB limit and JPEG/PNG/WebP restriction. | 2026-04-22 |
| — | Fix | Prisma config — switched from `env()` (broken in Prisma 7 for `migrate deploy`) to `dotenv/config` import + `process.env.DIRECT_URL` fallback. Migrations now work reliably. | 2026-04-22 |
| — | Fix | SSL fix for `pg` Pool — Supabase requires SSL but `pg` library doesn't parse `sslmode` from connection string. Added explicit `ssl: { rejectUnauthorized: false }` to Pool constructor. | 2026-04-22 |

### Sprint 20 — Follow-Up Jobs + Installation Date Checkbox (2026-04-21)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 27 | Feature | Follow-up jobs (Nachfolgeaufträge) — `FollowUpJob` model tied to `CustomerSystem` with optional `Maintenance` back-reference. CRUD API routes, React Query hook. `FollowUpSection` on system detail page with inline add + toggle complete + delete. Follow-up creation in `MaintenanceChecklistModal` Step 2. Amber badge with open count on customer detail page system cards. | 2026-04-21 |
| 32 | Feature | Installation date = maintenance date checkbox — checkbox in `SystemAssignmentModal` copies installation date to last maintenance date field. Syncs on date change, disables field when active, restores on uncheck. Pure client-side logic. | 2026-04-21 |

### Sprint 19 — Email Rework: Weekly Summary + Editable Templates (2026-04-21)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 13 | Email | Weekly summary rethink — replaced stat-block layout with actionable section-based email: bookings this week (green), due but unbooked (amber), overdue (red), retro last week (gray), totals. 7 parallel queries, 10-item list limits with overflow. | 2026-04-21 |
| 40 | Feature | Editable email templates — `reminderGreeting` and `reminderBody` fields on User model. Placeholder `{customerName}` support. "E-Mail-Vorlage" card on account page. Empty = use defaults. | 2026-04-21 |
| 2 | Email | Email deliverability — GMX junk issue resolved. DMARC no longer necessary. | 2026-04-21 |
| — | Docs | Comprehensive email system documentation written to `docs/EMAIL-SYSTEM.md` — covers all email types, cron jobs, opt-in flow, template architecture, configuration. | 2026-04-21 |

### Sprint 18 — Digital Maintenance Checklist (2026-04-21)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 35 | Feature | Digital maintenance checklist — 3-step `MaintenanceChecklistModal` (checklist → notes/photos → confirm). Per-system-type defaults (HEATING 10, AC 7, WATER_TREATMENT 6, ENERGY_STORAGE 6 items). `CustomerSystemChecklistItem` model for custom items per system. Immutable JSON snapshot on `Maintenance.checklistData`. API routes for checklist items CRUD. Integrated into system detail, customer detail, and dashboard pages. | 2026-04-21 |

### Sprint 17 — Quick Wins: Security, Dashboard Bookings, Email Log (2026-04-21)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 47 | Security | Photo upload route now verifies `maintenanceId` ownership (`prisma.maintenance.findFirst({ where: { id, userId } })`) and scopes storage path to `{userId}/maintenances/{id}-{ts}.ext`. | 2026-04-21 |
| 10 | Feature | Dashboard "Gebuchte Termine" section — shows all upcoming CONFIRMED bookings with customer name, system label, date/time. Uses existing `useBookings()` hook. | 2026-04-21 |
| 36 | Feature | Email log card on customer detail page — `GET /api/customers/[id]/email-logs` route + `useCustomerEmailLogs` hook. Shows up to 30 sent emails with type label (German), date/time, error indicator. Hidden when no logs exist. | 2026-04-21 |

### Sprint 16 — Multi-Tenancy Architecture Decision (2026-04-21)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 15 | Decision | Shared-database, single-schema multi-tenancy confirmed. Originally `userId`-scoped; **superseded by Sprint 23** Company-as-Tenant (`companyId`-scoped). Updated decision record: `docs/superpowers/specs/2026-04-22-company-multi-user-architecture.md`. | 2026-04-21 |

### Sprint 15 — Office-Side Booking (2026-04-21)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 38 | Feature | Office-side booking via BookingFormModal on system detail page. POST /api/bookings creates Booking with BOOKING_MANUAL trigger, auto-links customer. Sends BookingConfirmationEmail (German) if customer has email; fire-and-forget, non-blocking. | 2026-04-21 |

### Sprint 14 — Terminiert Badge + Booked Slot Display (2026-04-21)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 20 | Feature | Green "Terminiert" badge on system cards when a future CONFIRMED booking exists. Replaces urgency badge when booked. | 2026-04-21 |
| 24 | UX | Booked slot (date + time) replaces "Nächste Wartung" line on system card when booking exists. System detail page shows "Gebuchter Termin" row in Wartungsplan card. | 2026-04-21 |

### Sprint 13 — Booking ↔ System Link (2026-04-21)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 23 | Feature | `systemId` FK added to `Booking` model. Cal.com reminder URLs now embed `metadata[systemId]`. Webhook resolves and validates `systemId` against user scope before storing. `GET /api/bookings` returns system + catalog info. Unblocks #24 and #20. | 2026-04-21 |

### Sprint 12 — Email Copy Fix (2026-04-20)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 39 | Email | Reminder email rephrased — wording now correctly states "last maintenance was X weeks ago, time to rebook" instead of implying a booked appointment is approaching. Card label changed from "Geplanter Wartungstermin" → "Wartung fällig ab". | 2026-04-20 |

### Sprint 11 — System Model Overhaul (2026-04-20)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 28 | Decision | Heater model: chose **Option A** — global `SystemCatalog` + per-tenant `CustomerSystem` instances. Catalog is shared across users; customer assignment is per-tenant with `userId` scoping. | 2026-04-20 |
| 29 | Feature | Renamed "Heizsysteme" → "Systeme". New `SystemCatalog` (global) + `CustomerSystem` (per-tenant) models. Top-level type selector: Heizung / Klimaanlage / Wasseraufbereitung / Energiespeicher. `SystemAssignmentModal` with `SystemTypeSelector` + `CatalogPicker` (search, grouped by manufacturer, inline add). Catalog seeded with 224 heating entries. New `/dashboard/systems` list page + `/dashboard/systems/[id]` detail page. | 2026-04-20 |
| 30 | Feature | AC subtypes — `AcSubtype` enum (SINGLE_SPLIT, MULTI_SPLIT_2/3/4/5) added to schema and `catalogCreateSchema`. | 2026-04-20 |
| 31 | Feature | Energy storage subtypes — `StorageSubtype` enum (BOILER, BUFFER_TANK) and `storageCapacityLiters` field added to `CustomerSystem`. | 2026-04-20 |
| 46 | Cleanup | Old `heatingType` / `additionalEnergySources` / `energyStorageSystems` fields removed from `Customer` model and all forms. Old `Heater` model, `useHeaters` hook, `HeaterFormModal`, `heater-form/` components, `api/heaters/`, `api/heating-systems/`, `dashboard/heaters/` all deleted. | 2026-04-20 |

### Sprint 10 — Admin Panel (2026-04-17)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 7 | Feature | Platform admin panel at `/admin` — gated by `ADMIN_EMAILS` env var. Read-only. Overview stats, paginated user list with search + last login, user detail drill-down (profile, customers, email log), email log with type filter, cron run monitor. `requireAdmin()` helper with unit tests. Admin button in account page visible only to admin users. | 2026-04-17 |

### Sprint 9 — Cal.com E2E + Bug Fixes (2026-04-16)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 18 | Bug | Photo uploader fixed — client-side anon key rejected by Supabase RLS (no Supabase session via NextAuth). Moved to server-side `POST /api/upload/photo` using `SUPABASE_SERVICE_ROLE_KEY`. | 2026-04-16 |
| 21a | Email | "Wartungstermin" label renamed to "Geplanter Wartungstermin" in reminder email template. | 2026-04-16 |
| 21b | UX | Per-heater reminder send button — mail icon per heater row on customer detail page; sends reminder for that specific heater. Sidebar generic button removed. | 2026-04-16 |
| 21c | Feature | Cal.com booking URL pre-fills customer name, email, and address (`location` param). | 2026-04-16 |

### Sprint 8 — Mobile Responsiveness (2026-04-16)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 6 | UX | Full mobile responsiveness — all pages, modals, forms. iOS auto-zoom fix (`text-base` on inputs), 44px touch targets, responsive button rows, export buttons hidden on mobile. | 2026-04-16 |

### Sprint 7 — Bugs & UX Fixes (2026-04-16)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 16 | Bug | Customer not shown after creation — fixed via `useCreateCustomer` hook. | 2026-04-16 |
| 17 | Bug | Heater not shown after creation — fixed by invalidating `['heaters']` cache. | 2026-04-16 |
| 19 | Feature | Customer email field made required with asterisk and validation. | 2026-04-16 |
| 21 | Feature | Maintenance notes field made required with asterisk and error message. | 2026-04-16 |
| 22 | UX | Customer quick-actions spacing improved. | 2026-04-16 |
| 12 | Feature | Manual reminder email trigger added to customer detail sidebar. | 2026-04-16 |

### Sprint 6 — Account & Settings Page (2026-04-16)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 5 | Feature | Account page — change password, update profile, manage settings. Avatar chip links to `/dashboard/account`. | 2026-04-16 |
| 8 | Feature | Profile fields — name, phone, email, password, companyName. Phone + companyName appear in reminder email footer. | 2026-04-16 |
| 9 | Email | `companyName` field added to User model — appears in reminder email sign-off. | 2026-04-16 |

### Sprint 5 — Cal.com Webhook Integration (2026-04-14)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| S5-1 | DB | `Booking` model added to Prisma schema with Cal.com fields. | 2026-04-14 |
| S5-2 | DB | Bookings table created in Supabase. | 2026-04-14 |
| S5-3 | API | `POST /api/webhooks/cal` — Cal.com webhook handler with HMAC-SHA256 verification. | 2026-04-14 |
| S5-4 | API | Two-strategy customer resolution (metadata `customerId` first, email fallback). | 2026-04-14 |
| S5-5 | API | User resolution via metadata `userId` first, organizer email fallback. | 2026-04-14 |
| S5-6 | API | `GET /api/bookings` — bookings list scoped to authenticated user. | 2026-04-14 |
| S5-7 | Hooks | `useBookings` hook — React Query for bookings data. | 2026-04-14 |
| S5-8 | UI | Cal.com bookings section on customer detail page. | 2026-04-14 |
| S5-9 | Email | Reminder Cal.com URL embeds `metadata[customerId]` + `metadata[userId]`. | 2026-04-14 |

### Bugfixes (2026-04-14)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| B-1 | Email | Unsubscribe URL used `localhost:3000` in production — fixed via `APP_URL` env var. | 2026-04-14 |
| B-2 | UI | Edit customer now redirects to detail page instead of list after save. | 2026-04-14 |
| B-3 | UI | Dashboard nested `<a>` hydration error — replaced `<Link>` with `div` + `useRouter`. | 2026-04-14 |

### Sprint 4 — Email Automation (2026-04-13)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| S4-1 | Email | Resend singleton client. | 2026-04-13 |
| S4-2 | Email | `computeOptInData()` with unit tests. | 2026-04-13 |
| S4-3 | Email | `sendReminder()` + `sendWeeklySummary()` service functions. | 2026-04-13 |
| S4-4 | Email | `ReminderEmail` template (German). | 2026-04-13 |
| S4-5 | Email | `WeeklySummaryEmail` template with stat blocks. | 2026-04-13 |
| S4-6 | Email | HMAC-SHA256 stateless unsubscribe tokens with unit tests. | 2026-04-13 |
| S4-7 | API | `POST /api/cron/daily-reminders` — sends reminders for upcoming maintenance. | 2026-04-13 |
| S4-8 | API | `POST /api/cron/weekly-summary` — weekly digest to shop owner. | 2026-04-13 |
| S4-9 | API | `GET/POST /api/email/unsubscribe/[token]` — stateless unsubscribe. | 2026-04-13 |
| S4-10 | UI | Public unsubscribe page. | 2026-04-13 |
| S4-11 | UI | Customer form: email suppression toggle + status badge. | 2026-04-13 |
| S4-12 | Config | `vercel.json` cron schedules — daily 06:00, weekly Mon 07:00 UTC. | 2026-04-13 |
| S4-13 | DB | `EmailLog`, `CronRun`, `EmailOptInStatus`, `EmailType` models. | 2026-04-13 |
| S4-14 | Infra | Production live on torqr.de — Cloudflare DNS + custom domain. | 2026-04-14 |
| S4-15 | Email | Reminder template redesigned — technician contact in footer. | 2026-04-14 |
| S4-16 | Email | Email service updated to pass technician name + email. | 2026-04-14 |

### Sprint 3 — Heater & Maintenance Management + Architecture (2026-01-13)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| S3-1 | Backend | Heater CRUD API with category/manufacturer/model structure. | 2026-01-13 |
| S3-2 | Backend | Maintenance CRUD API with photo upload. | 2026-01-13 |
| S3-3 | Backend | Supabase Storage for maintenance photos. | 2026-01-13 |
| S3-4 | Backend | Dashboard stats API — overdue/upcoming counts. | 2026-01-13 |
| S3-5 | UI | Heater list, detail, maintenance form, overview page, dashboard. | 2026-01-13 |
| S3-6 | UI | HeatingSystemSelector — cascading category → manufacturer → model. | 2026-01-13 |
| S3-7 | UI | AddNewEntryModal, StorageFields, BatteryFields, Pagination. | 2026-01-13 |
| A-1 | Architecture | TanStack Query v5 integration — global QueryClient, 5-min stale time. | 2026-01-13 |
| A-2 | Hooks | `useCustomers`, `useHeaters`, `useMaintenances`, `useDashboard` hooks. | 2026-01-13 |
| A-3 | Infra | Production deployment on Vercel — initial setup. | 2026-01-13 |

### Sprint 2 — Customer Management (2026-01-08)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| S2-1 | Backend | Customer CRUD API with Zod validation. | 2026-01-08 |
| S2-2 | UI | Customer list, create/edit forms, detail page, MultiSelect, toast notifications. | 2026-01-08 |
| S2-3 | Config | `heating-systems.json` — 9 categories, 30+ manufacturers. | 2026-01-08 |

### Sprint 1 — Authentication & Setup (2026-01-08)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| S1-1 | Auth | NextAuth v5 with email/password, protected routes, session management. | 2026-01-08 |
| S1-2 | Security | CSRF protection, rate limiting, bcrypt password hashing, login logging. | 2026-01-08 |
| S1-3 | DB | Prisma schema — User, Customer, Heater, Maintenance models. Supabase PostgreSQL (eu-west-1). | 2026-01-08 |
| S1-4 | UI | Login and register pages. | 2026-01-08 |
