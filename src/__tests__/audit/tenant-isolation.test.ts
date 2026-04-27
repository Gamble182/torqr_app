// src/__tests__/audit/tenant-isolation.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Tenant isolation audit.
 *
 * These route files handle tenant-owned data (Customer, CustomerSystem,
 * Maintenance, Booking, EmailLog). Every one must scope Prisma queries
 * with `companyId` derived from `requireAuth()`.
 *
 * See: docs/superpowers/specs/2026-04-22-company-multi-user-architecture.md
 */

const ROOT = path.resolve(__dirname, '../../../src/app/api');

// Routes that MUST contain companyId scoping (tenant boundary).
const TENANT_ROUTES = [
  'customers/route.ts',
  'customers/[id]/route.ts',
  'customers/[id]/send-reminder/route.ts',
  'customers/[id]/email-logs/route.ts',
  'customer-systems/route.ts',
  'customer-systems/[id]/route.ts',
  'customer-systems/[id]/overrides/route.ts',
  'customer-systems/[id]/effective-parts/route.ts',
  'overrides/[id]/route.ts',
  'maintenances/route.ts',
  'maintenances/[id]/route.ts',
  'bookings/route.ts',
  'bookings/[id]/route.ts',
  'bookings/[id]/packing-list/route.ts',
  'dashboard/stats/route.ts',
  'wartungen/route.ts',
  'systems/[id]/follow-ups/route.ts',
  'systems/[id]/checklist-items/route.ts',
  'systems/[id]/checklist-items/[itemId]/route.ts',
  'systems/[id]/photos/route.ts',
  'follow-ups/[id]/route.ts',
  'employees/route.ts',
  'employees/[id]/route.ts',
  'maintenance-sets/route.ts',
  'maintenance-sets/[id]/route.ts',
  'maintenance-sets/[id]/items/route.ts',
  'maintenance-sets/[id]/items/reorder/route.ts',
  'maintenance-set-items/[id]/route.ts',
  'inventory/route.ts',
  'inventory/[id]/route.ts',
  'inventory/[id]/movements/route.ts',
];

// Routes that scope by userId (user's own record, not tenant data).
const USER_ROUTES = [
  'user/profile/route.ts',
  'user/password/route.ts',
  'user/preferences/route.ts',
  'user/send-weekly-summary/route.ts',
  'user/force-change-password/route.ts',
  'user/account/route.ts',
];

// Routes that accept cross-tenant FKs in user input — every route MUST
// validate same-tenant ownership of the FK before insert/update via
// `findFirst({ where: { id: <fkId>, companyId } })` before referencing it.
// See: runbook Decision §4 (docs/superpowers/plans/2026-04-24-wartungsteile-execution-runbook.md)
//      spec (docs/superpowers/plans/2026-04-24-wartungsteile-materialmanagement-phase-a.md)
const CROSS_TENANT_FK_GUARDED_ROUTES: Record<string, string[]> = {
  'customer-systems/[id]/overrides/route.ts': ['inventoryItemId', 'excludedSetItemId'],
  'maintenance-sets/[id]/items/route.ts': ['inventoryItemId'],
  'maintenance-set-items/[id]/route.ts': ['inventoryItemId'],
  'maintenances/route.ts': ['inventoryItemId'],
};

// Routes intentionally exempt from companyId scoping — document why.
// Updating this list requires a corresponding decision record update.
const EXEMPT_ROUTES: Record<string, string> = {
  'admin/users/route.ts':             'Cross-tenant by design — requireAdmin() gated',
  'admin/users/[id]/route.ts':        'Cross-tenant by design — requireAdmin() gated',
  'admin/emails/route.ts':            'Cross-tenant by design — requireAdmin() gated',
  'admin/stats/route.ts':             'Cross-tenant by design — requireAdmin() gated',
  'admin/crons/route.ts':             'Platform-level data — requireAdmin() gated',
  'cron/daily-reminders/route.ts':    'Cross-tenant by design — CRON_SECRET gated',
  'cron/weekly-summary/route.ts':     'Cross-tenant by design — CRON_SECRET gated',
  'webhooks/cal/route.ts':            'Resolves tenant dynamically from payload metadata — uses companyId from resolved user',
  'catalog/route.ts':                 'Global shared table — no tenant scope by design',
  'email/unsubscribe/[token]/route.ts': 'Stateless HMAC token — no session required',
  'auth/[...nextauth]/route.ts':      'Auth handler — not a data route',
  'auth/register/route.ts':           'Registration — creates new company + user',
  'upload/photo/route.ts':            'Storage-only route — ownership verified via companyId on maintenance record',
};

function readRoute(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
}

describe('Tenant isolation audit', () => {
  describe('TENANT_ROUTES all contain companyId scoping', () => {
    for (const route of TENANT_ROUTES) {
      it(`${route} contains companyId`, () => {
        const content = readRoute(route);
        expect(
          content,
          `\n\nROUTE MISSING companyId SCOPE: src/app/api/${route}\n` +
          `Every tenant route must scope queries with companyId from requireAuth().\n` +
          `See: docs/superpowers/specs/2026-04-22-company-multi-user-architecture.md\n`
        ).toContain('companyId');
      });
    }
  });

  describe('USER_ROUTES all contain userId scoping', () => {
    for (const route of USER_ROUTES) {
      it(`${route} contains userId`, () => {
        const content = readRoute(route);
        expect(
          content,
          `\n\nROUTE MISSING userId SCOPE: src/app/api/${route}\n` +
          `Every user route must scope queries with userId from requireAuth().\n`
        ).toContain('userId');
      });
    }
  });

  describe('All categorised routes exist on disk', () => {
    for (const route of [...TENANT_ROUTES, ...USER_ROUTES]) {
      it(`${route} exists`, () => {
        expect(
          fs.existsSync(path.join(ROOT, route)),
          `Route file not found: src/app/api/${route} — update route lists if this route was renamed or deleted`
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

  describe('CROSS_TENANT_FK_GUARDED_ROUTES contain ownership guards', () => {
    for (const [route, fkFields] of Object.entries(CROSS_TENANT_FK_GUARDED_ROUTES)) {
      for (const fk of fkFields) {
        it(`${route} references ${fk}`, () => {
          const content = readRoute(route);
          expect(
            content,
            `\n\nROUTE MISSING FK FIELD: src/app/api/${route}\n` +
            `Expected to find FK field "${fk}" in route source — has the schema or input shape changed?\n` +
            `Update CROSS_TENANT_FK_GUARDED_ROUTES if the FK was renamed or removed.\n` +
            `See: runbook Decision §4 (docs/superpowers/plans/2026-04-24-wartungsteile-execution-runbook.md)\n`
          ).toContain(fk);
        });

        it(`${route} guards ${fk} with same-tenant findFirst + companyId`, () => {
          const content = readRoute(route);
          // Sanity: the canonical guard pattern is `findFirst({ where: { id: <fkId>, companyId } })`.
          // We assert both tokens exist; the per-FK test above pins which FK we're auditing.
          expect(
            content,
            `\n\nROUTE MISSING FK GUARD: src/app/api/${route}\n` +
            `FK "${fk}" must be validated with prisma.<table>.findFirst({ where: { id, companyId } })\n` +
            `before being referenced in create/update — otherwise a cross-tenant FK leak is possible.\n` +
            `See: runbook Decision §4 (docs/superpowers/plans/2026-04-24-wartungsteile-execution-runbook.md)\n` +
            `     spec (docs/superpowers/plans/2026-04-24-wartungsteile-materialmanagement-phase-a.md)\n`
          ).toContain('findFirst');
          expect(
            content,
            `\n\nROUTE MISSING companyId IN FK GUARD: src/app/api/${route}\n` +
            `FK "${fk}" guard must include companyId in the where clause.\n`
          ).toContain('companyId');
        });
      }
    }
  });

  it('no uncategorised route files exist', () => {
    const allRoutes: string[] = [];

    function walk(dir: string, base: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const rel = path.join(base, entry.name);
        if (entry.isDirectory()) {
          walk(path.join(dir, entry.name), rel);
        } else if (entry.name === 'route.ts') {
          allRoutes.push(rel.replace(/\\/g, '/'));
        }
      }
    }

    walk(ROOT, '');

    const known = new Set([...TENANT_ROUTES, ...USER_ROUTES, ...Object.keys(EXEMPT_ROUTES)]);
    const uncategorised = allRoutes.filter((r) => !known.has(r));

    expect(
      uncategorised,
      `\nNew route(s) are not categorised in the tenant isolation audit:\n` +
      uncategorised.map((r) => `  src/app/api/${r}`).join('\n') +
      `\n\nAdd each route to either TENANT_ROUTES, USER_ROUTES, or EXEMPT_ROUTES.\n` +
      `See: docs/superpowers/specs/2026-04-22-company-multi-user-architecture.md\n`
    ).toHaveLength(0);
  });
});
