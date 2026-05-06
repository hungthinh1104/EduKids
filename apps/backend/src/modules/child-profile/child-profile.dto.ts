import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsInt,
  IsOptional,
  IsUrl,
  MinLength,
  MaxLength,
  Min,
  Max,
} from "class-validator";

/**
 * DTO for creating a new child profile
 */
export class CreateChildProfileDto {
  @ApiProperty({
    description: "Child nickname (display name)",
    example: "Alice",
    minLength: 2,
    maxLength: 30,
  })
  @IsString()
  @MinLength(2, { message: "Nickname must be at least 2 characters" })
  @MaxLength(30, { message: "Nickname cannot exceed 30 characters" })
  nickname: string;

  @ApiProperty({
    description: "Child age (4-12 years)",
    example: 7,
    minimum: 4,
    maximum: 12,
  })
  @IsInt()
  @Min(4, { message: "Child must be at least 4 years old" })
  @Max(12, { message: "Child must be at most 12 years old" })
  age: number;

  @ApiPropertyOptional({
    description: "Avatar image URL",
    example: "https://cdn.edukids.com/avatars/child-1.png",
  })
  @IsOptional()
  @IsUrl({}, { message: "Invalid avatar URL format" })
  avatar?: string;
}

/**
 * DTO for updating existing child profile
 */
export class UpdateChildProfileDto {
  @ApiPropertyOptional({
    description: "Updated nickname",
    example: "Alice Wonder",
    minLength: 2,
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  nickname?: string;

  @ApiPropertyOptional({
    description: "Updated age (4-12 years)",
    example: 8,
    minimum: 4,
    maximum: 12,
  })
  @IsOptional()
  @IsInt()
  @Min(4)
  @Max(12)
  age?: number;

  @ApiPropertyOptional({
    description: "Updated avatar URL",
    example: "https://cdn.edukids.com/avatars/child-2.png",
  })
  @IsOptional()
  @IsUrl()
  avatar?: string;
}

/**
 * DTO for switching active child profile
 */
export class SwitchChildProfileDto {
  @ApiProperty({
    description: "Child profile ID to switch to",
    example: 1,
  })
  @IsInt()
  childId: number;
}

/**
 * Response DTO for child profile data
 */
export class ChildProfileDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "Alice" })
  nickname: string;

  @ApiProperty({ example: 7 })
  age: number;

  @ApiProperty({ example: "https://cdn.edukids.com/avatars/child-1.png" })
  avatar: string;

  @ApiProperty({ example: 0, description: "Total star points earned" })
  totalPoints: number;

  @ApiProperty({
    example: 1,
    description: "Current level (calculated from points)",
  })
  currentLevel: number;

  @ApiProperty({ example: 5, description: "Number of badges earned" })
  badgesEarned: number;

  @ApiProperty({ example: 3, description: "Current streak days" })
  streakDays: number;

  @ApiProperty({ example: true, description: "Is this the active profile?" })
  isActive: boolean;

  @ApiProperty({ example: "2024-01-15T10:00:00Z" })
  createdAt: Date;

  @ApiProperty({ example: "2024-03-05T10:00:00Z" })
  lastActivityAt: Date;
}

/**
 * Response DTO for profile list
 */
export class ProfileListDto {
  @ApiProperty({
    type: [ChildProfileDto],
    description: "List of all child profiles for parent",
  })
  profiles: ChildProfileDto[];

  @ApiProperty({ example: 3, description: "Total number of profiles" })
  totalCount: number;

  @ApiProperty({
    example: 5,
    description: "Maximum profiles allowed per parent",
  })
  maxProfiles: number;

  @ApiProperty({ example: 1, description: "Currently active profile ID" })
  activeProfileId: number | null;
}

/**
 * Response DTO after creating/switching profile
 */
export class ProfileActionResultDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "Profile created successfully! 🎉" })
  message: string;

  @ApiProperty({ type: ChildProfileDto })
  profile: ChildProfileDto;

  @ApiProperty({
    required: false,
    description: "JWT access token with LEARNER role (only for switch action)",
  })
  accessToken?: string;

  @ApiProperty({
    required: false,
    description: "JWT refresh token (only for switch action)",
  })
  refreshToken?: string;
}

/**
 * Response DTO after deleting profile
 */
export class DeleteProfileResultDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "Profile deleted successfully" })
  message: string;

  @ApiProperty({ example: 1 })
  deletedProfileId: number;
}
