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
  entityId?: number;
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

const toFormString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  return value.trim();
};

const normalizeStatus = (
  value: unknown,
): 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED' => {
  if (
    value === 'DRAFT' ||
    value === 'REVIEW' ||
    value === 'PUBLISHED' ||
    value === 'ARCHIVED'
  ) {
    return value;
  }
  return 'DRAFT';
};

const normalizeTopic = (value: unknown): CMSTopic => {
  const record = isRecord(value) ? value : {};
  const relationCount = isRecord(record._count) ? record._count : undefined;

  return {
    id: typeof record.id === 'number' ? record.id : 0,
    name: typeof record.name === 'string' ? record.name : '',
    description: typeof record.description === 'string' ? record.description : '',
    learningLevel: typeof record.learningLevel === 'number' ? record.learningLevel : undefined,
    imageUrl: typeof record.imageUrl === 'string' ? record.imageUrl : undefined,
    status: normalizeStatus(record.status),
    tags: Array.isArray(record.tags)
      ? record.tags.filter((tag): tag is string => typeof tag === 'string')
      : undefined,
    deletedAt: typeof record.deletedAt === 'string' ? record.deletedAt : undefined,
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : '',
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : '',
    vocabularyCount:
      typeof record.vocabularyCount === 'number'
        ? record.vocabularyCount
        : relationCount && typeof relationCount.vocabularies === 'number'
          ? relationCount.vocabularies
          : undefined,
    _count: relationCount
      ? {
          vocabularies:
            typeof relationCount.vocabularies === 'number'
              ? relationCount.vocabularies
              : 0,
          quizzes:
            typeof relationCount.quizzes === 'number'
              ? relationCount.quizzes
              : undefined,
        }
      : undefined,
  };
};

const normalizeVocabulary = (value: unknown): CMSVocabulary => {
  const record = isRecord(value) ? value : {};
  const topic = isRecord(record.topic) ? record.topic : undefined;
  const media = Array.isArray(record.media)
    ? record.media.filter(isRecord).map((item) => ({
        id: typeof item.id === 'number' ? item.id : 0,
        type: item.type as 'IMAGE' | 'AUDIO' | 'VIDEO',
        url: typeof item.url === 'string' ? item.url : '',
      }))
    : undefined;

  const imageFromMedia = media?.find((item) => item.type === 'IMAGE')?.url;
  const audioFromMedia = media?.find((item) => item.type === 'AUDIO')?.url;

  return {
    id: typeof record.id === 'number' ? record.id : 0,
    topicId:
      typeof record.topicId === 'number'
        ? record.topicId
        : typeof topic?.id === 'number'
          ? topic.id
          : 0,
    word: typeof record.word === 'string' ? record.word : '',
    definition:
      typeof record.definition === 'string'
        ? record.definition
        : typeof record.translation === 'string'
          ? record.translation
          : '',
    phonetic: typeof record.phonetic === 'string' ? record.phonetic : undefined,
    example:
      typeof record.example === 'string'
        ? record.example
        : typeof record.exampleSentence === 'string'
          ? record.exampleSentence
          : undefined,
    imageUrl:
      typeof record.imageUrl === 'string' ? record.imageUrl : imageFromMedia,
    audioUrl:
      typeof record.audioUrl === 'string' ? record.audioUrl : audioFromMedia,
    status: normalizeStatus(record.status),
    partOfSpeech:
      typeof record.partOfSpeech === 'string' ? record.partOfSpeech : undefined,
    difficulty: typeof record.difficulty === 'number' ? record.difficulty : undefined,
    deletedAt: typeof record.deletedAt === 'string' ? record.deletedAt : undefined,
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : '',
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : '',
    topic:
      topic && typeof topic.id === 'number' && typeof topic.name === 'string'
        ? { id: topic.id, name: topic.name }
        : undefined,
    media,
  };
};

const toVocabularyPayload = (data: Partial<CMSVocabulary> & { topicId?: number }) => {
  const payload: Record<string, unknown> = {};

  if (typeof data.topicId === 'number') payload.topicId = data.topicId;
  if (typeof data.word === 'string') payload.word = data.word.trim();
  if (typeof data.definition === 'string') payload.definition = data.definition.trim();

  const phonetic = toFormString(data.phonetic);
  if (phonetic !== undefined) payload.phonetic = phonetic;

  const example = toFormString(data.example);
  if (example !== undefined) payload.example = example;

  const imageUrl = toFormString(data.imageUrl);
  if (imageUrl !== undefined) payload.imageUrl = imageUrl;

  const audioUrl = toFormString(data.audioUrl);
  if (audioUrl !== undefined) payload.audioUrl = audioUrl;

  if (typeof data.status === 'string') payload.status = data.status;

  return payload;
};

const toQuizOptionsPayload = (
  options: unknown,
  correctAnswer?: string,
): Array<{ text: string; isCorrect: boolean }> | undefined => {
  if (!Array.isArray(options)) return undefined;

  const normalized = options
    .map((option) => {
      if (typeof option === 'string') {
        const text = option.trim();
        if (!text) return null;
        return {
          text,
          isCorrect: correctAnswer ? text === correctAnswer : false,
        };
      }

      if (isRecord(option)) {
        const text = typeof option.text === 'string' ? option.text.trim() : '';
        if (!text) return null;
        return {
          text,
          isCorrect: Boolean(option.isCorrect),
        };
      }

      return null;
    })
    .filter((item): item is { text: string; isCorrect: boolean } => item !== null);

  return normalized.length > 0 ? normalized : undefined;
};

const toCreateQuizPayload = (data: {
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
}) => {
  return {
    topicId: data.topicId,
    title: data.title.trim(),
    description: data.description.trim(),
    questionText: data.questionText.trim(),
    options: data.options,
    difficultyLevel: data.difficultyLevel,
    status: data.status,
  };
};

const toUpdateQuizPayload = (data: Partial<CMSQuiz>) => {
  const payload: Record<string, unknown> = {};

  if (typeof data.title === 'string') payload.title = data.title.trim();
  if (typeof data.description === 'string') payload.description = data.description.trim();
  if (typeof data.questionText === 'string') payload.questionText = data.questionText.trim();

  const options = toQuizOptionsPayload(data.options, data.correctAnswer);
  if (options) payload.options = options;

  if (typeof data.difficultyLevel === 'number') payload.difficultyLevel = data.difficultyLevel;
  if (typeof data.status === 'string') payload.status = data.status;

  return payload;
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
  return normalizeTopic(response.data.data);
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
  const payload = response.data.data;

  // Backend paginated shape: { data: Topic[], total, page, totalPages }
  if (Array.isArray(payload?.data)) {
    return {
      items: payload.data.map(normalizeTopic),
      total: typeof payload.total === 'number' ? payload.total : payload.data.length,
    };
  }

  // Backward compatibility: { items, total }
  if (Array.isArray(payload?.items)) {
    return {
      items: payload.items.map(normalizeTopic),
      total: typeof payload.total === 'number' ? payload.total : payload.items.length,
    };
  }

  // Backward compatibility: raw array
  if (Array.isArray(payload)) {
    return { items: payload.map(normalizeTopic), total: payload.length };
  }

  return { items: [], total: 0 };
};

/**
 * Get single topic
 * GET /api/cms/topics/:id
 * @Roles ADMIN
 */
export const getCMSTopic = async (id: number): Promise<CMSTopic> => {
  const response = await apiClient.get(`/cms/topics/${id}`);
  return normalizeTopic(response.data.data);
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
  return normalizeTopic(response.data.data);
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
  return {
    ...normalizeTopic(response.data.data),
    status: 'PUBLISHED',
  };
};

/**
 * Archive topic
 * POST /api/cms/topics/:id/archive
 * @Roles ADMIN
 */
export const archiveTopic = async (id: number): Promise<CMSTopic> => {
  const response = await apiClient.post(`/cms/topics/${id}/archive`);
  return {
    ...normalizeTopic(response.data.data),
    status: 'ARCHIVED',
  };
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
  const response = await apiClient.post('/cms/vocabularies', toVocabularyPayload(data));
  return normalizeVocabulary(response.data.data);
};

/**
 * Get vocabulary by ID
 * GET /api/cms/vocabularies/:id
 * @Roles ADMIN
 */
export const getCMSVocabulary = async (id: number): Promise<CMSVocabulary> => {
  const response = await apiClient.get(`/cms/vocabularies/${id}`);
  return normalizeVocabulary(response.data.data);
};

/**
 * Get vocabularies by topic
 * GET /api/cms/topics/:topicId/vocabularies?page=1&limit=100
 * @Roles ADMIN
 */
export const getTopicVocabularies = async (
  topicId: number,
  params?: { page?: number; limit?: number }
): Promise<CMSVocabulary[]> => {
  const query = toQueryString({ page: params?.page ?? 1, limit: params?.limit ?? 100 });
  const response = await apiClient.get(`/cms/topics/${topicId}/vocabularies?${query}`);
  const payload = response.data.data;

  // Backend returns: { data: [...], total, page, totalPages }
  if (Array.isArray(payload?.data)) {
    return payload.data.map(normalizeVocabulary);
  }

  // Backward compatibility if API returns raw array
  if (Array.isArray(payload)) {
    return payload.map(normalizeVocabulary);
  }

  return [];
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
  const response = await apiClient.put(`/cms/vocabularies/${id}`, toVocabularyPayload(data));
  return normalizeVocabulary(response.data.data);
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
  return normalizeVocabulary(response.data.data);
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
  const response = await apiClient.post('/cms/quizzes', toCreateQuizPayload(data));
  const raw = isRecord(response.data?.data) ? response.data.data : {};
  return {
    id: typeof raw.id === 'number' ? raw.id : 0,
    topicId: typeof raw.topicId === 'number' ? raw.topicId : data.topicId,
    title: typeof raw.title === 'string' ? raw.title : data.title,
    description: typeof raw.description === 'string' ? raw.description : data.description,
    questionText:
      typeof raw.questionText === 'string' ? raw.questionText : data.questionText,
    options: Array.isArray(raw.options) ? raw.options as CMSQuiz['options'] : data.options,
    correctAnswer: typeof raw.correctAnswer === 'string' ? raw.correctAnswer : data.options.find((o) => o.isCorrect)?.text,
    difficultyLevel:
      typeof raw.difficultyLevel === 'number' ? raw.difficultyLevel : data.difficultyLevel,
    status: normalizeStatus(raw.status),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
};

/**
 * Get quiz by ID
 * GET /api/cms/quizzes/:id
 * @Roles ADMIN
 */
export const getCMSQuiz = async (id: number): Promise<CMSQuiz> => {
  const response = await apiClient.get(`/cms/quizzes/${id}`);
  const raw = isRecord(response.data?.data) ? response.data.data : {};
  return {
    id: typeof raw.id === 'number' ? raw.id : id,
    topicId: typeof raw.topicId === 'number' ? raw.topicId : 0,
    title: typeof raw.title === 'string' ? raw.title : '',
    description: typeof raw.description === 'string' ? raw.description : '',
    questionText: typeof raw.questionText === 'string' ? raw.questionText : '',
    options: Array.isArray(raw.options) ? raw.options as CMSQuiz['options'] : [],
    correctAnswer: typeof raw.correctAnswer === 'string' ? raw.correctAnswer : undefined,
    difficultyLevel: typeof raw.difficultyLevel === 'number' ? raw.difficultyLevel : 1,
    status: normalizeStatus(raw.status),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
};

/**
 * Get quizzes by topic
 * GET /api/cms/topics/:topicId/quizzes?page=1&limit=100
 * @Roles ADMIN
 */
export const getTopicQuizzes = async (
  topicId: number,
  params?: { page?: number; limit?: number }
): Promise<CMSQuiz[]> => {
  const query = toQueryString({ page: params?.page ?? 1, limit: params?.limit ?? 100 });
  const response = await apiClient.get(`/cms/topics/${topicId}/quizzes?${query}`);
  const payload = response.data.data || response.data;
  const quizzesData = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
      ? payload
      : [];
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
        normalizeStatus(q.status),
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
  const response = await apiClient.put(`/cms/quizzes/${id}`, toUpdateQuizPayload(data));
  const raw = isRecord(response.data?.data) ? response.data.data : {};
  return {
    id: typeof raw.id === 'number' ? raw.id : id,
    topicId: typeof raw.topicId === 'number' ? raw.topicId : (typeof data.topicId === 'number' ? data.topicId : 0),
    title: typeof raw.title === 'string' ? raw.title : (typeof data.title === 'string' ? data.title : ''),
    description: typeof raw.description === 'string' ? raw.description : (typeof data.description === 'string' ? data.description : ''),
    questionText: typeof raw.questionText === 'string' ? raw.questionText : (typeof data.questionText === 'string' ? data.questionText : ''),
    options: Array.isArray(raw.options) ? raw.options as CMSQuiz['options'] : (Array.isArray(data.options) ? data.options : []),
    correctAnswer: typeof raw.correctAnswer === 'string' ? raw.correctAnswer : data.correctAnswer,
    difficultyLevel: typeof raw.difficultyLevel === 'number' ? raw.difficultyLevel : data.difficultyLevel,
    status: normalizeStatus(raw.status),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
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
  const raw = isRecord(response.data?.data) ? response.data.data : {};
  return {
    id: typeof raw.id === 'number' ? raw.id : id,
    topicId: typeof raw.topicId === 'number' ? raw.topicId : 0,
    title: typeof raw.title === 'string' ? raw.title : '',
    description: typeof raw.description === 'string' ? raw.description : '',
    questionText: typeof raw.questionText === 'string' ? raw.questionText : '',
    options: Array.isArray(raw.options) ? raw.options as CMSQuiz['options'] : [],
    correctAnswer: typeof raw.correctAnswer === 'string' ? raw.correctAnswer : undefined,
    difficultyLevel: typeof raw.difficultyLevel === 'number' ? raw.difficultyLevel : 1,
    status: 'PUBLISHED',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
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
