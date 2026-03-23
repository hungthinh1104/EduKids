DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CmsContentStatus') THEN
    CREATE TYPE "CmsContentStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');
  END IF;
END $$;

-- Add missing columns to Topic table
ALTER TABLE "Topic" 
  ADD COLUMN IF NOT EXISTS "learningLevel" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "imageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "status" "CmsContentStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- CreateTable TopicQuiz
CREATE TABLE IF NOT EXISTS "TopicQuiz" (
    "id" SERIAL NOT NULL,
    "topicId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "questionText" TEXT NOT NULL,
    "difficultyLevel" INTEGER NOT NULL DEFAULT 3,
    "status" "CmsContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable TopicQuizOption
CREATE TABLE IF NOT EXISTS "TopicQuizOption" (
    "id" SERIAL NOT NULL,
    "quizId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicQuizOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TopicQuiz_topicId_idx" ON "TopicQuiz"("topicId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TopicQuizOption_quizId_idx" ON "TopicQuizOption"("quizId");

-- AddForeignKey
ALTER TABLE "TopicQuiz" ADD CONSTRAINT "TopicQuiz_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicQuizOption" ADD CONSTRAINT "TopicQuizOption_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "TopicQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
