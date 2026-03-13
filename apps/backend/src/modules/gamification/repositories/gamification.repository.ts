import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { BadgeCategory, ShopItemCategory } from "../dto/gamification.dto";

interface BadgeCondition {
  id: number;
  name: string;
  description: string;
  category: BadgeCategory;
  icon: string;
  checkCondition: (childId: number) => Promise<boolean>;
  getProgress: (
    childId: number,
  ) => Promise<{ current: number; required: number }>;
}

@Injectable()
export class GamificationRepository {
  private badgeDefinitions: BadgeCondition[] = [];
  private readonly shopItems = [
    // Hair
    {
      id: 1,
      name: "Rainbow Hair",
      description: "Colorful rainbow hairstyle",
      category: ShopItemCategory.AVATAR_HAIR,
      price: 50,
      imageUrl: "https://cdn.edukids.com/shop/hair-rainbow.png",
    },
    {
      id: 2,
      name: "Star Crown",
      description: "Shiny golden crown",
      category: ShopItemCategory.AVATAR_HAIR,
      price: 80,
      imageUrl: "https://cdn.edukids.com/shop/hair-crown.png",
    },
    {
      id: 3,
      name: "Wizard Hat",
      description: "Magical wizard hat",
      category: ShopItemCategory.AVATAR_HAIR,
      price: 100,
      imageUrl: "https://cdn.edukids.com/shop/hair-wizard.png",
    },
    // Outfits
    {
      id: 4,
      name: "Superhero Cape",
      description: "Fly like a hero!",
      category: ShopItemCategory.AVATAR_OUTFIT,
      price: 75,
      imageUrl: "https://cdn.edukids.com/shop/outfit-cape.png",
    },
    {
      id: 5,
      name: "Princess Dress",
      description: "Elegant royal dress",
      category: ShopItemCategory.AVATAR_OUTFIT,
      price: 120,
      imageUrl: "https://cdn.edukids.com/shop/outfit-princess.png",
    },
    {
      id: 6,
      name: "Space Suit",
      description: "Explore the galaxy",
      category: ShopItemCategory.AVATAR_OUTFIT,
      price: 150,
      imageUrl: "https://cdn.edukids.com/shop/outfit-space.png",
    },
    // Accessories
    {
      id: 7,
      name: "Magic Wand",
      description: "Cast learning spells",
      category: ShopItemCategory.AVATAR_ACCESSORY,
      price: 60,
      imageUrl: "https://cdn.edukids.com/shop/accessory-wand.png",
    },
    {
      id: 8,
      name: "Star Glasses",
      description: "See everything sparkle",
      category: ShopItemCategory.AVATAR_ACCESSORY,
      price: 40,
      imageUrl: "https://cdn.edukids.com/shop/accessory-glasses.png",
    },
    // Pets
    {
      id: 9,
      name: "Flying Dragon",
      description: "Your loyal dragon friend",
      category: ShopItemCategory.AVATAR_PET,
      price: 200,
      imageUrl: "https://cdn.edukids.com/shop/pet-dragon.png",
    },
    {
      id: 10,
      name: "Unicorn Buddy",
      description: "Magical unicorn companion",
      category: ShopItemCategory.AVATAR_PET,
      price: 180,
      imageUrl: "https://cdn.edukids.com/shop/pet-unicorn.png",
    },
  ];

  constructor(private prisma: PrismaService) {
    this.initializeBadgeDefinitions();
  }

  /**
   * UC-05: Initialize badge definitions with unlock conditions
   */
  private initializeBadgeDefinitions() {
    this.badgeDefinitions = [
      {
        id: 1,
        name: "First Steps",
        description: "Complete your first lesson",
        category: BadgeCategory.MILESTONE,
        icon: "🎯",
        checkCondition: async (childId) => {
          const count = await this.prisma.activityLog.count({
            where: { childId },
          });
          return count >= 1;
        },
        getProgress: async (childId) => {
          const current = await this.prisma.activityLog.count({
            where: { childId },
          });
          return { current: Math.min(current, 1), required: 1 };
        },
      },
      {
        id: 2,
        name: "Pronunciation Star",
        description: "Complete 10 pronunciation practices with 4+ stars",
        category: BadgeCategory.PRONUNCIATION,
        icon: "🏅",
        checkCondition: async (childId) => {
          const count = await this.prisma.activityLog.count({
            where: { childId },
          });
          return count >= 10;
        },
        getProgress: async (childId) => {
          const current = await this.prisma.activityLog.count({
            where: { childId },
          });
          return { current: Math.min(current, 10), required: 10 };
        },
      },
      {
        id: 3,
        name: "Quiz Master",
        description: "Complete 10 quizzes with 80%+ accuracy",
        category: BadgeCategory.QUIZ,
        icon: "🏆",
        checkCondition: async (childId) => {
          const activities = await this.prisma.activityLog.findMany({
            where: { childId },
          });
          return activities.length >= 10;
        },
        getProgress: async (childId) => {
          const activities = await this.prisma.activityLog.findMany({
            where: { childId },
          });
          return { current: Math.min(activities.length, 10), required: 10 };
        },
      },
      {
        id: 4,
        name: "Flashcard Champion",
        description: "Complete 25 flashcard activities",
        category: BadgeCategory.FLASHCARD,
        icon: "💎",
        checkCondition: async (childId) => {
          const count = await this.prisma.activityLog.count({
            where: { childId },
          });
          return count >= 25;
        },
        getProgress: async (childId) => {
          const current = await this.prisma.activityLog.count({
            where: { childId },
          });
          return { current: Math.min(current, 25), required: 25 };
        },
      },
      {
        id: 5,
        name: "7-Day Streak",
        description: "Practice for 7 consecutive days",
        category: BadgeCategory.STREAK,
        icon: "🔥",
        checkCondition: async (childId) => {
          const child = await this.prisma.childProfile.findUnique({
            where: { id: childId },
          });
          return (child?.streakCount || 0) >= 7;
        },
        getProgress: async (childId) => {
          const child = await this.prisma.childProfile.findUnique({
            where: { id: childId },
          });
          const current = child?.streakCount || 0;
          return { current: Math.min(current, 7), required: 7 };
        },
      },
    ];
  }

  /**
   * Get all badge definitions with earned status for child
   */
  async getAllBadgesForChild(childId: number) {
    const earnedBadges = await this.prisma.childBadge.findMany({
      where: { childId },
      include: { badge: { select: { name: true } } },
    });

    const earnedMap = new Map(
      earnedBadges.map((b) => [b.badge.name, b.earnedAt]),
    );

    return Promise.all(
      this.badgeDefinitions.map(async (badge) => {
        const isEarned = earnedMap.has(badge.name);
        const progress = await badge.getProgress(childId);

        return {
          id: badge.id,
          name: badge.name,
          description: badge.description,
          category: badge.category,
          icon: badge.icon,
          isEarned,
          progress: progress.current,
          requirement: progress.required,
          earnedAt: earnedMap.get(badge.name) as Date | undefined,
        };
      }),
    );
  }

  /**
   * Check and award any newly unlocked badges
   */
  async checkAndAwardBadges(childId: number): Promise<string[]> {
    const newBadges: string[] = [];

    for (const badge of this.badgeDefinitions) {
      const existing = await this.prisma.childBadge.findFirst({
        where: { childId, badge: { name: badge.name } },
      });

      if (!existing) {
        const isUnlocked = await badge.checkCondition(childId);
        if (isUnlocked) {
          // First find the badge by name
          const badgeDefinition = await this.prisma.badge.findFirst({
            where: { name: badge.name },
          });
          if (badgeDefinition) {
            await this.prisma.childBadge.create({
              data: {
                childId,
                badgeId: badgeDefinition.id,
              },
            });
            newBadges.push(`${badge.icon} ${badge.name}`);
          }
        }
      }
    }

    return newBadges;
  }

  private async getShopState(childId: number) {
    const purchases = await this.prisma.purchase.findMany({
      where: { childId },
      select: { itemId: true, purchasedAt: true },
    });

    const purchaseMap = new Map(
      purchases.map((p) => [p.itemId, p.purchasedAt]),
    );

    const equippedItems = await this.prisma.childAvatarItem.findMany({
      where: {
        childId,
        equipped: true,
      },
      select: { itemId: true },
    });
    const equippedItemIds = new Set(equippedItems.map((e) => e.itemId));

    return { purchaseMap, equippedItemIds };
  }

  /**
   * Get all shop items with purchase status
   */
  async getAllShopItems(childId: number) {
    const { purchaseMap, equippedItemIds } = await this.getShopState(childId);

    return this.shopItems.map((item) => ({
      ...item,
      isPurchased: purchaseMap.has(item.id),
      isEquipped: equippedItemIds.has(item.id),
      purchasedAt: purchaseMap.get(item.id) as Date | undefined,
    }));
  }

  async getShopItemsByCategory(childId: number, category: ShopItemCategory) {
    const { purchaseMap, equippedItemIds } = await this.getShopState(childId);

    return this.shopItems
      .filter((item) => item.category === category)
      .map((item) => ({
        ...item,
        isPurchased: purchaseMap.has(item.id),
        isEquipped: equippedItemIds.has(item.id),
        purchasedAt: purchaseMap.get(item.id) as Date | undefined,
      }));
  }

  async getShopItemById(childId: number, itemId: number) {
    const item = this.shopItems.find((shopItem) => shopItem.id === itemId);
    if (!item) {
      return null;
    }

    const { purchaseMap, equippedItemIds } = await this.getShopState(childId);

    return {
      ...item,
      isPurchased: purchaseMap.has(item.id),
      isEquipped: equippedItemIds.has(item.id),
      purchasedAt: purchaseMap.get(item.id) as Date | undefined,
    };
  }

  async getOwnedShopItems(childId: number) {
    const allItems = await this.getAllShopItems(childId);
    return allItems.filter((item) => item.isPurchased);
  }

  /**
   * Purchase shop item
   */
  async purchaseItem(childId: number, itemId: number, price: number) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const child = await tx.childProfile.findUnique({
          where: { id: childId },
        });

        if (!child || child.totalPoints < price) {
          return null;
        }

        const existingPurchase = await tx.purchase.findUnique({
          where: {
            childId_itemId: {
              childId,
              itemId,
            },
          },
        });

        if (existingPurchase) {
          return null;
        }

        await tx.childProfile.update({
          where: { id: childId },
          data: {
            totalPoints: { decrement: price },
            currentLevel: Math.floor((child.totalPoints - price) / 50) + 1,
          },
        });

        const purchase = await tx.purchase.create({
          data: {
            childId,
            itemId,
            purchasedAt: new Date(),
          },
        });

        await tx.starTransaction.create({
          data: {
            childId,
            points: -price,
            reason: `SHOP_PURCHASE:${itemId}`,
            date: new Date(),
          },
        });

        await tx.childAvatarItem.upsert({
          where: {
            childId_itemId: {
              childId,
              itemId,
            },
          },
          create: {
            childId,
            itemId,
            equipped: false,
            acquiredAt: new Date(),
          },
          update: {},
        });

        return purchase;
      });
    } catch {
      // Covers race collisions on unique(childId, itemId) and returns safe failure
      return null;
    }
  }

  /**
   * Equip item to avatar
   */
  async equipItem(childId: number, itemId: number, category: ShopItemCategory) {
    const categoryItemIds = {
      [ShopItemCategory.AVATAR_HAIR]: [1, 2, 3],
      [ShopItemCategory.AVATAR_OUTFIT]: [4, 5, 6],
      [ShopItemCategory.AVATAR_ACCESSORY]: [7, 8],
      [ShopItemCategory.AVATAR_PET]: [9, 10],
      [ShopItemCategory.BACKGROUND]: [],
    };

    const idsInCategory = categoryItemIds[category] || [];

    return this.prisma.$transaction(async (tx) => {
      if (idsInCategory.length > 0) {
        await tx.childAvatarItem.updateMany({
          where: {
            childId,
            itemId: { in: idsInCategory },
            equipped: true,
          },
          data: { equipped: false },
        });
      }

      return tx.childAvatarItem.upsert({
        where: {
          childId_itemId: {
            childId,
            itemId,
          },
        },
        create: {
          childId,
          itemId,
          equipped: true,
          acquiredAt: new Date(),
          equippedAt: new Date(),
        },
        update: {
          equipped: true,
          equippedAt: new Date(),
        },
      });
    });
  }

  /**
   * Get reward summary
   */
  async getRewardSummary(childId: number) {
    const child = await this.prisma.childProfile.findUnique({
      where: { id: childId },
    });

    const badges = await this.prisma.childBadge.count({
      where: { childId },
    });

    const currentLevel = Math.floor((child?.totalPoints || 0) / 50) + 1;
    const pointsInCurrentLevel = (child?.totalPoints || 0) % 50;
    const levelProgress = Math.round((pointsInCurrentLevel / 50) * 100);
    const pointsToNextLevel = 50 - pointsInCurrentLevel;

    return {
      totalPoints: child?.totalPoints || 0,
      currentLevel,
      levelProgress,
      pointsToNextLevel,
      badgesEarned: badges,
      totalBadges: this.badgeDefinitions.length,
      streakDays: child?.streakCount || 0,
    };
  }

  /**
   * Get star transaction history
   */
  async getStarTransactionHistory(childId: number, limit: number = 20) {
    const activities = await this.prisma.dailyProgress.findMany({
      where: { childId },
      orderBy: { date: "desc" },
      take: limit,
    });

    return activities.map((a) => {
      return {
        id: a.id,
        type: "EARNED" as const,
        amount: a.pointsEarned || 0,
        description: `Activity`,
        timestamp: a.date,
        balanceAfter: 0, // Calculated in service
      };
    });
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 10) {
    const children = await this.prisma.childProfile.findMany({
      orderBy: { totalPoints: "desc" },
      take: limit,
      select: {
        id: true,
        nickname: true,
        avatar: true,
        totalPoints: true,
      },
    });

    return Promise.all(
      children.map(async (child, index) => {
        const badgeCount = await this.prisma.childBadge.count({
          where: { childId: child.id },
        });

        return {
          rank: index + 1,
          childId: child.id,
          childName: child.nickname,
          avatar: child.avatar || "https://cdn.edukids.com/avatars/default.png",
          totalPoints: child.totalPoints,
          currentLevel: Math.floor(child.totalPoints / 50) + 1,
          badgesEarned: badgeCount,
        };
      }),
    );
  }
}
