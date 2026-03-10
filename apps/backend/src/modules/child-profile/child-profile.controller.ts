import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  NotFoundException,
} from "@nestjs/common";
import { Request as ExpressRequest } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { ChildProfileService } from "./child-profile.service";
import {
  CreateChildProfileDto,
  UpdateChildProfileDto,
  SwitchChildProfileDto,
  ChildProfileDto,
  ProfileListDto,
  ProfileActionResultDto,
  DeleteProfileResultDto,
} from "./child-profile.dto";

/**
 * UC-06: Manage Multi-Child Profiles
 * Parent creates and switches between multiple child profiles
 */
@ApiTags("Child Profiles")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("profiles")
export class ChildProfileController {
  constructor(private readonly childProfileService: ChildProfileService) {}

  private getUser(req: RequestWithUser): AuthUser {
    return req.user;
  }

  /**
   * Create a new child profile
   * POST /api/v1/profiles
   */
  @Post()
  @Roles("PARENT")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create new child profile",
    description:
      "Parent creates a new child profile with nickname and age. Maximum 5 profiles per parent.",
  })
  @ApiResponse({
    status: 201,
    description: "Profile created successfully",
    type: ProfileActionResultDto,
  })
  @ApiResponse({
    status: 400,
    description: "Validation error or max profiles limit reached",
    schema: {
      example: {
        statusCode: 400,
        message:
          "You can only create up to 5 child profiles. Please delete an existing profile to add a new one.",
        data: null,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Only PARENT role can create profiles",
  })
  async createProfile(
    @Body() dto: CreateChildProfileDto,
    @Request() req: RequestWithUser,
  ): Promise<ProfileActionResultDto> {
    const parentId = this.getUser(req).userId;
    return this.childProfileService.createProfile(parentId, dto);
  }

  /**
   * Get all child profiles for parent
   * GET /api/v1/profiles
   */
  @Get()
  @Roles("PARENT")
  @ApiOperation({
    summary: "Get all child profiles",
    description:
      "Retrieve all child profiles linked to parent account. Shows active profile indicator.",
  })
  @ApiResponse({
    status: 200,
    description: "List of child profiles",
    type: ProfileListDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  async getAllProfiles(
    @Request() req: RequestWithUser,
  ): Promise<ProfileListDto> {
    const parentId = this.getUser(req).userId;
    return this.childProfileService.getAllProfiles(parentId);
  }

  /**
   * Get a single child profile by ID
   * GET /api/v1/profiles/:id
   */
  @Get(":id")
  @Roles("PARENT")
  @ApiOperation({
    summary: "Get child profile by ID",
    description:
      "Retrieve detailed information about a specific child profile.",
  })
  @ApiParam({
    name: "id",
    description: "Child profile ID",
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "Child profile details",
    type: ChildProfileDto,
  })
  @ApiResponse({
    status: 404,
    description: "Profile not found or parent does not have permission",
    schema: {
      example: {
        statusCode: 404,
        message:
          "Child profile with ID 1 not found or you don't have permission to access it.",
        data: null,
      },
    },
  })
  async getProfileById(
    @Param("id", ParseIntPipe) childId: number,
    @Request() req: RequestWithUser,
  ): Promise<ChildProfileDto> {
    const parentId = this.getUser(req).userId;
    return this.childProfileService.getProfileById(childId, parentId);
  }

  /**
   * Update child profile details
   * PUT /api/v1/profiles/:id
   */
  @Put(":id")
  @Roles("PARENT")
  @ApiOperation({
    summary: "Update child profile",
    description:
      "Update nickname, age, or avatar URL of existing child profile.",
  })
  @ApiParam({
    name: "id",
    description: "Child profile ID",
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "Profile updated successfully",
    type: ProfileActionResultDto,
  })
  @ApiResponse({
    status: 404,
    description: "Profile not found or parent does not have permission",
  })
  async updateProfile(
    @Param("id", ParseIntPipe) childId: number,
    @Body() dto: UpdateChildProfileDto,
    @Request() req: RequestWithUser,
  ): Promise<ProfileActionResultDto> {
    const parentId = this.getUser(req).userId;
    return this.childProfileService.updateProfile(childId, parentId, dto);
  }

  /**
   * Delete child profile
   * DELETE /api/v1/profiles/:id
   */
  @Delete(":id")
  @Roles("PARENT")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Delete child profile",
    description:
      "Delete a child profile. Cannot delete if it is the only profile. If deleted profile was active, automatically switches to first available profile.",
  })
  @ApiParam({
    name: "id",
    description: "Child profile ID",
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "Profile deleted successfully",
    type: DeleteProfileResultDto,
  })
  @ApiResponse({
    status: 400,
    description: "Cannot delete the only child profile",
    schema: {
      example: {
        statusCode: 400,
        message:
          "Cannot delete the only child profile. You must have at least one profile.",
        data: null,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Profile not found or parent does not have permission",
  })
  async deleteProfile(
    @Param("id", ParseIntPipe) childId: number,
    @Request() req: RequestWithUser,
  ): Promise<DeleteProfileResultDto> {
    const parentId = this.getUser(req).userId;
    return this.childProfileService.deleteProfile(childId, parentId);
  }

  /**
   * Switch active child profile (UC-06 Main Action)
   * POST /api/v1/profiles/switch
   */
  @Post("switch")
  @Roles("PARENT")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Switch active child profile",
    description:
      "Change which child profile is currently active for learning activities. Updates User.activeChildId.",
  })
  @ApiResponse({
    status: 200,
    description: "Profile switched successfully",
    type: ProfileActionResultDto,
  })
  @ApiResponse({
    status: 404,
    description: "Profile not found or parent does not have permission",
  })
  async switchProfile(
    @Body() dto: SwitchChildProfileDto,
    @Request() req: RequestWithUser,
  ): Promise<ProfileActionResultDto> {
    const parentId = this.getUser(req).userId;
    return this.childProfileService.switchProfile(parentId, dto.childId);
  }

  /**
   * Get currently active profile
   * GET /api/v1/profiles/active
   */
  @Get("active/current")
  @Roles("PARENT", "LEARNER")
  @ApiOperation({
    summary: "Get active child profile",
    description:
      "Retrieve the currently active child profile for learning activities.",
  })
  @ApiResponse({
    status: 200,
    description: "Active child profile",
    type: ChildProfileDto,
  })
  @ApiResponse({
    status: 404,
    description: "No active profile found - parent should select one",
    schema: {
      example: {
        statusCode: 404,
        message: "No active profile found. Please select a child profile.",
        data: null,
      },
    },
  })
  async getActiveProfile(
    @Request() req: RequestWithUser,
  ): Promise<ChildProfileDto> {
    const { userId, role: userRole, childId } = this.getUser(req);

    let activeProfile;

    if (userRole === "LEARNER" && childId) {
      // For LEARNER role, get the profile directly from childId in JWT
      activeProfile = await this.childProfileService.getProfileById(
        childId,
        userId,
      );
    } else {
      // For PARENT role, get the active profile from User.activeChildId
      activeProfile = await this.childProfileService.getActiveProfile(userId);
    }

    if (!activeProfile) {
      throw new NotFoundException(
        "No active profile found. Please select a child profile.",
      );
    }

    return activeProfile;
  }
}

type AuthUser = {
  userId: number;
  role?: "PARENT" | "LEARNER" | string;
  childId?: number;
};

type RequestWithUser = ExpressRequest & {
  user: AuthUser;
};
