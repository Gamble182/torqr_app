# Sprint 20 — Follow-Up Jobs & Installation Date Checkbox — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add follow-up jobs (Nachfolgeaufträge) that technicians can create during maintenance or on the system detail page, and a convenience checkbox that copies installation date to last maintenance date during system assignment.

**Architecture:** New `FollowUpJob` Prisma model with CRUD API routes following the existing `checklist-items` pattern. New React Query hook + UI component for the system detail page. Follow-up creation injected into the existing `MaintenanceChecklistModal` Step 2. Badge count added to customer detail system cards via Prisma `_count`. Installation date checkbox is pure client-side logic in `SystemAssignmentModal`.

**Tech Stack:** Next.js 14 App Router, Prisma, Zod, React Query (TanStack Query), shadcn/ui, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-04-21-sprint20-follow-ups-and-install-date-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `prisma/migrations/[timestamp]_add_follow_up_jobs/migration.sql` | Database migration for `follow_up_jobs` table |
| `src/app/api/systems/[id]/follow-ups/route.ts` | GET (list) + POST (create) follow-ups for a system |
| `src/app/api/follow-ups/[id]/route.ts` | PATCH (update) + DELETE (remove) individual follow-ups |
| `src/hooks/useFollowUpJobs.ts` | React Query hook — query + create/update/delete mutations |
| `src/components/FollowUpSection.tsx` | Follow-up list + inline add form for system detail page |

### Modified Files
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `FollowUpJob` model + relations |
| `src/lib/validations.ts` | Add `followUpJobCreateSchema` + `followUpJobUpdateSchema` |
| `src/app/api/customer-systems/route.ts` | Add `_count.followUpJobs` to GET include |
| `src/hooks/useCustomerSystems.ts` | Add `followUpJobs` to `_count` type |
| `src/app/dashboard/systems/[id]/page.tsx` | Render `<FollowUpSection />` |
| `src/components/MaintenanceChecklistModal.tsx` | Add follow-up creation section in Step 2 |
| `src/app/dashboard/customers/[id]/page.tsx` | Add amber badge for open follow-up count |
| `src/components/system-form/SystemAssignmentModal.tsx` | Add installation date checkbox |

---

### Task 1: Prisma Schema — Add FollowUpJob Model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the FollowUpJob model and update relations**

In `prisma/schema.prisma`, add a new section after the `MAINTENANCE CHECKLIST ITEMS` block (after line 205), before the `EMAIL AUTOMATION` block:

```prisma
// ============================================================================
// FOLLOW-UP JOBS (tasks discovered during maintenance)
// ============================================================================

model FollowUpJob {
  id            String    @id @default(cuid())
  label         String
  description   String?
  photos        String[]  @default([])
  completed     Boolean   @default(false)
  completedAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  system        CustomerSystem @relation(fields: [systemId], references: [id], onDelete: Cascade)
  systemId      String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId        String
  maintenance   Maintenance? @relation(fields: [maintenanceId], references: [id], onDelete: SetNull)
  maintenanceId String?

  @@index([systemId])
  @@index([userId])
  @@index([completed])
  @@map("follow_up_jobs")
}
```

Add `followUpJobs FollowUpJob[]` to three existing models:

In the `User` model (after the `bookings` relation):
```prisma
  followUpJobs    FollowUpJob[]
```

In the `CustomerSystem` model (after the `checklistItems` relation):
```prisma
  followUpJobs     FollowUpJob[]
```

In the `Maintenance` model (after the existing fields, before the closing `}`):
```prisma
  followUpJobs FollowUpJob[]
```

- [ ] **Step 2: Generate and apply the migration**

Run:
```bash
npx prisma migrate dev --name add_follow_up_jobs
```

Expected: migration creates `follow_up_jobs` table with all columns and indexes. Prisma Client regenerated.

- [ ] **Step 3: Verify Prisma Client generation**

Run:
```bash
npx prisma generate
```

Expected: no errors, `FollowUpJob` type available in generated client.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(schema): add FollowUpJob model with relations to User, CustomerSystem, Maintenance"
```

---

### Task 2: Zod Validation Schemas

**Files:**
- Modify: `src/lib/validations.ts`

- [ ] **Step 1: Add follow-up job schemas**

In `src/lib/validations.ts`, add a new section after the `CHECKLIST SCHEMAS` block (after line 275), before the `MAINTENANCE SCHEMAS` block:

```typescript
// ============================================================================
// FOLLOW-UP JOB SCHEMAS
// ============================================================================

export const followUpJobCreateSchema = z.object({
  label: z
    .string()
    .min(1, 'Bezeichnung erforderlich')
    .max(200, 'Bezeichnung zu lang (max. 200 Zeichen)')
    .trim(),
  description: z
    .string()
    .max(1000, 'Beschreibung zu lang (max. 1000 Zeichen)')
    .trim()
    .optional()
    .nullable(),
  photos: z
    .array(z.string().url())
    .max(10, 'Maximal 10 Fotos')
    .optional()
    .default([]),
  maintenanceId: z.string().optional().nullable(),
});

export const followUpJobUpdateSchema = z.object({
  label: z
    .string()
    .min(1, 'Bezeichnung erforderlich')
    .max(200, 'Bezeichnung zu lang (max. 200 Zeichen)')
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, 'Beschreibung zu lang (max. 1000 Zeichen)')
    .trim()
    .optional()
    .nullable(),
  photos: z
    .array(z.string().url())
    .max(10, 'Maximal 10 Fotos')
    .optional(),
  completed: z.boolean().optional(),
});
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/validations.ts
git commit -m "feat(validations): add followUpJobCreateSchema and followUpJobUpdateSchema"
```

---

### Task 3: API Route — GET + POST `/api/systems/[id]/follow-ups`

**Files:**
- Create: `src/app/api/systems/[id]/follow-ups/route.ts`

This route follows the exact same pattern as `src/app/api/systems/[id]/checklist-items/route.ts`.

- [ ] **Step 1: Create the route file**

Create `src/app/api/systems/[id]/follow-ups/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { followUpJobCreateSchema } from '@/lib/validations';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

async function verifySystemOwnership(systemId: string, userId: string) {
  return prisma.customerSystem.findFirst({
    where: { id: systemId, userId },
    select: { id: true },
  });
}

/**
 * GET /api/systems/[id]/follow-ups
 * Returns all follow-up jobs for a system, ordered by createdAt desc.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: systemId } = await params;

    const system = await verifySystemOwnership(systemId, userId);
    if (!system) {
      return NextResponse.json(
        { success: false, error: 'System nicht gefunden' },
        { status: 404 }
      );
    }

    const followUps = await prisma.followUpJob.findMany({
      where: { systemId, userId },
      orderBy: [{ completed: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ success: true, data: followUps });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/systems/[id]/follow-ups
 * Creates a follow-up job for a system.
 * Body: { label, description?, photos?, maintenanceId? }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();

    const rateLimitResponse = rateLimitByUser(req, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rateLimitResponse) return rateLimitResponse;

    const { id: systemId } = await params;

    const system = await verifySystemOwnership(systemId, userId);
    if (!system) {
      return NextResponse.json(
        { success: false, error: 'System nicht gefunden' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validated = followUpJobCreateSchema.parse(body);

    const followUp = await prisma.followUpJob.create({
      data: {
        label: validated.label,
        description: validated.description ?? null,
        photos: validated.photos ?? [],
        systemId,
        userId,
        maintenanceId: validated.maintenanceId ?? null,
      },
    });

    return NextResponse.json({ success: true, data: followUp }, { status: 201 });
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

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/systems/\[id\]/follow-ups/route.ts
git commit -m "feat(api): add GET + POST /api/systems/[id]/follow-ups"
```

---

### Task 4: API Route — PATCH + DELETE `/api/follow-ups/[id]`

**Files:**
- Create: `src/app/api/follow-ups/[id]/route.ts`

- [ ] **Step 1: Create the route file**

Create `src/app/api/follow-ups/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { followUpJobUpdateSchema } from '@/lib/validations';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

/**
 * PATCH /api/follow-ups/[id]
 * Updates a follow-up job (toggle complete, edit label/description).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();

    const rateLimitResponse = rateLimitByUser(req, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rateLimitResponse) return rateLimitResponse;

    const { id: followUpId } = await params;

    const existing = await prisma.followUpJob.findFirst({
      where: { id: followUpId, userId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Nachfolgeauftrag nicht gefunden' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validated = followUpJobUpdateSchema.parse(body);

    // Handle completedAt based on completed flag change
    const data: Record<string, unknown> = { ...validated };
    if (validated.completed !== undefined) {
      if (validated.completed && !existing.completed) {
        data.completedAt = new Date();
      } else if (!validated.completed && existing.completed) {
        data.completedAt = null;
      }
    }

    const updated = await prisma.followUpJob.update({
      where: { id: followUpId },
      data,
    });

    return NextResponse.json({ success: true, data: updated });
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

/**
 * DELETE /api/follow-ups/[id]
 * Deletes a follow-up job.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();

    const rateLimitResponse = rateLimitByUser(req, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rateLimitResponse) return rateLimitResponse;

    const { id: followUpId } = await params;

    const existing = await prisma.followUpJob.findFirst({
      where: { id: followUpId, userId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Nachfolgeauftrag nicht gefunden' },
        { status: 404 }
      );
    }

    await prisma.followUpJob.delete({ where: { id: followUpId } });

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

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/follow-ups/\[id\]/route.ts
git commit -m "feat(api): add PATCH + DELETE /api/follow-ups/[id]"
```

---

### Task 5: React Query Hook — useFollowUpJobs

**Files:**
- Create: `src/hooks/useFollowUpJobs.ts`

This follows the exact pattern of `src/hooks/useChecklistItems.ts` but with full CRUD.

- [ ] **Step 1: Create the hook file**

Create `src/hooks/useFollowUpJobs.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface FollowUpJob {
  id: string;
  label: string;
  description: string | null;
  photos: string[];
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  systemId: string;
  maintenanceId: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function useFollowUpJobs(systemId: string) {
  return useQuery<FollowUpJob[]>({
    queryKey: ['follow-up-jobs', systemId],
    queryFn: async () => {
      const res = await fetch(`/api/systems/${systemId}/follow-ups`);
      const result: ApiResponse<FollowUpJob[]> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden der Nachfolgeaufträge');
      }
      return result.data;
    },
    staleTime: 30_000,
  });
}

export function useCreateFollowUpJob(systemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      label: string;
      description?: string | null;
      maintenanceId?: string | null;
    }): Promise<FollowUpJob> => {
      const res = await fetch(`/api/systems/${systemId}/follow-ups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result: ApiResponse<FollowUpJob> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Erstellen');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-jobs', systemId] });
      queryClient.invalidateQueries({ queryKey: ['customer-systems'] });
      toast.success('Nachfolgeauftrag erstellt');
    },
    onError: (error: Error) => toast.error(`Fehler: ${error.message}`),
  });
}

export function useUpdateFollowUpJob(systemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      label?: string;
      description?: string | null;
      completed?: boolean;
    }): Promise<FollowUpJob> => {
      const res = await fetch(`/api/follow-ups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result: ApiResponse<FollowUpJob> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Aktualisieren');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-jobs', systemId] });
      queryClient.invalidateQueries({ queryKey: ['customer-systems'] });
    },
    onError: (error: Error) => toast.error(`Fehler: ${error.message}`),
  });
}

export function useDeleteFollowUpJob(systemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (followUpId: string): Promise<void> => {
      const res = await fetch(`/api/follow-ups/${followUpId}`, {
        method: 'DELETE',
      });
      const result: ApiResponse<null> = await res.json();
      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Löschen');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-jobs', systemId] });
      queryClient.invalidateQueries({ queryKey: ['customer-systems'] });
      toast.success('Nachfolgeauftrag gelöscht');
    },
    onError: (error: Error) => toast.error(`Fehler: ${error.message}`),
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useFollowUpJobs.ts
git commit -m "feat(hooks): add useFollowUpJobs with CRUD mutations"
```

---

### Task 6: FollowUpSection Component + System Detail Page Integration

**Files:**
- Create: `src/components/FollowUpSection.tsx`
- Modify: `src/app/dashboard/systems/[id]/page.tsx`

- [ ] **Step 1: Create the FollowUpSection component**

Create `src/components/FollowUpSection.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  PlusIcon,
  TrashIcon,
  Loader2Icon,
  CheckCircle2Icon,
  CircleIcon,
  WrenchIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useFollowUpJobs,
  useCreateFollowUpJob,
  useUpdateFollowUpJob,
  useDeleteFollowUpJob,
} from '@/hooks/useFollowUpJobs';

interface FollowUpSectionProps {
  systemId: string;
}

export function FollowUpSection({ systemId }: FollowUpSectionProps) {
  const { data: followUps = [], isLoading } = useFollowUpJobs(systemId);
  const createFollowUp = useCreateFollowUpJob(systemId);
  const updateFollowUp = useUpdateFollowUpJob(systemId);
  const deleteFollowUp = useDeleteFollowUpJob(systemId);

  const [newLabel, setNewLabel] = useState('');

  const openCount = followUps.filter((f) => !f.completed).length;

  const handleAdd = async () => {
    const label = newLabel.trim();
    if (!label) return;
    await createFollowUp.mutateAsync({ label });
    setNewLabel('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleToggle = (id: string, currentlyCompleted: boolean) => {
    updateFollowUp.mutate({ id, completed: !currentlyCompleted });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Nachfolgeauftrag wirklich löschen?')) return;
    deleteFollowUp.mutate(id);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <WrenchIcon className="h-4 w-4 text-muted-foreground" />
          Nachfolgeaufträge
          {openCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-status-due-bg text-warning-foreground border border-warning/20">
              {openCount} offen
            </span>
          )}
        </h2>
      </div>

      {/* Inline add form */}
      <div className="flex gap-2">
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Neuen Nachfolgeauftrag hinzufügen…"
          maxLength={200}
          className="flex-1"
          disabled={createFollowUp.isPending}
        />
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!newLabel.trim() || createFollowUp.isPending}
        >
          {createFollowUp.isPending ? (
            <Loader2Icon className="h-4 w-4 animate-spin" />
          ) : (
            <PlusIcon className="h-4 w-4" />
          )}
          Hinzufügen
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : followUps.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Keine Nachfolgeaufträge vorhanden.
        </p>
      ) : (
        <ul className="space-y-2">
          {followUps.map((item) => (
            <li
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                item.completed
                  ? 'border-border bg-muted/30'
                  : 'border-border bg-card hover:bg-muted/50'
              }`}
            >
              <button
                type="button"
                onClick={() => handleToggle(item.id, item.completed)}
                className="mt-0.5 shrink-0"
                disabled={updateFollowUp.isPending}
              >
                {item.completed ? (
                  <CheckCircle2Icon className="h-5 w-5 text-success" />
                ) : (
                  <CircleIcon className="h-5 w-5 text-muted-foreground/40 hover:text-primary transition-colors" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    item.completed
                      ? 'line-through text-muted-foreground'
                      : 'text-foreground'
                  }`}
                >
                  {item.label}
                </p>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {format(new Date(item.createdAt), 'dd. MMM yyyy', { locale: de })}
                  {item.completed && item.completedAt && (
                    <> · Erledigt am {format(new Date(item.completedAt), 'dd. MMM yyyy', { locale: de })}</>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-status-overdue-bg transition-colors"
                disabled={deleteFollowUp.isPending}
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add FollowUpSection to the system detail page**

In `src/app/dashboard/systems/[id]/page.tsx`:

Add the import at the top (after the `MaintenanceHistory` import on line 22):
```typescript
import { FollowUpSection } from '@/components/FollowUpSection';
```

Add the component between the maintenance section heading and `<MaintenanceHistory>`. Find this block (around line 150–166):

```typescript
      {/* Maintenance section */}
      <div className="flex justify-between items-center">
        <h2 className="text-base font-semibold text-foreground">Wartungshistorie</h2>
```

Insert `<FollowUpSection>` **before** that block:

```typescript
      {/* Follow-up jobs */}
      <FollowUpSection systemId={systemId} />

      {/* Maintenance section */}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/FollowUpSection.tsx src/app/dashboard/systems/\[id\]/page.tsx
git commit -m "feat(ui): add FollowUpSection component on system detail page"
```

---

### Task 7: Follow-Up Creation in MaintenanceChecklistModal

**Files:**
- Modify: `src/components/MaintenanceChecklistModal.tsx`

This adds a lightweight follow-up creation section inside Step 2 (Notizen & Fotos), after the photos area. Follow-ups are stored in local state during the flow, then created via API after the maintenance is saved.

- [ ] **Step 1: Add follow-up state and UI to the modal**

In `src/components/MaintenanceChecklistModal.tsx`:

**Add imports** — at the top, after the existing lucide imports (line 20), add:
```typescript
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
```

**Add state** — after `const [uploadingPhotos, setUploadingPhotos] = useState(false);` (line 54), add:
```typescript
  const [followUps, setFollowUps] = useState<Array<{ label: string; description: string }>>([]);
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [newFollowUpLabel, setNewFollowUpLabel] = useState('');
  const [newFollowUpDesc, setNewFollowUpDesc] = useState('');
```

**Add follow-up helper functions** — after the `removePhoto` function (after line 107), add:
```typescript
  const addFollowUp = () => {
    const label = newFollowUpLabel.trim();
    if (!label) return;
    setFollowUps((prev) => [...prev, { label, description: newFollowUpDesc.trim() }]);
    setNewFollowUpLabel('');
    setNewFollowUpDesc('');
  };

  const removeFollowUp = (index: number) => {
    setFollowUps((prev) => prev.filter((_, i) => i !== index));
  };
```

**Modify handleSubmit** — the current `handleSubmit` (line 109) ends with a `result.success` check. Replace the success block. Find this code:

```typescript
      const result = await res.json();
      if (result.success) {
        toast.success('Wartung erfolgreich eingetragen!');
        onSuccess();
      } else {
```

Replace it with:

```typescript
      const result = await res.json();
      if (result.success) {
        // Create follow-up jobs if any were added
        if (followUps.length > 0 && result.data?.id) {
          try {
            await Promise.all(
              followUps.map((fu) =>
                fetch(`/api/systems/${systemId}/follow-ups`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    label: fu.label,
                    description: fu.description || null,
                    maintenanceId: result.data.id,
                  }),
                })
              )
            );
          } catch {
            toast.error('Wartung gespeichert, aber Fehler beim Erstellen der Nachfolgeaufträge');
          }
        }
        toast.success('Wartung erfolgreich eingetragen!');
        onSuccess();
      } else {
```

**Add follow-up UI in Step 2** — find the end of the photos section in Step 2. Look for this line (around line 350):

```typescript
                <p className="mt-1 text-xs text-muted-foreground">
                  JPEG, PNG oder WebP &middot; Max. 5MB pro Foto
                </p>
              </div>
            </div>
          )}
```

After the closing `</div>` of the photos section and before the closing `</div>` and `)}` of Step 2, insert:

```typescript
              {/* Follow-up jobs section */}
              <div className="border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setShowFollowUps(!showFollowUps)}
                  className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors w-full"
                >
                  {showFollowUps ? (
                    <ChevronUpIcon className="h-4 w-4" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4" />
                  )}
                  Nachfolgeauftrag hinzufügen?
                  {followUps.length > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-status-due-bg text-warning-foreground border border-warning/20">
                      {followUps.length}
                    </span>
                  )}
                </button>

                {showFollowUps && (
                  <div className="mt-3 space-y-3">
                    {followUps.length > 0 && (
                      <ul className="space-y-2">
                        {followUps.map((fu, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {fu.label}
                              </p>
                              {fu.description && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {fu.description}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFollowUp(i)}
                              className="shrink-0 p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="space-y-2">
                      <Input
                        value={newFollowUpLabel}
                        onChange={(e) => setNewFollowUpLabel(e.target.value)}
                        placeholder="z.B. Wasserfilter erneuern"
                        maxLength={200}
                        className="text-base"
                      />
                      <Textarea
                        value={newFollowUpDesc}
                        onChange={(e) => setNewFollowUpDesc(e.target.value)}
                        placeholder="Beschreibung (optional)"
                        rows={2}
                        maxLength={1000}
                        className="resize-none text-base"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addFollowUp}
                        disabled={!newFollowUpLabel.trim()}
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                        Hinzufügen
                      </Button>
                    </div>
                  </div>
                )}
              </div>
```

**Add missing icon imports** — ensure `PlusIcon` is imported. Check the existing imports at the top. If `PlusIcon` is not already imported from lucide-react, add it to the import list. The existing imports include `TrashIcon` already.

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/MaintenanceChecklistModal.tsx
git commit -m "feat(ui): add follow-up creation section in MaintenanceChecklistModal step 2"
```

---

### Task 8: Badge on Customer Detail Page + _count in API

**Files:**
- Modify: `src/app/api/customer-systems/route.ts`
- Modify: `src/hooks/useCustomerSystems.ts`
- Modify: `src/app/dashboard/customers/[id]/page.tsx`

- [ ] **Step 1: Add _count.followUpJobs to the customer-systems API**

In `src/app/api/customer-systems/route.ts`, find the `_count` in the include block (line 51):

```typescript
        _count: { select: { maintenances: true } },
```

Replace with:

```typescript
        _count: { select: { maintenances: true, followUpJobs: { where: { completed: false } } } },
```

- [ ] **Step 2: Update the CustomerSystem interface in the hook**

In `src/hooks/useCustomerSystems.ts`, find line 27:

```typescript
  _count?: { maintenances: number };
```

Replace with:

```typescript
  _count?: { maintenances: number; followUpJobs?: number };
```

- [ ] **Step 3: Add the amber badge to customer detail page system cards**

In `src/app/dashboard/customers/[id]/page.tsx`, find the system card badges area. Look for this block inside the system card (around line 347–370), specifically after the maintenance status badges (the last one ending around `OK</span>`):

After the closing of the last maintenance status badge `{maintenanceStatus === 'ok' && system.nextMaintenance && (` block (line 366–369):

```typescript
                            {maintenanceStatus === 'ok' && system.nextMaintenance && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-status-ok-bg text-success border border-success/20">
                                <CheckCircle2Icon className="h-3 w-3" />
                                OK
                              </span>
                            )}
```

Add immediately after that block:

```typescript
                            {(system._count?.followUpJobs ?? 0) > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-status-due-bg text-warning-foreground border border-warning/20">
                                <WrenchIcon className="h-3 w-3" />
                                {system._count!.followUpJobs} offen
                              </span>
                            )}
```

Note: `WrenchIcon` is already imported in this file (line 27).

- [ ] **Step 4: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/customer-systems/route.ts src/hooks/useCustomerSystems.ts src/app/dashboard/customers/\[id\]/page.tsx
git commit -m "feat(ui): add open follow-up badge on customer detail page system cards"
```

---

### Task 9: Installation Date Checkbox in SystemAssignmentModal

**Files:**
- Modify: `src/components/system-form/SystemAssignmentModal.tsx`

- [ ] **Step 1: Add the checkbox state and sync logic**

In `src/components/system-form/SystemAssignmentModal.tsx`:

**Add import** — after the existing imports at the top, add to the lucide import (line 4):

The existing line 4 is:
```typescript
import { XIcon, Loader2Icon } from 'lucide-react';
```

Replace with:
```typescript
import { XIcon, Loader2Icon, CheckIcon } from 'lucide-react';
```

**Add state** — after the `lastMaintenance` state (line 50–52), add:

```typescript
  const [copyInstallDate, setCopyInstallDate] = useState(false);
  const [savedLastMaintenance, setSavedLastMaintenance] = useState('');
```

**Add toggle handler** — after the `handleCatalogChange` function (line 54–56), add:

```typescript
  const handleCopyInstallDateToggle = (checked: boolean) => {
    if (checked) {
      setSavedLastMaintenance(lastMaintenance);
      setLastMaintenance(installationDate);
    } else {
      setLastMaintenance(savedLastMaintenance);
    }
    setCopyInstallDate(checked);
  };

  // Keep lastMaintenance in sync when installationDate changes while checkbox is checked
  const handleInstallationDateChange = (value: string) => {
    setInstallationDate(value);
    if (copyInstallDate) {
      setLastMaintenance(value);
    }
  };
```

**Update installationDate input** — find the `installationDate` Input (around line 132–139):

```typescript
              <div className="space-y-2">
                <Label htmlFor="installationDate">Installationsdatum (optional)</Label>
                <Input
                  id="installationDate"
                  type="date"
                  value={installationDate}
                  onChange={(e) => setInstallationDate(e.target.value)}
                />
              </div>
```

Replace with:

```typescript
              <div className="space-y-2">
                <Label htmlFor="installationDate">Installationsdatum (optional)</Label>
                <Input
                  id="installationDate"
                  type="date"
                  value={installationDate}
                  onChange={(e) => handleInstallationDateChange(e.target.value)}
                />
              </div>

              {installationDate && (
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div
                    className={`flex items-center justify-center w-4.5 h-4.5 rounded border-2 transition-colors ${
                      copyInstallDate
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground/40 group-hover:border-primary/60'
                    }`}
                  >
                    {copyInstallDate && <CheckIcon className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    Einbaudatum als letztes Wartungsdatum übernehmen
                  </span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={copyInstallDate}
                    onChange={(e) => handleCopyInstallDateToggle(e.target.checked)}
                  />
                </label>
              )}
```

**Disable lastMaintenance input when checkbox is active** — find the `lastMaintenance` Input (around line 156–163):

```typescript
              <div className="space-y-2">
                <Label htmlFor="lastMaintenance">Letzte Wartung (optional)</Label>
                <Input
                  id="lastMaintenance"
                  type="date"
                  value={lastMaintenance}
                  onChange={(e) => setLastMaintenance(e.target.value)}
                />
              </div>
```

Replace with:

```typescript
              <div className="space-y-2">
                <Label htmlFor="lastMaintenance">Letzte Wartung (optional)</Label>
                <Input
                  id="lastMaintenance"
                  type="date"
                  value={lastMaintenance}
                  onChange={(e) => setLastMaintenance(e.target.value)}
                  disabled={copyInstallDate}
                  className={copyInstallDate ? 'opacity-60' : ''}
                />
              </div>
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/system-form/SystemAssignmentModal.tsx
git commit -m "feat(ui): add 'copy installation date to last maintenance' checkbox (#32)"
```

---

### Task 10: Update Backlog

**Files:**
- Modify: `docs/BACKLOG.md`

- [ ] **Step 1: Move #27 and #32 to completed**

Read `docs/BACKLOG.md`, then:
- Move item #27 (Nachfolgeaufträge / Follow-up jobs) from the open items table to the completed table with resolved date `2026-04-21`
- Move item #32 (Installation date = maintenance date checkbox) from the open items table to the completed table with resolved date `2026-04-21`

- [ ] **Step 2: Commit**

```bash
git add docs/BACKLOG.md
git commit -m "docs: mark #27 and #32 as completed in backlog"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Prisma schema — FollowUpJob model | `prisma/schema.prisma`, migration |
| 2 | Zod validation schemas | `src/lib/validations.ts` |
| 3 | API: GET + POST follow-ups | `src/app/api/systems/[id]/follow-ups/route.ts` |
| 4 | API: PATCH + DELETE follow-ups | `src/app/api/follow-ups/[id]/route.ts` |
| 5 | React Query hook | `src/hooks/useFollowUpJobs.ts` |
| 6 | FollowUpSection component + system detail integration | `src/components/FollowUpSection.tsx`, system detail page |
| 7 | Follow-up creation in checklist modal | `src/components/MaintenanceChecklistModal.tsx` |
| 8 | Badge on customer detail + _count in API | customer-systems API, hook, customer detail page |
| 9 | Installation date checkbox | `src/components/system-form/SystemAssignmentModal.tsx` |
| 10 | Update backlog | `docs/BACKLOG.md` |
