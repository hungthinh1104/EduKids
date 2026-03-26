import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  NotFoundException,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RecommendationService } from './recommendation.service';
import {
  RecommendationsListDto,
  ApplyRecommendationDto,
  ApplyRecommendationResultDto,
  RecommendationFeedbackDto,
  RecommendationStatisticsDto,
  DismissRecommendationsDto,
  DismissResultDto,
  AppliedLearningPathDto,
} from './recommendation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Recommendation Controller
 * Manages AI-powered learning path recommendations
 * Parents view and apply personalized learning suggestions
 */
@ApiTags('Recommendations')
@ApiBearerAuth('JWT-auth')
@Controller('recommendations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecommendationController {
  constructor(
    private readonly recommendationService: RecommendationService,
    private readonly prisma: PrismaService,
  ) {}

  private async assertChildOwnership(childId: number, parentId: number): Promise<void> {
    const childProfile = await this.prisma.childProfile.findFirst({
      where: {
        id: childId,
        parentId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!childProfile) {
      throw new NotFoundException('Child profile not found');
    }
  }

  /**
   * Get recommendations for a child
   * @param childId - Child profile ID
   * @param parentId - Parent ID from JWT (for authorization)
   * @returns List of recommendations with metadata
   */
  @Get('child/:childId')
  @Roles('PARENT')
  @ApiOperation({ summary: 'Get personalized recommendations for child' })
  @ApiParam({
    name: 'childId',
    type: Number,
    description: 'Child profile ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Recommendations retrieved',
    type: RecommendationsListDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid child ID',
  })
  async getRecommendations(
    @Param('childId') childIdStr: string,
    @CurrentUser('id') parentId: number,
  ): Promise<RecommendationsListDto> {
    const childId = parseInt(childIdStr);
    if (isNaN(childId)) {
      throw new BadRequestException('Invalid child ID');
    }

    await this.assertChildOwnership(childId, parentId);
    return this.recommendationService.getRecommendations(childId);
  }

  /**
   * Apply a recommendation
   * Creates active learning path for child
   * @param childId - Child profile ID
   * @param dto - Recommendation to apply
   * @param parentId - Parent ID from JWT
   * @returns Applied path with progress tracking
   */
  @Post('child/:childId/apply')
  @Roles('PARENT')
  @HttpCode(201)
  @ApiOperation({ summary: 'Apply a recommendation to create learning path' })
  @ApiParam({
    name: 'childId',
    type: Number,
    description: 'Child profile ID',
  })
  @ApiResponse({
    status: 201,
    description: 'Recommendation applied successfully',
    type: ApplyRecommendationResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid recommendation ID or child ID',
  })
  @ApiResponse({
    status: 404,
    description: 'Recommendation not found',
  })
  async applyRecommendation(
    @Param('childId') childIdStr: string,
    @Body() dto: ApplyRecommendationDto,
    @CurrentUser('id') parentId: number,
  ): Promise<ApplyRecommendationResultDto> {
    const childId = parseInt(childIdStr);
    if (isNaN(childId)) {
      throw new BadRequestException('Invalid child ID');
    }

    await this.assertChildOwnership(childId, parentId);

    try {
      return await this.recommendationService.applyRecommendation(
        childId,
        dto.recommendationId,
        dto.parentNotes,
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundException('Recommendation not found');
      }
      throw error;
    }
  }

  /**
   * Get applied learning paths for a child
   * Shows active and completed paths
   * @param childId - Child profile ID
   * @param parentId - Parent ID from JWT
   * @returns List of applied paths
   */
  @Get('child/:childId/applied-paths')
  @Roles('PARENT')
  @ApiOperation({ summary: 'Get applied learning paths for child' })
  @ApiParam({
    name: 'childId',
    type: Number,
    description: 'Child profile ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Applied paths retrieved',
    type: [AppliedLearningPathDto],
  })
  async getAppliedPaths(
    @Param('childId') childIdStr: string,
    @CurrentUser('id') parentId: number,
  ): Promise<AppliedLearningPathDto[]> {
    const childId = parseInt(childIdStr);
    if (isNaN(childId)) {
      throw new BadRequestException('Invalid child ID');
    }

    await this.assertChildOwnership(childId, parentId);
    return this.recommendationService.getAppliedPaths(childId);
  }

  /**
   * Get recommendation statistics for a child
   * Shows adoption rate, completion rate, feedback
   * @param childId - Child profile ID
   * @param parentId - Parent ID from JWT
   * @returns Statistics on recommendations
   */
  @Get('child/:childId/statistics')
  @Roles('PARENT')
  @ApiOperation({ summary: 'Get recommendation statistics for child' })
  @ApiParam({
    name: 'childId',
    type: Number,
    description: 'Child profile ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved',
    type: RecommendationStatisticsDto,
  })
  async getStatistics(
    @Param('childId') childIdStr: string,
    @CurrentUser('id') parentId: number,
  ): Promise<RecommendationStatisticsDto> {
    const childId = parseInt(childIdStr);
    if (isNaN(childId)) {
      throw new BadRequestException('Invalid child ID');
    }

    await this.assertChildOwnership(childId, parentId);
    return this.recommendationService.getStatistics(childId);
  }

  /**
   * Get recommendation insights
   * Parent-friendly summary with actionable suggestions
   * @param childId - Child profile ID
   * @param parentId - Parent ID from JWT
   * @returns Insights and health score
   */
  @Get('child/:childId/insights')
  @Roles('PARENT')
  @ApiOperation({ summary: 'Get insights and health score' })
  @ApiParam({
    name: 'childId',
    type: Number,
    description: 'Child profile ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Insights retrieved',
  })
  async getInsights(
    @Param('childId') childIdStr: string,
    @CurrentUser('id') parentId: number,
  ) {
    const childId = parseInt(childIdStr);
    if (isNaN(childId)) {
      throw new BadRequestException('Invalid child ID');
    }

    await this.assertChildOwnership(childId, parentId);
    return this.recommendationService.getInsights(childId);
  }

  /**
   * Submit feedback on a recommendation
   * Helps improve recommendation quality
   * @param childId - Child profile ID
   * @param dto - Feedback data
   * @param parentId - Parent ID from JWT
   */
  @Post('child/:childId/feedback')
  @Roles('PARENT')
  @HttpCode(200)
  @ApiOperation({ summary: 'Submit feedback on a recommendation' })
  @ApiParam({
    name: 'childId',
    type: Number,
    description: 'Child profile ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Feedback submitted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid feedback data',
  })
  async submitFeedback(
    @Param('childId') childIdStr: string,
    @Body() dto: RecommendationFeedbackDto,
    @CurrentUser('id') parentId: number,
  ) {
    const childId = parseInt(childIdStr);
    if (isNaN(childId)) {
      throw new BadRequestException('Invalid child ID');
    }

    await this.assertChildOwnership(childId, parentId);

    await this.recommendationService.saveFeedback(
      childId,
      dto.recommendationId,
      dto.rating,
      dto.isHelpful,
      dto.feedback,
    );

    return {
      success: true,
      message: 'Feedback submitted successfully',
    };
  }

  /**
   * Dismiss recommendations
   * Parent can dismiss irrelevant suggestions
   * @param childId - Child profile ID
   * @param dto - Recommendations to dismiss
   * @param parentId - Parent ID from JWT
   * @returns Dismiss result
   */
  @Post('child/:childId/dismiss')
  @Roles('PARENT')
  @HttpCode(200)
  @ApiOperation({ summary: 'Dismiss recommendations' })
  @ApiParam({
    name: 'childId',
    type: Number,
    description: 'Child profile ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Recommendations dismissed',
    type: DismissResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  async dismissRecommendations(
    @Param('childId') childIdStr: string,
    @Body() dto: DismissRecommendationsDto,
    @CurrentUser('id') parentId: number,
  ): Promise<DismissResultDto> {
    const childId = parseInt(childIdStr);
    if (isNaN(childId)) {
      throw new BadRequestException('Invalid child ID');
    }

    if (!dto.recommendationIds || dto.recommendationIds.length === 0) {
      throw new BadRequestException('No recommendations to dismiss');
    }

    await this.assertChildOwnership(childId, parentId);

    return this.recommendationService.dismissRecommendations(
      childId,
      dto.recommendationIds,
    );
  }

  /**
   * Regenerate recommendations
   * Parent can request fresh suggestions
   * @param childId - Child profile ID
   * @param parentId - Parent ID from JWT
   * @returns New recommendations
   */
  @Post('child/:childId/regenerate')
  @Roles('PARENT')
  @HttpCode(201)
  @ApiOperation({ summary: 'Regenerate recommendations for child' })
  @ApiParam({
    name: 'childId',
    type: Number,
    description: 'Child profile ID',
  })
  @ApiResponse({
    status: 201,
    description: 'Recommendations regenerated',
    type: RecommendationsListDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid child ID',
  })
  async regenerateRecommendations(
    @Param('childId') childIdStr: string,
    @CurrentUser('id') parentId: number,
  ): Promise<RecommendationsListDto> {
    const childId = parseInt(childIdStr);
    if (isNaN(childId)) {
      throw new BadRequestException('Invalid child ID');
    }

    await this.assertChildOwnership(childId, parentId);

    return this.recommendationService.regenerateRecommendations(childId);
  }

  @Post('child/:childId/regenerate-gemini')
  @Roles('PARENT')
  @HttpCode(201)
  @ApiOperation({ summary: 'Regenerate recommendations using Gemini API' })
  @ApiParam({
    name: 'childId',
    type: Number,
    description: 'Child profile ID',
  })
  @ApiResponse({
    status: 201,
    description: 'Gemini recommendations regenerated',
    type: RecommendationsListDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid child ID',
  })
  async regenerateRecommendationsWithGemini(
    @Param('childId') childIdStr: string,
    @CurrentUser('id') parentId: number,
  ): Promise<RecommendationsListDto> {
    const childId = parseInt(childIdStr);
    if (isNaN(childId)) {
      throw new BadRequestException('Invalid child ID');
    }

    await this.assertChildOwnership(childId, parentId);

    return this.recommendationService.regenerateRecommendationsWithGemini(childId);
  }
}
