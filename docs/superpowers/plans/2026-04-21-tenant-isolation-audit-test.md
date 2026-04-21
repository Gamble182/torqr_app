# Tenant Isolation Audit Test — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Vitest audit test that statically verifies every tenant-scoped API route file contains `userId` scoping, catching future omissions at CI time before they reach production.

**Architecture:** A single test file reads each tenant-scoped route file from disk using Node's `fs` module and asserts the presence of `userId` in the file contents. This is a grep-style static check — no imports, no mocking, no running route handlers. Exempt routes (admin, cron, webhook, catalog, unsubscribe) are explicitly listed with the reason so future developers understand why they are excluded.

**Tech Stack:** Vitest (already configured), Node.js `fs/path` (built-in), no new dependencies.

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/__tests__/audit/tenant-isolation.test.ts` | Static audit: asserts `userId` present in every tenant-scoped route |

No other files need to change. CLAUDE.md and the decision doc are already committed.

---

### Task 1: Write the failing audit test

**Files:**
- Create: `src/__tests__/audit/tenant-isolation.test.ts`

- [ ] **Step 1: Create the test file**

```typescript
// src/__tests__/audit/tenant-isolation.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Tenant isolation audit.
 *
 * These route files handle tenant-owned data (Customer, CustomerSystem,
 * Maintenance, Booking, EmailLog). Every one must scope Prisma queries
 * with `userId` derived from `requireAuth()`.
 *
 * See: docs/superpowers/specs/2026-04-21-multi-tenancy-design.md
 */

const ROOT = path.resolve(__dirname, '../../../src/app/api');

// Routes that MUST contain userId scoping.
const TENANT_ROUTES = [
  'customers/route.ts',
  'customers/[id]/route.ts',
  'customers/[id]/send-reminder/route.ts',
  'customer-systems/route.ts',
  'customer-systems/[id]/route.ts',
  'maintenances/route.ts',
  'maintenances/[id]/route.ts',
  'bookings/route.ts',
  'dashboard/stats/route.ts',
  'wartungen/route.ts',
  'user/profile/route.ts',
  'user/password/route.ts',
  'user/preferences/route.ts',
  'user/send-weekly-summary/route.ts',
  'upload/photo/route.ts',
];

// Routes intentionally exempt from userId scoping — document why.
// Updating this list requires a corresponding decision record update.
const EXEMPT_ROUTES: Record<string, string> = {
  'admin/users/route.ts':             'Cross-tenant by design — requireAdmin() gated',
  'admin/users/[id]/route.ts':        'Cross-tenant by design — requireAdmin() gated',
  'admin/emails/route.ts':            'Cross-tenant by design — requireAdmin() gated',
  'admin/stats/route.ts':             'Cross-tenant by design — requireAdmin() gated',
  'admin/crons/route.ts':             'Platform-level data — requireAdmin() gated',
  'cron/daily-reminders/route.ts':    'Cross-tenant by design — CRON_SECRET gated',
  'cron/weekly-summary/route.ts':     'Cross-tenant by design — CRON_SECRET gated',
  'webhooks/cal/route.ts':            'Resolves tenant dynamically from payload metadata',
  'catalog/route.ts':                 'Global shared table — no tenant scope by design',
  'email/unsubscribe/[token]/route.ts': 'Stateless HMAC token — no session required',
  'auth/[...nextauth]/route.ts':      'Auth handler — not a data route',
  'auth/register/route.ts':           'Registration — userId not yet established',
  'sentry-example-api/route.ts':      'Sentry test route — no tenant data',
};

function readRoute(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
}

describe('Tenant isolation audit', () => {
  describe('TENANT_ROUTES all contain userId scoping', () => {
    for (const route of TENANT_ROUTES) {
      it(`${route} contains userId`, () => {
        const content = readRoute(route);
        expect(
          content,
          `\n\nROUTE MISSING userId SCOPE: src/app/api/${route}\n` +
          `Every tenant route must scope queries with userId from requireAuth().\n` +
          `See: docs/superpowers/specs/2026-04-21-multi-tenancy-design.md\n`
        ).toContain('userId');
      });
    }
  });

  describe('TENANT_ROUTES all exist on disk', () => {
    for (const route of TENANT_ROUTES) {
      it(`${route} exists`, () => {
        expect(
          fs.existsSync(path.join(ROOT, route)),
          `Route file not found: src/app/api/${route} — update TENANT_ROUTES if this route was renamed or deleted`
        ).toBe(true);
      });
    }
  });

  describe('EXEMPT_ROUTES all exist on disk', () => {
    for (const route of Object.keys(EXEMPT_ROUTES)) {
      it(`${route} exists`, () => {
        expect(
          fs.existsSync(path.join(ROOT, route)),
          `Exempt route not found: src/app/api/${route} — update EXEMPT_ROUTES if this route was renamed or deleted`
        ).toBe(true);
      });
    }
  });

  it('no uncategorised route files exist', () => {
    // Walk all route.ts files under src/app/api and ensure each is in either
    // TENANT_ROUTES or EXEMPT_ROUTES. This catches newly added routes that
    // haven't been classified yet.
    const allRoutes: string[] = [];

    function walk(dir: string, base: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const rel = path.join(base, entry.name);
        if (entry.isDirectory()) {
          walk(path.join(dir, entry.name), rel);
        } else if (entry.name === 'route.ts') {
          // Normalise Windows backslashes to forward slashes
          allRoutes.push(rel.replace(/\\/g, '/'));
        }
      }
    }

    walk(ROOT, '');

    const known = new Set([...TENANT_ROUTES, ...Object.keys(EXEMPT_ROUTES)]);
    const uncategorised = allRoutes.filter((r) => !known.has(r));

    expect(
      uncategorised,
      `\nNew route(s) are not categorised in the tenant isolation audit:\n` +
      uncategorised.map((r) => `  src/app/api/${r}`).join('\n') +
      `\n\nAdd each route to either TENANT_ROUTES (if it touches tenant data) ` +
      `or EXEMPT_ROUTES (if it is intentionally exempt).\n` +
      `See: docs/superpowers/specs/2026-04-21-multi-tenancy-design.md\n`
    ).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run the test — expect it to PASS immediately**

All tenant routes already have `userId` scoping (confirmed in the architecture audit). This test should pass green on first run.

```bash
npx vitest run src/__tests__/audit/tenant-isolation.test.ts
```

Expected output:
```
✓ Tenant isolation audit > TENANT_ROUTES all contain userId scoping (15 tests)
✓ Tenant isolation audit > TENANT_ROUTES all exist on disk (15 tests)
✓ Tenant isolation audit > EXEMPT_ROUTES all exist on disk (13 tests)
✓ Tenant isolation audit > no uncategorised route files exist
```

If any test fails:
- **"Route file not found"** → the route was renamed; update `TENANT_ROUTES` or `EXEMPT_ROUTES`
- **"contains userId"** → a route is missing scoping; add `where: { userId }` before committing
- **"New route(s) are not categorised"** → a route was added without being classified; add it to the appropriate list

- [ ] **Step 3: Run the full test suite to confirm no regressions**

```bash
npx vitest run
```

Expected: all existing tests still pass.

- [ ] **Step 4: Commit**

```bash
git add src/__tests__/audit/tenant-isolation.test.ts
git commit -m "test(audit): tenant isolation audit — static userId scope check

Vitest test that verifies every tenant-scoped API route contains userId
scoping. Also catches uncategorised new routes at CI time.

15 tenant routes checked. 13 exempt routes documented with reason.
Catches future omissions before they reach production.

See: docs/superpowers/specs/2026-04-21-multi-tenancy-design.md

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Section 7.3 "Isolation test" — ✅ implemented as `tenant-isolation.test.ts`
- Section 7.2 "New developer rule (CLAUDE.md)" — ✅ already committed in prior session
- Section 5 "API route audit" — ✅ all 15 tenant routes + 13 exempt routes listed in test match the spec table exactly
- Section 8 "Re-evaluation triggers" — ✅ not a code item, documented in spec

**Placeholder scan:** None found. All test code is complete and runnable.

**Type consistency:** No cross-task type dependencies — single-task plan, fs/path only.

**Uncategorised routes check:**
The `no uncategorised route files exist` test will catch `sentry-example-api/route.ts` which is in `EXEMPT_ROUTES` — confirmed. All 28 route files accounted for across both lists.
