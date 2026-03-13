import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
  ) {}

  private async assertChildExists(childId: number): Promise<void> {
    const child = await this.prisma.childProfile.findFirst({
      where: { id: childId, deletedAt: null },
      select: { id: true },
    });

    if (!child) {
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
      generatedAt: new Date(),
    };
  }

  async getRecommendations(childId: number): Promise<RecommendationsListDto> {
    await this.assertChildExists(childId);

    try {
      const recommendations = await this.recommendationRepository.getRecommendations(childId);
      return this.toRecommendationsListDto(childId, recommendations);
    } catch (error) {
      this.logger.error(
        `Failed to get recommendations for child ${childId}`,
        error instanceof Error ? error.stack : undefined,
      );

      return {
        childId,
        recommendations: [],
        hasRecommendations: false,
        noRecommendationMessage: 'Recommendation service is temporarily unavailable.',
        generatedAt: new Date(),
      };
    }
  }

  async applyRecommendation(
    childId: number,
    recommendationId: number,
    parentNotes?: string,
  ): Promise<ApplyRecommendationResultDto> {
    await this.assertChildExists(childId);

    const appliedPath = await this.recommendationRepository.applyRecommendation(
      childId,
      recommendationId,
      parentNotes,
    );

    return {
      success: true,
      message: 'Successfully applied recommendation',
      appliedPath,
    };
  }

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

    return this.recommendationRepository.dismissRecommendations(
      childId,
      normalizedIds,
    );
  }

  async getStatistics(childId: number): Promise<RecommendationStatisticsDto> {
    await this.assertChildExists(childId);
    return this.recommendationRepository.getStatistics(childId);
  }

  async getAppliedPaths(childId: number): Promise<AppliedLearningPathDto[]> {
    await this.assertChildExists(childId);
    return this.recommendationRepository.getAppliedPaths(childId);
  }

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
  }

  async regenerateRecommendations(
    childId: number,
  ): Promise<RecommendationsListDto> {
    await this.assertChildExists(childId);

    // Generate new recommendations using AI
    const recommendations = await this.recommendationRepository.generateRecommendations(childId);

    return this.toRecommendationsListDto(childId, recommendations);
  }

  async regenerateRecommendationsWithGemini(
    childId: number,
  ): Promise<RecommendationsListDto> {
    await this.assertChildExists(childId);

    const recommendations = await this.recommendationRepository.generateRecommendationsWithGemini(
      childId,
    );

    return this.toRecommendationsListDto(childId, recommendations);
  }
}
