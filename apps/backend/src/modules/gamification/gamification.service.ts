import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { GamificationRepository } from "./repositories/gamification.repository";
import { PrismaService } from "../../prisma/prisma.service";
import {
  RewardSummaryDto,
  PurchaseItemDto,
  PurchaseResultDto,
  EquipItemDto,
  AvatarCustomizationDto,
  ShopItemCategory,
} from "./dto/gamification.dto";

/**
 * UC-05 Service: Receive and Use Gamification Rewards
 * Manages star points, badges, virtual shop, and avatar customization
 */
@Injectable()
export class GamificationService {
  private static readonly DEFAULT_AVATAR_URL =
    process.env.DEFAULT_AVATAR_URL ||
    "https://cdn.edukids.com/avatars/default.png";

  private static readonly MAX_QUERY_LIMIT = 100;

  constructor(
    private readonly gamificationRepository: GamificationRepository,
    private readonly prisma: PrismaService,
  ) {}

  private normalizeLimit(limit: number, fallback: number): number {
    if (!Number.isFinite(limit)) return fallback;
    const normalized = Math.floor(limit);
    if (normalized <= 0) return fallback;
    return Math.min(normalized, GamificationService.MAX_QUERY_LIMIT);
  }

  /**
   * Get reward summary for child (points, level, badges, streak)
   */
  async getRewardSummary(childId: number): Promise<RewardSummaryDto> {
    const summary = await this.gamificationRepository.getRewardSummary(childId);

    const allBadges =
      await this.gamificationRepository.getAllBadgesForChild(childId);
    const recentBadges = allBadges
      .filter((b) => b.isEarned && b.earnedAt)
      .sort((a, b) => {
        const dateA = a.earnedAt ? new Date(a.earnedAt as Date).getTime() : 0;
        const dateB = b.earnedAt ? new Date(b.earnedAt as Date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3);

    return {
      ...summary,
      recentBadges,
    };
  }

  /**
   * Get all badges with earned status and progress
   */
  async getAllBadges(childId: number) {
    return this.gamificationRepository.getAllBadgesForChild(childId);
  }

  /**
   * Get badges earned by child
   */
  async getEarnedBadges(childId: number) {
    const allBadges =
      await this.gamificationRepository.getAllBadgesForChild(childId);
    return allBadges.filter((b) => b.isEarned);
  }

  /**
   * Get all shop items with purchase status
   */
  async getShopItems(childId: number) {
    return this.gamificationRepository.getAllShopItems(childId);
  }

  /**
   * Get shop items by category
   */
  async getShopItemsByCategory(childId: number, category: ShopItemCategory) {
    return this.gamificationRepository.getShopItemsByCategory(
      childId,
      category,
    );
  }

  /**
   * Purchase item from shop
   * Validates sufficient points and deducts cost
   */
  async purchaseItem(
    childId: number,
    dto: PurchaseItemDto,
  ): Promise<PurchaseResultDto> {
    const child = await this.prisma.childProfile.findUnique({
      where: { id: childId },
      select: { id: true },
    });

    if (!child) {
      throw new NotFoundException("Child profile not found");
    }

    const item = await this.gamificationRepository.getShopItemById(
      childId,
      dto.itemId,
    );

    if (!item) {
      throw new NotFoundException(`Shop item ${dto.itemId} not found`);
    }

    if (item.isPurchased) {
      throw new BadRequestException("You already own this item!");
    }

    const purchase = await this.gamificationRepository.purchaseItem(
      childId,
      dto.itemId,
      item.price,
    );

    if (!purchase) {
      throw new BadRequestException(
        "Purchase failed (insufficient points or item already owned).",
      );
    }

    const updatedChild = await this.prisma.childProfile.findUnique({
      where: { id: childId },
    });

    return {
      success: true,
      message: `Successfully purchased ${item.name}! 🎉`,
      itemId: item.id,
      itemName: item.name,
      itemPrice: item.price,
      remainingPoints: updatedChild?.totalPoints || 0,
      currentLevel: updatedChild?.currentLevel || 1,
    };
  }

  /**
   * Equip item to avatar
   * Validates ownership and applies customization
   */
  async equipItem(childId: number, dto: EquipItemDto) {
    const child = await this.prisma.childProfile.findUnique({
      where: { id: childId },
      select: { id: true },
    });

    if (!child) {
      throw new NotFoundException("Child profile not found");
    }

    const item = await this.gamificationRepository.getShopItemById(
      childId,
      dto.itemId,
    );

    if (!item) {
      throw new NotFoundException(`Shop item ${dto.itemId} not found`);
    }

    if (!item.isPurchased) {
      throw new BadRequestException("You must purchase this item first!");
    }

    await this.gamificationRepository.equipItem(
      childId,
      dto.itemId,
      item.category,
    );

    return {
      success: true,
      message: `Successfully equipped ${item.name}! 🎨`,
      itemId: item.id,
      itemName: item.name,
      category: item.category,
    };
  }

  /**
   * Get avatar customization details
   */
  async getAvatarCustomization(
    childId: number,
  ): Promise<AvatarCustomizationDto> {
    const child = await this.prisma.childProfile.findUnique({
      where: { id: childId },
    });

    if (!child) {
      throw new NotFoundException("Child profile not found");
    }

    const ownedItems = await this.gamificationRepository.getOwnedShopItems(
      childId,
    );

    return {
      childId: child.id,
      childName: child.nickname || "Player",
      avatar: child.avatar || GamificationService.DEFAULT_AVATAR_URL,
      ownedItems,
    };
  }

  /**
   * Get star transaction history
   */
  async getStarTransactionHistory(childId: number, limit: number = 20) {
    const safeLimit = this.normalizeLimit(limit, 20);
    return this.gamificationRepository.getStarTransactionHistory(
      childId,
      safeLimit,
    );
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(childId: number, limit: number = 10) {
    const safeLimit = this.normalizeLimit(limit, 10);
    const leaderboard = await this.gamificationRepository.getLeaderboard(
      safeLimit,
    );
    return leaderboard.map((entry) => ({
      ...entry,
      isCurrentUser: entry.childId === childId,
    }));
  }

  /**
   * Check and award badges (called from other services)
   */
  async checkAndAwardBadges(childId: number): Promise<string[]> {
    return this.gamificationRepository.checkAndAwardBadges(childId);
  }
}
