# System Photos Design Spec

**Date:** 2026-04-23
**Feature:** Backlog #34 — photos per CustomerSystem (up to 5)
**Author:** brainstorming session

---

## Goal

Allow up to 5 photos per `CustomerSystem`, directly on the system detail view. Primary use case: installation photos as visual context for quoting. Not bound to a specific maintenance.

Permission model: **Variant B** — OWNER + TECHNICIAN can upload, only OWNER can delete. Aligns with the delete-is-OWNER rule established in #57.

---

## Data Model

Additive column on `CustomerSystem` in `prisma/schema.prisma`:

```prisma
model CustomerSystem {
  // ... existing fields
  photos   String[] @default([])   // up to 5 public Supabase URLs
}
```

No schema changes on other models. Nullable via default, no backfill required.

**Migration:** `YYYYMMDDHHMMSS_add_system_photos` (additive column, zero downtime).

**Storage:** Reuse existing `maintenance-photos` bucket with new path prefix `{userId}/systems/{systemId}/{timestamp}.{ext}`. Bucket rename deferred — the existing RLS-free deny-all + service-role access pattern already applies.

**Limit enforcement:**
- Server: `system.photos.length >= 5` → 400 "Maximal 5 Fotos pro System"
- Client: upload button disabled when count = 5

---

## API

Two new routes under `src/app/api/systems/[id]/photos/route.ts`. Mirrors the nested pattern already used for `/api/systems/[id]/follow-ups` and `/api/systems/[id]/checklist-items`.

### `POST /api/systems/[id]/photos`

**Auth:** `requireAuth()` + rate limit `FILE_UPLOAD` preset (10/min per user).

**Body:** `multipart/form-data { file: File }`

**Guards:**
- System must belong to caller's `companyId` (else 404)
- If `role === 'TECHNICIAN'`: additionally require `assignedToUserId === userId` (else 403) — mirrors Sprint 24 workload-scoping
- MIME ∈ `{image/jpeg, image/png, image/webp}` (else 400)
- `file.size ≤ 5 * 1024 * 1024` (else 400)
- `system.photos.length < 5` (else 400)

**Flow:**
1. Upload file to Supabase `maintenance-photos/{userId}/systems/{systemId}/{timestamp}.{ext}`
2. Resolve public URL
3. `prisma.customerSystem.update({ where: { id }, data: { photos: { push: url } } })`
4. Return `{ success: true, url, photos }` (full updated array for client rendering)

**Errors:**
- 401 `Unauthorized` → "Nicht autorisiert"
- 403 on TECHNICIAN accessing non-assigned system → "Zugriff verweigert"
- 400 with German-language reason strings on validation failures

### `DELETE /api/systems/[id]/photos`

**Auth:** `requireOwner()` + rate limit `API_USER` preset. **Variant B:** TECHNICIAN explicitly blocked with 403 "Nur Inhaber können Fotos löschen".

**Body:** `{ url: string }` (JSON)

**Guards:**
- OWNER only (else 403)
- System must belong to caller's `companyId` (else 404)
- `url` must be in `system.photos` (else 404)

**Flow:**
1. `prisma.customerSystem.update({ photos: { set: photos.filter(p => p !== url) } })`
2. Best-effort Supabase storage delete via admin client — on failure, log and continue (orphan file acceptable; bucket cleanup via future cron if needed)
3. Return `{ success: true, photos }`

### Tenant-isolation audit

Add the new route file to `src/__tests__/audit/tenant-isolation.test.ts` tenant-routes list. The audit verifies `companyId` scoping and catches uncategorized new routes.

---

## Validation

`src/lib/validations.ts`:

```typescript
export const systemPhotoDeleteSchema = z.object({
  url: z.string().url('Ungültige URL'),
});
```

Upload uses FormData directly (no Zod schema — `file` is a binary Blob, validated via MIME + size checks).

---

## Hooks

New file `src/hooks/useSystemPhotos.ts`:

```typescript
export function useUploadSystemPhoto(systemId: string) {
  // mutation: (file: File) → { url, photos }
  // onSuccess: invalidate ['customer-system', systemId] + ['customer-systems']
  // No success toast (callers batch-upload; single toast in UI)
}

export function useDeleteSystemPhoto(systemId: string) {
  // mutation: (url: string) → { photos }
  // onSuccess: invalidate same keys + toast.success('Foto gelöscht')
  // onError: toast.error
}
```

Pattern matches `useCreateFollowUpJob` / `useDeleteFollowUpJob`.

---

## UI

### New component: `src/components/SystemPhotosCard.tsx`

**Props:**
```typescript
{ systemId: string; photos: string[] }
```

**Structure:**

```
┌─────────────────────────────────────────────────┐
│  🖼️ Fotos                  3/5  [+ Hinzufügen]  │
├─────────────────────────────────────────────────┤
│  [thumb] [thumb] [thumb]                        │
│  click → Lightbox                               │
│  OWNER: hover → TrashIcon (top-right corner)    │
└─────────────────────────────────────────────────┘
```

**Details:**
- Uses `<Card>` from `@/components/ui/card`
- Header row: title + count badge (`X/5`) + upload button (`variant="outline" size="sm"`, disabled at 5)
- Grid: `grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3`, each thumbnail `aspect-square object-cover rounded-lg border border-border`
- Empty state: camera icon centered + "Noch keine Fotos" muted text
- Click on thumbnail → full-screen lightbox modal (reuse exact pattern from `MaintenanceHistory.tsx`)
- Delete button (TrashIcon, absolute positioned top-right on thumbnail): visible only when `useSession().data?.user?.role === 'OWNER'`. On mobile always visible (`opacity-100`), on desktop `opacity-0 group-hover:opacity-100` for clean look
- Upload: hidden `<input type="file" multiple accept="image/*" />`, click triggers via visible button. Client-side validation: MIME whitelist, 5MB per file, remaining-slots check (`if (photos.length + files.length > 5) toast`). Sequential uploads via `Promise.all`, single success toast `"X Foto(s) hochgeladen"`.

### Placement in System-Detail-Page

`src/app/dashboard/systems/[id]/page.tsx` — insert between Wartungsplan-Card and Follow-up-Section:

1. Header (back / name / edit)
2. Wartungsplan-Card
3. **SystemPhotosCard ← new**
4. FollowUpSection
5. Quick-Actions (Wartung / Termin)
6. MaintenanceHistory

Fotos sit with the "system context" block (what this system is), above transactional elements (what needs doing).

---

## Testing

### Unit tests: `src/app/api/systems/[id]/photos/__tests__/route.test.ts`

Mock `prisma`, `requireAuth`, `requireOwner`, and `getSupabaseAdmin`. Cover:

| Case | Expected |
|------|----------|
| POST happy path | 200, photos array extended |
| POST unauthenticated | 401 |
| POST TECHNICIAN, assigned system | 200 |
| POST TECHNICIAN, non-assigned system | 403 |
| POST with 5 photos already | 400 "Maximal 5 Fotos" |
| POST with wrong MIME | 400 |
| POST with 6MB file | 400 |
| POST cross-tenant system | 404 |
| DELETE happy path (OWNER) | 200, photos filtered |
| DELETE as TECHNICIAN | 403 "Nur Inhaber..." |
| DELETE non-existent URL | 404 |
| DELETE cross-tenant | 404 |

### Tenant-isolation audit
Add `systems/[id]/photos/route.ts` to the tenant-routes list.

---

## Out of scope (deferred)

- Photo captions / descriptions
- EXIF-based auto-rotation / metadata extraction
- Reorder photos (drag-drop)
- Photos on maintenances → keep existing per-Maintenance photos separate (different use case)
- Image compression / resizing — rely on Supabase CDN + max 5MB

---

## Open non-decisions

All major choices decided during brainstorming (Variant B permissions, single-route-per-HTTP-verb, Card placement). No open questions.
