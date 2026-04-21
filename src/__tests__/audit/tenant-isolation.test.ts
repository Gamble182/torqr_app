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
  'upload/photo/route.ts':            'Storage-only route — auth-gated via requireAuth(), path keyed by maintenanceId not userId; missing userId scope is a known backlog item',
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
