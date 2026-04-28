-- ============================================================================
-- Sprint 28 — Wartungsteile & Materialmanagement Phase A — REVERSE MIGRATION
-- ============================================================================
--
-- Companion to docs/operations/sprint-28-rollback-plan.md (read it first).
--
-- This script undoes the schema effect of Sprint 28's two forward
-- migrations:
--
--   1. 20260424082431_add_maintenance_sets_and_inventory  (additive)
--   2. 20260428061650_drop_customer_systems_required_parts  (destructive)
--
-- It restores the `customer_systems.requiredParts` column, lifts the
-- migrated text back from the legacy ADD-override marker rows, then
-- drops every table + enum the feature introduced.
--
-- DESTRUCTIVE — read these warnings:
--
-- - All MaintenanceSet, MaintenanceSetItem, CustomerSystemPartOverride,
--   InventoryItem, and InventoryMovement rows are PERMANENTLY DROPPED.
--   If the pilot has already used these features, that data is gone
--   forever once this script commits.
-- - The recovery of `requiredParts` text is best-effort: it pulls only
--   from override rows where note = 'Aus Altdaten übernommen
--   (ehem. requiredParts)'. Anything the user added later as a manual
--   ADD override is NOT lifted back into requiredParts (would corrupt
--   the field's original semantics — free-text notes are not equivalent
--   to structured override rows).
-- - Take a Supabase backup BEFORE running this. Verify the backup
--   completed before continuing.
-- - Run inside a transaction so partial failures roll back cleanly.
--
-- USAGE:
--   1. Backup Supabase project hwagqyywixhhorhjtydt via dashboard.
--   2. Verify backup is restorable (snapshot timestamp visible in UI).
--   3. Run this script via psql against DIRECT_URL:
--        psql "$DIRECT_URL" -f docs/operations/sprint-28-rollback.sql
--      OR via Supabase SQL editor (paste, run with "I understand").
--   4. Verify (queries at the bottom of the file).
--   5. Deploy the pre-Sprint-28 application code (see rollback plan §6).
--   6. Reset Prisma migration state (see rollback plan §7).

BEGIN;

-- ----------------------------------------------------------------------------
-- Step 1: Re-add `requiredParts` to customer_systems
-- ----------------------------------------------------------------------------

ALTER TABLE "customer_systems" ADD COLUMN "requiredParts" TEXT;

-- ----------------------------------------------------------------------------
-- Step 2: Lift migrated text from override marker rows back to requiredParts
-- ----------------------------------------------------------------------------
--
-- The Task 32 migration marked ADD-override rows it created with
-- note = 'Aus Altdaten übernommen (ehem. requiredParts)' so they could
-- be recognised as the lifted legacy data. We pull `description` from
-- those rows back into the column, choosing the lowest sortOrder per
-- system (Task 32 used sortOrder=999, but be defensive in case a
-- subsequent ADD with the same marker exists).

UPDATE "customer_systems" cs
SET "requiredParts" = sub."description"
FROM (
    SELECT DISTINCT ON ("customerSystemId")
        "customerSystemId",
        "description"
    FROM "customer_system_part_overrides"
    WHERE "action" = 'ADD'
      AND "note" = 'Aus Altdaten übernommen (ehem. requiredParts)'
      AND "description" IS NOT NULL
    ORDER BY "customerSystemId", "sortOrder" ASC, "createdAt" ASC
) sub
WHERE cs."id" = sub."customerSystemId";

-- ----------------------------------------------------------------------------
-- Step 3: Drop tables in reverse FK dependency order
-- ----------------------------------------------------------------------------

DROP TABLE "inventory_movements";

DROP TABLE "customer_system_part_overrides";

DROP TABLE "maintenance_set_items";

DROP TABLE "maintenance_sets";

DROP TABLE "inventory_items";

-- ----------------------------------------------------------------------------
-- Step 4: Drop enums (must come after tables that reference them)
-- ----------------------------------------------------------------------------

DROP TYPE "MovementReason";

DROP TYPE "OverrideAction";

DROP TYPE "PartCategory";

-- ----------------------------------------------------------------------------
-- Step 5: Verification (read-only — runs inside the transaction).
-- ----------------------------------------------------------------------------
--
-- These should all return 0 rows. If any return non-zero, abort by
-- issuing ROLLBACK; otherwise COMMIT.

DO $$
DECLARE
    leftover_count INTEGER;
    column_present INTEGER;
BEGIN
    -- 5a. Tables gone.
    SELECT COUNT(*) INTO leftover_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
          'maintenance_sets',
          'maintenance_set_items',
          'customer_system_part_overrides',
          'inventory_items',
          'inventory_movements'
      );
    IF leftover_count <> 0 THEN
        RAISE EXCEPTION 'Rollback failed: % feature tables still exist', leftover_count;
    END IF;

    -- 5b. Enums gone.
    SELECT COUNT(*) INTO leftover_count
    FROM pg_type
    WHERE typname IN ('PartCategory', 'OverrideAction', 'MovementReason');
    IF leftover_count <> 0 THEN
        RAISE EXCEPTION 'Rollback failed: % feature enums still exist', leftover_count;
    END IF;

    -- 5c. requiredParts column restored.
    SELECT COUNT(*) INTO column_present
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'customer_systems'
      AND column_name = 'requiredParts';
    IF column_present <> 1 THEN
        RAISE EXCEPTION 'Rollback failed: requiredParts column not restored';
    END IF;

    RAISE NOTICE 'Sprint 28 reverse migration verified clean.';
END $$;

COMMIT;

-- After COMMIT — manual spot-check queries (run separately):
--
-- SELECT id, "requiredParts" FROM customer_systems
--   WHERE "requiredParts" IS NOT NULL ORDER BY "createdAt";
--
-- SELECT COUNT(*) FROM information_schema.tables
--   WHERE table_schema = 'public' AND table_name LIKE '%maintenance_set%';
-- -- expect: 0
