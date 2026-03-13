import {
  RecommendationPriority,
  RecommendationType,
  type AIScoreBreakdown,
  type LearningPathItemDto,
} from './recommendation.dto';

export interface GeminiRecommendationContext {
  childId: number;
  age?: number;
  timezone?: string;
  recentMetrics: {
    pronunciationAvg: number;
    quizAvg: number;
    engagementDays30: number;
    weakTopicIds: number[];
    weakTopicNames: string[];
    strongTopicNames: string[];
  };
  multimodalSignals?: {
    audio?: {
      pronunciationAvg?: number;
      fluencyAvg?: number;
      ipaMismatchRate?: number;
      recentAttemptCount?: number;
    };
    video?: {
      watchedMinutes7d?: number;
      completionRate?: number;
      rewindRate?: number;
      preferredTopics?: string[];
    };
    image?: {
      imageQuizAccuracy?: number;
      visualConceptCoverage?: number;
      confusionLabels?: string[];
    };
  };
  candidateTopics: Array<{
    id: number;
    name: string;
    estimatedMinutes?: number;
    difficulty?: string;
  }>;
  constraints?: {
    maxRecommendations?: number;
    maxPathItems?: number;
    maxMinutesPerPath?: number;
  };
}

export interface GeminiRecommendationOutput {
  recommendations: Array<{
    type: RecommendationType;
    priority: RecommendationPriority;
    title: string;
    description: string;
    expectedOutcome?: string;
    scoreBreakdown: AIScoreBreakdown;
    learningPath: LearningPathItemDto[];
  }>;
}

const ALLOWED_TYPES = new Set(Object.values(RecommendationType));
const ALLOWED_PRIORITIES = new Set(Object.values(RecommendationPriority));
const ALLOWED_DIFFICULTY_LEVELS = new Set([
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
]);

interface NormalizeOptions {
  maxRecommendations?: number;
  maxPathItems?: number;
  allowedTopicIds?: number[];
}

export function buildGeminiRecommendationPrompt(
  context: GeminiRecommendationContext,
): string {
  const sanitizedContext = sanitizeContextForPrompt(context);

  const maxRecommendations = Math.min(
    Math.max(1, Number(sanitizedContext.constraints?.maxRecommendations ?? 3)),
    3,
  );
  const maxPathItems = Math.min(
    Math.max(1, Number(sanitizedContext.constraints?.maxPathItems ?? 3)),
    3,
  );

  return [
    'You are an AI recommendation engine for an English learning app for children.',
    'Return ONLY valid JSON. No markdown, no code fences, no explanation.',
    'Language for title/description/outcome: Vietnamese.',
    'Goal: produce practical, evidence-based weekly recommendations for parents.',
    'Hard rules:',
    `- recommendations length: 1..${maxRecommendations}`,
    `- learningPath length per recommendation: 1..${maxPathItems}`,
    '- Each learningPath item must reference a valid candidate topic id.',
    '- estimatedMinutes per item: 10..45',
    '- scoreBreakdown fields range: 0..100',
    '- overallScore should reflect priority (CRITICAL/HIGH >= 70, MEDIUM 45..85, LOW <= 70).',
    '- Avoid duplicates in topic id within the same learningPath.',
    '- Keep content safe for children and parents.',
    '- Use audio/video/image signals when available; do not invent missing signals.',
    '- Do not recommend more than one CRITICAL item.',
    '- Prefer recommendations that can be completed in 3-7 days.',
    '- Description must cite concrete evidence from input metrics (e.g., quizAvg, pronunciationAvg).',
    '- Expected outcome must be measurable (percentage/attempts/minutes), not vague.',
    '',
    'Decision policy (must follow):',
    '- If pronunciationAvg < 65 OR audio.ipaMismatchRate >= 30 => prioritize PRONUNCIATION_REFINEMENT or WEAKNESS_PRACTICE.',
    '- If quizAvg < 65 => include QUIZ_PREPARATION or TOPIC_REVIEW.',
    '- If engagementDays30 < 8 OR video.completionRate < 50 => include CONSISTENCY_BOOST with short sessions.',
    '- If pronunciationAvg >= 80 AND quizAvg >= 80 AND engagementDays30 >= 12 => allow TOPIC_ADVANCE.',
    '- If weakTopicIds is non-empty, at least one path item should target these weak topics.',
    '- If signals are conflicting, choose safer remediation (REVIEW/WEAKNESS) before ADVANCE.',
    '',
    'Scoring guidance:',
    '- weaknessScore: reflect pronunciation weaknesses + confusion labels impact.',
    '- vocabularyGapScore: reflect imageQuizAccuracy + visualConceptCoverage + weak topic spread.',
    '- readinessScore: reflect recent stability (quiz/pronunciation averages + engagement consistency).',
    '- engagementScore: reflect engagementDays30, video watchedMinutes7d, completionRate.',
    '- overallScore: weighted summary; should align with selected priority.',
    '',
    'Output JSON schema:',
    JSON.stringify(
      {
        recommendations: [
          {
            type: 'TOPIC_REVIEW',
            priority: 'HIGH',
            title: 'string',
            description: 'string',
            expectedOutcome: 'string',
            scoreBreakdown: {
              weaknessScore: 0,
              vocabularyGapScore: 0,
              readinessScore: 0,
              engagementScore: 0,
              overallScore: 0,
            },
            learningPath: [
              {
                contentId: 1,
                contentName: 'string',
                sequenceOrder: 1,
                estimatedMinutes: 20,
                difficultyLevel: 'BEGINNER',
                rationale: 'string',
              },
            ],
          },
        ],
      },
    ),
    '',
    'Input context:',
    JSON.stringify(sanitizedContext),
  ].join('\n');
}

export function normalizeGeminiRecommendationOutput(
  raw: unknown,
  options: NormalizeOptions = {},
): GeminiRecommendationOutput {
  const parsed = parseModelJson(raw);
  const root = isRecord(parsed) ? parsed : {};
  const list = Array.isArray(root.recommendations) ? root.recommendations : [];

  const maxRecommendations = Math.min(
    Math.max(1, Number(options.maxRecommendations ?? 3)),
    3,
  );
  const maxPathItems = Math.min(
    Math.max(1, Number(options.maxPathItems ?? 3)),
    3,
  );
  const allowedTopicIds = new Set(options.allowedTopicIds || []);

  const seenTypes = new Set<RecommendationType>();
  const recommendations = list
    .map((r) =>
      normalizeRecommendation(r, {
        maxPathItems,
        allowedTopicIds,
      }),
    )
    .filter((r): r is NonNullable<typeof r> => !!r)
    .filter((r) => {
      if (seenTypes.has(r.type)) return false;
      seenTypes.add(r.type);
      return true;
    })
    .slice(0, maxRecommendations);

  return { recommendations };
}

function normalizeRecommendation(
  item: unknown,
  options: {
    maxPathItems: number;
    allowedTopicIds: Set<number>;
  },
) {
  if (!isRecord(item)) return null;

  const type = String(item.type || 'TOPIC_REVIEW') as RecommendationType;
  const priority = String(item.priority || 'MEDIUM') as RecommendationPriority;

  if (!ALLOWED_TYPES.has(type)) return null;
  if (!ALLOWED_PRIORITIES.has(priority)) return null;

  const scoreBreakdown = normalizeScoreBreakdown(item.scoreBreakdown);
  const learningPath = normalizeLearningPath(
    item.learningPath,
    options.maxPathItems,
    options.allowedTopicIds,
  );

  if (learningPath.length === 0) return null;
  if (!isPriorityScoreConsistent(priority, scoreBreakdown.overallScore)) {
    return null;
  }

  return {
    type,
    priority,
    title: safeText(item.title, 255, 'Gợi ý học tập cá nhân hóa'),
    description: safeText(item.description, 1000, 'Đề xuất lộ trình học phù hợp với tình trạng hiện tại của bé.'),
    expectedOutcome: item.expectedOutcome
      ? safeText(item.expectedOutcome, 500, '')
      : undefined,
    scoreBreakdown,
    learningPath,
  };
}

function normalizeScoreBreakdown(value: unknown): AIScoreBreakdown {
  const v = isRecord(value) ? value : {};
  return {
    weaknessScore: clampNum(v.weaknessScore, 0, 100),
    vocabularyGapScore: clampNum(v.vocabularyGapScore, 0, 100),
    readinessScore: clampNum(v.readinessScore, 0, 100),
    engagementScore: clampNum(v.engagementScore, 0, 100),
    overallScore: clampNum(v.overallScore, 0, 100),
  };
}

function normalizeLearningPath(
  value: unknown,
  maxPathItems: number,
  allowedTopicIds: Set<number>,
): LearningPathItemDto[] {
  if (!Array.isArray(value)) return [];

  const seenContentIds = new Set<number>();

  const normalized = value
    .map((item, idx) => {
      if (!isRecord(item)) return null;
      const contentId = Math.max(0, Number(item.contentId || 0));
      if (allowedTopicIds.size > 0 && !allowedTopicIds.has(contentId)) {
        return null;
      }
      if (seenContentIds.has(contentId)) {
        return null;
      }
      seenContentIds.add(contentId);

      const contentName = safeText(item.contentName, 255, 'Chủ đề');
      if (!contentId || !contentName) return null;

      const pathItem: LearningPathItemDto = {
        contentId,
        contentName,
        sequenceOrder: clampNum(item.sequenceOrder, 1, 10, idx + 1),
        estimatedMinutes: clampNum(item.estimatedMinutes, 10, 45, 20),
      };

      if (item.difficultyLevel) {
        const normalizedDifficulty = safeText(item.difficultyLevel, 50, 'BEGINNER').toUpperCase();
        pathItem.difficultyLevel = ALLOWED_DIFFICULTY_LEVELS.has(normalizedDifficulty)
          ? normalizedDifficulty
          : 'BEGINNER';
      }

      if (item.rationale) {
        pathItem.rationale = safeText(
          item.rationale,
          500,
          'Phù hợp với tiến độ học hiện tại của bé.',
        );
      }

      return pathItem;
    })
    .filter((x): x is LearningPathItemDto => x !== null)
    .slice(0, maxPathItems);

  return normalized.map((item, index) => ({
    ...item,
    sequenceOrder: index + 1,
  }));
}

function parseModelJson(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;

  const noFence = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    return JSON.parse(noFence);
  } catch (error) {
    const preview = noFence.slice(0, 500);
    // eslint-disable-next-line no-console
    console.warn('[Recommendation][Gemini] Failed to parse model JSON output', {
      message: error instanceof Error ? error.message : 'Unknown parse error',
      preview,
    });
    return {};
  }
}

function isPriorityScoreConsistent(
  priority: RecommendationPriority,
  overallScore: number,
): boolean {
  if (priority === RecommendationPriority.CRITICAL || priority === RecommendationPriority.HIGH) {
    return overallScore >= 70;
  }

  if (priority === RecommendationPriority.MEDIUM) {
    return overallScore >= 45 && overallScore <= 85;
  }

  return overallScore <= 70;
}

function sanitizeContextForPrompt(
  context: GeminiRecommendationContext,
): GeminiRecommendationContext {
  const sanitizeNumberArray = (values: number[], maxItems: number) =>
    (Array.isArray(values) ? values : [])
      .filter((v) => Number.isInteger(v) && v > 0)
      .slice(0, maxItems);

  const sanitizeStringArray = (values: string[], maxItems: number, maxLen: number) =>
    (Array.isArray(values) ? values : [])
      .map((v) => sanitizePromptText(v, maxLen))
      .filter((v) => v.length > 0)
      .slice(0, maxItems);

  const candidateTopics = (Array.isArray(context.candidateTopics) ? context.candidateTopics : [])
    .slice(0, 25)
    .map((topic) => ({
      id: Number(topic.id) || 0,
      name: sanitizePromptText(topic.name, 120),
      estimatedMinutes: Number(topic.estimatedMinutes) || 20,
      difficulty: topic.difficulty ? sanitizePromptText(topic.difficulty, 30) : undefined,
    }))
    .filter((topic) => topic.id > 0 && topic.name.length > 0);

  return {
    ...context,
    age: Number(context.age) || undefined,
    timezone: context.timezone ? sanitizePromptText(context.timezone, 60) : undefined,
    recentMetrics: {
      ...context.recentMetrics,
      weakTopicIds: sanitizeNumberArray(context.recentMetrics.weakTopicIds || [], 25),
      weakTopicNames: sanitizeStringArray(context.recentMetrics.weakTopicNames || [], 20, 120),
      strongTopicNames: sanitizeStringArray(context.recentMetrics.strongTopicNames || [], 20, 120),
    },
    candidateTopics,
    constraints: {
      maxRecommendations: Math.min(Math.max(1, Number(context.constraints?.maxRecommendations ?? 3)), 3),
      maxPathItems: Math.min(Math.max(1, Number(context.constraints?.maxPathItems ?? 3)), 3),
      maxMinutesPerPath: Math.min(Math.max(30, Number(context.constraints?.maxMinutesPerPath ?? 120)), 180),
    },
  };
}

function sanitizePromptText(value: unknown, maxLen: number): string {
  const input = String(value ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const withoutPromptInjectionMarkers = input
    .replace(/ignore\s+previous\s+instructions?/gi, '')
    .replace(/system\s+prompt/gi, '')
    .replace(/developer\s+message/gi, '')
    .trim();

  return withoutPromptInjectionMarkers.slice(0, maxLen);
}

function isRecord(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function clampNum(
  value: unknown,
  min: number,
  max: number,
  fallback: number = min,
): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function safeText(value: unknown, maxLen: number, fallback: string): string {
  const s = String(value ?? '').trim();
  if (!s) return fallback;
  return s.slice(0, maxLen);
}
