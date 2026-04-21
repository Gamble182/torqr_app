# Digital Maintenance Checklist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the simple `MaintenanceFormModal` with a 3-step mobile-first `MaintenanceChecklistModal` that walks a technician through a per-system-type checklist, captures notes/photos, and saves an immutable checklist snapshot with the maintenance record.

**Architecture:** Hardcoded default items per system type (TypeScript constants) + `CustomerSystemChecklistItem` DB table for per-system custom items. Completed state stored as a `checklistData: Json` snapshot on `Maintenance` — immutable, never references live item IDs. The old `MaintenanceFormModal` is fully replaced.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Prisma ORM (Supabase PostgreSQL), React Query v5, Zod, shadcn/ui, Tailwind CSS, sonner (toasts), Vitest.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/types/checklist.ts` | `ChecklistItemSnapshot`, `ChecklistSnapshot` types |
| Create | `src/lib/checklist-defaults.ts` | `CHECKLIST_DEFAULTS` constant — 4 system types |
| Create | `src/lib/checklist-defaults.test.ts` | Unit tests for defaults constant |
| Modify | `src/lib/validations.ts` | Add `checklistItemSnapshotSchema`, `checklistSnapshotSchema`, `checklistItemCreateSchema`; extend `maintenanceCreateSchema` |
| Create | `src/lib/checklist-validation.test.ts` | Unit tests for new Zod schemas |
| Modify | `prisma/schema.prisma` | Add `CustomerSystemChecklistItem` model; add `checklistItems` relation on `CustomerSystem`; add `checklistData Json?` on `Maintenance` |
| Modify | `src/app/api/upload/photo/route.ts` | Make ownership check conditional on real UUID (fix temp-ID bug) |
| Create | `src/app/api/systems/[id]/checklist-items/route.ts` | `GET` + `POST` — list and add custom items |
| Create | `src/app/api/systems/[id]/checklist-items/[itemId]/route.ts` | `DELETE` — remove custom item |
| Modify | `src/app/api/maintenances/route.ts` | Pass `checklistData` through to Prisma create |
| Create | `src/hooks/useChecklistItems.ts` | `useChecklistItems`, `useAddChecklistItem`, `useDeleteChecklistItem` |
| Create | `src/components/SystemChecklistManager.tsx` | Collapsible custom item CRUD inside system cards |
| Create | `src/components/MaintenanceChecklistModal.tsx` | 3-step checklist modal |
| Modify | `src/app/dashboard/page.tsx` | Swap modal; add `systemType` to selected system state |
| Modify | `src/app/dashboard/customers/[id]/page.tsx` | Swap modal; add `<SystemChecklistManager>` per system card |
| Delete | `src/components/MaintenanceFormModal.tsx` | Replaced by `MaintenanceChecklistModal` |

---

## Task 1: TypeScript Types + Checklist Defaults

**Files:**
- Create: `src/types/checklist.ts`
- Create: `src/lib/checklist-defaults.ts`
- Create: `src/lib/checklist-defaults.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/checklist-defaults.test.ts
import { CHECKLIST_DEFAULTS } from './checklist-defaults';

const SYSTEM_TYPES = ['HEATING', 'AC', 'WATER_TREATMENT', 'ENERGY_STORAGE'];

describe('CHECKLIST_DEFAULTS', () => {
  it('has entries for all four system types', () => {
    SYSTEM_TYPES.forEach((type) => {
      expect(CHECKLIST_DEFAULTS[type]).toBeDefined();
      expect(Array.isArray(CHECKLIST_DEFAULTS[type])).toBe(true);
    });
  });

  it('has at least 5 items per system type', () => {
    SYSTEM_TYPES.forEach((type) => {
      expect(CHECKLIST_DEFAULTS[type].length).toBeGreaterThanOrEqual(5);
    });
  });

  it('has no empty strings in any list', () => {
    SYSTEM_TYPES.forEach((type) => {
      CHECKLIST_DEFAULTS[type].forEach((item) => {
        expect(item.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it('falls back to empty array for unknown system type', () => {
    expect(CHECKLIST_DEFAULTS['UNKNOWN'] ?? []).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/checklist-defaults.test.ts --no-coverage
```

Expected: FAIL — "Cannot find module './checklist-defaults'"

- [ ] **Step 3: Create the types file**

```typescript
// src/types/checklist.ts
export type ChecklistItemSnapshot = {
  label: string;
  checked: boolean;
  isCustom: boolean;
};

export type ChecklistSnapshot = {
  items: ChecklistItemSnapshot[];
  confirmedAt: string; // ISO 8601
};
```

- [ ] **Step 4: Create the defaults file**

```typescript
// src/lib/checklist-defaults.ts
export const CHECKLIST_DEFAULTS: Record<string, string[]> = {
  HEATING: [
    'Brenner reinigen und prüfen',
    'Wärmetauscher reinigen',
    'Abgaswerte messen',
    'Betriebsdruck prüfen',
    'Ausdehnungsgefäß prüfen',
    'Sicherheitsventil prüfen',
    'Filter reinigen oder wechseln',
    'Dichtheitsprüfung',
    'Regelung und Thermostat prüfen',
    'Warmwasserbereitung prüfen',
  ],
  AC: [
    'Luftfilter reinigen',
    'Kondensator reinigen',
    'Kältemitteldruck prüfen',
    'Kondenswasserablauf prüfen',
    'Elektrische Anschlüsse prüfen',
    'Betriebstemperaturen messen',
    'Fernbedienung und Steuerung prüfen',
  ],
  WATER_TREATMENT: [
    'Salzvorrat prüfen und nachfüllen',
    'Regeneration prüfen',
    'Filterwechsel prüfen',
    'Wasserhärte messen',
    'Druckverlust prüfen',
    'Desinfektion prüfen',
  ],
  ENERGY_STORAGE: [
    'Ladestand prüfen',
    'Batteriespannung messen',
    'Anschlüsse und Kabel prüfen',
    'Batterie-Management-System prüfen',
    'Temperaturen prüfen',
    'Wechselrichter prüfen',
  ],
};
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run src/lib/checklist-defaults.test.ts --no-coverage
```

Expected: PASS — 4 tests passing

- [ ] **Step 6: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add src/types/checklist.ts src/lib/checklist-defaults.ts src/lib/checklist-defaults.test.ts
git commit -m "feat(checklist): add types and default checklist items per system type"
```

---

## Task 2: Zod Validation Schemas

**Files:**
- Modify: `src/lib/validations.ts`
- Create: `src/lib/checklist-validation.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/lib/checklist-validation.test.ts
import { checklistSnapshotSchema, checklistItemCreateSchema } from './validations';

describe('checklistSnapshotSchema', () => {
  it('accepts a valid snapshot with items', () => {
    const result = checklistSnapshotSchema.safeParse({
      items: [
        { label: 'Brenner reinigen', checked: true, isCustom: false },
        { label: 'Eigener Punkt', checked: false, isCustom: true },
      ],
      confirmedAt: '2026-04-21T10:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('accepts an empty items array', () => {
    const result = checklistSnapshotSchema.safeParse({
      items: [],
      confirmedAt: '2026-04-21T10:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an item with an empty label', () => {
    const result = checklistSnapshotSchema.safeParse({
      items: [{ label: '', checked: true, isCustom: false }],
      confirmedAt: '2026-04-21T10:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid confirmedAt date string', () => {
    const result = checklistSnapshotSchema.safeParse({
      items: [],
      confirmedAt: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });
});

describe('checklistItemCreateSchema', () => {
  it('accepts a valid label', () => {
    const result = checklistItemCreateSchema.safeParse({ label: 'Filter prüfen' });
    expect(result.success).toBe(true);
  });

  it('trims whitespace from label', () => {
    const result = checklistItemCreateSchema.safeParse({ label: '  Filter prüfen  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.label).toBe('Filter prüfen');
  });

  it('rejects an empty label', () => {
    const result = checklistItemCreateSchema.safeParse({ label: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a whitespace-only label', () => {
    const result = checklistItemCreateSchema.safeParse({ label: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejects a label longer than 200 characters', () => {
    const result = checklistItemCreateSchema.safeParse({ label: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/checklist-validation.test.ts --no-coverage
```

Expected: FAIL — "checklistSnapshotSchema is not exported from './validations'"

- [ ] **Step 3: Add checklist schemas to validations.ts**

In `src/lib/validations.ts`, insert the following block **before** the `// MAINTENANCE SCHEMAS` section (the new schemas must be declared before `maintenanceCreateSchema` references them):

```typescript
// ============================================================================
// CHECKLIST SCHEMAS
// ============================================================================

export const checklistItemSnapshotSchema = z.object({
  label: z.string().min(1).max(200),
  checked: z.boolean(),
  isCustom: z.boolean(),
});

export const checklistSnapshotSchema = z.object({
  items: z.array(checklistItemSnapshotSchema),
  confirmedAt: z.string().datetime(),
});

export const checklistItemCreateSchema = z.object({
  label: z
    .string()
    .min(1, 'Bezeichnung ist erforderlich')
    .max(200, 'Bezeichnung zu lang')
    .trim(),
});
```

- [ ] **Step 4: Extend maintenanceCreateSchema with checklistData**

Find the existing `maintenanceCreateSchema` in `src/lib/validations.ts` (currently around line 246) and replace it:

```typescript
// BEFORE:
export const maintenanceCreateSchema = z.object({
  systemId: uuidSchema,
  date: dateStringSchema.optional(),
  notes: z
    .string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .or(z.literal('')),
  photos: z.array(z.string().url('Invalid photo URL')).max(10, 'Maximum 10 photos allowed').optional(),
});

// AFTER:
export const maintenanceCreateSchema = z.object({
  systemId: uuidSchema,
  date: dateStringSchema.optional(),
  notes: z
    .string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .or(z.literal('')),
  photos: z.array(z.string().url('Invalid photo URL')).max(10, 'Maximum 10 photos allowed').optional(),
  checklistData: checklistSnapshotSchema.optional().nullable(),
});
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/lib/checklist-validation.test.ts --no-coverage
```

Expected: PASS — 9 tests passing

- [ ] **Step 6: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add src/lib/validations.ts src/lib/checklist-validation.test.ts
git commit -m "feat(checklist): add Zod schemas for checklist snapshot and custom item creation"
```

---

## Task 3: Prisma Schema + Migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `checklistData` to the Maintenance model**

In `prisma/schema.prisma`, find the `Maintenance` model and add the new field after `syncedAt`:

```prisma
// BEFORE (the model currently ends like this):
model Maintenance {
  id        String    @id @default(uuid())
  date      DateTime  @default(now())
  notes     String?
  photos    String[]  @default([])
  syncedAt  DateTime?
  createdAt DateTime  @default(now())

  systemId String
  ...
}

// AFTER — add checklistData after syncedAt:
model Maintenance {
  id            String    @id @default(uuid())
  date          DateTime  @default(now())
  notes         String?
  photos        String[]  @default([])
  syncedAt      DateTime?
  checklistData Json?
  createdAt     DateTime  @default(now())

  systemId String
  ...
}
```

- [ ] **Step 2: Add `checklistItems` relation to CustomerSystem**

In `prisma/schema.prisma`, find the `CustomerSystem` model and add the relation after the existing `bookings` relation:

```prisma
// BEFORE:
  maintenances Maintenance[]
  bookings     Booking[]

// AFTER:
  maintenances   Maintenance[]
  bookings       Booking[]
  checklistItems CustomerSystemChecklistItem[]
```

- [ ] **Step 3: Add the new CustomerSystemChecklistItem model**

In `prisma/schema.prisma`, add this new section after the `// MAINTENANCE TRACKING` section (after the closing `}` of `Maintenance`):

```prisma
// ============================================================================
// MAINTENANCE CHECKLIST ITEMS (custom per CustomerSystem)
// ============================================================================

model CustomerSystemChecklistItem {
  id               String         @id @default(uuid())
  customerSystemId String
  customerSystem   CustomerSystem @relation(fields: [customerSystemId], references: [id], onDelete: Cascade)
  label            String
  sortOrder        Int            @default(0)
  createdAt        DateTime       @default(now())

  @@index([customerSystemId])
  @@map("customer_system_checklist_items")
}
```

- [ ] **Step 4: Run the migration**

```bash
npx prisma migrate dev --name add_checklist
```

Expected output: a new migration file created in `prisma/migrations/`, applied to the database.
If prompted for a name, it is already provided in the flag above.

- [ ] **Step 5: Regenerate the Prisma client**

```bash
npx prisma generate
```

Expected: "Generated Prisma Client" — no errors.

- [ ] **Step 6: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors. If Prisma types are not updated, re-run `npx prisma generate`.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(checklist): add CustomerSystemChecklistItem model and checklistData field on Maintenance"
```

---

## Task 4: Fix Photo Upload API (Temp-ID Compatibility)

**Context:** `POST /api/upload/photo` currently does a DB lookup on every `maintenanceId`. The existing `MaintenanceFormModal` (and the new modal) pass `temp-${Date.now()}` as a placeholder before the maintenance record exists. Since `temp-...` is not a UUID, the DB lookup returns null and the route returns 404 — photos are broken. Fix: skip the DB check when `maintenanceId` is not a UUID.

**Files:**
- Modify: `src/app/api/upload/photo/route.ts`

- [ ] **Step 1: Replace the ownership check block**

In `src/app/api/upload/photo/route.ts`, replace lines 24–34 (the ownership check block):

```typescript
// REMOVE this block:
// Verify the maintenance record belongs to the authenticated user
const maintenance = await prisma.maintenance.findFirst({
  where: { id: maintenanceId, userId },
  select: { id: true },
});
if (!maintenance) {
  return NextResponse.json(
    { success: false, error: 'Wartung nicht gefunden' },
    { status: 404 }
  );
}

// REPLACE WITH:
// Only verify ownership when a real maintenance ID is provided.
// Temp IDs (e.g. "temp-1713123456") are used during pre-creation uploads
// and are already scoped to the user via the storage path prefix.
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (UUID_REGEX.test(maintenanceId)) {
  const maintenance = await prisma.maintenance.findFirst({
    where: { id: maintenanceId, userId },
    select: { id: true },
  });
  if (!maintenance) {
    return NextResponse.json(
      { success: false, error: 'Wartung nicht gefunden' },
      { status: 404 }
    );
  }
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/upload/photo/route.ts
git commit -m "fix(upload): allow photo upload with temp maintenanceId before maintenance record exists"
```

---

## Task 5: Checklist Items API — GET + POST

**Files:**
- Create: `src/app/api/systems/[id]/checklist-items/route.ts`

- [ ] **Step 1: Create the directory and file**

Create the file at `src/app/api/systems/[id]/checklist-items/route.ts` with this full content:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { checklistItemCreateSchema } from '@/lib/validations';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

async function verifySystemOwnership(systemId: string, userId: string) {
  return prisma.customerSystem.findFirst({
    where: { id: systemId, userId },
    select: { id: true },
  });
}

/**
 * GET /api/systems/[id]/checklist-items
 * Returns custom checklist items for a system, ordered by sortOrder then createdAt.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await requireAuth();
    const { id: systemId } = params;

    const system = await verifySystemOwnership(systemId, userId);
    if (!system) {
      return NextResponse.json({ success: false, error: 'System nicht gefunden' }, { status: 404 });
    }

    const items = await prisma.customerSystemChecklistItem.findMany({
      where: { customerSystemId: systemId },
      select: { id: true, label: true, sortOrder: true, createdAt: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({ success: true, data: items });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/systems/[id]/checklist-items
 * Adds a custom checklist item to the system.
 * Body: { label: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await requireAuth();

    const rateLimitResponse = rateLimitByUser(req, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rateLimitResponse) return rateLimitResponse;

    const { id: systemId } = params;

    const system = await verifySystemOwnership(systemId, userId);
    if (!system) {
      return NextResponse.json({ success: false, error: 'System nicht gefunden' }, { status: 404 });
    }

    const body = await req.json();
    const { label } = checklistItemCreateSchema.parse(body);

    // Compute next sortOrder: max existing + 1, starting at 0
    const aggregate = await prisma.customerSystemChecklistItem.aggregate({
      where: { customerSystemId: systemId },
      _max: { sortOrder: true },
    });
    const nextSortOrder = (aggregate._max.sortOrder ?? -1) + 1;

    const item = await prisma.customerSystemChecklistItem.create({
      data: { customerSystemId: systemId, label, sortOrder: nextSortOrder },
      select: { id: true, label: true, sortOrder: true, createdAt: true },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validierungsfehler', details: err.issues },
        { status: 400 }
      );
    }
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/systems/
git commit -m "feat(checklist): add GET and POST /api/systems/[id]/checklist-items"
```

---

## Task 6: Checklist Items API — DELETE

**Files:**
- Create: `src/app/api/systems/[id]/checklist-items/[itemId]/route.ts`

- [ ] **Step 1: Create the file**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

/**
 * DELETE /api/systems/[id]/checklist-items/[itemId]
 * Deletes a custom checklist item. Ownership verified via system → customer → userId chain.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const { userId } = await requireAuth();

    const rateLimitResponse = rateLimitByUser(req, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rateLimitResponse) return rateLimitResponse;

    const { id: systemId, itemId } = params;

    // Ownership check: item must belong to a system that belongs to this user
    const item = await prisma.customerSystemChecklistItem.findFirst({
      where: {
        id: itemId,
        customerSystem: { id: systemId, userId },
      },
      select: { id: true },
    });

    if (!item) {
      return NextResponse.json({ success: false, error: 'Eintrag nicht gefunden' }, { status: 404 });
    }

    await prisma.customerSystemChecklistItem.delete({ where: { id: itemId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/systems/[id]/checklist-items/[itemId]/route.ts
git commit -m "feat(checklist): add DELETE /api/systems/[id]/checklist-items/[itemId]"
```

---

## Task 7: Update Maintenance Create API for checklistData

**Context:** `POST /api/maintenances` creates maintenance records. It needs to pass `checklistData` from the request body through to the Prisma `create` call. The Zod schema was already extended in Task 2.

**Files:**
- Modify: `src/app/api/maintenances/route.ts`

- [ ] **Step 1: Add checklistData to the Prisma create call**

In `src/app/api/maintenances/route.ts`, find the `tx.maintenance.create` call (inside the `$transaction`). Replace the `data` object:

```typescript
// BEFORE:
const maintenance = await tx.maintenance.create({
  data: {
    systemId: validatedData.systemId,
    userId,
    date: maintenanceDate,
    notes: validatedData.notes || null,
    photos: validatedData.photos || [],
  },

// AFTER:
const maintenance = await tx.maintenance.create({
  data: {
    systemId: validatedData.systemId,
    userId,
    date: maintenanceDate,
    notes: validatedData.notes || null,
    photos: validatedData.photos || [],
    checklistData: validatedData.checklistData ?? undefined,
  },
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/maintenances/route.ts
git commit -m "feat(checklist): pass checklistData through maintenance creation API"
```

---

## Task 8: useChecklistItems Hook

**Files:**
- Create: `src/hooks/useChecklistItems.ts`

- [ ] **Step 1: Create the hook file**

```typescript
// src/hooks/useChecklistItems.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface ChecklistItem {
  id: string;
  label: string;
  sortOrder: number;
  createdAt: string;
}

export function useChecklistItems(systemId: string) {
  return useQuery<ChecklistItem[]>({
    queryKey: ['checklist-items', systemId],
    queryFn: async () => {
      const res = await fetch(`/api/systems/${systemId}/checklist-items`);
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Fehler beim Laden der Checkliste');
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddChecklistItem(systemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (label: string): Promise<ChecklistItem> => {
      const res = await fetch(`/api/systems/${systemId}/checklist-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Fehler beim Hinzufügen');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items', systemId] });
    },
  });
}

export function useDeleteChecklistItem(systemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string): Promise<void> => {
      const res = await fetch(`/api/systems/${systemId}/checklist-items/${itemId}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Fehler beim Löschen');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items', systemId] });
    },
  });
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useChecklistItems.ts
git commit -m "feat(checklist): add useChecklistItems hook with add/delete mutations"
```

---

## Task 9: SystemChecklistManager Component

**Context:** A collapsible section rendered inside each system card on the customer detail page. Allows the technician or owner to add/delete custom checklist items for a specific system installation. Uses the hooks from Task 8.

**Files:**
- Create: `src/components/SystemChecklistManager.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/SystemChecklistManager.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  TrashIcon,
  Loader2Icon,
  ListChecksIcon,
} from 'lucide-react';
import {
  useChecklistItems,
  useAddChecklistItem,
  useDeleteChecklistItem,
} from '@/hooks/useChecklistItems';

interface SystemChecklistManagerProps {
  systemId: string;
}

export function SystemChecklistManager({ systemId }: SystemChecklistManagerProps) {
  const [expanded, setExpanded] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [addError, setAddError] = useState('');

  const { data: items = [], isLoading, error } = useChecklistItems(systemId);
  const addItem = useAddChecklistItem(systemId);
  const deleteItem = useDeleteChecklistItem(systemId);

  const handleAdd = async () => {
    const trimmed = newLabel.trim();
    if (!trimmed) {
      setAddError('Bezeichnung ist erforderlich');
      return;
    }
    if (trimmed.length > 200) {
      setAddError('Bezeichnung zu lang (max. 200 Zeichen)');
      return;
    }
    setAddError('');
    try {
      await addItem.mutateAsync(trimmed);
      setNewLabel('');
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Fehler beim Hinzufügen');
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteItem.mutateAsync(itemId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Löschen');
    }
  };

  return (
    <div className="border-t border-border mt-3 pt-3">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-left py-1"
      >
        <ListChecksIcon className="h-3.5 w-3.5 shrink-0" />
        <span>Checkliste verwalten</span>
        {items.length > 0 && (
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded border border-border">
            {items.length} eigene
          </span>
        )}
        {expanded ? (
          <ChevronUpIcon className="h-3.5 w-3.5 ml-auto shrink-0" />
        ) : (
          <ChevronDownIcon className="h-3.5 w-3.5 ml-auto shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
              Wird geladen…
            </div>
          )}

          {error && !isLoading && (
            <p className="text-xs text-destructive">
              Fehler beim Laden der Einträge
            </p>
          )}

          {!isLoading && !error && items.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Noch keine eigenen Einträge. Fügen Sie individuelle Prüfpunkte für
              dieses System hinzu.
            </p>
          )}

          {items.length > 0 && (
            <ul className="space-y-1.5">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 group"
                >
                  <span className="flex-1 text-xs text-foreground">{item.label}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={deleteItem.isPending}
                    title="Eintrag löschen"
                    className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50 shrink-0 p-0.5"
                  >
                    {deleteItem.isPending ? (
                      <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <TrashIcon className="h-3.5 w-3.5" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-1">
            <div className="flex gap-2">
              <Input
                value={newLabel}
                onChange={(e) => {
                  setNewLabel(e.target.value);
                  setAddError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                placeholder="z.B. Eigener Prüfpunkt"
                className={`h-9 text-base flex-1 ${addError ? 'border-destructive' : ''}`}
                maxLength={200}
                disabled={addItem.isPending}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAdd}
                disabled={addItem.isPending || !newLabel.trim()}
                className="h-9 shrink-0"
              >
                {addItem.isPending ? (
                  <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <PlusIcon className="h-3.5 w-3.5" />
                )}
                Hinzufügen
              </Button>
            </div>
            {addError && <p className="text-xs text-destructive">{addError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/SystemChecklistManager.tsx
git commit -m "feat(checklist): add SystemChecklistManager component for custom item CRUD"
```

---

## Task 10: MaintenanceChecklistModal Component

**Context:** A 3-step mobile-first modal that replaces `MaintenanceFormModal`. Step 1 = checklist, Step 2 = notes + photos, Step 3 = date + confirm. Saves an immutable `ChecklistSnapshot` to `Maintenance.checklistData`.

The component uses a bottom-sheet pattern on mobile (slides up from bottom), centered dialog on desktop (max-w-lg).

**Files:**
- Create: `src/components/MaintenanceChecklistModal.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/MaintenanceChecklistModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  XIcon,
  CameraIcon,
  TrashIcon,
  Loader2Icon,
  ChevronRightIcon,
  ChevronLeftIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
} from 'lucide-react';
import type { ChecklistSnapshot } from '@/types/checklist';
import { CHECKLIST_DEFAULTS } from '@/lib/checklist-defaults';
import { useChecklistItems } from '@/hooks/useChecklistItems';

interface MaintenanceChecklistModalProps {
  systemId: string;
  systemLabel: string;
  systemType: string; // 'HEATING' | 'AC' | 'WATER_TREATMENT' | 'ENERGY_STORAGE'
  onClose: () => void;
  onSuccess: () => void;
}

type ChecklistEntry = {
  label: string;
  checked: boolean;
  isCustom: boolean;
};

export function MaintenanceChecklistModal({
  systemId,
  systemLabel,
  systemType,
  onClose,
  onSuccess,
}: MaintenanceChecklistModalProps) {
  const today = new Date().toISOString().split('T')[0];

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [entries, setEntries] = useState<ChecklistEntry[]>([]);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const { data: customItems } = useChecklistItems(systemId);

  // Build the full checklist when custom items are loaded
  useEffect(() => {
    const defaults = (CHECKLIST_DEFAULTS[systemType] ?? []).map((label) => ({
      label,
      checked: false,
      isCustom: false,
    }));
    const custom = (customItems ?? []).map((item) => ({
      label: item.label,
      checked: false,
      isCustom: true,
    }));
    setEntries([...defaults, ...custom]);
  }, [customItems, systemType]);

  const checkedCount = entries.filter((e) => e.checked).length;
  const uncheckedItems = entries.filter((e) => !e.checked);

  const toggleEntry = (index: number) => {
    setEntries((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, checked: !entry.checked } : entry
      )
    );
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPhotos = Array.from(files).filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} ist keine Bilddatei`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} ist zu groß (max. 5MB)`);
        return false;
      }
      return true;
    });
    if (photos.length + newPhotos.length > 5) {
      toast.error('Maximal 5 Fotos erlaubt');
      return;
    }
    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let uploadedUrls: string[] = [];

      if (photos.length > 0) {
        setUploadingPhotos(true);
        const tempId = `temp-${Date.now()}`;
        try {
          uploadedUrls = await Promise.all(
            photos.map(async (photo) => {
              const fd = new FormData();
              fd.append('file', photo);
              fd.append('maintenanceId', tempId);
              const res = await fetch('/api/upload/photo', { method: 'POST', body: fd });
              const data = await res.json();
              if (!data.success) throw new Error(data.error ?? 'Upload fehlgeschlagen');
              return data.url as string;
            })
          );
          toast.success(`${uploadedUrls.length} Foto(s) hochgeladen`);
        } catch (uploadError) {
          toast.error(
            uploadError instanceof Error ? uploadError.message : 'Fehler beim Hochladen der Fotos'
          );
          setLoading(false);
          setUploadingPhotos(false);
          return;
        }
        setUploadingPhotos(false);
      }

      const checklistData: ChecklistSnapshot = {
        items: entries,
        confirmedAt: new Date().toISOString(),
      };

      const res = await fetch('/api/maintenances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemId,
          date: new Date(date).toISOString(),
          notes: notes.trim() || null,
          photos: uploadedUrls,
          checklistData,
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success('Wartung erfolgreich eingetragen!');
        onSuccess();
      } else {
        toast.error(result.error ?? 'Fehler beim Speichern der Wartung');
      }
    } catch {
      toast.error('Fehler beim Speichern der Wartung');
    } finally {
      setLoading(false);
      setUploadingPhotos(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-card w-full sm:max-w-lg sm:rounded-xl rounded-t-xl max-h-[92vh] sm:max-h-[85vh] flex flex-col shadow-xl">

        {/* Header: step indicator + close */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-1.5">
            {([1, 2, 3] as const).map((s) => (
              <div
                key={s}
                className={`rounded-full transition-all duration-200 ${
                  s === step
                    ? 'w-6 h-2 bg-primary'
                    : s < step
                    ? 'w-2 h-2 bg-primary/50'
                    : 'w-2 h-2 bg-muted-foreground/20'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Schritt {step} von 3</p>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Step 1: Checkliste ── */}
          {step === 1 && (
            <div className="p-4 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">{systemLabel}</h2>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <ClipboardListIcon className="h-3.5 w-3.5" />
                  Wartungscheckliste &middot;{' '}
                  <span
                    className={
                      checkedCount === entries.length && entries.length > 0
                        ? 'text-success font-medium'
                        : ''
                    }
                  >
                    {checkedCount} / {entries.length} Punkte erledigt
                  </span>
                </p>
              </div>

              {entries.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Keine Checklisten-Einträge für diesen Systemtyp.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {entries.map((entry, index) => (
                    <li key={index}>
                      <button
                        type="button"
                        onClick={() => toggleEntry(index)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all min-h-[52px] ${
                          entry.checked
                            ? 'border-success/30 bg-success/5'
                            : 'border-border bg-card hover:bg-muted/50 active:bg-muted'
                        }`}
                      >
                        <div
                          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            entry.checked
                              ? 'bg-success border-success'
                              : 'border-muted-foreground/40'
                          }`}
                        >
                          {entry.checked && (
                            <CheckCircle2Icon className="h-3.5 w-3.5 text-success-foreground" />
                          )}
                        </div>
                        <span
                          className={`flex-1 text-sm ${
                            entry.checked
                              ? 'line-through text-muted-foreground'
                              : 'text-foreground'
                          }`}
                        >
                          {entry.label}
                        </span>
                        {entry.isCustom && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border shrink-0">
                            Individuell
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── Step 2: Notizen & Fotos ── */}
          {step === 2 && (
            <div className="p-4 space-y-5">
              <div>
                <h2 className="text-base font-semibold text-foreground">Notizen & Fotos</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Optional — Besonderheiten und Dokumentation
                </p>
              </div>

              <div>
                <Label htmlFor="notes" className="mb-1.5 block text-sm">
                  Notizen (optional)
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="z.B. Druck war erhöht, nächstes Mal Filter wechseln…"
                  className="resize-none text-base min-h-[120px]"
                  maxLength={2000}
                />
                <p className="mt-1 text-xs text-muted-foreground text-right">
                  {notes.length} / 2000
                </p>
              </div>

              <div>
                <Label className="mb-1.5 block text-sm">Fotos (optional, max. 5)</Label>

                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-28 object-cover rounded-lg border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-destructive/80 text-white rounded-md p-1 opacity-100 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {photos.length < 5 && (
                  <label className="flex items-center justify-center w-full h-16 sm:h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
                    <div className="flex flex-col items-center">
                      <CameraIcon className="h-5 w-5 text-muted-foreground" />
                      <span className="mt-1 text-xs text-muted-foreground">
                        Fotos hinzufügen
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                )}

                <p className="mt-1 text-xs text-muted-foreground">
                  JPEG, PNG oder WebP &middot; Max. 5MB pro Foto
                </p>
              </div>
            </div>
          )}

          {/* ── Step 3: Abschließen ── */}
          {step === 3 && (
            <div className="p-4 space-y-5">
              <div>
                <h2 className="text-base font-semibold text-foreground">Wartung abschließen</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{systemLabel}</p>
              </div>

              <div>
                <Label htmlFor="date" className="mb-1.5 block text-sm">
                  Wartungsdatum <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={today}
                  className="h-11 text-base"
                />
              </div>

              <Card className="p-4 bg-muted/30 border-border">
                <p className="text-sm font-medium text-foreground mb-3">Zusammenfassung</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Erledigte Punkte</span>
                    <span
                      className={`font-medium ${
                        checkedCount === entries.length && entries.length > 0
                          ? 'text-success'
                          : 'text-foreground'
                      }`}
                    >
                      {checkedCount} / {entries.length}
                    </span>
                  </div>
                  {notes.trim() && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Notiz</span>
                      <span className="text-foreground">Vorhanden</span>
                    </div>
                  )}
                  {photos.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fotos</span>
                      <span className="text-foreground">{photos.length}</span>
                    </div>
                  )}
                </div>

                {uncheckedItems.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-warning-foreground font-medium mb-1.5">
                      Nicht erledigte Punkte ({uncheckedItems.length}):
                    </p>
                    <ul className="space-y-0.5">
                      {uncheckedItems.map((item, i) => (
                        <li
                          key={i}
                          className="text-xs text-muted-foreground flex items-center gap-1.5"
                        >
                          <div className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                          {item.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>

        {/* Footer: navigation */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border shrink-0">
          {step === 1 ? (
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="h-11 sm:h-9"
            >
              Abbrechen
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setStep((prev) => (prev - 1) as 1 | 2)}
              disabled={loading}
              className="h-11 sm:h-9"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Zurück
            </Button>
          )}

          {step < 3 ? (
            <Button
              onClick={() => setStep((prev) => (prev + 1) as 2 | 3)}
              className="h-11 sm:h-9"
            >
              Weiter
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading || uploadingPhotos || !date}
              className="h-11 sm:h-9 bg-success hover:bg-success/90 text-success-foreground"
            >
              {uploadingPhotos ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Fotos werden hochgeladen…
                </>
              ) : loading ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Wird gespeichert…
                </>
              ) : (
                <>
                  <CheckCircle2Icon className="h-4 w-4" />
                  Wartung abschließen
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/MaintenanceChecklistModal.tsx
git commit -m "feat(checklist): add 3-step MaintenanceChecklistModal component"
```

---

## Task 11: Wire Up Dashboard Page

**Context:** `src/app/dashboard/page.tsx` currently renders `MaintenanceFormModal`. The selected system state `{ id, label }` must be extended with `systemType`. The `MaintenanceFormModal` import is replaced with `MaintenanceChecklistModal`.

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Replace the import**

In `src/app/dashboard/page.tsx`, replace:

```typescript
// REMOVE:
import { MaintenanceFormModal } from '@/components/MaintenanceFormModal';

// ADD:
import { MaintenanceChecklistModal } from '@/components/MaintenanceChecklistModal';
```

- [ ] **Step 2: Extend the selected system state type**

Find line 34:
```typescript
const [selectedSystem, setSelectedSystem] = useState<{ id: string; label: string } | null>(null);
```

Replace with:
```typescript
const [selectedSystem, setSelectedSystem] = useState<{
  id: string;
  label: string;
  systemType: string;
} | null>(null);
```

- [ ] **Step 3: Pass systemType when setting selected system**

Find the `setSelectedSystem` call inside `upcomingSystemsList.map` (around line 239):

```typescript
// BEFORE:
setSelectedSystem({ id: system.id, label: systemLabel });

// AFTER:
setSelectedSystem({ id: system.id, label: systemLabel, systemType: system.catalog.systemType });
```

- [ ] **Step 4: Replace the modal render**

Find the `<MaintenanceFormModal` block near the bottom of the file (inside `{selectedSystem && (...)}`) and replace it:

```tsx
// BEFORE:
{selectedSystem && (
  <MaintenanceFormModal
    systemId={selectedSystem.id}
    systemLabel={selectedSystem.label}
    onClose={() => setSelectedSystem(null)}
    onSuccess={() => {
      setSelectedSystem(null);
      refetch();
    }}
  />
)}

// AFTER:
{selectedSystem && (
  <MaintenanceChecklistModal
    systemId={selectedSystem.id}
    systemLabel={selectedSystem.label}
    systemType={selectedSystem.systemType}
    onClose={() => setSelectedSystem(null)}
    onSuccess={() => {
      setSelectedSystem(null);
      refetch();
    }}
  />
)}
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat(checklist): wire MaintenanceChecklistModal into dashboard page"
```

---

## Task 12: Wire Up Customer Detail Page + Remove Old Modal

**Context:** `src/app/dashboard/customers/[id]/page.tsx` uses `MaintenanceFormModal` with `selectedSystem: CustomerSystem | null`. The `CustomerSystem` type already has `catalog.systemType` available — no state type change needed. We add `<SystemChecklistManager>` inside each system card and delete the old modal file.

**Files:**
- Modify: `src/app/dashboard/customers/[id]/page.tsx`
- Delete: `src/components/MaintenanceFormModal.tsx`

- [ ] **Step 1: Replace the imports**

At the top of `src/app/dashboard/customers/[id]/page.tsx`, find:

```typescript
import { MaintenanceFormModal } from '@/components/MaintenanceFormModal';
```

Replace with:

```typescript
import { MaintenanceChecklistModal } from '@/components/MaintenanceChecklistModal';
import { SystemChecklistManager } from '@/components/SystemChecklistManager';
```

- [ ] **Step 2: Add SystemChecklistManager inside each system card**

Find the end of the system card's info grid (the `<div className="grid grid-cols-2 md:grid-cols-4 gap-2">` block that ends around line 451). Add `<SystemChecklistManager>` immediately after the closing `</div>` of that grid, still inside the outer `<div key={system.id} className="border border-border rounded-xl p-4 ...">`:

```tsx
// After the grid of system info pills (installationDate, maintenanceInterval, etc.):
</div>  {/* end of grid */}

<SystemChecklistManager systemId={system.id} />
```

- [ ] **Step 3: Replace the modal render at the bottom of the file**

Find (near line 661):
```tsx
{showMaintenanceForm && selectedSystem && (
  <MaintenanceFormModal
    systemId={selectedSystem.id}
    systemLabel={`${selectedSystem.catalog.manufacturer} ${selectedSystem.catalog.name}`}
    onClose={() => { setShowMaintenanceForm(false); setSelectedSystem(null); }}
    onSuccess={() => { setShowMaintenanceForm(false); setSelectedSystem(null); refetch(); refetchSystems(); }}
  />
)}
```

Replace with:
```tsx
{showMaintenanceForm && selectedSystem && (
  <MaintenanceChecklistModal
    systemId={selectedSystem.id}
    systemLabel={`${selectedSystem.catalog.manufacturer} ${selectedSystem.catalog.name}`}
    systemType={selectedSystem.catalog.systemType}
    onClose={() => { setShowMaintenanceForm(false); setSelectedSystem(null); }}
    onSuccess={() => { setShowMaintenanceForm(false); setSelectedSystem(null); refetch(); refetchSystems(); }}
  />
)}
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Delete the old modal**

```bash
git rm src/components/MaintenanceFormModal.tsx
```

- [ ] **Step 6: Run all tests**

```bash
npx vitest run --no-coverage
```

Expected: all tests pass (including the 2 new test files from Tasks 1 and 2)

- [ ] **Step 7: Final TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add src/app/dashboard/customers/[id]/page.tsx
git commit -m "feat(checklist): wire checklist modal and SystemChecklistManager into customer detail page; remove MaintenanceFormModal"
```

---

## Verification Checklist

After all tasks are complete, verify manually:

- [ ] Dashboard "Erledigt" button → opens 3-step modal, system type shown correctly
- [ ] Step 1: default items load, custom items appear with "Individuell" badge
- [ ] Step 1 → Step 2 → Step 3: navigation works in both directions
- [ ] Step 2: photos can be added and removed
- [ ] Step 3: summary shows correct counts, date defaults to today
- [ ] Submit: maintenance is created, modal closes, dashboard refetches
- [ ] Customer detail page: "Erledigt" button → same 3-step modal
- [ ] Customer detail page: "Checkliste verwalten" toggle appears on each system card
- [ ] Custom items: add → appears in list, delete → removed
- [ ] New custom items appear in Step 1 on next modal open
- [ ] Mobile: modal appears as bottom sheet (test with browser DevTools at 390px width)
- [ ] Photo upload: upload 1 photo, verify it appears in maintenance record
