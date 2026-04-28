-- CreateEnum
CREATE TYPE "PartCategory" AS ENUM ('SPARE_PART', 'CONSUMABLE', 'TOOL');

-- CreateEnum
CREATE TYPE "OverrideAction" AS ENUM ('ADD', 'EXCLUDE');

-- CreateEnum
CREATE TYPE "MovementReason" AS ENUM ('MAINTENANCE_USE', 'MANUAL_ADJUSTMENT', 'RESTOCK', 'CORRECTION');

-- NOTE: The line below is unrelated drift from `company_multi_user`,
--       not part of the Wartungsteile feature. The `companies.updatedAt`
--       column had `DEFAULT CURRENT_TIMESTAMP` in the production DB but
--       no `@default(...)` in `prisma/schema.prisma` (Prisma manages
--       updates via `@updatedAt`). Prisma reconciled the drift while
--       generating this additive migration. Decision §1 in the
--       Wartungsteile execution runbook records the call to leave it.
-- AlterTable
ALTER TABLE "companies" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "maintenance_sets" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_set_items" (
    "id" TEXT NOT NULL,
    "maintenanceSetId" TEXT NOT NULL,
    "category" "PartCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "articleNumber" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'Stck',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "inventoryItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_set_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_system_part_overrides" (
    "id" TEXT NOT NULL,
    "customerSystemId" TEXT NOT NULL,
    "action" "OverrideAction" NOT NULL,
    "category" "PartCategory",
    "description" TEXT,
    "articleNumber" TEXT,
    "quantity" DECIMAL(65,30),
    "unit" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "inventoryItemId" TEXT,
    "excludedSetItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_system_part_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "articleNumber" TEXT,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'Stck',
    "currentStock" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "minStock" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "lastRestockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantityChange" DECIMAL(65,30) NOT NULL,
    "reason" "MovementReason" NOT NULL,
    "maintenanceId" TEXT,
    "userId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "maintenance_sets_companyId_idx" ON "maintenance_sets"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_sets_companyId_catalogId_key" ON "maintenance_sets"("companyId", "catalogId");

-- CreateIndex
CREATE INDEX "maintenance_set_items_maintenanceSetId_idx" ON "maintenance_set_items"("maintenanceSetId");

-- CreateIndex
CREATE INDEX "maintenance_set_items_inventoryItemId_idx" ON "maintenance_set_items"("inventoryItemId");

-- CreateIndex
CREATE INDEX "customer_system_part_overrides_customerSystemId_idx" ON "customer_system_part_overrides"("customerSystemId");

-- CreateIndex
CREATE INDEX "customer_system_part_overrides_inventoryItemId_idx" ON "customer_system_part_overrides"("inventoryItemId");

-- CreateIndex
CREATE INDEX "customer_system_part_overrides_excludedSetItemId_idx" ON "customer_system_part_overrides"("excludedSetItemId");

-- CreateIndex
CREATE INDEX "inventory_items_companyId_idx" ON "inventory_items"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_companyId_articleNumber_key" ON "inventory_items"("companyId", "articleNumber");

-- CreateIndex
CREATE INDEX "inventory_movements_companyId_idx" ON "inventory_movements"("companyId");

-- CreateIndex
CREATE INDEX "inventory_movements_inventoryItemId_idx" ON "inventory_movements"("inventoryItemId");

-- CreateIndex
CREATE INDEX "inventory_movements_maintenanceId_idx" ON "inventory_movements"("maintenanceId");

-- CreateIndex
CREATE INDEX "inventory_movements_createdAt_idx" ON "inventory_movements"("createdAt");

-- AddForeignKey
ALTER TABLE "maintenance_sets" ADD CONSTRAINT "maintenance_sets_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_sets" ADD CONSTRAINT "maintenance_sets_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "system_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_set_items" ADD CONSTRAINT "maintenance_set_items_maintenanceSetId_fkey" FOREIGN KEY ("maintenanceSetId") REFERENCES "maintenance_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_set_items" ADD CONSTRAINT "maintenance_set_items_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_system_part_overrides" ADD CONSTRAINT "customer_system_part_overrides_customerSystemId_fkey" FOREIGN KEY ("customerSystemId") REFERENCES "customer_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_system_part_overrides" ADD CONSTRAINT "customer_system_part_overrides_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_system_part_overrides" ADD CONSTRAINT "customer_system_part_overrides_excludedSetItemId_fkey" FOREIGN KEY ("excludedSetItemId") REFERENCES "maintenance_set_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "maintenances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
