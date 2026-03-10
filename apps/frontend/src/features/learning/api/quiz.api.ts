import { apiClient as axiosInstance } from '@/shared/services/api.client';

export interface QuizQuestion {
  questionId: number;
  vocabularyId: number;
  question: string;
  options: QuizOption[];
}

export interface QuizOption {
  id: number;
  text: string;
  isCorrect: boolean;
}

export interface QuizSession {
  quizSessionId: number;
  topicId: number;
  questions: QuizQuestion[];
  totalQuestions: number;
  startedAt: string;
}

export interface AnswerSubmission {
  quizSessionId: number;
  questionId: number;
  selectedOptionId: number;
  timeSpentMs: number;
}

export interface AnswerResult {
  isCorrect: boolean;
  correctOptionId: number;
  pointsEarned: number;
  currentScore: number;
}

export interface QuizResults {
  quizSessionId: number;
  topicId: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  totalTimeMs: number;
  pointsEarned: number;
  completedAt: string;
}

export interface ApiEnvelope<T> {
  data: T;
  message?: string;
}

export const quizApi = {
  // Start a new quiz session
  startQuiz: async (topicId: number, childId: number): Promise<QuizSession> => {
    const response = await axiosInstance.post<ApiEnvelope<QuizSession>>('quiz/start', {
      topicId,
      childId,
    });
    return response.data.data;
  },

  // Submit an answer
  submitAnswer: async (submission: AnswerSubmission): Promise<AnswerResult> => {
    const response = await axiosInstance.post<ApiEnvelope<AnswerResult>>('quiz/answer', submission);
    return response.data.data;
  },

  // Get quiz results
  getResults: async (quizSessionId: number): Promise<QuizResults> => {
    const response = await axiosInstance.get<ApiEnvelope<QuizResults>>(`quiz/results/${quizSessionId}`);
    return response.data.data;
  },
};
