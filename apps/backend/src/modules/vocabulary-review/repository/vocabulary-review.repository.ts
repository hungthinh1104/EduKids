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
  ) {
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    // Update review item
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

    // Log review session
    await this.prisma.reviewSessionLog.create({
      data: {
        childId,
        vocabularyId,
        correct,
        difficulty: correct ? "EASY" : "HARD",
        timeSpentMs,
        newInterval,
        newEase,
      },
    });

    return updated;
  }

  /**
   * Get review statistics for child
   */
  async getReviewStats(childId: number) {
    const [totalReviewed, totalCorrect, reviewItems, sessions] =
      await Promise.all([
        this.prisma.vocabularyReview.count({ where: { childId } }),
        this.prisma.reviewSessionLog.count({
          where: { childId, correct: true },
        }),
        this.prisma.vocabularyReview.findMany({ where: { childId } }),
        this.prisma.reviewSessionLog.findMany({ where: { childId } }),
      ]);

    const totalTimeSpent = sessions.reduce(
      (sum, s) => sum + (s.timeSpentMs || 0),
      0,
    );
    const accuracy =
      totalReviewed > 0 ? (totalCorrect / totalReviewed) * 100 : 0;

    const averageEase =
      reviewItems.length > 0
        ? reviewItems.reduce((sum, item) => sum + item.easeFactor, 0) /
          reviewItems.length
        : 2.5;

    const averageInterval =
      reviewItems.length > 0
        ? reviewItems.reduce((sum, item) => sum + item.interval, 0) /
          reviewItems.length
        : 0;

    return {
      totalReviewed,
      totalCorrect,
      accuracy: Math.round(accuracy * 100) / 100,
      averageEase: Math.round(averageEase * 100) / 100,
      averageInterval: Math.round(averageInterval * 100) / 100,
      totalTimeSpent: Math.floor(totalTimeSpent / 1000 / 60), // Convert to minutes
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

    // Get upcoming review distribution
    const upcomingReviews = [];
    const reviewItems = await this.prisma.vocabularyReview.findMany({
      where: { childId },
    });

    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = reviewItems.filter(
        (item) => item.nextReview >= date && item.nextReview < nextDate,
      ).length;

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
   * Suggest new vocabulary to learn
   */
  async suggestNewVocabulary(childId: number, limit: number = 5) {
    // Get vocabulary items child hasn't reviewed yet
    const reviewedIds = await this.prisma.vocabularyReview
      .findMany({
        where: { childId },
        select: { vocabularyId: true },
      })
      .then((items) => items.map((i) => i.vocabularyId));

    return this.prisma.vocabulary.findMany({
      where: {
        id: { notIn: reviewedIds },
      },
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

      // Update streak
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const yesterdayProgress = await this.prisma.dailyProgress.findFirst({
        where: {
          childId,
          date: { gte: yesterday, lt: today },
        },
      });

      await this.prisma.childProfile.update({
        where: { id: childId },
        data: {
          lastLearnDate: new Date(),
          streakCount: yesterdayProgress ? { increment: 1 } : 1,
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
