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
| # | Area | Description | Priority | Found |
| 49 | Infra | Delete old Supabase project (`vvsmxzebaoslofigxakt`, eu-west-1) — migrated to new project (`hwagqyywixhhorhjtydt`, eu-central-1) via Vercel integration. Delete once confident everything works. | Low | 2026-04-22 |

### System Model — Follow-up

| # | Area | Description | Priority | Found |
|---|------|-------------|----------|-------|
| 34 | Feature | Photos per system — allow attaching up to 5 photos per system directly in system detail view (e.g. installation photos for quoting). | Medium | 2026-04-16 |

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
| 45 | Config | Cancellation flow — verify Cal.com cancellation link is included in confirmation email so customers can cancel directly. | Low | 2026-04-16 |
| 51 | Decision | Cal.com multi-tenant strategy — current single-account setup doesn't scale beyond pilot. Options: Cal.com Teams, per-user Cal.com accounts, or custom booking UI via Cal.com API. Decide post-pilot. | Low | 2026-04-22 |
| 52 | Testing | Test full booking flow end-to-end — customer receives reminder, clicks Cal.com link, books, webhook fires, booking appears in torqr dashboard. | Medium | 2026-04-22 |
| 11 | Decision | Calendar integration strategy — recommendation: do NOT build own calendar. Use Cal.com for scheduling, let users sync to Google/Outlook via Cal.com. Embed iframe if needed later. | Low | 2026-04-14 |

### Email System

_(no open items)_

### Field Service & Mobile

Features for technicians working on-site. Digital checklist (#35) is live. Follow-up jobs (#27) are live.

_(no open items)_

### Workforce & Scheduling

| # | Area | Description | Priority | Found |
|---|------|-------------|----------|-------|
| 37 | Feature | Technician calendar view — which technician has appointments when. Admin can enter vacation / sick days. Sick day triggers automated rebook email to affected customers. | Medium | 2026-04-16 |
| 53 | Feature | Technician system list filtering — TECHNICIAN role currently sees all company systems on the /dashboard/systems page. Should be filtered to only show assigned systems (matching dashboard stats scoping). | Medium | 2026-04-22 |
| 54 | Feature | Must-change-password flow — TECHNICIAN users created with `mustChangePassword: true` need a force-change-password page after first login. Middleware redirect exists but the page implementation is pending. | High | 2026-04-22 |

### Data Import

| # | Area | Description | Priority | Found |
|---|------|-------------|----------|-------|
| 25 | Feature | CSV/Excel customer import — import customers from external tools (e.g. Tooltime export). Map columns to Customer model fields. | Medium | 2026-04-16 |

### Architecture & Account

_(no open items)_

### Bookkeeping

| # | Area | Description | Priority | Found |
|---|------|-------------|----------|-------|

---

## Maybe / Future

Ideas worth keeping in mind but not planned for current sprints. No implementation until explicitly decided.

| # | Area | Description | Notes |
|---|------|-------------|-------|
| M-1 | Feature | PDF / Arbeitsbericht — export a completed maintenance checklist as a PDF work report for the customer. Would require a PDF generation library (e.g. `@react-pdf/renderer`) or a server-side rendering approach. | Requested by pilot customer context. Deferred until checklist feature is validated in production. |
| M-2 | Feature | Measurement fields on checklist — allow custom checklist items to capture numeric values (e.g. flue gas temperature, pressure reading) instead of just checkboxes. | Revisit after pilot feedback. |
| M-3 | Feature | Drag-and-drop reordering of custom checklist items per `CustomerSystem`. | Low priority; `sortOrder` field is already in the schema to support this later. |

---

## Completed / Resolved

Items are grouped by sprint / work session, ordered newest first.

### Sprint 23 — Company Multi-User Architecture (2026-04-22)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| — | Architecture | User-as-Tenant → Company-as-Tenant migration. `Company` model added. All tenant-scoped tables (`Customer`, `CustomerSystem`, `Maintenance`, `Booking`, `FollowUpJob`, `EmailLog`) now have `companyId` FK. All 19 API routes migrated from `userId` to `companyId` scoping. `userId` retained as audit field on create operations only. Full decision record: `docs/superpowers/specs/2026-04-22-company-multi-user-architecture.md`. | 2026-04-22 |
| — | Auth | `requireAuth()` now returns `{ userId, companyId, role, email, name }`. New `requireOwner()` and `requireRole()` helpers. `UserRole` enum (OWNER, TECHNICIAN) on User model. JWT/session callbacks load role from DB on every refresh. Deactivated users get token invalidated immediately. | 2026-04-22 |
| 26 | Feature | Employee management — "Mitarbeiter" page (OWNER only). Create technician with temp password + `mustChangePassword` flag. Activate/deactivate (never delete to preserve history). `isActive` flag blocks login. Session invalidation on deactivation. `useEmployees` hook with `enabled` option. | 2026-04-22 |
| — | Feature | Technician assignment — `assignedToUserId` nullable FK on `CustomerSystem`. OWNER-only assignment via PATCH endpoint with company membership + active status validation. Dropdown on system detail page for OWNER, read-only display for TECHNICIAN. | 2026-04-22 |
| — | Feature | Role-aware dashboard — OWNER sees company-wide stats, TECHNICIAN sees "Meine Woche" (only assigned systems + own maintenances). "Unassigned after deactivation" warning card for OWNER when systems are assigned to deactivated users. | 2026-04-22 |
| — | Feature | Role-aware weekly summary — cron now iterates all active users with `emailWeeklySummary` enabled. OWNER gets company-wide data, TECHNICIAN gets only assigned systems + own maintenances. `sendWeeklySummaryToAll()` function with per-user error handling. | 2026-04-22 |
| — | Security | Permission matrix enforced — DELETE operations require `requireOwner()`. Bookings POST restricted to OWNER only. Send-reminder restricted to OWNER only. Technician assignment restricted to OWNER only. Nav items filtered by role. Delete/booking buttons hidden for TECHNICIAN. | 2026-04-22 |
| — | Feature | Company name setup modal — shown once for OWNER when `company.name` is null. Ensures company identity is set before employees are created. | 2026-04-22 |
| — | Testing | Tenant isolation audit test updated — checks all route files for `companyId` scoping (tenant routes) or `userId` scoping (user routes). Catches uncategorised new routes. Pre-existing stale entry for `sentry-example-api` removed. | 2026-04-22 |
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
