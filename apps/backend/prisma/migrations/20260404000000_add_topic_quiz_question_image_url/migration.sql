-- AlterTable (idempotent)
ALTER TABLE "TopicQuiz"
  ADD COLUMN IF NOT EXISTS "questionImageUrl" TEXT;
