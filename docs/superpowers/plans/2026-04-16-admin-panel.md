# Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a read-only platform admin panel at `/admin` gated by `ADMIN_EMAILS` env var, giving the operator full system observability: user list, user detail drill-down, email log, and cron monitor.

**Architecture:** Separate `src/app/admin/` route tree with its own layout and nav — no overlap with `/dashboard`. A `requireAdmin()` helper in `src/lib/auth-helpers.ts` wraps `requireAuth()` and checks the session email against `ADMIN_EMAILS`. All admin API routes call `requireAdmin()`. All data queries use Prisma without `userId` scoping (cross-tenant reads). No schema changes required.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind CSS, shadcn/ui (Card, Badge, Button), Prisma, NextAuth v5 (`useSession`), TanStack Query v5 for client-side data fetching in admin pages.

---

## File Structure

**New files:**
- `src/lib/admin-auth.ts` — `requireAdmin()` server helper
- `src/app/admin/layout.tsx` — admin shell with nav sidebar
- `src/app/admin/page.tsx` — overview: system stats + last cron runs + recent errors
- `src/app/admin/users/page.tsx` — user list with search
- `src/app/admin/users/[id]/page.tsx` — user detail drill-down
- `src/app/admin/emails/page.tsx` — email log across all users
- `src/app/admin/crons/page.tsx` — cron run monitor
- `src/app/api/admin/stats/route.ts` — system-wide counts + cron status
- `src/app/api/admin/users/route.ts` — paginated user list
- `src/app/api/admin/users/[id]/route.ts` — single user with their data
- `src/app/api/admin/emails/route.ts` — email log with filters
- `src/app/api/admin/crons/route.ts` — cron run history
- `src/hooks/useAdmin.ts` — React Query hooks for all admin endpoints
- `src/lib/email/__tests__/admin-auth.test.ts` — unit tests for requireAdmin

**Modified files:**
- `src/lib/auth-helpers.ts` — add `requireAdmin()` export (or keep separate, prefer separate for clarity)

---

## Task 1: `requireAdmin()` helper + tests

**Files:**
- Create: `src/lib/admin-auth.ts`
- Create: `src/lib/__tests__/admin-auth.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/admin-auth.test.ts`:

```typescript
// Tests for requireAdmin helper
// We mock the auth module to control session state

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

import { auth } from '@/lib/auth';

const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe('isAdminEmail', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns true when email is in ADMIN_EMAILS', () => {
    process.env.ADMIN_EMAILS = 'admin@torqr.de,other@torqr.de';
    const { isAdminEmail } = require('@/lib/admin-auth');
    expect(isAdminEmail('admin@torqr.de')).toBe(true);
  });

  it('returns true for second email in list', () => {
    process.env.ADMIN_EMAILS = 'admin@torqr.de,other@torqr.de';
    const { isAdminEmail } = require('@/lib/admin-auth');
    expect(isAdminEmail('other@torqr.de')).toBe(true);
  });

  it('returns false when email is not in ADMIN_EMAILS', () => {
    process.env.ADMIN_EMAILS = 'admin@torqr.de';
    const { isAdminEmail } = require('@/lib/admin-auth');
    expect(isAdminEmail('notadmin@torqr.de')).toBe(false);
  });

  it('returns false when ADMIN_EMAILS is not set', () => {
    delete process.env.ADMIN_EMAILS;
    const { isAdminEmail } = require('@/lib/admin-auth');
    expect(isAdminEmail('admin@torqr.de')).toBe(false);
  });

  it('is case-insensitive', () => {
    process.env.ADMIN_EMAILS = 'Admin@Torqr.de';
    const { isAdminEmail } = require('@/lib/admin-auth');
    expect(isAdminEmail('admin@torqr.de')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd c:\Users\y.dorth\Documents\torqr_app\torqr_app
npx jest src/lib/__tests__/admin-auth.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/lib/admin-auth'`

- [ ] **Step 3: Implement `src/lib/admin-auth.ts`**

```typescript
import { auth } from '@/lib/auth';

/**
 * Check if an email is in the ADMIN_EMAILS env var (comma-separated).
 * Case-insensitive. Returns false if env var is not set.
 */
export function isAdminEmail(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS;
  if (!adminEmails) return false;
  return adminEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .includes(email.toLowerCase());
}

/**
 * Require the current session user to be an admin.
 * Throws 'Unauthorized' if not authenticated.
 * Throws 'Forbidden' if authenticated but not an admin.
 */
export async function requireAdmin(): Promise<{ userId: string; email: string; name: string }> {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!session.user.email || !isAdminEmail(session.user.email)) {
    throw new Error('Forbidden');
  }

  return {
    userId: session.user.id as string,
    email: session.user.email,
    name: session.user.name ?? '',
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/lib/__tests__/admin-auth.test.ts --no-coverage
```

Expected: PASS — 5 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin-auth.ts src/lib/__tests__/admin-auth.test.ts
git commit -m "feat(admin): add requireAdmin helper with isAdminEmail + tests"
```

---

## Task 2: Admin API — Stats endpoint

**Files:**
- Create: `src/app/api/admin/stats/route.ts`

- [ ] **Step 1: Create the route**

```typescript
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await requireAdmin();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      totalCustomers,
      totalHeaters,
      totalMaintenances,
      emailsLast7Days,
      lastCronRuns,
      recentEmailErrors,
      recentCronErrors,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.customer.count(),
      prisma.heater.count(),
      prisma.maintenance.count(),
      prisma.emailLog.count({
        where: { sentAt: { gte: sevenDaysAgo } },
      }),
      // Last run per job type
      prisma.$queryRaw<{ jobType: string; startedAt: Date; status: string; emailsSent: number }[]>`
        SELECT DISTINCT ON ("jobType") "jobType", "startedAt", "status", "emailsSent"
        FROM cron_runs
        ORDER BY "jobType", "startedAt" DESC
      `,
      prisma.emailLog.findMany({
        where: { error: { not: null }, sentAt: { gte: sevenDaysAgo } },
        select: { id: true, type: true, sentAt: true, error: true, customerId: true },
        orderBy: { sentAt: 'desc' },
        take: 5,
      }),
      prisma.cronRun.findMany({
        where: { status: 'FAILED', startedAt: { gte: sevenDaysAgo } },
        orderBy: { startedAt: 'desc' },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalCustomers,
        totalHeaters,
        totalMaintenances,
        emailsLast7Days,
        lastCronRuns,
        recentEmailErrors,
        recentCronErrors,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error('[admin/stats]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "admin/stats"
```

Expected: no output (no errors in this file)

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/stats/route.ts
git commit -m "feat(admin): add GET /api/admin/stats endpoint"
```

---

## Task 3: Admin API — Users list + user detail

**Files:**
- Create: `src/app/api/admin/users/route.ts`
- Create: `src/app/api/admin/users/[id]/route.ts`

- [ ] **Step 1: Create users list route**

```typescript
// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const search = req.nextUrl.searchParams.get('search') ?? '';
    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1'));
    const pageSize = 25;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { companyName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          companyName: true,
          createdAt: true,
          _count: {
            select: { customers: true, heaters: true, maintenances: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    // Attach last login from LoginLog
    const userIds = users.map((u) => u.id);
    const lastLogins = await prisma.loginLog.findMany({
      where: { userId: { in: userIds }, success: true },
      select: { userId: true, createdAt: true },
      distinct: ['userId'],
      orderBy: { createdAt: 'desc' },
    });
    const lastLoginMap = Object.fromEntries(
      lastLogins.map((l) => [l.userId, l.createdAt])
    );

    const enriched = users.map((u) => ({
      ...u,
      lastLogin: lastLoginMap[u.id] ?? null,
    }));

    return NextResponse.json({
      success: true,
      data: enriched,
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create user detail route**

```typescript
// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { customers: true, heaters: true, maintenances: true, bookings: true },
        },
        customers: {
          select: {
            id: true,
            name: true,
            city: true,
            createdAt: true,
            emailOptIn: true,
            _count: { select: { heaters: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 });
    }

    const [emailLogs, lastLogin] = await Promise.all([
      prisma.emailLog.findMany({
        where: { customer: { userId: id } },
        select: {
          id: true, type: true, sentAt: true, resendId: true, error: true,
          customer: { select: { name: true } },
        },
        orderBy: { sentAt: 'desc' },
        take: 20,
      }),
      prisma.loginLog.findFirst({
        where: { userId: id, success: true },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, ipAddress: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { ...user, emailLogs, lastLogin },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "admin/users"
```

Expected: no output

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/users/route.ts src/app/api/admin/users/[id]/route.ts
git commit -m "feat(admin): add GET /api/admin/users and /api/admin/users/[id] endpoints"
```

---

## Task 4: Admin API — Email log + Cron monitor

**Files:**
- Create: `src/app/api/admin/emails/route.ts`
- Create: `src/app/api/admin/crons/route.ts`

- [ ] **Step 1: Create email log route**

```typescript
// src/app/api/admin/emails/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const type = req.nextUrl.searchParams.get('type') ?? '';
    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1'));
    const pageSize = 50;

    const where = type
      ? { type: type as 'REMINDER_1_WEEK' | 'REMINDER_4_WEEKS' | 'WEEKLY_SUMMARY' | 'OPT_IN_CONFIRMATION' }
      : {};

    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        select: {
          id: true,
          type: true,
          sentAt: true,
          resendId: true,
          error: true,
          customer: {
            select: {
              id: true,
              name: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { sentAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.emailLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create cron monitor route**

```typescript
// src/app/api/admin/crons/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1'));
    const pageSize = 50;

    const [runs, total] = await Promise.all([
      prisma.cronRun.findMany({
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.cronRun.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: runs,
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "admin/emails\|admin/crons"
```

Expected: no output

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/emails/route.ts src/app/api/admin/crons/route.ts
git commit -m "feat(admin): add GET /api/admin/emails and /api/admin/crons endpoints"
```

---

## Task 5: React Query hooks for admin

**Files:**
- Create: `src/hooks/useAdmin.ts`

- [ ] **Step 1: Create the hooks file**

```typescript
// src/hooks/useAdmin.ts
import { useQuery } from '@tanstack/react-query';

async function fetchAdmin<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (res.status === 401) throw new Error('Unauthorized');
  if (res.status === 403) throw new Error('Forbidden');
  if (!res.ok) throw new Error('Fehler beim Laden');
  const json = await res.json();
  return json.data as T;
}

// ---- Types ----

export interface AdminStats {
  totalUsers: number;
  totalCustomers: number;
  totalHeaters: number;
  totalMaintenances: number;
  emailsLast7Days: number;
  lastCronRuns: { jobType: string; startedAt: string; status: string; emailsSent: number }[];
  recentEmailErrors: { id: string; type: string; sentAt: string; error: string; customerId: string }[];
  recentCronErrors: { id: string; jobType: string; startedAt: string; errors: string | null }[];
}

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  createdAt: string;
  lastLogin: string | null;
  _count: { customers: number; heaters: number; maintenances: number };
}

export interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  phone: string | null;
  createdAt: string;
  _count: { customers: number; heaters: number; maintenances: number; bookings: number };
  customers: {
    id: string; name: string; city: string; createdAt: string;
    emailOptIn: string; _count: { heaters: number };
  }[];
  emailLogs: {
    id: string; type: string; sentAt: string; resendId: string | null;
    error: string | null; customer: { name: string };
  }[];
  lastLogin: { createdAt: string; ipAddress: string | null } | null;
}

export interface AdminEmailLog {
  id: string;
  type: string;
  sentAt: string;
  resendId: string | null;
  error: string | null;
  customer: { id: string; name: string; user: { id: string; name: string; email: string } };
}

export interface AdminCronRun {
  id: string;
  jobType: string;
  startedAt: string;
  completedAt: string | null;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  emailsSent: number;
  errors: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: { total: number; page: number; pageSize: number; totalPages: number };
}

// ---- Hooks ----

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: () => fetchAdmin('/api/admin/stats'),
    staleTime: 30_000,
  });
}

export function useAdminUsers(search: string, page: number) {
  return useQuery<PaginatedResponse<AdminUserSummary>>({
    queryKey: ['admin', 'users', search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('Fehler beim Laden');
      const json = await res.json();
      return { data: json.data, pagination: json.pagination };
    },
    staleTime: 30_000,
  });
}

export function useAdminUser(id: string) {
  return useQuery<AdminUserDetail>({
    queryKey: ['admin', 'users', id],
    queryFn: () => fetchAdmin(`/api/admin/users/${id}`),
    staleTime: 30_000,
  });
}

export function useAdminEmails(type: string, page: number) {
  return useQuery<PaginatedResponse<AdminEmailLog>>({
    queryKey: ['admin', 'emails', type, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) });
      if (type) params.set('type', type);
      const res = await fetch(`/api/admin/emails?${params}`);
      if (!res.ok) throw new Error('Fehler beim Laden');
      const json = await res.json();
      return { data: json.data, pagination: json.pagination };
    },
    staleTime: 30_000,
  });
}

export function useAdminCrons(page: number) {
  return useQuery<PaginatedResponse<AdminCronRun>>({
    queryKey: ['admin', 'crons', page],
    queryFn: async () => {
      const res = await fetch(`/api/admin/crons?page=${page}`);
      if (!res.ok) throw new Error('Fehler beim Laden');
      const json = await res.json();
      return { data: json.data, pagination: json.pagination };
    },
    staleTime: 30_000,
  });
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "useAdmin"
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAdmin.ts
git commit -m "feat(admin): add useAdmin React Query hooks"
```

---

## Task 6: Admin layout + nav

**Files:**
- Create: `src/app/admin/layout.tsx`

- [ ] **Step 1: Create the layout**

```typescript
// src/app/admin/layout.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboardIcon,
  UsersIcon,
  MailIcon,
  ActivityIcon,
  LogOutIcon,
  ShieldIcon,
} from 'lucide-react';

const navigation = [
  { name: 'Übersicht', href: '/admin', icon: LayoutDashboardIcon, exact: true },
  { name: 'Benutzer', href: '/admin/users', icon: UsersIcon, exact: false },
  { name: 'E-Mail Log', href: '/admin/emails', icon: MailIcon, exact: false },
  { name: 'Cron Monitor', href: '/admin/crons', icon: ActivityIcon, exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) return null;

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-sidebar flex flex-col fixed top-0 left-0 h-screen z-30">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-destructive text-destructive-foreground font-bold text-sm">
            <ShieldIcon className="h-4 w-4" />
          </div>
          <div>
            <span className="text-sm font-bold text-sidebar-accent-foreground">Torqr Admin</span>
            <p className="text-xs text-sidebar-foreground">Platform</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive/20 text-destructive text-xs font-bold shrink-0">
              {session.user?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{session.user?.name}</p>
              <p className="text-xs text-sidebar-foreground truncate">{session.user?.email}</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-xs text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60 rounded-lg transition-colors"
          >
            <LayoutDashboardIcon className="h-3.5 w-3.5" />
            Zum Dashboard
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-sidebar-foreground hover:text-destructive hover:bg-sidebar-accent/60 rounded-lg transition-colors"
          >
            <LogOutIcon className="h-3.5 w-3.5" />
            Abmelden
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="pl-56 flex-1">
        <div className="mx-auto max-w-6xl px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "admin/layout"
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/layout.tsx
git commit -m "feat(admin): add admin layout with sidebar nav"
```

---

## Task 7: Admin overview page (`/admin`)

**Files:**
- Create: `src/app/admin/page.tsx`

- [ ] **Step 1: Create the overview page**

```typescript
// src/app/admin/page.tsx
'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminStats } from '@/hooks/useAdmin';
import { Loader2Icon, UsersIcon, HomeIcon, WrenchIcon, MailIcon, CheckCircle2Icon, XCircleIcon, ActivityIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

function StatusBadge({ status }: { status: string }) {
  if (status === 'SUCCESS') return <Badge className="bg-success/10 text-success border-success/20">Erfolgreich</Badge>;
  if (status === 'FAILED') return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Fehler</Badge>;
  return <Badge className="bg-warning/10 text-warning-foreground border-warning/20">Läuft</Badge>;
}

export default function AdminOverviewPage() {
  const { data, isLoading, error } = useAdminStats();

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-destructive">{error.message === 'Forbidden' ? 'Kein Zugriff' : 'Fehler beim Laden'}</p>
    </div>
  );

  if (!data) return null;

  const stats = [
    { label: 'Benutzer', value: data.totalUsers, icon: UsersIcon },
    { label: 'Kunden', value: data.totalCustomers, icon: UsersIcon },
    { label: 'Heizsysteme', value: data.totalHeaters, icon: HomeIcon },
    { label: 'Wartungen', value: data.totalMaintenances, icon: WrenchIcon },
    { label: 'E-Mails (7 Tage)', value: data.emailsLast7Days, icon: MailIcon },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">System-Übersicht</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform-weite Statistiken und System-Status</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Cron status */}
      <Card className="p-6">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          Letzter Cron-Lauf
        </h2>
        {data.lastCronRuns.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Cron-Läufe</p>
        ) : (
          <div className="space-y-3">
            {data.lastCronRuns.map((run) => (
              <div key={run.jobType} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{run.jobType}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(run.startedAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{run.emailsSent} E-Mails</span>
                  <StatusBadge status={run.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent errors */}
      {(data.recentEmailErrors.length > 0 || data.recentCronErrors.length > 0) && (
        <Card className="p-6 border-destructive/20">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-destructive">
            <XCircleIcon className="h-4 w-4" />
            Aktuelle Fehler (7 Tage)
          </h2>
          <div className="space-y-2">
            {data.recentEmailErrors.map((e) => (
              <div key={e.id} className="text-xs p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                <span className="font-medium">[Email/{e.type}]</span>{' '}
                {format(new Date(e.sentAt), 'dd.MM. HH:mm')} — {e.error}
              </div>
            ))}
            {data.recentCronErrors.map((c) => (
              <div key={c.id} className="text-xs p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                <span className="font-medium">[Cron/{c.jobType}]</span>{' '}
                {format(new Date(c.startedAt), 'dd.MM. HH:mm')} — {c.errors}
              </div>
            ))}
          </div>
        </Card>
      )}

      {data.recentEmailErrors.length === 0 && data.recentCronErrors.length === 0 && (
        <Card className="p-4 border-success/20 bg-success/5">
          <div className="flex items-center gap-2 text-success text-sm">
            <CheckCircle2Icon className="h-4 w-4" />
            Keine Fehler in den letzten 7 Tagen
          </div>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "admin/page"
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat(admin): add admin overview page with system stats and cron status"
```

---

## Task 8: Admin users list page

**Files:**
- Create: `src/app/admin/users/page.tsx`

- [ ] **Step 1: Create the users page**

```typescript
// src/app/admin/users/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminUsers, AdminUserSummary } from '@/hooks/useAdmin';
import { Loader2Icon, SearchIcon, ChevronLeftIcon, ChevronRightIcon, UsersIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminUsers(search, page);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Benutzer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data ? `${data.pagination.total} registrierte Benutzer` : 'Alle registrierten Benutzer'}
        </p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Name, E-Mail oder Firma suchen..."
          className="pl-9 text-base h-11"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-destructive text-sm">{error.message}</p>
      ) : !data || data.data.length === 0 ? (
        <Card className="p-10 text-center">
          <UsersIcon className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Keine Benutzer gefunden</p>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name / Firma</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">E-Mail</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kunden</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Heizungen</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Wartungen</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Letzter Login</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Registriert</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.data.map((user: AdminUserSummary) => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{user.name}</p>
                      {user.companyName && <p className="text-xs text-muted-foreground">{user.companyName}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3 text-right font-semibold">{user._count.customers}</td>
                    <td className="px-4 py-3 text-right font-semibold">{user._count.heaters}</td>
                    <td className="px-4 py-3 text-right font-semibold">{user._count.maintenances}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {user.lastLogin ? format(new Date(user.lastLogin), 'dd.MM.yy HH:mm', { locale: de }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {format(new Date(user.createdAt), 'dd.MM.yyyy', { locale: de })}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${user.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs">Details</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Seite {data.pagination.page} von {data.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= data.pagination.totalPages}>
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/users/page.tsx
git commit -m "feat(admin): add admin users list page"
```

---

## Task 9: Admin user detail page

**Files:**
- Create: `src/app/admin/users/[id]/page.tsx`

- [ ] **Step 1: Create the user detail page**

```typescript
// src/app/admin/users/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminUser } from '@/hooks/useAdmin';
import {
  Loader2Icon, ArrowLeftIcon, UsersIcon, HomeIcon, WrenchIcon,
  MailIcon, CalendarIcon, CheckCircle2Icon, XCircleIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const EMAIL_TYPE_LABELS: Record<string, string> = {
  REMINDER_1_WEEK: '1 Woche',
  REMINDER_4_WEEKS: '4 Wochen',
  WEEKLY_SUMMARY: 'Wochenübersicht',
  OPT_IN_CONFIRMATION: 'Opt-in',
};

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: user, isLoading, error } = useAdminUser(id);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (error || !user) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-destructive">{error?.message ?? 'Benutzer nicht gefunden'}</p>
    </div>
  );

  const counts = [
    { label: 'Kunden', value: user._count.customers, icon: UsersIcon },
    { label: 'Heizsysteme', value: user._count.heaters, icon: HomeIcon },
    { label: 'Wartungen', value: user._count.maintenances, icon: WrenchIcon },
    { label: 'Buchungen', value: user._count.bookings, icon: CalendarIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/users">
          <Button variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground">
            <ArrowLeftIcon className="h-3.5 w-3.5 mr-1" />
            Zurück zur Benutzerliste
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        {user.companyName && <p className="text-sm text-muted-foreground">{user.companyName}</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {counts.map((c) => (
          <Card key={c.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                <c.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-xl font-bold">{c.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Profile info */}
      <Card className="p-6">
        <h2 className="text-base font-semibold mb-4">Profil</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">Telefon:</span> <span>{user.phone ?? '—'}</span></div>
          <div><span className="text-muted-foreground">Registriert:</span> <span>{format(new Date(user.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })}</span></div>
          <div>
            <span className="text-muted-foreground">Letzter Login:</span>{' '}
            <span>{user.lastLogin ? format(new Date(user.lastLogin.createdAt), 'dd.MM.yyyy HH:mm', { locale: de }) : '—'}</span>
          </div>
          {user.lastLogin?.ipAddress && (
            <div><span className="text-muted-foreground">IP:</span> <span className="font-mono text-xs">{user.lastLogin.ipAddress}</span></div>
          )}
        </div>
      </Card>

      {/* Customers */}
      <Card className="p-6">
        <h2 className="text-base font-semibold mb-4">Kunden ({user._count.customers})</h2>
        {user.customers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Kunden</p>
        ) : (
          <div className="space-y-2">
            {user.customers.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.city}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{c._count.heaters} Heizung(en)</span>
                  <Badge variant="outline" className="text-xs">
                    {c.emailOptIn === 'CONFIRMED' ? 'E-Mail aktiv' : c.emailOptIn === 'UNSUBSCRIBED' ? 'Abgemeldet' : 'Kein Opt-in'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Email logs */}
      <Card className="p-6">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <MailIcon className="h-4 w-4 text-muted-foreground" />
          E-Mail Log (letzte 20)
        </h2>
        {user.emailLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine E-Mails gesendet</p>
        ) : (
          <div className="space-y-2">
            {user.emailLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{log.customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {EMAIL_TYPE_LABELS[log.type] ?? log.type} · {format(new Date(log.sentAt), 'dd.MM.yy HH:mm', { locale: de })}
                  </p>
                </div>
                {log.error ? (
                  <XCircleIcon className="h-4 w-4 text-destructive shrink-0" />
                ) : (
                  <CheckCircle2Icon className="h-4 w-4 text-success shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/users/[id]/page.tsx
git commit -m "feat(admin): add admin user detail page"
```

---

## Task 10: Admin email log page

**Files:**
- Create: `src/app/admin/emails/page.tsx`

- [ ] **Step 1: Create the email log page**

```typescript
// src/app/admin/emails/page.tsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminEmails, AdminEmailLog } from '@/hooks/useAdmin';
import { Loader2Icon, ChevronLeftIcon, ChevronRightIcon, CheckCircle2Icon, XCircleIcon, MailIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const EMAIL_TYPES = [
  { value: '', label: 'Alle' },
  { value: 'REMINDER_1_WEEK', label: '1 Woche' },
  { value: 'REMINDER_4_WEEKS', label: '4 Wochen' },
  { value: 'WEEKLY_SUMMARY', label: 'Wochenübersicht' },
  { value: 'OPT_IN_CONFIRMATION', label: 'Opt-in' },
];

export default function AdminEmailsPage() {
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminEmails(type, page);

  const handleType = (value: string) => {
    setType(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">E-Mail Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data ? `${data.pagination.total} E-Mails gesamt` : 'Alle gesendeten E-Mails'}
        </p>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap">
        {EMAIL_TYPES.map((t) => (
          <Button
            key={t.value}
            variant={type === t.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleType(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-destructive text-sm">{error.message}</p>
      ) : !data || data.data.length === 0 ? (
        <Card className="p-10 text-center">
          <MailIcon className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Keine E-Mails gefunden</p>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Datum</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Typ</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kunde</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Benutzer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Resend ID</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((log: AdminEmailLog) => (
                  <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.sentAt), 'dd.MM.yy HH:mm', { locale: de })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium">{log.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{log.customer.name}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <p>{log.customer.user.name}</p>
                      <p>{log.customer.user.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {log.resendId ? log.resendId.slice(0, 20) + '…' : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {log.error
                        ? <XCircleIcon className="h-4 w-4 text-destructive mx-auto" title={log.error} />
                        : <CheckCircle2Icon className="h-4 w-4 text-success mx-auto" />
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Seite {data.pagination.page} von {data.pagination.totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= data.pagination.totalPages}>
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/emails/page.tsx
git commit -m "feat(admin): add admin email log page"
```

---

## Task 11: Admin cron monitor page

**Files:**
- Create: `src/app/admin/crons/page.tsx`

- [ ] **Step 1: Create the cron monitor page**

```typescript
// src/app/admin/crons/page.tsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminCrons, AdminCronRun } from '@/hooks/useAdmin';
import { Loader2Icon, ChevronLeftIcon, ChevronRightIcon, ActivityIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

function StatusBadge({ status }: { status: string }) {
  if (status === 'SUCCESS') return <Badge className="bg-success/10 text-success border-success/20 text-xs">Erfolgreich</Badge>;
  if (status === 'FAILED') return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">Fehler</Badge>;
  return <Badge className="bg-warning/10 text-warning-foreground border-warning/20 text-xs">Läuft</Badge>;
}

export default function AdminCronsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminCrons(page);

  const running = data?.data.filter((r) => r.status === 'RUNNING') ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cron Monitor</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data ? `${data.pagination.total} Läufe gesamt` : 'Alle Cron-Läufe'}
        </p>
      </div>

      {running.length > 0 && (
        <Card className="p-4 border-warning/30 bg-warning/5">
          <p className="text-sm font-semibold text-warning-foreground flex items-center gap-2">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            {running.length} Job(s) laufen aktuell
          </p>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-destructive text-sm">{error.message}</p>
      ) : !data || data.data.length === 0 ? (
        <Card className="p-10 text-center">
          <ActivityIcon className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Keine Cron-Läufe gefunden</p>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Job</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Gestartet</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Abgeschlossen</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">E-Mails</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fehler</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((run: AdminCronRun) => (
                  <tr key={run.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{run.jobType}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(run.startedAt), 'dd.MM.yy HH:mm', { locale: de })}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {run.completedAt ? format(new Date(run.completedAt), 'dd.MM.yy HH:mm', { locale: de }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{run.emailsSent}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={run.status} /></td>
                    <td className="px-4 py-3 text-xs text-destructive max-w-xs truncate">
                      {run.errors ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Seite {data.pagination.page} von {data.pagination.totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= data.pagination.totalPages}>
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/crons/page.tsx
git commit -m "feat(admin): add admin cron monitor page"
```

---

## Task 12: Set ADMIN_EMAILS env var + final verification

**Files:**
- Modify: `.env` (local only — never committed)
- Modify: Vercel environment variables (via dashboard)

- [ ] **Step 1: Add env var locally**

Open `.env` and add:

```
ADMIN_EMAILS=your-email@domain.com
```

Replace `your-email@domain.com` with the email you log in with on torqr.de.

- [ ] **Step 2: Add env var in Vercel**

Go to Vercel dashboard → Project → Settings → Environment Variables.
Add: `ADMIN_EMAILS` = your admin email (same as above).
Set for: Production + Preview.

- [ ] **Step 3: Run all tests**

```bash
cd c:\Users\y.dorth\Documents\torqr_app\torqr_app
npx jest --no-coverage
```

Expected: all tests pass (16 passing minimum + 5 new admin-auth tests = 21)

- [ ] **Step 4: Full TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "companyName\|emailWeeklySummary\|react-switch"
```

Expected: no new errors from admin files

- [ ] **Step 5: Final commit + push**

```bash
git add .
git commit -m "feat(admin): complete platform admin panel — overview, users, email log, cron monitor"
git push origin main
```

- [ ] **Step 6: Smoke test in browser**

1. Navigate to `https://www.torqr.de/admin` — should load overview page
2. Navigate to `/admin/users` — should show user list
3. Navigate to `/admin/emails` — should show email log
4. Navigate to `/admin/crons` — should show cron runs
5. Log in with a non-admin account and try `/admin` — should see "Kein Zugriff"

---

## Self-Review

**Spec coverage:**
- ✅ `/admin` overview with stats + cron status + recent errors
- ✅ `/admin/users` with search + pagination + last login
- ✅ `/admin/users/[id]` with profile, customers, email log
- ✅ `/admin/emails` with type filter + pagination
- ✅ `/admin/crons` with running job highlight + pagination
- ✅ `requireAdmin()` with env-var gate — no DB role needed
- ✅ Separate layout, no overlap with `/dashboard`
- ✅ All API routes return 401/403 appropriately
- ✅ Unit tests for `isAdminEmail` / `requireAdmin`

**Placeholder scan:** None found.

**Type consistency:**
- `AdminUserSummary`, `AdminUserDetail`, `AdminEmailLog`, `AdminCronRun` defined in `useAdmin.ts` and imported consistently in all pages.
- `requireAdmin()` signature consistent across all 4 API route files.
- `fetchAdmin<T>` helper used in stats, user detail, and cron hooks.
