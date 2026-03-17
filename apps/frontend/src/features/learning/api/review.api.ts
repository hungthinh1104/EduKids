import { apiClient as axiosInstance } from '@/shared/services/api.client';

interface VocabularyItemForReviewDto {
  vocabularyId: number;
  word: string;
  definition: string;
  example?: string;
  pronunciation?: string;
  currentInterval: number;
  reviewCount: number;
  easeFactor: number;
}

interface ReviewSessionDto {
  sessionId: number;
  childId: number;
  items: VocabularyItemForReviewDto[];
  itemCount: number;
  sessionStartedAt: string;
  suggestion?: {
    message?: string;
    suggestedItems?: Array<{
      vocabularyId: number;
      topicId?: number;
      word: string;
      definition: string;
      example?: string;
      pronunciation?: string;
    }>;
  };
}

interface ReviewResultDto {
  vocabularyId: number;
  nextReview: number;
  newInterval: number;
  newEase: number;
  reviewCount: number;
  correct: boolean;
  message: string;
}

interface ReviewProgressDto {
  reviewedToday: number;
  totalDueForReview: number;
  percentageComplete: number;
  averageAccuracy: number;
  upcomingReviews: Array<{
    daysFromNow: number;
    count: number;
  }>;
}

interface ReviewStatsDto {
  childId: number;
  totalReviewed: number;
  totalCorrect: number;
  accuracy: number;
  averageEase: number;
  averageInterval: number;
  totalTimeSpent: number;
}

export interface ReviewSession {
  sessionId: string;
  childId: number;
  items: ReviewItem[];
  totalItems: number;
  suggestionMessage?: string;
  suggestedItems?: ReviewItem[];
}

export interface ReviewItem {
  reviewId: string;
  vocabularyId: number;
  topicId?: number;
  word: string;
  translation: string;
  phonetic: string;
  nextReviewDate: string;
  easeFactor: number;
  interval: number;
}

export interface ReviewSubmission {
  vocabularyId: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  correct: boolean;
  timeSpentMs?: number;
}

export interface ReviewResult {
  vocabularyId: number;
  nextReviewDate: string;
  newInterval: number;
  newEaseFactor: number;
  reviewCount: number;
  correct: boolean;
  message: string;
}

export interface ReviewProgress {
  childId?: number;
  totalReviews: number;
  dueToday: number;
  reviewedToday: number;
  masteredWords: number;
  accuracy?: number;
  completionPercentage?: number;
}

export interface ReviewStats {
  childId: number;
  totalWords: number;
  masteredWords: number;
  learningWords: number;
  newWords: number;
  averageRetention: number;
  averageEaseFactor?: number;
  averageIntervalDays?: number;
  totalMinutesSpent?: number;
}

export interface ApiEnvelope<T> {
  data: T;
  message?: string;
}

interface MasteredWordsResponse {
  childId: number;
  count: number;
  items: Array<{
    vocabularyId: number;
    word: string;
    definition: string;
    reviewCount: number;
    easeFactor: number;
    masteredAt: string;
  }>;
}

const toIsoString = (unixOrIso: number | string): string => {
  if (typeof unixOrIso === 'number') {
    return new Date(unixOrIso * 1000).toISOString();
  }
  return new Date(unixOrIso).toISOString();
};

const mapSessionItem = (item: VocabularyItemForReviewDto): ReviewItem => ({
  reviewId: String(item.vocabularyId),
  vocabularyId: item.vocabularyId,
  word: item.word,
  translation: item.definition,
  phonetic: item.pronunciation || '',
  nextReviewDate: '',
  easeFactor: item.easeFactor,
  interval: item.currentInterval,
});

const mapSuggestedItem = (item: {
  vocabularyId: number;
  topicId?: number;
  word: string;
  definition: string;
  example?: string;
  pronunciation?: string;
}): ReviewItem => ({
  reviewId: `suggested-${item.vocabularyId}`,
  vocabularyId: item.vocabularyId,
  topicId: item.topicId,
  word: item.word,
  translation: item.definition,
  phonetic: item.pronunciation || '',
  nextReviewDate: '',
  easeFactor: 2.5,
  interval: 0,
});

const mapReviewResult = (result: ReviewResultDto): ReviewResult => ({
  vocabularyId: result.vocabularyId,
  nextReviewDate: toIsoString(result.nextReview),
  newInterval: result.newInterval,
  newEaseFactor: result.newEase,
  reviewCount: result.reviewCount,
  correct: result.correct,
  message: result.message,
});

export const reviewApi = {
  // Get review session
  getSession: async (_childId?: number, limit: number = 20): Promise<ReviewSession> => {
    const response = await axiosInstance.get<ApiEnvelope<ReviewSessionDto>>(
      `vocabulary/review/session?limit=${limit}`
    );
    const payload = response.data.data;
    return {
      sessionId: String(payload.sessionId),
      childId: payload.childId,
      items: payload.items.map(mapSessionItem),
      totalItems: payload.itemCount,
      suggestionMessage: payload.suggestion?.message,
      suggestedItems: Array.isArray(payload.suggestion?.suggestedItems)
        ? payload.suggestion.suggestedItems.map(mapSuggestedItem)
        : [],
    };
  },

  // Submit review result
  submitReview: async (_childId: number, submission: ReviewSubmission): Promise<ReviewResult> => {
    const response = await axiosInstance.post<ApiEnvelope<ReviewResultDto>>(
      'vocabulary/review/submit',
      submission
    );
    return mapReviewResult(response.data.data);
  },

  // Submit bulk reviews
  submitBulk: async (_childId: number, submissions: ReviewSubmission[]): Promise<ReviewResult[]> => {
    const response = await axiosInstance.post<ApiEnvelope<ReviewResultDto[]>>(
      'vocabulary/review/submit-bulk',
      submissions
    );
    return response.data.data.map(mapReviewResult);
  },

  // Get review progress
  getProgress: async (): Promise<ReviewProgress> => {
    const response = await axiosInstance.get<ApiEnvelope<ReviewProgressDto>>(
      'vocabulary/review/progress'
    );
    const payload = response.data.data;
    return {
      totalReviews: payload.reviewedToday + payload.totalDueForReview,
      dueToday: payload.totalDueForReview,
      reviewedToday: payload.reviewedToday,
      masteredWords: 0,
      accuracy: payload.averageAccuracy,
      completionPercentage: payload.percentageComplete,
    };
  },

  // Get review stats
  getStats: async (): Promise<ReviewStats> => {
    const response = await axiosInstance.get<ApiEnvelope<ReviewStatsDto>>(
      'vocabulary/review/stats'
    );
    const payload = response.data.data;
    return {
      childId: payload.childId,
      totalWords: payload.totalReviewed,
      masteredWords: payload.totalCorrect,
      learningWords: Math.max(payload.totalReviewed - payload.totalCorrect, 0),
      newWords: 0,
      averageRetention: payload.accuracy,
      averageEaseFactor: payload.averageEase,
      averageIntervalDays: payload.averageInterval,
      totalMinutesSpent: payload.totalTimeSpent,
    };
  },

  // Get mastered words
  getMasteredWords: async (): Promise<ReviewItem[]> => {
    const response = await axiosInstance.get<ApiEnvelope<MasteredWordsResponse | ReviewItem[]>>(
      'vocabulary/review/mastered'
    );

    const payload = response.data.data;

    if (Array.isArray(payload)) {
      return payload;
    }

    if (payload && Array.isArray(payload.items)) {
      return payload.items.map((item) => ({
        reviewId: `mastered-${item.vocabularyId}`,
        vocabularyId: item.vocabularyId,
        word: item.word,
        translation: item.definition,
        phonetic: '',
        nextReviewDate: item.masteredAt,
        easeFactor: item.easeFactor,
        interval: 0,
      }));
    }

    return [];
  },
};
