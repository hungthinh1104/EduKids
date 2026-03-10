import { ApiProperty } from "@nestjs/swagger";
import { IsInt } from "class-validator";

export enum BadgeCategory {
  PRONUNCIATION = "PRONUNCIATION",
  QUIZ = "QUIZ",
  FLASHCARD = "FLASHCARD",
  STREAK = "STREAK",
  MILESTONE = "MILESTONE",
}

export enum ShopItemCategory {
  AVATAR_HAIR = "AVATAR_HAIR",
  AVATAR_OUTFIT = "AVATAR_OUTFIT",
  AVATAR_ACCESSORY = "AVATAR_ACCESSORY",
  AVATAR_PET = "AVATAR_PET",
  BACKGROUND = "BACKGROUND",
}

export class BadgeDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "Pronunciation Master" })
  name: string;

  @ApiProperty({ example: "Complete 10 pronunciation practices with 4+ stars" })
  description: string;

  @ApiProperty({
    enum: BadgeCategory,
    example: BadgeCategory.PRONUNCIATION,
  })
  category: BadgeCategory;

  @ApiProperty({ example: "🏅" })
  icon: string;

  @ApiProperty({
    example: true,
    description: "Whether child has earned this badge",
  })
  isEarned: boolean;

  @ApiProperty({
    example: 7,
    description: "Current progress toward badge",
    required: false,
  })
  progress?: number;

  @ApiProperty({
    example: 10,
    description: "Total required for badge",
    required: false,
  })
  requirement?: number;

  @ApiProperty({ example: "2024-03-05T10:30:00Z", required: false })
  earnedAt?: Date;
}

export class ShopItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "Rainbow Hair" })
  name: string;

  @ApiProperty({ example: "Colorful rainbow hairstyle" })
  description: string;

  @ApiProperty({
    enum: ShopItemCategory,
    example: ShopItemCategory.AVATAR_HAIR,
  })
  category: ShopItemCategory;

  @ApiProperty({ example: 50, description: "Price in star points" })
  price: number;

  @ApiProperty({ example: "https://cdn.edukids.com/shop/rainbow-hair.png" })
  imageUrl: string;

  @ApiProperty({ example: true, description: "Whether child owns this item" })
  isPurchased: boolean;

  @ApiProperty({ example: false, description: "Whether currently equipped" })
  isEquipped: boolean;

  @ApiProperty({ example: "2024-03-05T10:30:00Z", required: false })
  purchasedAt?: Date;
}

export class PurchaseItemDto {
  @ApiProperty({
    example: 1,
    description: "Shop item ID to purchase",
  })
  @IsInt()
  itemId: number;
}

export class EquipItemDto {
  @ApiProperty({
    example: 1,
    description: "Shop item ID to equip",
  })
  @IsInt()
  itemId: number;
}

export class PurchaseResultDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "Successfully purchased Rainbow Hair!" })
  message: string;

  @ApiProperty({ example: 1 })
  itemId: number;

  @ApiProperty({ example: "Rainbow Hair" })
  itemName: string;

  @ApiProperty({ example: 50 })
  itemPrice: number;

  @ApiProperty({ example: 370, description: "Remaining points after purchase" })
  remainingPoints: number;

  @ApiProperty({ example: 7, description: "Current level" })
  currentLevel: number;
}

export class RewardSummaryDto {
  @ApiProperty({ example: 420 })
  totalPoints: number;

  @ApiProperty({ example: 8 })
  currentLevel: number;

  @ApiProperty({ example: 80, description: "Progress to next level (%)" })
  levelProgress: number;

  @ApiProperty({ example: 30, description: "Points needed for next level" })
  pointsToNextLevel: number;

  @ApiProperty({ example: 5, description: "Total badges earned" })
  badgesEarned: number;

  @ApiProperty({ example: 15, description: "Total available badges" })
  totalBadges: number;

  @ApiProperty({ example: 3, description: "Current streak days" })
  streakDays: number;

  @ApiProperty({
    type: [BadgeDto],
    description: "Recently unlocked badges (last 3)",
  })
  recentBadges: BadgeDto[];
}

export class AvatarCustomizationDto {
  @ApiProperty({ example: 1 })
  childId: number;

  @ApiProperty({ example: "Alice" })
  childName: string;

  @ApiProperty({ example: "https://cdn.edukids.com/avatars/child-1.png" })
  avatar: string;

  @ApiProperty({ example: 5, required: false })
  equippedHairId?: number;

  @ApiProperty({ example: "Rainbow Hair", required: false })
  equippedHairName?: string;

  @ApiProperty({ example: 3, required: false })
  equippedOutfitId?: number;

  @ApiProperty({ example: "Superhero Costume", required: false })
  equippedOutfitName?: string;

  @ApiProperty({ example: 8, required: false })
  equippedAccessoryId?: number;

  @ApiProperty({ example: "Star Crown", required: false })
  equippedAccessoryName?: string;

  @ApiProperty({ example: 2, required: false })
  equippedPetId?: number;

  @ApiProperty({ example: "Flying Dragon", required: false })
  equippedPetName?: string;

  @ApiProperty({
    type: [ShopItemDto],
    description: "All purchased items",
  })
  ownedItems: ShopItemDto[];
}

export class StarTransactionDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "EARNED", enum: ["EARNED", "SPENT"] })
  type: "EARNED" | "SPENT";

  @ApiProperty({ example: 15 })
  amount: number;

  @ApiProperty({ example: "Quiz completion - Animals topic" })
  description: string;

  @ApiProperty({ example: "2024-03-05T10:30:00Z" })
  timestamp: Date;

  @ApiProperty({ example: 420 })
  balanceAfter: number;
}

export class LeaderboardEntryDto {
  @ApiProperty({ example: 1 })
  rank: number;

  @ApiProperty({ example: 1 })
  childId: number;

  @ApiProperty({ example: "Alice" })
  childName: string;

  @ApiProperty({ example: "https://cdn.edukids.com/avatars/child-1.png" })
  avatar: string;

  @ApiProperty({ example: 850 })
  totalPoints: number;

  @ApiProperty({ example: 17 })
  currentLevel: number;

  @ApiProperty({ example: 12 })
  badgesEarned: number;

  @ApiProperty({ example: true, description: "Whether this is current child" })
  isCurrentUser: boolean;
}
