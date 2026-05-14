import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class VocabularyReviewRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Get vocabulary items due for review
   */
  async getItemsDueForReview(childId: number, limit: number = 20) {
    return this.prisma.vocabularyReview.findMany({
      where: {
        childId,
        nextReview: { lte: new Date() },
      },
      include: {
        vocabulary: true,
      },
      orderBy: { nextReview: "asc" },
      take: limit,
    });
  }

  /**
   * Get all items needing review (including future)
   */
  async getAllReviewItems(childId: number) {
    return this.prisma.vocabularyReview.findMany({
      where: { childId },
      include: {
        vocabulary: true,
      },
      orderBy: { nextReview: "asc" },
    });
  }

  /**
   * Get or create review item for vocabulary
   */
  async getOrCreateReviewItem(childId: number, vocabularyId: number) {
    let item = await this.prisma.vocabularyReview.findUnique({
      where: {
        childId_vocabularyId: { childId, vocabularyId },
      },
      include: { vocabulary: true },
    });

    if (!item) {
      item = await this.prisma.vocabularyReview.create({
        data: {
          childId,
          vocabularyId,
          interval: 1,
          easeFactor: 2.5,
          reviewCount: 0,
          nextReview: new Date(),
        },
        include: { vocabulary: true },
      });
    }

    return item;
  }

  /**
   * Record review result
   */
  async recordReviewResult(
    childId: number,
    vocabularyId: number,
    correct: boolean,
    newInterval: number,
    newEase: number,
    newRepetitions: number,
    timeSpentMs?: number,
    difficulty?: "EASY" | "MEDIUM" | "HARD",
  ) {
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    const updated = await this.prisma.vocabularyReview.update({
      where: {
        childId_vocabularyId: { childId, vocabularyId },
      },
      data: {
        interval: newInterval,
        easeFactor: newEase,
        reviewCount: newRepetitions,
        nextReview: nextReviewDate,
      },
      include: { vocabulary: true },
    });

    await Promise.all([
      this.prisma.reviewSessionLog.create({
        data: {
          childId,
          vocabularyId,
          correct,
          difficulty: difficulty ?? (correct ? "EASY" : "HARD"),
          timeSpentMs,
          newInterval,
          newEase,
        },
      }),
      // Cross-post to activityLog so analytics dashboard counts review sessions
      this.prisma.activityLog.create({
        data: {
          childId,
          vocabularyId,
          activityType: "VOCABULARY_REVIEW",
          score: correct
            ? difficulty === "EASY"
              ? 100
              : difficulty === "MEDIUM"
                ? 60
                : 20
            : 0,
          durationSec: timeSpentMs ? Math.round(timeSpentMs / 1000) : 30,
          pointsEarned: 0,
        },
      }),
    ]);

    return updated;
  }

  /**
   * Seed VocabularyReview rows from LearningProgress so the review queue
   * is populated after flashcard/quiz sessions.
   * Only creates rows that don't exist yet; returns count of new rows.
   */
  async seedReviewItemsFromLearningProgress(childId: number): Promise<number> {
    const [learnedIds, reviewedIds] = await Promise.all([
      this.prisma.learningProgress
        .findMany({ where: { childId }, select: { vocabularyId: true } })
        .then((rows) => rows.map((r) => r.vocabularyId)),
      this.prisma.vocabularyReview
        .findMany({ where: { childId }, select: { vocabularyId: true } })
        .then((rows) => rows.map((r) => r.vocabularyId)),
    ]);

    const reviewedSet = new Set(reviewedIds);
    const toSeed = learnedIds.filter((id) => !reviewedSet.has(id));

    if (toSeed.length === 0) return 0;

    await this.prisma.vocabularyReview.createMany({
      data: toSeed.map((vocabularyId) => ({
        childId,
        vocabularyId,
        interval: 1,
        easeFactor: 2.5,
        reviewCount: 0,
        nextReview: new Date(),
      })),
      skipDuplicates: true,
    });

    return toSeed.length;
  }

  /**
   * Get review statistics for child
   */
  async getReviewStats(childId: number) {
    const [totalReviewed, totalCorrect, reviewAgg, timeAgg] = await Promise.all(
      [
        this.prisma.vocabularyReview.count({ where: { childId } }),
        this.prisma.reviewSessionLog.count({
          where: { childId, correct: true },
        }),
        this.prisma.vocabularyReview.aggregate({
          where: { childId },
          _avg: { easeFactor: true, interval: true },
        }),
        this.prisma.reviewSessionLog.aggregate({
          where: { childId },
          _sum: { timeSpentMs: true },
        }),
      ],
    );

    const accuracy =
      totalReviewed > 0 ? (totalCorrect / totalReviewed) * 100 : 0;
    const totalTimeSpentMs = timeAgg._sum.timeSpentMs ?? 0;

    return {
      totalReviewed,
      totalCorrect,
      accuracy: Math.round(accuracy * 100) / 100,
      averageEase: Math.round((reviewAgg._avg.easeFactor ?? 2.5) * 100) / 100,
      averageInterval: Math.round((reviewAgg._avg.interval ?? 0) * 100) / 100,
      totalTimeSpent: Math.floor(totalTimeSpentMs / 1000 / 60),
    };
  }

  /**
   * Get review progress for today
   */
  async getReviewProgress(childId: number) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const [reviewedToday, totalDueForReview] = await Promise.all([
      this.prisma.reviewSessionLog.count({
        where: {
          childId,
          createdAt: { gte: now },
        },
      }),
      this.prisma.vocabularyReview.count({
        where: {
          childId,
          nextReview: { lte: new Date() },
        },
      }),
    ]);

    // Get upcoming review distribution using DB-level counts (avoids loading all rows)
    const upcomingReviews = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= 7; i++) {
      const dayStart = new Date(today);
      dayStart.setDate(today.getDate() + i);

      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      const count = await this.prisma.vocabularyReview.count({
        where: {
          childId,
          nextReview: { gte: dayStart, lt: dayEnd },
        },
      });

      if (count > 0) {
        upcomingReviews.push({ daysFromNow: i, count });
      }
    }

    return {
      reviewedToday,
      totalDueForReview,
      percentageComplete:
        totalDueForReview > 0
          ? Math.round((reviewedToday / totalDueForReview) * 100)
          : 0,
      averageAccuracy: 0, // To be calculated separately
      upcomingReviews,
    };
  }

  /**
   * Get review history for vocabulary item
   */
  async getReviewHistory(childId: number, vocabularyId: number) {
    return this.prisma.reviewSessionLog.findMany({
      where: { childId, vocabularyId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  /**
   * Suggest vocabulary the child has already encountered (via flashcard/quiz)
   * but hasn't entered the SRS review queue yet.
   */
  async suggestNewVocabulary(childId: number, limit: number = 5) {
    const [reviewedIds, learnedIds] = await Promise.all([
      this.prisma.vocabularyReview
        .findMany({ where: { childId }, select: { vocabularyId: true } })
        .then((items) => items.map((i) => i.vocabularyId)),
      this.prisma.learningProgress
        .findMany({ where: { childId }, select: { vocabularyId: true } })
        .then((rows) => rows.map((r) => r.vocabularyId)),
    ]);

    const reviewedSet = new Set(reviewedIds);
    const candidateIds = learnedIds.filter((id) => !reviewedSet.has(id));

    if (candidateIds.length === 0) return [];

    return this.prisma.vocabulary.findMany({
      where: { id: { in: candidateIds } },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get items mastered by child
   */
  async getMasteredItems(childId: number) {
    return this.prisma.vocabularyReview.findMany({
      where: {
        childId,
        easeFactor: { gte: 2.3 }, // High ease factor indicates mastery
        reviewCount: { gte: 5 }, // Multiple successful reviews
      },
      include: { vocabulary: true },
      orderBy: { easeFactor: "desc" },
    });
  }

  /**
   * Award stars to child profile (UC-C11, UC-C12)
   * Creates StarTransaction record
   */
  async awardStars(childId: number, stars: number, reason: string) {
    // Update child's total points
    await this.prisma.childProfile.update({
      where: { id: childId },
      data: {
        totalPoints: { increment: stars },
      },
    });

    // Record transaction (aligned with StarTransaction schema)
    return this.prisma.starTransaction.create({
      data: {
        childId,
        points: stars,
        reason: reason,
        date: new Date(),
      },
    });
  }

  /**
   * Update daily progress and streak (UC-P3, UC-C4)
   */
  async updateDailyProgress(childId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const child = await this.prisma.childProfile.findUnique({
      where: { id: childId },
    });

    if (!child) return;

    // Check if learned today already
    const todayProgress = await this.prisma.dailyProgress.findFirst({
      where: {
        childId,
        date: { gte: today },
      },
    });

    if (!todayProgress) {
      // Create today's progress (aligned with DailyProgress schema)
      await this.prisma.dailyProgress.create({
        data: {
          childId,
          date: today,
          wordsLearned: 1,
          pointsEarned: 0,
          totalTimeSec: 0,
        },
      });

      // Update streak — compare by UTC day boundaries to avoid timezone drift
      const yesterday = new Date(today);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayEnd = new Date(today);

      const yesterdayProgress = await this.prisma.dailyProgress.findFirst({
        where: {
          childId,
          date: { gte: yesterday, lt: yesterdayEnd },
        },
      });

      // Only reset streak if child genuinely had no activity yesterday;
      // keep existing count when the streak should continue.
      await this.prisma.childProfile.update({
        where: { id: childId },
        data: {
          lastLearnDate: new Date(),
          streakCount: yesterdayProgress ? { increment: 1 } : { set: 1 },
        },
      });
    } else {
      // Update existing progress
      await this.prisma.dailyProgress.update({
        where: { id: todayProgress.id },
        data: {
          wordsLearned: { increment: 1 },
        },
      });
    }
  }
}
