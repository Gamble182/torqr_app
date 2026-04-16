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

| # | Area | Description | Priority | Found |
|---|------|-------------|----------|-------|
| 2 | Email | Weekly summary and reminder emails land in GMX junk folder — new domain reputation issue, improves over time; consider adding DMARC record | Medium | 2026-04-14 |
| 7 | Feature | Admin panel — `/admin` route (same project), role-based access (`User.role: USER\|ADMIN`). Views: all users, EmailLog, CronRun, user CRUD. No separate app needed. | Medium | 2026-04-14 |
| 10 | Feature | Booking feed / news section — when Cal.com webhook fires, show booked appointments in dashboard or customer detail as "Gebuchte Termine" | Medium | 2026-04-14 |
| 11 | Decision | Calendar integration — recommendation: do NOT build own calendar. Use Cal.com for scheduling, let users sync to Google/Outlook via Cal.com. Embed Cal.com iframe if needed later. | Low | 2026-04-14 |
| 13 | Email | Weekly summary email content refinement — review and improve copy, structure, and data shown in the weekly summary email template. To be done after account page is live. | Medium | 2026-04-15 |
| 14 | Feature | Delete account / danger zone — allow user to delete their own account and all associated data. Requires confirmation dialog. To be added to account page settings. | Low | 2026-04-15 |
| 15 | Architecture | Multi-tenancy decision — evaluate shared database with logical separation (per-user scoping) vs. separate databases per tenant. Coding agent should produce a recommendation based on existing architecture. | High | 2026-04-15 |
| 18 | Bug | Photo uploader broken — photo upload in maintenance dialog is non-functional. Needs investigation and fix. | High | 2026-04-15 |
| 20 | Feature | Maintenance list — show "terminiert" status badge on maintenance entries that have a linked Cal.com booking. | Medium | 2026-04-15 |

---

## Completed / Resolved

### Sprint 8 — Mobile Responsiveness (2026-04-16)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 6 | UX | Full mobile responsiveness — all pages, modals, forms. iOS auto-zoom fix (text-base on all inputs), 44px touch targets, responsive button rows (flex-col-reverse sm:flex-row), export buttons hidden on mobile. | 2026-04-16 |

### Sprint 7 — Bugs & UX Fixes (2026-04-16)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 16 | Bug | Customer not shown after creation — fixed via useCreateCustomer hook in new/page.tsx | 2026-04-16 |
| 17 | Bug | Heater not shown after creation — fixed by invalidating ['heaters'] cache in HeaterFormModal | 2026-04-16 |
| 19 | Feature | Customer email field made required with asterisk and validation (new + edit page) | 2026-04-16 |
| 21 | Feature | Maintenance notes field made required with asterisk and error message | 2026-04-16 |
| 22 | UX | Customer quick-actions spacing improved (space-y-3, py-2.5 buttons) | 2026-04-16 |
| 12 | Feature | Manual reminder email trigger added to customer detail page sidebar | 2026-04-16 |

### Sprint 6 — Account & Settings Page (2026-04-16)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 5 | Feature | Account page — user can change password, update personal info, manage account settings. Bottom-left avatar/user chip links to `/dashboard/account` | 2026-04-16 |
| 8 | Feature | Account/Profile page — name, phone, email, password, companyName. Phone + companyName appear in reminder email footer. | 2026-04-16 |
| 9 | Email | `companyName` field added to User model — appears in reminder email sign-off footer | 2026-04-16 |

### Sprint 1 — Authentication & Setup (before 2026-01-08)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| S1-1 | Auth | NextAuth v5 integration with email/password authentication | 2026-01-08 |
| S1-2 | Auth | Protected routes via Next.js middleware | 2026-01-08 |
| S1-3 | Auth | User session management and auth helpers (`requireAuth()`) | 2026-01-08 |
| S1-4 | Security | CSRF protection | 2026-01-08 |
| S1-5 | Security | Rate limiting on API routes | 2026-01-08 |
| S1-6 | Security | Password hashing with bcrypt | 2026-01-08 |
| S1-7 | Auth | Login activity logging | 2026-01-08 |
| S1-8 | DB | Prisma schema initial setup with User, Customer, Heater, Maintenance models | 2026-01-08 |
| S1-9 | Infra | Supabase PostgreSQL connected (eu-west-1) | 2026-01-08 |
| S1-10 | UI | Login and register pages | 2026-01-08 |

### Sprint 2 — Customer Management (2026-01-08)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| S2-1 | Backend | Customer CRUD API (`/api/customers`) with Zod validation | 2026-01-08 |
| S2-2 | Backend | `heatingType` made required field (NOT NULL migration) | 2026-01-08 |
| S2-3 | Backend | `additionalEnergySources String[]` and `energyStorageSystems String[]` fields added to Customer | 2026-01-08 |
| S2-4 | UI | Customer list page with search and filter | 2026-01-08 |
| S2-5 | UI | Customer create / edit forms with German labels and validation messages | 2026-01-08 |
| S2-6 | UI | Customer detail page with contact, heating system, and notes sections | 2026-01-08 |
| S2-7 | UI | Custom `MultiSelect` component for energy sources and storage systems | 2026-01-08 |
| S2-8 | UI | Toast notifications (sonner) for all CRUD operations — messages in German | 2026-01-08 |
| S2-9 | UI | Horizontal form layout with 4 thematic sections, responsive design | 2026-01-08 |
| S2-10 | Config | `src/config/heating-systems.json` — 9 categories, 30+ manufacturers | 2026-01-08 |

### Sprint 3 — Heater & Maintenance Management (before 2026-01-13)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| S3-1 | Backend | Heater CRUD API (`/api/heaters`) with category/manufacturer/model structure | 2026-01-13 |
| S3-2 | Backend | Maintenance CRUD API (`/api/maintenances`) with photo upload | 2026-01-13 |
| S3-3 | Backend | Supabase Storage integration for maintenance photos | 2026-01-13 |
| S3-4 | Backend | Dashboard stats API (`/api/dashboard/stats`) — overdue/upcoming counts | 2026-01-13 |
| S3-5 | UI | Heater list page with search | 2026-01-13 |
| S3-6 | UI | Heater detail page with maintenance history | 2026-01-13 |
| S3-7 | UI | Maintenance form modal (add/edit) | 2026-01-13 |
| S3-8 | UI | Wartungen overview page with filters | 2026-01-13 |
| S3-9 | UI | Dashboard with stats (overdue, upcoming, total counts) | 2026-01-13 |
| S3-10 | UI | HeatingSystemSelector — cascading category → manufacturer → model dropdowns | 2026-01-13 |
| S3-11 | UI | StorageFields and BatteryFields split components | 2026-01-13 |
| S3-12 | UI | AddNewEntryModal — reusable modal for adding new heating categories/manufacturers | 2026-01-13 |
| S3-13 | UI | Pagination component | 2026-01-13 |

### Sprint 3 Architecture Upgrade (2026-01-13)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| A-1 | Architecture | TanStack Query v5 (React Query) integration — global QueryClient with 5-min stale time | 2026-01-13 |
| A-2 | Hooks | `useCustomers` hook — Customer CRUD with caching and query invalidation | 2026-01-13 |
| A-3 | Hooks | `useHeaters` hook — Heater CRUD with search/filter support | 2026-01-13 |
| A-4 | Hooks | `useMaintenances` hook — Maintenance CRUD operations | 2026-01-13 |
| A-5 | Hooks | `useDashboard` hook — Dashboard stats with 5-min refetch | 2026-01-13 |
| A-6 | TypeScript | Fixed all TS errors across API routes and pages (0 errors, clean build) | 2026-01-13 |
| A-7 | Infra | Production deployment on Vercel — initial setup | 2026-01-13 |

### Sprint 4 — Email Automation (2026-04-13 → 2026-04-14)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| S4-1 | Email | `src/lib/email/client.ts` — Resend singleton | 2026-04-13 |
| S4-2 | Email | `src/lib/email/opt-in.ts` — `computeOptInData()` with unit tests | 2026-04-13 |
| S4-3 | Email | `src/lib/email/service.tsx` — `sendReminder()`, `sendWeeklySummary()` | 2026-04-13 |
| S4-4 | Email | `ReminderEmail.tsx` — customer maintenance reminder template (German) | 2026-04-13 |
| S4-5 | Email | `WeeklySummaryEmail.tsx` — weekly summary template with stat blocks | 2026-04-13 |
| S4-6 | Email | `unsubscribe-token.ts` — HMAC-SHA256 stateless unsubscribe tokens with unit tests | 2026-04-13 |
| S4-7 | API | `POST /api/cron/daily-reminders` — sends reminders to customers with upcoming maintenance | 2026-04-13 |
| S4-8 | API | `POST /api/cron/weekly-summary` — sends weekly digest to shop owner | 2026-04-13 |
| S4-9 | API | `GET/POST /api/email/unsubscribe/[token]` — stateless unsubscribe endpoint | 2026-04-13 |
| S4-10 | UI | Public unsubscribe page (`/unsubscribe/[token]`) | 2026-04-13 |
| S4-11 | UI | Customer form: "Keine E-Mail-Erinnerungen" toggle + email suppression status badge | 2026-04-13 |
| S4-12 | Config | `vercel.json` cron schedules — daily 06:00 UTC, weekly Monday 07:00 UTC | 2026-04-13 |
| S4-13 | DB | `EmailLog`, `CronRun`, `EmailOptInStatus`, `EmailType` models added to Prisma schema | 2026-04-13 |
| S4-14 | Infra | Production deployment live on torqr.de — Cloudflare DNS + custom domain configured | 2026-04-14 |
| S4-15 | Email | Reminder email template redesigned — technician name, email, phone in footer; improved German copy | 2026-04-14 |
| S4-16 | Email | Email service updated to fetch and pass technician name + email alongside phone | 2026-04-14 |

### Sprint 5 — Cal.com Webhook Integration (2026-04-14)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| S5-1 | DB | `Booking` model added to Prisma schema with Cal.com fields | 2026-04-14 |
| S5-2 | DB | Bookings table created in Supabase | 2026-04-14 |
| S5-3 | API | `POST /api/webhooks/cal` — Cal.com webhook handler with HMAC verification | 2026-04-14 |
| S5-4 | API | Webhook: two-strategy customer resolution (metadata `customerId` first, email fallback) | 2026-04-14 |
| S5-5 | API | Webhook: user resolution via metadata `userId` first, organizer email fallback | 2026-04-14 |
| S5-6 | API | `GET /api/bookings` — bookings list endpoint scoped to authenticated user | 2026-04-14 |
| S5-7 | Hooks | `useBookings` hook — React Query hook for bookings data | 2026-04-14 |
| S5-8 | UI | Cal.com bookings section added to customer detail page | 2026-04-14 |
| S5-9 | Email | Reminder email Cal.com URL now embeds `?metadata[customerId]=...&metadata[userId]=...` | 2026-04-14 |

### Bugfixes & Improvements (2026-04-14)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| B-1 | Email | Unsubscribe URL used `localhost:3000` in production — fixed via `APP_URL` env var | 2026-04-14 |
| B-2 | UI | Edit customer page now redirects to customer detail page instead of list after save | 2026-04-14 |
| B-3 | UI | Dashboard nested `<a>` hydration error — replaced `<Link>` with `div` + `useRouter` | 2026-04-14 |