import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { AvatarCustomizationService } from "../service/avatar-customization.service";
import {
  ApplyAvatarItemRequestDto,
  AvatarUpdateResponseDto,
  AvatarPreviewDto,
  OwnedAvatarItemsDto,
  AvailableAvatarItemsDto,
  AvatarStatsDto,
  AvatarLayer,
} from "../dto/avatar-customization.dto";

@ApiTags("Avatar Customization")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("gamification/avatar")
export class AvatarCustomizationController {
  constructor(private avatarService: AvatarCustomizationService) {}

  /**
   * Apply avatar item to current avatar
   */
  @Post("items/apply")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Apply item to avatar" })
  @ApiResponse({ status: 200, type: AvatarUpdateResponseDto })
  async applyItem(@Request() req: any, @Body() dto: ApplyAvatarItemRequestDto) {
    const childId = req.user.childId;
    const config = await this.avatarService.applyItem(childId, dto);

    return {
      childId,
      success: true,
      avatarConfig: config,
      message: "Item applied successfully",
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Remove item from avatar
   */
  @Delete("items/:layer")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Remove item from avatar" })
  @ApiParam({ name: "layer", enum: AvatarLayer })
  @ApiResponse({ status: 200, type: AvatarUpdateResponseDto })
  async removeItem(@Request() req: any, @Param("layer") layer: AvatarLayer) {
    const childId = req.user.childId;
    const config = await this.avatarService.removeItem(childId, layer);

    return {
      childId,
      success: true,
      avatarConfig: config,
      message: "Item removed successfully",
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get current avatar configuration
   */
  @Get()
  @ApiOperation({ summary: "Get current avatar configuration" })
  @ApiResponse({ status: 200, description: "Avatar configuration" })
  async getAvatar(@Request() req: any) {
    const childId = req.user.childId;
    return this.avatarService.getAvatarConfig(childId);
  }

  /**
   * Get avatar preview
   */
  @Get("preview")
  @ApiOperation({ summary: "Get avatar preview as SVG" })
  @ApiResponse({ status: 200, type: AvatarPreviewDto })
  async getPreview(@Request() req: any) {
    const childId = req.user.childId;
    return this.avatarService.getAvatarPreview(childId);
  }

  /**
   * Get child's owned items
   */
  @Get("items")
  @ApiOperation({ summary: "Get owned avatar items" })
  @ApiResponse({ status: 200, type: OwnedAvatarItemsDto })
  async getOwnedItems(@Request() req: any) {
    const childId = req.user.childId;
    return this.avatarService.getOwnedItems(childId);
  }

  /**
   * Get available items for purchase
   */
  @Get("items/available")
  @ApiOperation({ summary: "Get available avatar items" })
  @ApiQuery({ name: "layer", enum: AvatarLayer, required: false })
  @ApiResponse({ status: 200, type: AvailableAvatarItemsDto })
  async getAvailableItems(@Query("layer") layer?: AvatarLayer) {
    return this.avatarService.getAvailableItems(layer);
  }

  /**
   * Reset avatar to default
   */
  @Post("reset")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset avatar to default" })
  @ApiResponse({ status: 200, description: "Avatar reset successfully" })
  async resetAvatar(@Request() req: any) {
    const childId = req.user.childId;
    const config = await this.avatarService.resetAvatar(childId);

    return {
      childId,
      success: true,
      avatarConfig: config,
      message: "Avatar reset to default",
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get avatar change history
   */
  @Get("history")
  @ApiOperation({ summary: "Get avatar change history" })
  @ApiQuery({ name: "limit", type: "number", required: false })
  @ApiResponse({ status: 200, description: "Activity history" })
  async getHistory(
    @Request() req: any,
    @Query("limit", new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    const childId = req.user.childId;
    return this.avatarService.getActivityHistory(childId, limit || 20);
  }

  /**
   * Get avatar statistics (admin)
   */
  @Get("stats")
  @ApiOperation({ summary: "Get avatar system statistics (admin only)" })
  @ApiResponse({ status: 200, type: AvatarStatsDto })
  async getStats() {
    return this.avatarService.getStatistics();
  }
}
