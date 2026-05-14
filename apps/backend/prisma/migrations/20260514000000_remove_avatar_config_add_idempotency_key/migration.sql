-- Drop unused avatar customization tables (AvatarCustomizationModule removed)
DROP TABLE IF EXISTS "AvatarActivityLog";
DROP TABLE IF EXISTS "AvatarConfiguration";

-- Drop unused enum
DROP TYPE IF EXISTS "AvatarActivityType";

-- Add idempotency key to StarTransaction for quiz reward deduplication
ALTER TABLE "StarTransaction" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "StarTransaction_idempotencyKey_key" ON "StarTransaction"("idempotencyKey") WHERE "idempotencyKey" IS NOT NULL;
