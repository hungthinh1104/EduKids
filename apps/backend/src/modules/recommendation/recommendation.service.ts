import { Injectable } from '@nestjs/common';
import { RecommendationRepository } from './recommendation.repository';
import {
  RecommendationDto,
  RecommendationsListDto,
  ApplyRecommendationResultDto,
  RecommendationStatus,
  DismissResultDto,
  RecommendationStatisticsDto,
  AppliedLearningPathDto,
} from './recommendation.dto';

/**
 * Service for learning path recommendations
 * Delegates to repository layer for business logic and persistence
 */
@Injectable()
export class RecommendationService {
  constructor(private readonly recommendationRepository: RecommendationRepository) {}

  async getRecommendations(childId: number): Promise<RecommendationsListDto> {
    const recommendations = await this.recommendationRepository.getRecommendations(childId);

    return {
      childId,
      recommendations,
      hasRecommendations: recommendations.length > 0,
      generatedAt: new Date(),
    };
  }

  async applyRecommendation(
    childId: number,
    recommendationId: number,
    parentNotes?: string,
  ): Promise<ApplyRecommendationResultDto> {
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
    return this.recommendationRepository.dismissRecommendations(childId, recommendationIds);
  }

  async getStatistics(childId: number): Promise<RecommendationStatisticsDto> {
    return this.recommendationRepository.getStatistics(childId);
  }

  async getAppliedPaths(childId: number): Promise<AppliedLearningPathDto[]> {
    return this.recommendationRepository.getAppliedPaths(childId);
  }

  async getInsights(childId: number): Promise<any> {
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
    // Generate new recommendations using AI
    const recommendations = await this.recommendationRepository.generateRecommendations(childId);
    
    return {
      childId,
      recommendations,
      hasRecommendations: recommendations.length > 0,
      generatedAt: new Date(),
    };
  }

  async regenerateRecommendationsWithGemini(
    childId: number,
  ): Promise<RecommendationsListDto> {
    const recommendations = await this.recommendationRepository.generateRecommendationsWithGemini(
      childId,
    );

    return {
      childId,
      recommendations,
      hasRecommendations: recommendations.length > 0,
      generatedAt: new Date(),
    };
  }
}
