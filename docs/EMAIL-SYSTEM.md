# Email System — Torqr

> Living reference document. Last updated: 2026-04-21 (Sprint 19).

---

## Overview

Torqr sends automated emails to customers (maintenance reminders, booking confirmations) and to the shop owner (weekly summary). All emails are in German. Sending is handled by [Resend](https://resend.com) via React Email templates.

---

## Email Types

| Type | Trigger | Recipient | Template | Subject Pattern |
|------|---------|-----------|----------|-----------------|
| `REMINDER_4_WEEKS` | Daily cron — system's `nextMaintenance` is 28 days away | Customer | `ReminderEmail.tsx` | `Wartungserinnerung – Ihre Anlage: Termin in 4 Wochen` |
| `REMINDER_1_WEEK` | Daily cron — system's `nextMaintenance` is 7 days away | Customer | `ReminderEmail.tsx` | `Wartungserinnerung – Ihre Anlage: Termin in 1 Woche` |
| `BOOKING_CONFIRMATION` | Manual booking created via `BookingFormModal` | Customer | `BookingConfirmationEmail.tsx` | `Ihr Wartungstermin am {date}` |
| `WEEKLY_SUMMARY` | Weekly cron (Mon 07:00 UTC) or manual trigger from account page | Shop owner (User) | `WeeklySummaryEmail.tsx` | `Wochenübersicht {weekLabel}` |
| `OPT_IN_CONFIRMATION` | (Planned, not yet implemented) | Customer | — | — |

---

## Sending Infrastructure

| Setting | Value |
|---------|-------|
| Provider | Resend |
| Client | Singleton in `src/lib/email/client.ts` |
| FROM address | `RESEND_FROM_EMAIL` env var (default: `noreply@torqr.de`) |
| Domain | `torqr.de` — DNS records (SPF, DKIM) configured in Cloudflare |

---

## Cron Jobs

### Daily Reminders

- **Route:** `GET /api/cron/daily-reminders`
- **Schedule:** Daily at 06:00 UTC (`vercel.json`)
- **Auth:** `Authorization: Bearer {CRON_SECRET}`
- **Logic:**
  1. For each reminder type (`REMINDER_4_WEEKS`, `REMINDER_1_WEEK`):
     - Find systems where `nextMaintenance` falls within ±1 day of the target window (28 or 7 days from now)
     - Exclude systems whose customer has `emailOptIn != CONFIRMED` or no email
     - Exclude systems where a reminder of the same type was already sent in the last 30 days (deduplication)
  2. Send reminder for each eligible system via `sendReminder(systemId, type)`
  3. Log results to `CronRun`

### Weekly Summary

- **Route:** `GET /api/cron/weekly-summary`
- **Schedule:** Monday at 07:00 UTC (`vercel.json`)
- **Auth:** `Authorization: Bearer {CRON_SECRET}`
- **Logic:**
  1. Resolve user via `SUMMARY_RECIPIENT_EMAIL` env var (cron) or `userId` param (manual trigger)
  2. Check `user.emailWeeklySummary` preference — skip if disabled
  3. Query 7 data sets in parallel (bookings, due/unbooked, overdue, completed, reminders sent, totals)
  4. Render `WeeklySummaryEmail` template and send via Resend
  5. Log results to `CronRun`

---

## Data Flow

```
┌─────────────┐     ┌──────────────────────┐     ┌───────────────┐
│ Vercel Cron  │────>│ /api/cron/daily-     │────>│ sendReminder()│
│ (06:00 UTC)  │     │ reminders            │     │               │
└─────────────┘     └──────────────────────┘     └───────┬───────┘
                                                          │
                    ┌──────────────────────┐              v
                    │ getEligibleSystemIds()│     ┌───────────────┐
                    │ - nextMaintenance     │     │ ReminderEmail  │
                    │ - emailOptIn check    │     │ (React Email)  │
                    │ - deduplication       │     └───────┬───────┘
                    └──────────────────────┘              │
                                                          v
┌─────────────┐     ┌──────────────────────┐     ┌───────────────┐
│ Vercel Cron  │────>│ /api/cron/weekly-    │────>│ Resend API    │
│ (Mon 07:00)  │     │ summary              │     │ (send email)  │
└─────────────┘     └──────────────────────┘     └───────┬───────┘
                                                          │
                    ┌──────────────────────┐              v
                    │ getEligibleSystemIds()│     ┌───────────────┐
                    │ - nextMaintenance     │     │ WeeklySummary  │
                    │ - emailOptIn check    │     │ (React Email)  │
                    │ - deduplication       │     └───────┬───────┘
                    └──────────────────────┘              │
                                                          v
┌─────────────┐     ┌──────────────────────┐     ┌───────────────┐
│ Office-side  │────>│ sendBooking-         │     │ Resend API    │
│ BookingModal │     │ Confirmation()       │     │ (send email)  │
└─────────────┘     └──────────────────────┘     └───────┬───────┘
                                                          │
                                                          v
                                                 ┌───────────────┐
                                                 │ EmailLog      │
                                                 │ (DB record)   │
                                                 └───────────────┘
```

---

## Opt-in / Unsubscribe Flow

### Customer Email Opt-in Status

The `Customer.emailOptIn` field tracks consent:

| Status | Meaning |
|--------|---------|
| `NONE` | No email address or no consent given |
| `PENDING` | Opt-in email sent, awaiting confirmation |
| `CONFIRMED` | Customer has confirmed — eligible for reminders |
| `UNSUBSCRIBED` | Customer has opted out — no further emails |

### Unsubscribe Tokens

- Stateless HMAC-SHA256 tokens — no DB lookup needed for verification
- Generated by `buildUnsubscribeUrl(customerId)` in `src/lib/email/unsubscribe-token.ts`
- Included in every reminder email footer
- Verified at `GET/POST /api/email/unsubscribe/[token]`
- On unsubscribe: sets `Customer.emailOptIn = UNSUBSCRIBED` and `Customer.unsubscribedAt`

### Suppression

The daily cron query filters on `emailOptIn = CONFIRMED`. Customers with `NONE`, `PENDING`, or `UNSUBSCRIBED` status never receive reminders. Additionally, the `Customer.email` field must be non-null.

---

## Template Architecture

All templates live in `src/lib/email/templates/` as React Email components.

| Template | File | Customizable (Sprint 19) |
|----------|------|--------------------------|
| Reminder | `ReminderEmail.tsx` | Yes — greeting and body text via user settings |
| Booking Confirmation | `BookingConfirmationEmail.tsx` | No |
| Weekly Summary | `WeeklySummaryEmail.tsx` | No |

### Fixed sections (all templates)
- Brand header (green torqr bar)
- Footer

### Reminder email structure
1. Brand header
2. **Greeting** (customizable) — default: "Guten Tag {customerName},"
3. **Body text** (customizable) — default: maintenance reminder paragraphs
4. System info card (manufacturer, model, serial, due date)
5. CTA button ("Termin jetzt buchen" — links to Cal.com with pre-filled metadata)
6. Contact section (technician phone + email from user profile)
7. Sign-off (name + company from user profile)
8. Unsubscribe footer

### Weekly summary structure (Sprint 19 rework)
1. Brand header
2. Greeting + week label
3. Termine diese Woche (confirmed bookings — green)
4. Wartungen fällig — noch nicht gebucht (due but unbooked — amber)
5. Überfällige Wartungen (overdue — red, hidden if empty)
6. Rückblick letzte Woche (retro — gray)
7. Kurzstatistik (total customers + systems)
8. Footer

### Placeholder system
- `{customerName}` — replaced at render time via simple string `.replace()`
- Applied to `reminderGreeting` and `reminderBody` fields from User model
- When fields are null, hardcoded defaults are used

---

## Logging

### EmailLog

Every email send creates an `EmailLog` record:

| Field | Description |
|-------|-------------|
| `customerId` | Which customer received the email |
| `type` | `EmailType` enum value |
| `sentAt` | Timestamp |
| `resendId` | Resend message ID (for tracking) |
| `error` | Error JSON if send failed |
| `opened` / `openedAt` | (Available but not yet tracked) |
| `clicked` / `clickedAt` | (Available but not yet tracked) |

### CronRun

Every cron execution creates a `CronRun` record:

| Field | Description |
|-------|-------------|
| `jobType` | `daily_reminders` or `weekly_summary` |
| `startedAt` / `completedAt` | Execution window |
| `status` | `RUNNING`, `SUCCESS`, or `FAILED` |
| `emailsSent` | Count of successfully sent emails |
| `errors` | JSON array of error messages |

---

## Configuration

### Required Environment Variables

| Variable | Description | Used By |
|----------|-------------|---------|
| `RESEND_API_KEY` | Resend API key | `src/lib/email/client.ts` |
| `RESEND_FROM_EMAIL` | Sender address (default: `noreply@torqr.de`) | `src/lib/email/client.ts` |
| `CRON_SECRET` | Bearer token for cron route auth | `daily-reminders`, `weekly-summary` routes |
| `SUMMARY_RECIPIENT_EMAIL` | Fallback email for weekly summary (cron mode) | `sendWeeklySummary()` |
| `CAL_COM_URL` | Cal.com booking page URL | `sendReminder()` |
| `APP_URL` | Base URL for unsubscribe links | `buildUnsubscribeUrl()` |
| `UNSUBSCRIBE_SECRET` | HMAC secret for unsubscribe tokens | `unsubscribe-token.ts` |

### Vercel Cron Configuration

In `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/daily-reminders", "schedule": "0 6 * * *" },
    { "path": "/api/cron/weekly-summary", "schedule": "0 7 * * 1" }
  ]
}
```

---

## Customization (Sprint 19)

Users can customize the reminder email wording via the account page ("E-Mail-Vorlage" card).

| Field | DB Column | Max Length | Default |
|-------|-----------|-----------|---------|
| Greeting | `User.reminderGreeting` | 200 chars | "Guten Tag {customerName}," |
| Body | `User.reminderBody` | 1000 chars | Standard reminder text |

- Empty/null = use defaults
- `{customerName}` placeholder supported in both fields
- Saved via `PATCH /api/user/profile`
- Applied at render time in `sendReminder()` before passing to `ReminderEmail` template
