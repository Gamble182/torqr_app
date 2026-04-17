# System Model Overhaul — Design Spec

**Date:** 2026-04-17
**Backlog items resolved:** #28, #29, #30, #31, #46, #32, #34
**Status:** Approved — ready for implementation plan

---

## Goal

Replace the per-customer `Heater` model with a global device catalog (`SystemCatalog`) linked to customers via per-instance assignments (`CustomerSystem`). Extend system coverage from heating-only to four types: Heizung, Klimaanlage, Wasseraufbereitung, Energiespeicher.

## Architecture

A two-table design: a global `SystemCatalog` holding the *what* (manufacturer, name, type), and a per-tenant `CustomerSystem` holding the *instance* (serial number, dates, maintenance schedule, photos). All authenticated users can contribute to the global catalog. Catalog entries with `createdByUserId = null` are platform-seeded.

**Tech stack:** Prisma (schema + migrations), Next.js App Router API routes, TanStack Query hooks, shadcn/ui components, Supabase Storage (photos).

---

## Data Model

### New enums

```prisma
enum SystemType {
  HEATING           // Heizung
  AC                // Klimaanlage
  WATER_TREATMENT   // Wasseraufbereitung
  ENERGY_STORAGE    // Energiespeicher
}

enum AcSubtype {
  SINGLE_SPLIT      // Singlesplit
  MULTI_SPLIT_2     // Multisplit 2er Split
  MULTI_SPLIT_3     // Multisplit 3er Split
  MULTI_SPLIT_4     // Multisplit 4er Split
  MULTI_SPLIT_5     // Multisplit 5er Split
}

enum StorageSubtype {
  BOILER            // Boiler
  BUFFER_TANK       // Pufferspeicher
}
```

### SystemCatalog (new — global, no userId scoping)

```prisma
model SystemCatalog {
  id                    String         @id @default(uuid())
  systemType            SystemType
  manufacturer          String
  name                  String
  // AC-specific (null for other types)
  acSubtype             AcSubtype?
  // Energiespeicher-specific (null for other types)
  storageSubtype        StorageSubtype?
  storageCapacityLiters Int?
  // Audit
  createdByUserId       String?        // null = platform-seeded entry
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt

  createdByUser         User?          @relation(fields: [createdByUserId], references: [id], onDelete: SetNull)
  customerSystems       CustomerSystem[]

  @@unique([systemType, manufacturer, name])
  @@index([systemType])
  @@index([manufacturer])
  @@map("system_catalog")
}
```

**Unique constraint** on `(systemType, manufacturer, name)` prevents duplicates across all tenants.

### CustomerSystem (new — replaces Heater)

```prisma
model CustomerSystem {
  id                  String        @id @default(uuid())
  // Catalog reference
  catalogId           String
  catalog             SystemCatalog @relation(fields: [catalogId], references: [id])
  // Instance data
  serialNumber        String?
  installationDate    DateTime?
  maintenanceInterval Int           // in months (1, 3, 6, 12, 24)
  lastMaintenance     DateTime?
  nextMaintenance     DateTime?     // auto-calculated on create/update
  notes               String?
  photos              String[]      @default([])  // up to 5 Supabase Storage URLs
  requiredParts       String?
  // Tenant scoping
  customerId          String
  customer            Customer      @relation(fields: [customerId], references: [id], onDelete: Cascade)
  userId              String
  user                User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  maintenances        Maintenance[]

  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  @@index([userId])
  @@index([customerId])
  @@index([catalogId])
  @@index([nextMaintenance])
  @@map("customer_systems")
}
```

### Maintenance (updated)

`heaterId String` → `systemId String`
`heater Heater` → `system CustomerSystem`

### Customer (updated — fields removed)

Remove: `heatingType HeatingType`, `additionalEnergySources String[]`, `energyStorageSystems String[]`
Remove enum: `HeatingType`

### User (updated — relations)

Remove: `heaters Heater[]`
Add: `customerSystems CustomerSystem[]`, `catalogEntries SystemCatalog[]`

### Heater model

Dropped entirely. No migration — existing data is test/mock data only.

---

## Catalog Seeding

File: `prisma/seed.ts`

- Reads existing `src/config/heating-systems.json` for HEATING entries
- Adds initial entries for AC, WATER_TREATMENT, ENERGY_STORAGE types
- Uses Prisma `upsert` on the unique constraint — safe to re-run
- All seeded entries have `createdByUserId = null`
- PV systems (PHOTOVOLTAIC, SOLAR_THERMAL, SMALL_WIND) and bathroom water heaters are **not included** (#46 resolved)
- Run via `npx prisma db seed` after migrations

---

## API Layer

### New endpoints

**`GET /api/catalog`**
- Public to authenticated users
- Query params: `systemType?`, `manufacturer?`, `search?`
- Returns catalog entries grouped or flat — used by `CatalogPicker`
- No userId filter — global catalog

**`POST /api/catalog`**
- Requires auth (`requireAuth()`)
- Body: `{ systemType, manufacturer, name, acSubtype?, storageSubtype?, storageCapacityLiters? }`
- Validates uniqueness (Prisma unique constraint catches duplicates → 409)
- Sets `createdByUserId` to session user id

**`GET /api/customer-systems`**
- Requires auth
- Query param: `customerId` (required)
- Verifies customer belongs to user (userId scoping)
- Returns assignments with `catalog` included

**`POST /api/customer-systems`**
- Requires auth
- Body: `{ catalogId, customerId, serialNumber?, installationDate?, maintenanceInterval, lastMaintenance?, notes?, photos?, requiredParts? }`
- Auto-calculates `nextMaintenance`
- Verifies customer belongs to user

**`GET /api/customer-systems/[id]`**
- Requires auth, userId scope check
- Returns assignment + catalog + last 5 maintenances

**`PATCH /api/customer-systems/[id]`**
- Requires auth, userId scope check
- All fields optional
- Recalculates `nextMaintenance` if `lastMaintenance` or `maintenanceInterval` changes

**`DELETE /api/customer-systems/[id]`**
- Requires auth, userId scope check
- Cascades: maintenances deleted (via Prisma cascade)

### Updated endpoints

| Endpoint | Change |
|----------|--------|
| `POST /api/maintenance` | `heaterId` → `systemId` in body + Zod schema |
| `GET /api/maintenance` | `heaterId` → `systemId` in query params |
| `GET /api/dashboard/stats` | `Heater` → `CustomerSystem` in Prisma queries |
| `POST /api/cron/daily-reminders` | `heater` → `system` relation, `nextMaintenance` query unchanged |
| `POST /api/cron/weekly-summary` | `Heater` → `CustomerSystem` count |

### Removed endpoints

- `GET /api/heaters`
- `POST /api/heaters`
- `GET /api/heaters/[id]`
- `PATCH /api/heaters/[id]`
- `DELETE /api/heaters/[id]`

---

## Validation Schemas (`src/lib/validations.ts`)

### New schemas

**`catalogCreateSchema`**
```ts
z.object({
  systemType: z.enum(['HEATING', 'AC', 'WATER_TREATMENT', 'ENERGY_STORAGE']),
  manufacturer: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  acSubtype: z.enum(['SINGLE_SPLIT','MULTI_SPLIT_2','MULTI_SPLIT_3','MULTI_SPLIT_4','MULTI_SPLIT_5']).optional().nullable(),
  storageSubtype: z.enum(['BOILER', 'BUFFER_TANK']).optional().nullable(),
  storageCapacityLiters: z.number().int().positive().optional().nullable(),
})
.refine(
  (d) => !(d.systemType === 'AC' && !d.acSubtype),
  { message: 'Subtyp ist erforderlich für Klimaanlagen', path: ['acSubtype'] }
)
.refine(
  (d) => !(d.storageSubtype && !d.storageCapacityLiters),
  { message: 'Litergröße ist erforderlich für diesen Speichertyp', path: ['storageCapacityLiters'] }
)
```

**`customerSystemCreateSchema`**
```ts
z.object({
  catalogId: z.string().uuid(),
  customerId: z.string().uuid(),
  serialNumber: z.string().max(100).optional().nullable(),
  installationDate: z.string().datetime().optional().nullable(),
  maintenanceInterval: z.enum(['1', '3', '6', '12', '24']),
  lastMaintenance: z.string().datetime().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  photos: z.array(z.string().url()).max(5).optional(),
  requiredParts: z.string().optional().nullable(),
})
```

**`customerSystemUpdateSchema`** — all fields from create schema made optional.

### Removed schemas

`heaterCreateSchema`, `heaterUpdateSchema`, `addCategorySchema`, `addManufacturerSchema`, `addModelSchema`

---

## Hooks (`src/hooks/`)

### New: `useCatalog.ts`

```ts
// Fetches catalog entries filtered by systemType and optional search
useSystemCatalog(systemType?: SystemType, search?: string)
// Creates a new catalog entry
useCreateCatalogEntry()
```

### Renamed/replaced: `useCustomerSystems.ts` (replaces `useHeaters.ts`)

```ts
useCustomerSystems(customerId: string)
useCreateCustomerSystem()
useUpdateCustomerSystem()
useDeleteCustomerSystem()
```

Both use `staleTime: 30_000` per project convention.

---

## UI & Components

### Rename throughout

All occurrences of "Heizsystem/e" → "Zu wartendes System / Zu wartende Systeme" in labels, toasts, page titles, navigation, and error messages.

### New components (`src/components/system-form/`)

**`SystemTypeSelector.tsx`**
- 4 large toggle buttons: Heizung / Klimaanlage / Wasseraufbereitung / Energiespeicher
- Icons distinguish each type
- Selected type is highlighted; controls what `CatalogPicker` shows and which conditional fields appear

**`CatalogPicker.tsx`**
- Search input filtering by manufacturer or name within the selected `SystemType`
- Results grouped by manufacturer
- Selected entry renders as a summary chip (manufacturer — name)
- "Neu hinzufügen" button opens an inline form to `POST /api/catalog`

**`SystemAssignmentModal.tsx`** (replaces `HeaterFormModal.tsx`)
- Combines SystemTypeSelector + CatalogPicker + instance fields in one modal
- Instance fields: serial number, installation date
  - Checkbox: "Installationsdatum als Wartungsdatum übernehmen" — when checked, sets `lastMaintenance = installationDate` (#32)
- Maintenance interval selector (1/3/6/12/24 months)
- Last maintenance date
- Notes (optional)
- Conditional fields:
  - AC selected → AcSubtype dropdown (Singlesplit / Multisplit 2er–5er)
  - Energiespeicher selected → StorageSubtype dropdown + Litergröße field (required when subtype selected)
- Photos section: up to 5 images via existing `POST /api/upload/photo` infrastructure (#34)

### Updated pages

**`src/app/dashboard/heaters/`** — queries switch to `useCustomerSystems`; system cards show a color-coded `SystemType` badge.

**Customer detail page** — system list uses `useCustomerSystems(customerId)`; `SystemAssignmentModal` replaces `HeaterFormModal`.

**Customer form (create/edit)** — `heatingType`, `additionalEnergySources`, `energyStorageSystems` fields removed entirely.

### Deleted files

| File | Reason |
|------|--------|
| `src/components/HeaterFormModal.tsx` | Replaced by SystemAssignmentModal |
| `src/components/heater-form/HeatingSystemSelector.tsx` | Replaced by CatalogPicker |
| `src/components/heater-form/AddNewEntryModal.tsx` | Merged into CatalogPicker |
| `src/components/heater-form/BatteryFields.tsx` | Battery is now a catalog entry |
| `src/components/heater-form/StorageFields.tsx` | Storage is now a catalog entry |
| `src/app/api/heaters/route.ts` | Replaced by /api/customer-systems |
| `src/app/api/heaters/[id]/route.ts` | Replaced by /api/customer-systems/[id] |
| `src/hooks/useHeaters.ts` | Replaced by useCustomerSystems |

---

## Error Handling

- `POST /api/catalog` with duplicate `(systemType, manufacturer, name)` → 409 with German message "Dieses System existiert bereits im Katalog"
- `POST/PATCH /api/customer-systems` with invalid `catalogId` → 404 "Katalogeintrag nicht gefunden"
- `DELETE /api/customer-systems/[id]` with existing maintenances → allowed (cascade deletes them)
- Photos > 5 → rejected by Zod schema before upload

---

## Testing

- Unit tests for `customerSystemCreateSchema` and `catalogCreateSchema` (Vitest, in `src/lib/__tests__/`)
- Existing `admin-auth.test.ts` stays unaffected
- Manual smoke test: create a system of each type, verify conditional fields, verify catalog deduplication, verify maintenance interval auto-calculation

---

## Out of Scope

| Item | Deferred to |
|------|-------------|
| #23 Link Booking to specific system (`systemId` on Booking) | Cal.com sprint |
| #26 Employee roles / catalog contribution restrictions | Workforce sprint |
| Admin catalog management UI (edit/delete catalog entries) | Future admin sprint |
| Battery storage as a SystemType | Future sprint if needed |
