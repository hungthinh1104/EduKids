import { apiClient as axiosInstance } from '@/shared/services/api.client';

export interface FlashcardData {
  vocabularyId: number;
  word: string;
  translation: string;
  phonetic: string;
  exampleSentence: string;
  imageUrl?: string;
  audioUrl?: string;
}

export interface DragDropResult {
  vocabularyId: number;
  isCorrect: boolean;
  correctAnswer: string;
}

export interface ApiEnvelope<T> {
  data: T;
  message?: string;
}

export const flashcardApi = {
  // Get flashcard data for a vocabulary
  getFlashcard: async (vocabularyId: number): Promise<FlashcardData> => {
    const response = await axiosInstance.get<ApiEnvelope<FlashcardData>>(`flashcard/${vocabularyId}`);
    return response.data.data;
  },

  // Submit drag-drop completion
  submitDragDrop: async (vocabularyId: number, userAnswer: string): Promise<DragDropResult> => {
    const response = await axiosInstance.post<ApiEnvelope<DragDropResult>>(
      `flashcard/${vocabularyId}/drag-drop`,
      { userAnswer }
    );
    return response.data.data;
  },
};
