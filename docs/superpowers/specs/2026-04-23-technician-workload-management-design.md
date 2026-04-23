# Technician Workload Management

**Status**: Decided — ready for implementation planning
**Date**: 2026-04-23
**Builds on**: `2026-04-22-company-multi-user-architecture.md` (introduced `CustomerSystem.assignedToUserId` and the OWNER/TECHNICIAN role model)
**Related backlog**: #37 (technician calendar view — partially addressed by Feature B / Termine)

---

## 1. Summary

Sprint 23 established the OWNER/TECHNICIAN role model and per-system technician assignment via `CustomerSystem.assignedToUserId`. What it did not deliver was **workload visibility and management**: OWNERs today cannot see at a glance which technician owns which system, cannot rebalance load, and when they deactivate an employee the assigned systems become orphaned until manually cleaned up from a dashboard warning card.

This feature closes that gap with three surfaces:

1. **Passive visibility** — assignee badges on every system card the OWNER sees.
2. **Active management** — a technician detail page showing all assigned work, per-row and bulk reassignment, recent activity, and a workload summary on the employee list.
3. **Self-healing** — on technician deactivation, assigned systems are silently reassigned to the Company OWNER (no prompt, no orphaned state).

The scope is intentionally bounded: **no per-maintenance or per-booking assignment**. Assignment remains at the `CustomerSystem` level. Per-appointment assignment is a separate decision deferred until after pilot feedback.

---

## 2. Goals & Non-Goals

### Goals

- OWNER sees, on every system surface, which technician is responsible.
- OWNER can reassign a single system or a batch of systems without navigating to each system detail page.
- OWNER sees aggregate workload per technician (systems, overdue count) without doing arithmetic.
- Deactivating a technician never leaves systems orphaned — they fall back to the OWNER automatically.
- TECHNICIAN sees no assignment UI (read-only world for them — already the case from Sprint 23).

### Non-Goals

- **No per-maintenance assignment.** Decided — system-level is enough. Per-appointment dispatching (e.g. for holiday coverage) is deferred.
- **No automatic workload balancing.** The system does not suggest which tech to assign a new system to. Manual only.
- **No new role beyond OWNER/TECHNICIAN.** The spec works within the existing role matrix.
- **No invitation/onboarding changes.** The existing temp-password flow stays.
- **No availability/vacation model.** Covered by open backlog #37 as a separate feature.

---

## 3. Decisions

| # | Question | Decision |
|---|----------|----------|
| 1 | Badge style | Avatar circle with initials + name. Unassigned → distinct "Nicht zugewiesen" pill in muted style. |
| 2 | Who sees assignee badges? | OWNER only. TECHNICIAN sees only their own systems — badge would be redundant. |
| 3 | Deactivation flow | Silent auto-reassign to OWNER. No modal prompt. The existing "Unassigned after deactivation" dashboard tile becomes obsolete and is removed. |
| 4 | Bulk reassign scope | Available on technician detail page and on `/dashboard/systems` when the "Nicht zugewiesen" or tech-specific filter is active. |
| 5 | Recent activity scope | Last 10 maintenances performed by this technician, any system, any time. |
| 6 | Workload column overdue visual | Red badge when `overdue > 0`, grey otherwise. Format: `{N} Systeme · {X} überfällig`. |
| 7 | "Nicht zugewiesen" dashboard tile | Shown only to OWNER. Hidden when count = 0. Links to `/dashboard/systems?assignee=unassigned`. |
| 8 | TECHNICIAN access to detail page | Forbidden. Returns 403 via `requireOwner()`. |
| 9 | Systems filter persistence | Filter is URL-driven (`?assignee=<userId>|unassigned|all`). Survives refresh and is shareable. |
| 10 | Assignment mutation source of truth | Keep the existing `PATCH /api/customer-systems/[id]` with `assignedToUserId`. Bulk reassign = N sequential requests in a single React Query mutation. No new bulk endpoint unless perf demands it. |

---

## 4. Data Model

### 4.1 No schema changes

All data required already exists (Sprint 23):
- `CustomerSystem.assignedToUserId: String? -> User` (relation `AssignedSystems`)
- `User.isActive: Boolean`, `User.deactivatedAt: DateTime?`, `User.role: UserRole`
- `Maintenance.userId: String -> User` (audit field for "performed by")

### 4.2 Derived shapes returned by new/extended endpoints

The following are response shapes, not schema changes.

```ts
// GET /api/employees/[id]  (NEW)
type EmployeeDetail = Employee & {
  stats: {
    assignedSystemsCount: number;
    assignedCustomersCount: number;  // distinct customers across assigned systems
    overdueSystemsCount: number;     // where nextMaintenance < now
    dueSoonSystemsCount: number;     // where nextMaintenance in next 30 days
    maintenancesLast30Days: number;  // completed by this userId
  };
  assignedSystems: AssignedSystemGrouped[];
  recentActivity: RecentMaintenance[];
};

type AssignedSystemGrouped = {
  customer: { id: string; name: string; city: string };
  systems: Array<{
    id: string;
    label: string;             // "{manufacturer} {name}"
    systemType: SystemType;
    nextMaintenance: string | null;
    status: 'overdue' | 'due-soon' | 'ok' | 'scheduled';
    bookedAt: string | null;   // startTime of upcoming CONFIRMED booking
  }>;
};

type RecentMaintenance = {
  id: string;
  date: string;
  customer: { id: string; name: string };
  system: { id: string; label: string };
};

// GET /api/employees  (EXTENDED — adds workload per employee)
type Employee = /* existing */ & {
  workload: {
    assignedSystemsCount: number;
    overdueSystemsCount: number;
  };
};

// GET /api/dashboard/stats  (EXTENDED — replaces unassignedAfterDeactivation)
type DashboardStats = /* existing, minus unassignedAfterDeactivation */ & {
  unassignedSystemsCount: number;   // NEW — count of CustomerSystem where assignedToUserId is null
};
```

---

## 5. API Surface

| Method | Path | Role | Purpose | New/Modified |
|--------|------|------|---------|--------------|
| GET | `/api/employees` | OWNER | List + workload counts | MODIFIED (add workload) |
| GET | `/api/employees/[id]` | OWNER | Detail + stats + systems + activity | **NEW** |
| PATCH | `/api/employees/[id]` | OWNER | Activate/deactivate (existing) — MODIFIED to auto-reassign on deactivation | MODIFIED |
| PATCH | `/api/customer-systems/[id]` | OWNER | Reassign system (existing) | NO CHANGE |
| GET | `/api/customer-systems?assignee=<userId\|unassigned\|all>` | OWNER | Filtered list for the systems page | MODIFIED (accept query param) |
| GET | `/api/dashboard/stats` | OWNER | Add `unassignedSystemsCount`, remove `unassignedAfterDeactivation` | MODIFIED |

No new POST/DELETE endpoints. Bulk reassign is N parallel PATCH requests batched in a single React Query mutation, keeping the mutation surface small.

---

## 6. UI Surface

### 6.1 Assignee badge component

**File:** `src/components/AssigneeBadge.tsx` (new)

Props:
```ts
type AssigneeBadgeProps = {
  user: { id: string; name: string } | null;  // null = unassigned
  size?: 'sm' | 'md';                          // default 'md'
  showName?: boolean;                          // default true; false = avatar only (for dense grids)
};
```

Render:
- Assigned: avatar circle (initials, `bg-primary/15 text-primary`) + name in muted text
- Unassigned: grey dashed-outline circle + "Nicht zugewiesen" in muted text
- Entirely hidden when caller doesn't pass OWNER-scoped data

Used on:
- `/dashboard/systems` list cards (next to status badge)
- `/dashboard/customers/[id]` system cards (same position as status)
- `/dashboard/employees/[id]` — inline in system rows
- **NOT** on `/dashboard/systems/[id]` — that page already has the full assignment dropdown

### 6.2 Mitarbeiter list — workload column

**File:** `src/app/dashboard/employees/page.tsx` (modified)

Changes:
- Row becomes clickable → `/dashboard/employees/[id]` (whole card, not just a button)
- Add workload block below email: `{N} Systeme · {X} überfällig`
  - `X > 0`: red pill for the "überfällig" span
  - `X = 0`: muted text
  - Hidden for OWNER rows (OWNER's workload is "the rest"; not meaningful in this UI)
- Move Activate/Deactivate button to remain (stopPropagation on click so it doesn't navigate)

### 6.3 Technician detail page

**File:** `src/app/dashboard/employees/[id]/page.tsx` (new)

Route: `/dashboard/employees/[id]` — OWNER only, 403 otherwise.

Layout (top to bottom):

1. **Breadcrumb + back link** — "← Mitarbeiter"

2. **Header card**
   - Avatar (large, initials)
   - Name, email, phone
   - Role badge ("Inhaber" or "Techniker")
   - "Deaktiviert" badge + deactivation date if applicable
   - Activate/Deactivate button (OWNER, never-on-self)

3. **Stats grid** — 4 tiles
   - Kunden · `{N}`
   - Systeme · `{N}`
   - Überfällig · `{N}` (red tint when > 0)
   - In 30 Tagen · `{N}`
   - Secondary row: "Wartungen durchgeführt (30 Tage) · `{N}`"

4. **Zugewiesene Systeme**
   - Grouped by customer (collapsible cards)
   - Each customer header: name, city, "{N} Systeme" count
   - Each system row: AssigneeBadge **(hidden here — context obvious)** replaced with status badge, label, next-maintenance date, "Zuweisung ändern" action
   - Bulk selection: checkbox per row + sticky action bar when any selected
     - Actions: "Zuweisen an …" (select + apply), "Zuweisung entfernen"
   - Empty state: "Noch keine Kunden zugewiesen."

5. **Zuweisung-ändern modal** — reused from single-row and bulk actions
   - Select: active employees (OWNER at top) + "Nicht zugewiesen" option
   - Confirm → N × `PATCH /api/customer-systems/[id]`
   - Success toast: "{N} System(e) neu zugewiesen."

6. **Letzte Aktivität** — last 10 maintenances by this user
   - List: date · customer · system · "Details öffnen →" (links to system detail)
   - Empty state: "Keine Wartungen in den letzten 30 Tagen."

### 6.4 Systems list filter

**File:** `src/app/dashboard/systems/page.tsx` (modified) or wherever the list component lives.

- New dropdown: "Zuweisung: Alle · Nicht zugewiesen · {Tech 1} · {Tech 2} …"
- Selection writes to URL: `?assignee=<userId>|unassigned|all`
- Query key: `['customer-systems', { assignee }]`
- Visible to OWNER only (TECHNICIAN sees a fixed "Meine Systeme" view)

### 6.5 Dashboard "Nicht zugewiesen" tile

**File:** `src/app/dashboard/page.tsx` (modified)

- New tile in the top row, OWNER only
- Shows when `unassignedSystemsCount > 0`
- Label: "Nicht zugewiesen"
- Value: `{N}`
- Click → `/dashboard/systems?assignee=unassigned`
- Replaces the existing "Unassigned after deactivation" warning block (now redundant — deactivation auto-reassigns).

---

## 7. Deactivation Flow — Auto-Reassign

### 7.1 Contract

When OWNER toggles a technician to deactivated via `PATCH /api/employees/[id]`:

1. Inside a single Prisma transaction:
   - Set `user.isActive = false`, `user.deactivatedAt = now()`.
   - `UPDATE CustomerSystem SET assignedToUserId = <ownerUserId> WHERE assignedToUserId = <deactivatedUserId>`
   - Delete active sessions for the deactivated user (existing behaviour).
2. Return the updated user + count of systems reassigned (optional; used for a toast: "Mitarbeiter deaktiviert. {N} Systeme wurden dem Inhaber zugewiesen.").

### 7.2 Why silent instead of a prompt

- Matches the principle "no orphaned state": the system is always in a consistent state after the operation.
- OWNER can still reassign manually post-deactivation — they just start from a safe default (themselves) instead of a broken state (assignedToUserId pointing at an inactive user).
- Removes an entire UX branch (the existing dashboard warning card and its "Neu zuweisen" action), reducing code surface.

### 7.3 Edge cases

- **Reactivation**: does NOT un-reassign. Once a system is moved to OWNER, it stays there until explicitly reassigned. Consistent with the "never undo user decisions silently" rule.
- **OWNER tries to deactivate themselves**: already blocked in UI and API.
- **Bookings with `assignedToUserId` on the deactivated user**: out of scope for this feature. Bookings inherit assignment from their system in Feature B; legacy directly-assigned bookings would need a separate pass if/when that model appears.

---

## 8. Roles & Permissions

All permissions flow from the Sprint 23 matrix. No new capabilities introduced.

| Action | OWNER | TECHNICIAN |
|--------|:-----:|:----------:|
| See assignee badges | ✅ | ❌ (only own systems) |
| Open `/dashboard/employees/[id]` | ✅ | ❌ 403 |
| Reassign system (single or bulk) | ✅ | ❌ 403 |
| Filter `/dashboard/systems` by assignee | ✅ | ❌ (fixed "Meine Systeme") |
| See dashboard "Nicht zugewiesen" tile | ✅ | ❌ |
| Deactivate technician | ✅ | ❌ 403 |

---

## 9. Empty & Error States

| Scenario | UI |
|----------|----|
| No assigned systems on detail page | "Noch keine Kunden zugewiesen." + suggestion link to `/dashboard/systems?assignee=unassigned` |
| No recent activity | "Keine Wartungen in den letzten 30 Tagen." |
| Deactivated tech, re-opened detail page | Header shows "Deaktiviert seit {date}". Assigned systems list is empty (auto-reassigned). Recent activity remains (historical). |
| Reassign API error on one row of a bulk op | Partial success surfaced: "{X} zugewiesen, {Y} fehlgeschlagen" — retry button for failed rows. |
| Non-OWNER opens `/dashboard/employees/[id]` | Redirect to `/dashboard` (no flash of content) |

---

## 10. Observability

No new monitoring surfaces. Existing `EmailLog` and `CronRun` models do not apply. Standard error logging via `console.error` + Sentry (if configured).

---

## 11. Migration

No data migration required. The feature reads existing fields and writes existing fields.

One UI migration: remove the `UnassignedAfterDeactivation` card from `/dashboard/page.tsx`. Replace with the new "Nicht zugewiesen" tile. No feature flag — ship in a single commit.

---

## 12. Open Questions (intentionally deferred)

- Per-booking or per-maintenance assignment — revisit after 1-2 months of pilot feedback.
- Workload balancing suggestions (e.g. "Tech A has 12 overdue, consider reassigning to Tech B") — requires real usage data first.
- Per-customer assignment (lock a customer to a specific technician regardless of system) — revisit if pilot asks.
