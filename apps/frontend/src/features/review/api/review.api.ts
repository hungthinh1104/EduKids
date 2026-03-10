import { apiClient } from '@/shared/services/api.client';

// ==================== VOCABULARY REVIEW API ====================
// Spaced repetition system

export interface ReviewProgress {
  childId: number;
  totalReviews: number;
  masteredCount: number;
  learningCount: number;
  dueToday: number;
  streakDays: number;
  nextReviewAt: string;
}

export interface ReviewSession {
  sessionId: string;
  vocabularies: Array<{
    id: number;
    word: string;
    translation: string; // renamed from meaning
    imageUrl: string;
    audioUrl: string;
  }>;
  totalWords: number;
}

export interface ReviewResult {
  vocabularyId: number;
  quality: number; // 0-5 (0=wrong, 5=perfect)
  nextReviewAt: string;
  repetitionNumber: number;
  easinessFactor: number;
}

/**
 * Get review progress
 * GET /api/vocabulary/review/progress?childId=X
 * @Roles PARENT or LEARNER
 */
export const getReviewProgress = async (childId?: number): Promise<ReviewProgress> => {
  const url = childId ? `/vocabulary/review/progress?childId=${childId}` : '/vocabulary/review/progress';
  const response = await apiClient.get(url);
  return response.data.data;
};

/**
 * Start review session
 * POST /api/vocabulary/review/start
 * @Roles LEARNER
 * @body { limit?: number }
 */
export const startReviewSession = async (limit = 10): Promise<ReviewSession> => {
  const response = await apiClient.post('/vocabulary/review/start', { limit });
  return response.data.data;
};

/**
 * Submit review answer
 * POST /api/vocabulary/review/submit
 * @Roles LEARNER
 * @body { sessionId: string, vocabularyId: number, quality: number }
 */
export const submitReviewAnswer = async (
  sessionId: string,
  vocabularyId: number,
  quality: number
): Promise<ReviewResult> => {
  const response = await apiClient.post('/vocabulary/review/submit', {
    sessionId,
    vocabularyId,
    quality,
  });
  return response.data.data;
};

/**
 * Complete review session
 * POST /api/vocabulary/review/complete
 * @Roles LEARNER
 * @body { sessionId: string }
 */
export const completeReviewSession = async (sessionId: string): Promise<{
  totalReviewed: number;
  masteredWords: number;
  pointsEarned: number;
}> => {
  const response = await apiClient.post('/vocabulary/review/complete', { sessionId });
  return response.data.data;
};

/**
 * Get mastered vocabularies
 * GET /api/vocabulary/review/mastered
 * @Roles LEARNER
 */
export const getMasteredVocabularies = async (): Promise<Array<{
  id: number;
  word: string;
  masteredAt: string;
}>> => {
  const response = await apiClient.get('/vocabulary/review/mastered');
  return response.data.data;
};
