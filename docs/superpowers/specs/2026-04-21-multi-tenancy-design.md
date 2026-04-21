# Multi-Tenancy Strategy — Torqr

**Status:** Decided  
**Date:** 2026-04-21  
**Replaces backlog item:** #15  

---

## 1. Decision Summary

Torqr uses **shared-database, single-schema multi-tenancy** with logical tenant isolation via `userId` scoping in application code.

There is no database-level Row Level Security (RLS). Isolation is enforced exclusively at the application layer through a consistent pattern: every Prisma query on a tenant-owned table includes `where: { userId }` derived from the authenticated JWT session.

This model is appropriate for the current scale (1–10 tenants) and will be re-evaluated when the triggers defined in Section 8 are reached.

---

## 2. Context & Constraints

### Why not RLS?

Supabase RLS relies on `auth.uid()`, which is only available when queries are issued through the Supabase JS client with a Supabase-managed JWT. Torqr uses **Prisma as the ORM** and **NextAuth v5 for authentication**. Prisma connects via a service-role connection string; `auth.uid()` is never set in the database session.

The alternative — a PostgreSQL session variable set before each query via a Prisma client extension — adds non-trivial complexity (transaction discipline, PgBouncer interaction, test overhead) that is not justified at the current tenant count.

### Why not separate schemas or separate databases per tenant?

Prisma does not support dynamic schema switching natively. A per-tenant schema approach would require custom migration tooling, per-tenant Prisma clients, and significant connection pooling complexity. This is only appropriate for 50+ tenants or hard compliance requirements, neither of which apply here.

### Scale assumptions

This decision is calibrated for **1–10 tenants over 2 years**. At this scale:
- A single Supabase instance on any paid plan is more than sufficient
- Application-layer isolation with consistent code review is a defensible security posture
- Operational complexity must be kept low

---

## 3. Tenant Data Model

### 3.1 Tenant-owned tables

These tables contain data that belongs exclusively to one tenant (user). Every query must include a `userId` scope.

| Table | `userId` column | Scoping mechanism |
|---|---|---|
| `customers` | Direct `userId` FK | `where: { userId }` |
| `customer_systems` | Direct `userId` FK | `where: { userId }` |
| `maintenances` | Direct `userId` FK | `where: { userId }` or via `system: { userId }` join |
| `bookings` | Direct `userId` FK | `where: { userId }` |
| `email_logs` | Indirect via `customerId` → `customer.userId` | `where: { customer: { userId } }` |
| `sessions` | Direct `userId` FK | Managed by NextAuth — never queried directly in API routes |

> **Note on `email_logs`:** This table has no direct `userId` column. Tenant scoping is enforced transitively through the `customer` relation. The admin panel accesses it cross-tenant intentionally (see Section 5.3).

### 3.2 Global / shared tables

These tables are shared across all tenants. No `userId` scope is applied when reading. Writes are controlled by authentication only.

| Table | Notes |
|---|---|
| `system_catalog` | Global device catalog. Any authenticated user may add entries (`createdByUserId` is recorded for audit but not used for scoping). |
| `cron_runs` | Platform-level job log. Accessed only by admin panel and cron routes. |
| `login_logs` | Platform-level security log. No tenant data. |

---

## 4. The Isolation Contract

### 4.1 The invariant

> Every API route that reads or writes a tenant-owned table **must** derive `userId` from `requireAuth()` and include it in the Prisma query scope. `userId` must never come from the request body, URL parameters, or any client-supplied input.

```typescript
// CORRECT — userId from session, never from request
const { userId } = await requireAuth();
const customer = await prisma.customer.findUnique({
  where: { id, userId },
});

// WRONG — never do this
const { userId } = req.body; // ❌ client-supplied, never trusted
```

### 4.2 The `requireAuth()` gate

`src/lib/auth-helpers.ts` — `requireAuth()` is the single entry point for tenant context. It:
1. Reads the NextAuth JWT session via `auth()`
2. Throws `'Unauthorized'` if no session exists
3. Returns `{ userId, email, name }` derived from the verified JWT

Every tenant API route calls this first, before any database access. This is not optional.

### 4.3 Indirect scoping patterns

Some tables (e.g. `Maintenance`) can be scoped either directly or via a relation:

```typescript
// Direct — preferred when userId is on the table
where: { id, userId }

// Via relation — used when the table has no direct userId
// e.g. Maintenance scoped via its parent CustomerSystem
where: { id, system: { userId } }
```

Both are correct. The indirect pattern is used in `GET/PATCH/DELETE /api/maintenances/[id]` and is intentional — `Maintenance` carries a redundant `userId` FK for query performance, but the relation-based check is equally safe.

### 4.4 Admin panel exception

Routes under `src/app/api/admin/` use `requireAdmin()` instead of `requireAuth()`. They intentionally access cross-tenant data (all users, all email logs) for platform-level oversight. This is by design and not a violation of the isolation contract. Admin access is gated by the `ADMIN_EMAILS` environment variable.

### 4.5 Cron routes exception

Routes under `src/app/api/cron/` do not use user sessions. They are secured via a `CRON_SECRET` bearer token (Vercel cron header). They query across all tenants by design — `daily-reminders` processes all eligible systems globally, `weekly-summary` is scoped per-user internally within `sendWeeklySummary()`.

### 4.6 Cal.com webhook exception

`src/app/api/webhooks/cal/route.ts` resolves tenant context from Cal.com payload metadata rather than a user session. It uses a two-strategy approach:
1. `metadata.userId` (embedded by reminder email links — most reliable)
2. Organizer email fallback (for direct Cal.com bookings)

The resolved `userId` is then used to scope all subsequent customer and system lookups. If no user can be resolved, the webhook returns 200 without persisting data. `metadata.systemId` is validated against `{ id: metaSystemId, userId: user.id }` before use — cross-tenant system assignment is impossible.

---

## 5. API Route Audit

Full audit of all API routes as of 2026-04-21. Every tenant-scoped route confirmed compliant with the isolation contract.

### 5.1 Tenant-scoped routes (all compliant)

| Route | Method(s) | Scoping |
|---|---|---|
| `/api/customers` | GET, POST | Direct `userId` |
| `/api/customers/[id]` | GET, PATCH, DELETE | Direct `userId` |
| `/api/customers/[id]/send-reminder` | POST | Customer ownership check via `customer.userId !== userId` |
| `/api/customer-systems` | GET, POST | Direct `userId` |
| `/api/customer-systems/[id]` | GET, PATCH, DELETE | Direct `userId` |
| `/api/maintenances` | GET, POST | System ownership via `{ systemId, userId }` |
| `/api/maintenances/[id]` | GET, PATCH, DELETE | Indirect via `system: { userId }` |
| `/api/bookings` | GET, POST | Direct `userId` |
| `/api/dashboard/stats` | GET | Direct `userId` on all queries |
| `/api/wartungen` | GET | Direct `userId` |
| `/api/user/profile` | GET, PATCH | Scoped to `session.user.id` |
| `/api/user/password` | PATCH | Scoped to `session.user.id` |
| `/api/user/preferences` | GET, PATCH | Scoped to `session.user.id` |
| `/api/user/send-weekly-summary` | POST | Scoped to `session.user.id` |
| `/api/upload/photo` | POST | Auth-gated, storage path includes `userId` prefix |

### 5.2 Global routes (no tenant scoping, by design)

| Route | Method(s) | Notes |
|---|---|---|
| `/api/catalog` | GET, POST | Global catalog — auth-gated, not tenant-scoped |
| `/api/cron/daily-reminders` | GET | CRON_SECRET gated, cross-tenant by design |
| `/api/cron/weekly-summary` | GET | CRON_SECRET gated, per-user internally |
| `/api/webhooks/cal` | POST | HMAC gated, resolves tenant dynamically |
| `/api/email/unsubscribe/[token]` | GET, POST | Stateless HMAC token — no session required |

### 5.3 Admin routes (cross-tenant, admin-gated)

| Route | Method(s) | Notes |
|---|---|---|
| `/api/admin/users` | GET | All tenants — `requireAdmin()` |
| `/api/admin/users/[id]` | GET | Any tenant's data — `requireAdmin()` |
| `/api/admin/emails` | GET | Cross-tenant email logs — `requireAdmin()` |
| `/api/admin/crons` | GET | Platform cron runs — `requireAdmin()` |
| `/api/admin/stats` | GET | Platform-wide stats — `requireAdmin()` |

---

## 6. GDPR & Data Lifecycle

### 6.1 Tenant data deletion

When a `User` record is deleted, the Prisma schema enforces `onDelete: Cascade` on all tenant-owned relations. Deleting a user deletes all their customers, systems, maintenances, bookings, sessions, and email logs. This is the correct behaviour for a right-to-erasure request.

Cascade chain: `User` → `Customer` → `CustomerSystem` → `Maintenance`, `Booking`, `EmailLog`

> **Note:** The `delete account` feature (backlog item #14) is not yet implemented. Until it is, account deletion must be done manually via the admin panel or direct DB access.

### 6.2 Supabase Storage (photos)

Maintenance photos are stored in Supabase Storage, not in the database. They are **not** automatically deleted when a `Maintenance` record is deleted via the cascade. The `DELETE /api/maintenances/[id]` route handles photo deletion explicitly before deleting the DB record. Account deletion (backlog #14) must also clean up Supabase Storage for the tenant.

### 6.3 SystemCatalog entries

Catalog entries created by a user (`createdByUserId`) are **not** deleted when the user is deleted (`onDelete: SetNull`). This is intentional — catalog entries are global and shared. A user contributing an entry does not own it exclusively.

### 6.4 Data portability

No data export feature exists today. If a tenant requests a data export (GDPR Article 20), it must be fulfilled manually via the admin panel or a direct DB query. This should be added to the backlog when a second paying tenant is onboarded.

---

## 7. Tenant Onboarding & Isolation Verification

### 7.1 Onboarding

A new tenant is created via the standard registration flow (`POST /api/auth/register`). No manual provisioning is required. The `userId` from the resulting `User` record becomes the tenant identifier for all subsequent data.

### 7.2 New developer rule (CLAUDE.md)

The following rule is added to `CLAUDE.md`:

> Any new API route that reads or writes a tenant-owned table (`Customer`, `CustomerSystem`, `Maintenance`, `Booking`, `EmailLog`) must include `userId` scoping derived from `requireAuth()`. This must be verified before merge. `userId` must never come from the request body.

### 7.3 Isolation test

A lightweight Jest test at `src/__tests__/audit/tenant-isolation.test.ts` statically verifies that every route file touching a tenant table contains a `userId` reference. This is a signal-based grep check, not a runtime test — it catches accidental omissions during development.

The test is intentionally simple. It does not replace code review; it supplements it.

---

## 8. Re-evaluation Triggers

This decision must be revisited if any of the following occur:

| Trigger | Action |
|---|---|
| Tenant count exceeds 50 | Evaluate PostgreSQL session variable + RLS approach |
| A customer requests contractual data isolation | Evaluate per-schema or per-database tenancy |
| A GDPR audit or ISO 27001 certification is pursued | RLS becomes a hard requirement |
| A data leak incident occurs due to missing `userId` scope | Immediate RLS implementation regardless of scale |

---

## 9. What This Decision Does Not Cover

- **Billing / subscription management** — out of scope, not yet implemented
- **Tenant-level configuration** — e.g. per-tenant email templates (backlog #40), per-tenant branding
- **Sub-users within a tenant** — employee management (backlog #26) may introduce a second level of access control within a tenant; this design does not address that
- **Rate limiting per tenant** — currently rate-limited per user (same thing at 1:1 user:tenant ratio), but multi-user tenants would need re-evaluation
