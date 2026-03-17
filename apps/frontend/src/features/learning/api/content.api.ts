import { apiClient as axiosInstance } from '@/shared/services/api.client';

export interface Topic {
  id: number;
  name: string;
  description: string | null;
  vocabularyCount?: number;
  createdAt: string;
  completedCount?: number;
  progressPercentage?: number;
  starsEarned?: number;
  hasVideo?: boolean;
  videoUrl?: string;
  vocabularies?: Vocabulary[];
  progress?: {
    completed: number;
    total: number;
    starsEarned: number;
  };
}

export interface Vocabulary {
  id: number;
  topicId: number;
  word: string;
  phonetic: string;
  translation: string;
  meaning?: string;
  partOfSpeech: string;
  exampleSentence?: string; // Made optional as per instruction
  example?: string;
  emoji?: string; // Added as per instruction
  difficulty: number;
  audioUrl?: string;
  imageUrl?: string;
  media?: VocabularyMedia[];
}

export interface VocabularyMedia {
  id: number;
  vocabularyId: number;
  type: 'IMAGE' | 'AUDIO';
  url: string;
}

export interface ApiEnvelope<T> {
  data: T;
  message?: string;
}

interface TopicDetailPayload {
  topic?: {
    id: number;
    name: string;
    description: string | null;
    vocabularyCount?: number;
    createdAt: string;
    completedCount?: number;
    progressPercentage?: number;
    starsEarned?: number;
    hasVideo?: boolean;
  };
  vocabularies?: unknown[];
  completedCount?: number;
  progressPercentage?: number;
  videoUrl?: string;
}

export interface PaginatedResponse<T> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: T[];
}

export interface ApiEnvelopeWithPagination<T> {
  statusCode: number;
  message: string;
  data: PaginatedResponse<T>;
}

type Dict = Record<string, unknown>;

const isRecord = (value: unknown): value is Dict => typeof value === 'object' && value !== null;

const normalizeVocabulary = (raw: unknown): Vocabulary => {
  const data = isRecord(raw) ? raw : {};
  const media = Array.isArray(data.media) ? (data.media as VocabularyMedia[]) : undefined;
  const audioMedia = media?.find((item) => item.type === 'AUDIO');
  const imageMedia = media?.find((item) => item.type === 'IMAGE');
  const translation =
    typeof data.translation === 'string'
      ? data.translation
      : typeof data.meaning === 'string'
        ? data.meaning
        : '';
  const exampleSentence =
    typeof data.exampleSentence === 'string'
      ? data.exampleSentence
      : typeof data.example === 'string'
        ? data.example
        : undefined;

  return {
    id: typeof data.id === 'number' ? data.id : 0,
    topicId: typeof data.topicId === 'number' ? data.topicId : 0,
    word: typeof data.word === 'string' ? data.word : '',
    phonetic: typeof data.phonetic === 'string' ? data.phonetic : '',
    translation,
    meaning: translation,
    partOfSpeech: typeof data.partOfSpeech === 'string' ? data.partOfSpeech : '',
    exampleSentence,
    example: exampleSentence,
    emoji: typeof data.emoji === 'string' ? data.emoji : undefined,
    difficulty: typeof data.difficulty === 'number' ? data.difficulty : 1,
    audioUrl:
      typeof data.audioUrl === 'string'
        ? data.audioUrl
        : typeof audioMedia?.url === 'string'
          ? audioMedia.url
          : undefined,
    imageUrl:
      typeof data.imageUrl === 'string'
        ? data.imageUrl
        : typeof imageMedia?.url === 'string'
          ? imageMedia.url
          : undefined,
    media,
  };
};

export const contentApi = {
  // Get all topics
  getTopics: async (): Promise<Topic[]> => {
    const response = await axiosInstance.get<ApiEnvelopeWithPagination<Topic>>('content/topics');
    return response.data.data.items;
  },

  // Get topic by ID
  getTopicById: async (id: number): Promise<Topic> => {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Invalid topic ID');
    }
    const response = await axiosInstance.get<ApiEnvelope<unknown>>(`content/topics/${id}`);
    const payload = response.data.data;

    // New BE shape: { topic, vocabularies, completedCount, progressPercentage }
    if (isRecord(payload) && isRecord(payload.topic)) {
      const detail = payload as TopicDetailPayload;
      const baseTopic = detail.topic;
      if (!baseTopic) {
        throw new Error('Invalid topic detail response');
      }
      const normalizedVocabs = Array.isArray(detail.vocabularies)
        ? detail.vocabularies.map(normalizeVocabulary)
        : [];

      const completed = typeof detail.completedCount === 'number' ? detail.completedCount : 0;
      const total =
        typeof baseTopic.vocabularyCount === 'number'
          ? baseTopic.vocabularyCount
          : normalizedVocabs.length;
      const progressPercentage =
        typeof detail.progressPercentage === 'number' ? detail.progressPercentage : 0;

      const starsEarned =
        progressPercentage >= 90 ? 3 : progressPercentage >= 60 ? 2 : progressPercentage > 0 ? 1 : 0;

      return {
        id: baseTopic.id,
        name: baseTopic.name,
        description: baseTopic.description,
        vocabularyCount: total,
        createdAt: baseTopic.createdAt,
        completedCount: completed,
        progressPercentage,
        starsEarned:
          typeof baseTopic.starsEarned === 'number' ? baseTopic.starsEarned : starsEarned,
        hasVideo:
          typeof baseTopic.hasVideo === 'boolean' ? baseTopic.hasVideo : typeof detail.videoUrl === 'string',
        videoUrl: typeof detail.videoUrl === 'string' ? detail.videoUrl : undefined,
        vocabularies: normalizedVocabs,
        progress: {
          completed,
          total,
          starsEarned,
        },
      };
    }

    // Backward compatibility: flat topic shape
    if (isRecord(payload)) {
      const flatTopic = payload as Partial<Topic>;
      return {
        id: typeof flatTopic.id === 'number' ? flatTopic.id : id,
        name: typeof flatTopic.name === 'string' ? flatTopic.name : '',
        description: typeof flatTopic.description === 'string' || flatTopic.description === null ? flatTopic.description : null,
        vocabularyCount: typeof flatTopic.vocabularyCount === 'number' ? flatTopic.vocabularyCount : 0,
        createdAt: typeof flatTopic.createdAt === 'string' ? flatTopic.createdAt : new Date().toISOString(),
        completedCount: typeof flatTopic.completedCount === 'number' ? flatTopic.completedCount : 0,
        progressPercentage: typeof flatTopic.progressPercentage === 'number' ? flatTopic.progressPercentage : 0,
        starsEarned: typeof flatTopic.starsEarned === 'number' ? flatTopic.starsEarned : 0,
        hasVideo: typeof flatTopic.hasVideo === 'boolean' ? flatTopic.hasVideo : false,
        videoUrl: typeof flatTopic.videoUrl === 'string' ? flatTopic.videoUrl : undefined,
        vocabularies: Array.isArray(flatTopic.vocabularies)
          ? flatTopic.vocabularies.map(normalizeVocabulary)
          : [],
        progress: flatTopic.progress,
      };
    }

    throw new Error('Invalid topic detail response');
  },

  // Get vocabulary by ID
  getVocabularyById: async (id: number): Promise<Vocabulary> => {
    const response = await axiosInstance.get<ApiEnvelope<unknown>>(`content/vocabularies/${id}`);
    return normalizeVocabulary(response.data.data);
  },
};
