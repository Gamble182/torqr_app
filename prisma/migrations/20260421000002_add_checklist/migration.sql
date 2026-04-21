-- AlterTable: add checklistData to maintenances
ALTER TABLE "maintenances" ADD COLUMN "checklistData" JSONB;

-- CreateTable: customer_system_checklist_items
CREATE TABLE "customer_system_checklist_items" (
    "id" TEXT NOT NULL,
    "customerSystemId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_system_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_system_checklist_items_customerSystemId_idx" ON "customer_system_checklist_items"("customerSystemId");

-- AddForeignKey
ALTER TABLE "customer_system_checklist_items" ADD CONSTRAINT "customer_system_checklist_items_customerSystemId_fkey" FOREIGN KEY ("customerSystemId") REFERENCES "customer_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
