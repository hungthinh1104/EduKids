/*
  Warnings:

  - The primary key for the `AppliedLearningPath` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `userId` on the `AppliedLearningPath` table. All the data in the column will be lost.
  - The `id` column on the `AppliedLearningPath` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Recommendation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `userId` on the `Recommendation` table. All the data in the column will be lost.
  - The `id` column on the `Recommendation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `RecommendationFeedback` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `userId` on the `RecommendationFeedback` table. All the data in the column will be lost.
  - The `id` column on the `RecommendationFeedback` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `childId` to the `AppliedLearningPath` table without a default value. This is not possible if the table is not empty.
  - Added the required column `learningPath` to the `AppliedLearningPath` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recommendationId` to the `AppliedLearningPath` table without a default value. This is not possible if the table is not empty.
  - Added the required column `childId` to the `Recommendation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `childId` to the `RecommendationFeedback` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `recommendationId` on the `RecommendationFeedback` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "AppliedLearningPath" DROP CONSTRAINT "AppliedLearningPath_pkey",
DROP COLUMN "userId",
ADD COLUMN     "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "childId" INTEGER NOT NULL,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "itemsCompleted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "learningPath" JSONB NOT NULL,
ADD COLUMN     "parentNotes" TEXT,
ADD COLUMN     "progressPercentage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalEstimatedMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalItems" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "recommendationId",
ADD COLUMN     "recommendationId" INTEGER NOT NULL,
ADD CONSTRAINT "AppliedLearningPath_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Recommendation" DROP CONSTRAINT "Recommendation_pkey",
DROP COLUMN "userId",
ADD COLUMN     "childId" INTEGER NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "RecommendationFeedback" DROP CONSTRAINT "RecommendationFeedback_pkey",
DROP COLUMN "userId",
ADD COLUMN     "childId" INTEGER NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "recommendationId",
ADD COLUMN     "recommendationId" INTEGER NOT NULL,
ADD CONSTRAINT "RecommendationFeedback_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "AppliedLearningPath_childId_idx" ON "AppliedLearningPath"("childId");

-- CreateIndex
CREATE INDEX "AppliedLearningPath_recommendationId_idx" ON "AppliedLearningPath"("recommendationId");

-- CreateIndex
CREATE INDEX "Recommendation_childId_idx" ON "Recommendation"("childId");

-- CreateIndex
CREATE INDEX "RecommendationFeedback_childId_idx" ON "RecommendationFeedback"("childId");

-- CreateIndex
CREATE INDEX "RecommendationFeedback_recommendationId_idx" ON "RecommendationFeedback"("recommendationId");
