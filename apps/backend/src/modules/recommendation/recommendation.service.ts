import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { SentryTraced } from '@sentry/nestjs';
import { RecommendationRepository } from './recommendation.repository';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RecommendationDto,
  RecommendationsListDto,
  ApplyRecommendationResultDto,
  RecommendationStatus,
  DismissResultDto,
  RecommendationStatisticsDto,
  AppliedLearningPathDto,
} from './recommendation.dto';
import { RecommendationProjectionService } from './services/recommendation-projection.service';

export interface RecommendationInsights {
  healthScore: number;
  activePathsCount: number;
  adoptionRate: number;
  insights: string[];
}

/**
 * Service for learning path recommendations
 * Delegates to repository layer for business logic and persistence
 */
@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    private readonly recommendationRepository: RecommendationRepository,
    private readonly prisma: PrismaService,
    private readonly recommendationProjectionService: RecommendationProjectionService,
  ) {}

  private recordBreadcrumb(
    action: string,
    data: Record<string, string | number | boolean | undefined>,
    level: 'info' | 'warning' = 'info',
  ): void {
    Sentry.addBreadcrumb({
      category: 'recommendation',
      message: action,
      level,
      data,
    });
  }

  private async assertChildExists(childId: number): Promise<void> {
    const child = await this.prisma.childProfile.findUnique({
      where: { id: childId },
      select: { id: true, deletedAt: true },
    });

    if (!child || child.deletedAt) {
      throw new NotFoundException('Child profile not found');
    }
  }

  private toRecommendationsListDto(
    childId: number,
    recommendations: RecommendationDto[],
  ): RecommendationsListDto {
    return {
      childId,
      recommendations,
      hasRecommendations: recommendations.length > 0,
      noRecommendationMessage:
        recommendations.length === 0
          ? 'Bé chưa có đủ dữ liệu học. Hãy hoàn thành thêm bài học để nhận gợi ý!'
          : undefined,
      generatedAt: new Date(),
    };
  }

  @SentryTraced('recommendation.get')
  async getRecommendations(childId: number): Promise<RecommendationsListDto> {
    await this.assertChildExists(childId);
    this.recordBreadcrumb('recommendation.get.requested', { childId });

    const cachedProjection =
      await this.recommendationProjectionService.getRecommendationsProjection(
        childId,
      );

    if (cachedProjection) {
      this.recordBreadcrumb('recommendation.get.cache_hit', {
        childId,
        count: cachedProjection.recommendations.length,
      });
      return cachedProjection;
    }

    try {
      let recommendations = await this.recommendationRepository.getRecommendations(childId);

      if (recommendations.length === 0) {
        this.recordBreadcrumb('recommendation.get.auto_generate', { childId });
        recommendations = await this.recommendationRepository.generateRecommendations(childId);
      }

      const projected =
        await this.recommendationProjectionService.saveRecommendationsProjection(
          childId,
          recommendations,
        );

      this.recordBreadcrumb('recommendation.get.completed', {
        childId,
        count: projected.recommendations.length,
      });
      Sentry.logger.info('Recommendations fetched', {
        childId,
        count: projected.recommendations.length,
      });
      return projected;
    } catch (error) {
      this.logger.error(
        `Failed to get recommendations for child ${childId}`,
        error instanceof Error ? error.stack : undefined,
      );

      this.recordBreadcrumb(
        'recommendation.get.failed',
        { childId },
        'warning',
      );
      Sentry.captureMessage('Recommendation fetch failed and returned empty result', {
        level: 'warning',
      });

      return {
        childId,
        recommendations: [],
        hasRecommendations: false,
        noRecommendationMessage: 'Recommendation service is temporarily unavailable.',
        generatedAt: new Date(),
      };
    }
  }

  @SentryTraced('recommendation.apply')
  async applyRecommendation(
    childId: number,
    recommendationId: number,
    parentNotes?: string,
  ): Promise<ApplyRecommendationResultDto> {
    await this.assertChildExists(childId);
    this.recordBreadcrumb('recommendation.apply.requested', {
      childId,
      recommendationId,
      hasParentNotes: Boolean(parentNotes),
    });

    const appliedPath = await this.recommendationRepository.applyRecommendation(
      childId,
      recommendationId,
      parentNotes,
    );

    this.recordBreadcrumb('recommendation.apply.completed', {
      childId,
      recommendationId,
      pathItemCount: appliedPath.learningPath?.length,
    });
    Sentry.logger.info('Recommendation applied', {
      childId,
      recommendationId,
      pathItemCount: appliedPath.learningPath?.length || 0,
    });

    await this.recommendationProjectionService.invalidate(childId);

    return {
      success: true,
      message: 'Successfully applied recommendation',
      appliedPath,
    };
  }

  @SentryTraced('recommendation.dismiss')
  async dismissRecommendations(
    childId: number,
    recommendationIds: number[],
  ): Promise<DismissResultDto> {
    await this.assertChildExists(childId);

    const normalizedIds = Array.from(
      new Set(
        recommendationIds
          .filter((id) => Number.isInteger(id) && id > 0)
          .map((id) => Math.trunc(id)),
      ),
    );

    if (normalizedIds.length === 0) {
      throw new BadRequestException('No valid recommendation IDs to dismiss');
    }

    this.recordBreadcrumb('recommendation.dismiss.requested', {
      childId,
      count: normalizedIds.length,
    });

    const result = await this.recommendationRepository.dismissRecommendations(
      childId,
      normalizedIds,
    );

    await this.recommendationProjectionService.invalidate(childId);
    return result;
  }

  @SentryTraced('recommendation.statistics')
  async getStatistics(childId: number): Promise<RecommendationStatisticsDto> {
    await this.assertChildExists(childId);
    return this.recommendationRepository.getStatistics(childId);
  }

  @SentryTraced('recommendation.paths')
  async getAppliedPaths(childId: number): Promise<AppliedLearningPathDto[]> {
    await this.assertChildExists(childId);
    return this.recommendationRepository.getAppliedPaths(childId);
  }

  @SentryTraced('recommendation.insights')
  async getInsights(childId: number): Promise<RecommendationInsights> {
    await this.assertChildExists(childId);

    const stats = await this.getStatistics(childId);
    const paths = await this.getAppliedPaths(childId);

    return {
      healthScore: Math.min(100, stats.appliedPercentage * 2),
      activePathsCount: paths.length,
      adoptionRate: stats.appliedPercentage,
      insights: [
        paths.length > 0
          ? `Great! You have ${paths.length} active learning path(s).`
          : 'Consider applying a recommendation to start a learning path.',
        stats.appliedCount > 0
          ? `You've applied ${stats.appliedCount} recommendations.`
          : 'Apply recommendations to personalize learning.',
      ],
    };
  }

  @SentryTraced('recommendation.feedback')
  async saveFeedback(
    childId: number,
    recommendationId: number,
    rating: number,
    isHelpful: boolean,
    feedback?: string,
  ): Promise<void> {
    await this.assertChildExists(childId);

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    await this.recommendationRepository.saveFeedback(
      childId,
      recommendationId,
      rating,
      isHelpful,
      feedback,
    );

    this.recordBreadcrumb('recommendation.feedback.saved', {
      childId,
      recommendationId,
      rating,
      isHelpful,
    });
  }

  @SentryTraced('recommendation.regenerate')
  async regenerateRecommendations(
    childId: number,
  ): Promise<RecommendationsListDto> {
    await this.assertChildExists(childId);
    this.recordBreadcrumb('recommendation.regenerate.requested', {
      childId,
      provider: 'default',
    });

    // Generate new recommendations using AI
    const recommendations = await this.recommendationRepository.generateRecommendations(childId);

    await this.recommendationProjectionService.saveRecommendationsProjection(
      childId,
      recommendations,
    );

    this.recordBreadcrumb('recommendation.regenerate.completed', {
      childId,
      provider: 'default',
      count: recommendations.length,
    });

    return this.toRecommendationsListDto(childId, recommendations);
  }

  @SentryTraced('recommendation.regenerate_gemini')
  async regenerateRecommendationsWithGemini(
    childId: number,
  ): Promise<RecommendationsListDto> {
    await this.assertChildExists(childId);
    this.recordBreadcrumb('recommendation.regenerate.requested', {
      childId,
      provider: 'gemini',
    });

    let recommendations: RecommendationDto[];
    let provider = 'gemini';

    try {
      recommendations = await this.recommendationRepository.generateRecommendationsWithGemini(
        childId,
      );
    } catch (error) {
      this.logger.warn(
        `Gemini recommendation failed for child ${childId}, falling back to code-based: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      Sentry.captureMessage('Gemini recommendation failed, using code-based fallback', {
        level: 'warning',
        extra: { childId },
      });
      recommendations = await this.recommendationRepository.generateRecommendations(childId);
      provider = 'code-fallback';
    }

    await this.recommendationProjectionService.saveRecommendationsProjection(
      childId,
      recommendations,
    );

    this.recordBreadcrumb('recommendation.regenerate.completed', {
      childId,
      provider,
      count: recommendations.length,
    });
    Sentry.logger.info('Recommendations regenerated', {
      childId,
      count: recommendations.length,
      provider,
    });

    return this.toRecommendationsListDto(childId, recommendations);
  }
}
