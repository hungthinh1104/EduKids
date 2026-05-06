import {
  RecommendationPriority,
  RecommendationType,
  type AIScoreBreakdown,
  type LearningPathItemDto,
} from './recommendation.dto';
import { Logger } from '@nestjs/common';

const geminiLogger = new Logger('RecommendationGemini');

// ─── Exported interfaces ─────────────────────────────────────────────────────

export interface PreComputedDecision {
  type: RecommendationType;
  priority: RecommendationPriority;
  /** Topic IDs the path must draw from — decided by code, not AI */
  targetTopicIds: number[];
  /** English evidence string used as prompt context and copy fallback */
  englishRationale: string;
}

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
  /**
   * Pre-computed decisions from deterministic code.
   * When provided, Gemini only writes Vietnamese copy — not decisions.
   */
  preComputedDecisions?: PreComputedDecision[];
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

// ─── Deterministic decision engine ──────────────────────────────────────────

/**
 * Compute recommendation decisions using deterministic business rules.
 * Call this BEFORE buildGeminiRecommendationPrompt so Gemini handles copy only.
 */
export function preComputeDecisions(
  metrics: GeminiRecommendationContext['recentMetrics'],
  multimodalSignals: GeminiRecommendationContext['multimodalSignals'] | undefined,
  candidateTopics: GeminiRecommendationContext['candidateTopics'],
  maxRecommendations = 3,
): PreComputedDecision[] {
  const decisions: PreComputedDecision[] = [];
  const weakIds = metrics.weakTopicIds.slice(0, 5);
  const audio = multimodalSignals?.audio;
  const video = multimodalSignals?.video;

  const weakPronunciation = metrics.pronunciationAvg < 65 || (audio?.ipaMismatchRate ?? 0) >= 30;
  const weakQuiz = metrics.quizAvg < 65;
  const lowEngagement =
    metrics.engagementDays30 < 8 || (video?.completionRate ?? 100) < 50;
  const canAdvance =
    metrics.pronunciationAvg >= 80 &&
    metrics.quizAvg >= 80 &&
    metrics.engagementDays30 >= 12;

  const topicById = new Map(candidateTopics.map((t) => [t.id, t]));
  const fallbackIds = candidateTopics.slice(0, 3).map((t) => t.id);

  if (weakPronunciation && decisions.length < maxRecommendations) {
    decisions.push({
      type: RecommendationType.PRONUNCIATION_REFINEMENT,
      priority: RecommendationPriority.CRITICAL,
      targetTopicIds: weakIds.length > 0 ? weakIds.slice(0, 2) : fallbackIds.slice(0, 2),
      englishRationale: `Pronunciation avg ${metrics.pronunciationAvg}%${
        audio?.ipaMismatchRate ? `, IPA mismatch ${audio.ipaMismatchRate}%` : ''
      }. Needs remediation before advancing.`,
    });
  }

  if (weakQuiz && decisions.length < maxRecommendations) {
    decisions.push({
      type:
        weakIds.length > 0
          ? RecommendationType.TOPIC_REVIEW
          : RecommendationType.QUIZ_PREPARATION,
      priority: RecommendationPriority.HIGH,
      targetTopicIds: weakIds.length > 0 ? weakIds.slice(0, 2) : fallbackIds,
      englishRationale: `Quiz avg ${metrics.quizAvg}%. Topics need review before next level.`,
    });
  }

  if (lowEngagement && decisions.length < maxRecommendations) {
    decisions.push({
      type: RecommendationType.CONSISTENCY_BOOST,
      priority: RecommendationPriority.MEDIUM,
      targetTopicIds: fallbackIds.slice(0, 2),
      englishRationale: `Only ${metrics.engagementDays30} active days in last 30. Short sessions needed.`,
    });
  }

  if (canAdvance && decisions.length < maxRecommendations) {
    const advanceIds = candidateTopics
      .filter((t) => !weakIds.includes(t.id))
      .slice(0, 2)
      .map((t) => t.id);
    decisions.push({
      type: RecommendationType.TOPIC_ADVANCE,
      priority: RecommendationPriority.MEDIUM,
      targetTopicIds: advanceIds.length > 0 ? advanceIds : fallbackIds.slice(0, 2),
      englishRationale: `Strong performance (pronunciation ${metrics.pronunciationAvg}%, quiz ${metrics.quizAvg}%). Ready to advance.`,
    });
  }

  if (decisions.length === 0) {
    decisions.push({
      type: RecommendationType.TOPIC_REVIEW,
      priority: RecommendationPriority.MEDIUM,
      targetTopicIds: fallbackIds,
      englishRationale: 'Regular review to maintain learning progress.',
    });
  }

  // Prune targetTopicIds to only known candidates
  return decisions.slice(0, maxRecommendations).map((d) => ({
    ...d,
    targetTopicIds: d.targetTopicIds.filter((id) => topicById.has(id)),
  }));
}

// ─── Prompt builder ──────────────────────────────────────────────────────────

const ALLOWED_TYPES = new Set(Object.values(RecommendationType));
const ALLOWED_PRIORITIES = new Set(Object.values(RecommendationPriority));
const ALLOWED_DIFFICULTY_LEVELS = new Set(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);

/**
 * Build the Gemini prompt.
 * Decisions (type, priority, targetTopicIds) are pre-computed and locked.
 * Gemini's only job: write parent-friendly Vietnamese copy.
 */
export function buildGeminiRecommendationPrompt(
  context: GeminiRecommendationContext,
): string {
  const sanitizedContext = sanitizeContextForPrompt(context);

  const maxPathItems = Math.min(
    Math.max(1, Number(sanitizedContext.constraints?.maxPathItems ?? 3)),
    3,
  );
  const maxRecommendations = Math.min(
    Math.max(1, Number(sanitizedContext.constraints?.maxRecommendations ?? 3)),
    3,
  );

  const decisions =
    sanitizedContext.preComputedDecisions ??
    preComputeDecisions(
      sanitizedContext.recentMetrics,
      sanitizedContext.multimodalSignals,
      sanitizedContext.candidateTopics,
      maxRecommendations,
    );

  const metricEvidence = {
    pronunciationAvg: sanitizedContext.recentMetrics.pronunciationAvg,
    quizAvg: sanitizedContext.recentMetrics.quizAvg,
    engagementDays30: sanitizedContext.recentMetrics.engagementDays30,
    weakTopicNames: sanitizedContext.recentMetrics.weakTopicNames.slice(0, 5),
    strongTopicNames: sanitizedContext.recentMetrics.strongTopicNames.slice(0, 3),
    audio: sanitizedContext.multimodalSignals?.audio,
  };

  return [
    'You are a Vietnamese copy editor for an English learning app for children.',
    'Return ONLY valid JSON. No markdown, no code fences, no explanation.',
    '',
    'TASK: For each pre-decided recommendation below, write parent-friendly Vietnamese copy.',
    'The "type" in each pre-decided item is FIXED — reproduce it exactly in your output.',
    'Do NOT add, remove, or change recommendation types.',
    '',
    'Rules:',
    `- recommendations array length MUST equal ${decisions.length} (one per pre-decided item)`,
    '- title: ≤60 Vietnamese chars, action-oriented, cite the specific weakness or goal',
    '- description: ≤200 Vietnamese chars, cite exact percentages from the metric evidence',
    '- expectedOutcome: measurable result (e.g., "tăng 10% điểm quiz sau 5 buổi")',
    `- learningPath: use ONLY contentIds from the provided targetTopicIds; ≤${maxPathItems} items`,
    '- estimatedMinutes per item: 10..45',
    '- rationale: 1 short Vietnamese sentence per item explaining why',
    '- Keep content child-safe; do NOT invent topic IDs outside targetTopicIds',
    '',
    'Output schema (one object per pre-decided recommendation, in order):',
    JSON.stringify({
      recommendations: [
        {
          type: 'TOPIC_REVIEW',
          title: 'string',
          description: 'string',
          expectedOutcome: 'string',
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
    }),
    '',
    'Pre-decided recommendations (type, priority, targetTopicIds are FIXED):',
    JSON.stringify(decisions),
    '',
    'Available topics (use these for learningPath):',
    JSON.stringify(sanitizedContext.candidateTopics),
    '',
    'Metric evidence (cite exact numbers in descriptions):',
    JSON.stringify(metricEvidence),
  ].join('\n');
}

// ─── Output normalizer ───────────────────────────────────────────────────────

interface NormalizeOptions {
  maxRecommendations?: number;
  maxPathItems?: number;
  allowedTopicIds?: number[];
  /** Pre-computed decisions for anchoring type/priority and fallback path construction */
  decisions?: PreComputedDecision[];
  /** Candidate topics for constructing fallback path items when Gemini omits them */
  candidateTopics?: Array<{
    id: number;
    name: string;
    estimatedMinutes?: number;
    difficulty?: string;
  }>;
}

export function normalizeGeminiRecommendationOutput(
  raw: unknown,
  options: NormalizeOptions = {},
): GeminiRecommendationOutput {
  const parsed = parseModelJson(raw);
  const root = isRecord(parsed) ? parsed : {};
  const geminiList: unknown[] = Array.isArray(root.recommendations)
    ? root.recommendations
    : [];

  const maxRecommendations = Math.min(Math.max(1, Number(options.maxRecommendations ?? 3)), 3);
  const maxPathItems = Math.min(Math.max(1, Number(options.maxPathItems ?? 3)), 3);
  const allowedTopicIds = new Set(options.allowedTopicIds ?? []);
  const topicNameMap = new Map(
    (options.candidateTopics ?? []).map((t) => [t.id, t]),
  );

  if (options.decisions && options.decisions.length > 0) {
    // Decision-anchored path: type/priority are locked; Gemini provides copy only.
    const geminiByType = new Map<string, unknown>();
    for (const item of geminiList) {
      if (isRecord(item) && typeof item.type === 'string') {
        geminiByType.set(item.type, item);
      }
    }

    const recommendations = options.decisions
      .slice(0, maxRecommendations)
      .map((decision) => {
        const geminiItem = geminiByType.get(decision.type) ?? {};
        const rec = isRecord(geminiItem) ? geminiItem : {};

        const learningPath = buildLearningPath(
          rec.learningPath,
          decision.targetTopicIds,
          maxPathItems,
          allowedTopicIds,
          topicNameMap,
        );

        return {
          type: decision.type,
          priority: decision.priority,
          title: safeText(rec.title, 255, fallbackTitle(decision.type)),
          description: safeText(rec.description, 1000, decision.englishRationale),
          expectedOutcome: rec.expectedOutcome
            ? safeText(rec.expectedOutcome, 500, '')
            : undefined,
          scoreBreakdown: defaultScoreBreakdown(decision.priority),
          learningPath,
        };
      });

    return { recommendations };
  }

  // Legacy path: no pre-computed decisions — normalize Gemini output directly.
  const seenTypes = new Set<RecommendationType>();
  const recommendations = geminiList
    .map((r) => normalizeLegacyRecommendation(r, { maxPathItems, allowedTopicIds }))
    .filter((r): r is NonNullable<typeof r> => !!r)
    .filter((r) => {
      if (seenTypes.has(r.type)) return false;
      seenTypes.add(r.type);
      return true;
    })
    .slice(0, maxRecommendations);

  return { recommendations };
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function buildLearningPath(
  geminiPath: unknown,
  targetTopicIds: number[],
  maxPathItems: number,
  allowedTopicIds: Set<number>,
  topicNameMap: Map<number, { id: number; name: string; estimatedMinutes?: number; difficulty?: string }>,
): LearningPathItemDto[] {
  // Try Gemini's path first, anchored to targetTopicIds
  if (Array.isArray(geminiPath) && geminiPath.length > 0) {
    const validIds = new Set(targetTopicIds);
    const seenIds = new Set<number>();
    const items: LearningPathItemDto[] = [];

    for (const item of geminiPath) {
      if (!isRecord(item)) continue;
      const contentId = Math.max(0, Number(item.contentId || 0));
      if (!contentId || seenIds.has(contentId)) continue;
      if (validIds.size > 0 && !validIds.has(contentId)) continue;
      if (allowedTopicIds.size > 0 && !allowedTopicIds.has(contentId)) continue;

      seenIds.add(contentId);
      const meta = topicNameMap.get(contentId);
      const contentName = safeText(
        item.contentName || meta?.name,
        255,
        `Chủ đề ${contentId}`,
      );

      const pathItem: LearningPathItemDto = {
        contentId,
        contentName,
        sequenceOrder: items.length + 1,
        estimatedMinutes: clampNum(
          item.estimatedMinutes,
          10,
          45,
          meta?.estimatedMinutes ?? 20,
        ),
      };

      if (item.difficultyLevel) {
        const dl = safeText(item.difficultyLevel, 50, 'BEGINNER').toUpperCase();
        pathItem.difficultyLevel = ALLOWED_DIFFICULTY_LEVELS.has(dl) ? dl : 'BEGINNER';
      }
      if (item.rationale) {
        pathItem.rationale = safeText(item.rationale, 500, '');
      }

      items.push(pathItem);
      if (items.length >= maxPathItems) break;
    }

    if (items.length > 0) return items;
  }

  // Fallback: construct minimal path from targetTopicIds using candidate metadata
  return targetTopicIds
    .filter((id) => allowedTopicIds.size === 0 || allowedTopicIds.has(id))
    .slice(0, maxPathItems)
    .map((id, idx) => {
      const meta = topicNameMap.get(id);
      return {
        contentId: id,
        contentName: meta?.name ?? `Chủ đề ${id}`,
        sequenceOrder: idx + 1,
        estimatedMinutes: meta?.estimatedMinutes ?? 20,
        difficultyLevel: meta?.difficulty?.toUpperCase() ?? 'BEGINNER',
      };
    });
}

function defaultScoreBreakdown(priority: RecommendationPriority): AIScoreBreakdown {
  const scoreMap: Record<RecommendationPriority, number> = {
    [RecommendationPriority.CRITICAL]: 90,
    [RecommendationPriority.HIGH]: 75,
    [RecommendationPriority.MEDIUM]: 55,
    [RecommendationPriority.LOW]: 35,
  };
  const s = scoreMap[priority] ?? 55;
  return {
    weaknessScore: s,
    vocabularyGapScore: s,
    readinessScore: s,
    engagementScore: s,
    overallScore: s,
  };
}

function fallbackTitle(type: RecommendationType): string {
  const titles: Partial<Record<RecommendationType, string>> = {
    [RecommendationType.PRONUNCIATION_REFINEMENT]: 'Luyện Phát Âm',
    [RecommendationType.TOPIC_REVIEW]: 'Ôn Tập Chủ Đề',
    [RecommendationType.TOPIC_ADVANCE]: 'Tiến Lên Chủ Đề Mới',
    [RecommendationType.WEAKNESS_PRACTICE]: 'Thực Hành Điểm Yếu',
    [RecommendationType.QUIZ_PREPARATION]: 'Chuẩn Bị Bài Quiz',
    [RecommendationType.CONSISTENCY_BOOST]: 'Duy Trì Học Đều Đặn',
    [RecommendationType.VOCABULARY_EXTENSION]: 'Mở Rộng Từ Vựng',
    [RecommendationType.SPEED_CHALLENGE]: 'Thử Thách Tốc Độ',
  };
  return titles[type] ?? 'Gợi Ý Học Tập';
}

/** Legacy normalizer — used when no pre-computed decisions are available */
function normalizeLegacyRecommendation(
  item: unknown,
  options: { maxPathItems: number; allowedTopicIds: Set<number> },
) {
  if (!isRecord(item)) return null;

  const type = String(item.type || 'TOPIC_REVIEW') as RecommendationType;
  const priority = String(item.priority || 'MEDIUM') as RecommendationPriority;

  if (!ALLOWED_TYPES.has(type)) return null;
  if (!ALLOWED_PRIORITIES.has(priority)) return null;

  const learningPath = normalizeLearningPathLegacy(
    item.learningPath,
    options.maxPathItems,
    options.allowedTopicIds,
  );

  if (learningPath.length === 0) return null;

  return {
    type,
    priority,
    title: safeText(item.title, 255, fallbackTitle(type)),
    description: safeText(
      item.description,
      1000,
      'Đề xuất lộ trình học phù hợp với tình trạng hiện tại của bé.',
    ),
    expectedOutcome: item.expectedOutcome
      ? safeText(item.expectedOutcome, 500, '')
      : undefined,
    scoreBreakdown: normalizeScoreBreakdown(item.scoreBreakdown),
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

function normalizeLearningPathLegacy(
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
      if (allowedTopicIds.size > 0 && !allowedTopicIds.has(contentId)) return null;
      if (seenContentIds.has(contentId)) return null;
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
        const dl = safeText(item.difficultyLevel, 50, 'BEGINNER').toUpperCase();
        pathItem.difficultyLevel = ALLOWED_DIFFICULTY_LEVELS.has(dl) ? dl : 'BEGINNER';
      }
      if (item.rationale) {
        pathItem.rationale = safeText(item.rationale, 500, '');
      }

      return pathItem;
    })
    .filter((x): x is LearningPathItemDto => x !== null)
    .slice(0, maxPathItems);

  return normalized.map((item, index) => ({ ...item, sequenceOrder: index + 1 }));
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
    geminiLogger.warn(
      'Failed to parse model JSON output',
      JSON.stringify({
        message: error instanceof Error ? error.message : 'Unknown parse error',
        preview,
      }),
    );
    return {};
  }
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

  const candidateTopics = (
    Array.isArray(context.candidateTopics) ? context.candidateTopics : []
  )
    .slice(0, 25)
    .map((topic) => ({
      id: Number(topic.id) || 0,
      name: sanitizePromptText(topic.name, 120),
      estimatedMinutes: Number(topic.estimatedMinutes) || 20,
      difficulty: topic.difficulty
        ? sanitizePromptText(topic.difficulty, 30)
        : undefined,
    }))
    .filter((topic) => topic.id > 0 && topic.name.length > 0);

  return {
    ...context,
    age: Number(context.age) || undefined,
    timezone: context.timezone
      ? sanitizePromptText(context.timezone, 60)
      : undefined,
    recentMetrics: {
      ...context.recentMetrics,
      weakTopicIds: sanitizeNumberArray(context.recentMetrics.weakTopicIds || [], 25),
      weakTopicNames: sanitizeStringArray(
        context.recentMetrics.weakTopicNames || [],
        20,
        120,
      ),
      strongTopicNames: sanitizeStringArray(
        context.recentMetrics.strongTopicNames || [],
        20,
        120,
      ),
    },
    candidateTopics,
    constraints: {
      maxRecommendations: Math.min(
        Math.max(1, Number(context.constraints?.maxRecommendations ?? 3)),
        3,
      ),
      maxPathItems: Math.min(
        Math.max(1, Number(context.constraints?.maxPathItems ?? 3)),
        3,
      ),
      maxMinutesPerPath: Math.min(
        Math.max(30, Number(context.constraints?.maxMinutesPerPath ?? 120)),
        180,
      ),
    },
  };
}

function sanitizePromptText(value: unknown, maxLen: number): string {
  const input = String(value ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const withoutInjection = input
    .replace(/ignore\s+previous\s+instructions?/gi, '')
    .replace(/system\s+prompt/gi, '')
    .replace(/developer\s+message/gi, '')
    .trim();

  return withoutInjection.slice(0, maxLen);
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
