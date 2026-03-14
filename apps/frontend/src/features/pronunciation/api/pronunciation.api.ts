import { apiClient } from '@/shared/services/api.client';

// ==================== PRONUNCIATION API ====================
// Voice recognition and pronunciation practice

export interface PronunciationAttempt {
  attemptId: number;
  vocabularyId: number;
  word: string;
  confidenceScore: number; // 0-100
  mode: PronunciationAssessmentMode;
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
  assessment?: PronunciationAssessment;
}

export type PronunciationProvider = 'AZURE_SPEECH' | 'GOOGLE_SPEECH' | 'CUSTOM';
export type PronunciationAssessmentMode = 'WORD' | 'PARAGRAPH';
export type PronunciationWordErrorType =
  | 'NONE'
  | 'MISPRONUNCIATION'
  | 'OMISSION'
  | 'INSERTION'
  | 'UNEXPECTED_BREAK'
  | 'MISSING_BREAK'
  | 'UNKNOWN';

export interface PronunciationPhonemeAssessment {
  phoneme: string;
  expectedPhoneme: string;
  score: number;
  startMs?: number;
  endMs?: number;
}

export interface PronunciationSyllableAssessment {
  syllable: string;
  score: number;
  startMs?: number;
  endMs?: number;
}

export interface PronunciationWordAssessment {
  word: string;
  targetIpa: string;
  spokenIpa: string;
  score: number;
  errorType?: PronunciationWordErrorType;
  startMs?: number;
  endMs?: number;
  isMatch?: boolean;
  syllables?: PronunciationSyllableAssessment[];
  phonemes?: PronunciationPhonemeAssessment[];
}

export interface PronunciationAssessment {
  mode: PronunciationAssessmentMode;
  provider: PronunciationProvider;
  overallScore: number;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore?: number;
  prosodyScore?: number;
  recognizedText?: string;
  recognizedIpa?: string;
  referenceText?: string;
  words?: PronunciationWordAssessment[];
  passed?: boolean;
}

export interface SubmitPronunciationPayload {
  vocabularyId: number;
  mode?: PronunciationAssessmentMode;
  referenceText?: string;
  recognizedText?: string;
  recordingDurationMs?: number;
  audioBase64: string;
  audioMimeType?: string;
  confidenceScore?: number;
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
  payload: SubmitPronunciationPayload,
): Promise<PronunciationAttempt> => {
  const safeDuration =
    payload.recordingDurationMs === undefined
      ? undefined
      : Math.min(120000, Math.max(100, payload.recordingDurationMs));

  const response = await apiClient.post(`/pronunciation/${payload.vocabularyId}`, {
    vocabularyId: payload.vocabularyId,
    mode: payload.mode,
    referenceText: payload.referenceText,
    confidenceScore: payload.confidenceScore,
    recognizedText: payload.recognizedText,
    recordingDurationMs: safeDuration,
    audioBase64: payload.audioBase64,
    audioMimeType: payload.audioMimeType,
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
  void limit;
  const response = await apiClient.get(`/pronunciation/history`);
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
