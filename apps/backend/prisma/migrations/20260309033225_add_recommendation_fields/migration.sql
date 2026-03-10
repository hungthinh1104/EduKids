/*
  Warnings:

  - Added the required column `type` to the `Recommendation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Recommendation" ADD COLUMN     "appliedAt" TIMESTAMP(3),
ADD COLUMN     "expectedOutcome" TEXT,
ADD COLUMN     "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "learningPath" JSONB,
ADD COLUMN     "scoreBreakdown" JSONB,
ADD COLUMN     "totalEstimatedMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "viewedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RecommendationFeedback" ADD COLUMN     "rating" INTEGER;

-- CreateIndex
CREATE INDEX "Recommendation_status_idx" ON "Recommendation"("status");

-- CreateIndex
CREATE INDEX "Recommendation_generatedAt_idx" ON "Recommendation"("generatedAt");
