import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ChildProfileRepository } from "./child-profile.repository";
import {
  CreateChildProfileDto,
  UpdateChildProfileDto,
  ChildProfileDto,
  ProfileListDto,
  ProfileActionResultDto,
  DeleteProfileResultDto,
} from "./child-profile.dto";

/**
 * Service for managing child profiles
 * Business logic for parent's multi-child profile management
 */
@Injectable()
export class ChildProfileService {
  // Maximum number of child profiles per parent
  private readonly MAX_PROFILES_PER_PARENT = 5;

  constructor(
    private readonly repository: ChildProfileRepository,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Create a new child profile
   * Validates max profiles limit before creation
   * @param parentId - Parent user ID
   * @param dto - Profile creation data
   * @returns Created profile with success message
   */
  async createProfile(
    parentId: number,
    dto: CreateChildProfileDto,
  ): Promise<ProfileActionResultDto> {
    // Check profile count limit
    const currentCount = await this.repository.countProfilesForParent(parentId);
    if (currentCount >= this.MAX_PROFILES_PER_PARENT) {
      throw new BadRequestException(
        `You can only create up to ${this.MAX_PROFILES_PER_PARENT} child profiles. Please delete an existing profile to add a new one.`,
      );
    }

    // Create profile
    const profile = await this.repository.createProfile(parentId, dto);

    // If this is the first profile, set it as active
    if (currentCount === 0) {
      await this.repository.switchActiveProfile(parentId, profile.id);
    }

    return {
      success: true,
      message: `Profile created successfully! 🎉 Welcome, ${dto.nickname}!`,
      profile: this.mapToProfileDto(profile, currentCount === 0),
    };
  }

  /**
   * Get all child profiles for a parent
   * Includes active profile indicator and badge counts
   * @param parentId - Parent user ID
   * @returns List of profiles with metadata
   */
  async getAllProfiles(parentId: number): Promise<ProfileListDto> {
    const profiles = await this.repository.getAllProfilesForParent(parentId);
    const activeProfile = await this.repository.getActiveProfile(parentId);

    return {
      profiles: profiles.map((profile) =>
        this.mapToProfileDto(profile, profile.id === activeProfile?.id),
      ),
      totalCount: profiles.length,
      maxProfiles: this.MAX_PROFILES_PER_PARENT,
      activeProfileId: activeProfile?.id || null,
    };
  }

  /**
   * Get a single child profile by ID
   * Verifies parent ownership
   * @param childId - Child profile ID
   * @param parentId - Parent user ID
   * @returns Child profile details
   */
  async getProfileById(
    childId: number,
    parentId: number,
  ): Promise<ChildProfileDto> {
    const profile = await this.repository.getProfileById(childId, parentId);
    if (!profile) {
      throw new NotFoundException(
        `Child profile with ID ${childId} not found or you don't have permission to access it.`,
      );
    }

    const activeProfile = await this.repository.getActiveProfile(parentId);
    return this.mapToProfileDto(profile, profile.id === activeProfile?.id);
  }

  /**
   * Update child profile details
   * Allows updating nickname, age, avatar
   * @param childId - Child profile ID
   * @param parentId - Parent user ID
   * @param dto - Updated profile data
   * @returns Updated profile
   */
  async updateProfile(
    childId: number,
    parentId: number,
    dto: UpdateChildProfileDto,
  ): Promise<ProfileActionResultDto> {
    // Verify profile exists and belongs to parent
    const existingProfile = await this.repository.getProfileById(
      childId,
      parentId,
    );
    if (!existingProfile) {
      throw new NotFoundException(
        `Child profile with ID ${childId} not found or you don't have permission to access it.`,
      );
    }

    // Update profile
    const updatedProfile = await this.repository.updateProfile(
      childId,
      parentId,
      dto,
    );
    const activeProfile = await this.repository.getActiveProfile(parentId);

    return {
      success: true,
      message: "Profile updated successfully! ✅",
      profile: this.mapToProfileDto(
        updatedProfile,
        updatedProfile.id === activeProfile?.id,
      ),
    };
  }

  /**
   * Delete child profile
   * Prevents deletion if it's the only profile
   * @param childId - Child profile ID
   * @param parentId - Parent user ID
   * @returns Deletion confirmation
   */
  async deleteProfile(
    childId: number,
    parentId: number,
  ): Promise<DeleteProfileResultDto> {
    // Verify profile exists
    const profile = await this.repository.getProfileById(childId, parentId);
    if (!profile) {
      throw new NotFoundException(
        `Child profile with ID ${childId} not found or you don't have permission to access it.`,
      );
    }

    // Check if this is the only profile
    const profileCount = await this.repository.countProfilesForParent(parentId);
    if (profileCount === 1) {
      throw new BadRequestException(
        "Cannot delete the only child profile. You must have at least one profile.",
      );
    }

    // Check if this is the active profile
    const activeProfile = await this.repository.getActiveProfile(parentId);
    const isDeletingActiveProfile = activeProfile?.id === childId;

    // Delete profile
    await this.repository.deleteProfile(childId, parentId);

    // If deleted profile was active, switch to first available profile
    if (isDeletingActiveProfile) {
      const remainingProfiles =
        await this.repository.getAllProfilesForParent(parentId);
      if (remainingProfiles.length > 0) {
        await this.repository.switchActiveProfile(
          parentId,
          remainingProfiles[0].id,
        );
      }
    }

    return {
      success: true,
      message: `Profile "${profile.nickname}" deleted successfully.`,
      deletedProfileId: childId,
    };
  }

  /**
   * Switch active child profile
   * Updates User.activeChildId and returns new JWT tokens with LEARNER role
   * @param parentId - Parent user ID
   * @param childId - Child profile ID to activate
   * @returns Activated profile details with new JWT tokens
   */
  async switchProfile(
    parentId: number,
    childId: number,
  ): Promise<ProfileActionResultDto> {
    // Verify profile exists and belongs to parent
    const profile = await this.repository.getProfileById(childId, parentId);
    if (!profile) {
      throw new NotFoundException(
        `Child profile with ID ${childId} not found or you don't have permission to access it.`,
      );
    }

    // Switch active profile
    await this.repository.switchActiveProfile(parentId, childId);

    // Update last activity timestamp
    await this.repository.updateLastActivity(childId);

    // Generate new JWT tokens with LEARNER role and childId
    const payload = {
      sub: parentId,
      role: "LEARNER",
      childId: childId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: "15m",
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: "7d",
    });

    return {
      success: true,
      message: `Switched to ${profile.nickname}'s profile! 👋`,
      profile: this.mapToProfileDto(profile, true),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Set active child profile for parent-facing pages without switching JWT role.
   * Keeps the parent session intact while updating User.activeChildId.
   */
  async setActiveProfile(
    parentId: number,
    childId: number,
  ): Promise<ProfileActionResultDto> {
    const profile = await this.repository.getProfileById(childId, parentId);
    if (!profile) {
      throw new NotFoundException(
        `Child profile with ID ${childId} not found or you don't have permission to access it.`,
      );
    }

    await this.repository.switchActiveProfile(parentId, childId);

    return {
      success: true,
      message: `Đã chọn hồ sơ ${profile.nickname}.`,
      profile: this.mapToProfileDto(profile, true),
    };
  }

  /**
   * Get currently active profile
   * @param parentId - Parent user ID
   * @returns Active profile or null if none selected
   */
  async getActiveProfile(parentId: number): Promise<ChildProfileDto | null> {
    const activeProfile = await this.repository.getActiveProfile(parentId);
    if (!activeProfile) {
      return null;
    }

    return this.mapToProfileDto(activeProfile, true);
  }

  /**
   * Map database model to DTO
   * @param profile - Prisma ChildProfile with badges
   * @param isActive - Whether this is the active profile
   * @returns ChildProfileDto
   */
  private mapToProfileDto(
    profile: {
      id: number;
      nickname: string;
      age: number;
      avatar: string;
      totalPoints: number;
      badges?: unknown[];
      streakDays?: number;
      streakCount?: number;
      createdAt: Date;
      lastActivityAt?: Date | null;
      updatedAt?: Date;
    },
    isActive: boolean,
  ): ChildProfileDto {
    return {
      id: profile.id,
      nickname: profile.nickname,
      age: profile.age,
      avatar: profile.avatar,
      totalPoints: profile.totalPoints,
      currentLevel: this.repository.calculateLevel(profile.totalPoints),
      badgesEarned: profile.badges?.length || 0,
      streakDays: profile.streakDays ?? profile.streakCount ?? 0,
      isActive,
      createdAt: profile.createdAt,
      lastActivityAt:
        profile.lastActivityAt ?? profile.updatedAt ?? profile.createdAt,
    };
  }
}
