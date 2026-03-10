import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { Throttle } from "../../common/decorators/throttle.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "@prisma/client";
import { GamificationService } from "./gamification.service";
import {
  RewardSummaryDto,
  BadgeDto,
  ShopItemDto,
  PurchaseItemDto,
  PurchaseResultDto,
  EquipItemDto,
  AvatarCustomizationDto,
  ShopItemCategory,
  LeaderboardEntryDto,
} from "./dto/gamification.dto";

@ApiTags("Gamification - UC-05")
@ApiBearerAuth("JWT-auth")
@Controller("gamification")
@UseGuards(JwtAuthGuard, RolesGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  /**
   * UC-05 Main Endpoint: Get reward summary
   * Shows total points, level, badges, streak
   */
  @ApiOperation({
    summary: "Get reward summary for child",
    description: `
      Returns comprehensive reward summary including:
      - Total star points and current level
      - Level progress (% to next level)
      - Badges earned vs total available
      - Current streak days
      - Recently unlocked badges (last 3)
      
      This is the main gamification dashboard endpoint.
    `,
  })
  @ApiResponse({
    status: 200,
    description: "Reward summary retrieved",
    type: RewardSummaryDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT missing or invalid",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - childId missing from JWT",
  })
  @Roles("LEARNER")
  @Get("rewards/summary")
  async getRewardSummary(
    @CurrentUser() user: User & { childId?: number },
  ): Promise<RewardSummaryDto> {
    if (!user.childId) {
      throw new BadRequestException(
        "Active child profile required. Please select a child profile first.",
      );
    }

    return this.gamificationService.getRewardSummary(user.childId);
  }

  /**
   * Get all badges with earned status and progress
   */
  @ApiOperation({
    summary: "Get all available badges",
    description:
      "Returns all badge definitions with earned status and progress toward each badge",
  })
  @ApiResponse({
    status: 200,
    description: "All badges retrieved",
    type: [BadgeDto],
  })
  @Roles("LEARNER")
  @Get("badges")
  async getAllBadges(
    @CurrentUser() user: User & { childId?: number },
  ): Promise<BadgeDto[]> {
    if (!user.childId) {
      throw new BadRequestException(
        "Active child profile required. Please select a child profile first.",
      );
    }

    return this.gamificationService.getAllBadges(user.childId);
  }

  /**
   * Get only badges earned by child
   */
  @ApiOperation({
    summary: "Get badges earned by child",
    description: "Returns only badges that have been unlocked",
  })
  @ApiResponse({
    status: 200,
    description: "Earned badges retrieved",
    type: [BadgeDto],
  })
  @Roles("LEARNER")
  @Get("badges/earned")
  async getEarnedBadges(
    @CurrentUser() user: User & { childId?: number },
  ): Promise<BadgeDto[]> {
    if (!user.childId) {
      throw new BadRequestException(
        "Active child profile required. Please select a child profile first.",
      );
    }

    return this.gamificationService.getEarnedBadges(user.childId);
  }

  /**
   * UC-05: Get all shop items
   * Virtual shop for avatar customization
   */
  @ApiOperation({
    summary: "Get all virtual shop items",
    description: `
      Returns all items in the virtual shop with:
      - Item details (name, description, price, image)
      - Purchase status (isPurchased)
      - Equipped status (isEquipped)
      
      Categories: AVATAR_HAIR, AVATAR_OUTFIT, AVATAR_ACCESSORY, AVATAR_PET, BACKGROUND
    `,
  })
  @ApiResponse({
    status: 200,
    description: "Shop items retrieved",
    type: [ShopItemDto],
  })
  @ApiQuery({
    name: "category",
    enum: ShopItemCategory,
    required: false,
    description: "Filter by category",
  })
  @Roles("LEARNER")
  @Get("shop/items")
  async getShopItems(
    @Query("category") category: ShopItemCategory,
    @CurrentUser() user: User & { childId?: number },
  ): Promise<ShopItemDto[]> {
    if (!user.childId) {
      throw new BadRequestException(
        "Active child profile required. Please select a child profile first.",
      );
    }

    if (category) {
      return this.gamificationService.getShopItemsByCategory(
        user.childId,
        category,
      );
    }

    return this.gamificationService.getShopItems(user.childId);
  }

  /**
   * UC-05 Main Action: Purchase shop item
   * Validates sufficient points and deducts cost
   */
  @ApiOperation({
    summary: "Purchase item from virtual shop",
    description: `
      Purchase avatar item with star points.
      
      Validation:
      - Item must exist
      - Child must not already own item
      - Child must have sufficient star points
      
      On success:
      - Points deducted from child profile
      - Purchase recorded in database
      - Item becomes available for equipping
      
      Exception: Insufficient points → "Not enough star points! You need X more. Keep going! 🌟"
    `,
  })
  @ApiResponse({
    status: 200,
    description: "Item purchased successfully",
    type: PurchaseResultDto,
  })
  @ApiResponse({
    status: 400,
    description: "Insufficient points or item already owned",
  })
  @ApiResponse({
    status: 404,
    description: "Shop item not found",
  })
  @Roles("LEARNER")
  @Throttle(10, 60) // 10 purchases per 60 seconds
  @Post("shop/purchase")
  async purchaseItem(
    @Body() dto: PurchaseItemDto,
    @CurrentUser() user: User & { childId?: number },
  ): Promise<PurchaseResultDto> {
    if (!user.childId) {
      throw new BadRequestException(
        "Active child profile required. Please select a child profile first.",
      );
    }

    return this.gamificationService.purchaseItem(user.childId, dto);
  }

  /**
   * UC-05: Equip item to avatar
   * Apply purchased item to avatar customization
   */
  @ApiOperation({
    summary: "Equip purchased item to avatar",
    description: `
      Apply purchased item to avatar customization.
      
      Validation:
      - Item must exist
      - Child must own the item (purchased)
      
      Equipping replaces previous item in same category.
      Example: Equipping "Rainbow Hair" replaces "Star Crown"
    `,
  })
  @ApiResponse({
    status: 200,
    description: "Item equipped successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Item not owned",
  })
  @ApiResponse({
    status: 404,
    description: "Item not found",
  })
  @Roles("LEARNER")
  @Post("shop/equip")
  async equipItem(
    @Body() dto: EquipItemDto,
    @CurrentUser() user: User & { childId?: number },
  ) {
    if (!user.childId) {
      throw new BadRequestException(
        "Active child profile required. Please select a child profile first.",
      );
    }

    return this.gamificationService.equipItem(user.childId, dto);
  }

  /**
   * Get avatar customization details
   */
  @ApiOperation({
    summary: "Get avatar customization details",
    description:
      "Returns all equipped items and owned items for avatar customization",
  })
  @ApiResponse({
    status: 200,
    description: "Avatar customization retrieved",
    type: AvatarCustomizationDto,
  })
  @Roles("LEARNER")
  @Get("avatar/customization")
  async getAvatarCustomization(
    @CurrentUser() user: User & { childId?: number },
  ): Promise<AvatarCustomizationDto> {
    if (!user.childId) {
      throw new BadRequestException(
        "Active child profile required. Please select a child profile first.",
      );
    }

    return this.gamificationService.getAvatarCustomization(user.childId);
  }

  /**
   * Get leaderboard
   */
  @ApiOperation({
    summary: "Get global leaderboard",
    description: "Returns top children ranked by total star points",
  })
  @ApiResponse({
    status: 200,
    description: "Leaderboard retrieved",
    type: [LeaderboardEntryDto],
  })
  @Roles("LEARNER")
  @Get("leaderboard")
  async getLeaderboard(
    @Query("limit") limit: number = 10,
    @CurrentUser() user: User & { childId?: number },
  ): Promise<LeaderboardEntryDto[]> {
    if (!user.childId) {
      throw new BadRequestException(
        "Active child profile required. Please select a child profile first.",
      );
    }

    return this.gamificationService.getLeaderboard(user.childId, limit);
  }
}
