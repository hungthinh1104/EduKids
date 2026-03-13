import { apiClient } from '@/shared/services/api.client';

// ==================== VOCABULARY REVIEW API ====================
// Spaced repetition system

export interface ReviewProgress {
  childId?: number;
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
  quality: number;
  nextReviewAt: string;
  repetitionNumber: number;
  easinessFactor: number;
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

interface ReviewSessionDto {
  sessionId: number;
  childId: number;
  items: Array<{
    vocabularyId: number;
    word: string;
    definition: string;
    pronunciation?: string;
  }>;
  itemCount: number;
}

interface ReviewResultDto {
  vocabularyId: number;
  nextReview: number;
  newInterval: number;
  newEase: number;
}

/**
 * Get review progress
 * GET /api/vocabulary/review/progress?childId=X
 * @Roles PARENT or LEARNER
 */
export const getReviewProgress = async (childId?: number): Promise<ReviewProgress> => {
  void childId;
  const response = await apiClient.get('/vocabulary/review/progress');
  const payload = response.data.data as ReviewProgressDto;
  return {
    totalReviews: payload.reviewedToday + payload.totalDueForReview,
    masteredCount: 0,
    learningCount: payload.totalDueForReview,
    dueToday: payload.totalDueForReview,
    streakDays: 0,
    nextReviewAt: payload.upcomingReviews[0]
      ? new Date(Date.now() + payload.upcomingReviews[0].daysFromNow * 24 * 60 * 60 * 1000).toISOString()
      : '',
  };
};

/**
 * Start review session
 * POST /api/vocabulary/review/start
 * @Roles LEARNER
 * @body { limit?: number }
 */
export const startReviewSession = async (limit = 10): Promise<ReviewSession> => {
  const response = await apiClient.get(`/vocabulary/review/session?limit=${limit}`);
  const payload = response.data.data as ReviewSessionDto;
  return {
    sessionId: String(payload.sessionId),
    vocabularies: payload.items.map((item) => ({
      id: item.vocabularyId,
      word: item.word,
      translation: item.definition,
      imageUrl: '',
      audioUrl: '',
    })),
    totalWords: payload.itemCount,
  };
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
  void sessionId;
  const difficulty = quality >= 4 ? 'EASY' : quality >= 2 ? 'MEDIUM' : 'HARD';
  const response = await apiClient.post('/vocabulary/review/submit', {
    vocabularyId,
    difficulty,
    correct: quality >= 2,
  });
  const payload = response.data.data as ReviewResultDto;
  return {
    vocabularyId: payload.vocabularyId,
    quality,
    nextReviewAt: new Date(payload.nextReview * 1000).toISOString(),
    repetitionNumber: payload.newInterval,
    easinessFactor: payload.newEase,
  };
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
  void sessionId;
  const progress = await getReviewProgress();
  return {
    totalReviewed: progress.totalReviews,
    masteredWords: progress.masteredCount,
    pointsEarned: 0,
  };
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
