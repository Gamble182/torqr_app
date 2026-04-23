# Termine (Appointments) Management Page

**Status**: Decided — ready for implementation planning
**Date**: 2026-04-23
**Builds on**: Sprint 5 (Cal.com webhook), Sprint 13 (Booking↔System link), Sprint 14 (Terminiert badge), Sprint 15 (office-side BookingFormModal), Sprint 23 (Company-as-Tenant + role model)
**Related backlog**: #37 (Technician calendar view — partially addressed here), #45 (cancellation flow verify), #33 (multi-system booking — deferred)

---

## 1. Summary

Today, bookings are a passive side-effect — they appear on the dashboard preview, in the customer detail page's "Cal.com Buchungen" section, and as green "Terminiert" badges on systems. There is no surface where an OWNER (or a TECHNICIAN) can see all upcoming work, filter it, reschedule it, or cancel it.

This feature introduces `/dashboard/termine` as the **appointments home**: a first-class page with a list view and a monthly calendar view, filters, per-booking edit/reschedule/cancel actions, and a seamless Cal.com-API rescheduling integration so OWNERs never have to leave the app to change a Cal.com appointment.

Key architectural choices:

- **Source-agnostic model.** Cal.com bookings and manual bookings live in the same `Booking` table, already. The page renders them in one list and distinguishes them only with an icon + legend.
- **Reschedule-in-app, not link-out.** For Cal.com bookings, we call the Cal.com v2 Bookings API to reschedule. The webhook keeps our copy in sync (new: handle `BOOKING_RESCHEDULED` and `BOOKING_CANCELLED` trigger events — today we only process `BOOKING_CREATED`).
- **Customer notification is mandatory for manual reschedules.** The reschedule modal sends an email automatically when a customer has an opted-in address. No silent manual edits.
- **Role-aware.** OWNER sees all company bookings; TECHNICIAN sees only bookings on systems assigned to them.

---

## 2. Goals & Non-Goals

### Goals

- One page for all appointment management, replacing the scattered surfaces.
- Both list and monthly calendar views; users pick their mental model.
- Filters for the six dimensions that matter: time range, status, technician, customer, system type, source.
- Seamless rescheduling — Cal.com and manual bookings both use an in-app modal.
- Cancellation works end-to-end, including Cal.com-side via the API, with customer notification.
- The dashboard preview ("Gebuchte Termine") remains a preview; it links to the full page.
- The `Booking` model gains the ability to represent reschedule and cancellation state (not just CONFIRMED on creation).

### Non-Goals

- **No in-app Cal.com booking creation.** Customers still book via the reminder link → Cal.com UI. Only rescheduling and cancellation happen in-app.
- **No drag-and-drop rescheduling on the calendar view.** Click a date cell → modal. DnD is a future polish.
- **No multi-system booking.** Backlog #33 stays deferred.
- **No vacation/availability model.** Backlog #37's full scope (vacation, sick days, auto-rebook emails) remains a separate future feature.
- **No PDF/CSV export.** Explicitly deferred per user instruction.
- **No Cal.com event-type management in-app.** Configuration stays in the Cal.com dashboard.
- **No recurring bookings.** Out of scope.

---

## 3. Decisions

| # | Question | Decision |
|---|----------|----------|
| 1 | Calendar view in v1? | **Yes.** Monthly grid, not weekly or daily. Click a cell → day popover with that day's bookings. |
| 2 | Cal.com reschedule mechanism | **Cal.com v2 API.** POST `/v2/bookings/{uid}/reschedule` with new startTime + optional reason. Webhook handles the resulting `BOOKING_RESCHEDULED` event. |
| 3 | Cal.com cancel mechanism | **Cal.com v2 API.** POST `/v2/bookings/{uid}/cancel` with optional reason. Webhook handles the resulting `BOOKING_CANCELLED` event. |
| 4 | Reschedule/cancel failure mode | **Fail loudly.** If the Cal.com API call fails, surface the error to the OWNER (toast + inline message). Never leave our DB desynced. |
| 5 | Manual booking reschedule → customer email? | **Yes, always, when customer has opt-in email.** Modal has a "Kunden benachrichtigen" checkbox, default checked, disabled when no email. |
| 6 | Manual booking cancel → customer email? | **Yes, same rules.** New `BookingCancellationEmail` template. |
| 7 | TECHNICIAN permissions on Termine page | **View and cancel own**, cannot reschedule (would require coordinating with OWNER). Cannot see other technicians' bookings. |
| 8 | Source differentiation | **Icon (Cal.com logo or link icon for cal; wrench/manuell icon) + legend** under the list header. |
| 9 | Where does "Termine" sit in nav? | Top-level nav item between "Wartungen" and "Mitarbeiter". Icon: `CalendarIcon`. Visible to both roles. |
| 10 | Filter persistence | URL-driven. Query string: `?view=list\|calendar&range=upcoming\|week\|month\|past\|all&status=...&assignee=...&customerId=...&systemType=...&source=cal\|manual\|all`. |
| 11 | Default view | List, range "Anstehend" (upcoming), all statuses except CANCELLED. |
| 12 | Can CANCELLED bookings be un-cancelled? | **No.** Once cancelled, the booking is historical. Create a new one to rebook. Matches Cal.com semantics. |
| 13 | What happens on RESCHEDULED? | Cal.com creates a **new** booking with a `rescheduledFromUid` reference; the old one is marked RESCHEDULED. We mirror: the new booking is inserted, the old one's status goes to RESCHEDULED. Both visible in history; only the new one shows in "Anstehend". |
| 14 | Where do we show the reschedule chain? | Booking detail row: "Verschoben von {date} am {when}". Hover/click → link to the original booking's row (if still visible with current filters). |
| 15 | Dashboard tile | Keep "Gebuchte Termine" as a preview (top 5 upcoming). Add "Alle Termine anzeigen →" link. |
| 16 | Existing "Cal.com Buchungen" section on customer detail | Keep. Narrow it to bookings for that customer only. Add "Alle Termine →" link with pre-filled `customerId` filter. |

---

## 4. Data Model

### 4.1 `Booking` — add reschedule metadata

```prisma
model Booking {
  id                    String         @id @default(uuid())
  calBookingUid         String         @unique
  triggerEvent          String         // existing: BOOKING_CREATED | BOOKING_MANUAL | (new) BOOKING_RESCHEDULED
  startTime             DateTime
  endTime               DateTime?
  title                 String?
  attendeeName          String?
  attendeeEmail         String?
  status                BookingStatus  @default(CONFIRMED)

  // NEW fields
  cancelReason          String?        // populated on CANCELLED via API or webhook
  cancelledAt           DateTime?
  rescheduledFromUid    String?        // Cal.com uid of the prior booking, when this one was born via reschedule
  rescheduledToUid      String?        // set on the OLD booking when it's superseded
  rescheduledAt         DateTime?

  // existing relations unchanged
  company               Company        @relation(...)
  companyId             String
  user                  User           @relation("CreatedBookings", ...)
  userId                String
  assignedToUser        User?          @relation("AssignedBookings", ...)
  assignedToUserId      String?
  customer              Customer?      @relation(...)
  customerId            String?
  system                CustomerSystem? @relation(...)
  systemId              String?
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt
}

enum BookingStatus {
  CONFIRMED
  CANCELLED
  RESCHEDULED   // marks the superseded booking after a reschedule
}
```

Migration: single Prisma migration adding the four new columns. All nullable. No backfill needed.

### 4.2 No new tables

Email-send tracking reuses the existing `EmailLog` model with new enum values:

```prisma
enum EmailType {
  // existing
  REMINDER
  WEEKLY_SUMMARY
  BOOKING_CONFIRMATION
  // NEW
  BOOKING_RESCHEDULED
  BOOKING_CANCELLED
}
```

---

## 5. API Surface

### 5.1 Existing endpoints (modifications)

| Method | Path | Role | Change |
|--------|------|------|--------|
| GET | `/api/bookings` | OWNER + TECHNICIAN (scoped) | Add query params: `range`, `status[]`, `assignee`, `customerId`, `systemType`, `source`, `from`, `to`. Pagination optional (default 200 rows — usually enough). Returns `source: 'cal' \| 'manual'` derived from `triggerEvent`. |
| POST | `/api/bookings` | OWNER | No change (existing manual booking creation). |
| POST | `/api/webhooks/cal` | (public, HMAC) | Extend to handle `BOOKING_RESCHEDULED` and `BOOKING_CANCELLED` events — update the existing row's status/cancelReason/rescheduledAt, insert the new row for reschedules. |

### 5.2 New endpoints

| Method | Path | Role | Purpose |
|--------|------|------|---------|
| PATCH | `/api/bookings/[id]` | OWNER (manual) / OWNER (cal) | Reschedule a booking. Body: `{ startTime, endTime?, notifyCustomer, reason? }`. Branches by `source`: manual → local update + email; cal → Cal.com API + wait for webhook → local mirror. |
| DELETE | `/api/bookings/[id]` | OWNER + TECHNICIAN (own) | Cancel a booking. Body: `{ notifyCustomer, reason? }`. Same branching. |
| GET | `/api/bookings/[id]` | OWNER + TECHNICIAN (own) | Fetch a single booking with full detail for the edit/cancel modals. |

### 5.3 Cal.com integration module

**File:** `src/lib/cal-com/client.ts` (new)

```ts
// Thin wrapper around Cal.com v2 API.
// Auth: API key from process.env.CAL_COM_API_KEY (new env var).
// Base URL: https://api.cal.com/v2

export async function rescheduleCalBooking(params: {
  uid: string;
  startTime: Date;
  reschedulingReason?: string;
}): Promise<{ newUid: string }>;

export async function cancelCalBooking(params: {
  uid: string;
  cancellationReason?: string;
}): Promise<void>;

// Both throw CalComApiError with status + body on non-2xx.
```

Idempotency and retry are out of scope — if the API call fails, the caller surfaces the error. The webhook will still reconcile if the Cal.com side succeeded but our DB write failed (because `calBookingUid` unique upsert is already how the webhook handler works).

### 5.4 Email service additions

**File:** `src/lib/email/service.tsx` (modified)

```ts
export async function sendBookingReschedule(bookingId: string): Promise<void>;
export async function sendBookingCancellation(bookingId: string): Promise<void>;
```

Same pattern as the existing `sendBookingConfirmation`: skip if customer has no email / is UNSUBSCRIBED, write `EmailLog`, fire-and-forget from the API route (non-blocking on HTTP response).

### 5.5 Email templates

**File:** `src/lib/email/templates/BookingRescheduleEmail.tsx` (new)
**File:** `src/lib/email/templates/BookingCancellationEmail.tsx` (new)

German copy, matching the existing `BookingConfirmationEmail` layout and brand.

Reschedule template fields:
- `customerName`, `oldDateTime`, `newDateTime`, `heaterLabel`, `companyContact` (name, email, phone, companyName)
- Copy: "Ihr Wartungstermin wurde verschoben von {oldDateTime} auf {newDateTime}. Falls dieser Termin nicht passt, kontaktieren Sie uns direkt unter {phone} / {email}."

Cancel template fields:
- `customerName`, `cancelledDateTime`, `heaterLabel`, `reason?`, `companyContact`
- Copy: "Ihr Wartungstermin am {cancelledDateTime} wurde storniert. {reason ? 'Grund: X' : ''} Buchen Sie einen neuen Termin: {reminderLink (Cal.com URL, pre-filled)}."

---

## 6. UI Surface

### 6.1 Nav entry

**File:** `src/components/DashboardNav.tsx` (modified)

Add between "Wartungen" and "Mitarbeiter":
```ts
{ name: 'Termine', href: '/dashboard/termine', icon: CalendarIcon }
```

### 6.2 Page skeleton

**File:** `src/app/dashboard/termine/page.tsx` (new — client component)

```tsx
- Header row: title "Termine", view toggle (Liste | Kalender), "Termin erstellen" button (OWNER, opens existing BookingFormModal)
- Filter bar: 6 controls (collapsible on mobile into a single "Filter" button with sheet)
- Body: list view OR calendar view based on query param
- Legend strip: "🟢 Cal.com · 🔧 Manuell" (small, below filters)
```

### 6.3 Filter bar

**File:** `src/components/termine/TermineFilters.tsx` (new)

Controls — all URL-driven, default values when unspecified:

| Control | Values | Default |
|---------|--------|---------|
| Zeitraum | Anstehend · Diese Woche · Dieser Monat · Vergangen · Alle | Anstehend |
| Status | Bestätigt · Storniert · Verschoben · Alle | Bestätigt |
| Techniker | Alle · {each active tech} · Nicht zugewiesen | Alle (OWNER); fixed "Meine" for TECHNICIAN |
| Kunde | autocomplete | — |
| System | Alle · Heizung · Klima · Wasser · Energiespeicher | Alle |
| Quelle | Alle · Cal.com · Manuell | Alle |

Implementation: `useSearchParams()` + `useRouter()` — no local state.

### 6.4 List view

**File:** `src/components/termine/TermineList.tsx` (new)

Row layout (desktop):

```
[source icon]  {date, weekday, time}    {customer}     {system (manuf. model)}     [assignee badge (OWNER only)]    [status badge]    [⋯ actions]
```

Mobile: stacked card layout with the same fields.

Row actions menu (three-dot popover):
- OWNER, CONFIRMED: Details · Umplanen · Stornieren
- OWNER, RESCHEDULED: Details · "Verschoben zu neuem Termin anzeigen"
- OWNER, CANCELLED: Details (read-only)
- TECHNICIAN, CONFIRMED (own only): Details · Stornieren
- TECHNICIAN, others: Details only

Click anywhere else on row: open Details drawer (read-only summary with links to customer, system, reschedule chain).

Empty state: "Keine Termine im gewählten Zeitraum." with a link to adjust filters.

### 6.5 Calendar view

**File:** `src/components/termine/TermineCalendar.tsx` (new)

Monthly grid:

- Header: month navigator (← October 2026 →), "Heute" button jumps to current month
- 7-column grid (Mon–Sun, German week start)
- Each cell: date number; list of up to 3 bookings as compact chips (`10:00 — Müller · Heizung`); "+ N weitere" link when more than 3
- Cell click (not a chip): opens day popover listing all bookings for that date
- Chip click: opens Details drawer (same component as list view's)
- Today cell: highlighted with `ring-primary`
- Past cells: slightly dimmed
- Works on mobile: cells become vertically stacked "agenda" style below md breakpoint; pure grid above md

No library dependency for v1 — render the grid with pure CSS grid + Tailwind. Date math via `date-fns` (already a transitive dep via shadcn/ui) or native `Intl.DateTimeFormat` + manual arithmetic. Preference: add `date-fns` explicitly if not already a direct dep.

### 6.6 Reschedule modal

**File:** `src/components/termine/RescheduleBookingModal.tsx` (new)

Opened from the list row menu or calendar day popover. Props: `{ booking, onClose, onSuccess }`.

Fields:
- Current date/time (read-only summary)
- New date (date picker, min: today)
- New time (time picker, HH:mm, 15-min increments)
- Duration (select: inherits from old booking; editable for manual bookings only — Cal.com duration is event-type-bound)
- "Kunden benachrichtigen" checkbox (default checked, disabled when no customer email or opted-out — with explanation tooltip)
- "Grund (optional)" textarea — passed to Cal.com API for the `reschedulingReason` field; included in customer email for manual reschedules

Submit:
- Manual: PATCH `/api/bookings/[id]` with new startTime/endTime + notifyCustomer + reason. Local update + optional email.
- Cal.com: PATCH `/api/bookings/[id]` → server calls `rescheduleCalBooking()`. Server mirrors the response into DB. Webhook will re-reconcile if needed.

Loading / error states: full-modal loader during submit; on error, inline red banner with retry button. Never leaves a "maybe saved" state — either OK toast or visible error.

### 6.7 Cancel modal

**File:** `src/components/termine/CancelBookingModal.tsx` (new)

Shares structure with reschedule:
- Booking summary (read-only)
- "Kunden benachrichtigen" checkbox (same rules)
- "Grund (optional)" textarea
- Destructive confirm button: "Termin stornieren"

Submit: DELETE `/api/bookings/[id]` — same manual/cal branching logic server-side.

### 6.8 Details drawer

**File:** `src/components/termine/BookingDetailsDrawer.tsx` (new)

Right-side drawer on desktop, bottom sheet on mobile. Read-only.

Sections:
- Termin-Details: date/time, duration, status
- Kunde: name, phone, email, address → link to `/dashboard/customers/{id}`
- System: manufacturer/model → link to `/dashboard/systems/{id}`
- Zugewiesen: avatar + name (OWNER only)
- Quelle: icon + label
- Verlauf: "Erstellt am X" / "Verschoben am Y von Z" / "Storniert am W: Grund"
- Actions (footer): Umplanen · Stornieren (role-gated)

### 6.9 Dashboard updates

**File:** `src/app/dashboard/page.tsx` (modified)

- "Gebuchte Termine" tile: unchanged content (top 5 upcoming CONFIRMED), add footer link "Alle Termine anzeigen →" → `/dashboard/termine`.

### 6.10 Customer detail page updates

**File:** `src/app/dashboard/customers/[id]/page.tsx` (modified)

- The existing "Cal.com Buchungen" section is renamed "Termine" and shows ALL bookings for this customer (manual + Cal.com). Shows source icons.
- Add footer link: "Alle Termine zu diesem Kunden →" → `/dashboard/termine?customerId={id}`.

---

## 7. Webhook Changes

**File:** `src/app/api/webhooks/cal/route.ts` (modified)

Current state: only processes `BOOKING_CREATED`; ignores others.

New state:

### 7.1 `BOOKING_CREATED`

No change from today.

### 7.2 `BOOKING_RESCHEDULED`

Payload contains the NEW booking (new uid, new startTime) and a reference to the original (`rescheduledBy` or `fromReschedule.uid` depending on Cal.com version — confirm at impl time).

Handler:
1. Look up the original booking by `rescheduledFromUid`.
2. If found: set `original.status = RESCHEDULED`, `original.rescheduledToUid = <newUid>`, `original.rescheduledAt = now()`.
3. Insert the new booking row with `triggerEvent: 'BOOKING_RESCHEDULED'`, `rescheduledFromUid: <originalUid>`, standard customer/system resolution.
4. Skip sending `BOOKING_CONFIRMATION` email (this was initiated from our side or by the customer; they already know). Instead send `BOOKING_RESCHEDULED` email to the customer.

### 7.3 `BOOKING_CANCELLED`

1. Look up booking by `calBookingUid`.
2. Set `status = CANCELLED`, `cancelledAt = now()`, `cancelReason = <payload.reason>`.
3. Send `BOOKING_CANCELLED` email to customer.

### 7.4 Idempotency

All handlers use `upsert` / `update` by unique `calBookingUid` + `updatedAt` comparisons so retries are safe.

### 7.5 HMAC fail-open bug

Open backlog #58 (Cal.com webhook HMAC fails open when secret is unset) should be fixed as part of this work. It is in scope because we're modifying this route anyway.

---

## 8. Cal.com API — Environment & Config

New env vars:

| Variable | Scope | Purpose |
|----------|-------|---------|
| `CAL_COM_API_KEY` | Server | v2 API bearer token for reschedule/cancel operations |
| `CAL_COM_API_BASE` | Server | Default `https://api.cal.com/v2` — override for staging |

No changes to `CAL_WEBHOOK_SECRET`.

Rate limits: Cal.com v2 API — treat generously; we only call on user action.

---

## 9. Roles & Permissions

| Action | OWNER | TECHNICIAN |
|--------|:-----:|:----------:|
| View `/dashboard/termine` | ✅ | ✅ (own only) |
| List view | ✅ | ✅ |
| Calendar view | ✅ | ✅ |
| Filter by technician | ✅ | ❌ (hidden, fixed to own) |
| Create manual booking | ✅ | ❌ |
| Reschedule manual booking | ✅ | ❌ |
| Reschedule Cal.com booking | ✅ | ❌ |
| Cancel own booking | ✅ | ✅ |
| Cancel others' bookings | ✅ | ❌ 403 |
| View details drawer | ✅ | ✅ (own) |

"Own" for TECHNICIAN = bookings on systems where `system.assignedToUserId == <technician.userId>` OR `booking.assignedToUserId == <technician.userId>`.

---

## 10. Empty & Error States

| Scenario | UI |
|----------|----|
| No bookings at all | List: "Noch keine Termine." + "Termin erstellen" CTA (OWNER). Calendar: empty month. |
| No bookings match filters | List: "Keine Termine mit diesen Filtern." + "Filter zurücksetzen" link. Calendar: dim all cells, show banner. |
| Cal.com API unavailable (reschedule fail) | Modal banner: "Verbindung zu Cal.com fehlgeschlagen. Bitte erneut versuchen." Booking remains unchanged. |
| Customer has no email, checkbox disabled | Explanatory tooltip: "Kein E-Mail-Kontakt hinterlegt — Benachrichtigung nicht möglich." |
| Customer opted out | Checkbox disabled: "Kunde hat Benachrichtigungen abgemeldet." |
| Manual reschedule DB write fails after optimistic UI | Toast error + refetch; no partial state. |

---

## 11. Performance

- `/api/bookings` list query: default limit 200 rows. With 4 filters, this covers >95% of realistic OWNER views. Pagination fields reserved in the response shape but not rendered in v1.
- Calendar view fetches the visible month only (`from`, `to` query params). Month navigation triggers a refetch — cached per-month via React Query key `['bookings', 'calendar', yearMonth, filters]`.
- `staleTime: 30_000` for both views (existing `useBookings` convention).
- Avoid N+1 on include: `customer: { select }`, `system: { select: { catalog: {...} } }`, `assignedToUser: { select }`.

---

## 12. Migration

### 12.1 Schema

Single Prisma migration:
- `Booking.cancelReason`, `cancelledAt`, `rescheduledFromUid`, `rescheduledToUid`, `rescheduledAt` — all nullable, no backfill.
- `BookingStatus` enum: add `RESCHEDULED` value. Prisma migration handles via `ALTER TYPE ... ADD VALUE`.
- `EmailType` enum: add `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED` values.

### 12.2 Env

Add `CAL_COM_API_KEY` to Vercel env (production + preview + dev) before deploying. Feature is disabled in-app when the key is missing (the reschedule/cancel paths for cal-sourced bookings fall back to a link-out to the Cal.com booking page with a banner "Setup: CAL_COM_API_KEY fehlt — OWNER kontaktieren").

### 12.3 Feature flag?

No. Ship behind normal role checks. If the API key is missing, the UI gracefully degrades for Cal.com bookings (manual bookings are unaffected and fully functional).

---

## 13. Observability

- Every Cal.com API call logs a line: `[cal-com] reschedule uid=X status=Y duration=Zms`. Errors go to Sentry.
- `EmailLog` rows track every notification email — existing infrastructure.
- Webhook handler logs which event type was received and what action was taken.

---

## 14. Open Questions (intentionally deferred)

- DnD rescheduling on the calendar view.
- Weekly/daily calendar modes.
- Recurring bookings.
- In-app Cal.com booking creation (as opposed to reschedule/cancel).
- Integration with vacation/availability model (backlog #37).
- Export to PDF / CSV (per user instruction — skip).
