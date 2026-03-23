// ===========================================================
// Shared parent-dashboard types aligned with active backend DTOs.
// Source references:
// - apps/backend/src/modules/child-profile/child-profile.dto.ts
// - apps/backend/src/modules/gamification/dto/gamification.dto.ts
// - apps/backend/src/modules/analytics/analytics.dto.ts
// - apps/backend/src/modules/content/dto/topic.dto.ts
//
// Child app shop/avatar screens use:
// - apps/frontend/src/features/learning/api/gamification.api.ts
// ===========================================================

// ── Child Profile ───────────────────────────────────────────
// Matches: ChildProfileDto
export interface ChildProfile {
    id: number;
    nickname: string;
    age: number;
    avatar: string;           // Full URL e.g. https://cdn.edukids.com/avatars/child-1.png
    totalPoints: number;
    currentLevel: number;
    badgesEarned: number;
    streakDays: number;       // NOT streakCount — matches BE DTO
    isActive: boolean;
    createdAt: string;        // ISO date string
    lastActivityAt: string;   // ISO date string
}

// Matches: ProfileListDto
export interface ProfileListDto {
    profiles: ChildProfile[];
    totalCount: number;
    maxProfiles: number;      // Max allowed (5)
    activeProfileId: number | null;
}

export interface CreateChildProfileRequest {
    nickname: string;
    age: number;
    avatarUrl?: string;
}

export interface SwitchChildProfileRequest {
    childId: number;
}

export interface ProfileActionResultDto {
    success: boolean;
    message: string;
    profile: ChildProfile;
}

// ── Gamification ────────────────────────────────────────────
// Matches: BadgeCategory enum
export type BadgeCategory = 'PRONUNCIATION' | 'QUIZ' | 'FLASHCARD' | 'STREAK' | 'MILESTONE';

// Matches: BadgeDto
export interface Badge {
    id: number;
    name: string;
    description: string;
    category: BadgeCategory;
    icon: string;             // emoji/URL from BE (e.g. "🏅")
    isEarned: boolean;
    progress?: number;
    requirement?: number;
    earnedAt?: string;        // ISO date string
}

// Matches: RewardSummaryDto
export interface RewardSummary {
    totalPoints: number;
    currentLevel: number;
    levelProgress: number;    // % to next level
    pointsToNextLevel: number;
    badgesEarned: number;
    totalBadges: number;
    streakDays: number;
    recentBadges: Badge[];
}

// ── Analytics ───────────────────────────────────────────────
// Matches: ChartDataPointDto
export interface ChartDataPoint {
    date: string;
    value: number;
    label: string;            // Human-readable label
}

// Matches: LearningTimeDto
export interface LearningTimeAnalytics {
    totalMinutes: number;
    averageSessionMinutes: number;
    totalSessions: number;
    daysActive: number;
    currentStreak: number;
    chartData: ChartDataPoint[];
}

// Matches: VocabularyRetentionDto
export interface VocabularyRetentionAnalytics {
    totalWordsEncountered: number;
    wordsMastered: number;
    retentionRate: number;    // %
    wordsReviewed: number;
    chartData: ChartDataPoint[];
    wordsByLevel: { mastered: number; learning: number; new: number };
}

// Matches: PronunciationAccuracyDto
export interface PronunciationAnalytics {
    averageAccuracy: number;
    totalPractices: number;
    highAccuracyCount: number;
    challengingSoundsCount: number;
    chartData: ChartDataPoint[];
    mostImprovedWords: Array<{ word: string; improvement: number }>;
    wordsNeedingPractice: Array<{ word: string; accuracy: number }>;
}

// Matches: QuizPerformanceDto
export interface QuizPerformanceAnalytics {
    totalQuizzes: number;
    averageScore: number;
    highestScore: number;
    quizzesPassed: number;
    chartData: ChartDataPoint[];
    scoresByDifficulty: { easy: number; medium: number; hard: number };
}

// Matches: GamificationProgressDto
export interface GamificationAnalytics {
    totalPoints: number;
    currentLevel: number;
    badgesEarned: number;
    totalBadges: number;
    itemsPurchased: number;
    chartData: ChartDataPoint[];
    recentBadges: Array<{ name: string; earnedAt: string }>;
}

// Matches: AnalyticsOverviewDto
export interface AnalyticsOverview {
    childId: number;
    childNickname: string;
    period: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR' | 'ALL';
    learningTime: LearningTimeAnalytics;
    vocabulary: VocabularyRetentionAnalytics;
    pronunciation: PronunciationAnalytics;
    quizPerformance: QuizPerformanceAnalytics;
    gamification: GamificationAnalytics;
    generatedAt: string;
    hasData: boolean;
    insightMessage: string;
}

// Matches: NoDataResponseDto
export interface NoDataResponse {
    hasData: false;
    message: string;
    childId: number;
    childNickname: string;
}

// ── Content ─────────────────────────────────────────────────
// Matches: TopicDto (content/dto/topic.dto.ts)
export interface Topic {
    id: number;
    name: string;
    description: string | null;
    imageUrl: string;
    vocabularyCount: number;
}

// Matches: TopicDetailResponseDto (includes progress for LEARNER)
export interface TopicDetail extends Topic {
    vocabularies: VocabularyCard[];
    progress: {
        completed: number;
        total: number;
        starsEarned: number;  // 0-3
    };
}

export interface VocabularyCard {
    id: number;
    word: string;
    phonetic: string;
    translation: string;
    imageUrl: string;
    audioUrl: string;
    exampleSentence: string;
}
