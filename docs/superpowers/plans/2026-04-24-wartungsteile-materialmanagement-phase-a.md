# Wartungsteile & Materialmanagement Phase A — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a tenant-scoped maintenance-parts library + light inventory + active technician consumption tracking + on-demand packing lists, replacing the existing `CustomerSystem.requiredParts` free-text field.

**Architecture:** Five new Prisma models (`MaintenanceSet`, `MaintenanceSetItem`, `CustomerSystemPartOverride`, `InventoryItem`, `InventoryMovement`) with a hybrid anchoring pattern — defaults per `SystemCatalog` at the tenant level, additions/exclusions per `CustomerSystem`. A single server-side resolver (`getEffectivePartsForSystem`) feeds all downstream consumers (packing list, technician step, UI previews). Stock changes flow exclusively through transactional `InventoryMovement` inserts; `currentStock` is a denormalized cache updated in the same Prisma transaction. Technician consumption is a new step in the existing `MaintenanceChecklistModal`; maintenance delete auto-reverses via CORRECTION movements in the same transaction (R1 policy).

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Prisma, NextAuth v5, React Query v5, Zod, Tailwind + shadcn/ui, Vitest, React Hook Form, Resend + React Email.

**Spec reference:** [docs/superpowers/specs/2026-04-24-wartungsteile-materialmanagement-phase-a-design.md](../specs/2026-04-24-wartungsteile-materialmanagement-phase-a-design.md)

---

## File Structure

| Path | Action | Responsibility |
|------|--------|----------------|
| `prisma/schema.prisma` | Modify | Add 5 models (`MaintenanceSet`, `MaintenanceSetItem`, `CustomerSystemPartOverride`, `InventoryItem`, `InventoryMovement`), 3 enums (`PartCategory`, `OverrideAction`, `MovementReason`), back-relations on existing models |
| `prisma/migrations/20260424090000_add_maintenance_sets_and_inventory/migration.sql` | Create | Additive SQL migration |
| `prisma/migrations/20260424200000_drop_customer_systems_required_parts/migration.sql` | Create (last task) | Destructive: drop `requiredParts` column after data migration |
| `scripts/migrate-required-parts.ts` | Create | One-shot data migration: `requiredParts` text → `CustomerSystemPartOverride` ADD rows |
| `src/lib/validations.ts` | Modify | New Zod schemas for sets, items, overrides, inventory, movements; extend `maintenanceCreateSchema` with `partsUsed[]` |
| `src/lib/format.ts` | Create or Modify | `formatPartCategory` helper |
| `src/lib/maintenance-parts.ts` | Create | `getEffectivePartsForSystem` resolver |
| `src/lib/__tests__/maintenance-parts.test.ts` | Create | Resolver tests |
| `src/lib/__tests__/validations-parts.test.ts` | Create | Zod refine tests for overrides + TOOL enforcement |
| `src/lib/__tests__/tenant-isolation.test.ts` | Modify | Add new route files to scanned list |
| `src/app/api/maintenance-sets/route.ts` | Create | `GET` list + `POST` create |
| `src/app/api/maintenance-sets/__tests__/route.test.ts` | Create | Tests |
| `src/app/api/maintenance-sets/[id]/route.ts` | Create | `GET` detail + `DELETE` |
| `src/app/api/maintenance-sets/[id]/__tests__/route.test.ts` | Create | Tests |
| `src/app/api/maintenance-sets/[id]/items/route.ts` | Create | `POST` add item |
| `src/app/api/maintenance-sets/[id]/items/reorder/route.ts` | Create | `PATCH` bulk reorder |
| `src/app/api/maintenance-sets/[id]/items/__tests__/route.test.ts` | Create | Tests |
| `src/app/api/maintenance-set-items/[id]/route.ts` | Create | `PATCH` + `DELETE` single item |
| `src/app/api/maintenance-set-items/[id]/__tests__/route.test.ts` | Create | Tests |
| `src/app/api/customer-systems/[id]/overrides/route.ts` | Create | `POST` override (ADD or EXCLUDE) |
| `src/app/api/customer-systems/[id]/overrides/__tests__/route.test.ts` | Create | Tests |
| `src/app/api/customer-systems/[id]/effective-parts/route.ts` | Create | `GET` effective parts (resolver wrapper) |
| `src/app/api/customer-systems/[id]/effective-parts/__tests__/route.test.ts` | Create | Tests |
| `src/app/api/overrides/[id]/route.ts` | Create | `DELETE` override |
| `src/app/api/overrides/[id]/__tests__/route.test.ts` | Create | Tests |
| `src/app/api/inventory/route.ts` | Create | `GET` list + `POST` create |
| `src/app/api/inventory/__tests__/route.test.ts` | Create | Tests (unique partial, role scoping) |
| `src/app/api/inventory/[id]/route.ts` | Create | `GET` + `PATCH` + `DELETE` (with reference-block) |
| `src/app/api/inventory/[id]/__tests__/route.test.ts` | Create | Tests |
| `src/app/api/inventory/[id]/movements/route.ts` | Create | `GET` list + `POST` manual (RESTOCK / CORRECTION) |
| `src/app/api/inventory/[id]/movements/__tests__/route.test.ts` | Create | Tests |
| `src/app/api/maintenances/route.ts` | Modify | Extend `POST` with `partsUsed[]` transactional handling |
| `src/app/api/maintenances/__tests__/route.test.ts` | Create or Modify | Tests for partsUsed + negative-stock warnings |
| `src/app/api/maintenances/[id]/route.ts` | Modify | Extend `DELETE` with R1 reversal |
| `src/app/api/maintenances/[id]/__tests__/route.test.ts` | Create or Modify | Tests for reversal |
| `src/app/api/bookings/[id]/packing-list/route.ts` | Create | `GET` packing-list DTO |
| `src/app/api/bookings/[id]/packing-list/__tests__/route.test.ts` | Create | Tests |
| `src/app/api/dashboard/stats/route.ts` | Modify | Add `inventoryBelowMinStockCount` (OWNER only) |
| `src/hooks/useMaintenanceSets.ts` | Create | React Query hooks for sets |
| `src/hooks/useMaintenanceSetItems.ts` | Create | Item mutations + reorder |
| `src/hooks/useCustomerSystemOverrides.ts` | Create | Override mutations |
| `src/hooks/useEffectiveParts.ts` | Create | Resolver query hook |
| `src/hooks/useInventory.ts` | Create | Inventory queries + mutations |
| `src/hooks/useInventoryMovements.ts` | Create | Movement queries + mutations |
| `src/hooks/usePackingList.ts` | Create | Packing-list query |
| `src/components/DashboardNav.tsx` | Modify | Add Wartungssets + Lager nav entries (role-gated) |
| `src/app/dashboard/wartungssets/page.tsx` | Create | OWNER list page |
| `src/app/dashboard/wartungssets/[id]/page.tsx` | Create | OWNER detail page |
| `src/components/maintenance-sets/MaintenanceSetList.tsx` | Create | Grouped list |
| `src/components/maintenance-sets/MaintenanceSetDetail.tsx` | Create | Header + items table |
| `src/components/maintenance-sets/MaintenanceSetItemForm.tsx` | Create | Create/edit item modal |
| `src/components/maintenance-sets/MaintenanceSetItemsTable.tsx` | Create | Table with ↑↓ reorder |
| `src/components/maintenance-sets/CatalogPickerForSetCreation.tsx` | Create | Catalog-picker modal for new set |
| `src/app/dashboard/lager/page.tsx` | Create | OWNER full / TECH read-only list |
| `src/components/inventory/InventoryList.tsx` | Create | Table |
| `src/components/inventory/InventoryStatusBadge.tsx` | Create | ok/niedrig/leer badge |
| `src/components/inventory/InventoryDrawer.tsx` | Create | Detail drawer with movement history |
| `src/components/inventory/InventoryItemForm.tsx` | Create | Create/edit modal |
| `src/components/inventory/InventoryMovementForm.tsx` | Create | RESTOCK / CORRECTION modal |
| `src/components/inventory/LowStockDashboardCard.tsx` | Create | Dashboard card (OWNER) |
| `src/components/systems/PartsListCard.tsx` | Create | System-detail card |
| `src/components/systems/CustomerSystemOverrideForm.tsx` | Create | Override modal |
| `src/components/systems/CustomerSystemOverrideList.tsx` | Create | Override list inside card |
| `src/app/dashboard/systems/[id]/page.tsx` | Modify | Insert `PartsListCard` |
| `src/components/maintenance/PartsUsageStep.tsx` | Create | New Step 2.5 |
| `src/components/maintenance/MaintenanceChecklistModal.tsx` | Modify | Insert new step before confirm |
| `src/app/dashboard/termine/[id]/packliste/page.tsx` | Create | Print view page |
| `src/components/packing-list/PackingListPrintView.tsx` | Create | Print layout |
| `src/components/termine/BookingDetailsDrawer.tsx` | Modify | Add "Packliste drucken" button |
| `src/app/dashboard/page.tsx` | Modify | Insert `LowStockDashboardCard` (OWNER branch) |
| `src/lib/email/templates/WeeklySummaryEmail.tsx` | Modify | New Lager section (OWNER only) |
| `src/lib/email/service.tsx` | Modify | Pass low-stock data to template |
| `src/app/api/cron/weekly-summary/route.ts` | Modify | Query low-stock items per user |
| `docs/BACKLOG.md` | Modify | Add N-1..N-11 Maybe/Future entries |

---

## Task 1: Prisma schema — add models + enums + relations

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260424090000_add_maintenance_sets_and_inventory/migration.sql`

- [ ] **Step 1: Append new enums + models to `prisma/schema.prisma`**

Add to the end of the file:

```prisma
// ============================================================================
// MAINTENANCE SETS (tenant-scoped parts library)
// ============================================================================

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

enum OverrideAction {
  ADD
  EXCLUDE
}

model CustomerSystemPartOverride {
  id                 String         @id @default(uuid())
  customerSystemId   String
  action             OverrideAction

  category           PartCategory?
  description        String?
  articleNumber      String?
  quantity           Decimal?
  unit               String?
  required           Boolean        @default(true)
  note               String?
  sortOrder          Int            @default(0)
  inventoryItemId    String?

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

// ============================================================================
// INVENTORY (tenant-scoped)
// ============================================================================

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
  quantityChange  Decimal
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

- [ ] **Step 2: Add back-relations to existing models**

Edit the existing `Company`, `SystemCatalog`, `CustomerSystem`, `Maintenance`, `User` models. For each, add the relation fields listed:

`Company`:
```prisma
maintenanceSets     MaintenanceSet[]
inventoryItems      InventoryItem[]
inventoryMovements  InventoryMovement[]
```

`SystemCatalog`:
```prisma
maintenanceSets MaintenanceSet[]
```

`CustomerSystem`:
```prisma
partOverrides CustomerSystemPartOverride[]
```

`Maintenance`:
```prisma
inventoryMovements InventoryMovement[]
```

`User`:
```prisma
inventoryMovements InventoryMovement[]
```

**Do not** drop `CustomerSystem.requiredParts` yet — that's a later task.

- [ ] **Step 3: Generate the migration**

Run:

```bash
npx prisma migrate dev --name add_maintenance_sets_and_inventory --config config/prisma.config.ts
```

Expected: Prisma creates `prisma/migrations/20260424XXXXXX_add_maintenance_sets_and_inventory/migration.sql` with `CREATE TABLE` for all five tables and `CREATE TYPE` for the three enums, runs it against the local/staging DB, regenerates the client.

- [ ] **Step 4: Verify generated SQL**

Inspect `migration.sql`. Confirm:
- 3 `CREATE TYPE` statements: `PartCategory`, `OverrideAction`, `MovementReason`
- 5 `CREATE TABLE` statements with `@@map` names: `maintenance_sets`, `maintenance_set_items`, `customer_system_part_overrides`, `inventory_items`, `inventory_movements`
- `ALTER TABLE` adding FKs, with correct `ON DELETE` semantics (`RESTRICT` on `MaintenanceSet.catalogId`, `SET NULL` on `inventoryItemId` and `maintenanceId`, `CASCADE` on `companyId` and `customerSystemId` and `excludedSetItemId`)
- Unique constraint `(companyId, catalogId)` on `maintenance_sets`
- Unique constraint `(companyId, articleNumber)` on `inventory_items`

- [ ] **Step 5: Run a smoke test**

```bash
npx prisma generate --config config/prisma.config.ts
npm test -- src/test/smoke.test.ts
```

Expected: PASS. Prisma client types for `maintenanceSet`, `inventoryItem`, etc. are now available.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): add MaintenanceSet, InventoryItem, and related models"
```

---

## Task 2: Zod schemas + discriminated union + TOOL enforcement

**Files:**
- Modify: `src/lib/validations.ts`
- Create: `src/lib/__tests__/validations-parts.test.ts`

- [ ] **Step 1: Write failing refine tests**

Create `src/lib/__tests__/validations-parts.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  maintenanceSetItemCreateSchema,
  customerSystemOverrideSchema,
  inventoryItemCreateSchema,
  inventoryMovementCreateSchema,
  partsUsedEntrySchema,
} from '@/lib/validations';

describe('maintenanceSetItemCreateSchema', () => {
  it('rejects TOOL category with inventoryItemId', () => {
    const r = maintenanceSetItemCreateSchema.safeParse({
      category: 'TOOL',
      description: 'Werkzeugkoffer',
      quantity: 1,
      unit: 'Stck',
      inventoryItemId: 'abc-uuid',
    });
    expect(r.success).toBe(false);
  });

  it('accepts TOOL without inventoryItemId', () => {
    const r = maintenanceSetItemCreateSchema.safeParse({
      category: 'TOOL',
      description: 'Werkzeugkoffer',
      quantity: 1,
      unit: 'Stck',
    });
    expect(r.success).toBe(true);
  });

  it('accepts SPARE_PART with inventoryItemId', () => {
    const r = maintenanceSetItemCreateSchema.safeParse({
      category: 'SPARE_PART',
      description: 'Injektor',
      quantity: 2,
      unit: 'Stck',
      inventoryItemId: 'abc-uuid',
    });
    expect(r.success).toBe(true);
  });
});

describe('customerSystemOverrideSchema (discriminated union)', () => {
  it('accepts ADD with required fields', () => {
    const r = customerSystemOverrideSchema.safeParse({
      action: 'ADD',
      category: 'CONSUMABLE',
      description: 'Öl',
      quantity: 0.25,
      unit: 'l',
    });
    expect(r.success).toBe(true);
  });

  it('rejects ADD missing description', () => {
    const r = customerSystemOverrideSchema.safeParse({
      action: 'ADD',
      category: 'CONSUMABLE',
      quantity: 1,
      unit: 'Stck',
    });
    expect(r.success).toBe(false);
  });

  it('rejects ADD with TOOL + inventoryItemId', () => {
    const r = customerSystemOverrideSchema.safeParse({
      action: 'ADD',
      category: 'TOOL',
      description: 'Zange',
      quantity: 1,
      unit: 'Stck',
      inventoryItemId: 'abc-uuid',
    });
    expect(r.success).toBe(false);
  });

  it('accepts EXCLUDE with excludedSetItemId', () => {
    const r = customerSystemOverrideSchema.safeParse({
      action: 'EXCLUDE',
      excludedSetItemId: 'abc-uuid',
    });
    expect(r.success).toBe(true);
  });

  it('rejects EXCLUDE missing excludedSetItemId', () => {
    const r = customerSystemOverrideSchema.safeParse({
      action: 'EXCLUDE',
    });
    expect(r.success).toBe(false);
  });

  it('rejects EXCLUDE with ADD fields present', () => {
    const r = customerSystemOverrideSchema.safeParse({
      action: 'EXCLUDE',
      excludedSetItemId: 'abc-uuid',
      category: 'SPARE_PART',
    });
    expect(r.success).toBe(false);
  });
});

describe('inventoryMovementCreateSchema', () => {
  it('rejects MAINTENANCE_USE (only RESTOCK or CORRECTION allowed via manual endpoint)', () => {
    const r = inventoryMovementCreateSchema.safeParse({
      reason: 'MAINTENANCE_USE',
      quantityChange: -1,
    });
    expect(r.success).toBe(false);
  });

  it('rejects quantityChange = 0', () => {
    const r = inventoryMovementCreateSchema.safeParse({
      reason: 'CORRECTION',
      quantityChange: 0,
    });
    expect(r.success).toBe(false);
  });

  it('accepts RESTOCK with positive delta', () => {
    const r = inventoryMovementCreateSchema.safeParse({
      reason: 'RESTOCK',
      quantityChange: 10,
    });
    expect(r.success).toBe(true);
  });

  it('accepts CORRECTION with negative delta', () => {
    const r = inventoryMovementCreateSchema.safeParse({
      reason: 'CORRECTION',
      quantityChange: -3,
      note: 'Inventur',
    });
    expect(r.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- src/lib/__tests__/validations-parts.test.ts
```

Expected: FAIL — schemas don't exist yet.

- [ ] **Step 3: Implement schemas in `src/lib/validations.ts`**

Append to the end of `src/lib/validations.ts`:

```ts
// ============================================================================
// MAINTENANCE SETS + INVENTORY (Phase A)
// ============================================================================

export const partCategoryEnum = z.enum(['SPARE_PART', 'CONSUMABLE', 'TOOL']);
export const overrideActionEnum = z.enum(['ADD', 'EXCLUDE']);
export const movementReasonEnum = z.enum([
  'MAINTENANCE_USE',
  'MANUAL_ADJUSTMENT',
  'RESTOCK',
  'CORRECTION',
]);

const decimalPositive = z.coerce.number().positive();
const decimalNonZero = z.coerce.number().refine((v) => v !== 0, {
  message: 'Menge darf nicht 0 sein',
});

export const maintenanceSetCreateSchema = z.object({
  catalogId: z.string().uuid(),
});

const maintenanceSetItemBase = z.object({
  category: partCategoryEnum,
  description: z.string().min(1),
  articleNumber: z.string().optional(),
  quantity: decimalPositive.default(1),
  unit: z.string().min(1).default('Stck'),
  required: z.boolean().optional().default(true),
  note: z.string().optional(),
  sortOrder: z.number().int().optional().default(0),
  inventoryItemId: z.string().uuid().optional(),
});

const toolRefineMessage = {
  message: 'Werkzeug darf nicht an ein Lagerteil gebunden sein',
  path: ['inventoryItemId'] as const,
};

export const maintenanceSetItemCreateSchema = maintenanceSetItemBase.refine(
  (d) => !(d.category === 'TOOL' && d.inventoryItemId),
  toolRefineMessage,
);

export const maintenanceSetItemUpdateSchema = maintenanceSetItemBase.partial().refine(
  (d) => !(d.category === 'TOOL' && d.inventoryItemId),
  toolRefineMessage,
);

export const maintenanceSetItemsReorderSchema = z.object({
  items: z.array(z.object({ id: z.string().uuid(), sortOrder: z.number().int() })),
});

const overrideAddSchema = z
  .object({
    action: z.literal('ADD'),
    category: partCategoryEnum,
    description: z.string().min(1),
    articleNumber: z.string().optional(),
    quantity: decimalPositive,
    unit: z.string().min(1),
    required: z.boolean().optional().default(true),
    note: z.string().optional(),
    sortOrder: z.number().int().optional().default(0),
    inventoryItemId: z.string().uuid().optional(),
    excludedSetItemId: z.undefined(),
  })
  .refine((d) => !(d.category === 'TOOL' && d.inventoryItemId), {
    message: 'Werkzeug darf nicht an ein Lagerteil gebunden sein',
    path: ['inventoryItemId'],
  });

const overrideExcludeSchema = z.object({
  action: z.literal('EXCLUDE'),
  excludedSetItemId: z.string().uuid(),
  // All ADD-fields must be undefined
  category: z.undefined(),
  description: z.undefined(),
  articleNumber: z.undefined(),
  quantity: z.undefined(),
  unit: z.undefined(),
  required: z.undefined(),
  note: z.undefined(),
  sortOrder: z.undefined(),
  inventoryItemId: z.undefined(),
});

export const customerSystemOverrideSchema = z.discriminatedUnion('action', [
  overrideAddSchema,
  overrideExcludeSchema,
]);

export const inventoryItemCreateSchema = z.object({
  description: z.string().min(1),
  articleNumber: z.string().optional(),
  unit: z.string().min(1).default('Stck'),
  minStock: z.coerce.number().min(0).default(0),
});

export const inventoryItemUpdateSchema = inventoryItemCreateSchema.partial();

export const inventoryMovementCreateSchema = z
  .object({
    reason: z.enum(['RESTOCK', 'CORRECTION']),
    quantityChange: decimalNonZero,
    note: z.string().optional(),
  })
  .strict();

export const partsUsedEntrySchema = z.object({
  sourceType: z.enum(['DEFAULT', 'OVERRIDE_ADD', 'AD_HOC']),
  setItemId: z.string().uuid().optional(),
  overrideId: z.string().uuid().optional(),
  inventoryItemId: z.string().uuid().optional(),
  description: z.string().min(1),
  articleNumber: z.string().optional(),
  quantity: z.coerce.number().min(0),
  unit: z.string().min(1),
});
```

- [ ] **Step 4: Extend `maintenanceCreateSchema` to include `partsUsed`**

Find the existing `maintenanceCreateSchema` in the same file. Add a `partsUsed` field:

```ts
export const maintenanceCreateSchema = z.object({
  // ... existing fields ...
  partsUsed: z.array(partsUsedEntrySchema).optional().default([]),
});
```

If ordering matters (schema defined before `partsUsedEntrySchema`), move `partsUsedEntrySchema` declaration **above** `maintenanceCreateSchema` in the file.

- [ ] **Step 5: Run tests**

```bash
npm test -- src/lib/__tests__/validations-parts.test.ts
```

Expected: PASS — 14+ test cases.

- [ ] **Step 6: Run the full test suite to confirm no regressions**

```bash
npm test
```

Expected: all previously-passing tests still pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/validations.ts src/lib/__tests__/validations-parts.test.ts
git commit -m "feat(validations): add Zod schemas for sets, overrides, inventory, and partsUsed"
```

---

## Task 3: Formatter helper for category labels

**Files:**
- Create or Modify: `src/lib/format.ts` (check if exists; create if not)
- Create: `src/lib/__tests__/format.test.ts` (if creating)

- [ ] **Step 1: Check whether `src/lib/format.ts` exists**

```bash
ls src/lib/format.ts 2>/dev/null || echo "does not exist"
```

If it exists, append. Otherwise create.

- [ ] **Step 2: Add `formatPartCategory` helper**

```ts
import type { PartCategory } from '@prisma/client';

export function formatPartCategory(cat: PartCategory): string {
  switch (cat) {
    case 'SPARE_PART': return 'Ersatzteil';
    case 'CONSUMABLE': return 'Verbrauchsmaterial';
    case 'TOOL': return 'Werkzeug';
  }
}
```

- [ ] **Step 3: Add a trivial test**

`src/lib/__tests__/format.test.ts` (create or append):

```ts
import { describe, expect, it } from 'vitest';
import { formatPartCategory } from '@/lib/format';

describe('formatPartCategory', () => {
  it.each([
    ['SPARE_PART', 'Ersatzteil'],
    ['CONSUMABLE', 'Verbrauchsmaterial'],
    ['TOOL', 'Werkzeug'],
  ] as const)('maps %s → %s', (cat, expected) => {
    expect(formatPartCategory(cat)).toBe(expected);
  });
});
```

- [ ] **Step 4: Run the tests**

```bash
npm test -- src/lib/__tests__/format.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/format.ts src/lib/__tests__/format.test.ts
git commit -m "feat(format): add formatPartCategory helper"
```

---

## Task 4: Effective-parts resolver

**Files:**
- Create: `src/lib/maintenance-parts.ts`
- Create: `src/lib/__tests__/maintenance-parts.test.ts`

- [ ] **Step 1: Write failing tests (real DB, following Sprint 26 pattern)**

Create `src/lib/__tests__/maintenance-parts.test.ts`. Use the existing test helpers (check `src/lib/__tests__/*.test.ts` for the established DB-fixture pattern; typical setup creates a Company + User + Customer + SystemCatalog + CustomerSystem, cleans up in `afterEach`).

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getEffectivePartsForSystem } from '@/lib/maintenance-parts';

// Helper (duplicate in this test file for isolation; do not extract until pattern repeats ≥3 times)
async function seed() {
  const company = await prisma.company.create({ data: { name: 'Test GmbH' } });
  const user = await prisma.user.create({
    data: {
      email: `t-${Date.now()}@t.de`,
      name: 'T',
      passwordHash: 'x',
      companyId: company.id,
    },
  });
  const customer = await prisma.customer.create({
    data: {
      name: 'K', street: 's', zipCode: '1', city: 'c', phone: 'p',
      companyId: company.id, userId: user.id,
    },
  });
  const catalog = await prisma.systemCatalog.create({
    data: { systemType: 'HEATING', manufacturer: 'Test', name: 'M1' },
  });
  const system = await prisma.customerSystem.create({
    data: {
      catalogId: catalog.id, customerId: customer.id, companyId: company.id,
      userId: user.id, maintenanceInterval: 12,
    },
  });
  return { company, user, customer, catalog, system };
}

describe('getEffectivePartsForSystem', () => {
  afterEach(async () => {
    await prisma.customerSystemPartOverride.deleteMany();
    await prisma.maintenanceSetItem.deleteMany();
    await prisma.maintenanceSet.deleteMany();
    await prisma.customerSystem.deleteMany();
    await prisma.systemCatalog.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
  });

  it('returns empty array when no MaintenanceSet exists', async () => {
    const { system, company } = await seed();
    const parts = await getEffectivePartsForSystem(system.id, company.id);
    expect(parts).toEqual([]);
  });

  it('returns default set items when no overrides', async () => {
    const { system, catalog, company } = await seed();
    const set = await prisma.maintenanceSet.create({
      data: { companyId: company.id, catalogId: catalog.id },
    });
    await prisma.maintenanceSetItem.create({
      data: {
        maintenanceSetId: set.id, category: 'SPARE_PART',
        description: 'Injektor', quantity: 2, unit: 'Stck', sortOrder: 1,
      },
    });
    const parts = await getEffectivePartsForSystem(system.id, company.id);
    expect(parts).toHaveLength(1);
    expect(parts[0].source).toBe('DEFAULT');
    expect(parts[0].description).toBe('Injektor');
  });

  it('includes ADD overrides', async () => {
    const { system, catalog, company } = await seed();
    await prisma.maintenanceSet.create({
      data: { companyId: company.id, catalogId: catalog.id },
    });
    await prisma.customerSystemPartOverride.create({
      data: {
        customerSystemId: system.id, action: 'ADD',
        category: 'CONSUMABLE', description: 'Öl',
        quantity: 0.25, unit: 'l', sortOrder: 2,
      },
    });
    const parts = await getEffectivePartsForSystem(system.id, company.id);
    expect(parts).toHaveLength(1);
    expect(parts[0].source).toBe('OVERRIDE_ADD');
  });

  it('suppresses default items via EXCLUDE overrides', async () => {
    const { system, catalog, company } = await seed();
    const set = await prisma.maintenanceSet.create({
      data: { companyId: company.id, catalogId: catalog.id },
    });
    const item = await prisma.maintenanceSetItem.create({
      data: {
        maintenanceSetId: set.id, category: 'SPARE_PART',
        description: 'Chlorzelle', quantity: 1, unit: 'Stck',
      },
    });
    await prisma.customerSystemPartOverride.create({
      data: {
        customerSystemId: system.id, action: 'EXCLUDE',
        excludedSetItemId: item.id,
      },
    });
    const parts = await getEffectivePartsForSystem(system.id, company.id);
    expect(parts).toEqual([]);
  });

  it('combines defaults + ADDs minus EXCLUDEs, sorted by sortOrder', async () => {
    const { system, catalog, company } = await seed();
    const set = await prisma.maintenanceSet.create({
      data: { companyId: company.id, catalogId: catalog.id },
    });
    const def1 = await prisma.maintenanceSetItem.create({
      data: { maintenanceSetId: set.id, category: 'SPARE_PART',
              description: 'A', quantity: 1, unit: 'Stck', sortOrder: 3 },
    });
    await prisma.maintenanceSetItem.create({
      data: { maintenanceSetId: set.id, category: 'SPARE_PART',
              description: 'B', quantity: 1, unit: 'Stck', sortOrder: 1 },
    });
    await prisma.customerSystemPartOverride.create({
      data: { customerSystemId: system.id, action: 'EXCLUDE', excludedSetItemId: def1.id },
    });
    await prisma.customerSystemPartOverride.create({
      data: {
        customerSystemId: system.id, action: 'ADD',
        category: 'CONSUMABLE', description: 'C',
        quantity: 1, unit: 'Stck', sortOrder: 2,
      },
    });
    const parts = await getEffectivePartsForSystem(system.id, company.id);
    expect(parts.map((p) => p.description)).toEqual(['B', 'C']);
  });

  it('returns empty and never throws when system is not found', async () => {
    const { company } = await seed();
    const parts = await getEffectivePartsForSystem('00000000-0000-0000-0000-000000000000', company.id);
    expect(parts).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
npm test -- src/lib/__tests__/maintenance-parts.test.ts
```

Expected: FAIL — `getEffectivePartsForSystem` not exported.

- [ ] **Step 3: Implement the resolver**

Create `src/lib/maintenance-parts.ts`:

```ts
import { prisma } from '@/lib/prisma';
import type { PartCategory } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export type EffectivePart = {
  source: 'DEFAULT' | 'OVERRIDE_ADD';
  setItemId?: string;
  overrideId?: string;
  category: PartCategory;
  description: string;
  articleNumber: string | null;
  quantity: Prisma.Decimal;
  unit: string;
  required: boolean;
  note: string | null;
  sortOrder: number;
  inventoryItem: {
    id: string;
    currentStock: Prisma.Decimal;
    minStock: Prisma.Decimal;
    unit: string;
    articleNumber: string | null;
    description: string;
  } | null;
};

export async function getEffectivePartsForSystem(
  customerSystemId: string,
  companyId: string,
): Promise<EffectivePart[]> {
  const system = await prisma.customerSystem.findFirst({
    where: { id: customerSystemId, companyId },
    select: { id: true, catalogId: true },
  });
  if (!system) return [];

  const [set, overrides] = await Promise.all([
    prisma.maintenanceSet.findUnique({
      where: { companyId_catalogId: { companyId, catalogId: system.catalogId } },
      include: {
        items: {
          include: {
            inventoryItem: {
              select: {
                id: true, currentStock: true, minStock: true,
                unit: true, articleNumber: true, description: true,
              },
            },
          },
        },
      },
    }),
    prisma.customerSystemPartOverride.findMany({
      where: { customerSystemId },
      include: {
        inventoryItem: {
          select: {
            id: true, currentStock: true, minStock: true,
            unit: true, articleNumber: true, description: true,
          },
        },
      },
    }),
  ]);

  const excludedIds = new Set(
    overrides.filter((o) => o.action === 'EXCLUDE' && o.excludedSetItemId).map((o) => o.excludedSetItemId!),
  );

  const defaults: EffectivePart[] = (set?.items ?? [])
    .filter((i) => !excludedIds.has(i.id))
    .map((i) => ({
      source: 'DEFAULT',
      setItemId: i.id,
      category: i.category,
      description: i.description,
      articleNumber: i.articleNumber,
      quantity: i.quantity,
      unit: i.unit,
      required: i.required,
      note: i.note,
      sortOrder: i.sortOrder,
      inventoryItem: i.inventoryItem,
    }));

  const adds: EffectivePart[] = overrides
    .filter((o) => o.action === 'ADD')
    .map((o) => ({
      source: 'OVERRIDE_ADD',
      overrideId: o.id,
      category: o.category!,
      description: o.description!,
      articleNumber: o.articleNumber,
      quantity: o.quantity!,
      unit: o.unit!,
      required: o.required,
      note: o.note,
      sortOrder: o.sortOrder,
      inventoryItem: o.inventoryItem,
    }));

  return [...defaults, ...adds].sort((a, b) => a.sortOrder - b.sortOrder);
}
```

- [ ] **Step 4: Run tests and verify**

```bash
npm test -- src/lib/__tests__/maintenance-parts.test.ts
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/maintenance-parts.ts src/lib/__tests__/maintenance-parts.test.ts
git commit -m "feat(lib): add getEffectivePartsForSystem resolver"
```

---

## Task 5: MaintenanceSet list + create API (GET/POST /api/maintenance-sets)

**Files:**
- Create: `src/app/api/maintenance-sets/route.ts`
- Create: `src/app/api/maintenance-sets/__tests__/route.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/api/maintenance-sets/__tests__/route.test.ts`. Use the existing test pattern for API route tests (see `src/app/api/employees/__tests__/route.test.ts` for shape). Cover:

- GET returns empty array when no sets exist
- GET with `?catalogId=` filters
- POST creates new set with unique `(companyId, catalogId)` — second attempt 409
- POST rejects invalid `catalogId` (does not exist) — 404
- TECHNICIAN GET and POST → 403 "Nur Inhaber dürfen Wartungssets verwalten"
- Cross-tenant: Company-A OWNER cannot see Company-B's sets

- [ ] **Step 2: Run tests to verify failure**

```bash
npm test -- src/app/api/maintenance-sets/__tests__/route.test.ts
```

Expected: FAIL — route not implemented.

- [ ] **Step 3: Implement the route**

Create `src/app/api/maintenance-sets/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { maintenanceSetCreateSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { userId, companyId } = await requireOwner();
    const rate = await rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rate) return rate;

    const catalogId = request.nextUrl.searchParams.get('catalogId');
    const sets = await prisma.maintenanceSet.findMany({
      where: { companyId, ...(catalogId ? { catalogId } : {}) },
      include: {
        catalog: { select: { manufacturer: true, name: true, systemType: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ success: true, data: sets });
  } catch (e) {
    return handleError(e, 'Fehler beim Laden der Wartungssets');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, companyId } = await requireOwner();
    const rate = await rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rate) return rate;

    const body = await request.json();
    const { catalogId } = maintenanceSetCreateSchema.parse(body);

    const catalog = await prisma.systemCatalog.findUnique({ where: { id: catalogId } });
    if (!catalog) {
      return NextResponse.json({ success: false, error: 'Katalog-Eintrag nicht gefunden' }, { status: 404 });
    }

    const existing = await prisma.maintenanceSet.findUnique({
      where: { companyId_catalogId: { companyId, catalogId } },
    });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Für dieses Modell existiert bereits ein Wartungsset' }, { status: 409 });
    }

    const set = await prisma.maintenanceSet.create({
      data: { companyId, catalogId },
      include: { catalog: { select: { manufacturer: true, name: true, systemType: true } } },
    });
    return NextResponse.json({ success: true, data: set }, { status: 201 });
  } catch (e) {
    return handleError(e, 'Fehler beim Erstellen des Wartungssets');
  }
}

function handleError(e: unknown, fallback: string) {
  if (e instanceof z.ZodError) {
    return NextResponse.json({ success: false, error: 'Validierungsfehler', details: e.issues }, { status: 400 });
  }
  if (e instanceof Error) {
    if (e.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    if (e.message === 'Forbidden') return NextResponse.json({ success: false, error: 'Nur Inhaber dürfen Wartungssets verwalten' }, { status: 403 });
  }
  console.error(fallback, e);
  return NextResponse.json({ success: false, error: fallback }, { status: 500 });
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- src/app/api/maintenance-sets/__tests__/route.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/maintenance-sets/
git commit -m "feat(api): GET + POST /api/maintenance-sets"
```

---

## Task 6: MaintenanceSet detail + delete (GET/DELETE /api/maintenance-sets/[id])

**Files:**
- Create: `src/app/api/maintenance-sets/[id]/route.ts`
- Create: `src/app/api/maintenance-sets/[id]/__tests__/route.test.ts`

- [ ] **Step 1: Write failing tests**

Cover: GET returns items ordered by `sortOrder`; GET of other-tenant → 404; DELETE cascades items but not catalog; TECH all methods → 403.

- [ ] **Step 2: Implement**

```ts
// src/app/api/maintenance-sets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId, companyId } = await requireOwner();
    const rate = await rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rate) return rate;

    const set = await prisma.maintenanceSet.findFirst({
      where: { id, companyId },
      include: {
        catalog: true,
        items: {
          orderBy: { sortOrder: 'asc' },
          include: { inventoryItem: { select: { id: true, description: true, articleNumber: true, unit: true, currentStock: true, minStock: true } } },
        },
      },
    });
    if (!set) return NextResponse.json({ success: false, error: 'Wartungsset nicht gefunden' }, { status: 404 });
    return NextResponse.json({ success: true, data: set });
  } catch (e) { return handleError(e, 'Fehler beim Laden des Wartungssets'); }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { companyId } = await requireOwner();
    const set = await prisma.maintenanceSet.findFirst({ where: { id, companyId } });
    if (!set) return NextResponse.json({ success: false, error: 'Wartungsset nicht gefunden' }, { status: 404 });
    await prisma.maintenanceSet.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) { return handleError(e, 'Fehler beim Löschen des Wartungssets'); }
}

// handleError — duplicate from Task 5 (do not extract shared helper yet)
function handleError(e: unknown, fallback: string) {
  if (e instanceof Error) {
    if (e.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    if (e.message === 'Forbidden') return NextResponse.json({ success: false, error: 'Nur Inhaber dürfen Wartungssets verwalten' }, { status: 403 });
  }
  console.error(fallback, e);
  return NextResponse.json({ success: false, error: fallback }, { status: 500 });
}
```

- [ ] **Step 3: Run tests; expect PASS**
- [ ] **Step 4: Commit**

```bash
git add src/app/api/maintenance-sets/[id]/
git commit -m "feat(api): GET + DELETE /api/maintenance-sets/[id]"
```

---

## Task 7: MaintenanceSetItem create (POST /api/maintenance-sets/[id]/items)

**Files:**
- Create: `src/app/api/maintenance-sets/[id]/items/route.ts`
- Create: `src/app/api/maintenance-sets/[id]/items/__tests__/route.test.ts`

- [ ] **Step 1: Write failing tests**

Cover: POST creates item scoped to parent set; POST rejects TOOL+inventoryItemId (400); POST rejects if set not in caller's company (404); inventoryItemId existence validated (404 on cross-company inventory item).

- [ ] **Step 2: Implement**

```ts
// src/app/api/maintenance-sets/[id]/items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { maintenanceSetItemCreateSchema } from '@/lib/validations';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId, companyId } = await requireOwner();
    const rate = await rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rate) return rate;

    const body = await request.json();
    const data = maintenanceSetItemCreateSchema.parse(body);

    const set = await prisma.maintenanceSet.findFirst({ where: { id, companyId } });
    if (!set) return NextResponse.json({ success: false, error: 'Wartungsset nicht gefunden' }, { status: 404 });

    if (data.inventoryItemId) {
      const inv = await prisma.inventoryItem.findFirst({ where: { id: data.inventoryItemId, companyId } });
      if (!inv) return NextResponse.json({ success: false, error: 'Lagerteil nicht gefunden' }, { status: 404 });
    }

    const item = await prisma.maintenanceSetItem.create({
      data: { maintenanceSetId: id, ...data },
    });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ success: false, error: 'Validierungsfehler', details: e.issues }, { status: 400 });
    if (e instanceof Error) {
      if (e.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
      if (e.message === 'Forbidden') return NextResponse.json({ success: false, error: 'Nur Inhaber dürfen Wartungssets verwalten' }, { status: 403 });
    }
    console.error('POST set item', e);
    return NextResponse.json({ success: false, error: 'Fehler beim Anlegen' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Run tests — expect PASS**
- [ ] **Step 4: Commit**

```bash
git add src/app/api/maintenance-sets/[id]/items/
git commit -m "feat(api): POST /api/maintenance-sets/[id]/items"
```

---

## Task 8: MaintenanceSetItem update + delete + reorder

**Files:**
- Create: `src/app/api/maintenance-set-items/[id]/route.ts`
- Create: `src/app/api/maintenance-sets/[id]/items/reorder/route.ts`
- Create: `src/app/api/maintenance-set-items/[id]/__tests__/route.test.ts`

- [ ] **Step 1: Write failing tests**

Cover: PATCH updates item; DELETE removes item; TECH → 403; cross-tenant → 404; reorder accepts `{ items: [{id, sortOrder}, ...] }` and applies transactionally.

- [ ] **Step 2: Implement single-item route**

```ts
// src/app/api/maintenance-set-items/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { maintenanceSetItemUpdateSchema } from '@/lib/validations';

async function loadItem(itemId: string, companyId: string) {
  return prisma.maintenanceSetItem.findFirst({
    where: { id: itemId, maintenanceSet: { companyId } },
    include: { maintenanceSet: { select: { companyId: true } } },
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { companyId } = await requireOwner();
    const body = await request.json();
    const data = maintenanceSetItemUpdateSchema.parse(body);

    const item = await loadItem(id, companyId);
    if (!item) return NextResponse.json({ success: false, error: 'Teil nicht gefunden' }, { status: 404 });

    if (data.inventoryItemId) {
      const inv = await prisma.inventoryItem.findFirst({ where: { id: data.inventoryItemId, companyId } });
      if (!inv) return NextResponse.json({ success: false, error: 'Lagerteil nicht gefunden' }, { status: 404 });
    }

    const updated = await prisma.maintenanceSetItem.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ success: false, error: 'Validierungsfehler', details: e.issues }, { status: 400 });
    return errorJson(e);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { companyId } = await requireOwner();
    const item = await loadItem(id, companyId);
    if (!item) return NextResponse.json({ success: false, error: 'Teil nicht gefunden' }, { status: 404 });
    await prisma.maintenanceSetItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) { return errorJson(e); }
}

function errorJson(e: unknown) {
  if (e instanceof Error) {
    if (e.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    if (e.message === 'Forbidden') return NextResponse.json({ success: false, error: 'Nur Inhaber dürfen Wartungssets verwalten' }, { status: 403 });
  }
  console.error(e);
  return NextResponse.json({ success: false, error: 'Serverfehler' }, { status: 500 });
}
```

- [ ] **Step 3: Implement reorder route**

```ts
// src/app/api/maintenance-sets/[id]/items/reorder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { maintenanceSetItemsReorderSchema } from '@/lib/validations';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { companyId } = await requireOwner();
    const body = await request.json();
    const { items } = maintenanceSetItemsReorderSchema.parse(body);

    const set = await prisma.maintenanceSet.findFirst({ where: { id, companyId } });
    if (!set) return NextResponse.json({ success: false, error: 'Wartungsset nicht gefunden' }, { status: 404 });

    // Verify every item belongs to this set (prevents cross-set reorder)
    const itemIds = items.map((i) => i.id);
    const found = await prisma.maintenanceSetItem.findMany({
      where: { id: { in: itemIds }, maintenanceSetId: id },
      select: { id: true },
    });
    if (found.length !== itemIds.length) {
      return NextResponse.json({ success: false, error: 'Ungültige Item-IDs' }, { status: 400 });
    }

    await prisma.$transaction(items.map((it) =>
      prisma.maintenanceSetItem.update({ where: { id: it.id }, data: { sortOrder: it.sortOrder } })
    ));
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ success: false, error: 'Validierungsfehler', details: e.issues }, { status: 400 });
    if (e instanceof Error) {
      if (e.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
      if (e.message === 'Forbidden') return NextResponse.json({ success: false, error: 'Nur Inhaber dürfen Wartungssets verwalten' }, { status: 403 });
    }
    console.error('reorder', e);
    return NextResponse.json({ success: false, error: 'Serverfehler' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run tests — expect PASS**
- [ ] **Step 5: Commit**

```bash
git add src/app/api/maintenance-set-items/ src/app/api/maintenance-sets/[id]/items/reorder/
git commit -m "feat(api): MaintenanceSetItem PATCH/DELETE + bulk reorder"
```

---

## Task 9: InventoryItem list + create (GET/POST /api/inventory)

**Files:**
- Create: `src/app/api/inventory/route.ts`
- Create: `src/app/api/inventory/__tests__/route.test.ts`

- [ ] **Step 1: Write failing tests**

Cover:
- GET returns inventory items for caller's company, optional `?filter=low` filter
- GET accessible to both OWNER and TECHNICIAN (read-only)
- POST creates item (OWNER); rejects duplicate `articleNumber` within tenant
- POST allows multiple items with `articleNumber = null`
- POST by TECHNICIAN → 403

- [ ] **Step 2: Implement**

```ts
// src/app/api/inventory/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { inventoryItemCreateSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { userId, companyId } = await requireAuth();
    const rate = await rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rate) return rate;

    const filter = request.nextUrl.searchParams.get('filter');
    const items = await prisma.inventoryItem.findMany({
      where: { companyId },
      orderBy: [{ description: 'asc' }],
    });
    const filtered = filter === 'low'
      ? items.filter((i) => i.currentStock.lt(i.minStock))
      : items;
    return NextResponse.json({ success: true, data: filtered });
  } catch (e) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('GET inventory', e);
    return NextResponse.json({ success: false, error: 'Fehler beim Laden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, companyId } = await requireOwner();
    const rate = await rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rate) return rate;

    const body = await request.json();
    const data = inventoryItemCreateSchema.parse(body);

    if (data.articleNumber) {
      const dup = await prisma.inventoryItem.findUnique({
        where: { companyId_articleNumber: { companyId, articleNumber: data.articleNumber } },
      });
      if (dup) return NextResponse.json({ success: false, error: 'Artikelnummer existiert bereits im Lager' }, { status: 409 });
    }

    const item = await prisma.inventoryItem.create({
      data: { companyId, ...data, articleNumber: data.articleNumber ?? null },
    });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ success: false, error: 'Validierungsfehler', details: e.issues }, { status: 400 });
    if (e instanceof Error) {
      if (e.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
      if (e.message === 'Forbidden') return NextResponse.json({ success: false, error: 'Nur Inhaber dürfen Lagerteile anlegen' }, { status: 403 });
    }
    console.error('POST inventory', e);
    return NextResponse.json({ success: false, error: 'Fehler beim Anlegen' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Run tests — expect PASS**
- [ ] **Step 4: Commit**

```bash
git add src/app/api/inventory/
git commit -m "feat(api): GET + POST /api/inventory"
```

---

## Task 10: InventoryItem detail + update + delete (GET/PATCH/DELETE /api/inventory/[id])

**Files:**
- Create: `src/app/api/inventory/[id]/route.ts`
- Create: `src/app/api/inventory/[id]/__tests__/route.test.ts`

- [ ] **Step 1: Write failing tests**

Cover:
- GET readable by both roles for own-tenant, 404 for other tenant
- PATCH rejects `currentStock` in body (stock changes only via movements)
- DELETE blocked (400) with specific German message when `MaintenanceSetItem` or `CustomerSystemPartOverride` references this item
- DELETE succeeds (and cascades `InventoryMovement` rows) when no references remain

- [ ] **Step 2: Implement**

```ts
// src/app/api/inventory/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { inventoryItemUpdateSchema } from '@/lib/validations';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { companyId } = await requireAuth();
    const item = await prisma.inventoryItem.findFirst({ where: { id, companyId } });
    if (!item) return NextResponse.json({ success: false, error: 'Lagerteil nicht gefunden' }, { status: 404 });
    return NextResponse.json({ success: true, data: item });
  } catch (e) { return inventoryErr(e); }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { companyId } = await requireOwner();
    const body = await request.json();
    const data = inventoryItemUpdateSchema.parse(body);

    const item = await prisma.inventoryItem.findFirst({ where: { id, companyId } });
    if (!item) return NextResponse.json({ success: false, error: 'Lagerteil nicht gefunden' }, { status: 404 });

    // Unique check if articleNumber being changed
    if (data.articleNumber && data.articleNumber !== item.articleNumber) {
      const dup = await prisma.inventoryItem.findUnique({
        where: { companyId_articleNumber: { companyId, articleNumber: data.articleNumber } },
      });
      if (dup && dup.id !== id) {
        return NextResponse.json({ success: false, error: 'Artikelnummer existiert bereits im Lager' }, { status: 409 });
      }
    }

    const updated = await prisma.inventoryItem.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ success: false, error: 'Validierungsfehler', details: e.issues }, { status: 400 });
    return inventoryErr(e);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { companyId } = await requireOwner();

    const item = await prisma.inventoryItem.findFirst({ where: { id, companyId } });
    if (!item) return NextResponse.json({ success: false, error: 'Lagerteil nicht gefunden' }, { status: 404 });

    const [setRefs, overrideRefs] = await Promise.all([
      prisma.maintenanceSetItem.count({ where: { inventoryItemId: id } }),
      prisma.customerSystemPartOverride.count({ where: { inventoryItemId: id } }),
    ]);
    const total = setRefs + overrideRefs;
    if (total > 0) {
      return NextResponse.json({
        success: false,
        error: `Teil wird noch in ${total} Wartungsset-Einträgen verwendet — zuerst dort entfernen.`,
      }, { status: 400 });
    }

    await prisma.inventoryItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) { return inventoryErr(e); }
}

function inventoryErr(e: unknown) {
  if (e instanceof Error) {
    if (e.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    if (e.message === 'Forbidden') return NextResponse.json({ success: false, error: 'Nur Inhaber dürfen Lager ändern' }, { status: 403 });
  }
  console.error(e);
  return NextResponse.json({ success: false, error: 'Serverfehler' }, { status: 500 });
}
```

- [ ] **Step 3: Run tests — expect PASS**
- [ ] **Step 4: Commit**

```bash
git add src/app/api/inventory/[id]/
git commit -m "feat(api): GET/PATCH/DELETE /api/inventory/[id] with reference-block"
```

---

## Task 11: InventoryMovement list + manual create

**Files:**
- Create: `src/app/api/inventory/[id]/movements/route.ts`
- Create: `src/app/api/inventory/[id]/movements/__tests__/route.test.ts`

- [ ] **Step 1: Write failing tests**

Cover:
- GET returns last 30 movements, newest first
- Both roles can GET
- POST RESTOCK increments currentStock + sets lastRestockedAt
- POST CORRECTION adjusts currentStock, does NOT change lastRestockedAt
- POST rejects reason=MAINTENANCE_USE (handled elsewhere)
- POST rejects quantityChange = 0
- TECHNICIAN POST → 403
- Movement + update happen in one transaction (no orphan if item is concurrently deleted — mock via forced failure)

- [ ] **Step 2: Implement**

```ts
// src/app/api/inventory/[id]/movements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { inventoryMovementCreateSchema } from '@/lib/validations';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { companyId } = await requireAuth();
    const item = await prisma.inventoryItem.findFirst({ where: { id, companyId } });
    if (!item) return NextResponse.json({ success: false, error: 'Lagerteil nicht gefunden' }, { status: 404 });

    const movements = await prisma.inventoryMovement.findMany({
      where: { inventoryItemId: id },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { user: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ success: true, data: movements });
  } catch (e) { return movementErr(e); }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId, companyId } = await requireOwner();

    const body = await request.json();
    const data = inventoryMovementCreateSchema.parse(body);

    const item = await prisma.inventoryItem.findFirst({ where: { id, companyId } });
    if (!item) return NextResponse.json({ success: false, error: 'Lagerteil nicht gefunden' }, { status: 404 });

    const result = await prisma.$transaction(async (tx) => {
      const movement = await tx.inventoryMovement.create({
        data: {
          companyId, inventoryItemId: id, userId,
          reason: data.reason, quantityChange: data.quantityChange,
          note: data.note ?? null,
        },
      });
      await tx.inventoryItem.update({
        where: { id },
        data: {
          currentStock: { increment: data.quantityChange },
          ...(data.reason === 'RESTOCK' ? { lastRestockedAt: new Date() } : {}),
        },
      });
      return movement;
    });
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ success: false, error: 'Validierungsfehler', details: e.issues }, { status: 400 });
    return movementErr(e);
  }
}

function movementErr(e: unknown) {
  if (e instanceof Error) {
    if (e.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    if (e.message === 'Forbidden') return NextResponse.json({ success: false, error: 'Nur Inhaber dürfen Bewegungen buchen' }, { status: 403 });
  }
  console.error(e);
  return NextResponse.json({ success: false, error: 'Serverfehler' }, { status: 500 });
}
```

- [ ] **Step 3: Run tests — expect PASS**
- [ ] **Step 4: Commit**

```bash
git add src/app/api/inventory/[id]/movements/
git commit -m "feat(api): InventoryMovement list + manual create"
```

---

## Task 12: CustomerSystem overrides (POST)

**Files:**
- Create: `src/app/api/customer-systems/[id]/overrides/route.ts`
- Create: `src/app/api/customer-systems/[id]/overrides/__tests__/route.test.ts`

- [ ] **Step 1: Write failing tests**

Cover:
- POST ADD with valid payload → 201, persists with all ADD fields
- POST ADD with TOOL + inventoryItemId → 400
- POST EXCLUDE with valid `excludedSetItemId` (item belongs to set of same-company caller) → 201
- POST EXCLUDE with `excludedSetItemId` from other-company set → 404
- POST by TECHNICIAN → 403
- System not in caller's company → 404

- [ ] **Step 2: Implement**

```ts
// src/app/api/customer-systems/[id]/overrides/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { customerSystemOverrideSchema } from '@/lib/validations';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { companyId } = await requireOwner();

    const body = await request.json();
    const data = customerSystemOverrideSchema.parse(body);

    const system = await prisma.customerSystem.findFirst({ where: { id, companyId } });
    if (!system) return NextResponse.json({ success: false, error: 'System nicht gefunden' }, { status: 404 });

    if (data.action === 'EXCLUDE') {
      const targetItem = await prisma.maintenanceSetItem.findFirst({
        where: { id: data.excludedSetItemId, maintenanceSet: { companyId, catalogId: system.catalogId } },
      });
      if (!targetItem) return NextResponse.json({ success: false, error: 'Standard-Teil nicht gefunden' }, { status: 404 });
    }

    if (data.action === 'ADD' && data.inventoryItemId) {
      const inv = await prisma.inventoryItem.findFirst({ where: { id: data.inventoryItemId, companyId } });
      if (!inv) return NextResponse.json({ success: false, error: 'Lagerteil nicht gefunden' }, { status: 404 });
    }

    const override = await prisma.customerSystemPartOverride.create({
      data: {
        customerSystemId: id,
        action: data.action,
        ...(data.action === 'ADD' ? {
          category: data.category, description: data.description,
          articleNumber: data.articleNumber ?? null, quantity: data.quantity,
          unit: data.unit, required: data.required, note: data.note ?? null,
          sortOrder: data.sortOrder, inventoryItemId: data.inventoryItemId ?? null,
        } : { excludedSetItemId: data.excludedSetItemId }),
      },
    });
    return NextResponse.json({ success: true, data: override }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ success: false, error: 'Validierungsfehler', details: e.issues }, { status: 400 });
    if (e instanceof Error) {
      if (e.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
      if (e.message === 'Forbidden') return NextResponse.json({ success: false, error: 'Nur Inhaber dürfen Abweichungen anlegen' }, { status: 403 });
    }
    console.error('override POST', e);
    return NextResponse.json({ success: false, error: 'Serverfehler' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Run tests — expect PASS**
- [ ] **Step 4: Commit**

```bash
git add src/app/api/customer-systems/[id]/overrides/
git commit -m "feat(api): POST /api/customer-systems/[id]/overrides"
```

---

## Task 13: Delete override (DELETE /api/overrides/[id])

**Files:**
- Create: `src/app/api/overrides/[id]/route.ts`
- Create: `src/app/api/overrides/[id]/__tests__/route.test.ts`

- [ ] **Step 1: Write failing tests**

Cover: DELETE deletes; TECH → 403; cross-tenant → 404.

- [ ] **Step 2: Implement**

```ts
// src/app/api/overrides/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { companyId } = await requireOwner();

    const override = await prisma.customerSystemPartOverride.findFirst({
      where: { id, customerSystem: { companyId } },
    });
    if (!override) return NextResponse.json({ success: false, error: 'Abweichung nicht gefunden' }, { status: 404 });

    await prisma.customerSystemPartOverride.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
      if (e.message === 'Forbidden') return NextResponse.json({ success: false, error: 'Nur Inhaber dürfen Abweichungen löschen' }, { status: 403 });
    }
    console.error('override DELETE', e);
    return NextResponse.json({ success: false, error: 'Serverfehler' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Run tests — expect PASS**
- [ ] **Step 4: Commit**

```bash
git add src/app/api/overrides/
git commit -m "feat(api): DELETE /api/overrides/[id]"
```

---

## Task 14: GET /api/customer-systems/[id]/effective-parts

**Files:**
- Create: `src/app/api/customer-systems/[id]/effective-parts/route.ts`
- Create: `src/app/api/customer-systems/[id]/effective-parts/__tests__/route.test.ts`

- [ ] **Step 1: Write failing tests**

Cover:
- OWNER GET: any system in own tenant → 200 with resolver output
- TECHNICIAN GET: own assigned system → 200; un-assigned system → 403 "Zugriff verweigert"
- Cross-tenant → 404

- [ ] **Step 2: Implement**

```ts
// src/app/api/customer-systems/[id]/effective-parts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getEffectivePartsForSystem } from '@/lib/maintenance-parts';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId, companyId, role } = await requireAuth();

    const system = await prisma.customerSystem.findFirst({
      where: { id, companyId },
      select: { id: true, assignedToUserId: true },
    });
    if (!system) return NextResponse.json({ success: false, error: 'System nicht gefunden' }, { status: 404 });

    if (role === 'TECHNICIAN' && system.assignedToUserId !== userId) {
      return NextResponse.json({ success: false, error: 'Zugriff verweigert' }, { status: 403 });
    }

    const parts = await getEffectivePartsForSystem(id, companyId);
    return NextResponse.json({ success: true, data: parts });
  } catch (e) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('effective-parts', e);
    return NextResponse.json({ success: false, error: 'Serverfehler' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Run tests — expect PASS**
- [ ] **Step 4: Commit**

```bash
git add src/app/api/customer-systems/[id]/effective-parts/
git commit -m "feat(api): GET /api/customer-systems/[id]/effective-parts"
```

---

## Task 15: Extend POST /api/maintenances with `partsUsed`

**Files:**
- Modify: `src/app/api/maintenances/route.ts`
- Create or Modify: `src/app/api/maintenances/__tests__/route.test.ts`

- [ ] **Step 1: Write failing tests**

Cover:
- POST with `partsUsed: []` → unchanged behavior (no movements created)
- POST with `partsUsed` containing linked `inventoryItemId` → `InventoryMovement(MAINTENANCE_USE, -quantity)` + stock decrement in single transaction
- POST with `partsUsed` entry without `inventoryItemId` → no movement, but snapshot persisted in `checklistData.partsUsed`
- POST when decrement would go below 0 → success, `negativeStockWarnings` present in response, stock allowed negative (N3 policy)
- Atomicity: concurrent delete of one of the inventory items triggers transaction rollback; no orphan movement

- [ ] **Step 2: Modify the POST handler**

Replace the `prisma.$transaction` block with:

```ts
const result = await prisma.$transaction(async (tx) => {
  const maintenance = await tx.maintenance.create({
    data: {
      systemId: validatedData.systemId,
      companyId, userId,
      date: maintenanceDate,
      notes: validatedData.notes || null,
      photos: validatedData.photos || [],
      checklistData: validatedData.checklistData ?? undefined,
    },
    include: {
      system: {
        include: {
          catalog: true,
          customer: { select: { id: true, name: true } },
        },
      },
    },
  });

  const warnings: Array<{ inventoryItemId: string; newStock: string }> = [];
  const snapshot: typeof validatedData.partsUsed = [];

  for (const entry of validatedData.partsUsed ?? []) {
    snapshot.push(entry);
    if (!entry.inventoryItemId) continue;

    const inv = await tx.inventoryItem.findFirst({
      where: { id: entry.inventoryItemId, companyId },
    });
    if (!inv) {
      throw new Error('InventoryItem not found during maintenance');
    }

    await tx.inventoryMovement.create({
      data: {
        companyId,
        inventoryItemId: inv.id,
        quantityChange: -Math.abs(entry.quantity),
        reason: 'MAINTENANCE_USE',
        maintenanceId: maintenance.id,
        userId,
      },
    });
    const updated = await tx.inventoryItem.update({
      where: { id: inv.id },
      data: { currentStock: { decrement: entry.quantity } },
    });
    if (updated.currentStock.lt(0)) {
      warnings.push({ inventoryItemId: inv.id, newStock: updated.currentStock.toString() });
    }
  }

  // Merge partsUsed snapshot into checklistData JSON
  const existingChecklist = (validatedData.checklistData ?? {}) as Record<string, unknown>;
  await tx.maintenance.update({
    where: { id: maintenance.id },
    data: { checklistData: { ...existingChecklist, partsUsed: snapshot } },
  });

  await tx.customerSystem.update({
    where: { id: validatedData.systemId },
    data: { lastMaintenance: maintenanceDate, nextMaintenance },
  });

  return { maintenance, warnings };
});

return NextResponse.json({
  success: true,
  data: result.maintenance,
  negativeStockWarnings: result.warnings,
}, { status: 201 });
```

- [ ] **Step 3: Run tests — expect PASS**

```bash
npm test -- src/app/api/maintenances/__tests__/route.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/maintenances/route.ts src/app/api/maintenances/__tests__/
git commit -m "feat(api): extend POST /api/maintenances with partsUsed transactional handling"
```

---

## Task 16: Extend DELETE /api/maintenances/[id] with R1 reversal

**Files:**
- Modify: `src/app/api/maintenances/[id]/route.ts`
- Create or Modify: `src/app/api/maintenances/[id]/__tests__/route.test.ts`

- [ ] **Step 1: Write failing tests**

Cover:
- DELETE by OWNER with no related movements → unchanged behavior
- DELETE by OWNER with 3 `MAINTENANCE_USE` movements → inserts 3 `CORRECTION` movements with opposite signs, stock restored, original movements have `maintenanceId = null`
- TECH DELETE → 403 (pre-existing rule)
- Single-transaction atomicity (partial failure → full rollback)

- [ ] **Step 2: Modify DELETE handler**

Replace existing delete logic with a transaction that first inserts reversals:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId, companyId } = await requireOwner();

    const maintenance = await prisma.maintenance.findFirst({ where: { id, companyId } });
    if (!maintenance) return NextResponse.json({ success: false, error: 'Wartung nicht gefunden' }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      const origMovements = await tx.inventoryMovement.findMany({
        where: { maintenanceId: id, reason: 'MAINTENANCE_USE' },
      });
      for (const m of origMovements) {
        await tx.inventoryMovement.create({
          data: {
            companyId, inventoryItemId: m.inventoryItemId,
            quantityChange: m.quantityChange.neg(),
            reason: 'CORRECTION',
            maintenanceId: null,
            note: 'Rückbuchung: Wartung gelöscht',
            userId,
          },
        });
        await tx.inventoryItem.update({
          where: { id: m.inventoryItemId },
          data: { currentStock: { increment: m.quantityChange.abs() } },
        });
      }
      await tx.inventoryMovement.updateMany({
        where: { maintenanceId: id, reason: 'MAINTENANCE_USE' },
        data: { maintenanceId: null },
      });
      await tx.maintenance.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
      if (e.message === 'Forbidden') return NextResponse.json({ success: false, error: 'Nur Inhaber dürfen Wartungen löschen' }, { status: 403 });
    }
    console.error('DELETE maintenance', e);
    return NextResponse.json({ success: false, error: 'Serverfehler' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Run tests — expect PASS**
- [ ] **Step 4: Commit**

```bash
git add src/app/api/maintenances/[id]/
git commit -m "feat(api): DELETE /api/maintenances/[id] auto-reverses stock movements (R1)"
```

---

## Task 17: Packing-list API

**Files:**
- Create: `src/app/api/bookings/[id]/packing-list/route.ts`
- Create: `src/app/api/bookings/[id]/packing-list/__tests__/route.test.ts`

- [ ] **Step 1: Write failing tests**

Cover:
- OWNER GET any booking → 200 with `{ booking, customer, system, technician, effectiveParts }`
- TECHNICIAN GET own assigned booking → 200
- TECHNICIAN GET un-assigned booking → 403
- Cross-tenant → 404
- Booking without `systemId` → 200 but `effectiveParts: []` and `system: null`

- [ ] **Step 2: Implement**

```ts
// src/app/api/bookings/[id]/packing-list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getEffectivePartsForSystem } from '@/lib/maintenance-parts';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId, companyId, role } = await requireAuth();

    const booking = await prisma.booking.findFirst({
      where: { id, companyId },
      include: {
        customer: true,
        system: { include: { catalog: true, assignedTo: { select: { id: true, name: true } } } },
        assignedTo: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    });
    if (!booking) return NextResponse.json({ success: false, error: 'Termin nicht gefunden' }, { status: 404 });

    if (role === 'TECHNICIAN' && booking.assignedToUserId !== userId) {
      return NextResponse.json({ success: false, error: 'Zugriff verweigert' }, { status: 403 });
    }

    const effectiveParts = booking.systemId
      ? await getEffectivePartsForSystem(booking.systemId, companyId)
      : [];

    return NextResponse.json({
      success: true,
      data: {
        booking: {
          id: booking.id,
          startTime: booking.startTime,
          endTime: booking.endTime,
          title: booking.title,
        },
        customer: booking.customer,
        system: booking.system,
        technician: booking.assignedTo ?? booking.user,
        effectiveParts,
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('packing-list', e);
    return NextResponse.json({ success: false, error: 'Serverfehler' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Run tests — expect PASS**
- [ ] **Step 4: Commit**

```bash
git add src/app/api/bookings/[id]/packing-list/
git commit -m "feat(api): GET /api/bookings/[id]/packing-list"
```

---

## Task 18: Extend dashboard stats with `inventoryBelowMinStockCount`

**Files:**
- Modify: `src/app/api/dashboard/stats/route.ts`
- Modify or Create: `src/app/api/dashboard/stats/__tests__/route.test.ts`

- [ ] **Step 1: Write failing test**

Test that OWNER response includes `inventoryBelowMinStockCount: number` matching `count where currentStock < minStock`; TECHNICIAN response does NOT include the field.

- [ ] **Step 2: Extend the route**

Add to the OWNER branch of the stats handler (after any existing parallel-query block):

```ts
const inventoryBelowMinStockCount = await prisma.inventoryItem.count({
  where: { companyId, currentStock: { lt: prisma.inventoryItem.fields.minStock } },
});
// NOTE: Prisma does not support field-to-field comparison in `where` directly.
// Use raw: const rows = await prisma.$queryRaw`... current_stock < min_stock ...`;
// OR: fetch all and filter in code:
const items = await prisma.inventoryItem.findMany({ where: { companyId }, select: { currentStock: true, minStock: true } });
const inventoryBelowMinStockCount = items.filter((i) => i.currentStock.lt(i.minStock)).length;
```

Choose the second approach (in-memory filter) for simplicity. At pilot scale (< 500 items) this is trivially fast.

Add `inventoryBelowMinStockCount` to the response object (OWNER only).

- [ ] **Step 3: Run tests — expect PASS**
- [ ] **Step 4: Commit**

```bash
git add src/app/api/dashboard/stats/
git commit -m "feat(api): dashboard stats include inventoryBelowMinStockCount for OWNER"
```

---

## Task 19: React Query hooks — MaintenanceSets

**Files:**
- Create: `src/hooks/useMaintenanceSets.ts`
- Create: `src/hooks/useMaintenanceSetItems.ts`

Follow the existing hook pattern from `src/hooks/useBookings.ts` or `src/hooks/useEmployees.ts`: `useQuery` for reads, `useMutation` with `queryClient.invalidateQueries` on success.

- [ ] **Step 1: Implement `useMaintenanceSets.ts`**

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client'; // use existing wrapper if present; otherwise inline fetch

export function useMaintenanceSets(catalogId?: string) {
  return useQuery({
    queryKey: ['maintenance-sets', { catalogId }],
    queryFn: async () => {
      const qs = catalogId ? `?catalogId=${catalogId}` : '';
      const res = await fetch(`/api/maintenance-sets${qs}`);
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler');
      const { data } = await res.json();
      return data as Array<any>; // typed later if types are generated
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useMaintenanceSet(id: string | undefined) {
  return useQuery({
    queryKey: ['maintenance-sets', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(`/api/maintenance-sets/${id}`);
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler');
      const { data } = await res.json();
      return data;
    },
  });
}

export function useCreateMaintenanceSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { catalogId: string }) => {
      const res = await fetch('/api/maintenance-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler');
      return (await res.json()).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maintenance-sets'] }),
  });
}

export function useDeleteMaintenanceSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/maintenance-sets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maintenance-sets'] }),
  });
}
```

- [ ] **Step 2: Implement `useMaintenanceSetItems.ts`**

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateSetItem(setId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch(`/api/maintenance-sets/${setId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler');
      return (await res.json()).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maintenance-sets', setId] }),
  });
}

export function useUpdateSetItem(setId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const res = await fetch(`/api/maintenance-set-items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler');
      return (await res.json()).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maintenance-sets', setId] }),
  });
}

export function useDeleteSetItem(setId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/maintenance-set-items/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maintenance-sets', setId] }),
  });
}

export function useReorderSetItems(setId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; sortOrder: number }[]) => {
      const res = await fetch(`/api/maintenance-sets/${setId}/items/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maintenance-sets', setId] }),
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useMaintenanceSets.ts src/hooks/useMaintenanceSetItems.ts
git commit -m "feat(hooks): maintenance-sets + items React Query hooks"
```

---

## Task 20: Hooks — Overrides + EffectiveParts

**Files:**
- Create: `src/hooks/useCustomerSystemOverrides.ts`
- Create: `src/hooks/useEffectiveParts.ts`

- [ ] **Step 1: Implement `useEffectiveParts.ts`**

```ts
import { useQuery } from '@tanstack/react-query';

export function useEffectiveParts(customerSystemId: string | undefined) {
  return useQuery({
    queryKey: ['effective-parts', customerSystemId],
    enabled: !!customerSystemId,
    queryFn: async () => {
      const res = await fetch(`/api/customer-systems/${customerSystemId}/effective-parts`);
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler');
      return (await res.json()).data as Array<any>;
    },
  });
}
```

- [ ] **Step 2: Implement `useCustomerSystemOverrides.ts`**

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateOverride(customerSystemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch(`/api/customer-systems/${customerSystemId}/overrides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler');
      return (await res.json()).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['effective-parts', customerSystemId] });
      qc.invalidateQueries({ queryKey: ['customer-systems', customerSystemId] });
    },
  });
}

export function useDeleteOverride(customerSystemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/overrides/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['effective-parts', customerSystemId] });
    },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useCustomerSystemOverrides.ts src/hooks/useEffectiveParts.ts
git commit -m "feat(hooks): useEffectiveParts + useCustomerSystemOverrides"
```

---

## Task 21: Hooks — Inventory + Movements + PackingList

**Files:**
- Create: `src/hooks/useInventory.ts`
- Create: `src/hooks/useInventoryMovements.ts`
- Create: `src/hooks/usePackingList.ts`

- [ ] **Step 1: Implement all three hook files**

`useInventory.ts`:

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useInventoryItems(filter?: 'low') {
  return useQuery({
    queryKey: ['inventory', { filter }],
    queryFn: async () => {
      const qs = filter ? `?filter=${filter}` : '';
      const res = await fetch(`/api/inventory${qs}`);
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler');
      return (await res.json()).data;
    },
  });
}

export function useInventoryItem(id: string | undefined) {
  return useQuery({
    queryKey: ['inventory', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(`/api/inventory/${id}`);
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler');
      return (await res.json()).data;
    },
  });
}

export function useCreateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler');
      return (await res.json()).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
}

export function useUpdateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler');
      return (await res.json()).data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['inventory', vars.id] });
    },
  });
}

export function useDeleteInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
}
```

`useInventoryMovements.ts`:

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useInventoryMovements(itemId: string | undefined) {
  return useQuery({
    queryKey: ['inventory', itemId, 'movements'],
    enabled: !!itemId,
    queryFn: async () => {
      const res = await fetch(`/api/inventory/${itemId}/movements`);
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler');
      return (await res.json()).data;
    },
  });
}

export function useCreateMovement(itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { reason: 'RESTOCK' | 'CORRECTION'; quantityChange: number; note?: string }) => {
      const res = await fetch(`/api/inventory/${itemId}/movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler');
      return (await res.json()).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['inventory', itemId, 'movements'] });
    },
  });
}
```

`usePackingList.ts`:

```ts
import { useQuery } from '@tanstack/react-query';

export function usePackingList(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['packing-list', bookingId],
    enabled: !!bookingId,
    queryFn: async () => {
      const res = await fetch(`/api/bookings/${bookingId}/packing-list`);
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler');
      return (await res.json()).data;
    },
    staleTime: 60 * 1000,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useInventory.ts src/hooks/useInventoryMovements.ts src/hooks/usePackingList.ts
git commit -m "feat(hooks): inventory, movements, packing-list"
```

---

## Task 22: Navigation — sidebar entries for Wartungssets + Lager

**Files:**
- Modify: `src/components/DashboardNav.tsx` (or equivalent sidebar component — verify path via `grep -r "Mitarbeiter" src/components/`)

- [ ] **Step 1: Locate the sidebar component**

```bash
grep -rln "Mitarbeiter" src/components/ src/app/dashboard/
```

- [ ] **Step 2: Add two new nav entries**

Follow the existing pattern (conditional rendering by `session.user.role`). For example (adjust to match actual component):

```tsx
// inside the nav items list
{role === 'OWNER' && (
  <NavLink href="/dashboard/wartungssets" icon={ClipboardList}>
    Wartungssets
  </NavLink>
)}
<NavLink href="/dashboard/lager" icon={Package2}>
  Lager
  {role === 'OWNER' && lowStockCount > 0 && (
    <Badge variant="warning">{lowStockCount}</Badge>
  )}
</NavLink>
```

`lowStockCount` source: extend the dashboard-stats query the nav already uses, or call `useInventoryItems('low')` and take `.data.length`.

- [ ] **Step 3: Manual check**

Run dev server:

```bash
npm run dev
```

Log in as OWNER → "Wartungssets" + "Lager" visible in sidebar.
Log out → log in as TECHNICIAN → only "Lager" visible, no badge.

- [ ] **Step 4: Commit**

```bash
git add src/components/DashboardNav.tsx
git commit -m "feat(nav): add Wartungssets + Lager entries"
```

---

## Task 23: `/dashboard/wartungssets` list page

**Files:**
- Create: `src/app/dashboard/wartungssets/page.tsx`
- Create: `src/components/maintenance-sets/MaintenanceSetList.tsx`
- Create: `src/components/maintenance-sets/CatalogPickerForSetCreation.tsx`

- [ ] **Step 1: Implement page shell**

```tsx
// src/app/dashboard/wartungssets/page.tsx
'use client';
import { MaintenanceSetList } from '@/components/maintenance-sets/MaintenanceSetList';

export default function WartungssetsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Wartungssets</h1>
      </div>
      <MaintenanceSetList />
    </div>
  );
}
```

- [ ] **Step 2: Implement `MaintenanceSetList`**

Group by `catalog.systemType` → manufacturer. Show row per catalog with item-count badge. Include "+ Neues Set" button → opens `CatalogPickerForSetCreation` modal → on submit calls `useCreateMaintenanceSet`.

Reference pattern: `src/components/EmployeesList.tsx` or similar existing list view.

- [ ] **Step 3: Implement `CatalogPickerForSetCreation`**

Wraps the existing `CatalogPicker` component (search + group-by-manufacturer) — see `src/components/systems/CatalogPicker.tsx` for pattern. On pick → call `useCreateMaintenanceSet` then navigate to `/dashboard/wartungssets/[newId]`.

- [ ] **Step 4: Manual check**

Log in as OWNER → `/dashboard/wartungssets` → empty state → "+ Neues Set" → select a catalog entry → redirect to detail page.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/wartungssets/page.tsx src/components/maintenance-sets/MaintenanceSetList.tsx src/components/maintenance-sets/CatalogPickerForSetCreation.tsx
git commit -m "feat(ui): /dashboard/wartungssets list page"
```

---

## Task 24: `/dashboard/wartungssets/[id]` detail page + item form

**Files:**
- Create: `src/app/dashboard/wartungssets/[id]/page.tsx`
- Create: `src/components/maintenance-sets/MaintenanceSetDetail.tsx`
- Create: `src/components/maintenance-sets/MaintenanceSetItemsTable.tsx`
- Create: `src/components/maintenance-sets/MaintenanceSetItemForm.tsx`

- [ ] **Step 1: Implement page**

```tsx
// src/app/dashboard/wartungssets/[id]/page.tsx
'use client';
import { use } from 'react';
import { MaintenanceSetDetail } from '@/components/maintenance-sets/MaintenanceSetDetail';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <MaintenanceSetDetail id={id} />;
}
```

- [ ] **Step 2: Implement `MaintenanceSetDetail`**

- Loads set via `useMaintenanceSet(id)`
- Header: catalog manufacturer + name + systemType badge + "Löschen"-Button
- Items table via `MaintenanceSetItemsTable`
- "+ Teil hinzufügen" button → opens `MaintenanceSetItemForm` modal

- [ ] **Step 3: Implement `MaintenanceSetItemsTable`**

Columns: Category (with badge using `formatPartCategory`), Description, ArticleNumber, Quantity + Unit, Required (✓/—), Linked Inventory (▼ if set), Actions (Edit / Up / Down / Delete).

"Up" / "Down" buttons call `useReorderSetItems` with swapped `sortOrder` values for the clicked pair.

- [ ] **Step 4: Implement `MaintenanceSetItemForm`**

React Hook Form + Zod resolver using `maintenanceSetItemCreateSchema`. Fields:
- Category select (`SPARE_PART` / `CONSUMABLE` / `TOOL`)
- Description text
- Article number text (optional)
- Quantity number + Unit text
- Required checkbox
- Note textarea (optional)
- InventoryItem picker (searchable select sourced from `useInventoryItems()`, **disabled when category = TOOL**)

On submit: `useCreateSetItem` or `useUpdateSetItem`.

- [ ] **Step 5: Manual check**

Create a set → add 3 items (one TOOL — verify inventory picker disables). Rearrange via ↑↓. Edit. Delete.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/wartungssets/[id]/ src/components/maintenance-sets/MaintenanceSetDetail.tsx src/components/maintenance-sets/MaintenanceSetItemsTable.tsx src/components/maintenance-sets/MaintenanceSetItemForm.tsx
git commit -m "feat(ui): /dashboard/wartungssets/[id] detail + item form"
```

---

## Task 25: `/dashboard/lager` list + status badge

**Files:**
- Create: `src/app/dashboard/lager/page.tsx`
- Create: `src/components/inventory/InventoryList.tsx`
- Create: `src/components/inventory/InventoryStatusBadge.tsx`

- [ ] **Step 1: Implement `InventoryStatusBadge`**

```tsx
// src/components/inventory/InventoryStatusBadge.tsx
import { Badge } from '@/components/ui/badge';
import type { Prisma } from '@prisma/client';

export function InventoryStatusBadge({
  currentStock, minStock,
}: { currentStock: Prisma.Decimal | number; minStock: Prisma.Decimal | number }) {
  const curr = Number(currentStock);
  const min = Number(minStock);
  if (curr <= 0) return <Badge className="bg-red-100 text-red-800">Leer</Badge>;
  if (curr < min) return <Badge className="bg-amber-100 text-amber-800">Niedrig</Badge>;
  return <Badge variant="outline">OK</Badge>;
}
```

- [ ] **Step 2: Implement `InventoryList`**

Table columns: Artikelnummer, Bezeichnung, Bestand, Mindestmenge, Einheit, Status-Badge. Row click opens drawer (Task 26). Top: filter toggle "Alle / Nur niedrig". "+ Neues Lagerteil" button (OWNER only).

Data via `useInventoryItems(filter)`. Role via `useSession()` from NextAuth.

- [ ] **Step 3: Implement page shell**

```tsx
// src/app/dashboard/lager/page.tsx
'use client';
import { InventoryList } from '@/components/inventory/InventoryList';

export default function LagerPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Lager</h1>
      <InventoryList />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/lager/page.tsx src/components/inventory/InventoryList.tsx src/components/inventory/InventoryStatusBadge.tsx
git commit -m "feat(ui): /dashboard/lager list + status badge"
```

---

## Task 26: Inventory drawer + item form + movement form

**Files:**
- Create: `src/components/inventory/InventoryDrawer.tsx`
- Create: `src/components/inventory/InventoryItemForm.tsx`
- Create: `src/components/inventory/InventoryMovementForm.tsx`

- [ ] **Step 1: Implement `InventoryDrawer`**

Reuse the drawer pattern from `src/components/termine/BookingDetailsDrawer.tsx`. Sections:
- Item metadata (description, articleNumber, unit, currentStock, minStock, lastRestockedAt)
- Actions (OWNER): "Zugang buchen" (RESTOCK), "Korrektur buchen" (CORRECTION), "Bearbeiten" (opens InventoryItemForm), "Löschen"
- Bewegungshistorie: last 30 rows via `useInventoryMovements(item.id)`. Each row: date, user, reason-badge, signed quantity, note.

- [ ] **Step 2: Implement `InventoryItemForm`**

React Hook Form + Zod (`inventoryItemCreateSchema` / `inventoryItemUpdateSchema`). Fields: description, articleNumber, unit (default "Stck"), minStock. Do NOT expose `currentStock` — server rejects it.

- [ ] **Step 3: Implement `InventoryMovementForm`**

Fields: quantity (positive number), note (optional). Props: `reason: 'RESTOCK' | 'CORRECTION'` (parent picks). For CORRECTION: quantity input allows negative (technically a signed adjustment); actually simpler UX — always positive input + direction toggle "Zugang/Abgang". Or: two separate modal instances for RESTOCK (positive only) vs CORRECTION (signed).

Ship the simpler approach: separate modal components, both send signed `quantityChange`:
- RESTOCK: user enters positive qty
- CORRECTION: user enters signed qty (with clear UI label "positive Menge = Zugang, negative = Abgang")

Submit: `useCreateMovement(itemId)`.

- [ ] **Step 4: Manual check**

Create inventory item → open drawer → book RESTOCK (10 Stck) → currentStock = 10, lastRestockedAt updated → book CORRECTION (-2) → currentStock = 8, lastRestockedAt unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/components/inventory/InventoryDrawer.tsx src/components/inventory/InventoryItemForm.tsx src/components/inventory/InventoryMovementForm.tsx
git commit -m "feat(ui): inventory drawer + forms"
```

---

## Task 27: PartsListCard on `/dashboard/systems/[id]`

**Files:**
- Create: `src/components/systems/PartsListCard.tsx`
- Create: `src/components/systems/CustomerSystemOverrideList.tsx`
- Create: `src/components/systems/CustomerSystemOverrideForm.tsx`
- Modify: `src/app/dashboard/systems/[id]/page.tsx`

- [ ] **Step 1: Implement `PartsListCard`**

Three sections inside the card:
1. **"Standard-Wartungsset"** — read-only preview. If set exists: display catalog label + item count + "Bearbeiten →" link (OWNER only) to `/dashboard/wartungssets/[setId]`. If no set: hint text "Noch kein Wartungsset für dieses Modell" + "Wartungsset anlegen →" button (OWNER).
2. **"Abweichungen für diese Anlage"** — via `CustomerSystemOverrideList`. OWNER sees edit/delete buttons; TECHNICIAN sees read-only.
3. **"Effektive Liste"** — collapsed by default. Expand → shows resolved list from `useEffectiveParts(systemId)`.

- [ ] **Step 2: Implement `CustomerSystemOverrideList`**

Two sub-groups:
- **Hinzugefügt** — rows from ADD overrides (description, quantity+unit, category-badge)
- **Ausgeschlossen** — rows listing the suppressed default items (lookup by `excludedSetItemId` against the effective set)

OWNER: each row has delete (🗑) button → `useDeleteOverride`. TECHNICIAN: no actions.

OWNER actions bar: "+ Teil hinzufügen" (opens ADD modal), "+ Standard ausschließen" (opens EXCLUDE picker — list of default set items, click → POST EXCLUDE).

- [ ] **Step 3: Implement `CustomerSystemOverrideForm`**

Modal with `action` pre-set to ADD. React Hook Form fields mirror `MaintenanceSetItemForm` (same field set except TOOL+inventoryItemId refinement still applies).

- [ ] **Step 4: Integrate into `/dashboard/systems/[id]/page.tsx`**

Insert `<PartsListCard systemId={id} />` between `WartungsplanCard` and `SystemPhotosCard` (reference existing section layout in the page).

- [ ] **Step 5: Manual check**

OWNER: add an ADD override + an EXCLUDE override → "Effektive Liste" reflects both changes.
TECHNICIAN: same page → no edit buttons; list renders read-only.

- [ ] **Step 6: Commit**

```bash
git add src/components/systems/PartsListCard.tsx src/components/systems/CustomerSystemOverrideList.tsx src/components/systems/CustomerSystemOverrideForm.tsx src/app/dashboard/systems/[id]/page.tsx
git commit -m "feat(ui): PartsListCard on system detail page"
```

---

## Task 28: Extend MaintenanceChecklistModal with Step 2.5 "Teileverbrauch"

**Files:**
- Create: `src/components/maintenance/PartsUsageStep.tsx`
- Modify: `src/components/maintenance/MaintenanceChecklistModal.tsx`

- [ ] **Step 1: Implement `PartsUsageStep`**

Component props:
```ts
type Props = {
  customerSystemId: string;
  value: PartsUsageEntry[];
  onChange: (v: PartsUsageEntry[]) => void;
};
type PartsUsageEntry = {
  sourceType: 'DEFAULT' | 'OVERRIDE_ADD' | 'AD_HOC';
  setItemId?: string;
  overrideId?: string;
  inventoryItemId?: string;
  description: string;
  articleNumber?: string;
  quantity: number;
  unit: string;
};
```

Behavior:
- On mount: call `useEffectiveParts(customerSystemId)` → initialize `value` with one row per returned part (skip TOOL rows — they're not consumed, only displayed separately as "Werkzeug-Check" below).
- Main section "Teileverbrauch": list of non-TOOL rows. Each row: checkbox "verwendet" (default checked), quantity input (default from effective part), "nicht verbraucht" link (unchecks and zeros quantity).
- "Werkzeug" section (read-only list): TOOL rows, each with a confirmation checkbox (not persisted, purely visual).
- "+ Zusatzteil erfassen" button → inline form:
  - description (required)
  - quantity + unit
  - articleNumber (optional)
  - InventoryItem picker (optional) — searchable; showing currentStock
  - On add → push `{ sourceType: 'AD_HOC', description, quantity, unit, articleNumber?, inventoryItemId? }` to `value`

On change: call `onChange(newArray)`.

- [ ] **Step 2: Integrate into `MaintenanceChecklistModal`**

Find the existing step array in `MaintenanceChecklistModal.tsx`. Insert a new step between "Notes+Photos" and "Confirm":

```tsx
{/* Step 2.5 */}
{step === 2.5 && (
  <PartsUsageStep
    customerSystemId={systemId}
    value={partsUsed}
    onChange={setPartsUsed}
  />
)}
```

`partsUsed` = new `useState` in the modal. Include it in the final POST body passed to `useCreateMaintenance`.

- [ ] **Step 3: Show negative-stock warnings in success handler**

After the POST mutation succeeds, inspect `response.negativeStockWarnings`. If non-empty, show one toast per warning:

```ts
data.negativeStockWarnings?.forEach((w) => {
  toast.warning(`Lager für "${itemMap[w.inventoryItemId].description}" unterschritten — Bestand ${w.newStock}`);
});
```

Where `itemMap` is built from `useInventoryItems()` (already loaded in the PartsUsageStep). Since the hook caches, this is free.

- [ ] **Step 4: Manual check**

Start a maintenance on a system with a Standard set + 1 ADD override. Step 2.5 shows all items prefilled. Reduce Injektor qty to 0 ("nicht verbraucht"). Add an unexpected AD_HOC consumable linked to an inventory item. Save → verify stock decrements + snapshot in checklistData.

- [ ] **Step 5: Commit**

```bash
git add src/components/maintenance/PartsUsageStep.tsx src/components/maintenance/MaintenanceChecklistModal.tsx
git commit -m "feat(ui): MaintenanceChecklistModal Step 2.5 — Teileverbrauch"
```

---

## Task 29: Packing-list print view page

**Files:**
- Create: `src/app/dashboard/termine/[id]/packliste/page.tsx`
- Create: `src/components/packing-list/PackingListPrintView.tsx`
- Modify: `src/components/termine/BookingDetailsDrawer.tsx`

- [ ] **Step 1: Implement `PackingListPrintView`**

```tsx
// src/components/packing-list/PackingListPrintView.tsx
'use client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { usePackingList } from '@/hooks/usePackingList';
import { formatPartCategory } from '@/lib/format';

export function PackingListPrintView({ bookingId }: { bookingId: string }) {
  const { data, isLoading } = usePackingList(bookingId);
  if (isLoading || !data) return <div>Lädt…</div>;

  const parts = data.effectiveParts ?? [];
  const tools = parts.filter((p: any) => p.category === 'TOOL');
  const consumables = parts.filter((p: any) => p.category !== 'TOOL');

  const stockStatus = (p: any) => {
    if (!p.inventoryItem) return '(nicht im Lager erfasst)';
    const curr = Number(p.inventoryItem.currentStock);
    const needed = Number(p.quantity);
    return curr >= needed ? `Lager: ${curr} ✓` : `Lager: ${curr} ⚠ FEHLBESTAND`;
  };

  return (
    <div className="p-8 max-w-2xl mx-auto print:p-4 print:max-w-full">
      <style>{`@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>
      <header className="mb-6 border-b pb-4">
        <h1 className="text-xl font-bold">Packliste — Wartung</h1>
        <p><strong>Kunde:</strong> {data.customer?.name}</p>
        <p><strong>Anlage:</strong> {data.system?.catalog?.manufacturer} {data.system?.catalog?.name}</p>
        <p><strong>Termin:</strong> {format(new Date(data.booking.startTime), 'PPpp', { locale: de })}</p>
        <p><strong>Techniker:</strong> {data.technician?.name}</p>
      </header>

      <section className="mb-6">
        <h2 className="font-semibold mb-2">Teile</h2>
        {consumables.length === 0 ? (
          <p className="text-gray-500">Keine Teile erfasst.</p>
        ) : (
          <ul className="space-y-1">
            {consumables.map((p: any, i: number) => (
              <li key={i} className="flex gap-2">
                <span>☐</span>
                <span className="flex-1">
                  {p.quantity}× {p.description} {p.articleNumber && <span className="text-gray-500">({p.articleNumber})</span>}
                </span>
                <span className="text-sm">{stockStatus(p)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {tools.length > 0 && (
        <section className="mb-6">
          <h2 className="font-semibold mb-2">Werkzeug</h2>
          <ul className="space-y-1">
            {tools.map((p: any, i: number) => (
              <li key={i} className="flex gap-2">
                <span>☐</span>
                <span>{p.description}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-10 pt-4 border-t text-sm text-gray-500">
        Druckdatum: {format(new Date(), 'PPp', { locale: de })}
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Implement page**

```tsx
// src/app/dashboard/termine/[id]/packliste/page.tsx
'use client';
import { use } from 'react';
import { PackingListPrintView } from '@/components/packing-list/PackingListPrintView';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <PackingListPrintView bookingId={id} />;
}
```

- [ ] **Step 3: Add "Packliste drucken" button to `BookingDetailsDrawer`**

In `src/components/termine/BookingDetailsDrawer.tsx`, add a button that opens `/dashboard/termine/[bookingId]/packliste` in a new tab:

```tsx
<Button variant="outline" asChild>
  <a href={`/dashboard/termine/${booking.id}/packliste`} target="_blank" rel="noreferrer">
    Packliste drucken
  </a>
</Button>
```

Only show when `booking.systemId` is set (no system → nothing useful to print).

- [ ] **Step 4: Manual check**

Open any future booking with a system → drawer → "Packliste drucken" → new tab shows the print view → browser print (Ctrl+P) → PDF output.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/termine/[id]/packliste/ src/components/packing-list/ src/components/termine/BookingDetailsDrawer.tsx
git commit -m "feat(ui): packing-list print view"
```

---

## Task 30: LowStockDashboardCard on `/dashboard`

**Files:**
- Create: `src/components/inventory/LowStockDashboardCard.tsx`
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Implement card**

```tsx
// src/components/inventory/LowStockDashboardCard.tsx
'use client';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Package2 } from 'lucide-react';

export function LowStockDashboardCard({ count }: { count: number }) {
  if (count === 0) return null;
  const color = count >= 5 ? 'bg-red-50 text-red-900 border-red-200' : 'bg-amber-50 text-amber-900 border-amber-200';
  return (
    <Link href="/dashboard/lager?filter=low">
      <Card className={`p-4 border ${color} hover:shadow-sm transition-shadow`}>
        <div className="flex items-center gap-3">
          <Package2 className="h-5 w-5" />
          <div>
            <div className="text-sm font-medium">Lager-Warnung</div>
            <div className="text-2xl font-semibold">{count}</div>
            <div className="text-xs">Teile unter Mindestmenge</div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 2: Integrate into dashboard (OWNER branch only)**

In `src/app/dashboard/page.tsx`, locate the stats grid for OWNER. Add:

```tsx
{role === 'OWNER' && stats.inventoryBelowMinStockCount > 0 && (
  <LowStockDashboardCard count={stats.inventoryBelowMinStockCount} />
)}
```

- [ ] **Step 3: Manual check**

Create inventory items where 2 fall below minStock → dashboard shows amber card "2 Teile unter Mindestmenge". Click → navigates to `/dashboard/lager?filter=low`.

- [ ] **Step 4: Commit**

```bash
git add src/components/inventory/LowStockDashboardCard.tsx src/app/dashboard/page.tsx
git commit -m "feat(ui): dashboard LowStockDashboardCard for OWNER"
```

---

## Task 31: Weekly summary email — Lager section

**Files:**
- Modify: `src/lib/email/templates/WeeklySummaryEmail.tsx`
- Modify: `src/lib/email/service.tsx`
- Modify: `src/app/api/cron/weekly-summary/route.ts` (if the query lives there; otherwise in service)

- [ ] **Step 1: Extend the email template**

Add a new prop + section (OWNER only, condition on `role`):

```tsx
// inside WeeklySummaryEmail, below the "Überfällig" section
{role === 'OWNER' && lowStockItems && lowStockItems.length > 0 && (
  <Section>
    <Heading as="h2">📦 Lager</Heading>
    <Text>{lowStockItems.length} Teile unter Mindestmenge:</Text>
    <ul>
      {lowStockItems.slice(0, 5).map((i) => (
        <li key={i.id}>
          {i.description} {i.articleNumber && `(${i.articleNumber})`} — Bestand {String(i.currentStock)}, Min {String(i.minStock)}
        </li>
      ))}
    </ul>
  </Section>
)}
```

- [ ] **Step 2: Query low-stock items per user's company in the summary generator**

In `src/lib/email/service.tsx` inside the `sendWeeklySummary(targetUserId?)` function, extend the parallel-query block:

```ts
const lowStockItemsRaw = user.role === 'OWNER'
  ? await prisma.inventoryItem.findMany({ where: { companyId: user.companyId } })
  : [];
const lowStockItems = lowStockItemsRaw
  .filter((i) => i.currentStock.lt(i.minStock))
  .sort((a, b) => Number(b.minStock.sub(b.currentStock)) - Number(a.minStock.sub(a.currentStock)));
```

Pass `lowStockItems` (or truncated top-5) to the `WeeklySummaryEmail` template alongside the existing props.

- [ ] **Step 3: Verify manually via dev trigger**

```bash
# Trigger the weekly summary cron for yourself
curl -X POST http://localhost:3000/api/cron/weekly-summary \
  -H "x-cron-secret: <your CRON_SECRET>"
```

Check the inbox — OWNER mail contains "📦 Lager" section; TECHNICIAN mail (if you log in as one) does not.

- [ ] **Step 4: Commit**

```bash
git add src/lib/email/templates/WeeklySummaryEmail.tsx src/lib/email/service.tsx src/app/api/cron/weekly-summary/route.ts
git commit -m "feat(email): weekly summary Lager section for OWNER"
```

---

## Task 32: Data migration script for legacy `requiredParts`

**Files:**
- Create: `scripts/migrate-required-parts.ts`

- [ ] **Step 1: Write the script**

```ts
// scripts/migrate-required-parts.ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MARKER_NOTE = 'Aus Altdaten übernommen (ehem. requiredParts)';

async function main() {
  const systems = await prisma.customerSystem.findMany({
    where: { requiredParts: { not: null } },
    select: { id: true, requiredParts: true },
  });

  console.log(`Found ${systems.length} customer systems with legacy requiredParts.`);

  let created = 0;
  let skipped = 0;

  for (const s of systems) {
    const text = (s.requiredParts ?? '').trim();
    if (!text) { skipped++; continue; }

    // Idempotency: skip if marker override already exists for this system
    const existing = await prisma.customerSystemPartOverride.findFirst({
      where: { customerSystemId: s.id, note: MARKER_NOTE },
    });
    if (existing) { skipped++; continue; }

    await prisma.customerSystemPartOverride.create({
      data: {
        customerSystemId: s.id,
        action: 'ADD',
        category: 'SPARE_PART',
        description: text,
        quantity: 1,
        unit: 'Stck',
        required: true,
        sortOrder: 999,
        note: MARKER_NOTE,
      },
    });
    created++;
  }

  console.log(`Migrated: ${created} created, ${skipped} skipped.`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run on staging / local first**

```bash
npx tsx scripts/migrate-required-parts.ts
```

Expected: prints counts; manual spot-check on `/dashboard/systems/[id]` PartsListCard shows the legacy text as ADD override with marker note.

- [ ] **Step 3: Commit the script (do not run on production yet)**

```bash
git add scripts/migrate-required-parts.ts
git commit -m "feat(scripts): data migration from CustomerSystem.requiredParts → overrides"
```

---

## Task 33: Tenant-isolation audit test update

**Files:**
- Modify: `src/lib/__tests__/tenant-isolation.test.ts` (or wherever the existing audit lives — check `grep -rln "tenant-isolation" src/`)

- [ ] **Step 1: Add new route files to the audit list**

Find the existing route list in the test. Add:

```ts
'src/app/api/maintenance-sets/route.ts',
'src/app/api/maintenance-sets/[id]/route.ts',
'src/app/api/maintenance-sets/[id]/items/route.ts',
'src/app/api/maintenance-sets/[id]/items/reorder/route.ts',
'src/app/api/maintenance-set-items/[id]/route.ts',
'src/app/api/customer-systems/[id]/overrides/route.ts',
'src/app/api/customer-systems/[id]/effective-parts/route.ts',
'src/app/api/overrides/[id]/route.ts',
'src/app/api/inventory/route.ts',
'src/app/api/inventory/[id]/route.ts',
'src/app/api/inventory/[id]/movements/route.ts',
'src/app/api/bookings/[id]/packing-list/route.ts',
```

If the audit scans all route files automatically (unlikely but check the implementation), no changes needed — but verify the test passes.

- [ ] **Step 2: Run the audit test**

```bash
npm test -- src/lib/__tests__/tenant-isolation.test.ts
```

Expected: PASS. Each new route contains `companyId` scoping (verified via source scan).

- [ ] **Step 3: Commit**

```bash
git add src/lib/__tests__/tenant-isolation.test.ts
git commit -m "test(tenant): extend isolation audit with new Phase A routes"
```

---

## Task 34: Full test suite green

**Files:** none

- [ ] **Step 1: Run the entire suite**

```bash
npm test
```

Expected: **all tests pass** — existing tests remain green, plus all new tests added across Tasks 2–18 and Task 33.

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck  # or tsc --noEmit --project tsconfig.json
```

Expected: **0 errors**.

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: **build succeeds**, no Turbopack errors, no React warnings.

- [ ] **Step 4: If anything fails, fix inline and re-run**

Do not proceed to Task 35 (destructive migration) until all three checks are green.

---

## Task 35: Manual verification checklist from spec §3.5

Walk through all 13 steps from the spec's manual verification checklist in a dev or staging environment. Record pass/fail for each step.

- [ ] Step 1: OWNER creates MaintenanceSet for Grünbeck "GSX 10" with 3 items (1 linked to InventoryItem, 1 untracked SPARE_PART, 1 TOOL)
- [ ] Step 2: `/dashboard/systems/[id]` shows Standard-Set preview + empty overrides
- [ ] Step 3: Add ADD + EXCLUDE override — effective list updates
- [ ] Step 4: TECHNICIAN login — "Wartungssets" invisible, "Lager" visible without write buttons
- [ ] Step 5: TECHNICIAN Step 2.5 shows effective parts correctly
- [ ] Step 6: TECHNICIAN confirms + adds unexpected part — save completes
- [ ] Step 7: `/dashboard/lager` shows reduced currentStock + movement drawer
- [ ] Step 8: Negative-stock scenario — toast warn, "leer"-Badge displayed
- [ ] Step 9: OWNER deletes maintenance — dialog + reversal, CORRECTION movements visible
- [ ] Step 10: Packing-list print-view renders correctly — Browser print → PDF
- [ ] Step 11: Dashboard `LowStockDashboardCard` renders when appropriate
- [ ] Step 12: Weekly summary email (trigger manually via cron endpoint) — OWNER has Lager section; TECH doesn't
- [ ] Step 13: Legacy-data migration: system with former `requiredParts` shows that text as ADD override

Any failures → diagnose + fix + re-run relevant tasks' tests before proceeding.

---

## Task 36: Drop `requiredParts` column (destructive migration)

**Files:**
- Modify: `prisma/schema.prisma` (remove the field)
- Create: `prisma/migrations/20260424200000_drop_customer_systems_required_parts/migration.sql`

**Prerequisite:** Task 32 migration script has been run successfully on production, and Task 35 manual verification Step 13 has confirmed the legacy data is accessible via the new overrides.

- [ ] **Step 1: Remove field from schema**

Edit `prisma/schema.prisma` — delete the `requiredParts String?` line from `CustomerSystem`.

- [ ] **Step 2: Generate migration**

```bash
npx prisma migrate dev --name drop_customer_systems_required_parts --config config/prisma.config.ts
```

- [ ] **Step 3: Verify generated SQL**

File should contain: `ALTER TABLE "customer_systems" DROP COLUMN "requiredParts";`

- [ ] **Step 4: Run full test + build**

```bash
npm test && npm run build
```

Expected: green. Search codebase for any remaining reference to `requiredParts`:

```bash
grep -rn "requiredParts" src/ scripts/ 2>&1
```

Expected: zero matches. If found, remove.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "chore(db): drop CustomerSystem.requiredParts — legacy data migrated to overrides"
```

---

## Task 37: BACKLOG.md — add N-1..N-11 + mark Phase A resolved

**Files:**
- Modify: `docs/BACKLOG.md`

- [ ] **Step 1: Add Maybe/Future entries**

Under `## Maybe / Future`:

```markdown
| N-1 | Feature | **Packliste per E-Mail senden** (L2 variant) — owner requests packing list via email button; new `PackingListEmail` React-Email template. | Phase B. |
| N-2 | Feature | **Bestellworkflow** — order suggestions from low-stock alerts, supplier link templates, order status tracking. | Phase B. |
| N-3 | Feature | **Echtzeit-Lager-Alert-Mail** — S3 variant; per-event email on first threshold breach with debounce. | Phase B. |
| N-4 | Feature | **Multi-Wartungstyp** — add `maintenanceType: STANDARD \| INSPECTION \| EMERGENCY` to `MaintenanceSet`. | Additive schema change. |
| N-5 | Feature | **PDF-Import für Wartungssets** — install tesseract/ocrmypdf/poppler; parse manufacturer service-parts PDFs. | Phase B; requires OCR toolchain. |
| N-6 | Feature | **Per-Item-Foto** auf MaintenanceSetItem für Vor-Ort-Identifikation. | Phase B. |
| N-7 | Feature | **CSV/XLSX-Bulk-Import** for InventoryItems and MaintenanceSetItems. | Combine with #25. |
| N-8 | Integration | **Drittanbieter-Lager-Integration** (Sortly / Doron / Fifo). | Phase C. |
| N-9 | Integration | **Hersteller-Teile-Kataloge** (Bosch Pro, Grünbeck). | Phase D. |
| N-10 | Architecture | **Community-Wartungssets** — global defaults + tenant overrides (Variante C aus Spec Q1). | Phase D. |
| N-11 | UX | **Drag-and-Drop Reorder** für MaintenanceSetItems (Phase A ↑↓ only). | Pair with M-3. |
```

- [ ] **Step 2: Add Phase A completion entry**

Under `## Completed / Resolved`, new sprint block:

```markdown
### Sprint 28 — Wartungsteile & Materialmanagement Phase A (2026-04-24)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| — | Feature | MaintenanceSet library (tenant-scoped) + CustomerSystem overrides (ADD/EXCLUDE) + InventoryItem with movements (RESTOCK/CORRECTION/MAINTENANCE_USE) + MaintenanceChecklistModal Step 2.5 Teileverbrauch + on-demand packing-list print view + Dashboard LowStockCard + WeeklySummary Lager section. Migration: `CustomerSystem.requiredParts` legacy free-text migrated to overrides and column dropped. Spec: `docs/superpowers/specs/2026-04-24-wartungsteile-materialmanagement-phase-a-design.md`. Plan: `docs/superpowers/plans/2026-04-24-wartungsteile-materialmanagement-phase-a.md`. | 2026-04-24 |
```

- [ ] **Step 3: Commit**

```bash
git add docs/BACKLOG.md
git commit -m "docs(backlog): add Wartungsteile Phase B+ items (N-1..N-11); mark Phase A complete"
```

---

## Post-implementation: sign-off checklist

Before handing off for review / PR:

- [ ] Full test suite green (Task 34)
- [ ] Manual verification all 13 steps passed (Task 35)
- [ ] Both Prisma migrations applied to staging
- [ ] Data migration script ran successfully on staging; spot-check confirmed
- [ ] No `requiredParts` references remain in the codebase
- [ ] BACKLOG.md updated
- [ ] Sprint sign-off entry written (follows the Sprint 24–27 pattern in BACKLOG.md)
