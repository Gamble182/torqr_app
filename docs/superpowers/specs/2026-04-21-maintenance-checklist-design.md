# Digital Maintenance Checklist — Design Spec

**Date:** 2026-04-21
**Feature:** Sprint 18 — Backlog item #35
**Author:** brainstorming session

---

## Goal

Replace the simple `MaintenanceFormModal` (date + notes + photos) with a 3-step `MaintenanceChecklistModal` that guides a technician through a per-system-type checklist on mobile, followed by optional notes and photos, and a confirmation step that saves the maintenance record. Custom checklist items can be managed per `CustomerSystem` on the customer detail page.

## Architecture

**Approach B:** hardcoded default items per system type (TypeScript constants) + relational `CustomerSystemChecklistItem` table for per-system custom items + immutable JSON snapshot on `Maintenance.checklistData` at save time.

- Default items: TypeScript constants — no DB seeding, no migrations needed for additions
- Custom items: proper DB entities so they can be added/deleted cleanly via API
- Completed state: JSON snapshot decoupled from future item changes — maintenance history never drifts

## Tech Stack

Next.js 14 App Router, TypeScript strict, Prisma ORM, Supabase PostgreSQL, React Query (TanStack Query v5), Zod, shadcn/ui, Tailwind CSS, sonner (toasts).

---

## Data Model

### New Prisma Model

```prisma
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

### Modified: `CustomerSystem`

Add relation:
```prisma
checklistItems CustomerSystemChecklistItem[]
```

### Modified: `Maintenance`

Add field:
```prisma
checklistData Json?   // null on records created before this feature
```

### `checklistData` JSON Shape

Captured at the moment the technician confirms. Immutable after creation — never back-references `CustomerSystemChecklistItem` IDs.

```typescript
// TypeScript type (lives in src/types/checklist.ts)
export type ChecklistItemSnapshot = {
  label: string;
  checked: boolean;
  isCustom: boolean;  // true = came from CustomerSystemChecklistItem
};

export type ChecklistSnapshot = {
  items: ChecklistItemSnapshot[];
  confirmedAt: string;  // ISO 8601
};
```

---

## Default Checklist Items

**File:** `src/lib/checklist-defaults.ts`

Hardcoded constant — no DB involvement. Covers all four system types.

```typescript
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

Unknown system types → empty array (no crash).

---

## Zod Schemas (additions to `src/lib/validations.ts`)

```typescript
// Checklist item in the snapshot
export const checklistItemSnapshotSchema = z.object({
  label: z.string().min(1).max(200),
  checked: z.boolean(),
  isCustom: z.boolean(),
});

// Full snapshot stored on Maintenance.checklistData
export const checklistSnapshotSchema = z.object({
  items: z.array(checklistItemSnapshotSchema),
  confirmedAt: z.string().datetime(),
});

// Extended maintenance create schema (replaces maintenanceCreateSchema)
// checklistData is optional so old API callers still work
export const maintenanceCreateSchema = z.object({
  systemId: uuidSchema,
  date: dateStringSchema.optional(),
  notes: z.string().max(2000).optional().or(z.literal('')),
  photos: z.array(z.string().url()).max(10).optional(),
  checklistData: checklistSnapshotSchema.optional().nullable(),
});

// Custom checklist item creation
export const checklistItemCreateSchema = z.object({
  label: z.string().min(1, 'Bezeichnung ist erforderlich').max(200, 'Bezeichnung zu lang').trim(),
});
```

---

## API Routes

All three new system routes follow the established pattern: `requireAuth()` first, then `rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER)`, then ownership check, then execute.

### GET `/api/systems/[id]/checklist-items`

Returns all custom checklist items for a system, ordered by `sortOrder ASC, createdAt ASC`.

**Ownership:** Verify `customerSystem.userId === auth.userId` via `prisma.customerSystem.findFirst({ where: { id, userId } })`. Return 404 if not found.

**Response:** `{ success: true, data: ChecklistItem[] }` where `ChecklistItem = { id, label, sortOrder, createdAt }`.

### POST `/api/systems/[id]/checklist-items`

Adds a custom checklist item to the system.

**Body:** `{ label: string }` — validated with `checklistItemCreateSchema`.

**Ownership:** Same check as GET.

**sortOrder:** Query `prisma.customerSystemChecklistItem.aggregate({ where: { customerSystemId }, _max: { sortOrder: true } })` and set `sortOrder = (max ?? -1) + 1`.

**Response:** `{ success: true, data: ChecklistItem }`, status 201.

### DELETE `/api/systems/[id]/checklist-items/[itemId]`

Deletes a custom checklist item.

**Ownership:** Verify via `prisma.customerSystemChecklistItem.findFirst({ where: { id: itemId, customerSystem: { id: systemId, userId } } })`. Return 404 if not found.

**Response:** `{ success: true }`, status 200.

### POST `/api/maintenances` — extended

Accepts `checklistData` in the request body (optional, nullable). Passes through to `tx.maintenance.create({ data: { ..., checklistData: validatedData.checklistData ?? undefined } })`. No other changes to this route.

---

## `useChecklistItems` Hook

**File:** `src/hooks/useChecklistItems.ts`

```typescript
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
    mutationFn: async (label: string) => {
      const res = await fetch(`/api/systems/${systemId}/checklist-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Fehler beim Hinzufügen');
      return result.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checklist-items', systemId] }),
  });
}

export function useDeleteChecklistItem(systemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/systems/${systemId}/checklist-items/${itemId}`, { method: 'DELETE' });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Fehler beim Löschen');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checklist-items', systemId] }),
  });
}
```

---

## `MaintenanceChecklistModal` — UI Component

**File:** `src/components/MaintenanceChecklistModal.tsx`

Replaces `MaintenanceFormModal` entirely at all call sites.

### Props

```typescript
interface MaintenanceChecklistModalProps {
  systemId: string;
  systemLabel: string;
  systemType: string;  // 'HEATING' | 'AC' | 'WATER_TREATMENT' | 'ENERGY_STORAGE'
  onClose: () => void;
  onSuccess: () => void;
}
```

### Parent State Change (both call sites)

```typescript
// Before (in dashboard/page.tsx and customers/[id]/page.tsx):
const [selectedSystem, setSelectedSystem] = useState<{
  id: string;
  label: string;
} | null>(null);

// After:
const [selectedSystem, setSelectedSystem] = useState<{
  id: string;
  label: string;
  systemType: string;
} | null>(null);
```

`systemType` is available as `system.catalog.systemType` in both parent data structures.

### Internal State

```typescript
type ChecklistEntry = {
  label: string;
  checked: boolean;
  isCustom: boolean;
};

const [step, setStep] = useState<1 | 2 | 3>(1);
const [entries, setEntries] = useState<ChecklistEntry[]>([]);  // built on mount
const [notes, setNotes] = useState('');
const [photos, setPhotos] = useState<File[]>([]);
const [date, setDate] = useState(today);  // ISO date string, defaults to today
const [loading, setLoading] = useState(false);
const [uploadingPhotos, setUploadingPhotos] = useState(false);
```

### Initialization

On mount, merge defaults + custom items:

```typescript
const { data: customItems } = useChecklistItems(systemId);

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
```

### Layout — Mobile First

Outer container: `fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50`

Inner card: `bg-card w-full sm:max-w-lg sm:rounded-xl rounded-t-xl max-h-[92vh] sm:max-h-[85vh] flex flex-col`

- Bottom sheet on mobile (slides up from bottom edge)
- Centered dialog on desktop

### Step Indicator

Three numbered dots at top of modal:
```tsx
<div className="flex items-center justify-center gap-2 py-3 border-b border-border">
  {[1, 2, 3].map((s) => (
    <div key={s} className={`w-2 h-2 rounded-full transition-colors ${
      s === step ? 'bg-primary' : s < step ? 'bg-primary/40' : 'bg-muted'
    }`} />
  ))}
</div>
```

### Step 1 — Checkliste

- Header: `{systemLabel}` bold, "Wartungscheckliste" subtitle
- Progress counter: `"{checkedCount} / {entries.length} Punkte erledigt"`
- Scrollable list of entries (defaults first, then custom items)
- Each item: full-width button/row, min-height 52px, checkbox left + label right
- Custom items get a small `"Individuell"` badge (muted style, right-aligned)
- "Weiter →" button always enabled (partial checklists are fine — technician notes uncompleted items)

### Step 2 — Notizen & Fotos

- Optional `<Textarea>` for notes, `placeholder="z.B. Filter gewechselt, Druck geprüft..."`, `rows={4}`, max 2000 chars
- Photo section: identical to existing `MaintenanceFormModal` — `File[]` state, preview grid, camera icon upload button, max 5 photos, 5MB each
- "← Zurück" and "Weiter →" navigation

### Step 3 — Abschließen

- Date picker input (type="date"), defaults to today, `max={today}`
- Summary card:
  - Total items: X von Y erledigt
  - List of **unchecked** items (if any) as a warning reminder (not blocking)
- "← Zurück" button
- "Wartung abschließen" primary button — triggers `handleSubmit()`

### Submit Flow

Mirrors existing `MaintenanceFormModal` submit:

```typescript
const handleSubmit = async () => {
  setLoading(true);
  try {
    // 1. Upload photos (if any) — same temp ID approach as existing modal
    let uploadedUrls: string[] = [];
    if (photos.length > 0) {
      setUploadingPhotos(true);
      const tempId = `temp-${Date.now()}`;
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
      setUploadingPhotos(false);
    }

    // 2. Build checklist snapshot
    const checklistData: ChecklistSnapshot = {
      items: entries,
      confirmedAt: new Date().toISOString(),
    };

    // 3. Create maintenance
    const res = await fetch('/api/maintenances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemId,
        date: new Date(date).toISOString(),
        notes: notes || null,
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
  } catch (err) {
    toast.error('Fehler beim Speichern der Wartung');
  } finally {
    setLoading(false);
    setUploadingPhotos(false);
  }
};
```

### Photo Upload API — Compatibility Check

**Important:** The existing `POST /api/upload/photo` was updated in Sprint 17 to check `maintenanceId` ownership via `prisma.maintenance.findFirst({ where: { id: maintenanceId, userId } })`. The existing `MaintenanceFormModal` passes `temp-${Date.now()}` as the `maintenanceId`, which is not a UUID — this lookup would return null.

Before implementing the new modal, **check the current `/api/upload/photo` route:**

- If it returns 404 when maintenance is not found → it's broken for temp IDs. Fix: make the check conditional — only run the ownership lookup if `maintenanceId` is a valid UUID format (use a regex or `z.string().uuid().safeParse(maintenanceId).success`). If not a UUID, skip the DB check and allow upload (user is authenticated, storage path is already `userId`-scoped).
- If it already handles null gracefully → no change needed.

---

## Custom Item Management UI — `SystemChecklistManager`

**File:** `src/components/SystemChecklistManager.tsx`

Renders inside each system card on the customer detail page. Collapsed by default.

### Props

```typescript
interface SystemChecklistManagerProps {
  systemId: string;
}
```

### Behavior

- Toggle button: "Checkliste verwalten" with chevron icon
- When expanded:
  - Lists current custom items (`useChecklistItems(systemId)`) with a trash icon per item
  - Input field + "Hinzufügen" button to add a new item
  - Input cleared after successful add
  - Items ordered by `createdAt ASC`
  - Max label length: 200 chars (Zod enforced on server)
- Delete: calls `useDeleteChecklistItem(systemId)` — confirmation dialog NOT required (items are easy to re-add)
- Add: calls `useAddChecklistItem(systemId)` — disabled while mutation is pending
- Loading and error states handled with standard inline messages (no toast for add/delete — use inline feedback)

### Placement in Customer Detail Page

Inside each system card, after the existing system info rows, before the system action buttons:

```tsx
<SystemChecklistManager systemId={system.id} />
```

---

## Files — Complete Change List

| Action | File | Notes |
|--------|------|-------|
| Create | `src/types/checklist.ts` | `ChecklistItemSnapshot`, `ChecklistSnapshot` types |
| Create | `src/lib/checklist-defaults.ts` | `CHECKLIST_DEFAULTS` constant |
| Create | `src/hooks/useChecklistItems.ts` | `useChecklistItems`, `useAddChecklistItem`, `useDeleteChecklistItem` |
| Create | `src/components/MaintenanceChecklistModal.tsx` | 3-step checklist modal |
| Create | `src/components/SystemChecklistManager.tsx` | Custom item CRUD inside system card |
| Create | `src/app/api/systems/[id]/checklist-items/route.ts` | GET + POST |
| Create | `src/app/api/systems/[id]/checklist-items/[itemId]/route.ts` | DELETE |
| Modify | `prisma/schema.prisma` | Add `CustomerSystemChecklistItem` model; add `checklistItems` relation on `CustomerSystem`; add `checklistData Json?` on `Maintenance` |
| Modify | `src/lib/validations.ts` | Add `checklistItemSnapshotSchema`, `checklistSnapshotSchema`, `checklistItemCreateSchema`; extend `maintenanceCreateSchema` with optional `checklistData` |
| Modify | `src/app/dashboard/page.tsx` | Swap `MaintenanceFormModal` → `MaintenanceChecklistModal`; extend selected system state with `systemType` |
| Modify | `src/app/dashboard/customers/[id]/page.tsx` | Swap `MaintenanceFormModal` → `MaintenanceChecklistModal`; extend selected system state with `systemType`; add `<SystemChecklistManager>` inside each system card |
| Modify (maybe) | `src/app/api/upload/photo/route.ts` | Make maintenanceId ownership check conditional on valid UUID format — see note above |
| Delete | `src/components/MaintenanceFormModal.tsx` | After all usages replaced |

**Prisma migration:** Run `prisma migrate dev --name add_checklist` after schema changes. Run `prisma generate` to update the client.

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Unknown `systemType` | `CHECKLIST_DEFAULTS[type] ?? []` — empty checklist, no crash |
| Custom items fetch fails | Show checklist with defaults only (React Query error state) |
| Photo upload fails | Show `toast.error`, keep modal open at Step 2 |
| Maintenance creation fails | Show `toast.error`, keep modal open at Step 3 |
| Network error | Caught in try/catch → `toast.error('Fehler beim Speichern der Wartung')` |
| Checklist item add/delete fails | Inline error message in `SystemChecklistManager` |

---

## Mobile Responsiveness Requirements

- Modal is a bottom sheet on mobile (`items-end`, `rounded-t-xl`)
- Checklist items: minimum 52px row height, full-width tap target
- Checkboxes: 20×20px minimum
- Step navigation buttons: minimum 44px height
- No horizontal overflow — long item labels wrap
- Photo grid: `grid-cols-3` (same as existing modal — works fine on mobile)
- Font size on all inputs: `text-base` (prevents iOS auto-zoom)

---

## Out of Scope (deferred)

- PDF / Arbeitsbericht export → backlog "Maybe / Future" section
- Measurement fields (values, not just checkboxes) → revisit after pilot
- Checklist item reordering (drag and drop)
- Signature capture (canvas)
- Custom items per system type globally (only per CustomerSystem for now)
