import { Injectable, NotFoundException } from "@nestjs/common";
import { VocabularyReviewRepository } from "../repository/vocabulary-review.repository";
import { SpacedRepetitionService } from "./spaced-repetition.service";
import { SubmitReviewRequestDto } from "../dto/vocabulary-review.dto";

@Injectable()
export class VocabularyReviewService {
  constructor(
    private repository: VocabularyReviewRepository,
    private spacedRepetition: SpacedRepetitionService,
  ) {}

  /**
   * Get review items due today
   */
  async getReviewSession(childId: number, limit: number = 20) {
    const items = await this.repository.getItemsDueForReview(childId, limit);

    if (items.length === 0) {
      // No items due - suggest new vocabulary
      const suggestions = await this.repository.suggestNewVocabulary(
        childId,
        5,
      );
      return {
        sessionId: 0,
        childId,
        items: [],
        itemCount: 0,
        sessionStartedAt: new Date().toISOString(),
        suggestion: {
          message: "No items due for review. Try learning new vocabulary!",
          suggestedItems: suggestions,
        },
      };
    }

    return {
      sessionId: Math.random(),
      childId,
      items: items.map((item) => ({
        vocabularyId: item.vocabularyId,
        word: item.vocabulary.word,
        definition: item.vocabulary.translation,
        example: item.vocabulary.exampleSentence,
        pronunciation: item.vocabulary.phonetic,
        currentInterval: item.interval,
        reviewCount: item.reviewCount,
        easeFactor: item.easeFactor,
      })),
      itemCount: items.length,
      sessionStartedAt: new Date().toISOString(),
    };
  }

  /**
   * Submit review result
   * Awards stars and updates streak
   */
  async submitReview(childId: number, request: SubmitReviewRequestDto) {
    // Verify child owns this vocabulary
    const reviewItem = await this.repository.getOrCreateReviewItem(
      childId,
      request.vocabularyId,
    );

    if (!reviewItem) {
      throw new NotFoundException("Vocabulary item not found");
    }

    // Convert difficulty to SM-2 scale
    const difficulty = this.spacedRepetition.difficultyToScale(
      request.difficulty,
    );

    // Calculate next review using spaced repetition
    const result = this.spacedRepetition.calculateNextReview(
      reviewItem.interval,
      reviewItem.easeFactor,
      difficulty,
      reviewItem.reviewCount + 1,
    );

    // Record the result
    await this.repository.recordReviewResult(
      childId,
      request.vocabularyId,
      request.correct,
      result.interval,
      result.easeFactor,
      reviewItem.reviewCount + 1,
      request.timeSpentMs,
    );

    // Award stars for correct answers (UC-C11, UC-C12)
    let starsAwarded = 0;
    if (request.correct) {
      starsAwarded = this.calculateStarReward(
        difficulty,
        reviewItem.reviewCount + 1,
      );
      await this.repository.awardStars(
        childId,
        starsAwarded,
        "VOCABULARY_REVIEW",
      );
    }

    // Update streak and daily progress (UC-P3, UC-C4)
    await this.repository.updateDailyProgress(childId);

    return {
      vocabularyId: request.vocabularyId,
      nextReview: result.nextReviewTimestamp,
      newInterval: result.interval,
      newEase: result.easeFactor,
      reviewCount: reviewItem.reviewCount + 1,
      correct: request.correct,
      starsAwarded,
      message: request.correct
        ? `Great job! +${starsAwarded} ⭐`
        : "Keep practicing!",
    };
  }

  /**
   * Calculate star reward based on difficulty and review count
   */
  private calculateStarReward(difficulty: number, reviewCount: number): number {
    // Base: 1-3 stars depending on difficulty
    let stars = Math.ceil(difficulty / 2);

    // Bonus for mastery (review count > 5)
    if (reviewCount > 5) {
      stars += 1;
    }

    return Math.min(stars, 5); // Cap at 5 stars
  }

  /**
   * Bulk submit reviews
   */
  async submitBulkReviews(childId: number, reviews: SubmitReviewRequestDto[]) {
    const results = [];

    for (const review of reviews) {
      try {
        const result = await this.submitReview(childId, review);
        results.push(result);
      } catch (error) {
        results.push({
          vocabularyId: review.vocabularyId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  /**
   * Get review progress
   */
  async getProgress(childId: number) {
    const progress = await this.repository.getReviewProgress(childId);

    // Calculate average accuracy
    const stats = await this.repository.getReviewStats(childId);
    progress.averageAccuracy = stats.accuracy;

    return progress;
  }

  /**
   * Get review statistics
   */
  async getStatistics(childId: number) {
    const stats = await this.repository.getReviewStats(childId);
    return {
      childId,
      ...stats,
    };
  }

  /**
   * Get review history for item
   */
  async getHistory(childId: number, vocabularyId: number) {
    return this.repository.getReviewHistory(childId, vocabularyId);
  }

  /**
   * Get mastered vocabulary
   */
  async getMasteredVocabulary(childId: number) {
    const items = await this.repository.getMasteredItems(childId);
    return {
      childId,
      count: items.length,
      items: items.map((item) => ({
        vocabularyId: item.vocabularyId,
        word: item.vocabulary.word,
        definition: item.vocabulary.translation,
        reviewCount: item.reviewCount,
        easeFactor: item.easeFactor,
        masteredAt: item.nextReview,
      })),
    };
  }

  /**
   * Get suggested vocabulary for child
   */
  async getSuggestions(childId: number, limit: number = 10) {
    const suggestions = await this.repository.suggestNewVocabulary(
      childId,
      limit,
    );

    return {
      childId,
      count: suggestions.length,
      items: suggestions.map((item) => ({
        vocabularyId: item.id,
        topicId: item.topicId,
        word: item.word,
        definition: item.translation,
        example: item.exampleSentence,
        pronunciation: item.phonetic,
      })),
      message:
        suggestions.length > 0
          ? "Great! Here are new vocabulary items to learn."
          : "No new vocabulary available.",
    };
  }

  /**
   * Get all review items
   */
  async getAllReviewItems(childId: number) {
    const items = await this.repository.getAllReviewItems(childId);

    return {
      childId,
      totalItems: items.length,
      items: items.map((item) => ({
        vocabularyId: item.vocabularyId,
        word: item.vocabulary.word,
        interval: item.interval,
        easeFactor: item.easeFactor,
        reviewCount: item.reviewCount,
        nextReview: item.nextReview,
        createdAt: item.nextReview,
      })),
    };
  }
}
