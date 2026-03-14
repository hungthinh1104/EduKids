import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PronunciationAttemptEntity } from '../entities/pronunciation-attempt.entity';
import { IPronunciationRepository } from './pronunciation.repository.interface';
import {
  LearningProgress,
  PronunciationAssessmentMode,
  PronunciationProvider,
} from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class PronunciationRepository implements IPronunciationRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Record pronunciation attempt with confidence score from Web Speech API
   * NFR-03: Audio not stored permanently, only confidence score recorded
   */
  async create(attempt: PronunciationAttemptEntity): Promise<PronunciationAttemptEntity> {
    const metadata = {
      confidenceScore: attempt.aiScore,
      evaluationNotes: attempt.feedback || null,
      assessment: attempt.assessment ? JSON.parse(JSON.stringify(attempt.assessment)) : null,
    };

    const childId = parseInt(attempt.childId, 10);
    const vocabularyId = parseInt(attempt.vocabularyId, 10);
    const recordingDurationMs =
      typeof attempt.recordingDurationMs === 'number' &&
      Number.isFinite(attempt.recordingDurationMs) &&
      attempt.recordingDurationMs > 0
        ? attempt.recordingDurationMs
        : undefined;

    const result = await this.prisma.$transaction(async (tx) => {
      const pronunciationAttempt = await tx.pronunciationAttempt.create({
        data: {
          childId,
          vocabularyId,
          provider: (attempt.assessment?.provider ||
            'CUSTOM') as PronunciationProvider,
          mode: (attempt.mode ||
            attempt.assessment?.mode ||
            PronunciationAssessmentMode.WORD) as PronunciationAssessmentMode,
          referenceText:
            attempt.referenceText || attempt.assessment?.referenceText || null,
          overallScore: attempt.aiScore,
          accuracyScore: attempt.assessment?.accuracyScore,
          fluencyScore: attempt.assessment?.fluencyScore,
          completenessScore: attempt.assessment?.completenessScore,
          prosodyScore: attempt.assessment?.prosodyScore,
          recognizedText: attempt.assessment?.recognizedText,
          recognizedIpa: attempt.assessment?.recognizedIpa,
          feedback: attempt.feedback || null,
          recordingDurationMs,
          passed: attempt.assessment?.passed,
          assessment: attempt.assessment
            ? (JSON.parse(JSON.stringify(attempt.assessment)) as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
      });

      const activity = await tx.activityLog.create({
        data: {
          childId,
          vocabularyId,
          activityType: 'PRONUNCIATION',
          score: attempt.aiScore,
          metadata: metadata as Prisma.InputJsonValue,
          durationSec:
            typeof recordingDurationMs === 'number'
              ? Math.max(1, Math.round(recordingDurationMs / 1000))
              : 0,
        },
      });

      return { pronunciationAttempt, activity };
    });

    return {
      id: result.pronunciationAttempt.id.toString(),
      childId: result.pronunciationAttempt.childId.toString(),
      vocabularyId: result.pronunciationAttempt.vocabularyId.toString(),
      aiScore: result.pronunciationAttempt.overallScore || 0,
      mode: result.pronunciationAttempt.mode,
      referenceText: result.pronunciationAttempt.referenceText || undefined,
      recordingDurationMs: result.pronunciationAttempt.recordingDurationMs || undefined,
      feedback: result.pronunciationAttempt.feedback || '',
      assessment: result.pronunciationAttempt.assessment as any,
      createdAt: result.pronunciationAttempt.createdAt,
    };
  }

  /**
   * Get all pronunciation attempts for a child
   */
  async findByChild(childId: string): Promise<PronunciationAttemptEntity[]> {
    const attempts = await this.prisma.pronunciationAttempt.findMany({
      where: {
        childId: parseInt(childId, 10),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return attempts.map((attempt) => ({
      id: attempt.id.toString(),
      childId: attempt.childId.toString(),
      vocabularyId: attempt.vocabularyId.toString(),
      aiScore: attempt.overallScore || 0,
      mode: attempt.mode,
      referenceText: attempt.referenceText || undefined,
      recordingDurationMs: attempt.recordingDurationMs || undefined,
      feedback: attempt.feedback || '',
      assessment: attempt.assessment as any,
      createdAt: attempt.createdAt,
    }));
  }

  /**
   * Get recent pronunciation attempts for specific vocabulary
   */
  async getRecentAttempts(
    childId: number,
    vocabularyId: number,
    limit: number = 10,
  ) {
    return this.prisma.pronunciationAttempt.findMany({
      where: {
        childId,
        vocabularyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get pronunciation statistics for vocabulary
   * Returns best score, attempt count, perfect streak
   */
  async getPronunciationStats(
    childId: number,
    vocabularyId: number,
  ): Promise<{
    bestScore: number;
    attemptCount: number;
    lastAttemptedAt: Date | null;
    perfectStreak: number;
  }> {
    const attempts = await this.getRecentAttempts(childId, vocabularyId, 100);

    if (attempts.length === 0) {
      return {
        bestScore: 0,
        attemptCount: 0,
        lastAttemptedAt: null,
        perfectStreak: 0,
      };
    }

    // Extract confidence scores from metadata
    const scores = attempts
      .map((a) => a.overallScore || 0)
      .filter((s) => s > 0);

    // Calculate perfect streak (consecutive scores >= 80)
    let perfectStreak = 0;
    for (const score of scores) {
      if (score >= 80) {
        perfectStreak++;
      } else {
        break;
      }
    }

    return {
      bestScore: Math.max(...scores, 0),
      attemptCount: attempts.length,
      lastAttemptedAt: attempts[0].createdAt,
      perfectStreak,
    };
  }

  async getHistory(childId: number, limit: number = 10) {
    return this.prisma.pronunciationAttempt.findMany({
      where: { childId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getOverallStats(childId: number) {
    return this.prisma.pronunciationAttempt.findMany({
      where: { childId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update learning progress with pronunciation score
   * Upserts LearningProgress with pronunciation-specific data
   */
  async updatePronunciationProgress(
    childId: number,
    vocabularyId: number,
    confidenceScore: number,
    starRating: number,
  ): Promise<LearningProgress> {
    const progress = await this.prisma.learningProgress.upsert({
      where: {
        childId_vocabularyId: {
          childId,
          vocabularyId,
        },
      },
      create: {
        childId,
        vocabularyId,
        pronunciationScore: confidenceScore,
        lastReviewedAt: new Date(),
      },
      update: {
        pronunciationScore: confidenceScore,
        lastReviewedAt: new Date(),
      },
    });

    return progress;
  }

  /**
   * Get vocabulary details with pronunciation data
   */
  async getVocabularyWithPronunciationData(vocabularyId: number) {
    return this.prisma.vocabulary.findUnique({
      where: { id: vocabularyId },
      include: {
        topic: {
          select: { id: true, name: true },
        },
        media: {
          where: { type: 'AUDIO' },
          select: { url: true, type: true },
        },
      },
    });
  }

  /**
   * Get top performers in pronunciation for a vocabulary (for leaderboard)
   */
  async getTopPronunciationScores(
    vocabularyId: number,
    limit: number = 5,
  ): Promise<any[]> {
    // Simplified fallback for current schema: no per-vocabulary pronunciation leaderboard fields.
    void vocabularyId;
    void limit;
    return [];
  }
}
