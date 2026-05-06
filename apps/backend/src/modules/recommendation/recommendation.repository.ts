import { Injectable } from '@nestjs/common';
import { CmsContentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RecommendationType,
  RecommendationPriority,
  RecommendationStatus,
  RecommendationDto,
  LearningPathItemDto,
  AppliedLearningPathDto,
  RecommendationStatisticsDto,
  AIScoreBreakdown,
  DismissResultDto,
} from './recommendation.dto';
import {
  buildGeminiRecommendationPrompt,
  GeminiRecommendationContext,
  normalizeGeminiRecommendationOutput,
  preComputeDecisions,
  type PreComputedDecision,
} from './recommendation.gemini';
import { RecommendationGeminiApiService } from './recommendation.gemini-api.service';
import { subDays } from 'date-fns';
import { WeakTopicDetectionService } from './services/weak-topic-detection.service';

/**
 * Repository for AI recommendation generation and management
 * Generates personalized learning path suggestions based on child metrics
 */
@Injectable()
export class RecommendationRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiApiService: RecommendationGeminiApiService,
    private readonly weakTopicDetectionService: WeakTopicDetectionService,
  ) {}

  private priorityToInt(priority: RecommendationPriority): number {
    switch (priority) {
      case RecommendationPriority.CRITICAL:
        return 3;
      case RecommendationPriority.HIGH:
        return 2;
      case RecommendationPriority.MEDIUM:
        return 1;
      case RecommendationPriority.LOW:
      default:
        return 0;
    }
  }

  private intToPriority(priority: number): RecommendationPriority {
    if (priority >= 3) return RecommendationPriority.CRITICAL;
    if (priority === 2) return RecommendationPriority.HIGH;
    if (priority === 1) return RecommendationPriority.MEDIUM;
    return RecommendationPriority.LOW;
  }

  private parseScoreBreakdown(value: Prisma.JsonValue | null): AIScoreBreakdown {
    const obj = (value && typeof value === 'object' && !Array.isArray(value))
      ? (value as Record<string, unknown>)
      : {};

    return {
      weaknessScore: Number(obj.weaknessScore ?? 0),
      vocabularyGapScore: Number(obj.vocabularyGapScore ?? 0),
      readinessScore: Number(obj.readinessScore ?? 0),
      engagementScore: Number(obj.engagementScore ?? 0),
      overallScore: Number(obj.overallScore ?? 0),
    };
  }

  private parseLearningPath(value: Prisma.JsonValue | null): LearningPathItemDto[] {
    if (!Array.isArray(value)) return [];

    return value
      .map((item, index) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
        const obj = item as Record<string, unknown>;

        return {
          contentId: Number(obj.contentId ?? 0),
          contentName: String(obj.contentName ?? ''),
          sequenceOrder: Number(obj.sequenceOrder ?? index + 1),
          estimatedMinutes: Number(obj.estimatedMinutes ?? 15),
          difficultyLevel: obj.difficultyLevel ? String(obj.difficultyLevel) : undefined,
          rationale: obj.rationale ? String(obj.rationale) : undefined,
        } as LearningPathItemDto;
      })
      .filter((item): item is LearningPathItemDto => !!item && item.contentId > 0 && item.contentName.length > 0);
  }

  /**
   * Generate recommendations for a child
   * Uses learning history and performance metrics
   * @param childId - Child profile ID
   * @returns List of recommendations
   */
  async generateRecommendations(childId: number): Promise<RecommendationDto[]> {
    const childProfile = await this.fetchChildProfileWithActivities(childId);
    if (!childProfile) return [];

    const geminiRecommendations = await this.tryGenerateGeminiRecommendations(childId, childProfile);
    if (geminiRecommendations.length > 0) {
      await this.prisma.$transaction(
        geminiRecommendations.map((rec) => this.prisma.recommendation.create({ data: this.buildRecommendationData(rec) })),
      );
      return geminiRecommendations;
    }

    return this.generateCodeBasedRecs(childId, childProfile);
  }

  async generateRecommendationsWithGemini(childId: number): Promise<RecommendationDto[]> {
    const childProfile = await this.fetchChildProfileWithActivities(childId);
    if (!childProfile) return [];

    const geminiRecommendations = await this.tryGenerateGeminiRecommendations(childId, childProfile);
    if (geminiRecommendations.length > 0) {
      await this.prisma.$transaction(
        geminiRecommendations.map((rec) => this.prisma.recommendation.create({ data: this.buildRecommendationData(rec) })),
      );
      return geminiRecommendations;
    }

    // Fallback directly to code-based — avoids re-trying Gemini
    return this.generateCodeBasedRecs(childId, childProfile);
  }

  private async fetchChildProfileWithActivities(childId: number) {
    return this.prisma.childProfile.findUnique({
      where: { id: childId },
      select: {
        id: true,
        age: true,
        activities: {
          where: { createdAt: { gte: subDays(new Date(), 30) } },
          orderBy: { createdAt: 'desc' },
          take: 100,
          select: {
            activityType: true,
            score: true,
            topicId: true,
            createdAt: true,
          },
        },
      },
    });
  }

  private async generateCodeBasedRecs(
    childId: number,
    childProfile: { id: number; age?: number | null; activities: any[] },
  ): Promise<RecommendationDto[]> {
    const recommendations: RecommendationDto[] = [];
    const analysis = this.analyzeChildProgress(childProfile);

    if (analysis.pronounciationWeakness > 70) {
      recommendations.push(
        await this.createRecommendation(childId, RecommendationType.PRONUNCIATION_REFINEMENT, RecommendationPriority.HIGH, analysis.pronounciationWeakness, analysis),
      );
    }
    if (analysis.vocabularyGap > 65) {
      recommendations.push(
        await this.createRecommendation(childId, RecommendationType.VOCABULARY_EXTENSION, RecommendationPriority.MEDIUM, analysis.vocabularyGap, analysis),
      );
    }
    if (analysis.readinessScore > 80) {
      recommendations.push(
        await this.createRecommendation(childId, RecommendationType.TOPIC_ADVANCE, RecommendationPriority.MEDIUM, analysis.readinessScore, analysis),
      );
    }
    if (analysis.reviewNeeded.length > 0) {
      recommendations.push(
        await this.createRecommendation(childId, RecommendationType.TOPIC_REVIEW, RecommendationPriority.MEDIUM, 75, analysis),
      );
    }
    if (analysis.quizScore < 70) {
      recommendations.push(
        await this.createRecommendation(childId, RecommendationType.QUIZ_PREPARATION, RecommendationPriority.HIGH, 80, analysis),
      );
    }
    if (analysis.engagementScore < 60) {
      recommendations.push(
        await this.createRecommendation(childId, RecommendationType.CONSISTENCY_BOOST, RecommendationPriority.LOW, analysis.engagementScore, analysis),
      );
    }

    if (recommendations.length > 0) {
      await this.prisma.$transaction(
        recommendations.map((rec) => this.prisma.recommendation.create({ data: this.buildRecommendationData(rec) })),
      );
    }

    return recommendations;
  }

  private async tryGenerateGeminiRecommendations(
    childId: number,
    childProfile: any,
  ): Promise<RecommendationDto[]> {
    const analysis = this.analyzeChildProgress(childProfile);

    const topicScoreEntries: Array<[number, number[]]> =
      analysis.topicScores instanceof Map
        ? Array.from(analysis.topicScores.entries())
        : [];

    const { weakTopicIds, strongTopicIds } =
      this.weakTopicDetectionService.detectFromTopicScores(
        new Map(topicScoreEntries),
      );

    const recentTopicIds = Array.from(
      new Set<number>(
        (childProfile.activities || []).reduce(
          (topicIds: number[], activity: { topicId?: number | null }) => {
            if (typeof activity.topicId === 'number' && activity.topicId > 0) {
              topicIds.push(activity.topicId);
            }
            return topicIds;
          },
          [],
        ),
      ),
    );
    const candidateTopics = await this.buildCandidateTopics(
      weakTopicIds,
      strongTopicIds,
      recentTopicIds,
    );

    if (candidateTopics.length === 0) {
      return [];
    }

    const topicNameRecords = await this.prisma.topic.findMany({
      where: {
        id: {
          in: [...new Set([...weakTopicIds, ...strongTopicIds])],
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const topicNamesById = new Map([
      ...candidateTopics.map((topic) => [topic.id, topic.name] as const),
      ...topicNameRecords.map((topic) => [topic.id, topic.name] as const),
    ]);

    const weakTopicNames = weakTopicIds
      .map((id) => topicNamesById.get(id))
      .filter((name): name is string => !!name)
      .slice(0, 5);

    const strongTopicNames = strongTopicIds
      .map((id) => topicNamesById.get(id))
      .filter((name): name is string => !!name)
      .slice(0, 5);

    const context: GeminiRecommendationContext = {
      childId,
      age: childProfile.age,
      recentMetrics: {
        pronunciationAvg: Math.max(0, 100 - analysis.pronounciationWeakness),
        quizAvg: Math.max(0, analysis.quizScore),
        engagementDays30: Math.round((analysis.engagementScore / 100) * 30),
        weakTopicIds: weakTopicIds.length > 0 ? weakTopicIds : analysis.reviewNeeded || [],
        weakTopicNames,
        strongTopicNames,
      },
      multimodalSignals: {
        audio: {
          pronunciationAvg: Math.max(0, 100 - analysis.pronounciationWeakness),
        },
      },
      candidateTopics: candidateTopics.map((t) => ({
        id: t.id,
        name: t.name,
        estimatedMinutes: 20,
      })),
      constraints: {
        maxRecommendations: 3,
        maxPathItems: 3,
        maxMinutesPerPath: 120,
      },
    };
    const decisions = preComputeDecisions(
      context.recentMetrics,
      context.multimodalSignals,
      context.candidateTopics,
      context.constraints?.maxRecommendations ?? 3,
    );

    if (decisions.length === 0) {
      return [];
    }

    context.preComputedDecisions = decisions;

    const prompt = buildGeminiRecommendationPrompt(context);
    const rawOutput = await this.geminiApiService.generateJson(prompt);

    const allowedTopicIds = new Set(candidateTopics.map((t) => t.id));
    const normalized = normalizeGeminiRecommendationOutput(rawOutput, {
      maxRecommendations: context.constraints?.maxRecommendations ?? 3,
      maxPathItems: context.constraints?.maxPathItems ?? 3,
      allowedTopicIds: [...allowedTopicIds],
      decisions,
      candidateTopics: context.candidateTopics,
    });

    const generatedAt = new Date();

    const mappedRecommendations = normalized.recommendations
      .map((item, index) => {
        const learningPath = item.learningPath.filter((p) => allowedTopicIds.has(p.contentId));
        if (learningPath.length === 0) {
          return null;
        }

        return {
          recommendationId: index + 1,
          childId,
          type: item.type,
          priority: item.priority,
          status: RecommendationStatus.PENDING,
          title: item.title,
          description: item.description,
          scoreBreakdown: item.scoreBreakdown,
          learningPath,
          totalEstimatedMinutes: learningPath.reduce(
            (sum, pathItem) => sum + pathItem.estimatedMinutes,
            0,
          ),
          expectedOutcome: item.expectedOutcome,
          generatedAt,
        } as RecommendationDto;
      })
      .filter((item): item is RecommendationDto => !!item);

    const qualityChecked = this.enforceGeminiRecommendationQuality(mappedRecommendations, {
      weakTopicIds: context.recentMetrics.weakTopicIds,
      maxMinutesPerPath: context.constraints?.maxMinutesPerPath ?? 120,
    });

    if (qualityChecked.length > 0) {
      return qualityChecked;
    }

    return this.buildRecommendationsFromDecisions(
      childId,
      decisions,
      candidateTopics,
      generatedAt,
    );
  }

  private async buildCandidateTopics(
    weakTopicIds: number[],
    strongTopicIds: number[],
    recentTopicIds: number[],
  ): Promise<Array<{ id: number; name: string; estimatedMinutes: number; difficulty: string }>> {
    const prioritizedIds = [...new Set([...weakTopicIds, ...recentTopicIds, ...strongTopicIds])];
    const publishedFilter = {
      status: CmsContentStatus.PUBLISHED,
      deletedAt: null,
      vocabularies: { some: { status: CmsContentStatus.PUBLISHED, deletedAt: null } },
    };

    const prioritizedTopics = prioritizedIds.length > 0
      ? await this.prisma.topic.findMany({
          where: {
            id: { in: prioritizedIds },
            ...publishedFilter,
          },
          select: { id: true, name: true },
        })
      : [];

    const prioritizedMap = new Map(prioritizedTopics.map((topic) => [topic.id, topic]));
    const orderedPrioritizedTopics = prioritizedIds
      .map((id) => prioritizedMap.get(id))
      .filter((topic): topic is { id: number; name: string } => !!topic);

    const remainingNeeded = Math.max(0, 10 - orderedPrioritizedTopics.length);
    const excludeIds = orderedPrioritizedTopics.map((t) => t.id);
    const fallbackTopics = remainingNeeded > 0
      ? await this.prisma.topic.findMany({
          where: {
            ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
            ...publishedFilter,
          },
          take: remainingNeeded,
          select: { id: true, name: true },
        })
      : [];

    return [...orderedPrioritizedTopics, ...fallbackTopics]
      .slice(0, 10)
      .map((topic) => ({
        id: topic.id,
        name: topic.name,
        estimatedMinutes: 20,
        difficulty: 'BEGINNER',
      }));
  }

  private buildRecommendationsFromDecisions(
    childId: number,
    decisions: PreComputedDecision[],
    candidateTopics: Array<{ id: number; name: string; estimatedMinutes: number; difficulty: string }>,
    generatedAt: Date,
  ): RecommendationDto[] {
    const topicById = new Map(candidateTopics.map((topic) => [topic.id, topic]));

    return decisions
      .map((decision, index) => {
        const learningPath = decision.targetTopicIds
          .map((topicId, pathIndex) => {
            const topic = topicById.get(topicId);
            if (!topic) return null;

            return {
              contentId: topic.id,
              contentName: topic.name,
              sequenceOrder: pathIndex + 1,
              estimatedMinutes: topic.estimatedMinutes,
              difficultyLevel: topic.difficulty,
              rationale: decision.englishRationale,
            };
          })
          .filter((item) => item !== null)
          .slice(0, 3);

        if (learningPath.length === 0) {
          return null;
        }

        const priorityScore = this.priorityToInt(decision.priority);
        const score = priorityScore >= 3 ? 90 : priorityScore === 2 ? 75 : 55;

        return {
          recommendationId: index + 1,
          childId,
          type: decision.type,
          priority: decision.priority,
          status: RecommendationStatus.PENDING,
          title: this.getTitleForType(decision.type),
          description: decision.englishRationale,
          scoreBreakdown: {
            weaknessScore: score,
            vocabularyGapScore: score,
            readinessScore: score,
            engagementScore: score,
            overallScore: score,
          },
          learningPath,
          totalEstimatedMinutes: learningPath.reduce(
            (sum, pathItem) => sum + pathItem.estimatedMinutes,
            0,
          ),
          expectedOutcome: this.getExpectedOutcome(decision.type),
          generatedAt,
        };
      })
      .filter((item) => item !== null);
  }

  private enforceGeminiRecommendationQuality(
    recommendations: RecommendationDto[],
    options: { weakTopicIds: number[]; maxMinutesPerPath: number },
  ): RecommendationDto[] {
    if (recommendations.length === 0) return [];

    const measurableOutcomeRegex = /\d|%|phút|lần/i;

    let filtered = recommendations.filter((rec) => {
      if (!rec.learningPath || rec.learningPath.length === 0) return false;
      if (rec.totalEstimatedMinutes <= 0 || rec.totalEstimatedMinutes > options.maxMinutesPerPath) {
        return false;
      }
      if (!rec.expectedOutcome || !measurableOutcomeRegex.test(rec.expectedOutcome)) {
        return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      return [];
    }

    // Enforce at most one CRITICAL recommendation.
    let criticalCount = 0;
    filtered = filtered.map((rec) => {
      if (rec.priority !== RecommendationPriority.CRITICAL) return rec;
      criticalCount += 1;
      if (criticalCount <= 1) return rec;
      return {
        ...rec,
        priority: RecommendationPriority.HIGH,
      };
    });

    // If weak topics are present, at least one recommendation must directly target them.
    if (options.weakTopicIds.length > 0) {
      const weakSet = new Set(options.weakTopicIds);
      const hasWeakCoverage = filtered.some((rec) =>
        rec.learningPath.some((item) => weakSet.has(item.contentId)),
      );

      if (!hasWeakCoverage) {
        return [];
      }
    }

    return filtered.slice(0, 3);
  }

  /**
   * Analyze child's learning progress
   */
  private analyzeChildProgress(childProfile: any): any {
    const activities = childProfile.activities || [];

    if (activities.length === 0) {
      return this.getDefaultAnalysis();
    }

    // Calculate metrics
    const pronounciationActivities = activities.filter(
      (a) => a.activityType === 'PRONUNCIATION',
    );
    const quizActivities = activities.filter((a) => a.activityType === 'QUIZ');
    const flashcardActivities = activities.filter((a) => a.activityType === 'FLASHCARD');

    const pronounciationWeakness =
      pronounciationActivities.length > 0
        ? 100 -
          Math.round(
            pronounciationActivities.reduce((sum, a) => sum + (a.score || 0), 0) /
              pronounciationActivities.length,
          )
        : 0;

    const quizScore =
      quizActivities.length > 0
        ? Math.round(
            quizActivities.reduce((sum, a) => sum + (a.score || 0), 0) /
              quizActivities.length,
          )
        : 0;

    // Identify weak topics
    const topicScores = new Map<number, number[]>();
    activities.forEach((a) => {
      if (!a.topicId || typeof a.topicId !== 'number') {
        return;
      }

      if (!topicScores.has(a.topicId)) {
        topicScores.set(a.topicId, []);
      }

      topicScores.get(a.topicId)?.push(a.score || 0);
    });

    const reviewNeeded = Array.from(topicScores.entries())
      .filter(([_, scores]) => {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        return avg < 70;
      })
      .map(([contentId]) => contentId);

    // Calculate engagement
    const daysActive = new Set(
      activities.map((a) => a.createdAt.toISOString().split('T')[0]),
    ).size;
    const engagementScore = Math.min((daysActive / 30) * 100, 100);

    // Calculate readiness
    const recentActivities = activities.slice(0, 10);
    const recentAvgScore =
      recentActivities.length > 0
        ? recentActivities.reduce((sum, a) => sum + (a.score || 0), 0) /
          recentActivities.length
        : 0;
    const readinessScore =
      recentAvgScore > 80 && activities.length > 20
        ? Math.min(recentAvgScore + 20, 100)
        : recentAvgScore;

    const vocabularyGap =
      flashcardActivities.length > 0
        ? Math.max(0, 100 - (flashcardActivities.length / 50) * 100)
        : 0;

    return {
      pronounciationWeakness,
      quizScore,
      reviewNeeded,
      engagementScore,
      readinessScore,
      vocabularyGap,
      activityCount: activities.length,
      topicScores,
    };
  }

  /**
   * Create a single recommendation
   */
  private async createRecommendation(
    childId: number,
    type: RecommendationType,
    priority: RecommendationPriority,
    baseScore: number,
    analysis: any,
  ): Promise<RecommendationDto> {
    const scoreBreakdown = this.calculateScoreBreakdown(type, analysis, baseScore);
    const learningPath = await this.generateLearningPath(childId, type, analysis);

    return {
      recommendationId: 0, // Will be set by DB
      childId,
      type,
      priority,
      status: RecommendationStatus.PENDING,
      title: this.getTitleForType(type),
      description: this.getDescriptionForType(type, analysis),
      scoreBreakdown,
      learningPath,
      totalEstimatedMinutes: learningPath.reduce(
        (sum, item) => sum + item.estimatedMinutes,
        0,
      ),
      expectedOutcome: this.getExpectedOutcome(type),
      generatedAt: new Date(),
    };
  }

  /**
   * Calculate AI score breakdown
   */
  private calculateScoreBreakdown(
    type: RecommendationType,
    analysis: any,
    baseScore: number,
  ): AIScoreBreakdown {
    const breakdown: AIScoreBreakdown = {
      weaknessScore: Math.max(0, analysis.pronounciationWeakness),
      vocabularyGapScore: Math.max(0, analysis.vocabularyGap),
      readinessScore: Math.max(0, analysis.readinessScore),
      engagementScore: Math.max(0, analysis.engagementScore),
      overallScore: Math.round(baseScore),
    };

    return breakdown;
  }

  /**
   * Generate learning path for recommendation.
   * Prefers type-relevant published topics from analysis; falls back to any published topic.
   */
  private async generateLearningPath(
    childId: number,
    type: RecommendationType,
    analysis?: any,
  ): Promise<LearningPathItemDto[]> {
    const publishedFilter = {
      status: CmsContentStatus.PUBLISHED,
      deletedAt: null,
      vocabularies: { some: { status: CmsContentStatus.PUBLISHED, deletedAt: null } },
    };

    // Determine preferred topic IDs based on recommendation type and child's history
    let preferredIds: number[] = [];

    if (
      type === RecommendationType.TOPIC_REVIEW ||
      type === RecommendationType.WEAKNESS_PRACTICE
    ) {
      preferredIds = (analysis?.reviewNeeded ?? []).slice(0, 5);
    } else if (type === RecommendationType.PRONUNCIATION_REFINEMENT) {
      const recentPron = await this.prisma.activityLog.findMany({
        where: {
          childId,
          activityType: 'PRONUNCIATION',
          topicId: { not: null },
          createdAt: { gte: subDays(new Date(), 30) },
        },
        select: { topicId: true, score: true },
        orderBy: { score: 'asc' },
        take: 5,
      });
      preferredIds = recentPron
        .map((a) => a.topicId)
        .filter((id): id is number => id != null);
    } else if (type === RecommendationType.QUIZ_PREPARATION) {
      const recentQuiz = await this.prisma.activityLog.findMany({
        where: {
          childId,
          activityType: 'QUIZ',
          topicId: { not: null },
          score: { lt: 70 },
          createdAt: { gte: subDays(new Date(), 30) },
        },
        select: { topicId: true },
        take: 5,
      });
      preferredIds = recentQuiz
        .map((a) => a.topicId)
        .filter((id): id is number => id != null);
    }

    // Try preferred topics (only PUBLISHED ones)
    if (preferredIds.length > 0) {
      const preferred = await this.prisma.topic.findMany({
        where: { id: { in: [...new Set(preferredIds)] }, ...publishedFilter },
        select: { id: true, name: true },
        take: 3,
      });
      if (preferred.length > 0) {
        return preferred.map((topic, index) => ({
          contentId: topic.id,
          contentName: topic.name,
          sequenceOrder: index + 1,
          estimatedMinutes: 20 + index * 5,
          difficultyLevel: this.calculateDifficulty(index),
          rationale: this.getRationale(type, index),
        }));
      }
    }

    // Fallback: any published topic
    const topics = await this.prisma.topic.findMany({
      where: publishedFilter,
      take: 5,
    });

    return topics.slice(0, 3).map((topic, index) => ({
      contentId: topic.id,
      contentName: topic.name,
      sequenceOrder: index + 1,
      estimatedMinutes: 20 + index * 5,
      difficultyLevel: this.calculateDifficulty(index),
      rationale: this.getRationale(type, index),
    }));
  }

  /**
   * Calculate difficulty level
   */
  private calculateDifficulty(index: number): string {
    const levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
    return levels[Math.min(index, 2)];
  }

  /**
   * Get rationale for path item
   */
  private getRationale(type: RecommendationType, index: number): string {
    const rationales: Record<RecommendationType, string[]> = {
      [RecommendationType.PRONUNCIATION_REFINEMENT]: [
        'Focus on vowel sounds',
        'Practice consonant clusters',
        'Intonation and stress patterns',
      ],
      [RecommendationType.VOCABULARY_EXTENSION]: [
        'Related vocabulary building',
        'Common phrase patterns',
        'Word usage in context',
      ],
      [RecommendationType.TOPIC_ADVANCE]: [
        'Foundation review',
        'New concept introduction',
        'Advanced practice',
      ],
      [RecommendationType.TOPIC_REVIEW]: [
        'Concept reinforcement',
        'Common mistakes review',
        'Speed practice',
      ],
      [RecommendationType.QUIZ_PREPARATION]: [
        'Similar question types',
        'Time management practice',
        'Final assessment prep',
      ],
      [RecommendationType.CONSISTENCY_BOOST]: [
        'Quick daily lesson',
        'Enjoyable content review',
        'Habit building',
      ],
      [RecommendationType.WEAKNESS_PRACTICE]: [
        'Targeted weakness drill',
        'Gradual difficulty increase',
        'Mastery verification',
      ],
      [RecommendationType.SPEED_CHALLENGE]: [
        'Speed baseline',
        'Timed challenges',
        'Fluency benchmarks',
      ],
    };

    return (
      rationales[type]?.[index] || 'Continue building your skills'
    );
  }

  /**
   * Get title for recommendation type
   */
  private getTitleForType(type: RecommendationType): string {
    const titles: Record<RecommendationType, string> = {
      [RecommendationType.PRONUNCIATION_REFINEMENT]: 'Improve Pronunciation Skills',
      [RecommendationType.VOCABULARY_EXTENSION]: 'Expand Vocabulary',
      [RecommendationType.TOPIC_ADVANCE]: 'Ready to Advance',
      [RecommendationType.TOPIC_REVIEW]: 'Review Previous Topics',
      [RecommendationType.QUIZ_PREPARATION]: 'Prepare for Quiz',
      [RecommendationType.CONSISTENCY_BOOST]: 'Build Learning Habit',
      [RecommendationType.WEAKNESS_PRACTICE]: 'Practice Weak Areas',
      [RecommendationType.SPEED_CHALLENGE]: 'Speed Challenge',
    };
    return titles[type];
  }

  /**
   * Get description for recommendation type
   */
  private getDescriptionForType(type: RecommendationType, analysis: any): string {
    const descriptions: Record<RecommendationType, string> = {
      [RecommendationType.PRONUNCIATION_REFINEMENT]:
        'Your child showed areas for pronunciation improvement. This tailored path focuses on weak pronunciation patterns.',
      [RecommendationType.VOCABULARY_EXTENSION]:
        'Building on strong topics, explore related vocabulary to expand language skills.',
      [RecommendationType.TOPIC_ADVANCE]:
        'Your child is ready to progress to the next topic! This path prepares for advancement.',
      [RecommendationType.TOPIC_REVIEW]:
        'Strengthen understanding of previously learned topics to build a stronger foundation.',
      [RecommendationType.QUIZ_PREPARATION]:
        'Prepare for the next quiz with targeted practice on common question types.',
      [RecommendationType.CONSISTENCY_BOOST]:
        'Build daily learning habits with short, enjoyable sessions.',
      [RecommendationType.WEAKNESS_PRACTICE]:
        'Focused practice on identified weak areas to improve overall performance.',
      [RecommendationType.SPEED_CHALLENGE]:
        'Test and improve fluency with timed challenges and speed benchmarks.',
    };
    return descriptions[type];
  }

  /**
   * Get expected outcome
   */
  private getExpectedOutcome(type: RecommendationType): string {
    const outcomes: Record<RecommendationType, string> = {
      [RecommendationType.PRONUNCIATION_REFINEMENT]:
        'Improve pronunciation accuracy by 15-20%',
      [RecommendationType.VOCABULARY_EXTENSION]:
        'Learn 20-30 new vocabulary words',
      [RecommendationType.TOPIC_ADVANCE]: 'Successfully master current topic',
      [RecommendationType.TOPIC_REVIEW]: 'Increase retention and confidence',
      [RecommendationType.QUIZ_PREPARATION]: 'Improve quiz score by 10-15%',
      [RecommendationType.CONSISTENCY_BOOST]: 'Build 7+ day learning streak',
      [RecommendationType.WEAKNESS_PRACTICE]: 'Increase weak area score by 20-25%',
      [RecommendationType.SPEED_CHALLENGE]: 'Improve response speed by 30%',
    };
    return outcomes[type];
  }

  /**
   * Get default analysis for new learners
   */
  private getDefaultAnalysis(): any {
    return {
      pronounciationWeakness: 50,
      quizScore: 50,
      reviewNeeded: [],
      engagementScore: 50,
      readinessScore: 50,
      vocabularyGap: 50,
      activityCount: 0,
      topicScores: new Map(),
    };
  }

  /**
   * Build create data object for a recommendation (used with $transaction batching)
   */
  private buildRecommendationData(recommendation: RecommendationDto) {
    return {
      childId: recommendation.childId,
      type: recommendation.type,
      priority: this.priorityToInt(recommendation.priority),
      status: recommendation.status,
      title: recommendation.title,
      description: recommendation.description,
      scoreBreakdown: recommendation.scoreBreakdown as unknown as Prisma.InputJsonValue,
      learningPath: recommendation.learningPath as unknown as Prisma.InputJsonValue,
      totalEstimatedMinutes: recommendation.totalEstimatedMinutes,
      expectedOutcome: recommendation.expectedOutcome,
      generatedAt: recommendation.generatedAt,
    };
  }

  /**
   * Get recommendations for a child
   */
  async getRecommendations(childId: number): Promise<RecommendationDto[]> {
    const recs = await this.prisma.recommendation.findMany({
      where: {
        childId,
        status: {
          in: [RecommendationStatus.PENDING, RecommendationStatus.VIEWED],
        },
      },
      orderBy: [
        { priority: 'desc' }, // CRITICAL(3) first, then HIGH(2), MEDIUM(1), LOW(0)
        { generatedAt: 'desc' },
      ],
      take: 10,
    });

    // Collect all contentIds referenced across every recommendation
    const parsedPaths = recs.map((rec) => ({
      rec,
      learningPath: this.parseLearningPath(rec.learningPath),
    }));

    const allContentIds = [
      ...new Set(parsedPaths.flatMap(({ learningPath }) => learningPath.map((item) => item.contentId))),
    ];

    // Single batch query — verify which topics are still PUBLISHED with real content
    const liveTopics = allContentIds.length > 0
      ? await this.prisma.topic.findMany({
          where: {
            id: { in: allContentIds },
            status: CmsContentStatus.PUBLISHED,
            deletedAt: null,
            vocabularies: { some: { status: CmsContentStatus.PUBLISHED, deletedAt: null } },
          },
          select: { id: true },
        })
      : [];

    const liveIds = new Set(liveTopics.map((t) => t.id));

    return parsedPaths
      .map(({ rec, learningPath }) => {
        // Strip dead topics from path
        const livePath = learningPath.filter((item) => liveIds.has(item.contentId));
        if (livePath.length === 0) return null;

        // Re-sequence after stripping
        const resequenced = livePath.map((item, idx) => ({ ...item, sequenceOrder: idx + 1 }));

        return {
          recommendationId: rec.id,
          childId: rec.childId,
          type: rec.type as RecommendationType,
          priority: this.intToPriority(rec.priority),
          status: (rec.status as RecommendationStatus) || RecommendationStatus.PENDING,
          title: rec.title,
          description: rec.description || '',
          scoreBreakdown: this.parseScoreBreakdown(rec.scoreBreakdown),
          learningPath: resequenced,
          totalEstimatedMinutes: resequenced.reduce((s, i) => s + i.estimatedMinutes, 0),
          expectedOutcome: rec.expectedOutcome || undefined,
          generatedAt: rec.generatedAt,
          viewedAt: rec.viewedAt || undefined,
          appliedAt: rec.appliedAt || undefined,
        };
      })
      .filter((rec): rec is NonNullable<typeof rec> => rec !== null);
  }

  /**
   * Apply a recommendation
   */
  async applyRecommendation(
    childId: number,
    recommendationId: number,
    parentNotes?: string,
  ): Promise<AppliedLearningPathDto> {
    // Get recommendation
    const rec = await this.prisma.recommendation.findUnique({
      where: { id: recommendationId },
    });

    if (!rec || rec.childId !== childId) {
      throw new Error('Recommendation not found');
    }

    const rawPath = this.parseLearningPath(rec.learningPath);

    // Strip any dead topics so the applied path only contains playable content
    const contentIds = rawPath.map((item) => item.contentId);
    const liveTopics = contentIds.length > 0
      ? await this.prisma.topic.findMany({
          where: {
            id: { in: contentIds },
            status: CmsContentStatus.PUBLISHED,
            deletedAt: null,
            vocabularies: { some: { status: CmsContentStatus.PUBLISHED, deletedAt: null } },
          },
          select: { id: true },
        })
      : [];

    const liveIds = new Set(liveTopics.map((t) => t.id));
    const learningPath = rawPath
      .filter((item) => liveIds.has(item.contentId))
      .map((item, idx) => ({ ...item, sequenceOrder: idx + 1 }));

    if (learningPath.length === 0) {
      throw new Error('No playable topics remain in this recommendation');
    }

    // Create applied path record
    const appliedPath = await this.prisma.appliedLearningPath.create({
      data: {
        childId,
        recommendationId,
        learningPath: learningPath as unknown as Prisma.InputJsonValue,
        totalEstimatedMinutes: learningPath.reduce((s, i) => s + i.estimatedMinutes, 0),
        itemsCompleted: 0,
        totalItems: learningPath.length,
        progressPercentage: 0,
        appliedAt: new Date(),
        parentNotes,
      },
    });

    // Update recommendation status
    await this.prisma.recommendation.update({
      where: { id: recommendationId },
      data: {
        status: RecommendationStatus.APPLIED,
        appliedAt: new Date(),
      },
    });

    return {
      pathId: appliedPath.id,
      childId: appliedPath.childId,
      recommendationId: appliedPath.recommendationId,
      learningPath,
      totalEstimatedMinutes: appliedPath.totalEstimatedMinutes,
      itemsCompleted: appliedPath.itemsCompleted,
      totalItems: appliedPath.totalItems,
      progressPercentage: appliedPath.progressPercentage,
      appliedAt: appliedPath.appliedAt,
      completedAt: appliedPath.completedAt || undefined,
      parentNotes: appliedPath.parentNotes || undefined,
    };
  }

  /**
   * Get applied paths for a child
   */
  async getAppliedPaths(childId: number): Promise<AppliedLearningPathDto[]> {
    const paths = await this.prisma.appliedLearningPath.findMany({
      where: { childId },
      orderBy: { appliedAt: 'desc' },
      take: 10,
    });

    return paths.map((path) => ({
      pathId: path.id,
      childId: path.childId,
      recommendationId: path.recommendationId,
      learningPath: this.parseLearningPath(path.learningPath),
      totalEstimatedMinutes: path.totalEstimatedMinutes,
      itemsCompleted: path.itemsCompleted,
      totalItems: path.totalItems,
      progressPercentage: path.progressPercentage,
      appliedAt: path.appliedAt,
      completedAt: path.completedAt || undefined,
      parentNotes: path.parentNotes || undefined,
    }));
  }

  /**
   * Update applied path progress
   */
  async updatePathProgress(
    pathId: number,
    itemsCompleted: number,
  ): Promise<void> {
    const path = await this.prisma.appliedLearningPath.findUnique({
      where: { id: pathId },
    });

    if (!path) return;

    const progressPercentage = Math.round(
      (itemsCompleted / path.totalItems) * 100,
    );

    await this.prisma.appliedLearningPath.update({
      where: { id: pathId },
      data: {
        itemsCompleted,
        progressPercentage,
        completedAt:
          itemsCompleted === path.totalItems ? new Date() : undefined,
      },
    });
  }

  /**
   * Get recommendation statistics
   */
  async getStatistics(childId: number): Promise<RecommendationStatisticsDto> {
    const [all, allFeedback, activePaths, completedPaths] = await this.prisma.$transaction([
      this.prisma.recommendation.findMany({ where: { childId } }),
      this.prisma.recommendationFeedback.findMany({
        where: { childId },
        select: { isHelpful: true, rating: true },
      }),
      this.prisma.appliedLearningPath.findMany({
        where: { childId, completedAt: null },
        select: { id: true },
      }),
      this.prisma.appliedLearningPath.findMany({
        where: { childId, completedAt: { not: null } },
        select: { appliedAt: true, completedAt: true },
      }),
    ]);

    const applied = all.filter((r) => r.status === RecommendationStatus.APPLIED);
    const completed = all.filter((r) => r.status === RecommendationStatus.COMPLETED);
    const helpfulCount = allFeedback.filter((f) => f.isHelpful).length;

    const ratedFeedback = allFeedback.filter((f) => f.rating != null);
    const averageRating =
      ratedFeedback.length > 0
        ? Math.round(
            (ratedFeedback.reduce((sum, f) => sum + (f.rating ?? 0), 0) / ratedFeedback.length) * 10,
          ) / 10
        : 0;

    const averageCompletionDays =
      completedPaths.length > 0
        ? Math.round(
            completedPaths.reduce((sum, p) => {
              const days =
                (p.completedAt!.getTime() - p.appliedAt.getTime()) / (1000 * 60 * 60 * 24);
              return sum + days;
            }, 0) / completedPaths.length,
          )
        : 0;

    return {
      childId,
      totalRecommendations: all.length,
      appliedCount: applied.length,
      appliedPercentage: all.length > 0 ? Math.round((applied.length / all.length) * 100) : 0,
      completedCount: completed.length,
      averageRating,
      helpfulCount,
      activePathsCount: activePaths.length,
      mostCommonType: this.getMostCommonType(all),
      averageCompletionDays,
    };
  }

  /**
   * Get most common recommendation type
   */
  private getMostCommonType(
    recommendations: any[],
  ): RecommendationType | undefined {
    const typeCounts = new Map<RecommendationType, number>();
    recommendations.forEach((rec) => {
      const count = typeCounts.get(rec.type) || 0;
      typeCounts.set(rec.type, count + 1);
    });

    return Array.from(typeCounts.entries()).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0];
  }

  /**
   * Dismiss recommendations
   */
  async dismissRecommendations(
    childId: number,
    recommendationIds: number[],
  ): Promise<DismissResultDto> {
    const previousTotal = await this.prisma.recommendation.count({
      where: { childId, status: { not: RecommendationStatus.DISMISSED } },
    });

    const result = await this.prisma.recommendation.updateMany({
      where: {
        id: { in: recommendationIds },
        childId,
      },
      data: {
        status: RecommendationStatus.DISMISSED,
      },
    });

    const remainingCount = await this.prisma.recommendation.count({
      where: { childId, status: { not: RecommendationStatus.DISMISSED } },
    });

    return {
      dismissedCount: result.count,
      previousTotal,
      remainingCount,
    };
  }

  /**
   * Save feedback for recommendation
   */
  async saveFeedback(
    childId: number,
    recommendationId: number,
    rating: number,
    isHelpful: boolean,
    feedback?: string,
  ): Promise<void> {
    await this.prisma.recommendationFeedback.create({
      data: {
        childId,
        recommendationId,
        rating,
        isHelpful,
        feedback,
      },
    });
  }
}
