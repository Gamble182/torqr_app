# Sprint 20 — Follow-Up Jobs & Installation Date Checkbox Design Spec

**Date:** 2026-04-21
**Features:** Backlog #27 (follow-up jobs / Nachfolgeaufträge), #32 (installation date = maintenance date checkbox)
**Author:** brainstorming session

---

## Goal

Two changes:

1. **Follow-up jobs (Nachfolgeaufträge)** — tasks discovered during maintenance (e.g. "Wasserfilter erneuern") that the technician can add during the checklist flow AND manage on the system detail page. Simple checkbox completion. Visible as badges on the customer detail page.
2. **Installation date checkbox** — in the system assignment modal, a checkbox that copies the installation date into the last maintenance date field. Pure UX convenience, no backend changes.

---

## Feature 1: Follow-Up Jobs (#27)

### Schema Change

New model in `prisma/schema.prisma`:

```prisma
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

Relations to add:
- `User` model: add `followUpJobs FollowUpJob[]`
- `CustomerSystem` model: add `followUpJobs FollowUpJob[]`
- `Maintenance` model: add `followUpJobs FollowUpJob[]`

Migration: add table `follow_up_jobs` with indexes. Zero impact on existing data.

### Validation (Zod)

In `src/lib/validations.ts`:

```typescript
export const followUpJobCreateSchema = z.object({
  label: z.string().min(1, 'Bezeichnung erforderlich').max(200, 'Bezeichnung zu lang (max. 200 Zeichen)').trim(),
  description: z.string().max(1000, 'Beschreibung zu lang (max. 1000 Zeichen)').trim().optional().nullable(),
  photos: z.array(z.string().url()).max(10, 'Maximal 10 Fotos').optional().default([]),
  maintenanceId: z.string().optional().nullable(),
});

export const followUpJobUpdateSchema = z.object({
  label: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(1000).trim().optional().nullable(),
  photos: z.array(z.string().url()).max(10).optional(),
  completed: z.boolean().optional(),
});
```

### API Routes

**`GET /api/systems/[id]/follow-ups`** — list all follow-ups for a system
- `requireAuth()` → verify system belongs to user → query `FollowUpJob` where `systemId` and `userId`
- Returns: `{ success: true, data: FollowUpJob[] }` ordered by `createdAt desc`

**`POST /api/systems/[id]/follow-ups`** — create a follow-up
- `requireAuth()` → verify system belongs to user → validate body with `followUpJobCreateSchema` → create
- `completedAt` is not accepted from client — set server-side when `completed` changes
- Returns: `{ success: true, data: FollowUpJob }`

**`PATCH /api/follow-ups/[id]`** — update a follow-up (toggle done, edit label/description)
- `requireAuth()` → verify follow-up belongs to user → validate body with `followUpJobUpdateSchema` → update
- If `completed` changes to `true`: set `completedAt = new Date()`
- If `completed` changes to `false`: set `completedAt = null`
- Returns: `{ success: true, data: FollowUpJob }`

**`DELETE /api/follow-ups/[id]`** — remove a follow-up
- `requireAuth()` → verify follow-up belongs to user → delete
- Returns: `{ success: true }`

All routes follow existing pattern: `requireAuth()` → userId scoping → Zod validation → Prisma query → consistent response shape.

### React Query Hook

New file: `src/hooks/useFollowUpJobs.ts`

```typescript
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
```

Exports:
- `useFollowUpJobs(systemId)` — query, returns `FollowUpJob[]`
- `useCreateFollowUpJob(systemId)` — mutation, POST
- `useUpdateFollowUpJob()` — mutation, PATCH
- `useDeleteFollowUpJob()` — mutation, DELETE

All mutations invalidate `['follow-up-jobs', systemId]` on success. The update and delete mutations also invalidate `['customer-systems']` to refresh badge counts.

Standard toast pattern: success toast on create/complete/delete, error toast on failure.

### UI: Follow-Up Section on System Detail Page

New component: `src/components/FollowUpSection.tsx`

Rendered on `/dashboard/systems/[id]/page.tsx` between the maintenance history heading and the `<MaintenanceHistory />` component.

**Layout:**
- Card with header "Nachfolgeaufträge" and count badge
- Inline add form: text input for label + "Hinzufügen" button
- List of items, open items first, completed items below (muted/strikethrough)
- Each item shows:
  - Checkbox (toggle completed)
  - Label (bold)
  - Description (muted, if present)
  - Created date (small, muted)
  - Delete button (icon, with confirm)
- Empty state: "Keine Nachfolgeaufträge vorhanden."
- Completed items can be toggled back to open (undo)

### UI: Follow-Up Creation in Maintenance Checklist Modal

In `MaintenanceChecklistModal.tsx`, Step 2 (Notizen & Fotos), add a section below the photos area:

**"Nachfolgeauftrag hinzufügen?" section:**
- Collapsible section, default collapsed
- When expanded: repeater with text input for label + optional description textarea + "+" button to add another
- Items are stored in local state as `Array<{ label: string; description?: string }>`
- On maintenance submit (`handleSubmit`): after the maintenance is created and we have the maintenance ID from the API response, create follow-up jobs via POST calls to `/api/systems/[id]/follow-ups` with `maintenanceId` set
- The follow-up creation happens after the maintenance is saved — if follow-up creation fails, the maintenance is still saved (the follow-ups can be added manually later)

### UI: Badge on Customer Detail Page

On `/dashboard/customers/[id]/page.tsx`, in the system cards within the "Systeme" section:

- Add a small amber badge next to the system name showing the count of open (not completed) follow-up jobs
- Badge format: amber pill with wrench icon + count, e.g. "2 offen"
- Only shown when count > 0
- Data: extend the `useCustomerSystems` query to include `_count: { followUpJobs: { where: { completed: false } } }` — this requires modifying the GET `/api/customer-systems` endpoint to include the count

### Changes to Existing API

**`GET /api/customer-systems`** — add to the Prisma include:
```typescript
_count: {
  select: {
    followUpJobs: { where: { completed: false } }
  }
}
```

**`GET /api/systems/[id]`** — no change needed (follow-ups loaded separately via their own hook)

---

## Feature 2: Installation Date Checkbox (#32)

### Changes

**File:** `src/components/system-form/SystemAssignmentModal.tsx`

**New state:**
```typescript
const [copyInstallDate, setCopyInstallDate] = useState(false);
```

**UI addition** — between the `installationDate` input and the `maintenanceInterval` select:

```
☐ Einbaudatum als letztes Wartungsdatum übernehmen
```

A checkbox using the existing shadcn `Checkbox` component (or a simple HTML checkbox styled with Tailwind).

**Behavior:**
- When checked: copy `installationDate` value into `lastMaintenance` state, disable the `lastMaintenance` input
- When unchecked: re-enable `lastMaintenance` input, restore previous value (store in a ref before overwriting)
- If `installationDate` changes while checkbox is checked: update `lastMaintenance` to match
- Only visible when `installationDate` has a value
- In edit mode: checkbox starts unchecked (user can toggle if desired)

**No backend changes.** The payload already includes both `installationDate` and `lastMaintenance` — the checkbox just syncs them client-side.

---

## Files Changed

### New Files
| File | Purpose |
|------|---------|
| `prisma/migrations/[timestamp]_add_follow_up_jobs/migration.sql` | Create `follow_up_jobs` table |
| `src/app/api/systems/[id]/follow-ups/route.ts` | GET + POST for system follow-ups |
| `src/app/api/follow-ups/[id]/route.ts` | PATCH + DELETE for individual follow-ups |
| `src/hooks/useFollowUpJobs.ts` | React Query hook for follow-up CRUD |
| `src/components/FollowUpSection.tsx` | Follow-up list + inline add on system detail page |

### Modified Files
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `FollowUpJob` model + relations on User, CustomerSystem, Maintenance |
| `src/lib/validations.ts` | Add `followUpJobCreateSchema` and `followUpJobUpdateSchema` |
| `src/app/dashboard/systems/[id]/page.tsx` | Add `<FollowUpSection />` |
| `src/components/MaintenanceChecklistModal.tsx` | Add follow-up creation section in Step 2 |
| `src/app/dashboard/customers/[id]/page.tsx` | Add amber badge for open follow-up count on system cards |
| `src/app/api/customer-systems/route.ts` | Add `_count` for open follow-ups to GET query |
| `src/hooks/useCustomerSystems.ts` | Add `_count.followUpJobs` to `CustomerSystem` interface |
| `src/components/system-form/SystemAssignmentModal.tsx` | Add installation date checkbox |

### No Changes Needed
- `src/lib/email/service.tsx` — follow-ups don't affect emails
- `src/app/api/cron/*` — no cron impact
- `src/app/api/maintenances/route.ts` — maintenance creation unchanged, follow-ups created separately after
