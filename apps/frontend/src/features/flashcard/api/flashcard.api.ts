import { apiClient } from '@/shared/services/api.client';

// ==================== FLASHCARD API ====================
// Interactive flashcard exercises

export interface FlashcardSession {
  vocabularyId: number;
  word: string;
  imageUrl: string;
  audioUrl: string;
  mode: 'DRAG_DROP' | 'MULTIPLE_CHOICE';
}

export interface DragDropResult {
  isCorrect: boolean;
  pointsEarned: number;
  feedback: string;
  completedAt: string;
}

/**
 * Get flashcard session for vocabulary
 * GET /api/flashcard/:vocabularyId
 * @Roles LEARNER
 */
export const getFlashcardSession = async (vocabularyId: number): Promise<FlashcardSession> => {
  const response = await apiClient.get(`/flashcard/${vocabularyId}`);
  return response.data.data;
};

/**
 * Submit drag-drop answer
 * POST /api/flashcard/:vocabularyId/drag-drop
 * @Roles LEARNER
 * @body { answer: string }
 */
export const submitDragDropAnswer = async (
  vocabularyId: number,
  answer: string
): Promise<DragDropResult> => {
  const response = await apiClient.post(`/flashcard/${vocabularyId}/drag-drop`, {
    answer,
  });
  return response.data.data;
};
