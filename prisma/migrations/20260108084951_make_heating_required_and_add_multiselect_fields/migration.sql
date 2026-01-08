/*
  Warnings:

  - You are about to drop the column `additionalEnergy` on the `customers` table. All the data in the column will be lost.
  - Made the column `heatingType` on table `customers` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "customers" DROP COLUMN "additionalEnergy",
ADD COLUMN     "additionalEnergySources" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "energyStorageSystems" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "heatingType" SET NOT NULL;

-- DropEnum
DROP TYPE "AdditionalEnergy";
