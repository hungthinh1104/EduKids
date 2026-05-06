import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { AvatarRepository } from "../repository/avatar.repository";
import { AvatarCacheService } from "./avatar-cache.service";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  AvatarConfigDto,
  AvatarLayer,
  AvatarLayerConfigDto,
  ApplyAvatarItemRequestDto,
} from "../dto/avatar-customization.dto";
import {
  DEFAULT_AVATAR_ITEMS,
  buildAvatarLayerAssetUrl,
} from "../avatar-item-catalog";

@Injectable()
export class AvatarCustomizationService {
  constructor(
    private avatarRepository: AvatarRepository,
    private cacheService: AvatarCacheService,
    private prisma: PrismaService,
  ) {}

  private buildPreviewUrl(): string {
    const apiBase = (
      process.env.PUBLIC_API_BASE_URL || "http://localhost:3001/api"
    ).replace(/\/+$/, "");
    return `${apiBase}/gamification/avatar/preview`;
  }

  private async syncChildProfileAvatar(childId: number): Promise<void> {
    const previewUrl = this.buildPreviewUrl();
    await this.prisma.childProfile
      .update({
        where: { id: childId },
        data: { avatar: previewUrl },
      })
      .catch(() => {});
  }

  /**
   * Apply item to avatar
   */
  async applyItem(childId: number, request: ApplyAvatarItemRequestDto) {
    // Check if child owns the item
    const hasItem = await this.avatarRepository.hasItem(
      childId,
      request.itemId,
    );
    if (!hasItem) {
      throw new BadRequestException("Child does not own this item");
    }

    // Get current config
    let config = await this.avatarRepository.getAvatarConfig(childId);
    if (!config) {
      config = await this.initializeDefaultAvatar(childId);
    }

    const configData = this.toAvatarConfigPayload(config.config);

    // Get item details
    const item = await this.avatarRepository.getAvatarItemById(request.itemId);

    if (!item) {
      throw new NotFoundException("Item not found");
    }

    // Update layers in config
    const newLayer: AvatarLayerConfigDto = {
      layer: request.layer,
      itemId: request.itemId,
      itemName: item.name,
      assetUrl: item.assetUrl,
    };

    // Replace or add layer
    configData.layers = configData.layers.filter((layer) => {
      return layer.layer !== request.layer;
    });
    configData.layers.push(newLayer);

    // Save to database (immediate auto-save)
    await this.avatarRepository.updateAvatarConfig(childId, configData);

    // Invalidate cache
    await this.cacheService.invalidateCache(childId);

    // Sync avatar URL to ChildProfile so parent dashboard reflects latest avatar
    void this.syncChildProfileAvatar(childId);

    // Log activity for analytics
    await this.avatarRepository.logAvatarActivity(
      childId,
      "item_equipped",
      request.itemId,
    );

    return configData;
  }

  /**
   * Remove item from avatar
   */
  async removeItem(childId: number, layer: AvatarLayer) {
    const config = await this.avatarRepository.getAvatarConfig(childId);
    if (!config) {
      throw new NotFoundException("Avatar not found");
    }

    const configData = this.toAvatarConfigPayload(config.config);

    // Remove layer
    configData.layers = configData.layers.filter(
      (item) => item.layer !== layer,
    );

    // Save immediately
    await this.avatarRepository.updateAvatarConfig(childId, configData);
    await this.cacheService.invalidateCache(childId);
    void this.syncChildProfileAvatar(childId);

    // Log activity
    await this.avatarRepository.logAvatarActivity(childId, "item_removed");

    return configData;
  }

  /**
   * Get current avatar configuration
   */
  async getAvatarConfig(childId: number): Promise<AvatarConfigDto> {
    // Try cache first
    const cached =
      await this.cacheService.getCachedConfig<AvatarConfigPayload>(childId);
    if (cached) {
      return this.buildAvatarConfigDto(childId, cached);
    }

    // Load from database
    const config = await this.avatarRepository.getAvatarConfig(childId);
    if (!config) {
      return this.buildDefaultAvatarConfig(childId);
    }

    const configData = this.toAvatarConfigPayload(config.config);

    // Cache it
    await this.cacheService.cacheAvatarConfig(childId, configData);

    return this.buildAvatarConfigDto(childId, configData);
  }

  /**
   * Get avatar preview as SVG
   */
  async getAvatarPreview(childId: number) {
    const config = await this.getAvatarConfig(childId);
    const svgPreview = this.generateSVGPreview(config.layers);

    return {
      childId,
      config,
      svgPreview,
      previewGeneratedAt: new Date().toISOString(),
    };
  }

  /**
   * Get child's owned items
   */
  async getOwnedItems(childId: number) {
    // Try cache
    const cachedItems = await this.cacheService.getCachedItems(childId);
    if (cachedItems) {
      const config = await this.getAvatarConfig(childId);
      return {
        childId,
        totalItems: cachedItems.length,
        items: cachedItems,
        currentConfig: config,
      };
    }

    // Load from database
    const items = await this.avatarRepository.getChildAvatarItems(childId);
    await this.cacheService.cacheChildItems(childId, items);

    const config = await this.getAvatarConfig(childId);
    return {
      childId,
      totalItems: items.length,
      items,
      currentConfig: config,
    };
  }

  /**
   * Get available avatar items for purchase
   */
  async getAvailableItems(layer?: AvatarLayer) {
    const items = await this.avatarRepository.getAvailableAvatarItems(layer);
    return {
      items,
      totalCount: items.length,
      layer,
    };
  }

  /**
   * Reset avatar to default
   */
  async resetAvatar(childId: number) {
    await this.avatarRepository.resetAvatarToDefault(childId);
    await this.cacheService.invalidateCache(childId);
    void this.syncChildProfileAvatar(childId);

    const defaultConfig = await this.initializeDefaultAvatar(childId);
    await this.avatarRepository.logAvatarActivity(childId, "avatar_changed");

    return this.buildAvatarConfigDto(
      childId,
      this.toAvatarConfigPayload(defaultConfig.config),
    );
  }

  /**
   * Get avatar activity history
   */
  async getActivityHistory(childId: number, limit: number = 20) {
    return this.avatarRepository.getActivityHistory(childId, limit);
  }

  /**
   * Get avatar statistics
   */
  async getStatistics() {
    return this.avatarRepository.getAvatarStats();
  }

  /**
   * Initialize default avatar for new child
   */
  private async initializeDefaultAvatar(childId: number) {
    const defaultHair = DEFAULT_AVATAR_ITEMS.find((item) => item.id === 1);

    const defaultConfig = {
      layers: [
        {
          layer: AvatarLayer.HAIR,
          itemId: 1, // Default hair
          itemName: defaultHair?.name || "Default Hair",
          assetUrl: buildAvatarLayerAssetUrl(
            defaultHair || DEFAULT_AVATAR_ITEMS[0],
          ),
        },
      ],
    };

    return this.avatarRepository.updateAvatarConfig(childId, defaultConfig);
  }

  /**
   * Build avatar config DTO
   */
  private buildAvatarConfigDto(
    childId: number,
    configData: AvatarConfigPayload,
  ): AvatarConfigDto {
    return {
      childId,
      layers: configData.layers || [],
      previewUrl: this.buildPreviewUrl(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Build default avatar config
   */
  private buildDefaultAvatarConfig(childId: number): AvatarConfigDto {
    return {
      childId,
      layers: [
        {
          layer: AvatarLayer.HAIR,
          itemId: 1,
          itemName: DEFAULT_AVATAR_ITEMS[0]?.name || "Default Hair",
          assetUrl: buildAvatarLayerAssetUrl(DEFAULT_AVATAR_ITEMS[0]),
        },
      ],
      previewUrl: this.buildPreviewUrl(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate SVG preview from layers
   */
  private generateSVGPreview(layers: AvatarLayerConfigDto[]): string {
    const layerElements = layers
      .map((layer) => `<image x="0" y="0" href="${layer.assetUrl}" />`)
      .join("\n");

    return `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            image { max-width: 200px; max-height: 200px; }
          </style>
        </defs>
        ${layerElements}
      </svg>
    `;
  }

  private toAvatarConfigPayload(value: unknown): AvatarConfigPayload {
    const parsedValue =
      typeof value === "string" ? (JSON.parse(value) as unknown) : value;

    const parsedLayers = (parsedValue as { layers?: unknown })?.layers;
    const layers = Array.isArray(parsedLayers)
      ? (parsedLayers as AvatarLayerConfigDto[])
      : [];

    return {
      ...(typeof parsedValue === "object" && parsedValue !== null
        ? parsedValue
        : {}),
      layers,
    } as AvatarConfigPayload;
  }
}

type AvatarConfigPayload = {
  layers: AvatarLayerConfigDto[];
} & Record<string, unknown>;
