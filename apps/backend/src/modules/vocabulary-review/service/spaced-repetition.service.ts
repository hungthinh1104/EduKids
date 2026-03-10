import { Injectable } from "@nestjs/common";

/**
 * Spaced Repetition Algorithm (SM-2)
 * Based on the SuperMemo 2 algorithm for optimal retention
 */
@Injectable()
export class SpacedRepetitionService {
  private readonly MIN_EASE = 1.3;
  private readonly MAX_EASE = 2.5;
  private readonly INITIAL_EASE = 2.5;
  private readonly INITIAL_INTERVAL = 1; // 1 day

  /**
   * Calculate next review date based on performance
   * SM-2 Algorithm:
   * - if difficulty < 3: interval = 1, ease = max(MIN_EASE, ease - 0.2)
   * - if difficulty = 3: interval = 6
   * - if difficulty > 3: interval = previous_interval * ease
   */
  calculateNextReview(
    currentInterval: number,
    currentEase: number,
    difficulty: number, // 0-5 scale (0=blackout, 5=perfect)
    reviewCount: number,
  ) {
    let newInterval: number;

    // Calculate ease factor based on difficulty
    const easeAdjustment = 0.1 * (5 - difficulty);
    const newEase = Math.max(
      this.MIN_EASE,
      Math.min(this.MAX_EASE, currentEase + easeAdjustment),
    );

    // Calculate interval based on performance
    if (difficulty < 3) {
      // Failed to recall - restart learning
      newInterval = 1; // 1 day
    } else if (reviewCount === 1) {
      // First successful review
      newInterval = 1;
    } else if (reviewCount === 2) {
      // Second successful review
      newInterval = 3;
    } else {
      // Subsequent reviews - apply ease factor
      newInterval = Math.ceil(currentInterval * newEase);
    }

    return {
      interval: newInterval,
      easeFactor: newEase,
      nextReviewTimestamp: this.getNextReviewTimestamp(newInterval),
    };
  }

  /**
   * Convert review difficulty enum to SM-2 scale (0-5)
   */
  difficultyToScale(difficulty: string): number {
    // Map UI difficulty to SM-2 scale
    // EASY (5) = perfect recall
    // MEDIUM (3) = acceptable recall
    // HARD (2) = difficult but remembered
    const difficultyMap: Record<string, number> = {
      EASY: 5,
      MEDIUM: 3,
      HARD: 2,
    };
    return difficultyMap[difficulty] || 2;
  }

  /**
   * Get next review timestamp
   */
  private getNextReviewTimestamp(daysFromNow: number): number {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysFromNow);
    return nextDate.getTime();
  }

  /**
   * Calculate review due date
   */
  isReviewDue(createdAt: Date, currentInterval: number): boolean {
    const nextReviewDate = new Date(createdAt);
    nextReviewDate.setDate(nextReviewDate.getDate() + currentInterval);
    return new Date() >= nextReviewDate;
  }

  /**
   * Get days until next review
   */
  getDaysUntilNextReview(createdAt: Date, currentInterval: number): number {
    const nextReviewDate = new Date(createdAt);
    nextReviewDate.setDate(nextReviewDate.getDate() + currentInterval);

    const now = new Date();
    const daysUntil = Math.ceil(
      (nextReviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return Math.max(0, daysUntil);
  }

  /**
   * Initialize review metrics for new vocabulary
   */
  getInitialMetrics() {
    return {
      interval: this.INITIAL_INTERVAL,
      easeFactor: this.INITIAL_EASE,
      reviewCount: 0,
      nextReviewTimestamp: this.getNextReviewTimestamp(this.INITIAL_INTERVAL),
    };
  }
}
