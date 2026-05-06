import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AnalyticsRepository } from './analytics.repository';
import { ChildProfileRepository } from '../child-profile/child-profile.repository';
import {
  AnalyticsPeriod,
  AnalyticsOverviewDto,
  LearningTimeDto,
  VocabularyRetentionDto,
  PronunciationAccuracyDto,
  QuizPerformanceDto,
  GamificationProgressDto,
  NoDataResponseDto,
} from './analytics.dto';

/**
 * Service for analytics calculations with Redis caching (NFR-01)
 * Generates insights for parent dashboard
 */
@Injectable()
export class AnalyticsService {
  // Cache TTL: 1 hour (analytics don't need real-time updates)
  private readonly CACHE_TTL = 3600; // seconds

  constructor(
    private readonly repository: AnalyticsRepository,
    private readonly childProfileRepository: ChildProfileRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Get complete analytics overview for child
   * UC-07 Main Action: Parent views visualized analytics
   * @param childId - Child profile ID
   * @param parentId - Parent user ID (for authorization)
   * @param period - Time period for analytics
   * @returns Complete analytics dashboard data
   */
  async getAnalyticsOverview(
    childId: number,
    parentId: number,
    period: AnalyticsPeriod,
  ): Promise<AnalyticsOverviewDto | NoDataResponseDto> {
    // Verify child profile belongs to parent
    const childProfile = await this.childProfileRepository.getProfileById(
      childId,
      parentId,
    );
    if (!childProfile) {
      throw new NotFoundException(
        `Child profile with ID ${childId} not found or you don't have permission to access it.`,
      );
    }

    // Check cache first (NFR-01: Redis caching for fast charts)
    const cacheKey = `analytics:overview:${childId}:${period}`;
    const cached = await this.cacheManager.get<AnalyticsOverviewDto>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch all metrics in parallel
    const [
      learningTime,
      vocabulary,
      pronunciation,
      quizPerformance,
      gamification,
      badgeCatalogTotal,
    ] = await Promise.all([
      this.repository.getLearningTimeMetrics(childId, period),
      this.repository.getVocabularyRetentionMetrics(childId, period),
      this.repository.getPronunciationAccuracyMetrics(childId, period),
      this.repository.getQuizPerformanceMetrics(childId, period),
      this.repository.getGamificationMetrics(childId, period),
      this.repository.getTotalBadgesCount(),
    ]);

    // Check if any data exists
    const hasData =
      learningTime !== null ||
      vocabulary !== null ||
      pronunciation !== null ||
      quizPerformance !== null ||
      gamification !== null;

    if (!hasData) {
      return {
        hasData: false,
        message: 'No data yet – encourage your child to learn! 🌟',
        childId,
        childNickname: childProfile.nickname,
      };
    }

    // Generate AI insight message
    const insightMessage = this.generateInsightMessage(
      learningTime,
      vocabulary,
      pronunciation,
      quizPerformance,
    );

    const overview: AnalyticsOverviewDto = {
      childId,
      childNickname: childProfile.nickname,
      period,
      learningTime: learningTime || this.getEmptyLearningTimeDto(),
      vocabulary: vocabulary || this.getEmptyVocabularyDto(),
      pronunciation: pronunciation || this.getEmptyPronunciationDto(),
      quizPerformance: quizPerformance || this.getEmptyQuizDto(),
      gamification:
        gamification || this.getEmptyGamificationDto(badgeCatalogTotal),
      generatedAt: new Date(),
      hasData,
      insightMessage,
    };

    // Cache result for 1 hour
    await this.cacheManager.set(cacheKey, overview, this.CACHE_TTL);

    return overview;
  }

  /**
   * Get learning time analytics
   * @param childId - Child profile ID
   * @param parentId - Parent user ID
   * @param period - Time period
   * @returns Learning time metrics
   */
  async getLearningTime(
    childId: number,
    parentId: number,
    period: AnalyticsPeriod,
  ): Promise<LearningTimeDto | NoDataResponseDto> {
    await this.verifyChildProfile(childId, parentId);

    const cacheKey = `analytics:learning-time:${childId}:${period}`;
    const cached = await this.cacheManager.get<LearningTimeDto>(cacheKey);
    if (cached) return cached;

    const learningTime = await this.repository.getLearningTimeMetrics(
      childId,
      period,
    );

    if (!learningTime) {
      return this.getNoDataResponse(childId, parentId);
    }

    await this.cacheManager.set(cacheKey, learningTime, this.CACHE_TTL);
    return learningTime;
  }

  /**
   * Get vocabulary retention analytics
   * @param childId - Child profile ID
   * @param parentId - Parent user ID
   * @param period - Time period
   * @returns Vocabulary retention metrics
   */
  async getVocabularyRetention(
    childId: number,
    parentId: number,
    period: AnalyticsPeriod,
  ): Promise<VocabularyRetentionDto | NoDataResponseDto> {
    await this.verifyChildProfile(childId, parentId);

    const cacheKey = `analytics:vocabulary:${childId}:${period}`;
    const cached = await this.cacheManager.get<VocabularyRetentionDto>(cacheKey);
    if (cached) return cached;

    const vocabulary = await this.repository.getVocabularyRetentionMetrics(
      childId,
      period,
    );

    if (!vocabulary) {
      return this.getNoDataResponse(childId, parentId);
    }

    await this.cacheManager.set(cacheKey, vocabulary, this.CACHE_TTL);
    return vocabulary;
  }

  /**
   * Get pronunciation accuracy analytics
   * @param childId - Child profile ID
   * @param parentId - Parent user ID
   * @param period - Time period
   * @returns Pronunciation accuracy metrics
   */
  async getPronunciationAccuracy(
    childId: number,
    parentId: number,
    period: AnalyticsPeriod,
  ): Promise<PronunciationAccuracyDto | NoDataResponseDto> {
    await this.verifyChildProfile(childId, parentId);

    const cacheKey = `analytics:pronunciation:${childId}:${period}`;
    const cached =
      await this.cacheManager.get<PronunciationAccuracyDto>(cacheKey);
    if (cached) return cached;

    const pronunciation =
      await this.repository.getPronunciationAccuracyMetrics(childId, period);

    if (!pronunciation) {
      return this.getNoDataResponse(childId, parentId);
    }

    await this.cacheManager.set(cacheKey, pronunciation, this.CACHE_TTL);
    return pronunciation;
  }

  /**
   * Get quiz performance analytics
   * @param childId - Child profile ID
   * @param parentId - Parent user ID
   * @param period - Time period
   * @returns Quiz performance metrics
   */
  async getQuizPerformance(
    childId: number,
    parentId: number,
    period: AnalyticsPeriod,
  ): Promise<QuizPerformanceDto | NoDataResponseDto> {
    await this.verifyChildProfile(childId, parentId);

    const cacheKey = `analytics:quiz:${childId}:${period}`;
    const cached = await this.cacheManager.get<QuizPerformanceDto>(cacheKey);
    if (cached) return cached;

    const quizPerformance = await this.repository.getQuizPerformanceMetrics(
      childId,
      period,
    );

    if (!quizPerformance) {
      return this.getNoDataResponse(childId, parentId);
    }

    await this.cacheManager.set(cacheKey, quizPerformance, this.CACHE_TTL);
    return quizPerformance;
  }

  /**
   * Get gamification progress analytics
   * @param childId - Child profile ID
   * @param parentId - Parent user ID
   * @param period - Time period
   * @returns Gamification progress metrics
   */
  async getGamificationProgress(
    childId: number,
    parentId: number,
    period: AnalyticsPeriod,
  ): Promise<GamificationProgressDto | NoDataResponseDto> {
    await this.verifyChildProfile(childId, parentId);

    const cacheKey = `analytics:gamification:${childId}:${period}`;
    const cached =
      await this.cacheManager.get<GamificationProgressDto>(cacheKey);
    if (cached) return cached;

    const gamification = await this.repository.getGamificationMetrics(
      childId,
      period,
    );

    if (!gamification) {
      return this.getNoDataResponse(childId, parentId);
    }

    await this.cacheManager.set(cacheKey, gamification, this.CACHE_TTL);
    return gamification;
  }

  /**
   * Resolve the child ID from query param or fall back to the parent's active/first profile.
   * Centralises the lookup so controllers stay free of repository dependencies.
   */
  async resolveChildId(parentId: number, queryChildId?: number): Promise<number> {
    if (queryChildId) {
      return queryChildId;
    }

    const activeProfile = await this.childProfileRepository.getActiveProfile(parentId);
    if (activeProfile?.id) {
      return activeProfile.id;
    }

    const profiles = await this.childProfileRepository.getAllProfilesForParent(parentId);
    if (profiles.length > 0) {
      return profiles[0].id;
    }

    throw new NotFoundException('No child profile found for this parent');
  }

  /**
   * Invalidate analytics cache for child
   * Called when new activity is recorded
   * @param childId - Child profile ID
   */
  async invalidateCache(childId: number): Promise<void> {
    const periods = Object.values(AnalyticsPeriod);
    const cacheKeys = [
      ...periods.map((p) => `analytics:overview:${childId}:${p}`),
      ...periods.map((p) => `analytics:learning-time:${childId}:${p}`),
      ...periods.map((p) => `analytics:vocabulary:${childId}:${p}`),
      ...periods.map((p) => `analytics:pronunciation:${childId}:${p}`),
      ...periods.map((p) => `analytics:quiz:${childId}:${p}`),
      ...periods.map((p) => `analytics:gamification:${childId}:${p}`),
    ];

    await Promise.all(cacheKeys.map((key) => this.cacheManager.del(key)));
  }

  /**
   * Verify child profile belongs to parent
   */
  private async verifyChildProfile(
    childId: number,
    parentId: number,
  ): Promise<void> {
    const profile = await this.childProfileRepository.getProfileById(
      childId,
      parentId,
    );
    if (!profile) {
      throw new NotFoundException(
        `Child profile with ID ${childId} not found or you don't have permission to access it.`,
      );
    }
  }

  /**
   * Get no data response
   */
  private async getNoDataResponse(
    childId: number,
    parentId: number,
  ): Promise<NoDataResponseDto> {
    const profile = await this.childProfileRepository.getProfileById(
      childId,
      parentId,
    );
    return {
      hasData: false,
      message: 'No data yet – encourage your child to learn! 🌟',
      childId,
      childNickname: profile?.nickname || 'Child',
    };
  }

  /**
   * Generate AI insight message based on metrics
   */
  private generateInsightMessage(
    learningTime: any,
    vocabulary: any,
    pronunciation: any,
    quizPerformance: any,
  ): string {
    const insights: string[] = [];

    // Learning time insights
    if (learningTime && learningTime.totalMinutes > 100) {
      insights.push('Great progress this week! 🎉');
    } else if (learningTime && learningTime.totalMinutes < 30) {
      insights.push('Try spending more time learning each day! 📚');
    }

    // Streak insights
    if (learningTime && learningTime.currentStreak >= 7) {
      insights.push(`Amazing ${learningTime.currentStreak}-day streak! 🔥`);
    }

    // Pronunciation insights
    if (pronunciation && pronunciation.averageAccuracy >= 85) {
      insights.push('Excellent pronunciation accuracy! 🗣️');
    } else if (pronunciation && pronunciation.averageAccuracy < 70) {
      insights.push('Keep practicing pronunciation! 💪');
    }

    // Quiz insights
    if (quizPerformance && quizPerformance.averageScore >= 85) {
      insights.push('Outstanding quiz performance! 🏆');
    }

    // Vocabulary insights
    if (vocabulary && vocabulary.retentionRate >= 80) {
      insights.push('Strong vocabulary retention! 🧠');
    }

    return insights.length > 0
      ? insights.join(' ')
      : 'Keep up the great work! 🌟';
  }

  /**
   * Get empty DTO structures for no data cases
   */
  private getEmptyLearningTimeDto(): LearningTimeDto {
    return {
      totalMinutes: 0,
      averageSessionMinutes: 0,
      totalSessions: 0,
      daysActive: 0,
      currentStreak: 0,
      chartData: [],
    };
  }

  private getEmptyVocabularyDto(): VocabularyRetentionDto {
    return {
      totalWordsEncountered: 0,
      wordsMastered: 0,
      retentionRate: 0,
      wordsReviewed: 0,
      chartData: [],
      wordsByLevel: { mastered: 0, learning: 0, new: 0 },
    };
  }

  private getEmptyPronunciationDto(): PronunciationAccuracyDto {
    return {
      averageAccuracy: 0,
      totalPractices: 0,
      highAccuracyCount: 0,
      challengingSoundsCount: 0,
      chartData: [],
      mostImprovedWords: [],
      wordsNeedingPractice: [],
    };
  }

  private getEmptyQuizDto(): QuizPerformanceDto {
    return {
      totalQuizzes: 0,
      averageScore: 0,
      highestScore: 0,
      quizzesPassed: 0,
      chartData: [],
      scoresByDifficulty: { easy: 0, medium: 0, hard: 0 },
    };
  }

  private getEmptyGamificationDto(totalBadges: number): GamificationProgressDto {
    return {
      totalPoints: 0,
      currentLevel: 1,
      badgesEarned: 0,
      totalBadges,
      itemsPurchased: 0,
      chartData: [],
      recentBadges: [],
    };
  }
}
