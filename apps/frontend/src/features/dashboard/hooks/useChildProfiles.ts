'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { apiClient as axiosInstance } from '@/shared/services/api.client';
import type { ApiEnvelope } from '@/features/auth/types';
import type {
    ChildProfile,
    SwitchChildProfileRequest,
    ProfileActionResultDto,
    ProfileListDto,
    LearningTimeAnalytics,
    AnalyticsOverview,
    NoDataResponse,
} from '@/features/profile/types/child-profile.types';

// ─────────────────────────────────────────────────────────
// Mock data — field names verified against:
// GET /api/profiles         → ProfileListDto
// GET /api/analytics/overview?childId=X → AnalyticsOverviewDto
// ─────────────────────────────────────────────────────────

const MOCK_PROFILE_LIST: ProfileListDto = {
    profiles: [
        {
            id: 1,
            nickname: 'Bé Bông',
            age: 7,
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=bong',
            totalPoints: 1250,
            currentLevel: 5,
            badgesEarned: 4,
            streakDays: 12,        // ← streakDays (from BE DTO, not streakCount)
            isActive: true,
            createdAt: '2026-01-01T00:00:00Z',
            lastActivityAt: new Date().toISOString(),
        },
        {
            id: 2,
            nickname: 'Bé Chip',
            age: 9,
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=chip',
            totalPoints: 3400,
            currentLevel: 12,
            badgesEarned: 9,
            streakDays: 7,
            isActive: false,
            createdAt: '2026-01-15T00:00:00Z',
            lastActivityAt: new Date(Date.now() - 86400000).toISOString(),
        },
    ],
    totalCount: 2,
    maxProfiles: 5,
    activeProfileId: 1,
};

const EMPTY_PROFILE_LIST: ProfileListDto = {
    profiles: [],
    totalCount: 0,
    maxProfiles: 5,
    activeProfileId: null,
};

// Matches: AnalyticsOverviewDto from /api/analytics/overview
const MOCK_ANALYTICS: Record<number, AnalyticsOverview> = {
    1: {
        childId: 1,
        childNickname: 'Bé Bông',
        period: 'WEEK',
        hasData: true,
        insightMessage: 'Bé Bông học rất chăm chỉ tuần này! 🌟',
        generatedAt: new Date().toISOString(),
        learningTime: {
            totalMinutes: 132,
            averageSessionMinutes: 22,
            totalSessions: 6,
            daysActive: 6,
            currentStreak: 12,
            chartData: [
                { date: '2026-03-02', value: 15, label: 'CN' },
                { date: '2026-03-03', value: 22, label: 'T2' },
                { date: '2026-03-04', value: 10, label: 'T3' },
                { date: '2026-03-05', value: 30, label: 'T4' },
                { date: '2026-03-06', value: 18, label: 'T5' },
                { date: '2026-03-07', value: 25, label: 'T6' },
                { date: '2026-03-08', value: 12, label: 'T7' },
            ],
        },
        vocabulary: {
            totalWordsEncountered: 75,
            wordsMastered: 48,
            retentionRate: 64,
            wordsReviewed: 124,
            chartData: [],
            wordsByLevel: { mastered: 48, learning: 18, new: 9 },
        },
        pronunciation: {
            averageAccuracy: 82,
            totalPractices: 38,
            highAccuracyCount: 28,
            challengingSoundsCount: 3,
            chartData: [],
            mostImprovedWords: [{ word: 'Apple', improvement: 25 }],
            wordsNeedingPractice: [{ word: 'Three', accuracy: 58 }],
        },
        quizPerformance: {
            totalQuizzes: 8,
            averageScore: 78,
            highestScore: 100,
            quizzesPassed: 6,
            chartData: [],
            scoresByDifficulty: { easy: 95, medium: 80, hard: 65 },
        },
        gamification: {
            totalPoints: 1250,
            currentLevel: 5,
            badgesEarned: 4,
            totalBadges: 12,
            itemsPurchased: 2,
            chartData: [],
            recentBadges: [{ name: 'Streak 7 ngày', earnedAt: '2026-03-05T00:00:00Z' }],
        },
    },
};

const buildEmptyAnalytics = (
    childId: number,
    childNickname: string,
    insightMessage: string,
): AnalyticsOverview => ({
    childId,
    childNickname,
    period: 'WEEK',
    hasData: false,
    insightMessage,
    generatedAt: new Date().toISOString(),
    learningTime: {
        totalMinutes: 0,
        averageSessionMinutes: 0,
        totalSessions: 0,
        daysActive: 0,
        currentStreak: 0,
        chartData: [],
    },
    vocabulary: {
        totalWordsEncountered: 0,
        wordsMastered: 0,
        retentionRate: 0,
        wordsReviewed: 0,
        chartData: [],
        wordsByLevel: { mastered: 0, learning: 0, new: 0 },
    },
    pronunciation: {
        averageAccuracy: 0,
        totalPractices: 0,
        highAccuracyCount: 0,
        challengingSoundsCount: 0,
        chartData: [],
        mostImprovedWords: [],
        wordsNeedingPractice: [],
    },
    quizPerformance: {
        totalQuizzes: 0,
        averageScore: 0,
        highestScore: 0,
        quizzesPassed: 0,
        chartData: [],
        scoresByDifficulty: { easy: 0, medium: 0, hard: 0 },
    },
    gamification: {
        totalPoints: 0,
        currentLevel: 1,
        badgesEarned: 0,
        totalBadges: 0,
        itemsPurchased: 0,
        chartData: [],
        recentBadges: [],
    },
});

// ─────────────────────────────────────────────────────────
// Hooks — shape matches real API contract
// Swap useState → useSWR('/profiles') when BE is ready
// ─────────────────────────────────────────────────────────

export function useChildProfiles() {
    const [data, setData] = useState<ProfileListDto>(EMPTY_PROFILE_LIST);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadProfiles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get<ApiEnvelope<ProfileListDto>>('profiles');
            const payload = response.data.data;

            const normalizedProfiles: ChildProfile[] = (payload.profiles ?? []).map((profile) => {
                const source = profile as Partial<ChildProfile> & {
                    avatarUrl?: string;
                    totalStars?: number;
                    level?: number;
                };

                return {
                    id: Number(source.id ?? 0),
                    nickname: source.nickname ?? 'Bé yêu',
                    age: Number(source.age ?? 6),
                    avatar: source.avatar ?? source.avatarUrl ?? 'https://api.dicebear.com/7.x/bottts/svg?seed=child',
                    totalPoints: Number(source.totalPoints ?? source.totalStars ?? 0),
                    currentLevel: Number(source.currentLevel ?? source.level ?? 1),
                    badgesEarned: Number(source.badgesEarned ?? 0),
                    streakDays: Number(source.streakDays ?? 0),
                    isActive: Boolean(source.isActive),
                    createdAt: source.createdAt ?? new Date().toISOString(),
                    lastActivityAt: source.lastActivityAt ?? new Date().toISOString(),
                };
            });

            setData({
                profiles: normalizedProfiles,
                totalCount: Number(payload.totalCount ?? normalizedProfiles.length),
                maxProfiles: Number(payload.maxProfiles ?? 5),
                activeProfileId: payload.activeProfileId ?? normalizedProfiles[0]?.id ?? null,
            });
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const status = err.response?.status;
                if (status === 401) {
                    setData(EMPTY_PROFILE_LIST);
                    setError('Bạn cần đăng nhập để tải danh sách hồ sơ bé.');
                } else if (status === 403) {
                    setData(EMPTY_PROFILE_LIST);
                    setError('Bạn không có quyền truy cập hồ sơ bé.');
                } else {
                    setData(MOCK_PROFILE_LIST);
                    setError('Không thể tải hồ sơ bé từ máy chủ. Đang hiển thị dữ liệu mẫu.');
                }
            } else {
                setData(MOCK_PROFILE_LIST);
                setError('Không thể tải hồ sơ bé. Đang hiển thị dữ liệu mẫu.');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadProfiles();
    }, [loadProfiles]);

    const switchActiveProfile = useCallback(async (childId: number) => {
        try {
            const response = await axiosInstance.post<ApiEnvelope<ProfileActionResultDto>, { data: ApiEnvelope<ProfileActionResultDto> }, SwitchChildProfileRequest>(
                'profiles/switch',
                { childId },
            );

            const result = response.data.data as ProfileActionResultDto & {
                accessToken?: string;
                refreshToken?: string;
            };
            const switchedProfileId = result.profile.id;

            // Store new JWT tokens with LEARNER role (matching api.client.ts cookie names)
            if (result.accessToken) {
                document.cookie = `access_token=${result.accessToken}; path=/; max-age=${15 * 60}`; // 15 min
            }
            if (result.refreshToken) {
                document.cookie = `refresh_token=${result.refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days
            }

            setData((prev) => ({
                ...prev,
                activeProfileId: switchedProfileId,
                profiles: prev.profiles.map((profile) => ({
                    ...profile,
                    isActive: profile.id === switchedProfileId,
                })),
            }));

            return true;
        } catch {
            return false;
        }
    }, []);

    return {
        ...data,
        loading,
        error,
        refetch: loadProfiles,
        switchActiveProfile,
    }; // spreads: profiles, totalCount, maxProfiles, activeProfileId
}

export function useChildAnalytics(childId: number) {
    const [data, setData] = useState<AnalyticsOverview | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadAnalytics = useCallback(async () => {
        if (!childId) {
            setData(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axiosInstance.get<ApiEnvelope<AnalyticsOverview | NoDataResponse>>(
                `analytics/overview?childId=${childId}`,
            );
            const payload = response.data.data;

            if ('message' in payload && payload.hasData === false) {
                setData(
                    buildEmptyAnalytics(
                        payload.childId,
                        payload.childNickname,
                        payload.message,
                    ),
                );
            } else {
                setData(payload as AnalyticsOverview);
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const status = err.response?.status;
                if (status === 404) {
                    setData(
                        buildEmptyAnalytics(
                            childId,
                            `Bé #${childId}`,
                            'Chưa có dữ liệu học tập cho bé này.',
                        ),
                    );
                    setError('Không tìm thấy dữ liệu analytics của bé.');
                } else if (status === 403) {
                    setData(null);
                    setError('Bạn không có quyền xem analytics của bé này.');
                } else if (status === 401) {
                    setData(null);
                    setError('Bạn cần đăng nhập để xem analytics.');
                } else {
                    setData(MOCK_ANALYTICS[childId] ?? null);
                    setError('Không thể tải analytics từ máy chủ. Đang hiển thị dữ liệu mẫu.');
                }
            } else {
                setData(MOCK_ANALYTICS[childId] ?? null);
                setError('Không thể tải analytics. Đang hiển thị dữ liệu mẫu.');
            }
        } finally {
            setLoading(false);
        }
    }, [childId]);

    useEffect(() => {
        void loadAnalytics();
    }, [loadAnalytics]);

    return { analytics: data, loading, error, refetch: loadAnalytics };
}

// Convenience: get just the learning time chart data
export function useLearningTime(childId: number): { data: LearningTimeAnalytics | null } {
    const analytics = MOCK_ANALYTICS[childId];
    return { data: analytics?.learningTime ?? null };
}
