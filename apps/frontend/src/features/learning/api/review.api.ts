import { apiClient as axiosInstance } from '@/shared/services/api.client';

export interface ReviewSession {
  sessionId: string;
  childId: number;
  items: ReviewItem[];
  totalItems: number;
}

export interface ReviewItem {
  reviewId: string;
  vocabularyId: number;
  word: string;
  translation: string;
  phonetic: string;
  nextReviewDate: string;
  easeFactor: number;
  interval: number;
}

export interface ReviewSubmission {
  reviewId: string;
  quality: number; // 0-5 (0=complete blackout, 5=perfect response)
}

export interface ReviewResult {
  reviewId: string;
  nextReviewDate: string;
  newInterval: number;
  newEaseFactor: number;
}

export interface ReviewProgress {
  childId: number;
  totalReviews: number;
  dueToday: number;
  reviewedToday: number;
  masteredWords: number;
}

export interface ReviewStats {
  childId: number;
  totalWords: number;
  masteredWords: number;
  learningWords: number;
  newWords: number;
  averageRetention: number;
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

export const reviewApi = {
  // Get review session
  getSession: async (childId: number, limit: number = 20): Promise<ReviewSession> => {
    const response = await axiosInstance.get<ApiEnvelope<ReviewSession>>(
      `vocabulary/review/session?childId=${childId}&limit=${limit}`
    );
    return response.data.data;
  },

  // Submit review result
  submitReview: async (childId: number, submission: ReviewSubmission): Promise<ReviewResult> => {
    const response = await axiosInstance.post<ApiEnvelope<ReviewResult>>(
      'vocabulary/review/submit',
      { childId, ...submission }
    );
    return response.data.data;
  },

  // Submit bulk reviews
  submitBulk: async (childId: number, submissions: ReviewSubmission[]): Promise<ReviewResult[]> => {
    const response = await axiosInstance.post<ApiEnvelope<ReviewResult[]>>(
      'vocabulary/review/submit-bulk',
      { childId, reviews: submissions }
    );
    return response.data.data;
  },

  // Get review progress
  getProgress: async (childId: number): Promise<ReviewProgress> => {
    const response = await axiosInstance.get<ApiEnvelope<ReviewProgress>>(
      `vocabulary/review/progress?childId=${childId}`
    );
    return response.data.data;
  },

  // Get review stats
  getStats: async (childId: number): Promise<ReviewStats> => {
    const response = await axiosInstance.get<ApiEnvelope<ReviewStats>>(
      `vocabulary/review/stats?childId=${childId}`
    );
    return response.data.data;
  },

  // Get mastered words
  getMasteredWords: async (childId: number): Promise<ReviewItem[]> => {
    const response = await axiosInstance.get<ApiEnvelope<MasteredWordsResponse | ReviewItem[]>>(
      `vocabulary/review/mastered?childId=${childId}`
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
