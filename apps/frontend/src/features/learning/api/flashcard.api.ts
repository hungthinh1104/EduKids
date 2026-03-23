import { apiClient as axiosInstance } from '@/shared/services/api.client';

interface FlashcardResponseDto {
  id: number;
  vocabularyId: number;
  word: string;
  phonetic?: string;
  exampleSentence?: string;
  translation?: string;
  imageUrl: string;
  audioUrl: string;
  media?: Array<{
    id: number;
    type: 'IMAGE' | 'AUDIO' | 'VIDEO';
    url: string;
  }>;
  options?: Array<{
    id: number;
    text: string;
  }>;
}

interface DragDropResponseDto {
  activityId: number;
  feedback: {
    isCorrect: boolean;
    message: string;
    correctAnswer?: string;
  };
}

export interface FlashcardData {
  vocabularyId: number;
  word: string;
  translation: string;
  phonetic: string;
  exampleSentence: string;
  imageUrl?: string;
  audioUrl?: string;
  options: Array<{
    id: number;
    text: string;
  }>;
}

export interface DragDropResult {
  vocabularyId: number;
  isCorrect: boolean;
  correctAnswer: string;
  feedback: string;
}

export interface ApiEnvelope<T> {
  data: T;
  message?: string;
}

export const flashcardApi = {
  // Get flashcard data for a vocabulary
  getFlashcard: async (vocabularyId: number): Promise<FlashcardData> => {
    const response = await axiosInstance.get<ApiEnvelope<FlashcardResponseDto>>(`flashcard/${vocabularyId}`);
    const payload = response.data.data;
    return {
      vocabularyId: payload.vocabularyId,
      word: payload.word,
      translation: payload.translation || '',
      phonetic: payload.phonetic || '',
      exampleSentence: payload.exampleSentence || '',
      imageUrl: payload.imageUrl || payload.media?.find((item) => item.type === 'IMAGE')?.url,
      audioUrl: payload.audioUrl || payload.media?.find((item) => item.type === 'AUDIO')?.url,
      options: Array.isArray(payload.options) ? payload.options : [],
    };
  },

  // Submit drag-drop completion
  submitDragDrop: async (
    vocabularyId: number,
    selectedOptionId: number,
    timeTakenMs?: number,
  ): Promise<DragDropResult> => {
    const response = await axiosInstance.post<ApiEnvelope<DragDropResponseDto>>(
      `flashcard/${vocabularyId}/drag-drop`,
      {
        vocabularyId,
        selectedOptionId,
        timeTakenMs,
        activityType: 'DRAG_DROP',
      }
    );
    const payload = response.data.data;
    return {
      vocabularyId,
      isCorrect: payload.feedback.isCorrect,
      correctAnswer: payload.feedback.correctAnswer || '',
      feedback: payload.feedback.message,
    };
  },
};
