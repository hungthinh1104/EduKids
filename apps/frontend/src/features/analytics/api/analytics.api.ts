import { apiClient } from '@/shared/services/api.client';

type UiPeriod = '7d' | '30d' | '90d';

const toBackendPeriod = (period: UiPeriod): 'WEEK' | 'MONTH' | 'QUARTER' => {
  if (period === '30d') return 'MONTH';
  if (period === '90d') return 'QUARTER';
  return 'WEEK';
};

// ==================== PARENT ANALYTICS API ====================
// Detailed learning insights for parents

export type AnalyticsPeriod = 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR' | 'ALL';

export interface ChartDataPoint {
  date: string;
  value: number;
  label: string;
}

export interface LearningTimeAnalytics {
  totalMinutes: number;
  averageSessionMinutes: number;
  totalSessions: number;
  daysActive: number;
  currentStreak: number;
  chartData: ChartDataPoint[];
}

export interface VocabularyRetentionAnalytics {
  totalWordsEncountered: number;
  wordsMastered: number;
  retentionRate: number;
  wordsReviewed: number;
  chartData: ChartDataPoint[];
  wordsByLevel: {
    mastered: number;
    learning: number;
    new: number;
  };
}

export interface PronunciationAccuracyAnalytics {
  averageAccuracy: number;
  totalPractices: number;
  highAccuracyCount: number;
  challengingSoundsCount: number;
  chartData: ChartDataPoint[];
  mostImprovedWords: Array<{ word: string; improvement: number }>;
  wordsNeedingPractice: Array<{ word: string; accuracy: number }>;
}

export interface QuizPerformanceAnalytics {
  totalQuizzes: number;
  averageScore: number;
  highestScore: number;
  quizzesPassed: number;
  chartData: ChartDataPoint[];
  scoresByDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface GamificationProgressAnalytics {
  totalPoints: number;
  currentLevel: number;
  badgesEarned: number;
  totalBadges: number;
  itemsPurchased: number;
  chartData: ChartDataPoint[];
  recentBadges: Array<{ name: string; earnedAt: string }>;
}

export interface AnalyticsOverview {
  childId: number;
  childNickname: string;
  period: AnalyticsPeriod;
  learningTime: LearningTimeAnalytics;
  vocabulary: VocabularyRetentionAnalytics;
  pronunciation: PronunciationAccuracyAnalytics;
  quizPerformance: QuizPerformanceAnalytics;
  gamification: GamificationProgressAnalytics;
  generatedAt: string;
  insightMessage: string;
  hasData: boolean;
}

export interface NoDataResponse {
  hasData: false;
  message: string;
  childId: number;
  childNickname: string;
}

/**
 * Get analytics overview for child
 * GET /api/analytics/overview?childId=X&period=7d
 * @Roles PARENT
 */
export const getAnalyticsOverview = async (
  childId: number,
  period: '7d' | '30d' | '90d' = '7d'
): Promise<AnalyticsOverview | NoDataResponse> => {
  const response = await apiClient.get(
    `/analytics/overview?childId=${childId}&period=${toBackendPeriod(period)}`,
  );
  return response.data.data;
};

/**
 * Get detailed learning time analytics
 * GET /api/analytics/learning-time?childId=X&period=7d
 * @Roles PARENT
 */
export const getLearningTimeAnalytics = async (
  childId: number,
  period: '7d' | '30d' | '90d' = '7d'
): Promise<LearningTimeAnalytics | NoDataResponse> => {
  const response = await apiClient.get(
    `/analytics/learning-time?childId=${childId}&period=${toBackendPeriod(period)}`,
  );
  return response.data.data;
};

/**
 * Get vocabulary analytics
 * GET /api/analytics/vocabulary?childId=X
 * @Roles PARENT
 */
export const getVocabularyAnalytics = async (
  childId: number,
  period: '7d' | '30d' | '90d' = '7d',
): Promise<VocabularyRetentionAnalytics | NoDataResponse> => {
  const response = await apiClient.get(
    `/analytics/vocabulary?childId=${childId}&period=${toBackendPeriod(period)}`,
  );
  return response.data.data;
};

/**
 * Get pronunciation analytics
 * GET /api/analytics/pronunciation?childId=X
 * @Roles PARENT
 */
export const getPronunciationAnalytics = async (
  childId: number,
  period: '7d' | '30d' | '90d' = '7d',
): Promise<PronunciationAccuracyAnalytics | NoDataResponse> => {
  const response = await apiClient.get(
    `/analytics/pronunciation?childId=${childId}&period=${toBackendPeriod(period)}`,
  );
  return response.data.data;
};

/**
 * Get quiz analytics
 * GET /api/analytics/quiz?childId=X
 * @Roles PARENT
 */
export const getQuizAnalytics = async (
  childId: number,
  period: '7d' | '30d' | '90d' = '7d',
): Promise<QuizPerformanceAnalytics | NoDataResponse> => {
  const response = await apiClient.get(
    `/analytics/quiz?childId=${childId}&period=${toBackendPeriod(period)}`,
  );
  return response.data.data;
};

/**
 * Get gamification analytics
 * GET /api/analytics/gamification?childId=X
 * @Roles PARENT
 */
export const getGamificationAnalytics = async (
  childId: number,
  period: '7d' | '30d' | '90d' = '7d',
): Promise<GamificationProgressAnalytics | NoDataResponse> => {
  const response = await apiClient.get(
    `/analytics/gamification?childId=${childId}&period=${toBackendPeriod(period)}`,
  );
  return response.data.data;
};
