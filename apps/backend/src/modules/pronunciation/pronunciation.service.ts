import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PronunciationRepository } from './repositories/pronunciation.repository';
import { PronunciationSubmitDto, StarRatingDto, PronunciationFeedbackDto } from './dto/pronunciation.dto';
import { PronunciationAssessmentService } from './pronunciation-assessment.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * UC-03 Service: Practice Pronunciation with AI
 * Handles pronunciation scoring, feedback generation, and gamification rewards
 */
@Injectable()
export class PronunciationService {
  constructor(
    private readonly pronunciationRepository: PronunciationRepository,
    private readonly pronunciationAssessmentService: PronunciationAssessmentService,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Submit pronunciation attempt from Web Speech API
   * Converts confidence score to stars, generates feedback, updates progress
   */
  async submitPronunciationAttempt(
    childId: number,
    vocabularyId: number,
    dto: PronunciationSubmitDto,
  ): Promise<PronunciationFeedbackDto> {
    // Validate vocabulary exists
    const vocabulary = await this.pronunciationRepository.getVocabularyWithPronunciationData(
      vocabularyId,
    );
    if (!vocabulary) {
      throw new NotFoundException(`Vocabulary ${vocabularyId} not found`);
    }

    if (dto.confidenceScore < 0 || dto.confidenceScore > 100) {
      throw new BadRequestException('Confidence score must be between 0-100');
    }

    const assessment = this.pronunciationAssessmentService.buildAssessment({
      confidenceScore: dto.confidenceScore,
      word: vocabulary.word,
      targetIpa: vocabulary.phonetic,
      recognizedText: dto.recognizedText,
      recognizedIpa: dto.recognizedIpa,
    });

    // Step 1: Record the attempt
    const activity = await this.pronunciationRepository.create({
      id: undefined,
      childId: childId.toString(),
      vocabularyId: vocabularyId.toString(),
      aiScore: assessment.overallScore,
      feedback: dto.evaluationNotes || '',
      assessment,
      createdAt: new Date(),
    });

    // Step 2: Convert confidence score to star rating
    const starRating = this.convertScoreToStars(assessment.overallScore);

    // Step 3: Generate kid-friendly feedback
    const rating = this.generateKidFriendlyFeedback(assessment.overallScore, starRating);

    // Step 4: Update learning progress
    await this.pronunciationRepository.updatePronunciationProgress(
      childId,
      vocabularyId,
      assessment.overallScore,
      starRating,
    );

    // Step 5: Check and award points/badges
    const rewardInfo = await this.checkRewardTriggers(childId, vocabularyId, starRating);

    // Step 6: Get updated child profile
    const child = await this.prisma.childProfile.findUnique({
      where: { id: childId },
      select: { totalPoints: true },
    });

    const currentLevel = this.calculateLevel(child?.totalPoints || 0);

    // Step 7: Build response DTO
    const nativePronunciationAudio = `tts:///${vocabulary.word}`; // TODO: Add media relation to query
    // vocabulary.media && vocabulary.media.length > 0
    //   ? vocabulary.media[0].url
    //   : `tts:///${vocabulary.word}`;

    return {
      attemptId: parseInt(activity.id as any, 10) || 0,
      vocabularyId,
      word: vocabulary.word,
      confidenceScore: assessment.overallScore,
      rating,
      nativePronunciationAudio,
      detailedFeedback: this.generateDetailedFeedback(assessment.overallScore, vocabulary),
      totalPoints: child?.totalPoints || 0,
      currentLevel,
      badgeUnlocked: rewardInfo.badgeUnlocked,
      attemptedAt: activity.createdAt,
      assessment,
    };
  }

  /**
   * Convert Web Speech API confidence score (0-100) to star rating (1-5)
   * Scoring: 0-40 = 1 star, 41-60 = 2 stars, 61-75 = 3 stars, 76-90 = 4 stars, 91-100 = 5 stars
   */
  private convertScoreToStars(confidenceScore: number): number {
    if (confidenceScore >= 91) return 5;
    if (confidenceScore >= 76) return 4;
    if (confidenceScore >= 61) return 3;
    if (confidenceScore >= 41) return 2;
    return 1;
  }

  /**
   * Generate kid-friendly feedback with emojis and messages
   */
  private generateKidFriendlyFeedback(
    confidenceScore: number,
    starRating: number,
  ): StarRatingDto {
    const messages = {
      1: {
        message: 'Keep practicing! 💪',
        emoji: '⭐✨✨✨✨',
        reward: null,
      },
      2: {
        message: 'Good job! Getting better! 😊',
        emoji: '⭐⭐✨✨✨',
        reward: null,
      },
      3: {
        message: 'Very nice! 🌟',
        emoji: '⭐⭐⭐✨✨',
        reward: '+10 Star Points!',
      },
      4: {
        message: 'Excellent pronunciation! 🎉',
        emoji: '⭐⭐⭐⭐✨',
        reward: '+15 Star Points!',
      },
      5: {
        message: 'Perfect! You are amazing! 🏆',
        emoji: '⭐⭐⭐⭐⭐',
        reward: '+20 Star Points!',
      },
    };

    const feedback = messages[starRating] || messages[1];

    return {
      stars: starRating,
      starEmoji: feedback.emoji,
      feedbackMessage: feedback.message,
      rewardMessage: feedback.reward,
    };
  }

  /**
   * Generate detailed constructive feedback based on score
   */
  private generateDetailedFeedback(confidenceScore: number, vocabulary: any): string {
    if (confidenceScore >= 91) {
      return `Amazing! Your pronunciation of "${vocabulary.word}" was perfect. Your pronunciation closely matches the native speaker! Keep up the great work!`;
    }
    if (confidenceScore >= 76) {
      return `Great job! Your pronunciation of "${vocabulary.word}" was very good. You're very close to perfect. Try emphasizing the vowels more clearly!`;
    }
    if (confidenceScore >= 61) {
      return `Nice try! Your pronunciation of "${vocabulary.word}" was fairly good. Keep practicing to match the native pronunciation more closely!`;
    }
    if (confidenceScore >= 41) {
      return `Good effort! Your pronunciation of "${vocabulary.word}" needs a bit more practice. Listen to the native pronunciation again and try once more!`;
    }
    return `Keep trying! Your pronunciation of "${vocabulary.word}" needs practice. Make sure you're pronouncing all the syllables clearly. Try again!`;
  }

  /**
   * Check for reward triggers (badges, star bonuses, streaks)
   */
  private async checkRewardTriggers(
    childId: number,
    vocabularyId: number,
    starRating: number,
  ): Promise<{ badgeUnlocked?: string; pointsAwarded: number }> {
    let pointsAwarded = 0;
    let badgeUnlocked: string | undefined;

    // Award star points based on rating
    const pointsByRating = {
      1: 0,
      2: 0,
      3: 10,
      4: 15,
      5: 20,
    };

    pointsAwarded = pointsByRating[starRating];

    // Update child's total points
    if (pointsAwarded > 0) {
      await this.prisma.childProfile.update({
        where: { id: childId },
        data: {
          totalPoints: {
            increment: pointsAwarded,
          },
        },
      });
    }

    // Check for badge unlock (every 50 perfect attempts = 5-star ratings)
    const stats = await this.pronunciationRepository.getPronunciationStats(childId, vocabularyId);

    // Simple badge logic: unlock badge after 5 perfect attempts
    if (stats.perfectStreak >= 5 && stats.perfectStreak % 5 === 0) {
      badgeUnlocked = `🏅 Pronunciation Master: ${stats.perfectStreak} Perfect Attempts!`;
    }

    return { badgeUnlocked, pointsAwarded };
  }

  /**
   * Calculate level based on total points
   * Level = floor(totalPoints / 50) + 1
   */
  private calculateLevel(totalPoints: number): number {
    return Math.floor(totalPoints / 50) + 1;
  }

  /**
   * Get pronunciation progress for a vocabulary
   */
  async getPronunciationProgress(childId: number, vocabularyId: number) {
    const vocabulary = await this.prisma.vocabulary.findUnique({
      where: { id: vocabularyId },
      select: { word: true },
    });

    if (!vocabulary) {
      throw new NotFoundException(`Vocabulary ${vocabularyId} not found`);
    }

    const stats = await this.pronunciationRepository.getPronunciationStats(childId, vocabularyId);

    return {
      vocabularyId,
      word: vocabulary.word,
      bestScore: stats.bestScore,
      bestRating: this.convertScoreToStars(stats.bestScore),
      attemptCount: stats.attemptCount,
      perfectStreak: stats.perfectStreak,
      lastAttemptedAt: stats.lastAttemptedAt,
    };
  }

  /**
   * Get pronunciation history for current child
   */
  async getPronunciationHistory(childId: number, limit: number = 10) {
    const activities = await this.prisma.activityLog.findMany({
      where: {
        childId,
        activityType: 'PRONUNCIATION',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    const vocabularyIds = [
      ...new Set(activities.map((a) => a.vocabularyId).filter((id): id is number => !!id)),
    ];
    const vocabularies = await this.prisma.vocabulary.findMany({
      where: {
        id: {
          in: vocabularyIds,
        },
      },
      select: {
        id: true,
        word: true,
      },
    });

    const vocabularyMap = new Map(vocabularies.map((v) => [v.id, v.word]));

    return activities.map((a) => ({
      attemptId: a.id,
      vocabularyId: a.vocabularyId,
      word: a.vocabularyId ? vocabularyMap.get(a.vocabularyId) || '' : '',
      confidenceScore: ((a.metadata as any)?.confidenceScore as number) || 0,
      stars: this.convertScoreToStars(((a.metadata as any)?.confidenceScore as number) || 0),
      attemptedAt: a.createdAt,
    }));
  }

  /**
   * Get overall pronunciation statistics for child
   */
  async getPronunciationStats(childId: number) {
    const activities = await this.prisma.activityLog.findMany({
      where: {
        childId,
        activityType: 'PRONUNCIATION',
      },
    });

    const scores = activities
      .map((a) => ((a.metadata as any)?.confidenceScore as number) || 0)
      .filter((s) => s > 0);

    const perfectScores = scores.filter((s) => s >= 80).length;
    const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0;

    return {
      totalAttempts: activities.length,
      perfectAttempts: perfectScores,
      averageScore,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      accuracyRate: `${Math.round((perfectScores / Math.max(activities.length, 1)) * 100)}%`,
    };
  }
}