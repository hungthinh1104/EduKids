import { apiClient as axiosInstance } from '@/shared/services/api.client';

export interface QuizQuestion {
  questionId: number;
  questionText: string;
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
      questions?: Array<{
        questionId: number;
        questionText: string;
        questionImage?: string;
        options?: QuizOption[];
      }>;
      firstQuestion?: {
        questionId: number;
        questionText: string;
        questionImage?: string;
        options?: QuizOption[];
      };
    };

    const normalizeQuestion = (question?: {
      questionId: number;
      questionText: string;
      questionImage?: string;
      options?: QuizOption[];
    }): QuizQuestion | undefined =>
      question && typeof question.questionText === 'string' && question.questionText.trim().length > 0
        ? {
            questionId: question.questionId,
            questionText: question.questionText,
            questionImage: question.questionImage,
            options: Array.isArray(question.options) ? question.options : [],
          }
        : undefined;

    const questions = Array.isArray(payload.questions)
      ? payload.questions
          .map(normalizeQuestion)
          .filter((question): question is QuizQuestion => Boolean(question))
      : [];
    const firstQuestion = normalizeQuestion(payload.firstQuestion);

    return {
      quizSessionId: payload.quizSessionId,
      topicId: payload.topicId,
      totalQuestions: payload.totalQuestions,
      startedAt: payload.startedAt,
      firstQuestion,
      questions: questions.length > 0 ? questions : firstQuestion ? [firstQuestion] : [],
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
