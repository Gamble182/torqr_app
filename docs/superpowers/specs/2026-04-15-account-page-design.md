# Design Spec: Account & Settings Page

**Date:** 2026-04-15
**Status:** Approved
**Backlog items:** #5, #8, #9

---

## Overview

A single scrolling settings page at `/dashboard/account` for the authenticated shop owner (Max). Covers profile management, credentials, notification preferences, and manual email actions.

Linked from the bottom-left avatar/user chip in the dashboard sidebar.

---

## Route & File Structure

| Path | Purpose |
|------|---------|
| `src/app/dashboard/account/page.tsx` | Page entry point — thin wrapper, loads `useUser` hook |
| `src/components/account/ProfileCard.tsx` | Section 1: name, email, phone, company name |
| `src/components/account/PasswordCard.tsx` | Section 2: change password |
| `src/components/account/NotificationsCard.tsx` | Section 3: email preference toggles |
| `src/components/account/EmailActionsCard.tsx` | Section 4: manual email triggers |
| `src/hooks/useUser.ts` | React Query hook — fetch and mutate current user data |
| `src/app/api/user/profile/route.ts` | `GET` + `PATCH` — profile fields |
| `src/app/api/user/password/route.ts` | `PATCH` — password change |
| `src/app/api/user/preferences/route.ts` | `GET` + `PATCH` — notification toggles |

---

## Data Model Changes

### User model (Prisma)

Two new fields added to `User`:

```prisma
companyName  String?  // Appears in reminder email footer
emailWeeklySummary Boolean @default(true) // Notification preference
```

Migration required. `companyName` is optional (nullable). `emailWeeklySummary` defaults to `true`.

---

## Page Layout

Route: `/dashboard/account`

**Page header:**
- Title: "Konto & Einstellungen"
- Subtitle: authenticated user's email address (read-only, muted text)

Four independent cards stacked vertically, each with its own form and save action. No shared state between cards.

---

## Section 1 — Profil

**Card heading:** "Profil"

| Field | Label (DE) | Type | Required | Notes |
|-------|-----------|------|----------|-------|
| `name` | Vollständiger Name | text | Yes | |
| `email` | E-Mail-Adresse | email | Yes | Validated format |
| `phone` | Telefonnummer | tel | No | Appears in reminder email footer |
| `companyName` | Firmenname | text | No | Appears in reminder email footer. New field. |

**Save action:** `PATCH /api/user/profile`
**Request body:** `{ name, email, phone, companyName }` — Zod validated
**Success:** toast "Profil erfolgreich gespeichert"
**Error:** inline field errors + toast "Fehler beim Speichern"

**Validation (Zod):**
- `name`: non-empty string
- `email`: valid email format, unique check server-side
- `phone`: optional string
- `companyName`: optional string, max 100 chars

---

## Section 2 — Passwort ändern

**Card heading:** "Passwort ändern"

| Field | Label (DE) | Type | Required | Notes |
|-------|-----------|------|----------|-------|
| `currentPassword` | Aktuelles Passwort | password | Yes | Verified against bcrypt hash |
| `newPassword` | Neues Passwort | password | Yes | Min 8 characters |
| `confirmPassword` | Passwort bestätigen | password | Yes | Must match `newPassword` |

**Save action:** `PATCH /api/user/password`
**Request body:** `{ currentPassword, newPassword }` — `confirmPassword` validated client-side only
**Success:** fields reset to empty, toast "Passwort erfolgreich geändert"
**Error cases:**
- Wrong current password → 400 `"Aktuelles Passwort ist falsch"`
- Weak new password → Zod validation error
- Mismatch confirm → client-side only, never sent to server

---

## Section 3 — Benachrichtigungen

**Card heading:** "Benachrichtigungen"

Single toggle row:

| Toggle | Label (DE) | Description | Default |
|--------|-----------|-------------|---------|
| `emailWeeklySummary` | Wochenzusammenfassung | "Wöchentliche E-Mail mit offenen Wartungen und Buchungsübersicht erhalten" | `true` |

**Save action:** `PATCH /api/user/preferences`
**Request body:** `{ emailWeeklySummary: boolean }`
**Behavior:** Toggle fires save immediately on change (no explicit button needed — single boolean, low stakes)
**Success:** subtle toast "Einstellung gespeichert"

---

## Section 4 — E-Mail-Aktionen

**Card heading:** "Manuelle E-Mail-Aktionen"

Two action rows with description text and a trigger button each.

### Row 1 — Wochenzusammenfassung

| Property | Value |
|----------|-------|
| Description | "Wochenzusammenfassung jetzt manuell an deine E-Mail-Adresse senden" |
| Button label | "Jetzt senden" |
| API call | `POST /api/cron/weekly-summary` (existing endpoint, reused) |
| Loading state | Button disabled + spinner while request in-flight |
| Success | Toast: "Wochenzusammenfassung wurde gesendet" |
| Error | Toast: "Fehler beim Senden. Bitte erneut versuchen." |

### Row 2 — Reserved

Placeholder slot for future manual triggers (e.g., daily reminders). Not rendered in v1.

---

## Hook — `useUser`

New React Query hook at `src/hooks/useUser.ts`.

```ts
// Exposes:
data: { name, email, phone, companyName, emailWeeklySummary }
updateProfile(fields): Promise<void>    // PATCH /api/user/profile
updatePassword(fields): Promise<void>   // PATCH /api/user/password
updatePreferences(fields): Promise<void> // PATCH /api/user/preferences
isLoading: boolean
```

Query key: `['user']`. Stale time: 5 minutes (consistent with other hooks).
On successful mutation: `queryClient.invalidateQueries({ queryKey: ['user'] })`.

---

## API Routes

### `GET /api/user/profile`
Returns: `{ name, email, phone, companyName }`
Auth: `requireAuth()` — scoped to `session.user.id`

### `PATCH /api/user/profile`
Body: `{ name?, email?, phone?, companyName? }` (Zod validated)
Returns: updated user fields
Guards: email uniqueness check (excluding current user)

### `PATCH /api/user/password`
Body: `{ currentPassword, newPassword }` (Zod validated)
Logic: verify `currentPassword` against stored bcrypt hash → hash `newPassword` → update
Returns: `{ success: true }`

### `GET /api/user/preferences`
Returns: `{ emailWeeklySummary }`

### `PATCH /api/user/preferences`
Body: `{ emailWeeklySummary: boolean }`
Returns: updated preferences

---

## Sidebar Link

`src/app/dashboard/layout.tsx` — bottom-left avatar/user chip updated to link to `/dashboard/account`.

Displays: user's `name` (or email as fallback) + avatar initials.

---

## Email Impact

`companyName` and `phone` from the User model already flow into the reminder email footer via `src/lib/email/service.tsx`. No template changes needed — the service fetches these fields when sending. The new `companyName` field will automatically appear once populated.

`emailWeeklySummary` preference must be checked in `src/app/api/cron/weekly-summary/route.ts` before sending — skip users where this flag is `false`.

---

## Out of Scope (Backlog)

| Item | Backlog # |
|------|-----------|
| Delete account / danger zone | TBD |
| Manual reminder trigger on customer detail page | TBD |
| Weekly summary email content refinement | TBD |

---

## Implementation Order

1. Prisma migration — add `companyName`, `emailWeeklySummary` to User
2. API routes — `user/profile`, `user/password`, `user/preferences`
3. `useUser` hook
4. Page + 4 card components
5. Sidebar avatar chip link
6. Wire `emailWeeklySummary` check into weekly summary cron
