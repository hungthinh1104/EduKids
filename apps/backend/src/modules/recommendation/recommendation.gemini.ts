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

export function buildGeminiRecommendationPrompt(
  context: GeminiRecommendationContext,
): string {
  const maxRecommendations = Math.min(
    Math.max(1, Number(context.constraints?.maxRecommendations ?? 3)),
    3,
  );
  const maxPathItems = Math.min(
    Math.max(1, Number(context.constraints?.maxPathItems ?? 3)),
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
      null,
      2,
    ),
    '',
    'Input context:',
    JSON.stringify(context, null, 2),
  ].join('\n');
}

export function normalizeGeminiRecommendationOutput(
  raw: unknown,
): GeminiRecommendationOutput {
  const parsed = parseModelJson(raw);
  const root = isRecord(parsed) ? parsed : {};
  const list = Array.isArray(root.recommendations) ? root.recommendations : [];

  const recommendations = list
    .map((r) => normalizeRecommendation(r))
    .filter((r): r is NonNullable<typeof r> => !!r)
    .slice(0, 3);

  return { recommendations };
}

function normalizeRecommendation(item: unknown) {
  if (!isRecord(item)) return null;

  const type = String(item.type || 'TOPIC_REVIEW') as RecommendationType;
  const priority = String(item.priority || 'MEDIUM') as RecommendationPriority;

  if (!ALLOWED_TYPES.has(type)) return null;
  if (!ALLOWED_PRIORITIES.has(priority)) return null;

  const scoreBreakdown = normalizeScoreBreakdown(item.scoreBreakdown);
  const learningPath = normalizeLearningPath(item.learningPath);

  if (learningPath.length === 0) return null;

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

function normalizeLearningPath(value: unknown): LearningPathItemDto[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, idx) => {
      if (!isRecord(item)) return null;
      const contentId = Math.max(0, Number(item.contentId || 0));
      const contentName = safeText(item.contentName, 255, 'Chủ đề');
      if (!contentId || !contentName) return null;

      const pathItem: LearningPathItemDto = {
        contentId,
        contentName,
        sequenceOrder: clampNum(item.sequenceOrder, 1, 10, idx + 1),
        estimatedMinutes: clampNum(item.estimatedMinutes, 10, 45, 20),
      };

      if (item.difficultyLevel) {
        pathItem.difficultyLevel = safeText(item.difficultyLevel, 50, 'BEGINNER');
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
    .slice(0, 3);
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
  } catch {
    return {};
  }
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
