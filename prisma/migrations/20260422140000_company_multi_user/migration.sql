-- Company Multi-User Architecture Migration
-- Spec: docs/superpowers/specs/2026-04-22-company-multi-user-architecture.md
--
-- This migration:
-- 1. Creates the companies table
-- 2. Adds companyId (nullable) + role fields to users
-- 3. Adds companyId (nullable) to all tenant-scoped tables
-- 4. Adds assignedToUserId to customer_systems and bookings
-- 5. Backfills: creates a Company per existing User, sets companyId everywhere
-- 6. Sets NOT NULL constraints on companyId columns
-- 7. Adds indexes and foreign keys
-- 8. Removes companyName from users (moved to Company.name)

-- ============================================================================
-- STEP 1: Create companies table
-- ============================================================================

CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- STEP 2: Create UserRole enum and add new columns to users
-- ============================================================================

CREATE TYPE "UserRole" AS ENUM ('OWNER', 'TECHNICIAN');

ALTER TABLE "users" ADD COLUMN "companyId" TEXT;
ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'OWNER';
ALTER TABLE "users" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "deactivatedAt" TIMESTAMP(3);

-- ============================================================================
-- STEP 3: Add companyId to tenant-scoped tables (nullable for now)
-- ============================================================================

ALTER TABLE "customers" ADD COLUMN "companyId" TEXT;
ALTER TABLE "customer_systems" ADD COLUMN "companyId" TEXT;
ALTER TABLE "customer_systems" ADD COLUMN "assignedToUserId" TEXT;
ALTER TABLE "maintenances" ADD COLUMN "companyId" TEXT;
ALTER TABLE "bookings" ADD COLUMN "companyId" TEXT;
ALTER TABLE "bookings" ADD COLUMN "assignedToUserId" TEXT;
ALTER TABLE "follow_up_jobs" ADD COLUMN "companyId" TEXT;

-- ============================================================================
-- STEP 4: Backfill — create a Company for each existing User
-- ============================================================================

-- Create one Company per existing User, using the User's companyName as Company.name
INSERT INTO "companies" ("id", "name", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    "companyName",
    "createdAt",
    CURRENT_TIMESTAMP
FROM "users";

-- Link each User to their Company (match by creation order since 1:1)
-- We need a deterministic join — use a CTE to pair them
WITH user_company AS (
    SELECT
        u."id" AS user_id,
        c."id" AS company_id
    FROM (
        SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS rn
        FROM "users"
    ) u
    JOIN (
        SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS rn
        FROM "companies"
    ) c ON u.rn = c.rn
)
UPDATE "users" u
SET "companyId" = uc.company_id
FROM user_company uc
WHERE u."id" = uc.user_id;

-- ============================================================================
-- STEP 5: Backfill — set companyId on all tenant-scoped records
-- ============================================================================

UPDATE "customers" c
SET "companyId" = u."companyId"
FROM "users" u
WHERE c."userId" = u."id";

UPDATE "customer_systems" cs
SET "companyId" = u."companyId"
FROM "users" u
WHERE cs."userId" = u."id";

UPDATE "maintenances" m
SET "companyId" = u."companyId"
FROM "users" u
WHERE m."userId" = u."id";

UPDATE "bookings" b
SET "companyId" = u."companyId"
FROM "users" u
WHERE b."userId" = u."id";

UPDATE "follow_up_jobs" f
SET "companyId" = u."companyId"
FROM "users" u
WHERE f."userId" = u."id";

-- ============================================================================
-- STEP 6: Set NOT NULL constraints
-- ============================================================================

ALTER TABLE "users" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "customers" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "customer_systems" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "maintenances" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "bookings" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "follow_up_jobs" ALTER COLUMN "companyId" SET NOT NULL;

-- ============================================================================
-- STEP 7: Add foreign keys
-- ============================================================================

-- users.companyId → companies
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- customers.companyId → companies
ALTER TABLE "customers" ADD CONSTRAINT "customers_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- customer_systems.companyId → companies
ALTER TABLE "customer_systems" ADD CONSTRAINT "customer_systems_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- customer_systems.assignedToUserId → users (nullable)
ALTER TABLE "customer_systems" ADD CONSTRAINT "customer_systems_assignedToUserId_fkey"
    FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- maintenances.companyId → companies
ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- bookings.companyId → companies
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- bookings.assignedToUserId → users (nullable)
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_assignedToUserId_fkey"
    FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- follow_up_jobs.companyId → companies
ALTER TABLE "follow_up_jobs" ADD CONSTRAINT "follow_up_jobs_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- STEP 8: Remove onDelete CASCADE from user FKs on tenant tables
-- (data belongs to Company now, userId is audit-only)
-- ============================================================================

-- customers: userId FK — drop CASCADE, set to no action
ALTER TABLE "customers" DROP CONSTRAINT "customers_userId_fkey";
ALTER TABLE "customers" ADD CONSTRAINT "customers_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- customer_systems: userId FK
ALTER TABLE "customer_systems" DROP CONSTRAINT "customer_systems_userId_fkey";
ALTER TABLE "customer_systems" ADD CONSTRAINT "customer_systems_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- maintenances: userId FK
ALTER TABLE "maintenances" DROP CONSTRAINT "maintenances_userId_fkey";
ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- bookings: userId FK
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_userId_fkey";
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- follow_up_jobs: userId FK
ALTER TABLE "follow_up_jobs" DROP CONSTRAINT "follow_up_jobs_userId_fkey";
ALTER TABLE "follow_up_jobs" ADD CONSTRAINT "follow_up_jobs_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- STEP 9: Add indexes
-- ============================================================================

CREATE INDEX "users_companyId_idx" ON "users"("companyId");
CREATE INDEX "customers_companyId_idx" ON "customers"("companyId");
CREATE INDEX "customer_systems_companyId_idx" ON "customer_systems"("companyId");
CREATE INDEX "customer_systems_assignedToUserId_idx" ON "customer_systems"("assignedToUserId");
CREATE INDEX "maintenances_companyId_idx" ON "maintenances"("companyId");
CREATE INDEX "bookings_companyId_idx" ON "bookings"("companyId");
CREATE INDEX "bookings_assignedToUserId_idx" ON "bookings"("assignedToUserId");
CREATE INDEX "follow_up_jobs_companyId_idx" ON "follow_up_jobs"("companyId");

-- ============================================================================
-- STEP 10: Remove companyName from users (now lives on Company.name)
-- ============================================================================

ALTER TABLE "users" DROP COLUMN "companyName";
