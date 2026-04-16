# Mobile Responsiveness Design Spec

**Date:** 2026-04-16
**Backlog item:** #6
**Approach:** Option A — Page-by-page Tailwind breakpoint audit. No new abstractions, no architectural changes.

---

## Context

The app is used by heating technicians (primarily Max) on mobile devices during field work. The navigation (DashboardNav) already has a working mobile hamburger/drawer implementation. The `DashboardLayout` already handles `pt-14 lg:pt-0 lg:pl-65` for mobile/desktop switching.

**What is missing:** Responsive Tailwind classes on page content, correct input font sizes to prevent iOS auto-zoom, and sufficient touch target sizes.

---

## Usage Profile

| Scenario | Device | Must work perfectly |
|----------|--------|---------------------|
| Technician entering completed maintenance on-site | Mobile (375px+) | Yes — critical |
| Technician viewing customer / heater details | Mobile | Yes |
| Office work: creating customers, heaters | Desktop | Yes (mobile: functional) |
| Viewing wartungen list, dashboard stats | Mobile + Desktop | Yes |

---

## Breakpoint Baseline

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm` | 375px | Mobile baseline (iPhone SE and up) |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |

---

## Cross-Cutting Rules (apply to ALL pages)

These rules apply everywhere and are the foundation for all per-page changes:

1. **iOS Auto-Zoom Fix:** All `<input>`, `<select>`, `<textarea>` elements must have `text-base` (16px). iOS zooms in when font-size < 16px — this must be prevented on all forms.

2. **Touch Targets:** All primary action buttons: `min-h-[44px]`. All icon-only buttons: `w-10 h-10 min-w-[40px]`. (Apple HIG minimum touch target: 44×44px.)

3. **No horizontal scroll:** No page or component may cause horizontal overflow on `sm` (375px). Test by inspecting with `overflow-x: hidden` on body.

4. **Readable text:** Body text minimum `text-sm` (14px). Labels and secondary text minimum `text-xs` (12px).

---

## Per-Component / Per-Page Specs

---

### 1. MaintenanceFormModal — CRITICAL

**File:** `src/components/MaintenanceFormModal.tsx`

**Why critical:** The primary field workflow — technician enters completed maintenance on a phone after finishing a job.

**Changes:**
- All `<input>` and `<textarea>` elements: add `text-base` class
- Date input: ensure `h-11` height for touch target
- Notes textarea: `min-h-[120px]` so it's comfortable to type on mobile
- Close button (`XIcon`): change from `size="icon-sm"` to explicit `w-10 h-10`
- Submit button: `w-full` on mobile, `sm:w-auto` on larger screens — or just `w-full` since it's a modal
- Submit button height: `h-11`
- Photo grid: keep `grid-cols-3`, increase thumbnail height from `h-24` to `h-28` for easier tapping
- Photo remove button: ensure `w-8 h-8` minimum (currently small overlay button)
- Camera/upload button area: `min-h-[44px]`
- Modal card: already `max-w-2xl w-full max-h-[90vh] overflow-y-auto` — correct, no change needed
- Form spacing: `space-y-5` already — keep

---

### 2. HeaterFormModal

**File:** `src/components/HeaterFormModal.tsx`

**Changes:**
- All `<input>`, `<select>`: add `text-base`
- Select triggers: `h-11`
- Close button: `w-10 h-10`
- Submit button: `h-11 w-full`
- Form grid (if any): `grid-cols-1` on mobile
- Cancel/Submit button row: `flex-col sm:flex-row` with `gap-3`

---

### 3. Customer Detail Page

**File:** `src/app/dashboard/customers/[id]/page.tsx`

**Changes:**
- Quick Stats row: `grid-cols-2 lg:grid-cols-4` — already correct, keep
- Header action buttons (`Bearbeiten`, `Löschen`): wrap with `flex-wrap gap-2` so they stack on narrow screens
- Heater card action buttons (`Erledigt`, Edit icon, Delete icon): currently `flex gap-1.5` — change to `flex flex-wrap gap-2` so they don't overflow on small screens
- Heater detail grid (`grid-cols-2 md:grid-cols-4`): already responsive, keep
- Cal.com booking time display: allow line-break between date and time with `flex-col sm:flex-row`
- Sidebar quick-actions: already stacks below main content on mobile (single-column grid) — keep
- Contact info grid `md:col-span-2`: already adapts — keep

---

### 4. Customer List Page

**File:** `src/app/dashboard/customers/page.tsx`

**Changes:**
- Search input + filter/sort buttons row: wrap to `flex-col sm:flex-row gap-3` so the search bar gets full width on mobile
- "Neuer Kunde" button: keep as-is (top right), no FAB — just ensure `h-11` touch target
- Grid view (`grid-cols-1 sm:grid-cols-2`): verify this is actually applied (from code review, may need to add `sm:grid-cols-2`)
- List view rows: hide secondary info columns on mobile with `hidden sm:block` where appropriate (e.g. city + heater count can stay, but email column may be too dense)
- Filter pills/chips (if any): `flex-wrap` so they don't overflow
- View toggle buttons (grid/list): ensure `w-10 h-10` touch target

---

### 5. Customer New Page

**File:** `src/app/dashboard/customers/new/page.tsx`

**Changes:**
- All `<input>`, `<select>`, `<textarea>`: add `text-base`
- All form field heights: `h-11` on inputs
- Section grids already use `grid-cols-1 md:grid-cols-2` — correct, keep
- Submit/Cancel button row: `flex-col-reverse sm:flex-row` (Cancel on top on mobile = less likely to hit accidentally, Submit prominent)
- Submit button: `w-full sm:w-auto h-11`

---

### 6. Customer Edit Page

**File:** `src/app/dashboard/customers/[id]/edit/page.tsx`

**Changes:** Identical to Customer New Page — `text-base` on all inputs, `h-11` heights, button row `flex-col-reverse sm:flex-row`.

---

### 7. Dashboard Page

**File:** `src/app/dashboard/page.tsx`

**Changes:**
- Time-range toggle buttons: `w-full sm:w-auto` or `flex-1 sm:flex-none` so all three fit on mobile
- Stat cards: already responsive grid — verify `grid-cols-2 lg:grid-cols-4`
- Upcoming/Overdue list items: action button (`Erledigt`) must be `min-h-[44px]` and not truncated on narrow screens
- List item layout: on mobile, secondary info (address, phone) can stack below name with `flex-col`
- Section headers with "Alle anzeigen" links: `flex items-center justify-between` — already correct pattern, verify

---

### 8. Wartungen Page

**File:** `src/app/dashboard/wartungen/page.tsx`

**Changes:**
- Filter bar (status buttons + search): `flex-col sm:flex-row gap-3` so search input gets full width on mobile
- Export/Download button: `hidden sm:flex` — not needed during field use, hide on mobile
- Heater cards: ensure `flex-wrap` on badge + date info so nothing overflows
- Status badge + next maintenance date: allow stacking to `flex-col` on mobile if needed
- Each card's action area: `min-h-[44px]` touch targets

---

### 9. Heaters List Page

**File:** `src/app/dashboard/heaters/page.tsx`

**Changes:**
- Search input: `w-full` on mobile
- "Neues Heizsystem" button: `h-11`
- Heater list items: verify info doesn't overflow on narrow screens
- Customer name + city badges: `flex-wrap`

---

### 10. Heater Detail Page

**File:** `src/app/dashboard/heaters/[id]/page.tsx`

**Changes:**
- Header action buttons: `flex-wrap gap-2`
- Info grid: `grid-cols-1 sm:grid-cols-2` for heater specs
- Maintenance history list: verify date + notes layout on mobile

---

### 11. Heater New Page

**File:** `src/app/dashboard/heaters/new/page.tsx`

**Changes:**
- Cascading dropdowns (category/manufacturer/model): `grid-cols-1` on mobile (currently likely `md:grid-cols-3`)
- All `<input>`, `<select>`: `text-base`, `h-11`
- Storage/Battery subsections: same grid treatment
- Submit button row: `flex-col-reverse sm:flex-row`

---

### 12. Account Page

**File:** `src/app/dashboard/account/page.tsx`
**Components:** `src/components/account/ProfileCard.tsx`, `PasswordCard.tsx`, `NotificationsCard.tsx`, `EmailActionsCard.tsx`

**Changes:**
- Cards already stack vertically — keep
- All inputs in ProfileCard and PasswordCard: `text-base`, `h-11`
- Save/Cancel button rows: `flex-col-reverse sm:flex-row`
- Toggle switches in NotificationsCard: ensure `min-h-[44px]` row height for touch

---

## Out of Scope

- Bottom navigation bar (not needed, drawer nav is sufficient)
- Floating Action Buttons (FAB) — keeping simple button layout as agreed
- Native mobile gestures (swipe to delete etc.)
- PWA/offline support
- Heater New page full redesign (complex cascading form — desktop-primary, just add `text-base` + touch targets)

---

## Success Criteria

- [ ] MaintenanceFormModal fully usable on iPhone SE (375px) — no overflow, all buttons tappable
- [ ] Customer detail page readable and navigable on 390px (iPhone 14)
- [ ] No horizontal scroll on any page at 375px width
- [ ] All form inputs do not trigger iOS auto-zoom (font-size ≥ 16px)
- [ ] All action buttons ≥ 44px touch target height
