import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateChildProfileDto,
  UpdateChildProfileDto,
} from "./child-profile.dto";

/**
 * Repository for managing child profiles
 * Handles database operations for parent's multiple child profiles
 */
@Injectable()
export class ChildProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new child profile for a parent
   * @param parentId - Parent user ID
   * @param dto - Profile creation data
   * @returns Created child profile with default values
   */
  async createProfile(parentId: number, dto: CreateChildProfileDto) {
    return this.prisma.childProfile.create({
      data: {
        parentId,
        nickname: dto.nickname,
        age: dto.age,
        avatar: dto.avatarUrl ?? this.getDefaultAvatarUrl(dto.age),
        totalPoints: 0,
        streakCount: 0,
        lastLearnDate: new Date(),
      },
      include: {
        badges: true,
      },
    });
  }

  /**
   * Get all child profiles for a parent
   * @param parentId - Parent user ID
   * @returns List of child profiles with badge counts
   */
  async getAllProfilesForParent(parentId: number) {
    return this.prisma.childProfile.findMany({
      where: {
        parentId,
        deletedAt: null,
      },
      include: {
        badges: {
          select: {
            childId: true,
            badgeId: true,
            earnedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Newest profiles first
      },
    });
  }

  /**
   * Get a single child profile by ID
   * @param childId - Child profile ID
   * @param parentId - Parent user ID (for authorization)
   * @returns Child profile or null if not found/not owned
   */
  async getProfileById(childId: number, parentId: number) {
    return this.prisma.childProfile.findFirst({
      where: {
        id: childId,
        parentId, // Ensure parent owns this profile
        deletedAt: null,
      },
      include: {
        badges: true,
      },
    });
  }

  /**
   * Update child profile details
   * @param childId - Child profile ID
   * @param parentId - Parent user ID
   * @param dto - Updated profile data
   * @returns Updated child profile
   */
  async updateProfile(
    childId: number,
    parentId: number,
    dto: UpdateChildProfileDto,
  ) {
    // Build update data object
    const updateData: Prisma.ChildProfileUpdateManyMutationInput = {};
    if (dto.nickname !== undefined) updateData.nickname = dto.nickname;
    if (dto.age !== undefined) updateData.age = dto.age;

    return this.prisma.childProfile.updateMany({
      where: {
        id: childId,
        parentId, // Ensure parent owns this profile
      },
      data: updateData,
    });
  }

  /**
   * Delete/archive child profile
   * Note: In production, consider soft delete to preserve learning history
   * @param childId - Child profile ID
   * @param parentId - Parent user ID
   * @returns Deletion result
   */
  async deleteProfile(childId: number, parentId: number) {
    // Option 1: Hard delete (current implementation)
    return this.prisma.childProfile.deleteMany({
      where: {
        id: childId,
        parentId,
      },
    });

    // Option 2: Soft delete (recommended for production)
    // return this.prisma.childProfile.updateMany({
    //   where: {
    //     id: childId,
    //     userId: parentId,
    //   },
    //   data: {
    //     isArchived: true,
    //     archivedAt: new Date(),
    //   },
    // });
  }

  /**
   * Count profiles for a parent
   * @param parentId - Parent user ID
   * @returns Number of active profiles
   */
  async countProfilesForParent(parentId: number): Promise<number> {
    return this.prisma.childProfile.count({
      where: {
        parentId: parentId,
        deletedAt: null,
      },
    });
  }

  /**
   * Get currently active profile for parent
   * Active profile is stored in User.activeChildId
   * @param parentId - Parent user ID
   * @returns Active child profile or null
   */
  async getActiveProfile(parentId: number) {
    const users = await this.prisma.$queryRawUnsafe<
      Array<{
        activeChildId: number | null;
      }>
    >('SELECT "activeChildId" FROM "User" WHERE "id" = $1 LIMIT 1', parentId);

    const activeChildId = users[0]?.activeChildId;
    if (!activeChildId) {
      return null;
    }

    return this.prisma.childProfile.findFirst({
      where: {
        id: activeChildId,
        parentId,
        deletedAt: null,
      },
      include: {
        badges: true,
      },
    });
  }

  /**
   * Switch active child profile
   * Updates User.activeChildId to point to selected child
   * @param parentId - Parent user ID
   * @param childId - Child profile ID to activate
   * @returns Updated user record
   */
  async switchActiveProfile(parentId: number, childId: number) {
    // Verify child profile belongs to parent
    const childProfile = await this.getProfileById(childId, parentId);
    if (!childProfile) {
      throw new Error("Child profile not found or not owned by parent");
    }

    // CRITICAL FIX: Actually update User.activeChildId in database
    await this.prisma.$executeRawUnsafe(
      'UPDATE "User" SET "activeChildId" = $1, "updatedAt" = NOW() WHERE "id" = $2',
      childId,
      parentId,
    );

    return childProfile;
  }

  /**
   * Update last activity timestamp
   * Called when child uses the app
   * @param childId - Child profile ID
   */
  async updateLastActivity(childId: number) {
    return this.prisma.childProfile.update({
      where: { id: childId },
      data: {
        lastLearnDate: new Date(),
      },
    });
  }

  /**
   * Get default avatar URL based on age
   * @param age - Child age
   * @returns Default avatar URL
   */
  private getDefaultAvatarUrl(age: number): string {
    // Age-appropriate default avatars
    if (age <= 6) {
      return "https://cdn.edukids.com/avatars/default-young.png";
    } else if (age <= 9) {
      return "https://cdn.edukids.com/avatars/default-middle.png";
    } else {
      return "https://cdn.edukids.com/avatars/default-older.png";
    }
  }

  /**
   * Calculate current level from total points
   * Level = floor(totalPoints / 50) + 1
   * @param totalPoints - Total star points
   * @returns Current level
   */
  calculateLevel(totalPoints: number): number {
    return Math.floor(totalPoints / 50) + 1;
  }
}
