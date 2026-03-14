import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PronunciationRepository } from './repositories/pronunciation.repository';
import { PronunciationSubmitDto, StarRatingDto, PronunciationFeedbackDto } from './dto/pronunciation.dto';
import { PronunciationAssessmentService } from './pronunciation-assessment.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PronunciationAssessmentMode,
  PronunciationWordErrorType,
} from './dto/pronunciation-assessment.dto';

@Injectable()
export class PronunciationService {
  constructor(
    private readonly pronunciationRepository: PronunciationRepository,
    private readonly pronunciationAssessmentService: PronunciationAssessmentService,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async submitPronunciationAttempt(
    childId: number,
    vocabularyId: number,
    dto: PronunciationSubmitDto,
  ): Promise<PronunciationFeedbackDto> {
    const vocabulary = await this.pronunciationRepository.getVocabularyWithPronunciationData(
      vocabularyId,
    );
    if (!vocabulary) {
      throw new NotFoundException(`Vocabulary ${vocabularyId} not found`);
    }

    if (dto.confidenceScore !== undefined && (dto.confidenceScore < 0 || dto.confidenceScore > 100)) {
      throw new BadRequestException('Confidence score must be between 0-100');
    }

    if (!dto.audioBase64) {
      throw new BadRequestException('A WAV audio recording is required for pronunciation assessment');
    }

    const mode = this.resolveMode(dto);
    const referenceText = this.resolveReferenceText(dto, vocabulary.word);
    const normalizedDuration = this.normalizeDuration(dto.recordingDurationMs);

    const assessment = await this.pronunciationAssessmentService.buildAssessment({
      confidenceScore: dto.confidenceScore,
      mode,
      word: vocabulary.word,
      referenceText,
      targetIpa: vocabulary.phonetic,
      recognizedText: dto.recognizedText,
      recognizedIpa: dto.recognizedIpa,
      audioBase64: dto.audioBase64,
      audioMimeType: dto.audioMimeType,
    });

    const activity = await this.pronunciationRepository.create({
      id: undefined,
      childId: childId.toString(),
      vocabularyId: vocabularyId.toString(),
      aiScore: assessment.overallScore,
      mode,
      referenceText,
      recordingDurationMs: normalizedDuration,
      feedback: dto.evaluationNotes || '',
      assessment,
      createdAt: new Date(),
    });

    const starRating = this.convertScoreToStars(assessment.overallScore);
    const rating = this.generateKidFriendlyFeedback(assessment.overallScore, starRating);

    await this.pronunciationRepository.updatePronunciationProgress(
      childId,
      vocabularyId,
      assessment.overallScore,
      starRating,
    );

    const rewardInfo = await this.checkRewardTriggers(childId, vocabularyId, starRating);

    const child = await this.prisma.childProfile.findUnique({
      where: { id: childId },
      select: { totalPoints: true },
    });

    const currentLevel = this.calculateLevel(child?.totalPoints || 0);
    const nativePronunciationAudio =
      vocabulary.media && vocabulary.media.length > 0
        ? vocabulary.media[0].url
        : `tts:///${vocabulary.word}`;

    return {
      attemptId: parseInt(activity.id as any, 10) || 0,
      vocabularyId,
      word: vocabulary.word,
      confidenceScore: assessment.overallScore,
      mode,
      rating,
      nativePronunciationAudio,
      detailedFeedback: this.generateDetailedFeedback(assessment, vocabulary.word),
      totalPoints: child?.totalPoints || 0,
      currentLevel,
      badgeUnlocked: rewardInfo.badgeUnlocked,
      attemptedAt: activity.createdAt,
      assessment,
    };
  }

  private resolveMode(dto: PronunciationSubmitDto): PronunciationAssessmentMode {
    if (dto.mode) {
      return dto.mode;
    }

    if (dto.referenceText && dto.referenceText.trim().split(/\s+/).length > 1) {
      return PronunciationAssessmentMode.PARAGRAPH;
    }

    return PronunciationAssessmentMode.WORD;
  }

  private resolveReferenceText(dto: PronunciationSubmitDto, fallbackWord: string): string {
    const referenceText = dto.referenceText?.trim();
    if (!referenceText) {
      return fallbackWord;
    }

    return referenceText;
  }

  private normalizeDuration(recordingDurationMs?: number): number | undefined {
    if (recordingDurationMs === undefined) return undefined;
    return Math.min(120000, Math.max(100, Math.round(recordingDurationMs)));
  }

  private convertScoreToStars(confidenceScore: number): number {
    if (confidenceScore >= 91) return 5;
    if (confidenceScore >= 76) return 4;
    if (confidenceScore >= 61) return 3;
    if (confidenceScore >= 41) return 2;
    return 1;
  }

  private generateKidFriendlyFeedback(
    _confidenceScore: number,
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

  private generateDetailedFeedback(
    assessment: PronunciationFeedbackDto['assessment'],
    vocabularyWord: string,
  ): string {
    const confidenceScore = assessment?.overallScore || 0;
    const weakWords =
      assessment?.words?.filter(
        (word) =>
          word.errorType &&
          word.errorType !== PronunciationWordErrorType.NONE &&
          word.errorType !== PronunciationWordErrorType.UNKNOWN,
      ) || [];

    if (assessment?.mode === PronunciationAssessmentMode.PARAGRAPH) {
      if (confidenceScore >= 91) {
        return 'Amazing reading! Your pronunciation, rhythm, and expression sounded very natural.';
      }
      if (weakWords.length > 0) {
        const sample = weakWords.slice(0, 3).map((word) => word.word).join(', ');
        return `Nice effort! Review these words again: ${sample}. Focus on clear sounds and smooth pacing.`;
      }
      return 'Good job! Try again and make your pacing even smoother for a higher score.';
    }

    if (confidenceScore >= 91) {
      return `Amazing! Your pronunciation of "${vocabularyWord}" was perfect.`;
    }
    if (confidenceScore >= 76) {
      return `Great job! Your pronunciation of "${vocabularyWord}" was very good.`;
    }
    if (confidenceScore >= 61) {
      return `Nice try! Your pronunciation of "${vocabularyWord}" was fairly good.`;
    }
    if (confidenceScore >= 41) {
      return `Good effort! Listen to "${vocabularyWord}" once more and try again.`;
    }
    return `Keep trying! Focus on pronouncing each sound in "${vocabularyWord}" clearly.`;
  }

  private async checkRewardTriggers(
    childId: number,
    vocabularyId: number,
    starRating: number,
  ): Promise<{ badgeUnlocked?: string; pointsAwarded: number }> {
    let pointsAwarded = 0;
    let badgeUnlocked: string | undefined;

    const pointsByRating = {
      1: 0,
      2: 0,
      3: 10,
      4: 15,
      5: 20,
    };

    pointsAwarded = pointsByRating[starRating];

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

    const stats = await this.pronunciationRepository.getPronunciationStats(childId, vocabularyId);
    if (stats.perfectStreak >= 5 && stats.perfectStreak % 5 === 0) {
      badgeUnlocked = `🏅 Pronunciation Master: ${stats.perfectStreak} Perfect Attempts!`;
    }

    return { badgeUnlocked, pointsAwarded };
  }

  private calculateLevel(totalPoints: number): number {
    return Math.floor(totalPoints / 50) + 1;
  }

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

  async getPronunciationHistory(childId: number, limit: number = 10) {
    const attempts = await this.pronunciationRepository.getHistory(childId, limit);
    const vocabularyIds = [...new Set(attempts.map((attempt) => attempt.vocabularyId))];
    const vocabularies = await this.prisma.vocabulary.findMany({
      where: { id: { in: vocabularyIds } },
      select: { id: true, word: true },
    });

    const vocabularyMap = new Map(vocabularies.map((vocabulary) => [vocabulary.id, vocabulary.word]));

    return attempts.map((attempt) => ({
      attemptId: attempt.id,
      vocabularyId: attempt.vocabularyId,
      word: vocabularyMap.get(attempt.vocabularyId) || '',
      confidenceScore: attempt.overallScore || 0,
      mode:
        ((attempt.assessment as unknown as PronunciationFeedbackDto['assessment'])?.mode ??
          PronunciationAssessmentMode.WORD),
      rating: this.generateKidFriendlyFeedback(
        attempt.overallScore || 0,
        this.convertScoreToStars(attempt.overallScore || 0),
      ),
      assessment: attempt.assessment as unknown as PronunciationFeedbackDto['assessment'],
      attemptedAt: attempt.createdAt,
    }));
  }

  async getPronunciationStats(childId: number) {
    const attempts = await this.pronunciationRepository.getOverallStats(childId);
    const scores = attempts
      .map((attempt) => attempt.overallScore || 0)
      .filter((score) => score > 0);

    const perfectScores = scores.filter((score) => score >= 80).length;
    const averageScore =
      scores.length > 0
        ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
        : 0;

    return {
      totalAttempts: attempts.length,
      perfectAttempts: perfectScores,
      averageScore,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      accuracyRate: `${Math.round((perfectScores / Math.max(attempts.length, 1)) * 100)}%`,
      masteredWords: scores.filter((score) => score >= 80).length,
      improvingWords: scores.filter((score) => score >= 60 && score < 80).length,
      needsPractice: scores.filter((score) => score < 60).length,
    };
  }
}
