# Torqr — Architecture Reference

**Status**: living document
**Companion to**: [CLAUDE.md](../../CLAUDE.md) (slim always-on rules)
**Decision records**: [docs/superpowers/specs/](../superpowers/specs/)

This file is the canonical, self-contained architecture reference for the Torqr app. CLAUDE.md keeps only the always-on rules and an index — full detail lives here. When new architectural patterns emerge, extend the relevant section below and append a line to [CHANGELOG.md](./CHANGELOG.md).

---

## 1. System Topology

Torqr is a single Next.js 14+ App-Router application deployed on Vercel. State lives in Supabase Postgres (eu-west-1). Email delivery via Resend; bookings via Cal.com webhook.

```
Browser  ─┐
          │  React (Server + Client Components, React Query)
          │
Vercel  ──┼──  Next.js App Router (Node.js runtime)
          │     ├─ src/app/api/*          REST-ish route handlers
          │     ├─ src/app/(routes)/*     Pages (mostly Server Components)
          │     ├─ src/app/api/cron/*     Vercel Cron
          │     └─ src/app/api/webhooks/* Cal.com (and future) webhooks
          │
          │     ├─ src/lib/auth.ts        NextAuth v5
          │     ├─ src/lib/prisma.ts      Prisma Client
          │     ├─ src/lib/email/*        Resend + React Email templates
          │     └─ src/lib/supabase.ts    Storage only (service role)
          │
Supabase ─┴──  Postgres (Prisma-managed schema, RLS deny-all on all public tables)
                 └─  Storage buckets (system photos)
```

There is **one** long-lived branch (`main` = production + active work). Feature work ships on `feature/<slug>` and merges to `main`. No staging branch yet.

---

## 2. Tenancy Model — Company-as-Tenant

Torqr uses **shared-database, single-schema, application-level isolation**. The tenant boundary is the `Company`, not the individual `User`.

- A `Company` has exactly one `OWNER` (the paying customer) and zero-or-more `TECHNICIAN`s.
- All business data (`Customer`, `CustomerSystem`, `Maintenance`, `Booking`, `FollowUpJob`) is scoped by `companyId`.
- `userId` stays on those tables but **only as audit field** ("created by" / "performed by"). It is never used for `where`-scoping on reads.
- `EmailLog` is scoped via `customerId`, transitively Company-scoped.
- `SystemCatalog` is global (any Company may reference any catalog entry).
- `Session`, `LoginLog`, `CronRun` are User- or system-scoped and remain so.

**Roles at launch**: `OWNER` (full access), `TECHNICIAN` (no delete, no employee management, no Company settings).

Full decision record incl. permission matrix, migration phases, risks: [docs/superpowers/specs/2026-04-22-company-multi-user-architecture.md](../superpowers/specs/2026-04-22-company-multi-user-architecture.md).

---

## 3. Authentication & Authorization

### 3.1 Helpers (canonical signatures)

All helpers live in [src/lib/auth-helpers.ts](../../src/lib/auth-helpers.ts). They load `role` and `companyId` from the DB on every request (not from JWT) so role changes take effect immediately.

```ts
interface AuthContext {
  userId: string;
  companyId: string;
  role: UserRole;     // 'OWNER' | 'TECHNICIAN'
  email: string;
  name: string;
}

requireAuth(): Promise<AuthContext>           // any active user; throws 'Unauthorized'
requireOwner(): Promise<AuthContext>          // OWNER only; throws 'Forbidden'
requireRole(allowed: UserRole[]): Promise<AuthContext>
```

`requireAdmin()` (platform admin via `ADMIN_EMAILS` env var) is orthogonal to `UserRole` and lives separately.

### 3.2 Permission matrix (summary)

| Capability                       | OWNER | TECHNICIAN              |
|----------------------------------|:-----:|:-----------------------:|
| View / create / edit Customers   |  ✓    | ✓                       |
| Delete Customers / Systems       |  ✓    | ✗                       |
| Assign Systems / Bookings        |  ✓    | ✗                       |
| Execute Maintenance              |  ✓    | ✓ (only if assigned)    |
| View all Bookings                |  ✓    | ✓ (read-only)           |
| Create office-side Bookings      |  ✓    | ✗                       |
| Employee management              |  ✓    | ✗                       |
| Company settings, email templates|  ✓    | ✗                       |
| Own profile                      |  ✓    | ✓                       |
| Weekly summary scope             | Company | Own work only         |

Full matrix: spec §5.4.

### 3.3 Sessions & deactivation

- NextAuth v5 issues session cookies; the JWT carries only `userId`.
- On deactivation (`User.isActive = false`), all `Session` rows for that user are deleted server-side. The next request from the deactivated session returns `Unauthorized` from `requireAuth()`.
- Open assignments (`assignedToUserId` pointing at a deactivated user) surface in an Owner-only "Unassigned after deactivation" dashboard card.

---

## 4. API Layer Conventions

### 4.1 Route shape

```ts
export async function POST(req: Request) {
  // 1. Authenticate + authorize
  const { companyId, userId } = await requireAuth();

  // 2. Validate input
  const body = await req.json();
  const data = customerCreateSchema.parse(body);   // Zod schema in src/lib/validations.ts

  // 3. Execute (always include companyId in tenant-scoped queries)
  const customer = await prisma.customer.create({
    data: { ...data, companyId, userId },
  });

  return Response.json(customer);
}
```

**Always in this order**: auth → validation → logic. Skipping or reordering breaks rate-limiting and tenant scoping.

### 4.2 Response shape

- Success: the resource (or array of resources). Status 200 for GET/PATCH, 201 for POST, 204 for DELETE.
- Error: `{ error: string, status: number }`. Common error shapes are reused via shared helpers in `src/lib/`.
- Validation errors (Zod) → `{ error: 'Validation failed', issues: ZodIssue[] }`, status 400.

### 4.3 Rate limiting

Middleware applies a per-IP token-bucket on auth-sensitive endpoints. See [src/middleware.ts](../../src/middleware.ts) for the current matcher list. Cron endpoints are exempt and gated by `CRON_SECRET` instead.

---

## 5. Multi-Tenancy Isolation Rule (mandatory)

**Every database query against a tenant-scoped table MUST include `companyId` in its `where` clause.** A single missed `where: { companyId }` is a data leak between Companies.

```ts
// ✅ CORRECT — companyId from requireAuth()
const { companyId } = await requireAuth();
prisma.customer.findUnique({ where: { id, companyId } });

// ✅ CORRECT — userId only as audit field on create
prisma.maintenance.create({ data: { ...input, companyId, userId } });

// ❌ WRONG — userId is no longer a tenant boundary
prisma.customer.findMany({ where: { userId } });

// ❌ WRONG — companyId must NEVER come from the client
const { companyId } = await req.json();
```

### Tenant-scoped tables (always scope by `companyId`)

`Customer`, `CustomerSystem`, `Maintenance`, `Booking`, `FollowUpJob`, `CustomerSystemChecklistItem` (transitively via `CustomerSystem`).

### Exceptions by design (do NOT add `companyId` scoping here)

| Path                              | Rationale                                                  |
|-----------------------------------|------------------------------------------------------------|
| `src/app/api/admin/*`             | Cross-tenant; gated by `requireAdmin()`                    |
| `src/app/api/cron/*`              | Cross-tenant; gated by `CRON_SECRET`                       |
| `src/app/api/webhooks/cal`        | Resolves tenant dynamically from payload metadata + email  |
| `src/app/api/catalog`             | `SystemCatalog` is a global table                          |
| `src/app/api/email/unsubscribe`   | Stateless HMAC token; no session                           |
| `src/app/api/user/*`              | User-specific own-record access via `userId`               |

### Enforcement

1. Every new tenant-scoped route ships with a cross-tenant isolation test (Company A user attempts to read/write Company B record → 404).
2. Code review checklist: `requireAuth()` first, then verify `companyId` appears in every Prisma `where`.
3. Grep audit before merge: `prisma\.\w+\.(findMany|findUnique|update|delete)` should always co-occur with `companyId`.

---

## 6. RLS Deny-All Strategy

Application-layer scoping (above) is the *primary* line of defense. On top of that, every table in the `public` schema carries a Postgres-level `deny_all` RLS policy that blocks Supabase's auto-generated PostgREST API at `https://<project>.supabase.co/rest/v1/...` (reachable by anyone who has the public anon key).

### Why this is safe for Torqr

- **Prisma** connects as the table-owner role → bypasses RLS (no `FORCE ROW LEVEL SECURITY` is set).
- **Supabase service role key** (used only in `src/lib/supabase.ts` for storage) carries `BYPASSRLS` → unaffected.
- Only `anon` and `authenticated` PostgREST roles are blocked. Torqr does not use them.

### Auto-enforcement for new tables

Migration `20260507120000_enable_rls_deny_all_auto` installs an event trigger `apply_rls_to_new_table` that fires on every `CREATE TABLE` in `public` and applies `deny_all` automatically. New Prisma migrations are PostgREST-safe by default — no manual follow-up needed.

If the trigger is ever missing (e.g. dropped, or insufficient privilege on a fresh Postgres instance), the manual idempotent fallback at the end of any migration is one line:

```sql
SELECT public.apply_rls_deny_all_to_all_public_tables();
```

### What you must NOT do

- **Never** set `FORCE ROW LEVEL SECURITY` on any table — that would block Prisma too.
- **Never** grant the `anon` or `authenticated` role privileges that depend on reading data; the `deny_all` policy returns zero rows by design.
- **Never** drop the helper functions or the event trigger without an explicit replacement.

### Verification

Supabase Dashboard → Advisors → Security shows zero `rls_disabled_in_public` and zero `sensitive_columns_exposed` lints after deploy. If it doesn't, run the helper above on the affected database.

---

## 7. Database Layer

### 7.1 Schema & migrations

- Prisma schema: [prisma/schema.prisma](../../prisma/schema.prisma)
- Prisma config: [config/prisma.config.ts](../../config/prisma.config.ts)
- Migrations are Prisma-managed. Never hand-edit the DB schema.

### 7.2 Connection URLs

- `DATABASE_URL` — pooled (PgBouncer), used by the running app
- `DIRECT_URL` — non-pooled, used by `prisma migrate` (DDL needs a real Postgres session)

Both are populated by the Vercel ↔ Supabase integration; pulled locally via `vercel env pull`.

### 7.3 Prisma 7 migration workaround

Prisma 7's `env()` resolution is broken for `migrate deploy` on Vercel-pulled `.env` files. Run migrations with explicit dotenv loading:

```bash
node -r dotenv/config node_modules/prisma/build/index.js migrate deploy --config config/prisma.config.ts
```

(The user-memory `feedback_prisma_migrations.md` contains the up-to-date variant.)

### 7.4 Indexing

- Every tenant-scoped table has `@@index([companyId])` as the primary scope index.
- Hot read paths (`nextMaintenance`, `assignedToUserId`, `customerId`) get compound indexes that *start* with `companyId`. Re-evaluate when any single Company exceeds ~10k customers.

---

## 8. Email Subsystem

### 8.1 Stack

- **Provider**: Resend
- **Templates**: React Email components in [src/lib/email/templates/](../../src/lib/email/templates/)
- **Service**: [src/lib/email/service.tsx](../../src/lib/email/service.tsx) — single sending entry-point per email type
- **Domain**: `torqr.de` (KAS DNS, Resend SPF/DKIM)
- **Receiving**: dedicated mailbox at KAS (out of scope for app)

### 8.2 Conventions

- All email copy in **German** (Sie-Anrede for end-customer reminders; Du for internal/marketing where applicable — see [docs/development/MARKETING-WORKFLOW.md](../development/MARKETING-WORKFLOW.md)).
- Brand tokens come from React Email styles, not hardcoded hex values.
- Unsubscribe links carry an HMAC token from [src/lib/email/unsubscribe-token.ts](../../src/lib/email/unsubscribe-token.ts). The unsubscribe API route is stateless — no session required.

### 8.3 Email types

| Type                | Trigger                              | Audience                  |
|---------------------|--------------------------------------|---------------------------|
| Wartungserinnerung  | Cron, N days before next maintenance | Customer                  |
| Buchungsbestätigung | Cal.com webhook                      | Customer + assigned tech  |
| Weekly summary      | Cron (Mon 06:00)                     | Owner + each Technician   |
| Follow-up Reminder  | Cron, due-date triggered             | Owner / assigned Tech     |
| Account / Auth      | NextAuth events                      | User                      |

Full type list and cron schedule: [docs/EMAIL-SYSTEM.md](../EMAIL-SYSTEM.md).

---

## 9. Frontend Layer

### 9.1 Component organization

- [src/components/ui/](../../src/components/ui/) — shadcn/ui primitives. **Never modify directly**; re-add via shadcn CLI to upgrade.
- [src/components/](../../src/components/) — app-level composed components.
- Page files (`src/app/**/page.tsx`) are **thin** wrappers: data fetching via hooks, rendering via components, no business logic inline.

### 9.2 Server vs Client

- Default to **Server Components**. Add `"use client"` only when a component needs interactivity, browser APIs, or React Query.
- Layouts (`layout.tsx`) handle shared UI (auth gates, navigation). Keep them thin.

### 9.3 Data fetching

- All server state goes through React Query (TanStack Query) hooks under [src/hooks/](../../src/hooks/).
- One hook per domain entity: `useCustomers`, `useHeaters`/`useSystems`, `useBookings`, `useMaintenances`, etc.
- **Never** `useState` for fetched data. **Never** `useEffect` for fetching.
- Always set an explicit `staleTime` aligned with the data's volatility. See [docs/development/REACT_QUERY_GUIDE.md](../development/REACT_QUERY_GUIDE.md) for invalidation patterns.

### 9.4 Forms

- React Hook Form + Zod resolver where forms exceed two fields.
- Zod schemas in [src/lib/validations.ts](../../src/lib/validations.ts) are the **single source of truth** for input shapes — server route handler and client form share the same schema.

---

## 10. Performance & Caching

- React Query: never trust the default `staleTime`; set per-query.
- Prisma: avoid N+1 with `include` and explicit `select`. The query log in dev should not show repeated lookups for the same parent.
- Heavy components (charts, photo galleries) → `dynamic(() => import(...), { ssr: false })`.
- Memoize callbacks (`useCallback`) in hot components where a new function identity would re-render expensive children.
- Avoid global mutable state. Avoid hidden side effects in components.

---

## 11. Anti-Patterns (do not do this)

- Business logic inside `page.tsx` files
- Fetching data outside React Query hooks
- Hardcoded `localhost` URLs in any code
- Magic strings — use constants or Zod enums
- `useEffect` for data fetching
- Cross-tenant queries (missing `companyId` scope)
- `companyId` from the client / request body
- Direct shadcn primitive edits in `src/components/ui/`
- Hardcoded hex colors — use design tokens from [src/app/globals.css](../../src/app/globals.css) and [src/styles/brand.config.ts](../../src/styles/brand.config.ts)
- Quick-fix patches without root-cause analysis

---

## 12. Cross-References

### Decision records (`docs/superpowers/specs/`)
- `2026-04-22-company-multi-user-architecture.md` — Company-as-Tenant, roles, migration phases
- `2026-04-21-multi-tenancy-design.md` — original tenant-isolation decision (Sprint 16)
- `2026-04-13-email-automation-design.md` — email cron + opt-out
- `2026-04-15-account-page-design.md` — account page + user/profile/preferences API
- `2026-04-21-maintenance-checklist-design.md` — maintenance checklist data model
- `2026-04-23-system-photos-design.md` — system photo storage
- `2026-04-29-landingpage-design.md` — public landing page

### Living docs
- [docs/EMAIL-SYSTEM.md](../EMAIL-SYSTEM.md) — full email type/cron reference
- [docs/development/REACT_QUERY_GUIDE.md](../development/REACT_QUERY_GUIDE.md) — React Query patterns
- [docs/development/DEVELOPER-SETUP-GUIDE.md](../development/DEVELOPER-SETUP-GUIDE.md) — local dev setup
- [docs/development/KNOWLEDGE-GRAPHS.md](../development/KNOWLEDGE-GRAPHS.md) — graphify graphs (code, backbone, docs, marketing)
- [docs/development/MARKETING-WORKFLOW.md](../development/MARKETING-WORKFLOW.md) — marketing graph + voice rules
- [docs/development/DESIGN-SYSTEM-WORKFLOW.md](../development/DESIGN-SYSTEM-WORKFLOW.md) — design system bundle + open deltas
- [docs/development/BACKLOG-WORKFLOW.md](../development/BACKLOG-WORKFLOW.md) — `/backlog` command procedure
- [docs/development/TIMESHEET-AUTOTRACK.md](../development/TIMESHEET-AUTOTRACK.md) — timesheet auto-update procedure

### Knowledge graphs (token-saving lookups)
- `docs/graphify/graphify-out-codemap/` — all of `src/`
- `docs/graphify/graphify-out-backbone/` — runtime layer (`src/app` + `src/lib` + `src/hooks`)
- `docs/graphify/graphify-out-docs/` — all of `docs/`
- `docs/graphify/graphify-out-marketing/` — landing page + brand + marketing docs

---

## Changelog

- **2026-05-07** — Doc rewritten from stub. Self-contained reference covering tenancy, auth, API conventions, multi-tenancy rule, RLS deny-all, DB, email, frontend, performance, cross-references. Source content consolidated from the previous CLAUDE.md (lines 401–492 of the pre-refactor version) and `docs/superpowers/specs/2026-04-22-company-multi-user-architecture.md`.
