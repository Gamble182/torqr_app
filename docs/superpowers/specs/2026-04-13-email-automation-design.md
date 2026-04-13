# Email Automation — Design Spec
**Date:** 2026-04-13
**Sprint:** 4
**Status:** Approved

---

## Overview

Automated email reminder system for heating maintenance appointments. Customers receive reminders 4 weeks and 1 week before their `nextMaintenance` date. Max (the technician) receives a weekly summary every Monday. All email logic is decoupled into a layered module under `src/lib/email/`.

Sprint 4 delivers the core email system + Cal.com booking link in emails.
Sprint 5 delivers the Cal.com webhook back to Torqr to auto-update maintenance records.

---

## Opt-in Model

### Consent Logic
Max enters the customer's email on-site after verbal consent — this constitutes confirmed consent. No double opt-in confirmation email is sent.

**Status transitions:**
```
Customer saved with email, suppress toggle OFF → emailOptIn = CONFIRMED, optInConfirmedAt = now()
Customer saved, suppress toggle ON (Max blocks)  → emailOptIn = NONE
Customer clicks unsubscribe link in email        → emailOptIn = UNSUBSCRIBED, unsubscribedAt = now()
```

The `PENDING` enum value remains in schema but is never assigned.

### UI Change (Customer Form)
Add a toggle/checkbox near the email input field:
- Label: **"Keine E-Mail-Erinnerungen"**
- Default: OFF (emails enabled)
- Present on both create and edit customer forms

---

## Module Structure

```
src/lib/email/
├── client.ts                   # Resend singleton instance
├── service.ts                  # sendReminder(), sendWeeklySummary()
├── opt-in.ts                   # confirmOptIn(), suppressOptIn()
└── templates/
    ├── ReminderEmail.tsx        # Customer reminder (shared for 4w + 1w)
    └── WeeklySummaryEmail.tsx   # Max's weekly summary

src/app/api/
├── cron/
│   ├── daily-reminders/route.ts    # Vercel Cron: daily 06:00 UTC
│   └── weekly-summary/route.ts     # Vercel Cron: Monday 07:00 UTC
└── email/
    └── unsubscribe/[token]/route.ts # HMAC-signed unsubscribe handler

src/app/
└── unsubscribe/
    └── [token]/page.tsx            # Public unsubscribe page (no auth)
```

---

## Cron Jobs

### Vercel Cron Configuration (`vercel.json`)
```json
{
  "crons": [
    { "path": "/api/cron/daily-reminders", "schedule": "0 6 * * *" },
    { "path": "/api/cron/weekly-summary",  "schedule": "0 7 * * 1" }
  ]
}
```

Both routes are secured with a `CRON_SECRET` header check — Vercel sends `Authorization: Bearer <CRON_SECRET>`.

### Daily Reminder Logic
1. Find all heaters where `nextMaintenance` falls in 4-week window (today+27d to today+29d) or 1-week window (today+6d to today+8d)
2. Filter: `customer.emailOptIn = CONFIRMED` and `customer.email` is non-null
3. Dedup: query `EmailLog` — skip if `REMINDER_4_WEEKS` / `REMINDER_1_WEEK` already sent for this customer within the last 30 days
4. Send via Resend → write row to `EmailLog` (including `resendId`)
5. Write `CronRun` record (jobType: `"daily_reminders"`, status: SUCCESS / FAILED)

### Weekly Summary Logic
1. Query: maintenances with `date` in next 7 days, heaters with `nextMaintenance < today` (overdue, emailOptIn = CONFIRMED), maintenances completed in last 7 days
2. Build stat payload: upcoming count, overdue count, completed count
3. Send to Max's email (from `User` record of the session owner / env var `SUMMARY_RECIPIENT_EMAIL`)
4. Write `EmailLog` (type: `WEEKLY_SUMMARY`) + `CronRun` record

---

## Unsubscribe Flow

**Token:** HMAC-SHA256(`customerId` + `UNSUBSCRIBE_SECRET`) — stateless, no extra DB column.

**Flow:**
1. Customer clicks unsubscribe link in email → `GET /unsubscribe/[token]`
2. Public page renders: confirmation message + "Abmelden" button
3. Button submits `POST /api/email/unsubscribe/[token]`
4. API verifies HMAC, sets `emailOptIn = UNSUBSCRIBED`, `unsubscribedAt = now()`
5. Page redirects to confirmation state: "Sie wurden erfolgreich abgemeldet."

---

## Email Templates

### Reminder Email (customer-facing, German)
**Subject:** `"Wartungserinnerung: Termin in 4 Wochen — [Hersteller] [Modell]"`
*(or "1 Woche" for the 1-week variant)*

**Body:**
- Greeting + upcoming maintenance date (formatted: `DD.MM.YYYY`)
- Heater details: manufacturer, model, serial number (if present)
- CTA button: **"Termin jetzt buchen"** → `CAL_COM_URL` env var
- Max's phone number for direct contact
- Footer: unsubscribe link

### Weekly Summary Email (Max-facing, German)
**Subject:** `"Wochenübersicht [DD.MM] – [DD.MM.YYYY]"`

**Body:**
- Stat blocks row: `📅 X anstehend · ⚠️ Y überfällig · ✅ Z abgeschlossen`
- Table: upcoming appointments this week (customer name, date, heater)
- Table: overdue maintenances (customer name, days overdue, heater)
- Footer: "Torqr · Automatisch generiert"

---

## Environment Variables Required

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Resend authentication |
| `RESEND_FROM_EMAIL` | Sender address (e.g. `noreply@torqr.de`) |
| `CRON_SECRET` | Secures cron route endpoints |
| `UNSUBSCRIBE_SECRET` | HMAC key for unsubscribe tokens |
| `CAL_COM_URL` | Cal.com booking page URL for Sprint 4 |
| `SUMMARY_RECIPIENT_EMAIL` | Max's email for weekly summary |
| `NEXTAUTH_URL` | Base URL for building unsubscribe links |

---

## What is NOT in Sprint 4

- Cal.com webhook → auto-update `nextMaintenance` in Torqr (Sprint 5)
- Open/click tracking via Resend webhooks (Sprint 5)
- Spare parts ordering system (future)
- Multi-user support for weekly summary (single user assumed)

---

## Testing Approach (Email Module)

- Unit tests on `opt-in.ts` logic (status transitions)
- Unit tests on cron query/dedup logic (Prisma mocked)
- Email sends verified against Resend test mode in dev — no live send in test suite
- Full testing spec handled in separate Sprint 4b spec

---

## Dependencies

- `resend ^6.6.0` — already installed
- `@react-email/components ^1.0.1` — already installed
- No new dependencies required
