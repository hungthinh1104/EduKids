-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PREMIUM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "plan" "PlanTier" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Subscription_userId_idx" ON "Subscription"("userId");

-- AddForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT IF EXISTS "Subscription_userId_fkey";
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
