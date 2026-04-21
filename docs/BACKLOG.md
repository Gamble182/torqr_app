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

### System Model — Follow-up

| # | Area | Description | Priority | Found |
|---|------|-------------|----------|-------|
| 32 | Feature | Installation date = maintenance date checkbox — when assigning a system, checkbox "Installationsdatum als Wartungsdatum übernehmen" sets first maintenance interval to installation date + 1 year. | Medium | 2026-04-16 |
| 34 | Feature | Photos per system — allow attaching up to 5 photos per system directly in system detail view (e.g. installation photos for quoting). | Medium | 2026-04-16 |

### Cal.com Booking Integration

Booking is functional (webhook + customer resolution), but not yet linked to specific heaters. This group closes the loop: booking → heater → status badge → calendar.

| # | Area | Description | Priority | Found |
|---|------|-------------|----------|-------|
| 24 | UX | Show booked appointment on system card — once booking↔system link exists (#23), replace or augment "Nächste Wartung" date with actual booked slot (date + time). | Medium | 2026-04-16 |
| 20 | Feature | "Terminiert" status badge — show on system cards that have a linked future Cal.com booking. Depends on #23. | Medium | 2026-04-15 |
| 33 | Feature | Multi-system booking — if a customer has multiple systems with the same maintenance interval, allow selecting all for a single appointment. | Medium | 2026-04-16 |
| 38 | Feature | Office-side appointment booking — allow office staff to book on behalf of a customer (for customers without email, e.g. elderly). Bypass email-based Cal.com flow. | High | 2026-04-16 |

### Cal.com Configuration

These are mostly Cal.com dashboard settings, not code changes. Can be done in one sitting.

| # | Area | Description | Priority | Found |
|---|------|-------------|----------|-------|
| 41 | Config | Business hours — configure booking availability (e.g. Mon–Thu 08:00–17:00) in Cal.com event settings. | Medium | 2026-04-16 |
| 42 | Config | Time slots per system type — different appointment durations per system type (Wärmepumpe, Gas, Öl, etc.). May require multiple Cal.com event types or app-side logic. | Medium | 2026-04-16 |
| 43 | Config | Booking location — currently shows "Online Call". Should show technician name or physical address. Cal.com event settings change. | Low | 2026-04-16 |
| 44 | Config | Target email — booking confirmation should go to business address, not personal. Cal.com settings change. | Low | 2026-04-16 |
| 45 | Config | Cancellation flow — verify Cal.com cancellation link is included in confirmation email so customers can cancel directly. | Low | 2026-04-16 |
| 11 | Decision | Calendar integration strategy — recommendation: do NOT build own calendar. Use Cal.com for scheduling, let users sync to Google/Outlook via Cal.com. Embed iframe if needed later. | Low | 2026-04-14 |

### Email System

| # | Area | Description | Priority | Found |
|---|------|-------------|----------|-------|
| 2 | Email | Email deliverability — weekly summary and reminders land in GMX junk. Domain reputation improves over time; consider adding DMARC record to accelerate. | Medium | 2026-04-14 |
| 13 | Email | Weekly summary content refinement — review copy, structure, and data shown. Account page is now live, so this is unblocked. | Medium | 2026-04-15 |
| 40 | Feature | Editable email templates — allow users to customize reminder email text in app settings. Reference: Tooltime template from pilot customer. | Medium | 2026-04-16 |
| 36 | Feature | Email log in customer file — show list of all sent emails per customer with timestamps, directly in customer detail view. | Medium | 2026-04-16 |

### Field Service & Mobile

Features for technicians working on-site. The digital checklist (#35) is a key differentiator.

| # | Area | Description | Priority | Found |
|---|------|-------------|----------|-------|
| 35 | Feature | Digital maintenance checklist — technicians fill out a per-system-type checklist during maintenance, check off items on mobile, sign digitally. Acts as digital Arbeitsbericht. | High | 2026-04-16 |
| 27 | Feature | Follow-up jobs (Nachfolgeaufträge) — section/tab for tasks discovered during maintenance (e.g. "Wasserfilter erneuern", "Angebot Klimaanlage"). Checkable items, photo attachments for quoting. | Medium | 2026-04-16 |

### Workforce & Scheduling

Relevant once multiple employees are on the platform.

| # | Area | Description | Priority | Found |
|---|------|-------------|----------|-------|
| 26 | Feature | Employee management — "Mitarbeiter" tab. Create/delete employees. Show weekly maintenance count per employee and historical workload. | Medium | 2026-04-16 |
| 37 | Feature | Technician calendar view — which technician has appointments when. Admin can enter vacation / sick days. Sick day triggers automated rebook email to affected customers. | Medium | 2026-04-16 |

### Data Import

| # | Area | Description | Priority | Found |
|---|------|-------------|----------|-------|
| 25 | Feature | CSV/Excel customer import — import customers from external tools (e.g. Tooltime export). Map columns to Customer model fields. | Medium | 2026-04-16 |

### Architecture & Account

| # | Area | Description | Priority | Found |
|---|------|-------------|----------|-------|
| 15 | Decision | Multi-tenancy model — evaluate shared database with logical separation (per-user `userId` scoping, current approach) vs. separate schemas/databases per tenant. Produce architecture recommendation. | High | 2026-04-15 |
| 14 | Feature | Delete account / danger zone — allow user to delete own account and all associated data. Confirmation dialog. Add to account page settings. | Low | 2026-04-15 |

### Bookkeeping

| # | Area | Description | Priority | Found |
|---|------|-------------|----------|-------|
| 10 | Feature | Booking feed / news section — show booked appointments in dashboard as "Gebuchte Termine". Partially covered by existing Cal.com bookings section on customer detail; dashboard-level view still missing. | Medium | 2026-04-14 |

---

## Completed / Resolved

Items are grouped by sprint / work session, ordered newest first.

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
