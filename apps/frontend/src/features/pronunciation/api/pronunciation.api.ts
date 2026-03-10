import { apiClient } from '@/shared/services/api.client';

// ==================== PRONUNCIATION API ====================
// Voice recognition and pronunciation practice

export interface PronunciationAttempt {
  attemptId: number;
  vocabularyId: number;
  word: string;
  confidenceScore: number; // 0-100
  rating: {
    stars: number;
    starEmoji: string;
    feedbackMessage: string;
    rewardMessage?: string;
  };
  nativePronunciationAudio: string;
  detailedFeedback?: string;
  totalPoints: number;
  currentLevel: number;
  badgeUnlocked?: string;
  attemptedAt: string;
}

export interface PronunciationProgress {
  vocabularyId: number;
  word: string;
  bestScore: number;
  bestRating: number;
  attemptCount: number;
  perfectStreak: number;
  lastAttemptedAt: string;
}

export interface PronunciationStats {
  totalAttempts: number;
  averageScore: number;
  masteredWords: number; // score >= 80
  improvingWords: number; // score 60-79
  needsPractice: number; // score < 60
}

/**
 * Submit pronunciation attempt
 * POST /api/pronunciation/:vocabularyId
 * @Roles LEARNER
 * @body { audioBase64: string }
 */
export const submitPronunciation = async (
  vocabularyId: number,
  confidenceScore: number,
  recognizedText?: string,
  recordingDurationMs?: number
): Promise<PronunciationAttempt> => {
  const response = await apiClient.post(`/pronunciation`, {
    vocabularyId,
    confidenceScore,
    recognizedText,
    recordingDurationMs,
  });
  return response.data.data;
};

/**
 * Get pronunciation progress for vocabulary
 * GET /api/pronunciation/progress/:vocabularyId
 * @Roles LEARNER
 */
export const getPronunciationProgress = async (
  vocabularyId: number
): Promise<PronunciationProgress> => {
  const response = await apiClient.get(`/pronunciation/progress/${vocabularyId}`);
  return response.data.data;
};

/**
 * Get pronunciation history for child
 * GET /api/pronunciation/history?limit=50
 * @Roles LEARNER
 */
export const getPronunciationHistory = async (limit = 50): Promise<PronunciationAttempt[]> => {
  const response = await apiClient.get(`/pronunciation/history?limit=${limit}`);
  return response.data.data;
};

/**
 * Get pronunciation statistics
 * GET /api/pronunciation/stats
 * @Roles LEARNER
 */
export const getPronunciationStats = async (): Promise<PronunciationStats> => {
  const response = await apiClient.get('/pronunciation/stats');
  return response.data.data;
};
