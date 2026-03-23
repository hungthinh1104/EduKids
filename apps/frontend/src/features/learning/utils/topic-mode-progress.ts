export type TopicLearningMode = 'flashcard' | 'quiz' | 'pronunciation';

export interface TopicModeProgress {
  flashcard: boolean;
  quiz: boolean;
  pronunciation: boolean;
  updatedAt: string | null;
}

const defaultProgress = (): TopicModeProgress => ({
  flashcard: false,
  quiz: false,
  pronunciation: false,
  updatedAt: null,
});

const ACTIVE_CHILD_STORAGE_KEY = 'edukids-active-child-id';

const readActiveChildId = (): number | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_CHILD_STORAGE_KEY);
    if (!raw) return null;
    const value = Number.parseInt(raw, 10);
    return Number.isInteger(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
};

export const setTopicModeProgressChildScope = (childId: number | null | undefined) => {
  if (typeof window === 'undefined') return;
  try {
    if (Number.isInteger(childId) && (childId as number) > 0) {
      window.localStorage.setItem(ACTIVE_CHILD_STORAGE_KEY, String(childId));
    }
  } catch {
    // ignore storage write errors
  }
};

export const clearTopicModeProgressChildScope = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(ACTIVE_CHILD_STORAGE_KEY);
  } catch {
    // ignore storage write errors
  }
};

const getStorageKey = (topicId: number) => {
  const activeChildId = readActiveChildId();
  return activeChildId
    ? `topic-mode-progress:child:${activeChildId}:topic:${topicId}`
    : `topic-mode-progress:topic:${topicId}`;
};

export const readTopicModeProgress = (topicId: number): TopicModeProgress => {
  if (typeof window === 'undefined' || !Number.isInteger(topicId) || topicId <= 0) {
    return defaultProgress();
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(topicId));
    if (!raw) return defaultProgress();

    const parsed = JSON.parse(raw) as Partial<TopicModeProgress>;
    return {
      flashcard: Boolean(parsed.flashcard),
      quiz: Boolean(parsed.quiz),
      pronunciation: Boolean(parsed.pronunciation),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
    };
  } catch {
    return defaultProgress();
  }
};

export const markTopicModeCompleted = (topicId: number, mode: TopicLearningMode): TopicModeProgress => {
  const next = {
    ...readTopicModeProgress(topicId),
    [mode]: true,
    updatedAt: new Date().toISOString(),
  } satisfies TopicModeProgress;

  if (typeof window !== 'undefined' && Number.isInteger(topicId) && topicId > 0) {
    try {
      window.localStorage.setItem(getStorageKey(topicId), JSON.stringify(next));
    } catch {
      // ignore storage write errors
    }
  }

  return next;
};
