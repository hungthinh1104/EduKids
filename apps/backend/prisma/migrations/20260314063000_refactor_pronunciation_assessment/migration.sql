DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PronunciationProvider') THEN
    CREATE TYPE "PronunciationProvider" AS ENUM ('AZURE_SPEECH', 'GOOGLE_SPEECH', 'CUSTOM');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PronunciationAssessmentMode') THEN
    CREATE TYPE "PronunciationAssessmentMode" AS ENUM ('WORD', 'PARAGRAPH');
  END IF;
END $$;

ALTER TABLE "PronunciationAttempt"
  ADD COLUMN IF NOT EXISTS "provider" "PronunciationProvider" NOT NULL DEFAULT 'CUSTOM',
  ADD COLUMN IF NOT EXISTS "mode" "PronunciationAssessmentMode" NOT NULL DEFAULT 'WORD',
  ADD COLUMN IF NOT EXISTS "referenceText" TEXT,
  ADD COLUMN IF NOT EXISTS "overallScore" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "prosodyScore" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "recognizedText" TEXT,
  ADD COLUMN IF NOT EXISTS "recognizedIpa" TEXT,
  ADD COLUMN IF NOT EXISTS "feedback" TEXT,
  ADD COLUMN IF NOT EXISTS "recordingDurationMs" INTEGER,
  ADD COLUMN IF NOT EXISTS "passed" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "assessment" JSONB;

DROP INDEX IF EXISTS "PronunciationAttempt_childId_idx";
DROP INDEX IF EXISTS "PronunciationAttempt_vocabularyId_idx";

CREATE INDEX IF NOT EXISTS "PronunciationAttempt_childId_createdAt_idx"
  ON "PronunciationAttempt"("childId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "PronunciationAttempt_vocabularyId_createdAt_idx"
  ON "PronunciationAttempt"("vocabularyId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "PronunciationAttempt_provider_idx"
  ON "PronunciationAttempt"("provider");
