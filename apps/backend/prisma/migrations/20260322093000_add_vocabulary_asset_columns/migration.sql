-- Ensure Vocabulary has asset/supporting columns expected by current Prisma schema and seed script
ALTER TABLE "Vocabulary"
  ADD COLUMN IF NOT EXISTS "imageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "audioUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "difficulty" INTEGER,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Backfill status column if missing in legacy databases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'Vocabulary' AND column_name = 'status'
  ) THEN
    ALTER TABLE "Vocabulary"
      ADD COLUMN "status" "CmsContentStatus" NOT NULL DEFAULT 'DRAFT';
  END IF;
END $$;
