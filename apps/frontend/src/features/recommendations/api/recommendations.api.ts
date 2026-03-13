import { apiClient } from '@/shared/services/api.client';
import axios from 'axios';

// ==================== RECOMMENDATIONS API ====================
// AI-powered learning path recommendations

type RecommendationCategory = 'TOPIC' | 'REVIEW' | 'PRONUNCIATION' | 'QUIZ';

interface RecommendationScoreBreakdown {
  weaknessScore: number;
  vocabularyGapScore: number;
  readinessScore: number;
  engagementScore: number;
  overallScore: number;
}

interface LearningPathItemDto {
  contentId: number;
  contentName: string;
  sequenceOrder: number;
  estimatedMinutes: number;
  difficultyLevel?: string;
  rationale?: string;
}

interface RecommendationDto {
  recommendationId: number;
  childId: number;
  type: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'VIEWED' | 'APPLIED' | 'COMPLETED' | 'DISMISSED';
  title: string;
  description: string;
  scoreBreakdown: RecommendationScoreBreakdown;
  learningPath: LearningPathItemDto[];
  totalEstimatedMinutes: number;
  expectedOutcome?: string;
  generatedAt: string;
  viewedAt?: string;
  appliedAt?: string;
}

interface RecommendationsListDto {
  childId: number;
  recommendations: RecommendationDto[];
  hasRecommendations: boolean;
  noRecommendationMessage?: string;
  generatedAt: string;
}

interface AppliedLearningPathDto {
  pathId: number;
  childId: number;
  recommendationId: number;
  learningPath: LearningPathItemDto[];
  totalEstimatedMinutes: number;
  itemsCompleted: number;
  totalItems: number;
  progressPercentage: number;
  appliedAt: string;
  completedAt?: string;
  parentNotes?: string;
}

interface ApplyRecommendationResultDto {
  success: boolean;
  message: string;
  appliedPath: AppliedLearningPathDto;
}

interface RecommendationStatisticsDto {
  childId: number;
  totalRecommendations: number;
  appliedCount: number;
  appliedPercentage: number;
  completedCount: number;
  averageRating: number;
  helpfulCount: number;
  activePathsCount: number;
  mostCommonType?: string;
  averageCompletionDays: number;
}

export interface Recommendation {
  id: number;
  childId: number;
  type: RecommendationCategory;
  rawType?: string;
  title: string;
  description: string;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
  estimatedTime: number; // minutes
  estimatedMinutes?: number;
  difficulty?: string;
  masteryPercentage?: number;
  targetTopics: Array<{ id: number; name: string }>;
  createdAt: string;
  status: 'PENDING' | 'VIEWED' | 'APPLIED' | 'COMPLETED' | 'DISMISSED';
}

export interface RecommendationsList {
  childId: number;
  childNickname: string;
  recommendations: Recommendation[];
  lastGenerated: string;
  hasRecommendations?: boolean;
  noRecommendationMessage?: string;
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
  estimatedMinutes?: number;
  parentNotes?: string;
}

export interface RecommendationStats {
  childId: number;
  totalRecommendations: number;
  applied: number;
  completed: number;
  dismissed: number;
  adoptionRate: number; // percentage
  completionRate: number; // percentage
  activePathsCount?: number;
  averageRating?: number;
}

const mapRecommendationType = (type: string): RecommendationCategory => {
  switch (type) {
    case 'TOPIC_REVIEW':
    case 'TOPIC_ADVANCE':
    case 'VOCABULARY_EXTENSION':
      return 'TOPIC';
    case 'PRONUNCIATION_REFINEMENT':
      return 'PRONUNCIATION';
    case 'QUIZ_PREPARATION':
    case 'SPEED_CHALLENGE':
      return 'QUIZ';
    case 'WEAKNESS_PRACTICE':
    case 'CONSISTENCY_BOOST':
    default:
      return 'REVIEW';
  }
};

const mapRecommendation = (recommendation: RecommendationDto): Recommendation => ({
  id: recommendation.recommendationId,
  childId: recommendation.childId,
  type: mapRecommendationType(recommendation.type),
  rawType: recommendation.type,
  title: recommendation.title,
  description: recommendation.description,
  reason:
    recommendation.learningPath.find((item) => item.rationale)?.rationale ||
    recommendation.expectedOutcome ||
    '',
  priority: recommendation.priority,
  estimatedTime: recommendation.totalEstimatedMinutes,
  estimatedMinutes: recommendation.totalEstimatedMinutes,
  difficulty: recommendation.learningPath.find((item) => item.difficultyLevel)?.difficultyLevel,
  masteryPercentage: Math.round(recommendation.scoreBreakdown?.overallScore ?? 0),
  targetTopics: recommendation.learningPath.map((item) => ({
    id: item.contentId,
    name: item.contentName,
  })),
  createdAt: recommendation.generatedAt,
  status: recommendation.status,
});

const mapAppliedPath = (path: AppliedLearningPathDto): AppliedLearningPath => ({
  id: path.pathId,
  recommendationId: path.recommendationId,
  childId: path.childId,
  title: path.learningPath[0]?.contentName || 'Learning Path',
  topics: path.learningPath.map((item, index) => ({
    id: item.contentId,
    name: item.contentName,
    completed: index < path.itemsCompleted,
  })),
  progress: path.progressPercentage,
  startedAt: path.appliedAt,
  completedAt: path.completedAt,
  status: path.completedAt || path.itemsCompleted >= path.totalItems ? 'COMPLETED' : 'ACTIVE',
  estimatedMinutes: path.totalEstimatedMinutes,
  parentNotes: path.parentNotes,
});

const mapRecommendationsList = (payload: RecommendationsListDto): RecommendationsList => ({
  childId: payload.childId,
  childNickname: '',
  recommendations: payload.recommendations.map(mapRecommendation),
  lastGenerated: payload.generatedAt,
  hasRecommendations: payload.hasRecommendations,
  noRecommendationMessage: payload.noRecommendationMessage,
});

const mapRecommendationStats = (stats: RecommendationStatisticsDto): RecommendationStats => {
  const dismissed = Math.max(
    0,
    stats.totalRecommendations - stats.appliedCount - stats.completedCount - stats.activePathsCount,
  );
  return {
    childId: stats.childId,
    totalRecommendations: stats.totalRecommendations,
    applied: stats.appliedCount,
    completed: stats.completedCount,
    dismissed,
    adoptionRate: stats.appliedPercentage,
    completionRate:
      stats.appliedCount > 0 ? Math.round((stats.completedCount / stats.appliedCount) * 100) : 0,
    activePathsCount: stats.activePathsCount,
    averageRating: stats.averageRating,
  };
};

/**
 * Get recommendations for child
 * GET /api/recommendations/child/:childId
 * @Roles PARENT
 */
export const getRecommendations = async (childId: number): Promise<RecommendationsList> => {
  try {
    const response = await apiClient.get(`/recommendations/child/${childId}`);
    return mapRecommendationsList(response.data.data as RecommendationsListDto);
  } catch (error) {
    if (axios.isAxiosError(error) && (error.response?.status ?? 0) >= 500) {
      return {
        childId,
        childNickname: '',
        recommendations: [],
        lastGenerated: new Date().toISOString(),
        hasRecommendations: false,
        noRecommendationMessage: 'Hệ thống gợi ý đang bận. Vui lòng thử lại sau.',
      };
    }
    throw error;
  }
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
  return mapAppliedPath((response.data.data as ApplyRecommendationResultDto).appliedPath);
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
    recommendationIds: [recommendationId],
    reason,
  });
  const result = response.data.data as { dismissedCount: number; remainingCount: number };
  return {
    message: `Dismissed ${result.dismissedCount} recommendation(s). ${result.remainingCount} remaining.`,
  };
};

/**
 * Regenerate recommendations (AI)
 * POST /api/recommendations/child/:childId/regenerate
 * @Roles PARENT
 */
export const regenerateRecommendations = async (childId: number): Promise<RecommendationsList> => {
  const response = await apiClient.post(`/recommendations/child/${childId}/regenerate`);
  return mapRecommendationsList(response.data.data as RecommendationsListDto);
};

/**
 * Get applied learning paths
 * GET /api/recommendations/child/:childId/applied-paths
 * @Roles PARENT
 */
export const getAppliedPaths = async (childId: number): Promise<AppliedLearningPath[]> => {
  const response = await apiClient.get(`/recommendations/child/${childId}/applied-paths`);
  return (response.data.data as AppliedLearningPathDto[]).map(mapAppliedPath);
};

/**
 * Get recommendation statistics
 * GET /api/recommendations/child/:childId/statistics
 * @Roles PARENT
 */
export const getRecommendationStats = async (childId: number): Promise<RecommendationStats> => {
  const response = await apiClient.get(`/recommendations/child/${childId}/statistics`);
  return mapRecommendationStats(response.data.data as RecommendationStatisticsDto);
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
  void topicId;
  void completed;
  throw new Error(
    `Update path progress is not supported by the current backend contract (path ${pathId}).`,
  );
};

/**
 * Pause learning path
 * POST /api/recommendations/paths/:pathId/pause
 * @Roles PARENT
 */
export const pauseLearningPath = async (pathId: number): Promise<{ message: string }> => {
  throw new Error(`Pause learning path is not supported by the current backend contract (path ${pathId}).`);
};

/**
 * Resume learning path
 * POST /api/recommendations/paths/:pathId/resume
 * @Roles PARENT
 */
export const resumeLearningPath = async (pathId: number): Promise<{ message: string }> => {
  throw new Error(`Resume learning path is not supported by the current backend contract (path ${pathId}).`);
};
