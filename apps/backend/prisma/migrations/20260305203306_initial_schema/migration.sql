-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PARENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'AUDIO', 'VIDEO');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('FLASHCARD', 'QUIZ', 'PRONUNCIATION', 'VIDEO');

-- CreateEnum
CREATE TYPE "SyncEventType" AS ENUM ('UPDATE_APPLIED', 'UPDATE_FAILED', 'SYNC_COMPLETED', 'CONFLICT_RESOLVED');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('SUCCESS', 'CONFLICT', 'FAILED');

-- CreateEnum
CREATE TYPE "ConflictResolution" AS ENUM ('SERVER', 'CLIENT', 'MERGE');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('MOBILE', 'TABLET', 'WEB', 'DESKTOP');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ONLINE', 'OFFLINE', 'IDLE');

-- CreateEnum
CREATE TYPE "OfflineQueueStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED');

-- CreateEnum
CREATE TYPE "AvatarActivityType" AS ENUM ('AVATAR_CHANGED', 'ITEM_EQUIPPED', 'ITEM_REMOVED');

-- CreateEnum
CREATE TYPE "ReviewDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'AUTO_FLAGGED', 'APPROVED', 'REJECTED', 'CONDITIONAL_APPROVE');

-- CreateEnum
CREATE TYPE "SafetyFlagType" AS ENUM ('PROFANITY', 'VIOLENCE', 'EXPLICIT_CONTENT', 'HATE_SPEECH', 'PERSONAL_INFO', 'INAPPROPRIATE_LANGUAGE', 'MISLEADING_CONTENT', 'COPYRIGHT_CONCERN', 'BULLYING', 'EXTERNAL_LINKS', 'UNVERIFIED_CLAIMS', 'QUALITY_ISSUE', 'OTHER');

-- CreateEnum
CREATE TYPE "SafetySeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('APPROVE', 'REJECT', 'CONDITIONAL_APPROVE', 'REQUEST_REVISION');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('VIEW', 'COMPLETE', 'BOOKMARK', 'LIKE');

-- CreateEnum
CREATE TYPE "UserActionType" AS ENUM ('LOGIN', 'LOGOUT', 'VIEW_CONTENT', 'COMPLETE_QUIZ', 'START_LEARNING', 'END_LEARNING');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PARENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildProfile" (
    "id" SERIAL NOT NULL,
    "parentId" INTEGER NOT NULL,
    "nickname" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "avatar" TEXT,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "streakCount" INTEGER NOT NULL DEFAULT 0,
    "lastLearnDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildSettings" (
    "childId" INTEGER NOT NULL,
    "language" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,

    CONSTRAINT "ChildSettings_pkey" PRIMARY KEY ("childId")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vocabulary" (
    "id" SERIAL NOT NULL,
    "topicId" INTEGER NOT NULL,
    "word" TEXT NOT NULL,
    "phonetic" TEXT,
    "translation" TEXT,
    "partOfSpeech" TEXT,
    "exampleSentence" TEXT,
    "difficulty" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabularyMedia" (
    "id" SERIAL NOT NULL,
    "vocabularyId" INTEGER NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "VocabularyMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" SERIAL NOT NULL,
    "vocabularyId" INTEGER NOT NULL,
    "question" TEXT NOT NULL,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizOption" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QuizOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningProgress" (
    "id" SERIAL NOT NULL,
    "childId" INTEGER NOT NULL,
    "vocabularyId" INTEGER NOT NULL,
    "quizScore" INTEGER,
    "pronunciationScore" DOUBLE PRECISION,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "LearningProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabularyReview" (
    "id" SERIAL NOT NULL,
    "childId" INTEGER NOT NULL,
    "vocabularyId" INTEGER NOT NULL,
    "nextReview" TIMESTAMP(3) NOT NULL,
    "interval" INTEGER NOT NULL,
    "easeFactor" DOUBLE PRECISION NOT NULL,
    "reviewCount" INTEGER NOT NULL,

    CONSTRAINT "VocabularyReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewSessionLog" (
    "id" SERIAL NOT NULL,
    "childId" INTEGER NOT NULL,
    "vocabularyId" INTEGER NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "difficulty" "ReviewDifficulty",
    "timeSpentMs" INTEGER,
    "newInterval" INTEGER,
    "newEase" DECIMAL(4,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewSessionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PronunciationAttempt" (
    "id" SERIAL NOT NULL,
    "childId" INTEGER NOT NULL,
    "vocabularyId" INTEGER NOT NULL,
    "accuracyScore" DOUBLE PRECISION,
    "fluencyScore" DOUBLE PRECISION,
    "completenessScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PronunciationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildBadge" (
    "childId" INTEGER NOT NULL,
    "badgeId" INTEGER NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildBadge_pkey" PRIMARY KEY ("childId","badgeId")
);

-- CreateTable
CREATE TABLE "StarTransaction" (
    "id" SERIAL NOT NULL,
    "childId" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StarTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LevelConfig" (
    "level" INTEGER NOT NULL,
    "requiredExp" INTEGER NOT NULL,

    CONSTRAINT "LevelConfig_pkey" PRIMARY KEY ("level")
);

-- CreateTable
CREATE TABLE "AvatarItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "AvatarItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildAvatarItem" (
    "childId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "equippedAt" TIMESTAMP(3),

    CONSTRAINT "ChildAvatarItem_pkey" PRIMARY KEY ("childId","itemId")
);

-- CreateTable
CREATE TABLE "AvatarConfiguration" (
    "id" SERIAL NOT NULL,
    "childId" INTEGER NOT NULL,
    "config" JSONB NOT NULL,
    "previewCache" TEXT,
    "previewCacheGeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvatarConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvatarActivityLog" (
    "id" SERIAL NOT NULL,
    "childId" INTEGER NOT NULL,
    "activityType" "AvatarActivityType" NOT NULL,
    "itemId" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvatarActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" SERIAL NOT NULL,
    "childId" INTEGER NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "topicId" INTEGER,
    "vocabularyId" INTEGER,
    "durationSec" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyProgress" (
    "id" SERIAL NOT NULL,
    "childId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "wordsLearned" INTEGER NOT NULL,
    "pointsEarned" INTEGER NOT NULL,
    "totalTimeSec" INTEGER NOT NULL,

    CONSTRAINT "DailyProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentView" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProgress" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "score" DECIMAL(65,30),
    "timeSpentSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentInteraction" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "interactionType" "InteractionType" NOT NULL,
    "timeSpentSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAction" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "actionType" "UserActionType" NOT NULL,
    "actionData" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentValidation" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "status" "ValidationStatus" NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "hasAutoFlags" BOOLEAN NOT NULL DEFAULT false,
    "safetyScore" INTEGER NOT NULL,
    "recommendations" TEXT NOT NULL DEFAULT '[]',
    "detailedReport" TEXT,
    "validationTimeMs" INTEGER NOT NULL DEFAULT 0,
    "contentType" TEXT,
    "contentTitle" TEXT,
    "validatedBy" TEXT,
    "validatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentValidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyFlag" (
    "id" TEXT NOT NULL,
    "validationId" TEXT NOT NULL,
    "type" "SafetyFlagType" NOT NULL,
    "severity" "SafetySeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "detectedText" TEXT,
    "confidence" DECIMAL(3,2),
    "isAutoDetected" BOOLEAN NOT NULL DEFAULT true,
    "suggestedAction" TEXT,
    "locationInfo" JSONB,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafetyFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentApproval" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "validationId" TEXT,
    "decision" "ApprovalDecision" NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "comments" TEXT,
    "conditionsTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scheduledPublishAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "publishUrl" TEXT,
    "notificationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentRejection" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "validationId" TEXT,
    "reason" TEXT NOT NULL,
    "flaggedIssues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rejectedBy" TEXT NOT NULL,
    "canResubmit" BOOLEAN NOT NULL DEFAULT true,
    "resubmitDeadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentRejection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreviewCache" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "previewUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "watermarkText" TEXT,
    "hasWatermark" BOOLEAN NOT NULL DEFAULT true,
    "cacheKey" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreviewCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationMetric" (
    "id" TEXT NOT NULL,
    "metricDate" DATE NOT NULL,
    "totalValidations" INTEGER NOT NULL DEFAULT 0,
    "approvedCount" INTEGER NOT NULL DEFAULT 0,
    "rejectedCount" INTEGER NOT NULL DEFAULT 0,
    "flaggedCount" INTEGER NOT NULL DEFAULT 0,
    "averageSafetyScore" DECIMAL(5,2),
    "averageValidationTimeMs" INTEGER,
    "mostCommonIssue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidationMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationAuditLog" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "validationId" TEXT,
    "action" TEXT NOT NULL,
    "actorId" INTEGER NOT NULL,
    "actorRole" TEXT,
    "oldStatus" TEXT,
    "newStatus" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidationAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressSyncHistory" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "deviceId" TEXT NOT NULL,
    "eventType" "SyncEventType" NOT NULL,
    "progressType" TEXT,
    "syncTimestamp" BIGINT NOT NULL,
    "clientTimestamp" BIGINT,
    "latencyMs" INTEGER,
    "status" "SyncStatus" NOT NULL DEFAULT 'SUCCESS',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressSyncHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncConflict" (
    "id" TEXT NOT NULL,
    "conflictId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "deviceId1" TEXT NOT NULL,
    "deviceId2" TEXT NOT NULL,
    "conflictType" TEXT NOT NULL,
    "serverValue" TEXT,
    "clientValue" TEXT,
    "serverTimestamp" BIGINT,
    "clientTimestamp" BIGINT,
    "resolution" "ConflictResolution" NOT NULL,
    "resolutionReason" TEXT,
    "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncConflict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceSession" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceName" TEXT,
    "deviceType" "DeviceType",
    "userAgent" TEXT,
    "lastSyncTime" BIGINT,
    "lastHeartbeat" BIGINT,
    "status" "DeviceStatus" NOT NULL DEFAULT 'ONLINE',
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "DeviceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressSnapshot" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "snapshotTimestamp" BIGINT NOT NULL,
    "starPoints" INTEGER,
    "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "totalScore" DECIMAL(65,30),
    "currentStreak" INTEGER,
    "snapshotReason" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfflineSyncQueue" (
    "id" TEXT NOT NULL,
    "queueId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "deviceId" TEXT NOT NULL,
    "updateData" JSONB NOT NULL,
    "status" "OfflineQueueStatus" NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "queuedAt" BIGINT NOT NULL,
    "lastRetryAt" BIGINT,
    "syncedAt" BIGINT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfflineSyncQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersionVector" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "deviceId" TEXT NOT NULL,
    "logicalClock" INTEGER NOT NULL DEFAULT 1,
    "vectorData" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VersionVector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncPerformanceMetric" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "totalSyncs" INTEGER NOT NULL DEFAULT 0,
    "successfulSyncs" INTEGER NOT NULL DEFAULT 0,
    "failedSyncs" INTEGER NOT NULL DEFAULT 0,
    "conflictCount" INTEGER NOT NULL DEFAULT 0,
    "averageLatencyMs" DECIMAL(65,30),
    "maxLatencyMs" INTEGER,
    "minLatencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncPerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "ChildProfile_parentId_idx" ON "ChildProfile"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "ChildProfile_parentId_nickname_key" ON "ChildProfile"("parentId", "nickname");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_name_key" ON "Topic"("name");

-- CreateIndex
CREATE INDEX "Vocabulary_topicId_idx" ON "Vocabulary"("topicId");

-- CreateIndex
CREATE INDEX "VocabularyMedia_vocabularyId_idx" ON "VocabularyMedia"("vocabularyId");

-- CreateIndex
CREATE INDEX "QuizQuestion_vocabularyId_idx" ON "QuizQuestion"("vocabularyId");

-- CreateIndex
CREATE INDEX "QuizOption_questionId_idx" ON "QuizOption"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningProgress_childId_vocabularyId_key" ON "LearningProgress"("childId", "vocabularyId");

-- CreateIndex
CREATE INDEX "VocabularyReview_childId_nextReview_idx" ON "VocabularyReview"("childId", "nextReview");

-- CreateIndex
CREATE INDEX "VocabularyReview_childId_easeFactor_idx" ON "VocabularyReview"("childId", "easeFactor" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "VocabularyReview_childId_vocabularyId_key" ON "VocabularyReview"("childId", "vocabularyId");

-- CreateIndex
CREATE INDEX "ReviewSessionLog_childId_createdAt_idx" ON "ReviewSessionLog"("childId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ReviewSessionLog_correct_idx" ON "ReviewSessionLog"("correct");

-- CreateIndex
CREATE INDEX "PronunciationAttempt_childId_idx" ON "PronunciationAttempt"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_name_key" ON "Badge"("name");

-- CreateIndex
CREATE INDEX "StarTransaction_childId_idx" ON "StarTransaction"("childId");

-- CreateIndex
CREATE INDEX "ChildAvatarItem_childId_idx" ON "ChildAvatarItem"("childId");

-- CreateIndex
CREATE INDEX "ChildAvatarItem_childId_equipped_idx" ON "ChildAvatarItem"("childId", "equipped");

-- CreateIndex
CREATE UNIQUE INDEX "ChildAvatarItem_childId_itemId_key" ON "ChildAvatarItem"("childId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "AvatarConfiguration_childId_key" ON "AvatarConfiguration"("childId");

-- CreateIndex
CREATE INDEX "AvatarConfiguration_childId_idx" ON "AvatarConfiguration"("childId");

-- CreateIndex
CREATE INDEX "AvatarActivityLog_childId_idx" ON "AvatarActivityLog"("childId");

-- CreateIndex
CREATE INDEX "AvatarActivityLog_timestamp_idx" ON "AvatarActivityLog"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "AvatarActivityLog_activityType_idx" ON "AvatarActivityLog"("activityType");

-- CreateIndex
CREATE INDEX "ActivityLog_childId_createdAt_idx" ON "ActivityLog"("childId", "createdAt");

-- CreateIndex
CREATE INDEX "DailyProgress_childId_idx" ON "DailyProgress"("childId");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_metric_idx" ON "AnalyticsSnapshot"("metric");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_date_idx" ON "AnalyticsSnapshot"("date");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_metric_date_idx" ON "AnalyticsSnapshot"("metric", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsSnapshot_metric_date_key" ON "AnalyticsSnapshot"("metric", "date");

-- CreateIndex
CREATE INDEX "ContentView_userId_idx" ON "ContentView"("userId");

-- CreateIndex
CREATE INDEX "ContentView_contentId_contentType_idx" ON "ContentView"("contentId", "contentType");

-- CreateIndex
CREATE INDEX "ContentView_createdAt_idx" ON "ContentView"("createdAt");

-- CreateIndex
CREATE INDEX "ContentView_contentId_contentType_createdAt_idx" ON "ContentView"("contentId", "contentType", "createdAt");

-- CreateIndex
CREATE INDEX "UserProgress_userId_idx" ON "UserProgress"("userId");

-- CreateIndex
CREATE INDEX "UserProgress_contentId_contentType_idx" ON "UserProgress"("contentId", "contentType");

-- CreateIndex
CREATE INDEX "UserProgress_completed_idx" ON "UserProgress"("completed");

-- CreateIndex
CREATE INDEX "UserProgress_createdAt_idx" ON "UserProgress"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserProgress_userId_contentId_contentType_key" ON "UserProgress"("userId", "contentId", "contentType");

-- CreateIndex
CREATE INDEX "ContentInteraction_userId_idx" ON "ContentInteraction"("userId");

-- CreateIndex
CREATE INDEX "ContentInteraction_contentId_contentType_idx" ON "ContentInteraction"("contentId", "contentType");

-- CreateIndex
CREATE INDEX "ContentInteraction_interactionType_idx" ON "ContentInteraction"("interactionType");

-- CreateIndex
CREATE INDEX "ContentInteraction_createdAt_idx" ON "ContentInteraction"("createdAt");

-- CreateIndex
CREATE INDEX "UserAction_userId_idx" ON "UserAction"("userId");

-- CreateIndex
CREATE INDEX "UserAction_actionType_idx" ON "UserAction"("actionType");

-- CreateIndex
CREATE INDEX "UserAction_createdAt_idx" ON "UserAction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");

-- CreateIndex
CREATE INDEX "ContentValidation_contentId_idx" ON "ContentValidation"("contentId");

-- CreateIndex
CREATE INDEX "ContentValidation_status_idx" ON "ContentValidation"("status");

-- CreateIndex
CREATE INDEX "ContentValidation_validatedAt_idx" ON "ContentValidation"("validatedAt" DESC);

-- CreateIndex
CREATE INDEX "ContentValidation_hasAutoFlags_idx" ON "ContentValidation"("hasAutoFlags");

-- CreateIndex
CREATE INDEX "ContentValidation_isApproved_idx" ON "ContentValidation"("isApproved");

-- CreateIndex
CREATE INDEX "ContentValidation_safetyScore_idx" ON "ContentValidation"("safetyScore");

-- CreateIndex
CREATE INDEX "ContentValidation_contentType_idx" ON "ContentValidation"("contentType");

-- CreateIndex
CREATE INDEX "SafetyFlag_validationId_idx" ON "SafetyFlag"("validationId");

-- CreateIndex
CREATE INDEX "SafetyFlag_type_idx" ON "SafetyFlag"("type");

-- CreateIndex
CREATE INDEX "SafetyFlag_severity_idx" ON "SafetyFlag"("severity");

-- CreateIndex
CREATE INDEX "SafetyFlag_isAutoDetected_idx" ON "SafetyFlag"("isAutoDetected");

-- CreateIndex
CREATE UNIQUE INDEX "ContentApproval_validationId_key" ON "ContentApproval"("validationId");

-- CreateIndex
CREATE INDEX "ContentApproval_contentId_idx" ON "ContentApproval"("contentId");

-- CreateIndex
CREATE INDEX "ContentApproval_decision_idx" ON "ContentApproval"("decision");

-- CreateIndex
CREATE INDEX "ContentApproval_approvedBy_idx" ON "ContentApproval"("approvedBy");

-- CreateIndex
CREATE INDEX "ContentApproval_createdAt_idx" ON "ContentApproval"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "ContentApproval_scheduledPublishAt_idx" ON "ContentApproval"("scheduledPublishAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContentRejection_validationId_key" ON "ContentRejection"("validationId");

-- CreateIndex
CREATE INDEX "ContentRejection_contentId_idx" ON "ContentRejection"("contentId");

-- CreateIndex
CREATE INDEX "ContentRejection_rejectedBy_idx" ON "ContentRejection"("rejectedBy");

-- CreateIndex
CREATE INDEX "ContentRejection_createdAt_idx" ON "ContentRejection"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "ContentRejection_canResubmit_idx" ON "ContentRejection"("canResubmit");

-- CreateIndex
CREATE UNIQUE INDEX "PreviewCache_contentId_key" ON "PreviewCache"("contentId");

-- CreateIndex
CREATE INDEX "PreviewCache_contentId_idx" ON "PreviewCache"("contentId");

-- CreateIndex
CREATE INDEX "PreviewCache_expiresAt_idx" ON "PreviewCache"("expiresAt");

-- CreateIndex
CREATE INDEX "PreviewCache_cacheKey_idx" ON "PreviewCache"("cacheKey");

-- CreateIndex
CREATE INDEX "ValidationMetric_metricDate_idx" ON "ValidationMetric"("metricDate" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ValidationMetric_metricDate_key" ON "ValidationMetric"("metricDate");

-- CreateIndex
CREATE INDEX "ValidationAuditLog_contentId_idx" ON "ValidationAuditLog"("contentId");

-- CreateIndex
CREATE INDEX "ValidationAuditLog_validationId_idx" ON "ValidationAuditLog"("validationId");

-- CreateIndex
CREATE INDEX "ValidationAuditLog_action_idx" ON "ValidationAuditLog"("action");

-- CreateIndex
CREATE INDEX "ValidationAuditLog_actorId_idx" ON "ValidationAuditLog"("actorId");

-- CreateIndex
CREATE INDEX "ValidationAuditLog_createdAt_idx" ON "ValidationAuditLog"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "ProgressSyncHistory_userId_idx" ON "ProgressSyncHistory"("userId");

-- CreateIndex
CREATE INDEX "ProgressSyncHistory_deviceId_idx" ON "ProgressSyncHistory"("deviceId");

-- CreateIndex
CREATE INDEX "ProgressSyncHistory_createdAt_idx" ON "ProgressSyncHistory"("createdAt");

-- CreateIndex
CREATE INDEX "ProgressSyncHistory_eventType_idx" ON "ProgressSyncHistory"("eventType");

-- CreateIndex
CREATE INDEX "ProgressSyncHistory_status_idx" ON "ProgressSyncHistory"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SyncConflict_conflictId_key" ON "SyncConflict"("conflictId");

-- CreateIndex
CREATE INDEX "SyncConflict_userId_idx" ON "SyncConflict"("userId");

-- CreateIndex
CREATE INDEX "SyncConflict_conflictId_idx" ON "SyncConflict"("conflictId");

-- CreateIndex
CREATE INDEX "SyncConflict_createdAt_idx" ON "SyncConflict"("createdAt");

-- CreateIndex
CREATE INDEX "SyncConflict_resolution_idx" ON "SyncConflict"("resolution");

-- CreateIndex
CREATE INDEX "DeviceSession_userId_idx" ON "DeviceSession"("userId");

-- CreateIndex
CREATE INDEX "DeviceSession_deviceId_idx" ON "DeviceSession"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceSession_status_idx" ON "DeviceSession"("status");

-- CreateIndex
CREATE INDEX "DeviceSession_expiresAt_idx" ON "DeviceSession"("expiresAt");

-- CreateIndex
CREATE INDEX "DeviceSession_updatedAt_idx" ON "DeviceSession"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceSession_userId_deviceId_key" ON "DeviceSession"("userId", "deviceId");

-- CreateIndex
CREATE INDEX "ProgressSnapshot_userId_idx" ON "ProgressSnapshot"("userId");

-- CreateIndex
CREATE INDEX "ProgressSnapshot_createdAt_idx" ON "ProgressSnapshot"("createdAt");

-- CreateIndex
CREATE INDEX "ProgressSnapshot_snapshotTimestamp_idx" ON "ProgressSnapshot"("snapshotTimestamp");

-- CreateIndex
CREATE UNIQUE INDEX "OfflineSyncQueue_queueId_key" ON "OfflineSyncQueue"("queueId");

-- CreateIndex
CREATE INDEX "OfflineSyncQueue_userId_idx" ON "OfflineSyncQueue"("userId");

-- CreateIndex
CREATE INDEX "OfflineSyncQueue_deviceId_idx" ON "OfflineSyncQueue"("deviceId");

-- CreateIndex
CREATE INDEX "OfflineSyncQueue_status_idx" ON "OfflineSyncQueue"("status");

-- CreateIndex
CREATE INDEX "OfflineSyncQueue_queuedAt_idx" ON "OfflineSyncQueue"("queuedAt");

-- CreateIndex
CREATE INDEX "OfflineSyncQueue_retryCount_idx" ON "OfflineSyncQueue"("retryCount");

-- CreateIndex
CREATE INDEX "VersionVector_userId_idx" ON "VersionVector"("userId");

-- CreateIndex
CREATE INDEX "VersionVector_deviceId_idx" ON "VersionVector"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "VersionVector_userId_deviceId_key" ON "VersionVector"("userId", "deviceId");

-- CreateIndex
CREATE INDEX "SyncPerformanceMetric_userId_idx" ON "SyncPerformanceMetric"("userId");

-- CreateIndex
CREATE INDEX "SyncPerformanceMetric_date_idx" ON "SyncPerformanceMetric"("date");

-- CreateIndex
CREATE UNIQUE INDEX "SyncPerformanceMetric_userId_date_key" ON "SyncPerformanceMetric"("userId", "date");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildProfile" ADD CONSTRAINT "ChildProfile_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildSettings" ADD CONSTRAINT "ChildSettings_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vocabulary" ADD CONSTRAINT "Vocabulary_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyMedia" ADD CONSTRAINT "VocabularyMedia_vocabularyId_fkey" FOREIGN KEY ("vocabularyId") REFERENCES "Vocabulary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_vocabularyId_fkey" FOREIGN KEY ("vocabularyId") REFERENCES "Vocabulary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizOption" ADD CONSTRAINT "QuizOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningProgress" ADD CONSTRAINT "LearningProgress_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningProgress" ADD CONSTRAINT "LearningProgress_vocabularyId_fkey" FOREIGN KEY ("vocabularyId") REFERENCES "Vocabulary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyReview" ADD CONSTRAINT "VocabularyReview_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyReview" ADD CONSTRAINT "VocabularyReview_vocabularyId_fkey" FOREIGN KEY ("vocabularyId") REFERENCES "Vocabulary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSessionLog" ADD CONSTRAINT "ReviewSessionLog_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSessionLog" ADD CONSTRAINT "ReviewSessionLog_vocabularyId_fkey" FOREIGN KEY ("vocabularyId") REFERENCES "Vocabulary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PronunciationAttempt" ADD CONSTRAINT "PronunciationAttempt_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PronunciationAttempt" ADD CONSTRAINT "PronunciationAttempt_vocabularyId_fkey" FOREIGN KEY ("vocabularyId") REFERENCES "Vocabulary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildBadge" ADD CONSTRAINT "ChildBadge_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildBadge" ADD CONSTRAINT "ChildBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StarTransaction" ADD CONSTRAINT "StarTransaction_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildAvatarItem" ADD CONSTRAINT "ChildAvatarItem_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildAvatarItem" ADD CONSTRAINT "ChildAvatarItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "AvatarItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvatarConfiguration" ADD CONSTRAINT "AvatarConfiguration_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvatarActivityLog" ADD CONSTRAINT "AvatarActivityLog_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyProgress" ADD CONSTRAINT "DailyProgress_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentView" ADD CONSTRAINT "ContentView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentInteraction" ADD CONSTRAINT "ContentInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAction" ADD CONSTRAINT "UserAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyFlag" ADD CONSTRAINT "SafetyFlag_validationId_fkey" FOREIGN KEY ("validationId") REFERENCES "ContentValidation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentApproval" ADD CONSTRAINT "ContentApproval_validationId_fkey" FOREIGN KEY ("validationId") REFERENCES "ContentValidation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRejection" ADD CONSTRAINT "ContentRejection_validationId_fkey" FOREIGN KEY ("validationId") REFERENCES "ContentValidation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationAuditLog" ADD CONSTRAINT "ValidationAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationAuditLog" ADD CONSTRAINT "ValidationAuditLog_validationId_fkey" FOREIGN KEY ("validationId") REFERENCES "ContentValidation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressSyncHistory" ADD CONSTRAINT "ProgressSyncHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncConflict" ADD CONSTRAINT "SyncConflict_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceSession" ADD CONSTRAINT "DeviceSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressSnapshot" ADD CONSTRAINT "ProgressSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfflineSyncQueue" ADD CONSTRAINT "OfflineSyncQueue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionVector" ADD CONSTRAINT "VersionVector_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncPerformanceMetric" ADD CONSTRAINT "SyncPerformanceMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
