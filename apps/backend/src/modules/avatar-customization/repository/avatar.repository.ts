import { Injectable } from "@nestjs/common";
import { AvatarActivityType, Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { AvatarLayer } from "../dto/avatar-customization.dto";

@Injectable()
export class AvatarRepository {
  constructor(private prisma: PrismaService) {}

  private toInputJsonValue(value: unknown): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
  }

  /**
   * Create avatar item for child
   */
  async createChildAvatarItem(
    childId: number,
    itemId: number,
    equipped: boolean = false,
  ) {
    return this.prisma.childAvatarItem.create({
      data: {
        childId,
        itemId,
        equipped,
      },
      include: {
        item: true,
      },
    });
  }

  /**
   * Get all avatar items owned by child
   */
  async getChildAvatarItems(childId: number) {
    return this.prisma.childAvatarItem.findMany({
      where: { childId },
      include: {
        item: true,
      },
      orderBy: { itemId: "asc" },
    });
  }

  /**
   * Check if child owns specific item
   */
  async hasItem(childId: number, itemId: number) {
    const item = await this.prisma.childAvatarItem.findFirst({
      where: {
        childId,
        itemId,
      },
    });
    return !!item;
  }

  /**
   * Update avatar configuration for child
   */
  async updateAvatarConfig(childId: number, config: unknown) {
    return this.prisma.avatarConfiguration.upsert({
      where: { childId },
      update: {
        config: this.toInputJsonValue(config),
        updatedAt: new Date(),
      },
      create: {
        childId,
        config: this.toInputJsonValue(config),
      },
    });
  }

  /**
   * Get current avatar configuration
   */
  async getAvatarConfig(childId: number) {
    return this.prisma.avatarConfiguration.findUnique({
      where: { childId },
    });
  }

  /**
   * Update equipment status for item
   */
  async setItemEquipped(childId: number, itemId: number, equipped: boolean) {
    return this.prisma.childAvatarItem.updateMany({
      where: {
        childId,
        itemId,
      },
      data: { equipped },
    });
  }

  /**
   * Get equipped items for child
   */
  async getEquippedItems(childId: number) {
    return this.prisma.childAvatarItem.findMany({
      where: {
        childId,
        equipped: true,
      },
      include: {
        item: true,
      },
    });
  }

  /**
   * Log avatar activity for analytics
   */
  async logAvatarActivity(
    childId: number,
    activityType: "avatar_changed" | "item_equipped" | "item_removed",
    itemId?: number,
  ) {
    const mappedActivityType =
      activityType === "avatar_changed"
        ? AvatarActivityType.AVATAR_CHANGED
        : activityType === "item_equipped"
          ? AvatarActivityType.ITEM_EQUIPPED
          : AvatarActivityType.ITEM_REMOVED;

    return this.prisma.avatarActivityLog.create({
      data: {
        childId,
        activityType: mappedActivityType,
        itemId,
        timestamp: new Date(),
      },
    });
  }

  /**
   * Get avatar activity history for child
   */
  async getActivityHistory(childId: number, limit: number = 20) {
    return this.prisma.avatarActivityLog.findMany({
      where: { childId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  }

  /**
   * Get statistics for avatar system
   */
  async getAvatarStats() {
    const totalChildren = await this.prisma.avatarConfiguration.count();
    const totalCustomizations = await this.prisma.avatarActivityLog.count({
      where: { activityType: "AVATAR_CHANGED" },
    });

    const equippedItems = await this.prisma.childAvatarItem.findMany({
      where: { equipped: true },
      select: { itemId: true },
    });

    const usageMap = new Map<number, number>();
    for (const row of equippedItems) {
      usageMap.set(row.itemId, (usageMap.get(row.itemId) || 0) + 1);
    }

    const itemUsage = Array.from(usageMap.entries())
      .map(([itemId, count]) => ({ itemId, _count: count }))
      .sort((a, b) => b._count - a._count)
      .slice(0, 10);

    return {
      totalChildren,
      totalCustomizations,
      averageItemsPerChild:
        totalChildren > 0 ? itemUsage.length / totalChildren : 0,
      mostPopularItems: itemUsage,
    };
  }

  /**
   * Delete avatar item (when gift expires or revoked)
   */
  async deleteAvatarItem(childId: number, itemId: number) {
    return this.prisma.childAvatarItem.deleteMany({
      where: {
        childId,
        itemId,
      },
    });
  }

  /**
   * Get available avatar items from shop
   */
  async getAvailableAvatarItems(_layer?: AvatarLayer) {
    return this.prisma.shopItem.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Reset child avatar to default
   */
  async resetAvatarToDefault(childId: number) {
    await this.prisma.avatarConfiguration
      .delete({
        where: { childId },
      })
      .catch(() => null);

    return this.prisma.childAvatarItem.deleteMany({
      where: { childId },
    });
  }
}
