-- Enum additions (RESCHEDULED was already present on BookingStatus per Sprint 13; guarded with IF NOT EXISTS)
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'RESCHEDULED';
ALTER TYPE "EmailType" ADD VALUE IF NOT EXISTS 'BOOKING_RESCHEDULED';
ALTER TYPE "EmailType" ADD VALUE IF NOT EXISTS 'BOOKING_CANCELLED';

-- Booking metadata
ALTER TABLE "bookings"
  ADD COLUMN IF NOT EXISTS "cancelReason"       TEXT,
  ADD COLUMN IF NOT EXISTS "cancelledAt"        TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rescheduledFromUid" TEXT,
  ADD COLUMN IF NOT EXISTS "rescheduledToUid"   TEXT,
  ADD COLUMN IF NOT EXISTS "rescheduledAt"      TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "bookings_status_idx"             ON "bookings"("status");
CREATE INDEX IF NOT EXISTS "bookings_rescheduledFromUid_idx" ON "bookings"("rescheduledFromUid");
