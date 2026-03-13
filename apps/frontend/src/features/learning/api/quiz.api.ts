import { apiClient as axiosInstance } from '@/shared/services/api.client';

export interface QuizQuestion {
  questionId: number;
  vocabularyId: number;
  question: string;
  options: QuizOption[];
  questionImage?: string;
}

export interface QuizOption {
  id: number;
  text: string;
  isCorrect?: boolean;
}

export interface QuizSession {
  quizSessionId: string;
  topicId: number;
  questions?: QuizQuestion[];
  firstQuestion?: QuizQuestion;
  totalQuestions: number;
  startedAt: string;
}

export interface AnswerSubmission {
  quizSessionId: string;
  questionId: number;
  selectedOptionId: number;
  timeTakenMs: number;
}

export interface AnswerResult {
  isCorrect: boolean;
  correctAnswerId: number;
  pointsEarned: number;
  currentScore: number;
}

export interface QuizResults {
  quizSessionId: string;
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
  startQuiz: async (topicId: number): Promise<QuizSession> => {
    const response = await axiosInstance.post<ApiEnvelope<unknown>>('quiz/start', {
      topicId,
    });
    const payload = response.data.data as {
      quizSessionId: string;
      topicId: number;
      totalQuestions: number;
      startedAt: string;
      firstQuestion?: {
        questionId: number;
        questionText?: string;
        question?: string;
        questionImage?: string;
        options?: QuizOption[];
      };
    };

    const firstQuestion = payload.firstQuestion
      ? {
          questionId: payload.firstQuestion.questionId,
          vocabularyId: 0,
          question:
            payload.firstQuestion.questionText ||
            payload.firstQuestion.question ||
            'What is this in English?',
          questionImage: payload.firstQuestion.questionImage,
          options: Array.isArray(payload.firstQuestion.options) ? payload.firstQuestion.options : [],
        }
      : undefined;

    return {
      quizSessionId: payload.quizSessionId,
      topicId: payload.topicId,
      totalQuestions: payload.totalQuestions,
      startedAt: payload.startedAt,
      firstQuestion,
      questions: firstQuestion ? [firstQuestion] : [],
    };
  },

  // Submit an answer
  submitAnswer: async (submission: AnswerSubmission): Promise<AnswerResult> => {
    const response = await axiosInstance.post<ApiEnvelope<AnswerResult>>('quiz/answer', submission);
    return response.data.data;
  },

  // Get quiz results
  getResults: async (quizSessionId: string): Promise<QuizResults> => {
    const response = await axiosInstance.get<ApiEnvelope<QuizResults>>(`quiz/results/${quizSessionId}`);
    return response.data.data;
  },
};
