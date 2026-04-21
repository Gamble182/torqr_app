-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "systemId" TEXT;

-- CreateIndex
CREATE INDEX "bookings_systemId_idx" ON "bookings"("systemId");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "customer_systems"("id") ON DELETE SET NULL ON UPDATE CASCADE;
