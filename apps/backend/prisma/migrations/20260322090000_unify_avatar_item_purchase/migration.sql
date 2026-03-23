-- Normalize shop ownership around AvatarItem and remove legacy ShopItem table.
-- Safe cleanup first: drop orphan purchases that no longer point to an AvatarItem.
DELETE FROM "Purchase" p
WHERE NOT EXISTS (
  SELECT 1
  FROM "AvatarItem" a
  WHERE a."id" = p."itemId"
);

-- Add the missing foreign key so Purchase.itemId is enforced against AvatarItem.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Purchase_itemId_fkey'
  ) THEN
    ALTER TABLE "Purchase"
      ADD CONSTRAINT "Purchase_itemId_fkey"
      FOREIGN KEY ("itemId") REFERENCES "AvatarItem"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

DROP TABLE IF EXISTS "ShopItem";
