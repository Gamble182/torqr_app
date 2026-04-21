# Sprint 19 — Email Rework Design Spec

**Date:** 2026-04-21
**Features:** Backlog #13 (weekly summary rethink), #40 (editable email templates)
**Author:** brainstorming session

---

## Goal

Two changes to the email system:

1. **Rethink the weekly summary email** from a passive stats dashboard into an actionable weekly plan — showing what's booked, what's due but unbooked, what's overdue, and a compact retro of last week.
2. **Allow users to customize the reminder email wording** — greeting and body text — via two fields on the User model, editable on the account page.

Additionally: write a comprehensive email system documentation file (`docs/EMAIL-SYSTEM.md`) as a living reference.

---

## Feature 1: Weekly Summary Rethink (#13)

### Data Queries

All queries scoped to the authenticated user's `userId`.

| Query | Source | Window |
|-------|--------|--------|
| Bookings this week | `Booking` where `startTime` in next 7 days, `status = CONFIRMED` | Next 7 days |
| Due but unbooked | `CustomerSystem` where `nextMaintenance` in next 7 days AND system ID not in the set of `Booking.systemId` where `status = CONFIRMED` and `startTime > now` | Next 7 days |
| Overdue | `CustomerSystem` where `nextMaintenance < now` | All |
| Completed last week | `Maintenance` where `date` in past 7 days | Past 7 days |
| Reminders sent last week | `EmailLog` count where `sentAt` in past 7 days, `type` in (`REMINDER_4_WEEKS`, `REMINDER_1_WEEK`) | Past 7 days |
| Total customers | `Customer` count | All |
| Total systems | `CustomerSystem` count | All |

### Email Structure

Top to bottom:

#### 1. Brand Header
Same green torqr header as all other emails. No changes.

#### 2. Greeting + Week Label
```
Guten Tag {userName},

hier ist Ihre Wochenübersicht für den 21.04. – 27.04.2026.
```

#### 3. Termine diese Woche (confirmed bookings)
- Green left-border card style (`borderLeft: 3px solid #008000`, `backgroundColor: #E6F2E6`)
- Section label: "TERMINE DIESE WOCHE" (uppercase, small)
- List items: customer name (bold), system info (manufacturer + model), date + time
- Empty state: "Keine Termine diese Woche gebucht."
- Max 10 items. If more: "… und X weitere"

#### 4. Wartungen fällig — noch nicht gebucht (due, no booking)
- Amber left-border card style (`borderLeft: 3px solid #D97706`, `backgroundColor: #FEF3C7`)
- Section label: "WARTUNGEN FÄLLIG — NOCH NICHT GEBUCHT"
- List items: customer name (bold), system info, due date
- Empty state: "Alle fälligen Wartungen sind terminiert." (positive)
- Max 10 items. If more: "… und X weitere"
- **This is the key action section** — highlights the gap between what's due and what's scheduled

#### 5. Überfällige Wartungen (overdue)
- Red left-border card style (`borderLeft: 3px solid #DC2626`, `backgroundColor: #FEE2E2`)
- Section label: "ÜBERFÄLLIGE WARTUNGEN"
- List items: customer name (bold), system info, "X Tage überfällig"
- If empty: **section hidden entirely**
- Max 10 items. If more: "… und X weitere"

#### 6. Rückblick letzte Woche (retro)
- Neutral card style (`backgroundColor: #F3F4F6`, `borderLeft: 3px solid #9CA3AF`)
- Section label: "RÜCKBLICK LETZTE WOCHE"
- Single line with inline stats: "{X} Wartungen durchgeführt · {Y} Termine wahrgenommen · {Z} Erinnerungen versendet"
- If all zeros: "Keine Aktivitäten letzte Woche."

#### 7. Kurzstatistik
- No card, just a subtle text line above the footer
- "Gesamt: {X} Kunden · {Y} Anlagen"
- Small font, muted color (`#9A9A9A`, `fontSize: 12px`)

#### 8. Footer
Same as today: "torqr · Automatisch generiert"

### Changes to `sendWeeklySummary()`

The service function signature stays the same: `sendWeeklySummary(userId?: string)`.

Internally, the query block is replaced with the 7 queries listed above. All queries run in `Promise.all()` for performance.

The data is mapped to new props for the reworked `WeeklySummaryEmail` component.

### Changes to `WeeklySummaryEmail.tsx`

Complete rewrite of the template. New props interface:

```typescript
export interface WeeklySummaryEmailProps {
  userName: string;
  weekLabel: string;
  bookingsThisWeek: Array<{
    customerName: string;
    systemInfo: string;
    dateTime: string; // e.g. "Mi, 23.04. · 10:00 Uhr"
  }>;
  dueUnbooked: Array<{
    customerName: string;
    systemInfo: string;
    dueDate: string;
  }>;
  overdue: Array<{
    customerName: string;
    systemInfo: string;
    daysOverdue: number;
  }>;
  retro: {
    maintenancesCompleted: number;
    bookingsAttended: number;
    remindersSent: number;
  };
  totals: {
    customers: number;
    systems: number;
  };
}
```

### List Limits

Each list is capped at 10 items in the service layer before passing to the template. If the full count exceeds 10, an additional `…AndMore` count is passed so the template can render "… und X weitere".

Updated props with optional overflow counts:

```typescript
bookingsThisWeekMore?: number;  // total - 10, only if > 10
dueUnbookedMore?: number;
overdueMore?: number;
```

---

## Feature 2: Editable Email Templates (#40)

### Schema Change

Two new nullable fields on the `User` model:

```prisma
model User {
  // ... existing fields ...
  reminderGreeting  String?   // Custom greeting, e.g. "Hallo {customerName},"
  reminderBody      String?   // Custom body paragraphs
}
```

Migration: add two nullable columns — zero impact on existing users.

### Placeholder System

Single supported placeholder: `{customerName}`

Replacement at render time in the service layer via simple string replace:
```typescript
const greeting = (user.reminderGreeting ?? DEFAULT_GREETING)
  .replace('{customerName}', customerName);
const body = (user.reminderBody ?? DEFAULT_BODY);
```

Note: `{customerName}` in the body is also replaced if present, but the default body text doesn't use it (the greeting already addresses them).

### Default Values

When fields are `null`, the current hardcoded text is used:

**Default greeting:**
```
Guten Tag {customerName},
```

**Default body:**
```
die letzte Wartung Ihrer Heizungsanlage liegt in {weeksUntil} {weekWord} genau ein Jahr zurück.

Wir empfehlen, jetzt rechtzeitig einen neuen Wartungstermin zu buchen — regelmäßige Wartungen sichern den effizienten Betrieb Ihrer Anlage und beugen teuren Reparaturen vor.
```

The `{weeksUntil}` and `{weekWord}` placeholders in the default body are handled internally by the template (they depend on the reminder type, not user input). Users don't need to know about them — if they write custom body text, it replaces the entire default including those dynamic parts.

### What Stays Fixed (not editable)

- Brand header (torqr green bar)
- System info card (manufacturer, model, serial number, due date)
- CTA button ("Termin jetzt buchen")
- Contact section (phone, email — from user profile)
- Sign-off (name, company — from user profile)
- Unsubscribe footer

### Validation

Zod schemas in `validations.ts`:

```typescript
reminderGreeting: z.string().max(200).optional().nullable(),
reminderBody: z.string().max(1000).optional().nullable(),
```

### API Change

Extend `PATCH /api/user/profile` to accept `reminderGreeting` and `reminderBody`. No new endpoint.

### Template Change

`ReminderEmail.tsx` gets two new optional props:

```typescript
export interface ReminderEmailProps {
  // ... existing props ...
  customGreeting?: string;   // Already placeholder-replaced
  customBody?: string;       // Already placeholder-replaced
}
```

The template renders `customGreeting` instead of the hardcoded greeting line, and `customBody` instead of the two hardcoded paragraphs. Falls back to defaults if not provided.

### Service Change

In `sendReminder()`: read `user.reminderGreeting` and `user.reminderBody` from the already-fetched user object, apply placeholder replacement, pass to template.

### UI — Account Page

New **"E-Mail-Vorlage"** card on `/dashboard/account`:

- **Begrüßung** — single-line input, placeholder hint: `Guten Tag {customerName},`
- **Nachrichtentext** — textarea (~4 rows), placeholder hint showing the default body
- Helper text below: "Verfügbarer Platzhalter: {customerName}"
- Save button, uses existing `PATCH /api/user/profile` endpoint
- Empty fields = use defaults (made clear in the UI)

---

## Feature 3: Email System Documentation

New file: `docs/EMAIL-SYSTEM.md`

Comprehensive reference covering:

1. **Overview** — purpose of the email system, what it does
2. **Email Types** — table of all types with trigger, recipient, template file, subject line pattern
3. **Sending Infrastructure** — Resend provider, FROM_EMAIL, domain
4. **Cron Jobs** — daily reminders (06:00 UTC), weekly summary (Mon 07:00 UTC), deduplication window, CronRun tracking
5. **Opt-in / Unsubscribe Flow** — EmailOptInStatus enum, HMAC tokens, suppression logic
6. **Template Architecture** — React Email components, customizable vs. fixed sections
7. **Data Flow** — text-based flow: trigger → eligibility check → render → send → log
8. **Logging** — EmailLog fields, CronRun tracking
9. **Configuration** — all required env vars with descriptions
10. **Customization** — how user-editable fields work (Sprint 19 addition)

Written as a living document. Updated whenever the email system changes.

---

## Files Changed

### Modified
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `reminderGreeting` and `reminderBody` to User model |
| `src/lib/email/service.tsx` | Rewrite `sendWeeklySummary()` queries + pass custom fields in `sendReminder()` |
| `src/lib/email/templates/WeeklySummaryEmail.tsx` | Complete rewrite — new props, new sections |
| `src/lib/email/templates/ReminderEmail.tsx` | Add `customGreeting` / `customBody` props |
| `src/lib/validations.ts` | Add `reminderGreeting` / `reminderBody` to profile schema |
| `src/app/api/user/profile/route.ts` | Accept new fields in PATCH |
| `src/app/dashboard/account/page.tsx` | Add "E-Mail-Vorlage" card |

### New
| File | Purpose |
|------|---------|
| `prisma/migrations/[timestamp]_add_reminder_template_fields/migration.sql` | Add two columns |
| `docs/EMAIL-SYSTEM.md` | Complete email system documentation |

### No Changes Needed
- `src/lib/email/client.ts` — no changes
- `src/app/api/cron/*` — cron routes unchanged, they call the same service functions
- `BookingConfirmationEmail.tsx` — not customizable in this sprint
