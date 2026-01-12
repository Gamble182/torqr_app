-- AlterTable
ALTER TABLE "heaters" ADD COLUMN "heaterType" TEXT,
ADD COLUMN "manufacturer" TEXT,
ADD COLUMN "hasStorage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "storageManufacturer" TEXT,
ADD COLUMN "storageModel" TEXT,
ADD COLUMN "storageCapacity" INTEGER,
ADD COLUMN "hasBattery" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "batteryManufacturer" TEXT,
ADD COLUMN "batteryModel" TEXT,
ADD COLUMN "batteryCapacity" DOUBLE PRECISION,
ALTER COLUMN "customerId" DROP NOT NULL;
