import { AxiosError } from 'axios';
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

export class PronunciationApiError extends Error {
  status?: number;
  code?: string;
  method?: string;
  url?: string;
  backendMessage?: string;

  constructor(message: string, options?: Partial<PronunciationApiError>) {
    super(message);
    this.name = 'PronunciationApiError';
    Object.assign(this, options);
  }
}

const isDev = process.env.NODE_ENV !== 'production';

function normalizePronunciationError(error: unknown): PronunciationApiError {
  if (error instanceof PronunciationApiError) {
    return error;
  }

  const axiosError = error as AxiosError<{
    message?: string;
    error?: string;
  }>;

  const status = axiosError.response?.status;
  const backendMessage =
    axiosError.response?.data?.message ||
    axiosError.message ||
    'Unknown pronunciation request failure';
  const method = axiosError.config?.method?.toUpperCase();
  const baseURL = axiosError.config?.baseURL || '';
  const path = axiosError.config?.url || '';
  const url = path ? `${baseURL}${path}` : baseURL || undefined;

  let friendlyMessage = 'Chưa thể chấm phát âm lúc này.';

  if (status === 400) {
    friendlyMessage = `Yeu cau phat am chua hop le: ${backendMessage}`;
  } else if (status === 413) {
    friendlyMessage = 'Ban ghi am qua lon de gui len server. Hay thu doan ngan hon.';
  } else if (status === 401) {
    friendlyMessage = 'Phien hoc cua be da het han. Vui long vao lai che do hoc cua be.';
  } else if (status === 403) {
    friendlyMessage = 'Can chuyen sang ho so cua be truoc khi luyen phat am.';
  } else if (status === 404) {
    friendlyMessage = 'Khong tim thay tu vung de cham phat am.';
  } else if (axiosError.code === 'ERR_NETWORK') {
    friendlyMessage = 'Khong ket noi duoc toi backend phat am.';
  } else if (backendMessage) {
    friendlyMessage = backendMessage;
  }

  return new PronunciationApiError(friendlyMessage, {
    status,
    code: axiosError.code,
    method,
    url,
    backendMessage,
  });
}

export function getPronunciationErrorMessage(error: unknown): string {
  return normalizePronunciationError(error).message;
}

function tracePronunciationSuccess(method: string, url: string, extra?: Record<string, unknown>) {
  if (!isDev || typeof window === 'undefined') return;
  console.info('[pronunciation]', { method, url, ok: true, ...extra });
}

function tracePronunciationError(error: PronunciationApiError, extra?: Record<string, unknown>) {
  if (!isDev || typeof window === 'undefined') return;
  console.error('[pronunciation]', {
    ok: false,
    status: error.status,
    code: error.code,
    method: error.method,
    url: error.url,
    backendMessage: error.backendMessage,
    userMessage: error.message,
    ...extra,
  });
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
  const url = `/pronunciation/${payload.vocabularyId}`;

  try {
    const response = await apiClient.post(url, {
      vocabularyId: payload.vocabularyId,
      mode: payload.mode,
      referenceText: payload.referenceText,
      confidenceScore: payload.confidenceScore,
      recognizedText: payload.recognizedText,
      recordingDurationMs: safeDuration,
      audioBase64: payload.audioBase64,
      audioMimeType: payload.audioMimeType,
    });
    tracePronunciationSuccess('POST', `${response.config.baseURL || ''}${url}`, {
      vocabularyId: payload.vocabularyId,
      hasAudio: Boolean(payload.audioBase64),
      recordingDurationMs: safeDuration,
    });
    return response.data.data;
  } catch (error) {
    const normalizedError = normalizePronunciationError(error);
    tracePronunciationError(normalizedError, {
      vocabularyId: payload.vocabularyId,
      hasAudio: Boolean(payload.audioBase64),
      recordingDurationMs: safeDuration,
    });
    throw normalizedError;
  }
};

/**
 * Get pronunciation progress for vocabulary
 * GET /api/pronunciation/progress/:vocabularyId
 * @Roles LEARNER
 */
export const getPronunciationProgress = async (
  vocabularyId: number
): Promise<PronunciationProgress> => {
  const url = `/pronunciation/progress/${vocabularyId}`;
  try {
    const response = await apiClient.get(url);
    tracePronunciationSuccess('GET', `${response.config.baseURL || ''}${url}`, { vocabularyId });
    return response.data.data;
  } catch (error) {
    const normalizedError = normalizePronunciationError(error);
    tracePronunciationError(normalizedError, { vocabularyId });
    throw normalizedError;
  }
};

/**
 * Get pronunciation history for child
 * GET /api/pronunciation/history?limit=50
 * @Roles LEARNER
 */
export const getPronunciationHistory = async (limit = 50): Promise<PronunciationAttempt[]> => {
  void limit;
  const url = '/pronunciation/history';
  try {
    const response = await apiClient.get(url);
    tracePronunciationSuccess('GET', `${response.config.baseURL || ''}${url}`);
    return response.data.data;
  } catch (error) {
    const normalizedError = normalizePronunciationError(error);
    tracePronunciationError(normalizedError);
    throw normalizedError;
  }
};

/**
 * Get pronunciation statistics
 * GET /api/pronunciation/stats
 * @Roles LEARNER
 */
export const getPronunciationStats = async (): Promise<PronunciationStats> => {
  const url = '/pronunciation/stats';
  try {
    const response = await apiClient.get(url);
    tracePronunciationSuccess('GET', `${response.config.baseURL || ''}${url}`);
    return response.data.data;
  } catch (error) {
    const normalizedError = normalizePronunciationError(error);
    tracePronunciationError(normalizedError);
    throw normalizedError;
  }
};
