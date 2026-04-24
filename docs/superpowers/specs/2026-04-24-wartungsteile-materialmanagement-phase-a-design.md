# Wartungsteile & Materialmanagement — Phase A Design Spec

**Date:** 2026-04-24
**Feature:** Wartungsteile-Bibliothek + Lager-Light + Techniker-Teileverbrauch
**Phase:** A (of A–D roadmap) — "A2" scope variant (parts library + light inventory)
**Author:** brainstorming session with pilot customer feedback (2026-04-24)

---

## Scope Declaration

This phase delivers the **MaintenanceSet library** (parts lists per device model per tenant), **CustomerSystem-level overrides**, **light inventory with stock tracking**, **technician consumption capture during maintenance**, and **on-demand packing lists for scheduled appointments**.

**Explicit non-goals for Phase A** (tracked as `Maybe/Future` items in `docs/BACKLOG.md`, IDs `N-1` through `N-11`):

- Packing-list email delivery (scheduled or on-demand) — print-view only
- Order / procurement workflow (supplier links, order status, auto-order)
- Real-time low-stock alert emails — weekly summary section + dashboard card only
- Multiple maintenance-type variants (STANDARD / INSPECTION / EMERGENCY)
- PDF import for maintenance sets (requires OCR tooling not currently installed)
- Per-item photos on MaintenanceSetItem
- CSV/XLSX bulk import for inventory or sets
- Third-party inventory integrations (Sortly, Doron, Fifo)
- Manufacturer catalog integrations (Bosch Pro, Grünbeck)
- Community/global shared maintenance sets
- Drag-and-drop reordering (arrow-button reorder only — see backlog `M-3`)

This phase **replaces** the existing primitive `CustomerSystem.requiredParts: String?` free-text field.

---

## Decision Record

All foundational decisions from the brainstorming session, in order:

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Scope: A2 (Phase A + Lager-Light)** | MaintenanceSet alone would leave stock drift; full ordering workflow is over-scope for pilot. Light inventory = sweet spot. |
| 2 | **Tenant-scoped (`companyId`)**, not global | Parts lists include commercial info (article numbers, discounts, EK-prices). Must not leak across Torqr tenants. `systemCatalogId` retained as weak grouping ref. |
| 3 | **Hybrid anchor: catalog-default + per-system override** | Mirrors the proven `CustomerSystemChecklistItem` pattern. Defaults per model, overrides per installation. |
| 4 | **Single Standard set per model** (no `maintenanceType` enum) | YAGNI. Pilot does only yearly maintenance today. Additively extensible later without data migration. |
| 5 | **3 categories** (`SPARE_PART`, `CONSUMABLE`, `TOOL`) **+ `required: Boolean` flag** | Decouples "what kind of thing" from "optional vs mandatory". TOOL is not stock-tracked. |
| 6 | **Nullable FK** `MaintenanceSetItem.inventoryItemId` | Three use cases supported: tracked parts, untracked generic items, tools. `ON DELETE SET NULL` preserves set-item on inventory delete. |
| 7 | **Active consumption step** in `MaintenanceChecklistModal` + `InventoryMovement` log + snapshot in `Maintenance.checklistData.partsUsed` | Reality-first accuracy. Step 2.5 pre-filled from effective parts. Movement log gives audit trail. Snapshot gives immutable history. |
| 8 | **Surfaces:** `/dashboard/wartungssets` (OWNER), `/dashboard/lager` (OWNER full, TECHNICIAN read-only), new card on `/dashboard/systems/[id]`, new step in `MaintenanceChecklistModal` | Matches existing navigation patterns. TECHNICIAN gets Lager read-only for on-site stock lookup. |
| 9 | **Packing list: L1 (print-view only)** + **Low-stock: S2 (dashboard card + weekly summary section)** | Print-view via browser = PDF for free. Email-send deferred to Phase B. Real-time alerts avoid noise. |
| 10 | **Edge-cases: N3 + R1 + E2** | Negative stock allowed with warning (reality-first), maintenance delete auto-reverses via CORRECTION movements, maintenance records are immutable post-save (delete + recreate pattern). |

---

## Data Model

### New Prisma models

Appended to `prisma/schema.prisma`:

```prisma
// ─── Wartungssets (model-default, tenant-scoped) ────────────────────────

model MaintenanceSet {
  id         String   @id @default(uuid())
  companyId  String
  catalogId  String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  company    Company       @relation(fields: [companyId], references: [id], onDelete: Cascade)
  catalog    SystemCatalog @relation(fields: [catalogId], references: [id], onDelete: Restrict)
  items      MaintenanceSetItem[]

  @@unique([companyId, catalogId])
  @@index([companyId])
  @@map("maintenance_sets")
}

enum PartCategory {
  SPARE_PART
  CONSUMABLE
  TOOL
}

model MaintenanceSetItem {
  id                String       @id @default(uuid())
  maintenanceSetId  String
  category          PartCategory
  description       String
  articleNumber     String?
  quantity          Decimal      @default(1)
  unit              String       @default("Stck")
  required          Boolean      @default(true)
  note              String?
  sortOrder         Int          @default(0)
  inventoryItemId   String?
  createdAt         DateTime     @default(now())

  maintenanceSet    MaintenanceSet                @relation(fields: [maintenanceSetId], references: [id], onDelete: Cascade)
  inventoryItem     InventoryItem?                @relation(fields: [inventoryItemId], references: [id], onDelete: SetNull)
  exclusions        CustomerSystemPartOverride[]  @relation("ExcludesSetItem")

  @@index([maintenanceSetId])
  @@index([inventoryItemId])
  @@map("maintenance_set_items")
}

// ─── Per-installation overrides (ADDs + EXCLUDEs) ───────────────────────

enum OverrideAction {
  ADD
  EXCLUDE
}

model CustomerSystemPartOverride {
  id                 String         @id @default(uuid())
  customerSystemId   String
  action             OverrideAction

  // ADD fields (populated when action = ADD)
  category           PartCategory?
  description        String?
  articleNumber      String?
  quantity           Decimal?
  unit               String?
  required           Boolean        @default(true)
  note               String?
  sortOrder          Int            @default(0)
  inventoryItemId    String?

  // EXCLUDE field (populated when action = EXCLUDE)
  excludedSetItemId  String?

  createdAt          DateTime       @default(now())

  customerSystem     CustomerSystem       @relation(fields: [customerSystemId], references: [id], onDelete: Cascade)
  inventoryItem      InventoryItem?       @relation("OverrideInventory", fields: [inventoryItemId], references: [id], onDelete: SetNull)
  excludedSetItem    MaintenanceSetItem?  @relation("ExcludesSetItem", fields: [excludedSetItemId], references: [id], onDelete: Cascade)

  @@index([customerSystemId])
  @@index([inventoryItemId])
  @@index([excludedSetItemId])
  @@map("customer_system_part_overrides")
}

// ─── Inventory (tenant-scoped) ──────────────────────────────────────────

model InventoryItem {
  id               String    @id @default(uuid())
  companyId        String
  articleNumber    String?
  description      String
  unit             String    @default("Stck")
  currentStock     Decimal   @default(0)
  minStock         Decimal   @default(0)
  lastRestockedAt  DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  company          Company                       @relation(fields: [companyId], references: [id], onDelete: Cascade)
  setItems         MaintenanceSetItem[]
  overrides        CustomerSystemPartOverride[]  @relation("OverrideInventory")
  movements        InventoryMovement[]

  @@unique([companyId, articleNumber])
  @@index([companyId])
  @@map("inventory_items")
}

enum MovementReason {
  MAINTENANCE_USE
  MANUAL_ADJUSTMENT
  RESTOCK
  CORRECTION
}

model InventoryMovement {
  id              String          @id @default(uuid())
  companyId       String
  inventoryItemId String
  quantityChange  Decimal         // signed: -2 = Abgang, +10 = Zugang
  reason          MovementReason
  maintenanceId   String?
  userId          String
  note            String?
  createdAt       DateTime        @default(now())

  company         Company         @relation(fields: [companyId], references: [id], onDelete: Cascade)
  inventoryItem   InventoryItem   @relation(fields: [inventoryItemId], references: [id], onDelete: Cascade)
  maintenance     Maintenance?    @relation(fields: [maintenanceId], references: [id], onDelete: SetNull)
  user            User            @relation(fields: [userId], references: [id])

  @@index([companyId])
  @@index([inventoryItemId])
  @@index([maintenanceId])
  @@index([createdAt])
  @@map("inventory_movements")
}
```

### Changes to existing models

- `Company` — back-relations: `maintenanceSets`, `inventoryItems`, `inventoryMovements`
- `SystemCatalog` — back-relation: `maintenanceSets`
- `CustomerSystem` — back-relation: `partOverrides`. `requiredParts: String?` column will be **dropped** in a later migration (phased, see Migration section)
- `Maintenance` — back-relation: `inventoryMovements`. No schema change to `checklistData: Json?` — snapshot is written under a new key `partsUsed: PartUsageSnapshot[]`
- `User` — back-relation: `inventoryMovements`

### Key invariants

1. **Tenant isolation:** every new tenant-scoped table (`maintenance_sets`, `inventory_items`, `inventory_movements`) has `companyId` + index. Routes scope queries via `requireAuth().companyId`. Child tables (`maintenance_set_items`, `customer_system_part_overrides`) inherit `companyId` through their parent relation — route handlers must include parent relation in the `where` or use an explicit join-scoped query.
2. **Unique `(companyId, catalogId)` on `MaintenanceSet`** — exactly one Standard set per model per tenant.
3. **Unique `(companyId, articleNumber)` on `InventoryItem`** — Postgres treats multiple `NULL` values as distinct. Free-text items (no article number) coexist without duplicate-key conflict; items with a number are unique per tenant.
4. **Zod refine on `CustomerSystemPartOverride`:**
   - `action = ADD` → `category`, `description`, `quantity`, `unit` required; `excludedSetItemId` must be `null`
   - `action = EXCLUDE` → `excludedSetItemId` required; all ADD fields must be `null`
5. **Zod refine on `MaintenanceSetItem` + override ADD:** `category = TOOL` ⇒ `inventoryItemId = null`
6. **Decimal precision:** all quantity and stock fields use Prisma `Decimal` (Postgres `numeric`) — correctly handles `1,5 m`, `250 ml`, etc. No floating-point arithmetic in consumption calculations.
7. **Enforcement via FK cascade/null semantics:**
   - `MaintenanceSet.catalogId` → `onDelete: Restrict` (protect sets from accidental catalog deletion)
   - `MaintenanceSetItem.inventoryItemId` / `CustomerSystemPartOverride.inventoryItemId` → `onDelete: SetNull` (unlinking converts to untracked)
   - `InventoryMovement.maintenanceId` → `onDelete: SetNull` (preserves audit log after maintenance delete)
   - `CustomerSystemPartOverride.excludedSetItemId` → `onDelete: Cascade` (exclusion references a specific set item; if that item disappears, the exclusion is meaningless)

### Effective-parts resolver

Server-side helper `getEffectivePartsForSystem(customerSystemId: string, companyId: string): Promise<EffectivePart[]>`:

```ts
type EffectivePart = {
  source: 'DEFAULT' | 'OVERRIDE_ADD'
  setItemId?: string            // when source = DEFAULT
  overrideId?: string           // when source = OVERRIDE_ADD
  category: PartCategory
  description: string
  articleNumber: string | null
  quantity: Decimal
  unit: string
  required: boolean
  note: string | null
  sortOrder: number
  inventoryItem: {
    id: string
    currentStock: Decimal
    minStock: Decimal
    unit: string
  } | null
}
```

**Algorithm:**
1. Load `CustomerSystem` by `(id, companyId)` — 404 if missing
2. Load `MaintenanceSet` by `(companyId, catalogId)` including items (may be empty if Owner hasn't created one yet)
3. Load all `CustomerSystemPartOverride` for this `customerSystemId`
4. `excludedIds = overrides.filter(o => o.action === 'EXCLUDE').map(o => o.excludedSetItemId)`
5. `defaults = set.items.filter(i => !excludedIds.includes(i.id))` → map to `EffectivePart` with `source: 'DEFAULT'`
6. `adds = overrides.filter(o => o.action === 'ADD')` → map to `EffectivePart` with `source: 'OVERRIDE_ADD'`
7. Return `[...defaults, ...adds].sort((a, b) => a.sortOrder - b.sortOrder)`

Consumers: `GET /api/customer-systems/[id]/effective-parts`, `GET /api/bookings/[id]/packing-list`, `PartsListCard` data, `MaintenanceChecklistModal` Step 2.5 prefill.

---

## API

All new routes live under `src/app/api/`. All use `requireAuth()` (or `requireOwner()` for write endpoints), company-scoped queries, rate-limiting via `rateLimitByUser` (Upstash, Sprint 26 pattern), and return German error strings on validation failures.

### Maintenance sets (OWNER only for writes)

| Route | Method | Auth | Rate Limit | Purpose |
|-------|--------|------|------------|---------|
| `/api/maintenance-sets` | GET | `requireOwner()` | 120/min | List sets. Optional `?catalogId=` filter. Returns `{ sets: MaintenanceSet[] }` with item count. |
| `/api/maintenance-sets` | POST | `requireOwner()` | 30/min | Create empty set. Body: `{ catalogId: string }`. Unique constraint enforces one per model. |
| `/api/maintenance-sets/[id]` | GET | `requireOwner()` | 120/min | Set detail incl. items (ordered by `sortOrder`). |
| `/api/maintenance-sets/[id]` | DELETE | `requireOwner()` | 30/min | Delete set + cascade items. Blocks if any `MaintenanceSetItem` is referenced by an override EXCLUDE (handled via FK cascade on exclusion side, but flag in UI). |
| `/api/maintenance-sets/[id]/items` | POST | `requireOwner()` | 30/min | Add item. Body matches `maintenanceSetItemCreateSchema`. |
| `/api/maintenance-sets/[id]/items/reorder` | PATCH | `requireOwner()` | 30/min | Bulk reorder. Body: `{ items: { id: string, sortOrder: number }[] }`. |
| `/api/maintenance-set-items/[id]` | PATCH | `requireOwner()` | 30/min | Update single item. |
| `/api/maintenance-set-items/[id]` | DELETE | `requireOwner()` | 30/min | Delete item. |

### Customer-system overrides

| Route | Method | Auth | Rate Limit | Purpose |
|-------|--------|------|------------|---------|
| `/api/customer-systems/[id]/effective-parts` | GET | `requireAuth()` + TECH-scoping | 120/min | Returns `EffectivePart[]`. TECHNICIAN: additional check `system.assignedToUserId === userId` or 403. |
| `/api/customer-systems/[id]/overrides` | POST | `requireOwner()` | 30/min | Create ADD or EXCLUDE override. Zod refine on `action`. |
| `/api/overrides/[id]` | DELETE | `requireOwner()` | 30/min | Remove override. |

### Inventory

| Route | Method | Auth | Rate Limit | Purpose |
|-------|--------|------|------------|---------|
| `/api/inventory` | GET | `requireAuth()` (both roles) | 120/min | List. `?filter=low` returns only items where `currentStock < minStock`. |
| `/api/inventory` | POST | `requireOwner()` | 30/min | Create item. |
| `/api/inventory/[id]` | GET | `requireAuth()` | 120/min | Item detail. |
| `/api/inventory/[id]` | PATCH | `requireOwner()` | 30/min | Update master data (description, unit, articleNumber, minStock). `currentStock` is NOT directly editable — changes only through movements. |
| `/api/inventory/[id]` | DELETE | `requireOwner()` | 30/min | Delete. **Blocks (400)** if any `MaintenanceSetItem.inventoryItemId === id` OR `CustomerSystemPartOverride.inventoryItemId === id` exists. Owner must first unlink (PATCH the referencing item to `inventoryItemId: null`) or remove the reference manually. Error: "Teil wird noch in N Wartungsset-Einträgen verwendet — zuerst dort entfernen." Movements (`InventoryMovement` rows) referencing this item are cascade-deleted only after the block passes. |
| `/api/inventory/[id]/movements` | GET | `requireAuth()` | 120/min | Last 30 movements for this item (paginated). |
| `/api/inventory/[id]/movements` | POST | `requireOwner()` | 30/min | Manual `RESTOCK` or `CORRECTION` movement. `MAINTENANCE_USE` is never created via this route. |

### Maintenance (extensions to existing routes)

| Route | Method | Changes |
|-------|--------|---------|
| `/api/maintenances` | POST | Body extended with `partsUsed: PartUsageEntry[]`. Server transactionally: creates `Maintenance`, for each entry with `inventoryItemId` creates `InventoryMovement(MAINTENANCE_USE)` + decrements `InventoryItem.currentStock`, writes snapshot to `checklistData.partsUsed`. Response includes `negativeStockWarnings: { inventoryItemId, currentStock }[]`. |
| `/api/maintenances/[id]` | DELETE | Extended with R1 auto-reversal. Inside transaction: for each movement where `maintenanceId = X AND reason = MAINTENANCE_USE`, insert counter-movement `(CORRECTION, -original.quantityChange, maintenanceId: null, note: "Rückbuchung: Wartung gelöscht")` + adjust `currentStock`, then update original movements setting `maintenanceId = null`, then delete the maintenance. |

### Packing list

| Route | Method | Auth | Rate Limit | Purpose |
|-------|--------|------|------------|---------|
| `/api/bookings/[id]/packing-list` | GET | `requireAuth()` + TECH-scoping | 120/min | Returns `PackingListDTO` = `{ booking, customer, system, technician, effectiveParts: EffectivePart[] }`. TECH: only if `booking.assignedToUserId === userId` or 403. |

### Dashboard stats

| Route | Method | Changes |
|-------|--------|---------|
| `/api/dashboard/stats` | GET | Response extended with `inventoryBelowMinStockCount: number` (OWNER only — field omitted for TECHNICIAN response). |

### Zod schemas (new, in `src/lib/validations.ts`)

- `maintenanceSetCreateSchema` — `{ catalogId: uuid }`
- `maintenanceSetItemCreateSchema` — `{ category: enum, description: string(1..), articleNumber?: string, quantity: decimal(>0), unit: string, required?: bool, note?: string, sortOrder?: int, inventoryItemId?: uuid }` with refine: `category === 'TOOL' ⇒ inventoryItemId === undefined`
- `maintenanceSetItemUpdateSchema` — partial of above
- `maintenanceSetItemsReorderSchema` — `{ items: { id: uuid, sortOrder: int }[] }`
- `customerSystemOverrideAddSchema` — shape for ADD
- `customerSystemOverrideExcludeSchema` — `{ action: 'EXCLUDE', excludedSetItemId: uuid }`
- `customerSystemOverrideSchema` — discriminated union of the two on `action`
- `inventoryItemCreateSchema` — `{ description: string(1..), articleNumber?: string, unit: string, minStock: decimal(>=0) }`
- `inventoryItemUpdateSchema` — partial; explicitly omits `currentStock`
- `inventoryMovementCreateSchema` — `{ reason: 'RESTOCK' | 'CORRECTION', quantityChange: decimal(!=0), note?: string }`
- `partsUsedEntrySchema` — `{ sourceType: 'DEFAULT' | 'OVERRIDE_ADD' | 'AD_HOC', setItemId?: uuid, overrideId?: uuid, inventoryItemId?: uuid, description: string, articleNumber?: string, quantity: decimal(>=0), unit: string }` — included in extended `maintenanceCreateSchema.partsUsed`

---

## UX — pages, components, hooks

### New pages

```
src/app/dashboard/wartungssets/page.tsx                 OWNER — list view, grouped by SystemType → manufacturer
src/app/dashboard/wartungssets/[id]/page.tsx            OWNER — set detail with items table + add/edit/delete
src/app/dashboard/lager/page.tsx                        OWNER full / TECHNICIAN read-only
src/app/dashboard/termine/[id]/packliste/page.tsx       Print-optimized view (both roles, TECH scoped)
```

### New/modified components

```
src/components/maintenance-sets/
  MaintenanceSetList.tsx               Grouped list with search + "Neues Set" action
  MaintenanceSetDetail.tsx             Header + ItemsTable + reorder buttons (↑↓)
  MaintenanceSetItemForm.tsx           Modal: create/edit item
  MaintenanceSetItemsTable.tsx         Sortable table with inline category + required badges
  CatalogPickerForSetCreation.tsx      Variant of existing CatalogPicker

src/components/inventory/
  InventoryList.tsx                    Table with Status badges + row-click to drawer
  InventoryDrawer.tsx                  Follows /termine drawer pattern: details + last 30 movements + actions
  InventoryItemForm.tsx                Create/Edit modal (description, articleNumber, unit, minStock)
  InventoryMovementForm.tsx            Modal for manual RESTOCK / CORRECTION
  InventoryStatusBadge.tsx             "OK" / "Niedrig" / "Leer" with color variants
  LowStockDashboardCard.tsx            Dashboard card (OWNER only)

src/components/systems/
  PartsListCard.tsx                    New card on /dashboard/systems/[id]:
                                         · effective parts preview (collapsed)
                                         · "Standard-Wartungsset für [Modell]" (read-only section, "Bearbeiten →" Link for OWNER)
                                         · "Abweichungen für diese Anlage" (OWNER: editable, TECHNICIAN: read-only)
  CustomerSystemOverrideForm.tsx       Modal for ADD/EXCLUDE override
  CustomerSystemOverrideList.tsx       List view for overrides inside PartsListCard

src/components/maintenance/
  PartsUsageStep.tsx                   NEW — Step 2.5 in MaintenanceChecklistModal:
                                         · prefilled rows from effective parts
                                         · toggle "verwendet", quantity editor, "nicht verbraucht" button
                                         · "Zusatzteil erfassen" inline form (+ InventoryItem picker)
  MaintenanceChecklistModal.tsx        Extended: insert new step between notes/photos and confirm

src/components/packing-list/
  PackingListPrintView.tsx             Print-CSS styled:
                                         · header: Torqr logo, customer, system, technician, date
                                         · parts section (grouped by category, sorted by sortOrder)
                                         · per-row: checkbox, quantity, description, articleNumber, inventory status badge
                                         · footer: Druckdatum, signature line
```

### New React Query hooks

```
src/hooks/
  useMaintenanceSets.ts                useMaintenanceSets(), useMaintenanceSet(id),
                                       useCreateMaintenanceSet(), useDeleteMaintenanceSet()
  useMaintenanceSetItems.ts            useCreateSetItem(), useUpdateSetItem(), useDeleteSetItem(),
                                       useReorderSetItems()
  useCustomerSystemOverrides.ts        useCreateOverride(), useDeleteOverride()
  useEffectiveParts.ts                 useEffectiveParts(customerSystemId)
  useInventory.ts                      useInventoryItems(filter), useInventoryItem(id),
                                       useCreateInventoryItem(), useUpdateInventoryItem(), useDeleteInventoryItem()
  useInventoryMovements.ts             useInventoryMovements(itemId), useCreateMovement()
  usePackingList.ts                    usePackingList(bookingId)
```

All hooks follow Sprint 26 consistency pattern: `useMutation` + automatic cache invalidation via `queryClient.invalidateQueries`. No direct `fetch` in components.

### Navigation additions

Modified `Sidebar` component (path: existing sidebar in dashboard layout):

- **Wartungssets** — icon `ClipboardList`, role-gate: OWNER only
- **Lager** — icon `Package2`, visible to both; OWNER gets an amber badge showing low-stock count (`inventoryBelowMinStockCount`)

### Weekly summary email extension

`src/lib/email/templates/WeeklySummaryEmail.tsx` gets a new section (OWNER version only):

```
📦 Lager
3 Teile unter Mindestmenge:
  • Injektor 187628e (Bestand 1, Min 3)
  • Wartungskit 187803 (Bestand 0, Min 2)
  • Schlauch PE 4,35mm (Bestand 2, Min 10)
```

Top-5 items by (minStock − currentStock) descending. Section entirely omitted if `inventoryBelowMinStockCount === 0`.

Cron route `/api/cron/weekly-summary` and `sendWeeklySummary()` in `src/lib/email/service.tsx` need a parallel query for low-stock items per user's company. No new EmailType enum value — still `WEEKLY_SUMMARY`.

### Dashboard extension

`/dashboard/page.tsx` (OWNER branch) includes `LowStockDashboardCard`:
- Uses extended `GET /api/dashboard/stats` `inventoryBelowMinStockCount` field
- Click navigates to `/dashboard/lager?filter=low`
- Color: gray (0), amber (1–5 low), red (≥1 empty)

---

## Key Flows

### Flow 1 — Maintenance completion with parts consumption (Technician)

```
UI (MaintenanceChecklistModal)               Server (POST /api/maintenances)
─────────────────────────────                ──────────────────────────────
Step 1: Checklist
Step 2: Notes + photos
Step 2.5: Teileverbrauch (NEW)
  · prefilled via useEffectiveParts
  · toggle "verwendet"
  · adjust quantity
  · "Zusatzteil erfassen"
Step 3: Bestätigen
        │
        ▼
  POST body: {
    systemId, notes, photos,
    checklistData: { ... },
    partsUsed: PartUsageEntry[]
  }
                                      prisma.$transaction([
                                        1. maintenance.create({ companyId, userId,
                                                                systemId, date, notes,
                                                                photos, checklistData })
                                        2. for each entry in partsUsed where inventoryItemId:
                                             movement.create({
                                               reason: MAINTENANCE_USE,
                                               quantityChange: -quantity,
                                               maintenanceId, userId, companyId
                                             })
                                             inventoryItem.update({
                                               currentStock: { decrement: quantity }
                                             })
                                             if resulting stock < 0:
                                               warnings.push({ inventoryItemId, newStock })
                                        3. maintenance.update({
                                             checklistData: { ..., partsUsed: snapshot }
                                           })
                                      ])
                                      response: {
                                        maintenance,
                                        negativeStockWarnings: warnings
                                      }
        │
        ▼
  UI: success toast.
  If warnings.length > 0:
    toast.warn("Lager für 'Injektor 187628e' unterschritten — Bestand -1")
```

### Flow 2 — Maintenance delete with auto-reversal (Owner)

```
/dashboard/wartungen/[id] → "Löschen"
  AlertDialog:
    "Diese Wartung hat 3 Lagerbewegungen ausgelöst. Diese werden rückgebucht.
     Endgültig löschen?"
    [Abbrechen] [Löschen & Rückbuchen]
        │
        ▼
  DELETE /api/maintenances/[id]
                                      prisma.$transaction([
                                        1. origMovements = movement.findMany({
                                             maintenanceId, reason: MAINTENANCE_USE
                                           })
                                        2. for each m in origMovements:
                                             movement.create({
                                               reason: CORRECTION,
                                               quantityChange: -m.quantityChange,
                                               maintenanceId: null,
                                               note: "Rückbuchung: Wartung gelöscht",
                                               inventoryItemId: m.inventoryItemId,
                                               userId: currentUserId
                                             })
                                             inventoryItem.update({
                                               currentStock: { increment: abs(m.quantityChange) }
                                             })
                                        3. movement.updateMany({
                                             where: { maintenanceId, reason: MAINTENANCE_USE },
                                             data: { maintenanceId: null }
                                           })
                                        4. maintenance.delete({ where: { id } })
                                      ])
```

### Flow 3 — Packing list preparation (Owner)

```
/dashboard/termine/[bookingId] → BookingDetailsDrawer
  → "Packliste drucken" button
  → opens /dashboard/termine/[bookingId]/packliste in new tab
        │
        ▼
  usePackingList(bookingId) → GET /api/bookings/[id]/packing-list
     Server:
       - loads booking (scoped companyId)
       - loads system via booking.systemId
       - loads customer via booking.customerId
       - calls getEffectivePartsForSystem(system.id, companyId)
       - for each part with inventoryItem: compute stock status ("ausreichend" / "FEHLBESTAND")
  → PackingListPrintView renders print-CSS:
        Packliste — Wartung [Kunde], [Anlage]
        Termin: [Datum, Uhrzeit]
        Techniker: [Name]

        TEILE
         ☐  2× Injektor 187628e           Lager: 5 ✓
         ☐  1× Wartungskit 187803         Lager: 0 ⚠ FEHLBESTAND
         ☐  1× Servicekit (generisch)     (nicht im Lager erfasst)

        WERKZEUG
         ☐  Werkzeugkoffer Grünbeck
  → Browser Print → PDF or paper
```

### Flow 4 — Manual restock (Owner)

```
/dashboard/lager → row click → InventoryDrawer
  → "Zugang buchen"
  → InventoryMovementForm modal:
      fields: quantity (positive), note?
        │
        ▼
  POST /api/inventory/[id]/movements
    body: { reason: RESTOCK, quantityChange: +quantity, note? }
                                      prisma.$transaction([
                                        1. movement.create({ reason: RESTOCK, ... })
                                        2. inventoryItem.update({
                                             currentStock: { increment: quantity },
                                             lastRestockedAt: now()
                                           })
                                      ])
```

### Flow 5 — Override an installation's parts list (Owner)

```
/dashboard/systems/[id] → PartsListCard → "Abweichungen für diese Anlage" section
  ADD an extra part:
    → "Teil hinzufügen" → CustomerSystemOverrideForm (ADD mode)
      fields: category, description, quantity, unit, inventoryItem?, required, note?
    → POST /api/customer-systems/[id]/overrides { action: ADD, ... }
  EXCLUDE a default:
    → "Standard-Teil ausschließen" → select from default items in Standard set
    → POST /api/customer-systems/[id]/overrides { action: EXCLUDE, excludedSetItemId }
  Preview updates via useEffectiveParts → section "Effektive Liste" reflects new state
```

---

## Migration

Phased rollout, split across multiple Prisma migrations:

### Migration A: additive (Prisma `YYYYMMDDHHMMSS_add_maintenance_sets_and_inventory`)

Creates all new tables and enums:
- `maintenance_sets`
- `maintenance_set_items`
- `customer_system_part_overrides`
- `inventory_items`
- `inventory_movements`
- Enums: `PartCategory`, `OverrideAction`, `MovementReason`

Adds back-relations to existing models. **Does not touch `CustomerSystem.requiredParts`** — field continues to work for existing data during the rollout.

Zero downtime. Fully reversible.

### Data migration step: `scripts/migrate-required-parts.ts`

One-shot TypeScript script. Runs manually (not in Prisma migration pipeline):

```ts
// Pseudocode
for each customerSystem with requiredParts !== null && requiredParts !== '':
  override = CustomerSystemPartOverride.create({
    customerSystemId: customerSystem.id,
    action: ADD,
    category: SPARE_PART,
    description: customerSystem.requiredParts,
    quantity: 1,
    unit: 'Stck',
    required: true,
    sortOrder: 999,          // end of list — clearly legacy
    note: 'Aus Altdaten übernommen (ehem. requiredParts)'
  })
```

**Idempotent** via check: skip if an override with the same `description` + `note` starting with "Aus Altdaten übernommen" already exists for that system.

**Verification:** After running, manually compare: for each `CustomerSystem` that had `requiredParts`, confirm via `/dashboard/systems/[id]` PartsListCard that the text appears in the overrides section.

### Migration B: destructive (`YYYYMMDDHHMMSS_drop_required_parts_column`)

Separate commit, separate deploy, **only after production verification of data migration**:

```sql
ALTER TABLE "customer_systems" DROP COLUMN "requiredParts";
```

Not reversible without restore. Ship only when pilot confirms the Overrides card shows the legacy data correctly.

---

## Permissions matrix (consolidated)

| Endpoint / Action | OWNER | TECHNICIAN |
|-------------------|-------|------------|
| Nav "Wartungssets" | visible | hidden |
| Nav "Lager" | visible with low-stock badge | visible without badge |
| `GET /api/maintenance-sets*` | ✓ | 403 "Nur Inhaber dürfen Wartungssets verwalten" |
| `POST/PATCH/DELETE /api/maintenance-sets*` | ✓ | 403 |
| `POST/DELETE /api/customer-systems/[id]/overrides` | ✓ | 403 |
| `GET /api/customer-systems/[id]/effective-parts` | ✓ all systems | ✓ only where `system.assignedToUserId === userId` (else 403) |
| `GET /api/inventory*` | ✓ | ✓ read-only |
| `POST /api/inventory` | ✓ | 403 |
| `PATCH/DELETE /api/inventory/[id]` | ✓ | 403 |
| `POST /api/inventory/[id]/movements` | ✓ | 403 |
| `GET /api/inventory/[id]/movements` | ✓ | ✓ |
| `POST /api/maintenances` with `partsUsed` | ✓ | ✓ |
| `DELETE /api/maintenances/[id]` (reversal) | ✓ | 403 (already pre-existing rule from Sprint 26) |
| `GET /api/bookings/[id]/packing-list` | ✓ all | ✓ only where `booking.assignedToUserId === userId` (else 403) |
| Dashboard `LowStockDashboardCard` | visible | hidden |
| Weekly summary: Lager section | included | omitted |
| PartsListCard Override-Edit-Buttons | visible | hidden (read-only display) |
| MaintenanceChecklistModal Step 2.5 | ✓ | ✓ |

Enforcement via existing helpers in `src/lib/auth-helpers.ts`:
- `requireAuth()` — both roles
- `requireOwner()` — OWNER only, throws `Forbidden`

TECHNICIAN assignee-scoping uses Sprint 24 pattern: fetch system/booking with `where: { id, companyId }` and then assertion `if (role === 'TECHNICIAN' && assignedToUserId !== userId) throw Forbidden`.

---

## Testing

New Vitest test files following Sprint 26 conventions (real Prisma, no DB mocks, per CLAUDE.md). Target: ~20–25 new cases, full suite remains green.

```
tests/
  maintenance-sets.test.ts
    ✓ OWNER can create set — new row in maintenance_sets
    ✓ Unique (companyId, catalogId): second create with same catalog → 409
    ✓ TECHNICIAN: all methods → 403
    ✓ Cross-tenant: OWNER-A cannot read OWNER-B's set → 404
    ✓ DELETE cascades items but not the catalog (onDelete: Restrict)

  customer-system-overrides.test.ts
    ✓ ADD override valid
    ✓ ADD with missing description → 400 (Zod)
    ✓ EXCLUDE with missing excludedSetItemId → 400
    ✓ EXCLUDE with ADD fields populated → 400 (discriminated union)
    ✓ EXCLUDE with setItemId from different company → 404
    ✓ TOOL category with inventoryItemId → 400

  effective-parts.test.ts
    ✓ No MaintenanceSet → empty array
    ✓ Defaults only → returns set items
    ✓ With ADD → default items + ADD items, sorted
    ✓ With EXCLUDE → suppressed default item
    ✓ With both → correct union minus exclusions
    ✓ TECHNICIAN accessing unassigned system → 403

  inventory.test.ts
    ✓ Multiple items with articleNumber=NULL coexist (partial unique)
    ✓ Two items with articleNumber="187628e" in same company → 409
    ✓ Two items with articleNumber="187628e" across different companies → OK
    ✓ TECHNICIAN GET → 200 readonly; POST → 403
    ✓ DELETE blocked when referenced by MaintenanceSetItem

  inventory-movements.test.ts
    ✓ RESTOCK increments currentStock + sets lastRestockedAt
    ✓ CORRECTION adjusts currentStock, does NOT touch lastRestockedAt
    ✓ Manual MAINTENANCE_USE via POST → 400 (only allowed via maintenance create)
    ✓ Transaction rollback on invalid inventoryItemId — no orphan movement

  maintenances-with-parts.test.ts
    ✓ partsUsed with linked item: movement + stock decrement + snapshot
    ✓ partsUsed with unlinked item: no movement, but snapshot
    ✓ Negative stock: currentStock goes negative + negativeStockWarnings in response
    ✓ TOOL in partsUsed with inventoryItemId → 400

  maintenance-delete-reversal.test.ts
    ✓ Delete inserts CORRECTION per MAINTENANCE_USE movement
    ✓ Original movements have maintenanceId = null after delete
    ✓ currentStock restored to pre-maintenance value
    ✓ Audit: can still query all movements for the (now-deleted) maintenance via note

  packing-list.test.ts
    ✓ Content includes effective parts + inventory status flags
    ✓ OWNER accessing any booking → 200
    ✓ TECHNICIAN accessing unassigned booking → 403

  tenant-isolation.test.ts (extended)
    ✓ All new route files scan cleanly (companyId-scoping or documented exception)
```

### Rate-limit usage

All new authenticated endpoints wrap `rateLimitByUser()` with the existing `RATE_LIMIT_PRESETS.API_USER` preset (100/min, defined in `src/lib/rate-limit.ts`). **No new presets are added in Phase A** — the existing tier is sufficient and keeps ops surface small. The "30/min" and "120/min" figures in the API route tables above are the **intent** per endpoint class; they are realized today through the single `API_USER` preset. If pilot operations reveal a need for tighter throttling on specific write endpoints, a dedicated preset can be added later as a trivial follow-up.

### Tenant-isolation audit

`tests/tenant-isolation.test.ts` (Sprint 23 setup) adds entries for:
- `/api/maintenance-sets`
- `/api/maintenance-sets/[id]`
- `/api/maintenance-sets/[id]/items`
- `/api/maintenance-set-items/[id]`
- `/api/overrides/[id]`
- `/api/customer-systems/[id]/overrides`
- `/api/customer-systems/[id]/effective-parts`
- `/api/inventory`, `/api/inventory/[id]`, `/api/inventory/[id]/movements`
- `/api/bookings/[id]/packing-list`

If a new route file is merged without being listed, the audit test fails.

---

## Manual verification checklist (pre-merge)

1. OWNER creates a MaintenanceSet for Grünbeck "GSX 10" with 3 items: 1 linked to new InventoryItem `187628e`, 1 untracked (`SPARE_PART`, no `inventoryItemId`), 1 `TOOL`
2. OWNER opens `/dashboard/systems/[id]` for a customer system of that model — Standard-Set preview visible, overrides section empty
3. OWNER adds an ADD-override "Zusatzschlauch 2 m" and an EXCLUDE-override on one default item
4. TECHNICIAN logs in — "Wartungssets" nav absent; "Lager" nav present without badge and without write buttons
5. TECHNICIAN starts maintenance on that system — Step 2.5 shows effective parts (defaults minus EXCLUDE, plus ADD)
6. TECHNICIAN confirms all parts + adds one unexpected part linked to InventoryItem — save completes
7. `/dashboard/lager` shows currentStock correctly reduced; row-click drawer shows `MAINTENANCE_USE` movements
8. TECHNICIAN attempts to consume 10× of an item with currentStock = 2 — save succeeds with toast "Lager für 'Injektor 187628e' unterschritten"; Lager list shows "leer" badge
9. OWNER deletes that maintenance — dialog lists "3 Lagerbewegungen werden rückgebucht" — after delete: currentStock restored, movement log shows original + CORRECTION pairs
10. OWNER opens the packing list for a booking — print-view renders correctly, inventory status badges present, prints to PDF via browser
11. OWNER sees `LowStockDashboardCard` when at least one inventory item has `currentStock < minStock`
12. Trigger weekly summary manually (via cron endpoint) — OWNER email contains "Lager" section with top-5 items; TECHNICIAN email does not
13. After legacy data migration: a customer system that previously had `requiredParts` text now shows that text as an ADD-override in the PartsListCard

---

## Backlog entries to add

To `docs/BACKLOG.md` under `## Maybe / Future`:

| # | Area | Description | Notes |
|---|------|-------------|-------|
| N-1 | Feature | **Packliste per E-Mail senden** (L2 variant) — owner requests packing list via email button; new `PackingListEmail` React-Email template. | Phase B; small incremental effort on top of existing print view. |
| N-2 | Feature | **Bestellworkflow** — order suggestions from low-stock alerts, supplier link templates, order status tracking (bestellt → geliefert → eingebaut). | Phase B; requires supplier master-data concept. |
| N-3 | Feature | **Echtzeit-Lager-Alert-Mail** — S3 variant; per-event email on first threshold breach with debounce. | Phase B; only if weekly summary + dashboard card prove insufficient. |
| N-4 | Feature | **Multi-Wartungstyp** — add `maintenanceType: STANDARD \| INSPECTION \| EMERGENCY` to `MaintenanceSet`; relax unique to `(companyId, catalogId, maintenanceType)`; add UI selector in checklist modal. | Schema hook-point preserved (additive). Trigger when pilot requests separate inspection sets. |
| N-5 | Feature | **PDF-Import für Wartungssets** — install tesseract + ocrmypdf + poppler pdftoppm; parse manufacturer service-parts PDFs (e.g. the Bosch/Junkers Wartungsheft); reviewer UI to confirm each extracted row before seeding MaintenanceSetItems. | Phase B. Dependency on OCR tooling install. |
| N-6 | Feature | **Per-Item-Foto** — optional photo upload on MaintenanceSetItem for on-site identification. | Phase B; needs storage bucket extension. |
| N-7 | Feature | **CSV/XLSX-Bulk-Import** for InventoryItems and MaintenanceSetItems. | Combine with existing backlog #25 (customer import). |
| N-8 | Integration | **Drittanbieter-Lager-Integration** (Sortly / Doron / Fifo) — evaluate making InventoryItem syncable rather than authoritative. | Phase C; architectural reevaluation of own-inventory vs sync. |
| N-9 | Integration | **Hersteller-Teile-Kataloge** (Bosch Pro, Grünbeck) — API-driven default sets where available. | Phase D; needs API reconnaissance. |
| N-10 | Architecture | **Community-Wartungssets** — revisit Option C (global defaults + tenant overrides) from brainstorming Q1 once pilot + 2 more tenants are onboarded. | Phase D; speculative. |
| N-11 | UX | **Drag-and-Drop Reorder** for MaintenanceSetItems (Phase A ships with ↑↓ buttons only). | Pair with existing backlog `M-3`. |

Plus: the Bosch Wartungsheft PDF in `kundenaustausch/Wartungsteile/` awaits `N-5`. The extracted `maintenance_parts_extracted.json` (Grünbeck partial extraction) remains in the repo as reference material.

---

## Open points / deferred details

These are non-blocking for implementation but flagged for attention during the writing-plans phase:

- **Packing-list print CSS** — layout is described textually; concrete print stylesheet (`@media print`), logo inclusion, and exact typography are a small follow-up design pass.
- **Category labels helper** — ship a `formatPartCategory(cat: PartCategory): string` in `src/lib/format.ts` (or adjacent): `SPARE_PART` → "Ersatzteil", `CONSUMABLE` → "Verbrauchsmaterial", `TOOL` → "Werkzeug". Implementation detail, not worth a separate spec section.
