-- CreateEnum (idempotent)
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MediaContext') THEN
		CREATE TYPE "MediaContext" AS ENUM ('VOCABULARY', 'TOPIC', 'QUIZ', 'PROFILE', 'GENERAL');
	END IF;
END $$;

-- CreateEnum (idempotent)
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProcessingStatus') THEN
		CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
	END IF;
END $$;

-- AlterTable (idempotent)
ALTER TABLE "Media"
	ADD COLUMN IF NOT EXISTS "altText" TEXT,
	ADD COLUMN IF NOT EXISTS "cloudinaryPublicId" TEXT,
	ADD COLUMN IF NOT EXISTS "context" "MediaContext" NOT NULL DEFAULT 'GENERAL',
	ADD COLUMN IF NOT EXISTS "description" TEXT,
	ADD COLUMN IF NOT EXISTS "errorMessage" TEXT,
	ADD COLUMN IF NOT EXISTS "fileSize" INTEGER NOT NULL DEFAULT 0,
	ADD COLUMN IF NOT EXISTS "mediaType" "MediaType" NOT NULL DEFAULT 'IMAGE',
	ADD COLUMN IF NOT EXISTS "metadata" JSONB,
	ADD COLUMN IF NOT EXISTS "mimeType" TEXT,
	ADD COLUMN IF NOT EXISTS "optimizedUrl" TEXT,
	ADD COLUMN IF NOT EXISTS "originalFilename" TEXT,
	ADD COLUMN IF NOT EXISTS "processedAt" TIMESTAMP(3),
	ADD COLUMN IF NOT EXISTS "rawUrl" TEXT,
	ADD COLUMN IF NOT EXISTS "status" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
	ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT,
	ADD COLUMN IF NOT EXISTS "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	ADD COLUMN IF NOT EXISTS "uploadedBy" TEXT;

ALTER TABLE "Media"
	ALTER COLUMN "url" DROP NOT NULL;

-- AlterTable (idempotent)
ALTER TABLE "Topic"
	ADD COLUMN IF NOT EXISTS "hasVideo" BOOLEAN NOT NULL DEFAULT false,
	ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;

-- AlterTable (idempotent)
ALTER TABLE "User"
	ADD COLUMN IF NOT EXISTS "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "Media_mediaType_context_idx" ON "Media"("mediaType", "context");

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "Media_status_idx" ON "Media"("status");

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "Media_uploadedBy_idx" ON "Media"("uploadedBy");
