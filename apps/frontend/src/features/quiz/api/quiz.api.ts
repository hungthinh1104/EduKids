import { apiClient } from '@/shared/services/api.client';

// ==================== QUIZ API ====================
// Quiz system for vocabulary testing

export interface Quiz {
  id: number;
  topicId: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface QuizAttempt {
  id: number;
  quizId: number;
  selectedAnswer: string;
  isCorrect: boolean;
  timeTaken: number; // seconds
  pointsEarned: number;
  createdAt: string;
}

export interface QuizSession {
  sessionId: string;
  topicId: number;
  quizzes: Quiz[];
  totalQuestions: number;
  startedAt: string;
}

export interface QuizResult {
  sessionId: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number; // percentage
  pointsEarned: number;
  completedAt: string;
}

/**
 * Start quiz session for topic
 * POST /api/quiz/start
 * @Roles LEARNER
 * @body { topicId: number, questionCount?: number }
 */
export const startQuizSession = async (
  topicId: number,
  questionCount = 10
): Promise<QuizSession> => {
  const response = await apiClient.post('/quiz/start', {
    topicId,
    questionCount,
  });
  return response.data.data;
};

/**
 * Submit quiz answer
 * POST /api/quiz/submit
 * @Roles LEARNER
 * @body { sessionId: string, quizId: number, answer: string }
 */
export const submitQuizAnswer = async (
  sessionId: string,
  quizId: number,
  answer: string
): Promise<QuizAttempt> => {
  const response = await apiClient.post('/quiz/submit', {
    sessionId,
    quizId,
    answer,
  });
  return response.data.data;
};

/**
 * Complete quiz session
 * POST /api/quiz/complete
 * @Roles LEARNER
 * @body { sessionId: string }
 */
export const completeQuizSession = async (sessionId: string): Promise<QuizResult> => {
  const response = await apiClient.post('/quiz/complete', {
    sessionId,
  });
  return response.data.data;
};

/**
 * Get quiz history for child
 * GET /api/quiz/history?limit=20
 * @Roles LEARNER
 */
export const getQuizHistory = async (limit = 20): Promise<QuizResult[]> => {
  const response = await apiClient.get(`/quiz/history?limit=${limit}`);
  return response.data.data;
};

/**
 * Get quiz statistics
 * GET /api/quiz/stats
 * @Roles LEARNER
 */
export const getQuizStats = async (): Promise<{
  totalQuizzes: number;
  averageScore: number;
  perfectScores: number;
  totalPointsEarned: number;
}> => {
  const response = await apiClient.get('/quiz/stats');
  return response.data.data;
};
