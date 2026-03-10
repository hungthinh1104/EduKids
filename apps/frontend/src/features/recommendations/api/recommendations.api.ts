import { apiClient } from '@/shared/services/api.client';

// ==================== RECOMMENDATIONS API ====================
// AI-powered learning path recommendations

export interface Recommendation {
  id: number;
  childId: number;
  type: 'TOPIC' | 'REVIEW' | 'PRONUNCIATION' | 'QUIZ';
  title: string;
  description: string;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedTime: number; // minutes
  estimatedMinutes?: number;
  difficulty?: string;
  masteryPercentage?: number;
  targetTopics: Array<{ id: number; name: string }>;
  createdAt: string;
  status: 'PENDING' | 'APPLIED' | 'DISMISSED';
}

export interface RecommendationsList {
  childId: number;
  childNickname: string;
  recommendations: Recommendation[];
  lastGenerated: string;
}

export interface AppliedLearningPath {
  id: number;
  recommendationId: number;
  childId: number;
  title: string;
  topics: Array<{ id: number; name: string; completed: boolean }>;
  progress: number; // 0-100
  startedAt: string;
  completedAt?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
}

export interface RecommendationStats {
  childId: number;
  totalRecommendations: number;
  applied: number;
  completed: number;
  dismissed: number;
  adoptionRate: number; // percentage
  completionRate: number; // percentage
}

/**
 * Get recommendations for child
 * GET /api/recommendations/child/:childId
 * @Roles PARENT
 */
export const getRecommendations = async (childId: number): Promise<RecommendationsList> => {
  const response = await apiClient.get(`/recommendations/child/${childId}`);
  return response.data.data;
};

/**
 * Apply recommendation to create learning path
 * POST /api/recommendations/child/:childId/apply
 * @Roles PARENT
 * @body { recommendationId: number, parentNotes?: string }
 */
export const applyRecommendation = async (
  childId: number,
  recommendationId: number,
  parentNotes?: string
): Promise<AppliedLearningPath> => {
  const response = await apiClient.post(`/recommendations/child/${childId}/apply`, {
    recommendationId,
    parentNotes,
  });
  return response.data.data;
};

/**
 * Dismiss recommendation
 * POST /api/recommendations/child/:childId/dismiss
 * @Roles PARENT
 * @body { recommendationId: number, reason?: string }
 */
export const dismissRecommendation = async (
  childId: number,
  recommendationId: number,
  reason?: string
): Promise<{ message: string }> => {
  const response = await apiClient.post(`/recommendations/child/${childId}/dismiss`, {
    recommendationId,
    reason,
  });
  return response.data.data;
};

/**
 * Regenerate recommendations (AI)
 * POST /api/recommendations/child/:childId/regenerate
 * @Roles PARENT
 */
export const regenerateRecommendations = async (childId: number): Promise<RecommendationsList> => {
  const response = await apiClient.post(`/recommendations/child/${childId}/regenerate`);
  return response.data.data;
};

/**
 * Get applied learning paths
 * GET /api/recommendations/child/:childId/applied-paths
 * @Roles PARENT
 */
export const getAppliedPaths = async (childId: number): Promise<AppliedLearningPath[]> => {
  const response = await apiClient.get(`/recommendations/child/${childId}/applied-paths`);
  return response.data.data;
};

/**
 * Get recommendation statistics
 * GET /api/recommendations/child/:childId/statistics
 * @Roles PARENT
 */
export const getRecommendationStats = async (childId: number): Promise<RecommendationStats> => {
  const response = await apiClient.get(`/recommendations/child/${childId}/statistics`);
  return response.data.data;
};

/**
 * Update path progress
 * PUT /api/recommendations/paths/:pathId/progress
 * @Roles PARENT
 * @body { topicId: number, completed: boolean }
 */
export const updatePathProgress = async (
  pathId: number,
  topicId: number,
  completed: boolean
): Promise<AppliedLearningPath> => {
  const response = await apiClient.put(`/recommendations/paths/${pathId}/progress`, {
    topicId,
    completed,
  });
  return response.data.data;
};

/**
 * Pause learning path
 * POST /api/recommendations/paths/:pathId/pause
 * @Roles PARENT
 */
export const pauseLearningPath = async (pathId: number): Promise<{ message: string }> => {
  const response = await apiClient.post(`/recommendations/paths/${pathId}/pause`);
  return response.data.data;
};

/**
 * Resume learning path
 * POST /api/recommendations/paths/:pathId/resume
 * @Roles PARENT
 */
export const resumeLearningPath = async (pathId: number): Promise<{ message: string }> => {
  const response = await apiClient.post(`/recommendations/paths/${pathId}/resume`);
  return response.data.data;
};
