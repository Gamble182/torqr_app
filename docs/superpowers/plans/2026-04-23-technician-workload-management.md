# Technician Workload Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give OWNERs full workload visibility per technician, one-click reassignment (single + bulk), and a self-healing deactivation flow that silently reassigns orphaned systems to the OWNER.

**Architecture:** Builds on Sprint 23's `CustomerSystem.assignedToUserId` relation — no schema changes. Adds a new `GET /api/employees/[id]` detail endpoint (stats + grouped systems + recent activity), extends `GET /api/employees` with aggregate workload counts, extends `GET /api/customer-systems` with an `assignee` query param, modifies `PATCH /api/employees/[id]` to transactionally reassign systems on deactivation, and adds a new `/dashboard/employees/[id]` page plus an `AssigneeBadge` component used across existing system lists. Bulk reassign is N parallel PATCH calls batched inside one React Query mutation — no new bulk endpoint.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Prisma, NextAuth v5, React Query v5, Zod, Tailwind, shadcn/ui, Vitest, React Hook Form, Sonner.

**Spec reference:** `docs/superpowers/specs/2026-04-23-technician-workload-management-design.md`

---

## File Structure

| Path | Action | Responsibility |
|------|--------|----------------|
| `src/components/AssigneeBadge.tsx` | Create | Avatar + name pill for assigned tech (or "Nicht zugewiesen") |
| `src/components/__tests__/AssigneeBadge.test.tsx` | Create | Unit test for AssigneeBadge rendering variants |
| `src/app/api/employees/route.ts` | Modify | Add `workload` aggregate (assigned + overdue counts) to list response |
| `src/app/api/employees/[id]/route.ts` | Modify | Add GET (detail + stats + grouped systems + activity); auto-reassign on deactivation |
| `src/app/api/employees/__tests__/route.test.ts` | Create | Route-level unit tests (list workload, detail shape, deactivate reassign) |
| `src/app/api/customer-systems/route.ts` | Modify | Accept `?assignee=<userId\|unassigned\|all>` query param |
| `src/app/api/customer-systems/__tests__/filter.test.ts` | Create | Assignee filter unit test (query param → where clause) |
| `src/app/api/dashboard/stats/route.ts` | Modify | Return `unassignedSystemsCount`, drop `unassignedAfterDeactivation` |
| `src/hooks/useEmployees.ts` | Modify | Add `workload` to `Employee`, add `useEmployee(id)` and `useBulkReassignSystems` |
| `src/hooks/useCustomerSystems.ts` | Modify | Accept `assignee` param, include in query key |
| `src/hooks/useDashboard.ts` | Modify | Replace `unassignedAfterDeactivation` with `unassignedSystemsCount` |
| `src/app/dashboard/employees/page.tsx` | Modify | Row click → detail page (stopPropagation on deactivate button); workload column |
| `src/app/dashboard/employees/[id]/page.tsx` | Create | Technician detail page (header, stats, grouped systems, reassign modal, activity) |
| `src/app/dashboard/systems/page.tsx` | Modify | Add "Zuweisung" dropdown + AssigneeBadge on cards (URL-driven) |
| `src/app/dashboard/customers/[id]/page.tsx` | Modify | Add AssigneeBadge on per-customer system cards |
| `src/app/dashboard/page.tsx` | Modify | Replace warning block with compact "Nicht zugewiesen" tile |
| `src/lib/validations.ts` | Modify | Add `assigneeFilterSchema` (Zod enum + uuid union) |
| `docs/BACKLOG.md` | Modify | Move relevant open items to Completed on finish |

---

## Task 1: AssigneeBadge component + unit test

**Files:**
- Create: `src/components/AssigneeBadge.tsx`
- Create: `src/components/__tests__/AssigneeBadge.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/__tests__/AssigneeBadge.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AssigneeBadge } from '../AssigneeBadge';

describe('AssigneeBadge', () => {
  it('renders initials and name when a user is assigned', () => {
    render(<AssigneeBadge user={{ id: 'u1', name: 'Max Mustermann' }} />);
    expect(screen.getByText('MM')).toBeInTheDocument();
    expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
  });

  it('renders "Nicht zugewiesen" when user is null', () => {
    render(<AssigneeBadge user={null} />);
    expect(screen.getByText('Nicht zugewiesen')).toBeInTheDocument();
  });

  it('hides the name when showName=false', () => {
    render(<AssigneeBadge user={{ id: 'u1', name: 'Max Mustermann' }} showName={false} />);
    expect(screen.queryByText('Max Mustermann')).not.toBeInTheDocument();
    expect(screen.getByText('MM')).toBeInTheDocument();
  });

  it('computes single-letter initial for mononym', () => {
    render(<AssigneeBadge user={{ id: 'u1', name: 'Cher' }} />);
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('applies the sm size class when size=sm', () => {
    const { container } = render(<AssigneeBadge user={null} size="sm" />);
    expect(container.querySelector('.h-5')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Install testing-library if missing, then run and verify fails**

Run: `npm install -D @testing-library/react @testing-library/jest-dom jsdom` (skip if already present), then update `vitest.config.ts` environment to `jsdom` for this file via `environmentMatchGlobs` or a file-level `// @vitest-environment jsdom` pragma at the top of the test.

Add the pragma to the top of the test:

```tsx
// @vitest-environment jsdom
```

Run: `npx vitest run src/components/__tests__/AssigneeBadge.test.tsx`
Expected: FAIL with "Cannot find module '../AssigneeBadge'"

- [ ] **Step 3: Implement the component**

```tsx
// src/components/AssigneeBadge.tsx
import { UserIcon } from 'lucide-react';

export type AssigneeBadgeProps = {
  user: { id: string; name: string } | null;
  size?: 'sm' | 'md';
  showName?: boolean;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]!.toUpperCase();
  return (parts[0][0]! + parts[parts.length - 1][0]!).toUpperCase();
}

export function AssigneeBadge({ user, size = 'md', showName = true }: AssigneeBadgeProps) {
  const circle = size === 'sm' ? 'h-5 w-5 text-[10px]' : 'h-6 w-6 text-xs';
  const text = size === 'sm' ? 'text-xs' : 'text-sm';

  if (!user) {
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <span
          className={`inline-flex items-center justify-center rounded-full border border-dashed border-muted-foreground/40 ${circle}`}
          aria-hidden="true"
        >
          <UserIcon className="h-3 w-3" />
        </span>
        {showName && <span className={text}>Nicht zugewiesen</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5" title={user.name}>
      <span
        className={`inline-flex items-center justify-center rounded-full bg-primary/15 font-semibold text-primary ${circle}`}
        aria-hidden="true"
      >
        {getInitials(user.name)}
      </span>
      {showName && <span className={`text-muted-foreground ${text}`}>{user.name}</span>}
    </span>
  );
}
```

- [ ] **Step 4: Run the test, verify passes**

Run: `npx vitest run src/components/__tests__/AssigneeBadge.test.tsx`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/AssigneeBadge.tsx src/components/__tests__/AssigneeBadge.test.tsx
git commit -m "feat(ui): add AssigneeBadge component with initials + unassigned state"
```

---

## Task 2: Extend `GET /api/employees` with workload counts

**Files:**
- Modify: `src/app/api/employees/route.ts`
- Create: `src/app/api/employees/__tests__/route.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/app/api/employees/__tests__/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth-helpers', () => ({
  requireOwner: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    customerSystem: {
      groupBy: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
    },
    maintenance: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { GET } from '../route';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

describe('GET /api/employees', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns employees with workload counts per user', async () => {
    vi.mocked(requireOwner).mockResolvedValue({
      userId: 'owner-1',
      companyId: 'co-1',
      role: 'OWNER',
      email: 'o@x.de',
      name: 'Owner',
    });
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: 'u1', name: 'Tech A', email: 'a@x.de', phone: null, role: 'TECHNICIAN', isActive: true, deactivatedAt: null, createdAt: new Date() } as never,
      { id: 'u2', name: 'Tech B', email: 'b@x.de', phone: null, role: 'TECHNICIAN', isActive: true, deactivatedAt: null, createdAt: new Date() } as never,
    ]);
    vi.mocked(prisma.customerSystem.groupBy).mockImplementation(async (args: unknown) => {
      const a = args as { where: { nextMaintenance?: unknown } };
      if (a.where.nextMaintenance) {
        return [{ assignedToUserId: 'u1', _count: { _all: 2 } }] as never;
      }
      return [
        { assignedToUserId: 'u1', _count: { _all: 5 } },
        { assignedToUserId: 'u2', _count: { _all: 3 } },
      ] as never;
    });

    const res = await GET();
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    const u1 = body.data.find((e: { id: string }) => e.id === 'u1');
    expect(u1.workload).toEqual({ assignedSystemsCount: 5, overdueSystemsCount: 2 });
    const u2 = body.data.find((e: { id: string }) => e.id === 'u2');
    expect(u2.workload).toEqual({ assignedSystemsCount: 3, overdueSystemsCount: 0 });
  });

  it('returns 403 when requester is not OWNER', async () => {
    vi.mocked(requireOwner).mockRejectedValue(new Error('Forbidden'));
    const res = await GET();
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 2: Run and verify fails**

Run: `npx vitest run src/app/api/employees/__tests__/route.test.ts`
Expected: FAIL — `workload` property missing on returned employees.

- [ ] **Step 3: Modify the route to compute workload in a single groupBy**

```ts
// src/app/api/employees/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { employeeCreateSchema } from '@/lib/validations';
import { hashPassword } from '@/lib/password';
import { randomBytes } from 'crypto';

export async function GET() {
  try {
    const { companyId } = await requireOwner();

    const employees = await prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        deactivatedAt: true,
        createdAt: true,
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });

    const now = new Date();
    const [totalByUser, overdueByUser] = await Promise.all([
      prisma.customerSystem.groupBy({
        by: ['assignedToUserId'],
        where: { companyId, assignedToUserId: { not: null } },
        _count: { _all: true },
      }),
      prisma.customerSystem.groupBy({
        by: ['assignedToUserId'],
        where: {
          companyId,
          assignedToUserId: { not: null },
          nextMaintenance: { lt: now },
        },
        _count: { _all: true },
      }),
    ]);

    const totalMap = new Map<string, number>(
      totalByUser
        .filter((g) => g.assignedToUserId !== null)
        .map((g) => [g.assignedToUserId as string, g._count._all])
    );
    const overdueMap = new Map<string, number>(
      overdueByUser
        .filter((g) => g.assignedToUserId !== null)
        .map((g) => [g.assignedToUserId as string, g._count._all])
    );

    const withWorkload = employees.map((e) => ({
      ...e,
      workload: {
        assignedSystemsCount: totalMap.get(e.id) ?? 0,
        overdueSystemsCount: overdueMap.get(e.id) ?? 0,
      },
    }));

    return NextResponse.json({ success: true, data: withWorkload });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    if (message === 'Forbidden') {
      return NextResponse.json({ success: false, error: 'Nur Inhaber können Mitarbeiter verwalten' }, { status: 403 });
    }
    console.error('Error fetching employees:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Laden der Mitarbeiter' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { companyId } = await requireOwner();

    const body = await request.json();
    const validated = employeeCreateSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
      select: { id: true },
    });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Diese E-Mail-Adresse wird bereits verwendet' },
        { status: 409 }
      );
    }

    const tempPassword = randomBytes(9).toString('base64url').slice(0, 12);
    const passwordHash = await hashPassword(tempPassword);

    const employee = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        phone: validated.phone || null,
        passwordHash,
        companyId,
        role: 'TECHNICIAN',
        mustChangePassword: true,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { ...employee, tempPassword },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validierungsfehler', details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    if (message === 'Forbidden') {
      return NextResponse.json({ success: false, error: 'Nur Inhaber können Mitarbeiter anlegen' }, { status: 403 });
    }
    console.error('Error creating employee:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Anlegen des Mitarbeiters' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run tests, verify passes**

Run: `npx vitest run src/app/api/employees/__tests__/route.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/employees/route.ts src/app/api/employees/__tests__/route.test.ts
git commit -m "feat(api): add workload aggregate to GET /api/employees"
```

---

## Task 3: Update `useEmployees` hook types

**Files:**
- Modify: `src/hooks/useEmployees.ts`

- [ ] **Step 1: Extend the Employee type**

```ts
// src/hooks/useEmployees.ts — top of file (only the Employee interface is changed; rest of file stays)
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface EmployeeWorkload {
  assignedSystemsCount: number;
  overdueSystemsCount: number;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'OWNER' | 'TECHNICIAN';
  isActive: boolean;
  deactivatedAt: string | null;
  createdAt: string;
  workload: EmployeeWorkload;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  phone?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function fetchEmployees(): Promise<Employee[]> {
  const res = await fetch('/api/employees');
  const result: ApiResponse<Employee[]> = await res.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Fehler beim Laden der Mitarbeiter');
  }
  return result.data;
}

export function useEmployees(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEmployeeInput) => {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const result: ApiResponse<Employee & { tempPassword: string }> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Anlegen des Mitarbeiters');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useToggleEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      const result: ApiResponse<Employee> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Aktualisieren');
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['customer-systems'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (no type errors in `useEmployees.ts`).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useEmployees.ts
git commit -m "feat(hooks): add workload type + broader invalidation on toggle"
```

---

## Task 4: Zod schemas + TS types for employee detail response

**Files:**
- Modify: `src/lib/validations.ts`

- [ ] **Step 1: Add `assigneeFilterSchema` and types below `employeeCreateSchema`**

Append to `src/lib/validations.ts` (just before the `HELPER FUNCTIONS` section):

```ts
// ============================================================================
// ASSIGNMENT / WORKLOAD SCHEMAS
// ============================================================================

/**
 * Query-param filter for /api/customer-systems?assignee=...
 * - 'all' or missing: no filter
 * - 'unassigned': assignedToUserId is null
 * - <uuid>: assignedToUserId equals that user id
 */
export const assigneeFilterSchema = z.union([
  z.literal('all'),
  z.literal('unassigned'),
  z.string().uuid(),
]);

export type AssigneeFilter = z.infer<typeof assigneeFilterSchema>;
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/validations.ts
git commit -m "feat(validations): add assigneeFilterSchema for systems list filter"
```

---

## Task 5: Implement `GET /api/employees/[id]` — detail endpoint

**Files:**
- Modify: `src/app/api/employees/[id]/route.ts`
- Modify: `src/app/api/employees/__tests__/route.test.ts` (add detail tests)

- [ ] **Step 1: Add detail tests at the bottom of the existing test file**

Append to `src/app/api/employees/__tests__/route.test.ts`:

```ts
import { GET as GET_DETAIL } from '../[id]/route';

describe('GET /api/employees/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 for non-OWNER', async () => {
    vi.mocked(requireOwner).mockRejectedValue(new Error('Forbidden'));
    const res = await GET_DETAIL(new Request('http://x/api/employees/u1') as never, {
      params: Promise.resolve({ id: 'u1' }),
    });
    expect(res.status).toBe(403);
  });

  it('returns 404 when employee not found in company', async () => {
    vi.mocked(requireOwner).mockResolvedValue({
      userId: 'owner-1', companyId: 'co-1', role: 'OWNER', email: 'o@x.de', name: 'O',
    });
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    const res = await GET_DETAIL(new Request('http://x/api/employees/u1') as never, {
      params: Promise.resolve({ id: 'u1' }),
    });
    expect(res.status).toBe(404);
  });

  it('returns detail shape with stats, grouped systems, and recent activity', async () => {
    vi.mocked(requireOwner).mockResolvedValue({
      userId: 'owner-1', companyId: 'co-1', role: 'OWNER', email: 'o@x.de', name: 'O',
    });
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: 'u1', name: 'Tech A', email: 'a@x.de', phone: '+49',
      role: 'TECHNICIAN', isActive: true, deactivatedAt: null, createdAt: new Date(),
    } as never);
    vi.mocked(prisma.customerSystem.count).mockResolvedValue(5 as never);
    vi.mocked(prisma.customerSystem.findMany).mockResolvedValue([
      {
        id: 's1', nextMaintenance: new Date(Date.now() - 86400000),
        catalog: { systemType: 'HEATING', manufacturer: 'Vaillant', name: 'ecoTEC' },
        customer: { id: 'c1', name: 'Müller', city: 'Berlin' },
        bookings: [],
      },
      {
        id: 's2', nextMaintenance: new Date(Date.now() + 86400000 * 10),
        catalog: { systemType: 'AC', manufacturer: 'Daikin', name: 'Perfera' },
        customer: { id: 'c1', name: 'Müller', city: 'Berlin' },
        bookings: [{ startTime: new Date(Date.now() + 86400000 * 2) }],
      },
    ] as never);
    vi.mocked(prisma.maintenance.count).mockResolvedValue(3 as never);
    vi.mocked(prisma.maintenance.findMany).mockResolvedValue([
      {
        id: 'm1', date: new Date(),
        system: {
          id: 's1', catalog: { manufacturer: 'Vaillant', name: 'ecoTEC' },
          customer: { id: 'c1', name: 'Müller' },
        },
      },
    ] as never);

    const res = await GET_DETAIL(new Request('http://x/api/employees/u1') as never, {
      params: Promise.resolve({ id: 'u1' }),
    });
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data.id).toBe('u1');
    expect(body.data.stats.assignedSystemsCount).toBe(5);
    expect(body.data.stats.overdueSystemsCount).toBeGreaterThanOrEqual(1);
    expect(body.data.stats.maintenancesLast30Days).toBe(3);
    expect(body.data.assignedSystems).toHaveLength(1); // one customer group
    expect(body.data.assignedSystems[0].systems).toHaveLength(2);
    expect(body.data.recentActivity).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run and verify fails**

Run: `npx vitest run src/app/api/employees/__tests__/route.test.ts`
Expected: FAIL — `GET` not exported from `../[id]/route`.

- [ ] **Step 3: Add `GET` to the route file (keeping existing `PATCH` intact)**

```ts
// src/app/api/employees/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

type SystemStatus = 'overdue' | 'due-soon' | 'ok' | 'scheduled';

function deriveStatus(nextMaintenance: Date | null, hasUpcomingBooking: boolean, now: Date): SystemStatus {
  if (hasUpcomingBooking) return 'scheduled';
  if (!nextMaintenance) return 'ok';
  const diffMs = nextMaintenance.getTime() - now.getTime();
  if (diffMs < 0) return 'overdue';
  if (diffMs <= 30 * 86400000) return 'due-soon';
  return 'ok';
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = await requireOwner();
    const { id: employeeId } = await params;

    const employee = await prisma.user.findFirst({
      where: { id: employeeId, companyId },
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        isActive: true, deactivatedAt: true, createdAt: true,
      },
    });
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Mitarbeiter nicht gefunden' }, { status: 404 });
    }

    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 86400000);
    const last30 = new Date(now.getTime() - 30 * 86400000);

    const [
      assignedSystemsCount,
      assignedSystems,
      overdueSystemsCount,
      dueSoonSystemsCount,
      maintenancesLast30Days,
      recentActivity,
    ] = await Promise.all([
      prisma.customerSystem.count({
        where: { companyId, assignedToUserId: employeeId },
      }),
      prisma.customerSystem.findMany({
        where: { companyId, assignedToUserId: employeeId },
        include: {
          catalog: { select: { systemType: true, manufacturer: true, name: true } },
          customer: { select: { id: true, name: true, city: true } },
          bookings: {
            where: { startTime: { gte: now }, status: 'CONFIRMED' },
            orderBy: { startTime: 'asc' },
            take: 1,
            select: { startTime: true },
          },
        },
        orderBy: [{ customer: { name: 'asc' } }, { nextMaintenance: 'asc' }],
      }),
      prisma.customerSystem.count({
        where: { companyId, assignedToUserId: employeeId, nextMaintenance: { lt: now } },
      }),
      prisma.customerSystem.count({
        where: {
          companyId,
          assignedToUserId: employeeId,
          nextMaintenance: { gte: now, lte: in30 },
        },
      }),
      prisma.maintenance.count({
        where: { companyId, userId: employeeId, date: { gte: last30 } },
      }),
      prisma.maintenance.findMany({
        where: { companyId, userId: employeeId },
        include: {
          system: {
            select: {
              id: true,
              catalog: { select: { manufacturer: true, name: true } },
              customer: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { date: 'desc' },
        take: 10,
      }),
    ]);

    // Group systems by customer
    const groupMap = new Map<string, {
      customer: { id: string; name: string; city: string };
      systems: Array<{
        id: string;
        label: string;
        systemType: string;
        nextMaintenance: string | null;
        status: SystemStatus;
        bookedAt: string | null;
      }>;
    }>();

    for (const s of assignedSystems) {
      const key = s.customer.id;
      if (!groupMap.has(key)) {
        groupMap.set(key, { customer: s.customer, systems: [] });
      }
      const bookedAt = s.bookings[0]?.startTime ?? null;
      groupMap.get(key)!.systems.push({
        id: s.id,
        label: `${s.catalog.manufacturer} ${s.catalog.name}`,
        systemType: s.catalog.systemType,
        nextMaintenance: s.nextMaintenance ? s.nextMaintenance.toISOString() : null,
        status: deriveStatus(s.nextMaintenance, !!bookedAt, now),
        bookedAt: bookedAt ? bookedAt.toISOString() : null,
      });
    }

    const assignedSystemsGrouped = Array.from(groupMap.values());
    const assignedCustomersCount = assignedSystemsGrouped.length;

    const detail = {
      ...employee,
      stats: {
        assignedSystemsCount,
        assignedCustomersCount,
        overdueSystemsCount,
        dueSoonSystemsCount,
        maintenancesLast30Days,
      },
      assignedSystems: assignedSystemsGrouped,
      recentActivity: recentActivity.map((m) => ({
        id: m.id,
        date: m.date.toISOString(),
        customer: m.system.customer,
        system: {
          id: m.system.id,
          label: `${m.system.catalog.manufacturer} ${m.system.catalog.name}`,
        },
      })),
    };

    return NextResponse.json({ success: true, data: detail });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    if (message === 'Forbidden') {
      return NextResponse.json({ success: false, error: 'Nur Inhaber können Mitarbeiter verwalten' }, { status: 403 });
    }
    console.error('Error fetching employee detail:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Laden des Mitarbeiters' }, { status: 500 });
  }
}

/**
 * PATCH /api/employees/[id]
 * Deactivate or reactivate a technician (OWNER only).
 * On deactivation: transactionally reassigns all assigned systems to the OWNER.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, companyId } = await requireOwner();
    const { id: employeeId } = await params;

    if (employeeId === userId) {
      return NextResponse.json(
        { success: false, error: 'Sie können sich nicht selbst deaktivieren' },
        { status: 400 }
      );
    }

    const employee = await prisma.user.findFirst({
      where: { id: employeeId, companyId },
      select: { id: true, role: true, isActive: true },
    });
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Mitarbeiter nicht gefunden' }, { status: 404 });
    }
    if (employee.role === 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Inhaber können nicht deaktiviert werden' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { isActive } = body as { isActive?: boolean };

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isActive muss ein Boolean sein' },
        { status: 400 }
      );
    }

    // Deactivation path: atomic update + reassign + session invalidation
    if (isActive === false) {
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
          where: { id: employeeId },
          data: { isActive: false, deactivatedAt: new Date() },
          select: {
            id: true, name: true, email: true, phone: true, role: true,
            isActive: true, deactivatedAt: true, createdAt: true,
          },
        });
        const reassign = await tx.customerSystem.updateMany({
          where: { companyId, assignedToUserId: employeeId },
          data: { assignedToUserId: userId },
        });
        await tx.session.deleteMany({ where: { userId: employeeId } });
        return { updated, reassignedCount: reassign.count };
      });

      return NextResponse.json({
        success: true,
        data: { ...result.updated, reassignedCount: result.reassignedCount },
      });
    }

    // Reactivation path: simple update
    const updated = await prisma.user.update({
      where: { id: employeeId },
      data: { isActive: true, deactivatedAt: null },
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        isActive: true, deactivatedAt: true, createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    if (message === 'Forbidden') {
      return NextResponse.json({ success: false, error: 'Nur Inhaber können Mitarbeiter verwalten' }, { status: 403 });
    }
    console.error('Error updating employee:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Aktualisieren des Mitarbeiters' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run tests, verify passes**

Run: `npx vitest run src/app/api/employees/__tests__/route.test.ts`
Expected: PASS (5 tests total across file).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/employees/[id]/route.ts src/app/api/employees/__tests__/route.test.ts
git commit -m "feat(api): add GET /api/employees/[id] detail + auto-reassign on deactivation"
```

---

## Task 6: `useEmployee(id)` + `useBulkReassignSystems` hooks

**Files:**
- Modify: `src/hooks/useEmployees.ts`

- [ ] **Step 1: Append the new hooks + detail types at the bottom of `src/hooks/useEmployees.ts`**

```ts
// Append to src/hooks/useEmployees.ts

import { toast } from 'sonner';

export type SystemStatus = 'overdue' | 'due-soon' | 'ok' | 'scheduled';

export interface EmployeeDetailStats {
  assignedSystemsCount: number;
  assignedCustomersCount: number;
  overdueSystemsCount: number;
  dueSoonSystemsCount: number;
  maintenancesLast30Days: number;
}

export interface AssignedSystemRow {
  id: string;
  label: string;
  systemType: string;
  nextMaintenance: string | null;
  status: SystemStatus;
  bookedAt: string | null;
}

export interface AssignedSystemGrouped {
  customer: { id: string; name: string; city: string };
  systems: AssignedSystemRow[];
}

export interface RecentMaintenanceRow {
  id: string;
  date: string;
  customer: { id: string; name: string };
  system: { id: string; label: string };
}

export interface EmployeeDetail extends Employee {
  stats: EmployeeDetailStats;
  assignedSystems: AssignedSystemGrouped[];
  recentActivity: RecentMaintenanceRow[];
}

export function useEmployee(id: string | null) {
  return useQuery<EmployeeDetail>({
    queryKey: ['employee', id],
    queryFn: async () => {
      if (!id) throw new Error('Keine Mitarbeiter-ID');
      const res = await fetch(`/api/employees/${id}`);
      const result: ApiResponse<EmployeeDetail> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden des Mitarbeiters');
      }
      return result.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export interface BulkReassignInput {
  systemIds: string[];
  assignedToUserId: string | null;
}

export interface BulkReassignResult {
  succeeded: string[];
  failed: Array<{ systemId: string; error: string }>;
}

export function useBulkReassignSystems() {
  const queryClient = useQueryClient();

  return useMutation<BulkReassignResult, Error, BulkReassignInput>({
    mutationFn: async ({ systemIds, assignedToUserId }) => {
      const results = await Promise.allSettled(
        systemIds.map(async (id) => {
          const res = await fetch(`/api/customer-systems/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignedToUserId }),
          });
          const body: ApiResponse<unknown> = await res.json();
          if (!body.success) throw new Error(body.error || 'Fehler');
          return id;
        })
      );
      const succeeded: string[] = [];
      const failed: Array<{ systemId: string; error: string }> = [];
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') succeeded.push(r.value);
        else failed.push({ systemId: systemIds[i]!, error: (r.reason as Error).message });
      });
      return { succeeded, failed };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee'] });
      queryClient.invalidateQueries({ queryKey: ['customer-systems'] });
      queryClient.invalidateQueries({ queryKey: ['customer-system'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      if (result.failed.length === 0) {
        toast.success(`${result.succeeded.length} System(e) neu zugewiesen`);
      } else if (result.succeeded.length === 0) {
        toast.error(`${result.failed.length} System(e) konnten nicht zugewiesen werden`);
      } else {
        toast.warning(
          `${result.succeeded.length} zugewiesen, ${result.failed.length} fehlgeschlagen`
        );
      }
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useEmployees.ts
git commit -m "feat(hooks): add useEmployee(id) detail hook + useBulkReassignSystems"
```

---

## Task 7: Extend `GET /api/customer-systems` with `assignee` filter

**Files:**
- Modify: `src/app/api/customer-systems/route.ts`
- Create: `src/app/api/customer-systems/__tests__/filter.test.ts`

- [ ] **Step 1: Write the failing test for filter behavior**

```ts
// src/app/api/customer-systems/__tests__/filter.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth-helpers', () => ({
  requireAuth: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    customerSystem: { findMany: vi.fn() },
    customer: { findUnique: vi.fn() },
  },
}));

import { GET } from '../route';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

function makeRequest(qs: string): Request {
  return new Request(`http://x/api/customer-systems${qs}`);
}

describe('GET /api/customer-systems — assignee filter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue({
      userId: 'owner-1', companyId: 'co-1', role: 'OWNER', email: 'o@x.de', name: 'O',
    });
    vi.mocked(prisma.customerSystem.findMany).mockResolvedValue([] as never);
  });

  it('applies assignedToUserId: null when assignee=unassigned', async () => {
    await GET(makeRequest('?assignee=unassigned') as never);
    const args = vi.mocked(prisma.customerSystem.findMany).mock.calls[0]![0] as {
      where: { assignedToUserId?: unknown };
    };
    expect(args.where.assignedToUserId).toBeNull();
  });

  it('applies assignedToUserId: <id> when assignee is a uuid', async () => {
    await GET(makeRequest('?assignee=11111111-1111-1111-1111-111111111111') as never);
    const args = vi.mocked(prisma.customerSystem.findMany).mock.calls[0]![0] as {
      where: { assignedToUserId?: unknown };
    };
    expect(args.where.assignedToUserId).toBe('11111111-1111-1111-1111-111111111111');
  });

  it('does not filter when assignee=all', async () => {
    await GET(makeRequest('?assignee=all') as never);
    const args = vi.mocked(prisma.customerSystem.findMany).mock.calls[0]![0] as {
      where: { assignedToUserId?: unknown };
    };
    expect(args.where.assignedToUserId).toBeUndefined();
  });

  it('rejects invalid assignee value with 400', async () => {
    const res = await GET(makeRequest('?assignee=garbage') as never);
    expect(res.status).toBe(400);
  });

  it('TECHNICIAN role always filters by own userId regardless of assignee param', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      userId: 'tech-1', companyId: 'co-1', role: 'TECHNICIAN', email: 't@x.de', name: 'T',
    });
    await GET(makeRequest('?assignee=unassigned') as never);
    const args = vi.mocked(prisma.customerSystem.findMany).mock.calls[0]![0] as {
      where: { assignedToUserId?: unknown };
    };
    expect(args.where.assignedToUserId).toBe('tech-1');
  });
});
```

- [ ] **Step 2: Run and verify fails**

Run: `npx vitest run src/app/api/customer-systems/__tests__/filter.test.ts`
Expected: FAIL — assignee param is currently ignored.

- [ ] **Step 3: Implement — update the GET handler in `src/app/api/customer-systems/route.ts`**

Replace the GET function body (keep imports and POST intact; add the import for `assigneeFilterSchema`):

```ts
// src/app/api/customer-systems/route.ts — replace GET export
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { customerSystemCreateSchema, assigneeFilterSchema } from '@/lib/validations';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const { userId, companyId, role } = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const search = searchParams.get('search') || '';
    const assigneeRaw = searchParams.get('assignee');

    let assigneeFilter: Prisma.CustomerSystemWhereInput = {};
    if (role === 'TECHNICIAN') {
      assigneeFilter = { assignedToUserId: userId };
    } else if (assigneeRaw) {
      const parsed = assigneeFilterSchema.safeParse(assigneeRaw);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Ungültiger Filterwert' },
          { status: 400 }
        );
      }
      if (parsed.data === 'unassigned') {
        assigneeFilter = { assignedToUserId: null };
      } else if (parsed.data !== 'all') {
        assigneeFilter = { assignedToUserId: parsed.data };
      }
    }

    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId, companyId },
      });
      if (!customer) {
        return NextResponse.json({ success: false, error: 'Kunde nicht gefunden' }, { status: 404 });
      }
    }

    const where: Prisma.CustomerSystemWhereInput = {
      companyId,
      ...assigneeFilter,
      ...(customerId && { customerId }),
      ...(search && {
        OR: [
          { serialNumber: { contains: search, mode: 'insensitive' } },
          { catalog: { name: { contains: search, mode: 'insensitive' } } },
          { catalog: { manufacturer: { contains: search, mode: 'insensitive' } } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
          { customer: { city: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const now = new Date();
    const systems = await prisma.customerSystem.findMany({
      where,
      include: {
        catalog: true,
        customer: {
          select: { id: true, name: true, street: true, city: true, phone: true },
        },
        assignedTo: { select: { id: true, name: true } },
        _count: { select: { maintenances: true, followUpJobs: { where: { completed: false } } } },
        maintenances: customerId
          ? { orderBy: { date: 'desc' }, take: 5 }
          : false,
        bookings: {
          where: { startTime: { gte: now }, status: 'CONFIRMED' },
          orderBy: { startTime: 'asc' },
          take: 1,
          select: { id: true, startTime: true, endTime: true, calBookingUid: true },
        },
      },
      orderBy: [{ nextMaintenance: 'asc' }, { customer: { name: 'asc' } }],
    });

    return NextResponse.json({ success: true, data: systems });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error fetching customer systems:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Laden der Systeme' }, { status: 500 });
  }
}
```

Leave `POST` untouched.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/app/api/customer-systems/__tests__/filter.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Update `useCustomerSystems` to accept `assignee`**

Replace the hook body in `src/hooks/useCustomerSystems.ts` (the `useCustomerSystems` export only):

```ts
export function useCustomerSystems(params?: { customerId?: string; search?: string; assignee?: string }) {
  return useQuery<CustomerSystem[]>({
    queryKey: ['customer-systems', params],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params?.customerId) sp.set('customerId', params.customerId);
      if (params?.search) sp.set('search', params.search);
      if (params?.assignee) sp.set('assignee', params.assignee);
      const url = `/api/customer-systems${sp.toString() ? `?${sp}` : ''}`;
      const res = await fetch(url);
      const result: ApiResponse<CustomerSystem[]> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden der Systeme');
      }
      return result.data;
    },
    staleTime: 30_000,
  });
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/customer-systems/route.ts src/app/api/customer-systems/__tests__/filter.test.ts src/hooks/useCustomerSystems.ts
git commit -m "feat(api): add assignee filter to GET /api/customer-systems"
```

---

## Task 8: AssigneeBadge on `/dashboard/systems` list cards

**Files:**
- Modify: `src/app/dashboard/systems/page.tsx`

- [ ] **Step 1: Add the import and render the badge on each card**

At the top of `src/app/dashboard/systems/page.tsx`, add:

```tsx
import { AssigneeBadge } from '@/components/AssigneeBadge';
import { useSession } from 'next-auth/react';
```

Inside the card mapping, add the badge directly before the UrgencyBadge/TerminiertBadge cluster. Replace the badge block that currently reads:

```tsx
<div className="flex items-center gap-2 shrink-0 ml-2">
  {nextBooking
    ? <TerminiertBadge />
    : system.nextMaintenance && <UrgencyBadge urgency={urgency} />
  }
  <ChevronRightIcon className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
</div>
```

with:

```tsx
<div className="flex items-center gap-2 shrink-0 ml-2">
  {isOwner && (
    <AssigneeBadge
      user={system.assignedTo ?? null}
      size="sm"
      showName={false}
    />
  )}
  {nextBooking
    ? <TerminiertBadge />
    : system.nextMaintenance && <UrgencyBadge urgency={urgency} />
  }
  <ChevronRightIcon className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
</div>
```

At the top of the `SystemsPage` component (right after `useState` for `searchQuery`), add:

```tsx
const { data: session } = useSession();
const isOwner = session?.user?.role === 'OWNER';
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/systems/page.tsx
git commit -m "feat(ui): show AssigneeBadge on systems list cards (OWNER only)"
```

---

## Task 9: AssigneeBadge on customer-detail system cards

**Files:**
- Modify: `src/app/dashboard/customers/[id]/page.tsx`

- [ ] **Step 1: Read the file to locate the system card block**

Run: `Read src/app/dashboard/customers/[id]/page.tsx` — locate the JSX block that renders a customer's systems (typically `system.catalog.manufacturer` + status badges).

- [ ] **Step 2: Add import and badge**

At the top of the file, alongside existing imports, add:

```tsx
import { AssigneeBadge } from '@/components/AssigneeBadge';
import { useSession } from 'next-auth/react';
```

Inside the component body, after existing hooks, add:

```tsx
const { data: session } = useSession();
const isOwner = session?.user?.role === 'OWNER';
```

Inside the per-system card's header row (the same row as the status badge / chevron), insert — immediately before the status badge — :

```tsx
{isOwner && (
  <AssigneeBadge user={system.assignedTo ?? null} size="sm" showName={false} />
)}
```

If the current JSX wraps the status cluster inside a `<div className="flex items-center gap-2">`, add the `AssigneeBadge` as the first child of that div.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/customers/[id]/page.tsx
git commit -m "feat(ui): show AssigneeBadge on customer-detail system cards"
```

---

## Task 10: Mitarbeiter list — row click → detail, workload column

**Files:**
- Modify: `src/app/dashboard/employees/page.tsx`

- [ ] **Step 1: Replace the `EmployeeCard` render + make rows clickable**

Change `EmployeeCard` to wrap the card contents in a `<div>` with an `onClick` navigating to `/dashboard/employees/[id]`, and add stopPropagation on the deactivate button. Also inject the workload block below the email.

Replace the entire `EmployeeCard` function in `src/app/dashboard/employees/page.tsx` with:

```tsx
function EmployeeCard({
  employee,
  isCurrentUser,
  onToggle,
  isToggling,
}: {
  employee: Employee;
  isCurrentUser: boolean;
  onToggle: (emp: Employee) => void;
  isToggling: boolean;
}) {
  const router = useRouter();
  const isOwner = employee.role === 'OWNER';
  const roleLabel = isOwner ? 'Inhaber' : 'Techniker';
  const assignedCount = employee.workload?.assignedSystemsCount ?? 0;
  const overdueCount = employee.workload?.overdueSystemsCount ?? 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/dashboard/employees/${employee.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(`/dashboard/employees/${employee.id}`);
        }
      }}
      className={`flex items-center gap-4 p-4 rounded-lg border bg-card cursor-pointer hover:shadow-sm hover:border-brand-200 transition-all ${!employee.isActive ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
        {isOwner ? (
          <ShieldIcon className="h-5 w-5 text-primary" />
        ) : (
          <UserIcon className="h-5 w-5 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{employee.name}</p>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            {roleLabel}
          </span>
          {isCurrentUser && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              Sie
            </span>
          )}
          {!employee.isActive && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
              Deaktiviert
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{employee.email}</p>
        {!isOwner && employee.isActive && (
          <p className="text-xs mt-1">
            <span className="text-muted-foreground">{assignedCount} Systeme · </span>
            {overdueCount > 0 ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-status-overdue-bg text-status-overdue-text border border-status-overdue-border">
                {overdueCount} überfällig
              </span>
            ) : (
              <span className="text-muted-foreground">0 überfällig</span>
            )}
          </p>
        )}
      </div>
      {!isOwner && !isCurrentUser && (
        <Button
          variant={employee.isActive ? 'outline' : 'default'}
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(employee);
          }}
          disabled={isToggling}
        >
          {isToggling ? (
            <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
          ) : employee.isActive ? (
            <>
              <XCircleIcon className="h-3.5 w-3.5 mr-1.5" />
              Deaktivieren
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-3.5 w-3.5 mr-1.5" />
              Aktivieren
            </>
          )}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/employees/page.tsx
git commit -m "feat(ui): employees list rows clickable + workload column with overdue pill"
```

---

## Task 11: Scaffold `/dashboard/employees/[id]` detail page with role gate

**Files:**
- Create: `src/app/dashboard/employees/[id]/page.tsx`

- [ ] **Step 1: Create the page shell with role gate**

```tsx
// src/app/dashboard/employees/[id]/page.tsx
'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Loader2Icon,
  ChevronLeftIcon,
  UserIcon,
  ShieldIcon,
  XCircleIcon,
  CheckCircleIcon,
  MailIcon,
  PhoneIcon,
  AlertTriangleIcon,
  CalendarIcon,
  UsersIcon,
  WrenchIcon,
  ClipboardCheckIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useEmployee, useEmployees, useToggleEmployee, useBulkReassignSystems } from '@/hooks/useEmployees';
import type { EmployeeDetail, AssignedSystemRow } from '@/hooks/useEmployees';

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();
  const { data: employee, isLoading, error } = useEmployee(id);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === 'authenticated' && session?.user?.role !== 'OWNER') {
    router.replace('/dashboard');
    return null;
  }

  if (error) {
    return <div className="text-center py-20 text-destructive">Fehler beim Laden des Mitarbeiters</div>;
  }
  if (!employee) {
    return <div className="text-center py-20 text-muted-foreground">Mitarbeiter nicht gefunden</div>;
  }

  return (
    <EmployeeDetailView employee={employee} currentUserId={session?.user?.id ?? ''} />
  );
}

function EmployeeDetailView({ employee, currentUserId }: { employee: EmployeeDetail; currentUserId: string }) {
  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/employees"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Mitarbeiter
      </Link>
      <EmployeeHeaderCard employee={employee} currentUserId={currentUserId} />
      <EmployeeStatsGrid stats={employee.stats} />
      <AssignedSystemsSection employee={employee} />
      <RecentActivitySection activity={employee.recentActivity} />
    </div>
  );
}

// Placeholder subcomponents — filled in subsequent tasks
function EmployeeHeaderCard(_: { employee: EmployeeDetail; currentUserId: string }) { return null; }
function EmployeeStatsGrid(_: { stats: EmployeeDetail['stats'] }) { return null; }
function AssignedSystemsSection(_: { employee: EmployeeDetail }) { return null; }
function RecentActivitySection(_: { activity: EmployeeDetail['recentActivity'] }) { return null; }
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/employees/[id]/page.tsx
git commit -m "feat(ui): scaffold /dashboard/employees/[id] with role gate"
```

---

## Task 12: Build the Header card (name, badges, deactivate button)

**Files:**
- Modify: `src/app/dashboard/employees/[id]/page.tsx`

- [ ] **Step 1: Replace the `EmployeeHeaderCard` placeholder**

Replace the placeholder `EmployeeHeaderCard` in `src/app/dashboard/employees/[id]/page.tsx` with:

```tsx
function EmployeeHeaderCard({ employee, currentUserId }: { employee: EmployeeDetail; currentUserId: string }) {
  const toggleMutation = useToggleEmployee();
  const isOwner = employee.role === 'OWNER';
  const isSelf = employee.id === currentUserId;
  const initials = (() => {
    const parts = employee.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0]![0]!.toUpperCase();
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  })();

  return (
    <div className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/15 text-primary font-bold text-lg shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-bold truncate">{employee.name}</h1>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            {isOwner ? <ShieldIcon className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
            {isOwner ? 'Inhaber' : 'Techniker'}
          </span>
          {!employee.isActive && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
              Deaktiviert{employee.deactivatedAt ? ` seit ${format(new Date(employee.deactivatedAt), 'dd. MMM yyyy', { locale: de })}` : ''}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><MailIcon className="h-3.5 w-3.5" />{employee.email}</span>
          {employee.phone && (
            <a href={`tel:${employee.phone}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
              <PhoneIcon className="h-3.5 w-3.5" />{employee.phone}
            </a>
          )}
        </div>
      </div>
      {!isOwner && !isSelf && (
        <Button
          variant={employee.isActive ? 'outline' : 'default'}
          size="sm"
          onClick={() => toggleMutation.mutate({ id: employee.id, isActive: !employee.isActive })}
          disabled={toggleMutation.isPending}
        >
          {toggleMutation.isPending ? (
            <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
          ) : employee.isActive ? (
            <><XCircleIcon className="h-3.5 w-3.5 mr-1.5" />Deaktivieren</>
          ) : (
            <><CheckCircleIcon className="h-3.5 w-3.5 mr-1.5" />Aktivieren</>
          )}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/employees/[id]/page.tsx
git commit -m "feat(ui): employee detail header card (avatar, badges, deactivate button)"
```

---

## Task 13: Build the Stats grid (4 tiles + secondary row)

**Files:**
- Modify: `src/app/dashboard/employees/[id]/page.tsx`

- [ ] **Step 1: Replace the `EmployeeStatsGrid` placeholder**

```tsx
function EmployeeStatsGrid({ stats }: { stats: EmployeeDetail['stats'] }) {
  const tiles: Array<{ label: string; value: number; Icon: React.ElementType; tone?: 'overdue' | 'neutral' }> = [
    { label: 'Kunden', value: stats.assignedCustomersCount, Icon: UsersIcon, tone: 'neutral' },
    { label: 'Systeme', value: stats.assignedSystemsCount, Icon: WrenchIcon, tone: 'neutral' },
    { label: 'Überfällig', value: stats.overdueSystemsCount, Icon: AlertTriangleIcon, tone: 'overdue' },
    { label: 'In 30 Tagen', value: stats.dueSoonSystemsCount, Icon: CalendarIcon, tone: 'neutral' },
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map(({ label, value, Icon, tone }) => {
          const isOverdueTone = tone === 'overdue' && value > 0;
          return (
            <div
              key={label}
              className={`bg-card rounded-xl border p-5 ${isOverdueTone ? 'border-status-overdue-border bg-status-overdue-bg' : 'border-border'}`}
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted mb-3">
                <Icon className={`h-4 w-4 ${isOverdueTone ? 'text-status-overdue-text' : 'text-muted-foreground'}`} />
              </div>
              <p className={`text-2xl font-bold ${isOverdueTone ? 'text-status-overdue-text' : 'text-foreground'}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ClipboardCheckIcon className="h-4 w-4" />
        <span>
          Wartungen durchgeführt (30 Tage): <strong className="text-foreground">{stats.maintenancesLast30Days}</strong>
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/employees/[id]/page.tsx
git commit -m "feat(ui): employee detail stats grid (4 tiles + wartungen-30d row)"
```

---

## Task 14: Build grouped assigned systems list with per-row status + row-select

**Files:**
- Modify: `src/app/dashboard/employees/[id]/page.tsx`

- [ ] **Step 1: Replace the `AssignedSystemsSection` placeholder**

```tsx
function AssignedSystemsSection({ employee }: { employee: EmployeeDetail }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reassignOpen, setReassignOpen] = useState<{ systemIds: string[] } | null>(null);

  const totalSystems = employee.assignedSystems.reduce((n, g) => n + g.systems.length, 0);
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (employee.assignedSystems.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">Noch keine Kunden zugewiesen.</p>
        <Link
          href="/dashboard/systems?assignee=unassigned"
          className="mt-2 inline-block text-sm text-primary hover:underline"
        >
          Nicht zugewiesene Systeme anzeigen →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2 className="text-base font-semibold">Zugewiesene Systeme ({totalSystems})</h2>
      </div>
      <div className="p-4 space-y-5">
        {employee.assignedSystems.map((group) => (
          <div key={group.customer.id}>
            <div className="flex items-center justify-between mb-2 px-1">
              <Link
                href={`/dashboard/customers/${group.customer.id}`}
                className="text-sm font-semibold hover:underline"
              >
                {group.customer.name}
              </Link>
              <span className="text-xs text-muted-foreground">
                {group.customer.city} · {group.systems.length} {group.systems.length === 1 ? 'System' : 'Systeme'}
              </span>
            </div>
            <div className="space-y-1.5">
              {group.systems.map((s) => (
                <AssignedSystemRowItem
                  key={s.id}
                  row={s}
                  selected={selectedIds.has(s.id)}
                  onToggle={() => toggleSelect(s.id)}
                  onReassign={() => setReassignOpen({ systemIds: [s.id] })}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      {selectedIds.size > 0 && (
        <div className="sticky bottom-0 flex items-center justify-between gap-3 px-6 py-3 border-t border-border bg-card/95 backdrop-blur rounded-b-xl">
          <span className="text-sm">{selectedIds.size} ausgewählt</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
              Abbrechen
            </Button>
            <Button size="sm" onClick={() => setReassignOpen({ systemIds: Array.from(selectedIds) })}>
              Zuweisen an …
            </Button>
          </div>
        </div>
      )}
      {reassignOpen && (
        <ReassignModal
          systemIds={reassignOpen.systemIds}
          currentAssigneeId={employee.id}
          onClose={() => {
            setReassignOpen(null);
            setSelectedIds(new Set());
          }}
        />
      )}
    </div>
  );
}

function AssignedSystemRowItem({
  row,
  selected,
  onToggle,
  onReassign,
}: {
  row: AssignedSystemRow;
  selected: boolean;
  onToggle: () => void;
  onReassign: () => void;
}) {
  const statusStyles: Record<AssignedSystemRow['status'], string> = {
    overdue: 'bg-status-overdue-bg text-status-overdue-text border-status-overdue-border',
    'due-soon': 'bg-status-due-bg text-status-due-text border-status-due-border',
    ok: 'bg-muted text-muted-foreground border-border',
    scheduled: 'bg-status-ok-bg text-status-ok-text border-status-ok-border',
  };
  const statusLabels: Record<AssignedSystemRow['status'], string> = {
    overdue: 'Überfällig',
    'due-soon': 'Bald fällig',
    ok: 'OK',
    scheduled: 'Terminiert',
  };
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:shadow-sm transition-all">
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="h-4 w-4 rounded border-input"
        aria-label="System auswählen"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/systems/${row.id}`} className="text-sm font-medium hover:underline truncate">
            {row.label}
          </Link>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${statusStyles[row.status]}`}>
            {statusLabels[row.status]}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {row.bookedAt
            ? `Termin: ${format(new Date(row.bookedAt), 'dd. MMM yyyy, HH:mm', { locale: de })} Uhr`
            : row.nextMaintenance
              ? `Nächste Wartung: ${format(new Date(row.nextMaintenance), 'dd. MMM yyyy', { locale: de })}`
              : 'Keine Wartung geplant'}
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={onReassign}>
        Zuweisung ändern
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck (ReassignModal still missing — expect error)**

Run: `npx tsc --noEmit`
Expected: FAIL — `ReassignModal` is not defined. Proceed to next task.

- [ ] **Step 3: Commit the partial progress after implementing ReassignModal in the next task (commit in Task 15)**

(No commit yet — next task fixes the reference.)

---

## Task 15: Build the Reassign modal

**Files:**
- Modify: `src/app/dashboard/employees/[id]/page.tsx`

- [ ] **Step 1: Append the `ReassignModal` component to the same file**

```tsx
function ReassignModal({
  systemIds,
  currentAssigneeId,
  onClose,
}: {
  systemIds: string[];
  currentAssigneeId: string;
  onClose: () => void;
}) {
  const { data: employees = [] } = useEmployees();
  const bulkReassign = useBulkReassignSystems();
  const [target, setTarget] = useState<string>(''); // '' = none selected, 'unassigned' = null

  const eligible = employees
    .filter((e) => e.isActive && e.id !== currentAssigneeId)
    .sort((a, b) => {
      if (a.role === 'OWNER' && b.role !== 'OWNER') return -1;
      if (b.role === 'OWNER' && a.role !== 'OWNER') return 1;
      return a.name.localeCompare(b.name);
    });

  const handleConfirm = async () => {
    if (!target) return;
    const assignedToUserId = target === 'unassigned' ? null : target;
    await bulkReassign.mutateAsync({ systemIds, assignedToUserId });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-xl border shadow-lg p-6 w-full max-w-md mx-4 space-y-4">
        <h3 className="text-lg font-semibold">
          {systemIds.length === 1 ? 'System neu zuweisen' : `${systemIds.length} Systeme neu zuweisen`}
        </h3>
        <div>
          <label htmlFor="reassign-target" className="block text-sm font-medium mb-1.5">
            Zuweisen an
          </label>
          <select
            id="reassign-target"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-10"
          >
            <option value="">Bitte auswählen …</option>
            <option value="unassigned">Nicht zugewiesen</option>
            {eligible.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}{e.role === 'OWNER' ? ' (Inhaber)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={bulkReassign.isPending}
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={handleConfirm}
            disabled={!target || bulkReassign.isPending}
          >
            {bulkReassign.isPending ? (
              <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Zuweisen
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/employees/[id]/page.tsx
git commit -m "feat(ui): employee detail grouped assigned systems + reassign modal"
```

---

## Task 16: Build the Recent activity section

**Files:**
- Modify: `src/app/dashboard/employees/[id]/page.tsx`

- [ ] **Step 1: Replace the `RecentActivitySection` placeholder**

```tsx
function RecentActivitySection({ activity }: { activity: EmployeeDetail['recentActivity'] }) {
  if (activity.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">Keine Wartungen in den letzten 30 Tagen.</p>
      </div>
    );
  }
  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-base font-semibold">Letzte Aktivität</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Die letzten 10 Wartungen dieses Mitarbeiters</p>
      </div>
      <div className="p-4 space-y-1">
        {activity.map((m) => (
          <Link
            key={m.id}
            href={`/dashboard/systems/${m.system.id}`}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-50 shrink-0">
              <WrenchIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{m.customer.name}</p>
              <p className="text-xs text-muted-foreground truncate">{m.system.label}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-medium text-foreground">
                {format(new Date(m.date), 'dd. MMM', { locale: de })}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(m.date), 'yyyy', { locale: de })}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Smoke-test the page manually**

Run: `npm run dev` and open `http://localhost:3000/dashboard/employees/<valid-id>` as an OWNER. Verify header, stats, grouped systems, reassign modal, recent activity all render.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/employees/[id]/page.tsx
git commit -m "feat(ui): employee detail recent-activity section"
```

---

## Task 17: Add Zuweisung filter to `/dashboard/systems` (URL-driven)

**Files:**
- Modify: `src/app/dashboard/systems/page.tsx`

- [ ] **Step 1: Replace the component to read/write `?assignee=` and render a dropdown**

Replace the top of `SystemsPage` (imports + component body up to the `return`) with:

```tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Loader2Icon,
  WrenchIcon,
  SearchIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  ChevronRightIcon,
  FlameIcon,
  WindIcon,
  DropletIcon,
  BatteryIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useCustomerSystems } from '@/hooks/useCustomerSystems';
import { useEmployees } from '@/hooks/useEmployees';
import type { SystemType } from '@/hooks/useCatalog';
import { AssigneeBadge } from '@/components/AssigneeBadge';

// ... keep SYSTEM_TYPE_ICONS, getMaintenanceUrgency, UrgencyBadge, TerminiertBadge unchanged ...

export default function SystemsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isOwner = session?.user?.role === 'OWNER';

  const assigneeParam = searchParams.get('assignee') ?? 'all';
  const [searchQuery, setSearchQuery] = useState('');
  const { data: systems = [], isLoading, error } = useCustomerSystems({
    search: searchQuery,
    assignee: isOwner ? assigneeParam : undefined,
  });
  const { data: employees = [] } = useEmployees({ enabled: isOwner });

  const setAssignee = (value: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    if (value === 'all') sp.delete('assignee'); else sp.set('assignee', value);
    router.replace(`/dashboard/systems${sp.toString() ? `?${sp}` : ''}`);
  };

  // Normalise invalid URL value on load
  useEffect(() => {
    if (!isOwner) return;
    if (assigneeParam === 'all' || assigneeParam === 'unassigned') return;
    const isValid = employees.some((e) => e.id === assigneeParam);
    if (employees.length > 0 && !isValid) setAssignee('all');
     
  }, [isOwner, assigneeParam, employees]);

  // ... rest of the component body follows (kept from existing file) ...
```

- [ ] **Step 2: Render the dropdown**

Inside the JSX, immediately above the search input (the `<div className="relative">` block containing `SearchIcon`), add:

```tsx
{isOwner && (
  <div className="flex items-center gap-2">
    <label htmlFor="assignee-filter" className="text-sm text-muted-foreground shrink-0">
      Zuweisung:
    </label>
    <select
      id="assignee-filter"
      value={assigneeParam}
      onChange={(e) => setAssignee(e.target.value)}
      className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring h-10"
    >
      <option value="all">Alle</option>
      <option value="unassigned">Nicht zugewiesen</option>
      {employees
        .filter((e) => e.isActive)
        .map((e) => (
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
    </select>
  </div>
)}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/systems/page.tsx
git commit -m "feat(ui): URL-driven Zuweisung filter on /dashboard/systems"
```

---

## Task 18: Dashboard — replace warning block with "Nicht zugewiesen" tile

**Files:**
- Modify: `src/app/api/dashboard/stats/route.ts`
- Modify: `src/hooks/useDashboard.ts`
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Replace `unassignedAfterDeactivation` with `unassignedSystemsCount` in the stats route**

In `src/app/api/dashboard/stats/route.ts`, replace the OWNER-only block (the `if (isOwner) { ... }` that loads `unassignedAfterDeactivation` and the response body) with:

```ts
// After the existing Promise.all block, compute OWNER-only unassigned count
let unassignedSystemsCount = 0;
if (isOwner) {
  unassignedSystemsCount = await prisma.customerSystem.count({
    where: { companyId, assignedToUserId: null },
  });
}

return NextResponse.json({
  success: true,
  data: {
    role,
    totalCustomers,
    totalSystems,
    overdueMaintenances,
    upcomingMaintenances,
    upcomingSystemsList,
    recentMaintenances,
    unassignedSystemsCount,
  },
});
```

Remove the `unassignedAfterDeactivation` variable and the `findMany` that populated it.

- [ ] **Step 2: Update `useDashboard.ts`**

In `src/hooks/useDashboard.ts`, replace the `DashboardStats` interface:

```ts
interface DashboardStats {
  role: 'OWNER' | 'TECHNICIAN';
  totalCustomers: number;
  totalSystems: number;
  overdueMaintenances: number;
  upcomingMaintenances: number;
  upcomingSystemsList: UpcomingSystem[];
  recentMaintenances: RecentMaintenance[];
  unassignedSystemsCount: number;
}
```

Remove the now-unused `UnassignedSystem` interface.

- [ ] **Step 3: Update `src/app/dashboard/page.tsx`**

Remove the entire `{stats?.role === 'OWNER' && stats.unassignedAfterDeactivation.length > 0 && (...)}` block (the warning card).

Add a fifth tile inside the stats grid by widening the grid to `lg:grid-cols-5` (or keeping `lg:grid-cols-4` and inserting the tile as the 4th, moving "Nächste 30 Tage" to col 5). Use 5 cols:

Change:

```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
```

to:

```tsx
<div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
```

And immediately before the `<div className="bg-card rounded-xl border border-border p-5">` that shows "Nächste 30 Tage", insert:

```tsx
{stats?.role === 'OWNER' && (stats.unassignedSystemsCount ?? 0) > 0 && (
  <Link
    href="/dashboard/systems?assignee=unassigned"
    className="group bg-card rounded-xl border border-status-overdue-border bg-status-overdue-bg p-5 hover:shadow-md transition-all"
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-card">
        <UserXIcon className="h-4.5 w-4.5 text-status-overdue-text" />
      </div>
      <ArrowRightIcon className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
    <p className="text-2xl font-bold text-status-overdue-text">{stats.unassignedSystemsCount}</p>
    <p className="text-xs text-muted-foreground mt-0.5">Nicht zugewiesen</p>
  </Link>
)}
```

Remove the now-dead `useRouter` usage if it becomes unused, and drop the `UserXIcon` import if already unused elsewhere after removal — but keep it for the new tile.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/dashboard/stats/route.ts src/hooks/useDashboard.ts src/app/dashboard/page.tsx
git commit -m "feat(dashboard): replace orphaned-after-deactivation warning with Nicht-zugewiesen tile"
```

---

## Task 19: Write a vitest for auto-reassign on deactivation

**Files:**
- Modify: `src/app/api/employees/__tests__/route.test.ts`

- [ ] **Step 1: Append a PATCH deactivation test**

Add to `src/app/api/employees/__tests__/route.test.ts`:

```ts
import { PATCH } from '../[id]/route';

describe('PATCH /api/employees/[id] — deactivation auto-reassign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('transactionally reassigns systems to OWNER when deactivating', async () => {
    vi.mocked(requireOwner).mockResolvedValue({
      userId: 'owner-1', companyId: 'co-1', role: 'OWNER', email: 'o@x.de', name: 'O',
    });
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: 'u1', role: 'TECHNICIAN', isActive: true,
    } as never);

    const txUpdate = vi.fn().mockResolvedValue({
      id: 'u1', name: 'T', email: 't@x.de', phone: null, role: 'TECHNICIAN',
      isActive: false, deactivatedAt: new Date(), createdAt: new Date(),
    });
    const txUpdateMany = vi.fn().mockResolvedValue({ count: 7 });
    const txDeleteMany = vi.fn().mockResolvedValue({ count: 0 });

    vi.mocked(prisma.$transaction).mockImplementation(async (fn: unknown) => {
      const callback = fn as (tx: unknown) => Promise<unknown>;
      return callback({
        user: { update: txUpdate },
        customerSystem: { updateMany: txUpdateMany },
        session: { deleteMany: txDeleteMany },
      });
    });

    const req = new Request('http://x/api/employees/u1', {
      method: 'PATCH',
      body: JSON.stringify({ isActive: false }),
    });
    const res = await PATCH(req as never, { params: Promise.resolve({ id: 'u1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.isActive).toBe(false);
    expect(body.data.reassignedCount).toBe(7);
    expect(txUpdateMany).toHaveBeenCalledWith({
      where: { companyId: 'co-1', assignedToUserId: 'u1' },
      data: { assignedToUserId: 'owner-1' },
    });
    expect(txDeleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
  });

  it('blocks self-deactivation with 400', async () => {
    vi.mocked(requireOwner).mockResolvedValue({
      userId: 'owner-1', companyId: 'co-1', role: 'OWNER', email: 'o@x.de', name: 'O',
    });
    const req = new Request('http://x/api/employees/owner-1', {
      method: 'PATCH',
      body: JSON.stringify({ isActive: false }),
    });
    const res = await PATCH(req as never, { params: Promise.resolve({ id: 'owner-1' }) });
    expect(res.status).toBe(400);
  });

  it('does not reassign on reactivation', async () => {
    vi.mocked(requireOwner).mockResolvedValue({
      userId: 'owner-1', companyId: 'co-1', role: 'OWNER', email: 'o@x.de', name: 'O',
    });
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: 'u1', role: 'TECHNICIAN', isActive: false,
    } as never);
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: 'u1', name: 'T', email: 't@x.de', phone: null, role: 'TECHNICIAN',
      isActive: true, deactivatedAt: null, createdAt: new Date(),
    } as never);

    const req = new Request('http://x/api/employees/u1', {
      method: 'PATCH',
      body: JSON.stringify({ isActive: true }),
    });
    const res = await PATCH(req as never, { params: Promise.resolve({ id: 'u1' }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.isActive).toBe(true);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/app/api/employees/__tests__/route.test.ts`
Expected: PASS (all tests including the 3 new ones).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/employees/__tests__/route.test.ts
git commit -m "test(api): cover auto-reassign + self-deactivation block + reactivation"
```

---

## Task 20: Deactivation toast shows reassigned count

**Files:**
- Modify: `src/hooks/useEmployees.ts`

- [ ] **Step 1: Surface `reassignedCount` and toast it on success**

Replace the `useToggleEmployee` body in `src/hooks/useEmployees.ts`:

```ts
export function useToggleEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      const result: ApiResponse<Employee & { reassignedCount?: number }> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Aktualisieren');
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['customer-systems'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      if (!variables.isActive) {
        const count = data.reassignedCount ?? 0;
        if (count > 0) {
          toast.success(`Mitarbeiter deaktiviert. ${count} System(e) wurden dem Inhaber zugewiesen.`);
        } else {
          toast.success('Mitarbeiter deaktiviert.');
        }
      } else {
        toast.success('Mitarbeiter aktiviert.');
      }
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useEmployees.ts
git commit -m "feat(hooks): surface reassigned count in deactivation toast"
```

---

## Task 21: Full regression — typecheck, tests, lint

**Files:**
- None (verification only)

- [ ] **Step 1: Run full typecheck**

Run: `npx tsc --noEmit`
Expected: PASS with zero errors.

- [ ] **Step 2: Run the entire vitest suite**

Run: `npm test -- --run`
Expected: PASS across all suites.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: PASS (or only pre-existing warnings — no new errors introduced by this feature).

- [ ] **Step 4: Smoke-test the happy path manually**

Start dev server: `npm run dev`. As OWNER:
1. Open `/dashboard/employees` — verify workload column + overdue red pill render.
2. Click a technician row — lands on `/dashboard/employees/[id]` with header + stats + grouped systems + activity.
3. Click "Zuweisung ändern" on a row — reassign to another tech — toast shows "1 System neu zugewiesen".
4. Select 3 rows, bulk reassign — toast shows "3 Systeme neu zugewiesen".
5. Open `/dashboard/systems` — verify AssigneeBadge on cards and filter dropdown.
6. Filter by "Nicht zugewiesen" — URL updates to `?assignee=unassigned`; reload preserves filter.
7. On `/dashboard` — verify "Nicht zugewiesen" tile appears when count > 0 and links to the filtered systems page.
8. Deactivate a tech with assigned systems — toast shows the reassigned count; open `/dashboard/employees/[id]` for that tech — list is empty; the OWNER's list now shows them.

As TECHNICIAN:
1. `/dashboard/systems` — no filter dropdown, no AssigneeBadge on cards.
2. `/dashboard/employees/[id]` — redirects to `/dashboard`.

- [ ] **Step 5: Commit any incidental fixes**

If any of the above surfaces a regression, fix it and commit as a follow-up.

```bash
git add -A
git commit -m "fix(workload): regression fixes from verification pass"
```

(If nothing needed, skip the commit.)

---

## Task 22: Update BACKLOG.md

**Files:**
- Modify: `docs/BACKLOG.md`

- [ ] **Step 1: Move any related open items to Completed**

Open `docs/BACKLOG.md`. Locate any open items relating to:
- Workload / assignee visibility
- Unassigned-after-deactivation cleanup
- Per-technician dashboard
- #37 (technician calendar view) — partial coverage note only; do NOT mark resolved.

Move matching rows from the **Open Items** table to the **Completed / Resolved** table. Format:

```markdown
| N | Employees | Technician workload management (badge, detail page, bulk reassign, auto-reassign on deactivate) | 2026-04-23 |
```

If no pre-existing open item matches, append a new row documenting what was delivered:

```markdown
| <next-number> | Employees | Technician workload management: assignee badges, detail page with stats + grouped systems + bulk reassign, silent auto-reassign to OWNER on deactivation, dashboard "Nicht zugewiesen" tile | 2026-04-23 |
```

- [ ] **Step 2: Commit**

```bash
git add docs/BACKLOG.md
git commit -m "docs(backlog): mark technician workload management resolved"
```

---

## Rollout checklist

- [ ] All 22 tasks committed.
- [ ] `npx tsc --noEmit` clean.
- [ ] `npm test -- --run` green.
- [ ] `npm run lint` clean (no new errors).
- [ ] Manual smoke as OWNER + TECHNICIAN pass.
- [ ] `docs/BACKLOG.md` updated.

When all boxes are ticked, the feature is ready for merge to `development`.
