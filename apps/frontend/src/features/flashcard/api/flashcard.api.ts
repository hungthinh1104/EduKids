import { apiClient } from '@/shared/services/api.client';

// ==================== FLASHCARD API ====================
// Interactive flashcard exercises

export interface FlashcardSession {
  id?: number;
  vocabularyId: number;
  word: string;
  imageUrl: string;
  audioUrl: string;
  phonetic?: string;
  translation?: string;
  options?: Array<{ id: number; text: string }>;
  mode: 'DRAG_DROP' | 'MULTIPLE_CHOICE';
}

export interface DragDropResult {
  isCorrect: boolean;
  pointsEarned: number;
  feedback: string;
  completedAt: string;
  totalPoints?: number;
  currentLevel?: number;
  correctAnswer?: string;
}

/**
 * Get flashcard session for vocabulary
 * GET /api/flashcard/:vocabularyId
 * @Roles LEARNER
 */
export const getFlashcardSession = async (vocabularyId: number): Promise<FlashcardSession> => {
  const response = await apiClient.get(`/flashcard/${vocabularyId}`);
  const payload = response.data.data as {
    id: number;
    vocabularyId: number;
    word: string;
    phonetic?: string;
    translation?: string;
    imageUrl: string;
    audioUrl: string;
    options?: Array<{ id: number; text: string }>;
  };
  return {
    id: payload.id,
    vocabularyId: payload.vocabularyId,
    word: payload.word,
    phonetic: payload.phonetic,
    translation: payload.translation,
    imageUrl: payload.imageUrl,
    audioUrl: payload.audioUrl,
    options: payload.options,
    mode: 'DRAG_DROP',
  };
};

/**
 * Submit drag-drop answer
 * POST /api/flashcard/:vocabularyId/drag-drop
 * @Roles LEARNER
 * @body { answer: string }
 */
export const submitDragDropAnswer = async (
  vocabularyId: number,
  selectedOptionId: number,
  timeTakenMs?: number
): Promise<DragDropResult> => {
  const response = await apiClient.post(`/flashcard/${vocabularyId}/drag-drop`, {
    vocabularyId,
    selectedOptionId,
    timeTakenMs,
    activityType: 'DRAG_DROP',
  });
  const payload = response.data.data as {
    feedback: {
      isCorrect: boolean;
      message: string;
      pointsEarned?: number;
      correctAnswer?: string;
    };
    totalPoints: number;
    currentLevel: number;
  };
  return {
    isCorrect: payload.feedback.isCorrect,
    pointsEarned: payload.feedback.pointsEarned ?? 0,
    feedback: payload.feedback.message,
    completedAt: new Date().toISOString(),
    totalPoints: payload.totalPoints,
    currentLevel: payload.currentLevel,
    correctAnswer: payload.feedback.correctAnswer,
  };
};
