# Company Multi-User Architecture

**Status**: Decided — ready for implementation planning
**Date**: 2026-04-22
**Supersedes**: Parts of `docs/superpowers/specs/2026-04-21-multi-tenancy-design.md` (tenant boundary definition)
**Related backlog items**: #26 (Mitarbeiter-Tab), #37 (Techniker-Kalender), #14 (Delete account)

---

## 1. Summary

Torqr moves from a **User-as-Tenant** model to a **Company-as-Tenant** model. A Company contains one OWNER (the paying customer, i.e. the business owner) and zero-or-more TECHNICIANs (employees). All business data (`Customer`, `CustomerSystem`, `Maintenance`, `Booking`, `FollowUpJob`, `CustomerSystemChecklistItem`) is scoped to a Company, not to an individual User.

This is a foundational refactor that touches every API route, the auth layer, the Prisma schema, and the navigation. It is required before any meaningful employee-management feature (#26, #37) can be built.

The shared-database / single-schema / application-level-isolation decision from Sprint 16 **remains unchanged**. The only thing that changes is *what* gets scoped: `companyId` replaces `userId` as the tenant boundary.

---

## 2. Goals & Non-Goals

### Goals

- A single paying customer (OWNER) can have multiple TECHNICIAN accounts under their Company.
- All business data belongs to the Company, not to an individual User. Deactivating a User must never orphan or lose data.
- Role-based access control with two roles at launch: `OWNER` and `TECHNICIAN`.
- A clean migration path for existing single-user accounts — no data loss, no downtime required.
- The architecture must support future roles (e.g. `OFFICE_ADMIN`, `VIEWER`) without another schema refactor.
- Per-seat pricing is mechanically supported (counting active users per Company is trivial).

### Non-Goals

- **No cross-Company data access.** An OWNER can never see another Company's data, even as a platform admin (platform admin is a separate concept, already implemented via `ADMIN_EMAILS`).
- **No Row-Level Security (RLS) in PostgreSQL for tenant isolation.** Sprint 16 explicitly rejected this. Isolation stays in application code (`requireAuth()` + `where: { companyId }`).
- **No invitation/email-based onboarding for technicians in this phase.** Owners create technician accounts directly with a temporary password. Email invitations are a future enhancement.
- **No granular per-customer permissions.** Technicians either see all Company customers or none — no per-record ACLs.

---

## 3. Decisions (answering the open questions)

| # | Question | Decision |
|---|----------|----------|
| 1 | Can technicians see all customers? | **Yes.** All technicians see all Company customers. (Can be tightened later via assignment-based filtering if needed.) |
| 2 | Can technicians create customers? | **Yes.** Technicians can create and edit customers. Only OWNER can delete. |
| 3 | How is work assigned? | **Owner-assigned.** Maintenances/bookings are assigned to a specific technician by the OWNER. No open-queue / self-service pickup. |
| 4 | Can a technician complete a non-assigned maintenance (e.g. colleague sick)? | **No, but visible.** Technicians can view all assignments but cannot complete one assigned to another technician. Owner must reassign first. |
| 5 | Technician home dashboard content? | **"Meine Woche"** — list of maintenances assigned to the technician for the current week, with customer contact info and checklist access. |
| 6 | Offboarding? | **Deactivate, never delete.** `User.isActive = false` disables login; all historical `Maintenance.userId`, `FollowUpJob.userId` references remain intact. |
| 7 | Technician onboarding? | **Option A: Owner creates account with temporary password.** Technician is forced to change password on first login. Email-invite flow is a future enhancement. |
| 8 | Weekly summary email recipients? | **Owner + each Technician.** Owner gets Company-wide summary. Each Technician gets their own assignments/completions only. |
| 9 | Migration: how to set Company name for existing users? | **Leave blank.** Owner is prompted to set Company name on next login via a one-time modal. No guessed defaults. |

---

## 4. Data Model

### 4.1 New model: `Company`

```prisma
model Company {
  id        String   @id @default(uuid())
  name      String?  // nullable to allow blank-on-migration; enforced at app level post-setup
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users           User[]
  customers       Customer[]
  customerSystems CustomerSystem[]
  maintenances    Maintenance[]
  bookings        Booking[]
  followUpJobs    FollowUpJob[]

  @@map("companies")
}
```

### 4.2 Modified model: `User`

```prisma
enum UserRole {
  OWNER
  TECHNICIAN
}

model User {
  id                     String    @id @default(uuid())
  email                  String    @unique
  passwordHash           String
  name                   String
  phone                  String?
  emailWeeklySummary     Boolean   @default(true)
  reminderGreeting       String?
  reminderBody           String?
  emailVerified          DateTime?

  // NEW FIELDS
  companyId              String
  company                Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  role                   UserRole  @default(OWNER)
  isActive               Boolean   @default(true)
  mustChangePassword     Boolean   @default(false)
  deactivatedAt          DateTime?

  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt

  // Existing relations — userId semantics change (see §4.4)
  customers              Customer[]         // customers created-by or assigned-to this user
  customerSystems        CustomerSystem[]
  maintenances           Maintenance[]      // "performed by"
  sessions               Session[]
  bookings               Booking[]
  followUpJobs           FollowUpJob[]

  @@index([companyId])
  @@index([email])
  @@map("users")
}
```

**Removed**: `companyName` field on `User` — this now lives on `Company.name`. Migration copies existing values.

### 4.3 Tenant-scoped models — add `companyId`

Every model that currently has `userId` as a tenant boundary gets `companyId` added. The **existing `userId` stays** but takes on a new semantic meaning (see §4.4).

```prisma
model Customer {
  // ... existing fields ...
  companyId String
  company   Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  userId    String  // now: "created by" (audit), NOT tenant scope
  user      User    @relation(fields: [userId], references: [id])

  @@index([companyId])        // PRIMARY scope index
  @@index([userId])            // audit lookup
  @@map("customers")
}

model CustomerSystem {
  // ... existing fields ...
  companyId          String
  company            Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  userId             String  // created by
  assignedToUserId   String? // NEW: assigned technician (null = unassigned)
  assignedTo         User?   @relation("AssignedSystems", fields: [assignedToUserId], references: [id], onDelete: SetNull)

  @@index([companyId])
  @@index([assignedToUserId])
  @@map("customer_systems")
}

model Maintenance {
  // ... existing fields ...
  companyId String
  company   Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  userId    String  // performed by — unchanged semantics, stays even after technician deactivation

  @@index([companyId])
  @@map("maintenances")
}

model Booking {
  // ... existing fields ...
  companyId          String
  company            Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  userId             String  // organizer / owner who received the Cal.com webhook
  assignedToUserId   String? // NEW: technician who will perform it
  assignedTo         User?   @relation("AssignedBookings", fields: [assignedToUserId], references: [id], onDelete: SetNull)

  @@index([companyId])
  @@index([assignedToUserId])
  @@map("bookings")
}

model FollowUpJob {
  // ... existing fields ...
  companyId String
  company   Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  userId    String  // created by

  @@index([companyId])
  @@map("follow_up_jobs")
}
```

**Unchanged**:

- `EmailLog` — scoped by `customerId`, which is already Company-scoped transitively. No change needed.
- `Session`, `LoginLog`, `CronRun` — these are User- or system-scoped and remain so.
- `SystemCatalog` — stays global. Any Company can reference any catalog entry.
- `CustomerSystemChecklistItem` — scoped by `CustomerSystem` (which becomes Company-scoped), no direct `companyId` needed.

### 4.4 Semantic change: `userId` on business records

| Table | Before | After |
|---|---|---|
| `customers.userId` | tenant scope | audit: "created by" |
| `customer_systems.userId` | tenant scope | audit: "created by" |
| `maintenances.userId` | tenant scope | audit: "performed by" — **this is now queryable for "my week"** |
| `bookings.userId` | tenant scope | audit: "received by" (Cal.com organizer) |
| `follow_up_jobs.userId` | tenant scope | audit: "created by" |

`userId` stays on every table for audit and attribution. Tenant scoping moves exclusively to `companyId`.

### 4.5 Assignment model

Assignments use a simple nullable FK (`assignedToUserId`) on `CustomerSystem` and `Booking`. This covers the MVP needs:

- "Show me Maintenances assigned to me this week" → query `CustomerSystem` where `assignedToUserId = currentUser.id AND nextMaintenance BETWEEN weekStart AND weekEnd`.
- "Reassign this booking to another technician" → update `Booking.assignedToUserId`.
- Null = unassigned (visible to owner, invisible on technician dashboards).

A dedicated `Assignment` join table is **not** introduced now. If future requirements demand shift-based, time-bounded, or multi-technician assignments, it can be added without a breaking change (the nullable FK can coexist as a denormalized "current primary technician").

---

## 5. Authentication & Authorization

### 5.1 `requireAuth()` signature change

This is the single most important code change. Current:

```ts
// BEFORE
const { userId } = await requireAuth();
```

New:

```ts
// AFTER
const { userId, companyId, role } = await requireAuth();
```

`requireAuth()` now joins `User → Company` and returns all three values. Session lookup gains one join but stays O(1).

### 5.2 Role helpers

Add two new helpers alongside the existing `requireAdmin()`:

```ts
// Allow only OWNER role
await requireOwner();

// Allow OWNER or TECHNICIAN — default for most endpoints
await requireAuthenticated();

// Parameterized check
await requireRole(['OWNER']);
```

`requireAdmin()` (platform admin via `ADMIN_EMAILS`) remains orthogonal and unchanged. A platform admin is identified by email, not by `UserRole`.

### 5.3 Tenant-scoping rule (codifies Sprint 16 + this spec)

**Every database query on a tenant-scoped table MUST include `companyId` in its `where` clause.** No exceptions. This rule is the load-bearing invariant of the entire multi-tenancy design. A single missed `where: { companyId }` is a data leak between companies.

Concrete pattern:

```ts
// CORRECT
const customers = await prisma.customer.findMany({
  where: { companyId }
});

// WRONG — leaks across companies
const customers = await prisma.customer.findMany({
  where: { userId }
});

// WRONG — no scope at all
const customers = await prisma.customer.findMany();
```

**Enforcement**:

1. All API-route tests must include a cross-tenant isolation test (Company A user tries to access Company B record → 404).
2. Add an ESLint rule or a pre-commit grep that flags `prisma.<model>.findMany(` calls without `companyId` in the same statement (best-effort; manual review still required).
3. Add the rule to `CLAUDE.md` as a mandatory check for any new API route.

### 5.4 Permission matrix

| Capability | OWNER | TECHNICIAN |
|---|:---:|:---:|
| Dashboard — Company-wide stats | Yes | No |
| Dashboard — "Meine Woche" (own assignments) | Yes | Yes |
| Customers — view all | Yes | Yes |
| Customers — create | Yes | Yes |
| Customers — edit | Yes | Yes |
| Customers — delete | Yes | No |
| Systems — view all | Yes | Yes |
| Systems — create / edit | Yes | Yes |
| Systems — delete | Yes | No |
| Systems — assign to technician | Yes | No |
| Maintenance — view all Company maintenances | Yes | Yes (view) |
| Maintenance — execute (checklist, photos, notes) | Yes (any) | Yes (only if assigned to self) |
| Maintenance — delete | Yes | No |
| Bookings — view all | Yes | Yes (view) |
| Bookings — create (office-side) | Yes | No |
| Bookings — reassign | Yes | No |
| Follow-up jobs — create | Yes | Yes |
| Follow-up jobs — complete / delete | Yes | Yes (own assignments only) |
| Email templates (reminderGreeting, reminderBody) | Yes | No |
| Email settings / opt-in management | Yes | No |
| Weekly summary email | Company-wide | Own work only |
| Employee management (create/deactivate technicians) | Yes | No |
| Company settings (name, branding) | Yes | No |
| Own profile (name, phone, password) | Yes | Yes |
| Platform admin panel (/admin) | Only if in ADMIN_EMAILS | Only if in ADMIN_EMAILS |

### 5.5 Registration flow

- Self-serve registration (the existing `/auth/register` page) always creates a new `Company` + a new `User` with `role = OWNER`. The Company is unnamed until the owner fills in the name in the setup modal on first login.
- Technician accounts are **only** created via the Owner's employee-management UI. There is no self-serve technician registration.
- Login endpoint is identical for Owner and Technician. After login, if `user.mustChangePassword === true`, the app routes to a forced-password-change screen before anything else.

### 5.6 Technician onboarding (Option A — confirmed)

1. Owner opens "Mitarbeiter" → "Neuer Techniker".
2. Owner enters: Name, Email, Phone (optional).
3. System generates a temporary password (shown once in the UI; Owner communicates it out-of-band to the technician).
4. `User` is created with `role = TECHNICIAN`, `companyId = owner.companyId`, `mustChangePassword = true`, `isActive = true`.
5. Technician logs in with email + temp password → forced password change → arrives at "Meine Woche" dashboard.

Future enhancement (not in scope now): email-based invitation flow with signed link, replacing step 3's manual password handoff.

### 5.7 Technician offboarding

- Owner opens employee list → clicks "Deaktivieren" on a technician.
- Sets `User.isActive = false`, `User.deactivatedAt = now()`.
- All existing `Session` records for that user are invalidated (delete where `userId = deactivatedUser.id`).
- Any `CustomerSystem.assignedToUserId` and `Booking.assignedToUserId` pointing to the deactivated user should be displayed in an "Unassigned after deactivation" list for the Owner to reassign. (Implementation: a dashboard card listing assignments where `assignedTo.isActive = false`.)
- `Maintenance.userId` and `FollowUpJob.userId` references stay intact — history is preserved.
- **No hard delete.** The Owner cannot delete a User record from the UI. Account deletion (#14) means Company deletion, which cascades.

---

## 6. Migration Plan

### 6.1 Phases

The refactor ships in four ordered phases. Each phase is independently deployable and reversible up to the point where the auth layer switches over.

**Phase 0 — Schema + backfill (migration only, no behavior change)**

1. Create `companies` table.
2. Add `companyId`, `role`, `isActive`, `mustChangePassword`, `deactivatedAt` to `users` (nullable initially).
3. Add `companyId` column to each tenant-scoped table (nullable initially).
4. Add `assignedToUserId` to `customer_systems` and `bookings` (nullable).
5. Backfill: for each existing `User`, create a `Company` with `name = NULL`, set `user.companyId`, `user.role = OWNER`, `user.isActive = true`. For each tenant-scoped record, set `record.companyId = record.user.companyId`.
6. Verify backfill: row counts match, no NULLs in `companyId` where there were valid `userId` values.
7. Set `companyId` columns `NOT NULL` and add `@@index([companyId])` everywhere.

Reversible: yes (drop the new columns/table).

**Phase 1 — Auth refactor**

1. Update `requireAuth()` to return `{ userId, companyId, role }`.
2. Add `requireOwner()`, `requireAuthenticated()`, `requireRole()` helpers.
3. Add unit tests for role enforcement.
4. Update the session cookie / JWT payload if role is embedded there (recommend: keep session minimal; load role from DB per-request, acceptable cost given existing Prisma warm-up).

Reversible: yes (revert the helper); no data changes.

**Phase 2 — API route scope migration**

1. Update every API route under `src/app/api/` to use `companyId` instead of `userId` in `where` clauses.
2. Add role checks where the permission matrix (§5.4) requires them.
3. For each route, add a cross-tenant isolation test (Company A user fails to access Company B record → 404).
4. Deploy behind a feature flag if risk-averse; alternatively, ship as one big PR after full local test sweep — the schema already contains `companyId`, so correctness is auditable via grep.

Reversible: yes (revert the PR). Data is safe because Phase 0 left old `userId` columns intact.

**Phase 3 — UI & new features**

1. Role-aware navigation (Technician sees: Dashboard, Kunden, Systeme, Wartungen, Profil; Owner sees everything including Mitarbeiter, Einstellungen, Rechnungen).
2. Force-password-change screen gated on `mustChangePassword`.
3. Company-name setup modal on Owner first-login-post-migration (when `company.name === null`).
4. Mitarbeiter-Verwaltung page (list, create, deactivate).
5. "Meine Woche" dashboard for technicians.
6. Assignment UI (dropdown on `CustomerSystem` detail page, booking detail page).
7. "Unassigned after deactivation" card for owners.
8. Weekly summary email split: Company-wide for Owner, personal for each Technician.

Reversible: UI revert only; no data implications.

### 6.2 Backward compatibility during migration

- Between Phase 0 and Phase 2, both `userId` and `companyId` are populated and valid. Old queries continue to work.
- After Phase 2 ships, `userId` queries are never used for scoping, but the columns stay for audit. No column is dropped in this refactor.

### 6.3 Data integrity checks (run after Phase 0)

```sql
-- Every user has a company
SELECT COUNT(*) FROM users WHERE "companyId" IS NULL;  -- expect 0

-- Every company has exactly one OWNER
SELECT "companyId", COUNT(*) FROM users WHERE role = 'OWNER' GROUP BY "companyId" HAVING COUNT(*) != 1;  -- expect 0 rows

-- Every tenant-scoped record's companyId matches its user's companyId
SELECT c.id FROM customers c JOIN users u ON c."userId" = u.id WHERE c."companyId" != u."companyId";  -- expect 0
-- (repeat for customer_systems, maintenances, bookings, follow_up_jobs)
```

---

## 7. Scaling & Future-Proofing Considerations

### 7.1 Indexing

All tenant-scoped tables gain `@@index([companyId])`. The existing `@@index([userId])` stays for audit lookups. Compound indexes that currently start with `userId` (e.g. `@@index([userId, nextMaintenance])` — check actual schema) should be re-evaluated and replaced with `[companyId, ...]` variants if they exist. At current data volumes this is a non-issue; revisit when the largest Company exceeds ~10k customers.

### 7.2 Per-seat pricing

Count of active technicians per Company is a single query:

```ts
prisma.user.count({
  where: { companyId, isActive: true, role: 'TECHNICIAN' }
});
```

No additional schema needed. When Stripe integration lands, subscription quantity is derived from this count.

### 7.3 Future roles

Adding a role (e.g. `OFFICE_ADMIN`, `VIEWER`, `ACCOUNTANT`) is a single enum value + a row in the permission matrix + updates to `requireRole()` call sites. No schema refactor.

### 7.4 Future: per-customer/per-region scoping

If technicians ever need to be restricted to a subset of customers (by region, by team), the cleanest extension is a `TechnicianAssignment` join table:

```prisma
model TechnicianAssignment {
  userId     String
  customerId String
  // ...
  @@id([userId, customerId])
}
```

The current decision (technicians see all Company customers) keeps this out of scope, but the `Customer.companyId` scope does not preclude adding it later.

### 7.5 Platform admin panel

The existing `/admin` panel (Sprint 10) uses `ADMIN_EMAILS` env var and operates across all tenants. It must be updated to show the new `Company` dimension — e.g. user list includes Company name and role. The cross-tenant queries in the admin panel are the **only** legitimate non-`companyId`-scoped queries in the app and should be explicitly marked as such in code comments.

### 7.6 Observability

Add `companyId` and `userId` to the structured log context and to Sentry breadcrumbs/scope on every authenticated request. This turns "weird bug report from one customer" into a filterable trace.

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Missed `where: { companyId }` in a single API route → cross-tenant data leak | Medium | **Critical** | Phase 2 includes per-route isolation tests; ESLint rule; code review checklist; grep audit post-PR. |
| Session cookie contains stale role after owner changes a user's role | Low | Low | Load role from DB per request (not from JWT claims). Current code already does this via `requireAuth` DB lookup. |
| Backfill leaves some record with mismatched `companyId` vs its user's `companyId` | Low | High | SQL integrity checks in §6.3 run post-Phase-0 as a hard gate. |
| Owner deactivates self by mistake | Low | Medium | UI prevents the only OWNER of a Company from being deactivated. Enforce at API: cannot deactivate user where `role = 'OWNER'` and they are the last active OWNER. |
| Technician's session stays valid after deactivation | Medium | Medium | Deactivation flow deletes all `Session` records for the user. |
| Unassigned work after deactivation gets lost | Medium | Medium | Dashboard card surfaces `assignedTo.isActive = false` records for Owner to reassign. |
| Cal.com webhook arrives for deactivated technician | Low | Low | Webhook resolves organizer via Company, not via specific technician. Booking lands on Company with `assignedToUserId = null`. |

---

## 9. Open Questions (to resolve during implementation)

These are deliberately **not** blocking the architectural decision but must be answered during the phase they affect.

1. **Phase 3 — UI:** What happens on the Customer detail page for a Technician viewing a customer with systems assigned to a different technician? Show read-only? Show with "reassignment requested" action? *Tentative: read-only view, with a "Frage an Owner" button that notifies the owner.*
2. **Phase 3 — UI:** Does the `Mitarbeiter` list show deactivated users by default, or is there a "Archivierte" toggle? *Tentative: default-hide, toggle to show.*
3. **Phase 2 — API:** Office-side booking creation (`POST /api/bookings`, Sprint 15) currently assumes OWNER. Confirm this stays Owner-only or opens up to Technicians. *Tentative per §5.4: Owner-only.*
4. **Future:** Billing / Stripe subscription model — is per-technician-seat pricing the right model, or flat-rate per Company with a seat cap? Out of scope for this spec.
5. **Future:** Email-based technician invitation flow — replaces the temp-password handoff in §5.6. Out of scope; revisit after MVP pilot with at least one multi-technician Company.

---

## 10. Acceptance Criteria

The refactor is "done" when:

- [ ] A new Torqr registration creates a Company + OWNER User in a single transaction.
- [ ] An Owner can create a Technician from the Mitarbeiter page; Technician can log in, is forced to change password, lands on "Meine Woche".
- [ ] Every tenant-scoped API route is `companyId`-scoped and has a cross-tenant isolation test.
- [ ] Deactivating a Technician invalidates their sessions and surfaces their open assignments for reassignment.
- [ ] Weekly summary email: Owner receives Company-wide; each Technician receives own-work-only.
- [ ] No regressions in existing single-user flows (data from pre-migration accounts is fully intact and accessible).
- [ ] `docs/superpowers/specs/2026-04-21-multi-tenancy-design.md` is updated to reference this spec as the concrete tenant-boundary definition.
- [ ] `CLAUDE.md` is updated with the new `requireAuth()` contract and the `companyId`-scoping rule.

---

## 11. References

- Previous tenant-isolation decision: `docs/superpowers/specs/2026-04-21-multi-tenancy-design.md` (Sprint 16)
- Admin panel pattern (role-style gating precedent): Sprint 10 in `docs/BACKLOG.md`
- Backlog items affected: #26, #37, #14, #48, #49
- Current schema: `prisma/schema.prisma`
- Current auth layer: `src/lib/auth.ts` (`requireAuth`, `requireAdmin`)
