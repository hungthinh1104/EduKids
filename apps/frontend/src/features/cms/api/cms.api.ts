import { apiClient } from '@/shared/services/api.client';

// ==================== CMS API (ADMIN ONLY) ====================
// Content Management System for admins

export interface CMSTopic {
  id: number;
  name: string;
  description: string;
  learningLevel?: number; // 1-5
  imageUrl?: string;
  status?: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  tags?: string[];
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  vocabularyCount?: number; // computed from _count
  _count?: { vocabularies: number; quizzes?: number }; // Prisma count relation
}

export interface CMSVocabulary {
  id: number;
  topicId: number;
  word: string;
  definition: string; // backend uses "definition", Prisma stores as "translation"
  phonetic?: string;
  example?: string; // backend uses "example", Prisma stores as "exampleSentence"
  imageUrl?: string; // backend DTO field
  audioUrl?: string; // backend DTO field
  status?: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  partOfSpeech?: string;
  difficulty?: number;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  topic?: { id: number; name: string }; // Prisma relation
  media?: Array<{ // VocabularyMedia relation
    id: number;
    type: 'IMAGE' | 'AUDIO' | 'VIDEO';
    url: string;
  }>;
}

export interface CMSQuiz {
  id: number;
  topicId: number; // backend service uses topicId
  title: string;
  description: string;
  questionText: string;
  options: Array<
    | {
        text: string;
        isCorrect: boolean;
      }
    | string
  >;
  correctAnswer?: string;
  difficultyLevel?: number;
  status?: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: number;
  userId: number; // Prisma uses userId not adminId
  action: string; // e.g., 'CREATE_TOPIC', 'UPDATE_VOCABULARY'
  entity?: string; // e.g., 'topic', 'vocabulary'
  details?: string;
  changes?: Record<string, unknown>; // JSON field
  createdAt: string;
}

type Dict = Record<string, unknown>;

const isRecord = (value: unknown): value is Dict => typeof value === 'object' && value !== null;

const toQueryString = (params?: Record<string, string | number | undefined>): string => {
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value));
  });
  return query.toString();
};

// ==================== TOPIC MANAGEMENT ====================

/**
 * Create new topic
 * POST /api/cms/topics
 * @Roles ADMIN
 */
export const createTopic = async (data: {
  name: string;
  description: string;
  learningLevel: number; // 1-5
  imageUrl?: string;
  status?: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  tags?: string[];
}): Promise<CMSTopic> => {
  const response = await apiClient.post('/cms/topics', data);
  return response.data.data;
};

/**
 * Get all topics (admin view with drafts)
 * GET /api/cms/topics?status=all&page=1&limit=20
 * @Roles ADMIN
 */
export const getCMSTopics = async (params?: {
  status?: 'all' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  page?: number;
  limit?: number;
}): Promise<{ items: CMSTopic[]; total: number }> => {
  const query = toQueryString(params);
  const response = await apiClient.get(`/cms/topics?${query}`);
  return response.data.data;
};

/**
 * Get single topic
 * GET /api/cms/topics/:id
 * @Roles ADMIN
 */
export const getCMSTopic = async (id: number): Promise<CMSTopic> => {
  const response = await apiClient.get(`/cms/topics/${id}`);
  return response.data.data;
};

/**
 * Update topic
 * PUT /api/cms/topics/:id
 * @Roles ADMIN
 */
export const updateTopic = async (
  id: number,
  data: Partial<CMSTopic>
): Promise<CMSTopic> => {
  const response = await apiClient.put(`/cms/topics/${id}`, data);
  return response.data.data;
};

/**
 * Delete topic
 * DELETE /api/cms/topics/:id
 * @Roles ADMIN
 */
export const deleteTopic = async (id: number): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/cms/topics/${id}`);
  return response.data.data;
};

/**
 * Publish topic
 * POST /api/cms/topics/:id/publish
 * @Roles ADMIN
 */
export const publishTopic = async (id: number): Promise<CMSTopic> => {
  const response = await apiClient.post(`/cms/topics/${id}/publish`);
  return response.data.data;
};

/**
 * Archive topic
 * POST /api/cms/topics/:id/archive
 * @Roles ADMIN
 */
export const archiveTopic = async (id: number): Promise<CMSTopic> => {
  const response = await apiClient.post(`/cms/topics/${id}/archive`);
  return response.data.data;
};

// ==================== VOCABULARY MANAGEMENT ====================

/**
 * Create vocabulary
 * POST /api/cms/vocabularies
 * @Roles ADMIN
 */
export const createVocabulary = async (data: {
  topicId: number;
  word: string;
  definition: string; // backend uses "definition"
  example?: string;
  imageUrl?: string;
  audioUrl?: string;
  status?: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
}): Promise<CMSVocabulary> => {
  const response = await apiClient.post('/cms/vocabularies', data);
  return response.data.data;
};

/**
 * Get vocabulary by ID
 * GET /api/cms/vocabularies/:id
 * @Roles ADMIN
 */
export const getCMSVocabulary = async (id: number): Promise<CMSVocabulary> => {
  const response = await apiClient.get(`/cms/vocabularies/${id}`);
  return response.data.data;
};

/**
 * Get vocabularies by topic
 * GET /api/cms/topics/:topicId/vocabularies?status=all
 * @Roles ADMIN
 */
export const getTopicVocabularies = async (
  topicId: number,
  status?: 'all' | 'DRAFT' | 'PUBLISHED'
): Promise<CMSVocabulary[]> => {
  const query = status ? `?status=${status}` : '';
  const response = await apiClient.get(`/cms/topics/${topicId}/vocabularies${query}`);
  return response.data.data;
};

/**
 * Update vocabulary
 * PUT /api/cms/vocabularies/:id
 * @Roles ADMIN
 */
export const updateVocabulary = async (
  id: number,
  data: Partial<CMSVocabulary>
): Promise<CMSVocabulary> => {
  const response = await apiClient.put(`/cms/vocabularies/${id}`, data);
  return response.data.data;
};

/**
 * Delete vocabulary
 * DELETE /api/cms/vocabularies/:id
 * @Roles ADMIN
 */
export const deleteVocabulary = async (id: number): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/cms/vocabularies/${id}`);
  return response.data.data;
};

/**
 * Publish vocabulary
 * POST /api/cms/vocabularies/:id/publish
 * @Roles ADMIN
 */
export const publishVocabulary = async (id: number): Promise<CMSVocabulary> => {
  const response = await apiClient.post(`/cms/vocabularies/${id}/publish`);
  return response.data.data;
};

// ==================== QUIZ MANAGEMENT ====================

/**
 * Create quiz
 * POST /api/cms/quizzes
 * @Roles ADMIN
 */
export const createQuiz = async (data: {
  topicId: number;
  title: string;
  description: string;
  questionText: string;
  options: Array<{
    text: string;
    isCorrect: boolean;
  }>;
  difficultyLevel?: number;
  status?: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
}): Promise<CMSQuiz> => {
  const response = await apiClient.post('/cms/quizzes', data);
  return response.data.data;
};

/**
 * Get quiz by ID
 * GET /api/cms/quizzes/:id
 * @Roles ADMIN
 */
export const getCMSQuiz = async (id: number): Promise<CMSQuiz> => {
  const response = await apiClient.get(`/cms/quizzes/${id}`);
  return response.data.data;
};

/**
 * Get quizzes by topic
 * GET /api/cms/topics/:topicId/quizzes?status=all
 * @Roles ADMIN
 */
export const getTopicQuizzes = async (
  topicId: number,
  status?: 'all' | 'DRAFT' | 'PUBLISHED'
): Promise<CMSQuiz[]> => {
  const query = status ? `?status=${status}` : '';
  const response = await apiClient.get(`/cms/topics/${topicId}/quizzes${query}`);
  const quizzesData = response.data.data || response.data;
  // Normalize quiz objects to CMSQuiz interface
  return (Array.isArray(quizzesData) ? quizzesData : []).map((rawQuiz) => {
    const q = isRecord(rawQuiz) ? rawQuiz : {};
    const rawOptions = Array.isArray(q.options) ? q.options : [];
    const options = rawOptions.map((rawOption) => {
      if (typeof rawOption === 'string') {
        return { text: rawOption, isCorrect: false };
      }
      if (isRecord(rawOption)) {
        return {
          text: typeof rawOption.text === 'string' ? rawOption.text : '',
          isCorrect: Boolean(rawOption.isCorrect),
        };
      }
      return { text: '', isCorrect: false };
    });

    return {
      id: typeof q.id === 'number' ? q.id : 0,
      topicId: typeof q.topicId === 'number' ? q.topicId : topicId,
      title: typeof q.title === 'string' ? q.title : 'Quiz',
      description: typeof q.description === 'string' ? q.description : '',
      questionText:
        typeof q.questionText === 'string'
          ? q.questionText
          : typeof q.question === 'string'
            ? q.question
            : '',
      options,
      correctAnswer: typeof q.correctAnswer === 'string' ? q.correctAnswer : undefined,
      difficultyLevel: typeof q.difficultyLevel === 'number' ? q.difficultyLevel : 1,
      status:
        q.status === 'DRAFT' || q.status === 'REVIEW' || q.status === 'PUBLISHED' || q.status === 'ARCHIVED'
          ? q.status
          : undefined,
      createdAt: typeof q.createdAt === 'string' ? q.createdAt : new Date().toISOString(),
      updatedAt: typeof q.updatedAt === 'string' ? q.updatedAt : new Date().toISOString(),
    };
  });
};

/**
 * Update quiz
 * PUT /api/cms/quizzes/:id
 * @Roles ADMIN
 */
export const updateQuiz = async (
  id: number,
  data: Partial<CMSQuiz>
): Promise<CMSQuiz> => {
  const response = await apiClient.put(`/cms/quizzes/${id}`, data);
  return response.data.data;
};

/**
 * Delete quiz
 * DELETE /api/cms/quizzes/:id
 * @Roles ADMIN
 */
export const deleteQuiz = async (id: number): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/cms/quizzes/${id}`);
  return response.data.data;
};

/**
 * Publish quiz
 * POST /api/cms/quizzes/:id/publish
 * @Roles ADMIN
 */
export const publishQuiz = async (id: number): Promise<CMSQuiz> => {
  const response = await apiClient.post(`/cms/quizzes/${id}/publish`);
  return response.data.data;
};

// ==================== AUDIT LOGS ====================

/**
 * Get audit logs for entity
 * GET /api/cms/audit-logs/entity/:entityType/:entityId
 * @Roles ADMIN
 */
export const getEntityAuditLogs = async (
  entityType: 'TOPIC' | 'VOCABULARY' | 'QUIZ',
  entityId: number
): Promise<AuditLog[]> => {
  const response = await apiClient.get(`/cms/audit-logs/entity/${entityType}/${entityId}`);
  return response.data.data;
};

/**
 * Get audit logs by admin
 * GET /api/cms/audit-logs/admin/:adminId?limit=50
 * @Roles ADMIN
 */
export const getAdminAuditLogs = async (
  adminId: number,
  limit = 50
): Promise<AuditLog[]> => {
  const response = await apiClient.get(`/cms/audit-logs/admin/${adminId}?limit=${limit}`);
  return response.data.data;
};
