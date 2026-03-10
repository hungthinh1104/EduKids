import { apiClient } from '@/shared/services/api.client';

// ==================== ADMIN ANALYTICS API ====================
// Platform-wide analytics for administrators

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number; // last 7 days
  totalChildren: number;
  activeChildren: number; // last 7 days
  totalTopics: number;
  totalVocabularies: number;
  totalQuizzes: number;
  averageSessionLength: number; // minutes
  todayRevenue: number;
  monthlyRevenue: number;
  userGrowth: number; // percentage vs last month
  engagementRate: number; // percentage
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
  byUserType: {
    free: number;
    premium: number;
  };
  distribution: Array<{
    range: string; // "0-5", "5-10", "10-15", etc
    count: number;
  }>;
  trend: Array<{
    date: string;
    avgLength: number;
  }>;
}

export interface ContentPopularity {
  topics: Array<{
    id: number;
    name: string;
    views: number;
    completions: number;
    averageScore: number;
    rating: number;
  }>;
  vocabularies: Array<{
    id: number;
    word: string;
    topicName: string;
    learningCount: number;
    masteryRate: number;
  }>;
  quizzes: Array<{
    id: number;
    question: string;
    topicName: string;
    attempts: number;
    averageScore: number;
    difficulty: string;
  }>;
}

/**
 * Get admin dashboard overview
 * GET /api/admin/analytics/dashboard
 * @Roles ADMIN
 */
export const getAdminDashboard = async (): Promise<AdminDashboardStats> => {
  const response = await apiClient.get('/admin/analytics/dashboard');
  return response.data.data;
};

/**
 * Get DAU metrics
 * GET /api/admin/analytics/dau?period=30d
 * @Roles ADMIN
 * @param period: '7d' | '30d' | '90d'
 */
export const getDAUMetrics = async (period: '7d' | '30d' | '90d' = '30d'): Promise<DAUMetrics> => {
  const response = await apiClient.get(`/admin/analytics/dau?period=${period}`);
  return response.data.data;
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
  const response = await apiClient.get(`/admin/analytics/session-length?period=${period}`);
  return response.data.data;
};

/**
 * Get content popularity analytics
 * GET /api/admin/analytics/content-popularity?period=30d&limit=20
 * @Roles ADMIN
 */
export const getContentPopularity = async (params?: {
  period?: '7d' | '30d' | '90d';
  limit?: number;
}): Promise<ContentPopularity> => {
  const queryParams = new URLSearchParams();
  if (params?.period) queryParams.set('period', params.period);
  if (params?.limit !== undefined) queryParams.set('limit', String(params.limit));
  const query = queryParams.toString();
  const response = await apiClient.get(`/admin/analytics/content-popularity?${query}`);
  return response.data.data;
};
