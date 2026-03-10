import { apiClient as axiosInstance } from '@/shared/services/api.client';

export interface Topic {
  id: number;
  name: string;
  description: string | null;
  vocabularyCount?: number;
  createdAt: string;
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
    audioUrl: typeof data.audioUrl === 'string' ? data.audioUrl : undefined,
    imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : undefined,
    media: Array.isArray(data.media) ? (data.media as VocabularyMedia[]) : undefined,
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
    const response = await axiosInstance.get<ApiEnvelope<Topic>>(`content/topics/${id}`);
    return response.data.data;
  },

  // Get vocabulary by ID
  getVocabularyById: async (id: number): Promise<Vocabulary> => {
    const response = await axiosInstance.get<ApiEnvelope<unknown>>(`content/vocabularies/${id}`);
    return normalizeVocabulary(response.data.data);
  },
};
