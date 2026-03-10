/*
  Warnings:

  - The primary key for the `ChildBadge` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `ChildSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContentInteraction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DeviceSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LevelConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OfflineSyncQueue` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PreviewCache` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProgressSnapshot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProgressSyncHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SyncConflict` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SyncPerformanceMetric` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SystemConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserAction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ValidationMetric` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VersionVector` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[childId,badgeId]` on the table `ChildBadge` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[childId,date]` on the table `DailyProgress` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `AvatarItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Badge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ChildBadge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `DailyProgress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `LearningProgress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PronunciationAttempt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `QuizOption` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `QuizQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `StarTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Topic` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Vocabulary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `VocabularyReview` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ChildSettings" DROP CONSTRAINT "ChildSettings_childId_fkey";

-- DropForeignKey
ALTER TABLE "ContentInteraction" DROP CONSTRAINT "ContentInteraction_userId_fkey";

-- DropForeignKey
ALTER TABLE "DeviceSession" DROP CONSTRAINT "DeviceSession_userId_fkey";

-- DropForeignKey
ALTER TABLE "OfflineSyncQueue" DROP CONSTRAINT "OfflineSyncQueue_userId_fkey";

-- DropForeignKey
ALTER TABLE "ProgressSnapshot" DROP CONSTRAINT "ProgressSnapshot_userId_fkey";

-- DropForeignKey
ALTER TABLE "ProgressSyncHistory" DROP CONSTRAINT "ProgressSyncHistory_userId_fkey";

-- DropForeignKey
ALTER TABLE "SyncConflict" DROP CONSTRAINT "SyncConflict_userId_fkey";

-- DropForeignKey
ALTER TABLE "SyncPerformanceMetric" DROP CONSTRAINT "SyncPerformanceMetric_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserAction" DROP CONSTRAINT "UserAction_userId_fkey";

-- DropForeignKey
ALTER TABLE "VersionVector" DROP CONSTRAINT "VersionVector_userId_fkey";

-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN     "contentId" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "pointsEarned" INTEGER,
ADD COLUMN     "score" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "changes" JSONB,
ADD COLUMN     "details" TEXT;

-- AlterTable
ALTER TABLE "AvatarItem" ADD COLUMN     "category" TEXT DEFAULT 'AVATAR',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "rarity" TEXT DEFAULT 'COMMON',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Badge" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ChildBadge" DROP CONSTRAINT "ChildBadge_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "ChildBadge_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ChildProfile" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "userId" INTEGER,
ALTER COLUMN "parentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "DailyProgress" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "LearningProgress" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastReviewedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "PronunciationAttempt" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "QuizOption" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "QuizQuestion" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "token" TEXT;

-- AlterTable
ALTER TABLE "StarTransaction" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Topic" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password",
ADD COLUMN     "activeChildId" INTEGER,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "passwordHash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Vocabulary" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "VocabularyReview" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "ChildSettings";

-- DropTable
DROP TABLE "ContentInteraction";

-- DropTable
DROP TABLE "DeviceSession";

-- DropTable
DROP TABLE "LevelConfig";

-- DropTable
DROP TABLE "OfflineSyncQueue";

-- DropTable
DROP TABLE "PreviewCache";

-- DropTable
DROP TABLE "ProgressSnapshot";

-- DropTable
DROP TABLE "ProgressSyncHistory";

-- DropTable
DROP TABLE "SyncConflict";

-- DropTable
DROP TABLE "SyncPerformanceMetric";

-- DropTable
DROP TABLE "SystemConfig";

-- DropTable
DROP TABLE "UserAction";

-- DropTable
DROP TABLE "ValidationMetric";

-- DropTable
DROP TABLE "VersionVector";

-- CreateTable
CREATE TABLE "Purchase" (
    "id" SERIAL NOT NULL,
    "childId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "category" TEXT DEFAULT 'GENERAL',
    "imageUrl" TEXT,
    "rarity" TEXT DEFAULT 'COMMON',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "stock" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppliedLearningPath" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "recommendationId" TEXT,
    "status" TEXT DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppliedLearningPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationFeedback" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "isHelpful" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportPreference" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "frequency" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressReport" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "content" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Purchase_childId_idx" ON "Purchase"("childId");

-- CreateIndex
CREATE INDEX "Purchase_itemId_idx" ON "Purchase"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_childId_itemId_key" ON "Purchase"("childId", "itemId");

-- CreateIndex
CREATE INDEX "ShopItem_category_idx" ON "ShopItem"("category");

-- CreateIndex
CREATE INDEX "ShopItem_price_idx" ON "ShopItem"("price");

-- CreateIndex
CREATE INDEX "ShopItem_isActive_idx" ON "ShopItem"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ReportPreference_userId_key" ON "ReportPreference"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_activityType_createdAt_idx" ON "ActivityLog"("activityType", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_topicId_idx" ON "ActivityLog"("topicId");

-- CreateIndex
CREATE INDEX "ActivityLog_vocabularyId_idx" ON "ActivityLog"("vocabularyId");

-- CreateIndex
CREATE INDEX "AvatarItem_category_idx" ON "AvatarItem"("category");

-- CreateIndex
CREATE INDEX "AvatarItem_price_idx" ON "AvatarItem"("price");

-- CreateIndex
CREATE INDEX "ChildBadge_childId_earnedAt_idx" ON "ChildBadge"("childId", "earnedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChildBadge_childId_badgeId_key" ON "ChildBadge"("childId", "badgeId");

-- CreateIndex
CREATE INDEX "DailyProgress_date_idx" ON "DailyProgress"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyProgress_childId_date_key" ON "DailyProgress"("childId", "date");

-- CreateIndex
CREATE INDEX "LearningProgress_childId_lastReviewedAt_idx" ON "LearningProgress"("childId", "lastReviewedAt");

-- CreateIndex
CREATE INDEX "PronunciationAttempt_vocabularyId_idx" ON "PronunciationAttempt"("vocabularyId");

-- CreateIndex
CREATE INDEX "StarTransaction_childId_date_idx" ON "StarTransaction"("childId", "date");

-- CreateIndex
CREATE INDEX "User_activeChildId_idx" ON "User"("activeChildId");

-- CreateIndex
CREATE INDEX "VocabularyMedia_type_idx" ON "VocabularyMedia"("type");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activeChildId_fkey" FOREIGN KEY ("activeChildId") REFERENCES "ChildProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
