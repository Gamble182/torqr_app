-- AlterTable
ALTER TABLE "users" ADD COLUMN "companyName" TEXT,
ADD COLUMN "emailWeeklySummary" BOOLEAN NOT NULL DEFAULT true;
