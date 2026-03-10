-- AlterTable
ALTER TABLE "ReportPreference"
  ADD COLUMN "preferredChannel" TEXT,
  ADD COLUMN "email" TEXT,
  ADD COLUMN "zaloPhoneNumber" TEXT,
  ADD COLUMN "reportDay" INTEGER,
  ADD COLUMN "reportHour" INTEGER,
  ADD COLUMN "lastReportSentAt" TIMESTAMP(3);

-- Backfill preferred channel from legacy encoded frequency values (e.g. WEEKLY:ZALO)
UPDATE "ReportPreference"
SET "preferredChannel" = CASE
  WHEN UPPER("frequency") LIKE '%:ZALO' THEN 'ZALO'
  WHEN UPPER("frequency") LIKE '%:IN_APP' THEN 'IN_APP'
  ELSE 'EMAIL'
END
WHERE "preferredChannel" IS NULL;

-- Normalize frequency to plain enum-like value
UPDATE "ReportPreference"
SET "frequency" = CASE
  WHEN UPPER(SPLIT_PART("frequency", ':', 1)) = 'WEEKLY' THEN 'WEEKLY'
  ELSE 'WEEKLY'
END;

-- Backfill default schedule values
UPDATE "ReportPreference"
SET
  "reportDay" = COALESCE("reportDay", 1),
  "reportHour" = COALESCE("reportHour", 9);

-- Enforce defaults and NOT NULL constraints for core fields
ALTER TABLE "ReportPreference"
  ALTER COLUMN "frequency" SET DEFAULT 'WEEKLY',
  ALTER COLUMN "preferredChannel" SET DEFAULT 'EMAIL',
  ALTER COLUMN "preferredChannel" SET NOT NULL,
  ALTER COLUMN "reportDay" SET DEFAULT 1,
  ALTER COLUMN "reportDay" SET NOT NULL,
  ALTER COLUMN "reportHour" SET DEFAULT 9,
  ALTER COLUMN "reportHour" SET NOT NULL;
