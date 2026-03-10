import {
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsOptional,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * Avatar item layers
 */
export enum AvatarLayer {
  HAIR = "HAIR",
  HAIR_COLOR = "HAIR_COLOR",
  CLOTHING = "CLOTHING",
  ACCESSORIES = "ACCESSORIES",
}

/**
 * Shop item DTO extended for avatar
 */
export class AvatarItemDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  layer: AvatarLayer;

  @IsNumber()
  price: number;

  @IsString()
  assetUrl: string;

  @IsBoolean()
  isAvailable: boolean;
}

/**
 * Single avatar layer configuration
 */
export class AvatarLayerConfigDto {
  @IsString()
  layer: AvatarLayer;

  @IsNumber()
  itemId: number;

  @IsString()
  itemName: string;

  @IsString()
  assetUrl: string;
}

/**
 * Complete avatar configuration
 */
export class AvatarConfigDto {
  @IsNumber()
  childId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvatarLayerConfigDto)
  layers: AvatarLayerConfigDto[];

  @IsString()
  @IsOptional()
  previewUrl?: string;

  @IsString()
  updatedAt: string;
}

/**
 * Child owned avatar item
 */
export class ChildAvatarItemDto {
  @IsNumber()
  itemId: number;

  @IsNumber()
  childId: number;

  @IsBoolean()
  equipped: boolean;

  @ValidateNested()
  @Type(() => AvatarItemDto)
  item: AvatarItemDto;
}

/**
 * Request: Apply item to avatar
 */
export class ApplyAvatarItemRequestDto {
  @IsNumber()
  itemId: number;

  @IsString()
  layer: AvatarLayer;
}

/**
 * Response: Avatar updated
 */
export class AvatarUpdateResponseDto {
  @IsNumber()
  childId: number;

  @IsBoolean()
  success: boolean;

  @ValidateNested()
  @Type(() => AvatarConfigDto)
  avatarConfig: AvatarConfigDto;

  @IsString()
  message: string;

  @IsString()
  updatedAt: string;
}

/**
 * Response: Avatar preview
 */
export class AvatarPreviewDto {
  @IsNumber()
  childId: number;

  @ValidateNested()
  @Type(() => AvatarConfigDto)
  config: AvatarConfigDto;

  @IsString()
  svgPreview: string;

  @IsString()
  previewGeneratedAt: string;
}

/**
 * Response: List owned items
 */
export class OwnedAvatarItemsDto {
  @IsNumber()
  childId: number;

  @IsNumber()
  totalItems: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChildAvatarItemDto)
  items: ChildAvatarItemDto[];

  @ValidateNested()
  @Type(() => AvatarConfigDto)
  currentConfig: AvatarConfigDto;
}

/**
 * Response: Available items for purchase
 */
export class AvailableAvatarItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvatarItemDto)
  items: AvatarItemDto[];

  @IsNumber()
  totalCount: number;

  @IsString()
  @IsOptional()
  layer?: AvatarLayer;
}

/**
 * Avatar statistics
 */
export class AvatarStatsDto {
  @IsNumber()
  totalChildren: number;

  @IsNumber()
  totalCustomizations: number;

  @IsNumber()
  averageItemsPerChild: number;

  @IsArray()
  mostPopularItems: {
    itemId: number;
    itemName: string;
    usageCount: number;
  }[];
}
