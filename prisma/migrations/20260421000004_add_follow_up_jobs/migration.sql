-- CreateTable: follow_up_jobs
CREATE TABLE "follow_up_jobs" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "systemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "maintenanceId" TEXT,

    CONSTRAINT "follow_up_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "follow_up_jobs_systemId_idx" ON "follow_up_jobs"("systemId");

-- CreateIndex
CREATE INDEX "follow_up_jobs_userId_idx" ON "follow_up_jobs"("userId");

-- CreateIndex
CREATE INDEX "follow_up_jobs_completed_idx" ON "follow_up_jobs"("completed");

-- AddForeignKey
ALTER TABLE "follow_up_jobs" ADD CONSTRAINT "follow_up_jobs_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "customer_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_up_jobs" ADD CONSTRAINT "follow_up_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_up_jobs" ADD CONSTRAINT "follow_up_jobs_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "maintenances"("id") ON DELETE SET NULL ON UPDATE CASCADE;
