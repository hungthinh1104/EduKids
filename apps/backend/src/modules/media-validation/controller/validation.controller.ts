import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import {
  ContentValidationRequestDto,
  ContentValidationResponseDto,
  ApprovalRequestDto,
  ApprovalResponseDto,
  BatchValidationRequestDto,
  BatchValidationResponseDto,
} from "../dto/validation.dto";
import { ContentValidationService } from "../service/content-validation.service";
import { ApprovalService } from "../service/approval.service";
import { PreviewService } from "../service/preview.service";

/**
 * Media Validation Controller
 * REST API for content validation, preview, and approval workflows
 * All endpoints require admin/moderator roles
 */
@ApiTags("Media Validation & Approval")
@ApiBearerAuth("JWT")
@Controller("media/validation")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ValidationController {
  private readonly logger = new Logger(ValidationController.name);

  constructor(
    private contentValidationService: ContentValidationService,
    private approvalService: ApprovalService,
    private previewService: PreviewService,
  ) {}

  private getActorId(user: any): string {
    const actorId = user?.userId ?? user?.sub ?? user?.id;
    if (!actorId) {
      throw new UnauthorizedException("Invalid JWT payload");
    }
    return String(actorId);
  }

  /**
   * Validate single content item
   * POST /media/validation/validate
   */
  @Post("validate")
  @Roles("admin", "moderator", "content_reviewer")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Validate single content item",
    description:
      "Validates content for safety issues (profanity, violence, explicit content, etc.)",
  })
  @ApiResponse({
    status: 200,
    description: "Validation completed successfully",
    type: ContentValidationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid request parameters",
  })
  async validateContent(
    @Body() request: ContentValidationRequestDto,
    @CurrentUser() user: any,
  ): Promise<ContentValidationResponseDto> {
    const actorId = this.getActorId(user);
    this.logger.log(
      `Validating content ${request.contentId} by user ${actorId}`,
    );

    return this.contentValidationService.validateContent(request);
  }

  /**
   * Batch validate multiple content items
   * POST /media/validation/validate-batch
   */
  @Post("validate-batch")
  @Roles("admin", "moderator")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Batch validate content items",
    description:
      "Validates multiple content items in a single request (max 50)",
  })
  @ApiResponse({
    status: 200,
    description: "Batch validation completed",
    type: BatchValidationResponseDto,
  })
  async batchValidateContent(
    @Body() request: BatchValidationRequestDto,
    @CurrentUser() user: any,
  ): Promise<BatchValidationResponseDto> {
    const actorId = this.getActorId(user);
    this.logger.log(
      `Batch validating ${request.items.length} items by user ${actorId}`,
    );

    const results = await this.contentValidationService.batchValidateContent(
      request.items,
    );

    return {
      batchId: `batch:${Date.now()}`,
      totalItems: request.items.length,
      successCount: results.filter((r) => r.isApproved).length,
      results,
      completedAt: new Date().toISOString(),
    };
  }

  /**
   * Get validation result
   * GET /media/validation/:validationId
   */
  @Get(":validationId")
  @Roles("admin", "moderator", "content_reviewer")
  @ApiOperation({
    summary: "Get validation result by ID",
    description:
      "Retrieve a specific validation result with all detected flags",
  })
  @ApiParam({
    name: "validationId",
    description: "Validation result ID",
    example: "v123-uuid",
  })
  @ApiResponse({
    status: 200,
    description: "Validation result found",
    type: ContentValidationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Validation result not found",
  })
  async getValidationResult(
    @Param("validationId") validationId: string,
  ): Promise<ContentValidationResponseDto | null> {
    this.logger.log(`Retrieving validation result: ${validationId}`);

    return this.contentValidationService.getValidationResult(validationId);
  }

  /**
   * Get validation history for content
   * GET /media/validation/content/:contentId/history
   */
  @Get("content/:contentId/history")
  @Roles("admin", "moderator", "content_reviewer")
  @ApiOperation({
    summary: "Get validation history for content",
    description: "Retrieve all validation results for a specific content item",
  })
  @ApiParam({
    name: "contentId",
    description: "Content ID to retrieve history for",
  })
  @ApiQuery({
    name: "limit",
    description: "Maximum number of results to return",
    required: false,
    example: 10,
  })
  async getContentValidationHistory(
    @Param("contentId") contentId: string,
    @Query("limit") limit?: string,
  ) {
    this.logger.log(`Retrieving validation history for content: ${contentId}`);

    return this.contentValidationService.getContentValidationHistory(
      contentId,
      limit ? parseInt(limit) : 10,
    );
  }

  /**
   * Get preview for content
   * GET /media/validation/:contentId/preview
   */
  @Get(":contentId/preview")
  @Roles("admin", "moderator", "content_reviewer")
  @ApiOperation({
    summary: "Get watermarked preview for content",
    description:
      "Generates and returns a watermarked preview (for admin review only)",
  })
  @ApiParam({
    name: "contentId",
    description: "Content ID to preview",
  })
  async getContentPreview(
    @Param("contentId") contentId: string,
    @CurrentUser() user: any,
  ) {
    const actorId = this.getActorId(user);
    this.logger.log(
      `Generating preview for content ${contentId} for user ${actorId}`,
    );

    // In production: Fetch content from database
    // For now, mock data
    return this.previewService.generatePreview(
      contentId,
      "Sample Content Title",
      "Sample description for preview",
      "https://via.placeholder.com/400x300",
    );
  }

  /**
   * Approve content
   * POST /media/validation/:contentId/approve
   */
  @Post(":contentId/approve")
  @Roles("admin", "moderator")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Approve content for publishing",
    description: "Approves content and schedules for publishing",
  })
  @ApiParam({
    name: "contentId",
    description: "Content ID to approve",
  })
  @ApiResponse({
    status: 200,
    description: "Content approved successfully",
    type: ApprovalResponseDto,
  })
  async approveContent(
    @Param("contentId") contentId: string,
    @Body() request: ApprovalRequestDto,
    @CurrentUser() user: any,
  ): Promise<ApprovalResponseDto> {
    const actorId = this.getActorId(user);
    this.logger.log(`Approving content ${contentId} by user ${actorId}`);

    return this.approvalService.approveContent({
      ...request,
      contentId,
      approvedBy: actorId,
    });
  }

  /**
   * Conditionally approve content
   * POST /media/validation/:contentId/conditional-approve
   */
  @Post(":contentId/conditional-approve")
  @Roles("admin", "moderator")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Conditionally approve content",
    description:
      "Approves content with conditions that must be met before publishing",
  })
  @ApiParam({
    name: "contentId",
    description: "Content ID to conditionally approve",
  })
  async conditionalApproveContent(
    @Param("contentId") contentId: string,
    @Body() request: ApprovalRequestDto,
    @CurrentUser() user: any,
  ): Promise<ApprovalResponseDto> {
    const actorId = this.getActorId(user);
    this.logger.log(
      `Conditional approval for content ${contentId} by user ${actorId}`,
    );

    return this.approvalService.conditionalApprove({
      ...request,
      contentId,
      approvedBy: actorId,
    });
  }

  /**
   * Reject content
   * POST /media/validation/:contentId/reject
   */
  @Post(":contentId/reject")
  @Roles("admin", "moderator")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Reject content",
    description: "Rejects content with reasons and notifies creator",
  })
  @ApiParam({
    name: "contentId",
    description: "Content ID to reject",
  })
  async rejectContent(
    @Param("contentId") contentId: string,
    @Body()
    body: { reason: string; flaggedIssues?: string[]; canResubmit?: boolean },
    @CurrentUser() user: any,
  ) {
    const actorId = this.getActorId(user);
    this.logger.log(`Rejecting content ${contentId} by user ${actorId}`);

    return this.approvalService.rejectContent(
      contentId,
      body.reason,
      body.flaggedIssues || [],
      actorId,
      body.canResubmit !== false,
    );
  }

  /**
   * Get auto-flagged content
   * GET /media/validation/flagged/list
   */
  @Get("flagged/list")
  @Roles("admin", "moderator")
  @ApiOperation({
    summary: "Get auto-flagged content",
    description:
      "Retrieve content that was automatically flagged for safety issues",
  })
  @ApiQuery({
    name: "limit",
    description: "Maximum number of results",
    required: false,
    example: 50,
  })
  async getAutoFlaggedContent(@Query("limit") limit?: string) {
    this.logger.log("Retrieving auto-flagged content");

    return this.contentValidationService.getAutoFlaggedContent(
      limit ? parseInt(limit) : 50,
    );
  }

  /**
   * Get pending approvals
   * GET /media/validation/pending/list
   */
  @Get("pending/list")
  @Roles("admin", "moderator")
  @ApiOperation({
    summary: "Get pending approvals",
    description: "Retrieve content awaiting admin review",
  })
  @ApiQuery({
    name: "limit",
    description: "Maximum number of results",
    required: false,
    example: 50,
  })
  async getPendingApprovals(@Query("limit") limit?: string) {
    this.logger.log("Retrieving pending approvals");

    return this.approvalService.getPendingApprovals(
      limit ? parseInt(limit) : 50,
    );
  }

  /**
   * Get validation statistics
   * GET /media/validation/stats
   */
  @Get("stats")
  @Roles("admin")
  @ApiOperation({
    summary: "Get validation statistics",
    description: "Retrieve overall validation and approval statistics",
  })
  async getValidationStats() {
    this.logger.log("Retrieving validation statistics");

    const validationStats =
      await this.contentValidationService.getValidationStats();
    const approvalStats = await this.approvalService.getApprovalStats();

    return {
      validation: validationStats,
      approval: approvalStats,
      retrievedAt: new Date().toISOString(),
    };
  }

  /**
   * Get approval history
   * GET /media/validation/:contentId/approvals
   */
  @Get(":contentId/approvals")
  @Roles("admin", "moderator", "content_reviewer")
  @ApiOperation({
    summary: "Get approval history for content",
    description: "Retrieve all approval/rejection history for a content item",
  })
  async getApprovalHistory(@Param("contentId") contentId: string) {
    this.logger.log(`Retrieving approval history for ${contentId}`);

    const approvals = await this.approvalService.getApprovalHistory(contentId);
    const rejections =
      await this.approvalService.getRejectionHistory(contentId);

    return {
      contentId,
      approvals,
      rejections,
      totalReviews: approvals.length + rejections.length,
    };
  }

  /**
   * Bulk approve content
   * POST /media/validation/bulk-approve
   */
  @Post("bulk-approve")
  @Roles("admin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Bulk approve multiple content items",
    description: "Approves multiple content items in a single request",
  })
  async bulkApproveContent(
    @Body() body: { contentIds: string[]; comments?: string },
    @CurrentUser() user: any,
  ) {
    const actorId = this.getActorId(user);
    this.logger.log(
      `Bulk approving ${body.contentIds.length} items by user ${actorId}`,
    );

    return this.approvalService.bulkApprove(
      body.contentIds,
      actorId,
      body.comments,
    );
  }

  /**
   * Bulk reject content
   * POST /media/validation/bulk-reject
   */
  @Post("bulk-reject")
  @Roles("admin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Bulk reject multiple content items",
    description: "Rejects multiple content items in a single request",
  })
  async bulkRejectContent(
    @Body() body: { contentIds: string[]; reason: string },
    @CurrentUser() user: any,
  ) {
    const actorId = this.getActorId(user);
    this.logger.log(
      `Bulk rejecting ${body.contentIds.length} items by user ${actorId}`,
    );

    return this.approvalService.bulkReject(
      body.contentIds,
      body.reason,
      actorId,
    );
  }

  /**
   * Health check endpoint
   * GET /media/validation/health
   */
  @Get("health")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Health check",
    description: "Verify validation service is operational",
  })
  async healthCheck() {
    return {
      status: "healthy",
      service: "media-validation",
      timestamp: new Date().toISOString(),
    };
  }
}
