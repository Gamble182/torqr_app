# Sprint Tracker — Torqr

> This file tracks the current sprint state. Update at the end of every session.
> Start new sessions by reading this file first.

---

## Current Sprint: Sprint 4 — Email Automation

**Started:** 2026-04-13
**Status:** 🟡 Planning complete — implementation not started

---

### Goal
Automated email reminders for heating maintenance appointments via Resend.
Customers self-book via Cal.com link. Max receives a weekly summary.

### Spec
[`docs/superpowers/specs/2026-04-13-email-automation-design.md`](docs/superpowers/specs/2026-04-13-email-automation-design.md)

### Implementation Plan
> To be generated — invoke `writing-plans` skill next session or continue current session.

---

### Task Breakdown

#### Backend / Email Module
- [ ] `src/lib/email/client.ts` — Resend singleton
- [ ] `src/lib/email/opt-in.ts` — confirmOptIn(), suppressOptIn()
- [ ] `src/lib/email/service.ts` — sendReminder(), sendWeeklySummary()
- [ ] `src/lib/email/templates/ReminderEmail.tsx` — customer reminder template
- [ ] `src/lib/email/templates/WeeklySummaryEmail.tsx` — weekly summary template

#### API Routes
- [ ] `src/app/api/cron/daily-reminders/route.ts`
- [ ] `src/app/api/cron/weekly-summary/route.ts`
- [ ] `src/app/api/email/unsubscribe/[token]/route.ts`

#### UI
- [ ] `src/app/unsubscribe/[token]/page.tsx` — public unsubscribe page
- [ ] Customer form: add "Keine E-Mail-Erinnerungen" toggle near email field

#### Config
- [ ] `vercel.json` — add cron schedule entries
- [ ] Env vars: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CRON_SECRET`, `UNSUBSCRIBE_SECRET`, `CAL_COM_URL`, `SUMMARY_RECIPIENT_EMAIL`

---

### What's Done (Sprints 1–3)
- ✅ Auth (login / register / sessions / login logging)
- ✅ Customer CRUD (HeatingType, multi-select energy sources, email opt-in field in schema)
- ✅ Heater CRUD (German heating system config, 9 categories, 30+ manufacturers)
- ✅ Maintenance CRUD (Supabase photo upload)
- ✅ Dashboard with stats (overdue / upcoming)
- ✅ Wartungen overview with filters
- ✅ React Query integration (useCustomers, useHeaters, useMaintenances, useDashboard)
- ✅ DB schema for email automation (EmailLog, CronRun, EmailOptInStatus, EmailType)

---

### Upcoming: Sprint 5 — Cal.com Webhook + Testing
- Cal.com webhook → auto-update `nextMaintenance` in Torqr on booking confirmed
- Resend open/click tracking webhooks
- Automated test suite (separate spec: `2026-04-13-testing-design.md` — not yet written)

---

## Notes / Decisions Log

| Date | Decision |
|------|----------|
| 2026-04-13 | No double opt-in email — on-site entry by Max = confirmed consent |
| 2026-04-13 | Cal.com for booking (external link in Sprint 4, webhook in Sprint 5) |
| 2026-04-13 | HMAC-SHA256 stateless unsubscribe tokens — no extra DB column |
| 2026-04-13 | Weekly summary: stat blocks with icons (no JS charts — email client limits) |
| 2026-04-13 | Architecture B: layered `src/lib/email/` module |
