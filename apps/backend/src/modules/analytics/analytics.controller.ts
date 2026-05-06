import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';
import {
  AnalyticsQueryDto,
  AnalyticsOverviewDto,
  LearningTimeDto,
  VocabularyRetentionDto,
  PronunciationAccuracyDto,
  QuizPerformanceDto,
  GamificationProgressDto,
  NoDataResponseDto,
  AnalyticsPeriod,
} from './analytics.dto';

/**
 * UC-07: View AI Analytics Dashboard
 * Parent views charts of learning time, vocabulary, pronunciation accuracy
 */
@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
  ) {}

  private getParentId(req: any): number {
    const parentId = req?.user?.userId ?? req?.user?.sub;
    if (!parentId) {
      throw new UnauthorizedException('Invalid JWT payload');
    }
    return parentId;
  }

  /**
   * Get complete analytics overview (UC-07 Main Action)
    * GET /api/analytics/overview
   */
  @Get('overview')
  @Roles('PARENT')
  @ApiOperation({
    summary: 'Get complete analytics overview for child',
    description:
      'Parent views visualized analytics including learning time, vocabulary retention, pronunciation accuracy, quiz performance, and gamification progress.',
  })
  @ApiQuery({
    name: 'period',
    enum: AnalyticsPeriod,
    required: false,
    description: 'Time period for analytics (default: WEEK)',
  })
  @ApiQuery({
    name: 'childId',
    type: Number,
    required: false,
    description:
      'Child profile ID (optional, uses active profile if not provided)',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics overview with all metrics',
    type: AnalyticsOverviewDto,
  })
  @ApiResponse({
    status: 200,
    description: 'No data available for child',
    type: NoDataResponseDto,
    schema: {
      example: {
        hasData: false,
        message: 'No data yet – encourage your child to learn! 🌟',
        childId: 1,
        childNickname: 'Alice',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only PARENT role can view analytics',
  })
  @ApiResponse({
    status: 404,
    description: 'Child profile not found or parent does not have permission',
  })
  async getAnalyticsOverview(
    @Query() query: AnalyticsQueryDto,
    @Request() req: any,
  ): Promise<AnalyticsOverviewDto | NoDataResponseDto> {
    const parentId = this.getParentId(req);
    const childId = query.childId || (await this.analyticsService.resolveChildId(parentId));
    const period = query.period || AnalyticsPeriod.WEEK;

    return this.analyticsService.getAnalyticsOverview(
      childId,
      parentId,
      period,
    );
  }

  /**
   * Get learning time analytics
    * GET /api/analytics/learning-time
   */
  @Get('learning-time')
  @Roles('PARENT')
  @ApiOperation({
    summary: 'Get learning time analytics',
    description:
      'View total minutes learned, average session time, days active, and current streak with daily chart data.',
  })
  @ApiQuery({
    name: 'period',
    enum: AnalyticsPeriod,
    required: false,
  })
  @ApiQuery({
    name: 'childId',
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Learning time metrics with chart data',
    type: LearningTimeDto,
  })
  @ApiResponse({
    status: 200,
    description: 'No data available',
    type: NoDataResponseDto,
  })
  async getLearningTime(
    @Query() query: AnalyticsQueryDto,
    @Request() req: any,
  ): Promise<LearningTimeDto | NoDataResponseDto> {
    const parentId = this.getParentId(req);
    const childId = query.childId || (await this.analyticsService.resolveChildId(parentId));
    const period = query.period || AnalyticsPeriod.WEEK;

    return this.analyticsService.getLearningTime(childId, parentId, period);
  }

  /**
   * Get vocabulary retention analytics
    * GET /api/analytics/vocabulary
   */
  @Get('vocabulary')
  @Roles('PARENT')
  @ApiOperation({
    summary: 'Get vocabulary retention analytics',
    description:
      'View total words encountered, words mastered, retention rate, and vocabulary breakdown by mastery level.',
  })
  @ApiQuery({
    name: 'period',
    enum: AnalyticsPeriod,
    required: false,
  })
  @ApiQuery({
    name: 'childId',
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Vocabulary retention metrics with chart data',
    type: VocabularyRetentionDto,
  })
  @ApiResponse({
    status: 200,
    description: 'No data available',
    type: NoDataResponseDto,
  })
  async getVocabularyRetention(
    @Query() query: AnalyticsQueryDto,
    @Request() req: any,
  ): Promise<VocabularyRetentionDto | NoDataResponseDto> {
    const parentId = this.getParentId(req);
    const childId = query.childId || (await this.analyticsService.resolveChildId(parentId));
    const period = query.period || AnalyticsPeriod.WEEK;

    return this.analyticsService.getVocabularyRetention(
      childId,
      parentId,
      period,
    );
  }

  /**
   * Get pronunciation accuracy analytics
    * GET /api/analytics/pronunciation
   */
  @Get('pronunciation')
  @Roles('PARENT')
  @ApiOperation({
    summary: 'Get pronunciation accuracy analytics',
    description:
      'View average pronunciation accuracy, total practices, most improved words, and words needing more practice.',
  })
  @ApiQuery({
    name: 'period',
    enum: AnalyticsPeriod,
    required: false,
  })
  @ApiQuery({
    name: 'childId',
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Pronunciation accuracy metrics with chart data',
    type: PronunciationAccuracyDto,
  })
  @ApiResponse({
    status: 200,
    description: 'No data available',
    type: NoDataResponseDto,
  })
  async getPronunciationAccuracy(
    @Query() query: AnalyticsQueryDto,
    @Request() req: any,
  ): Promise<PronunciationAccuracyDto | NoDataResponseDto> {
    const parentId = this.getParentId(req);
    const childId = query.childId || (await this.analyticsService.resolveChildId(parentId));
    const period = query.period || AnalyticsPeriod.WEEK;

    return this.analyticsService.getPronunciationAccuracy(
      childId,
      parentId,
      period,
    );
  }

  /**
   * Get quiz performance analytics
    * GET /api/analytics/quiz
   */
  @Get('quiz')
  @Roles('PARENT')
  @ApiOperation({
    summary: 'Get quiz performance analytics',
    description:
      'View total quizzes completed, average score, highest score, quizzes passed, and performance breakdown by difficulty level.',
  })
  @ApiQuery({
    name: 'period',
    enum: AnalyticsPeriod,
    required: false,
  })
  @ApiQuery({
    name: 'childId',
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz performance metrics with chart data',
    type: QuizPerformanceDto,
  })
  @ApiResponse({
    status: 200,
    description: 'No data available',
    type: NoDataResponseDto,
  })
  async getQuizPerformance(
    @Query() query: AnalyticsQueryDto,
    @Request() req: any,
  ): Promise<QuizPerformanceDto | NoDataResponseDto> {
    const parentId = this.getParentId(req);
    const childId = query.childId || (await this.analyticsService.resolveChildId(parentId));
    const period = query.period || AnalyticsPeriod.WEEK;

    return this.analyticsService.getQuizPerformance(childId, parentId, period);
  }

  /**
   * Get gamification progress analytics
    * GET /api/analytics/gamification
   */
  @Get('gamification')
  @Roles('PARENT')
  @ApiOperation({
    summary: 'Get gamification progress analytics',
    description:
      'View total points earned, current level, badges earned, items purchased, and recent badge achievements.',
  })
  @ApiQuery({
    name: 'period',
    enum: AnalyticsPeriod,
    required: false,
  })
  @ApiQuery({
    name: 'childId',
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Gamification progress metrics with chart data',
    type: GamificationProgressDto,
  })
  @ApiResponse({
    status: 200,
    description: 'No data available',
    type: NoDataResponseDto,
  })
  async getGamificationProgress(
    @Query() query: AnalyticsQueryDto,
    @Request() req: any,
  ): Promise<GamificationProgressDto | NoDataResponseDto> {
    const parentId = this.getParentId(req);
    const childId = query.childId || (await this.analyticsService.resolveChildId(parentId));
    const period = query.period || AnalyticsPeriod.WEEK;

    return this.analyticsService.getGamificationProgress(
      childId,
      parentId,
      period,
    );
  }

}
