import { apiClient } from '@/shared/services/api.client';

// ==================== ADMIN ANALYTICS API ====================
// Platform-wide analytics for administrators

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTopics: number;
  totalVocabularies: number;
  totalQuizzes: number;
  averageSessionLength: number; // minutes
  userGrowth: number; // percentage vs last month
  engagementRate: number; // percentage
  totalSessions: number;
  newUsersToday: number;
  topContentName?: string;
  totalContentViews?: number;
  // DB-backed pronunciation & learning stats
  avgPronunciationScore: number;        // 0-100
  totalPronunciationAttempts: number;
  avgLearningScore: number;             // 0-100
  totalQuizQuestions: number;
}

export interface DAUMetrics {
  date: string;
  dau: number; // daily active users
  new: number; // new signups
  returning: number;
  chartData: Array<{
    date: string;
    dau: number;
    new: number;
    returning: number;
  }>;
}

export interface SessionLengthData {
  average: number; // minutes
  median: number;
  trend: Array<{
    date: string;
    avgLength: number;
  }>;
}

export interface ContentPopularity {
  topics: Array<{
    id: string;
    name: string;
    views: number;
    completions: number;
    averageScore: number;
    rating: number;
  }>;
  vocabularies: Array<{
    id: string;
    word: string;
    topicName?: string;
    learningCount: number;
    masteryRate: number;
  }>;
  quizzes: Array<{
    id: string;
    question: string;
    topicName?: string;
    attempts: number;
    averageScore: number;
    difficulty?: string;
  }>;
}

type Period = '7d' | '30d' | '90d';

export interface AdminDbStats {
  totalTopics: number;
  totalVocabularies: number;
  totalQuizQuestions: number;
  totalTopicQuizzes: number;
  avgPronunciationScore: number;        // 0-100
  totalPronunciationAttempts: number;
  avgLearningScore: number;             // 0-100
  totalLearningRecords: number;
}

interface DashboardSummaryDto {
  currentDAU: number;
  dauChangePercent: number;
  totalUsers: number;
  newUsersToday: number;
  averageSessionLength: number;
  averageSessionLengthFormatted: string;
  totalSessions: number;
  topContent?: {
    contentName: string;
  };
  totalContentViews: number;
}

interface DAUResponseDto {
  dailyData: Array<{
    date: string;
    activeUsers: number;
    newUsers: number;
  }>;
}

interface SessionLengthResponseDto {
  dailyData: Array<{
    date: string;
    averageSeconds: number;
    medianSeconds: number;
    sessionCount: number;
  }>;
  overallAverageSeconds: number;
  totalSessions: number;
}

interface ContentPopularityResponseDto {
  topContent: Array<{
    contentId: string;
    contentName: string;
    contentType: 'TOPIC' | 'VOCABULARY' | 'QUIZ';
    viewCount: number;
    uniqueUsers: number;
    averageTimeSpent: number;
    completionRate: number | null;
    rank: number;
  }>;
  totalContentCount: number;
}

const mapPeriodToTimeRange = (period: Period): string => {
  switch (period) {
    case '7d':
      return 'LAST_7_DAYS';
    case '30d':
      return 'LAST_30_DAYS';
    case '90d':
      return 'LAST_90_DAYS';
    default:
      return 'LAST_7_DAYS';
  }
};

const secondsToMinutes = (seconds: number): number => Math.round((seconds / 60) * 10) / 10;

/**
 * Get admin dashboard overview
 * GET /api/admin/analytics/dashboard
 * @Roles ADMIN
 */
export const getAdminDashboard = async (): Promise<AdminDashboardStats> => {
  const [dashboardResponse, dbStatsResponse] = await Promise.all([
    apiClient.get('/admin/analytics/dashboard'),
    apiClient.get('/admin/analytics/db-stats'),
  ]);

  const dashboard = dashboardResponse.data.data as DashboardSummaryDto;
  const dbStats = dbStatsResponse.data.data as AdminDbStats;

  return {
    totalUsers: dashboard.totalUsers,
    activeUsers: dashboard.currentDAU,
    totalTopics: dbStats.totalTopics,
    totalVocabularies: dbStats.totalVocabularies,
    totalQuizzes: dbStats.totalTopicQuizzes,
    averageSessionLength: secondsToMinutes(dashboard.averageSessionLength),
    userGrowth: dashboard.dauChangePercent,
    engagementRate:
      dashboard.totalUsers > 0
        ? Math.round((dashboard.currentDAU / dashboard.totalUsers) * 100)
        : 0,
    totalSessions: dashboard.totalSessions,
    newUsersToday: dashboard.newUsersToday,
    topContentName: dashboard.topContent?.contentName,
    totalContentViews: dashboard.totalContentViews,
    // Extra DB stats surfaced
    avgPronunciationScore: dbStats.avgPronunciationScore,
    totalPronunciationAttempts: dbStats.totalPronunciationAttempts,
    avgLearningScore: dbStats.avgLearningScore,
    totalQuizQuestions: dbStats.totalQuizQuestions,
  };
};

/**
 * Get DAU metrics
 * GET /api/admin/analytics/dau?period=30d
 * @Roles ADMIN
 * @param period: '7d' | '30d' | '90d'
 */
export const getDAUMetrics = async (period: '7d' | '30d' | '90d' = '30d'): Promise<DAUMetrics> => {
  const response = await apiClient.get(`/admin/analytics/dau?timeRange=${mapPeriodToTimeRange(period)}`);
  const payload = response.data.data as DAUResponseDto;
  const chartData = payload.dailyData.map((point) => ({
    date: point.date,
    dau: point.activeUsers,
    new: point.newUsers,
    returning: Math.max(point.activeUsers - point.newUsers, 0),
  }));
  const latest = chartData[chartData.length - 1] ?? { date: '', dau: 0, new: 0, returning: 0 };
  return {
    date: latest.date,
    dau: latest.dau,
    new: latest.new,
    returning: latest.returning,
    chartData,
  };
};

/**
 * Get session length analytics
 * GET /api/admin/analytics/session-length?period=30d
 * @Roles ADMIN
 * @param period: '7d' | '30d' | '90d'
 */
export const getSessionLengthAnalytics = async (
  period: '7d' | '30d' | '90d' = '30d'
): Promise<SessionLengthData> => {
  const response = await apiClient.get(
    `/admin/analytics/session-length?timeRange=${mapPeriodToTimeRange(period)}`
  );
  const payload = response.data.data as SessionLengthResponseDto;
  const latest = payload.dailyData[payload.dailyData.length - 1];
  return {
    average: secondsToMinutes(payload.overallAverageSeconds),
    median: secondsToMinutes(latest?.medianSeconds ?? payload.overallAverageSeconds),
    trend: payload.dailyData.map((item) => ({
      date: item.date,
      avgLength: secondsToMinutes(item.averageSeconds),
    })),
  };
};

/**
 * Get content popularity analytics
 * GET /api/admin/analytics/content-popularity?period=30d&limit=20
 * @Roles ADMIN
 */
export const getContentPopularity = async (params?: {
  period?: '7d' | '30d' | '90d';
  limit?: number;
  contentType?: 'TOPIC' | 'VOCABULARY' | 'QUIZ';
}): Promise<ContentPopularity> => {
  const queryParams = new URLSearchParams();
  if (params?.period) queryParams.set('timeRange', mapPeriodToTimeRange(params.period));
  if (params?.limit !== undefined) queryParams.set('limit', String(params.limit));
  if (params?.contentType) queryParams.set('contentType', params.contentType);
  const query = queryParams.toString();
  const response = await apiClient.get(`/admin/analytics/content-popularity?${query}`);
  const payload = response.data.data as ContentPopularityResponseDto;

  const mapItem = (item: ContentPopularityResponseDto['topContent'][number]) => ({
    id: item.contentId,
    name: item.contentName,
    views: item.viewCount,
    completions: item.uniqueUsers,
    averageScore: Math.round(item.completionRate ?? 0),
    rating: Math.round(item.averageTimeSpent),
  });

  return {
    topics: payload.topContent.filter((item) => item.contentType === 'TOPIC').map(mapItem),
    vocabularies: payload.topContent
      .filter((item) => item.contentType === 'VOCABULARY')
      .map((item) => ({
        id: item.contentId,
        word: item.contentName,
        learningCount: item.uniqueUsers,
        masteryRate: Math.round(item.completionRate ?? 0),
      })),
    quizzes: payload.topContent
      .filter((item) => item.contentType === 'QUIZ')
      .map((item) => ({
        id: item.contentId,
        question: item.contentName,
        attempts: item.viewCount,
        averageScore: Math.round(item.completionRate ?? 0),
      })),
  };
};
