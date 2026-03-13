'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { apiClient as axiosInstance } from '@/shared/services/api.client';
import { setTopicModeProgressChildScope } from '@/features/learning/utils/topic-mode-progress';
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

const EMPTY_PROFILE_LIST: ProfileListDto = {
    profiles: [],
    totalCount: 0,
    maxProfiles: 5,
    activeProfileId: null,
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
                    // Don't use mock data - show error state so user knows API failed
                    setData(EMPTY_PROFILE_LIST);
                    setError('Không thể tải hồ sơ bé từ máy chủ. Vui lòng kiểm tra kết nối và thử lại.');
                }
            } else {
                // Don't use mock data - show error state so user knows API failed
                setData(EMPTY_PROFILE_LIST);
                setError('Không thể tải hồ sơ bé. Vui lòng kiểm tra kết nối và thử lại.');
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
            
            // CRITICAL: Set role=LEARNER so middleware can validate child routes
            document.cookie = `role=LEARNER; path=/; max-age=${15 * 60}`; // 15 min, same as access_token

            setTopicModeProgressChildScope(switchedProfileId);

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

export function useChildAnalytics(
    childId: number,
    period: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR' | 'ALL' = 'WEEK',
) {
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
                `analytics/overview?childId=${childId}&period=${period}`,
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
                    // Don't use mock data - show error state
                    setData(null);
                    setError('Không thể tải analytics từ máy chủ. Vui lòng kiểm tra kết nối và thử lại.');
                }
            } else {
                // Don't use mock data - show error state
                setData(null);
                setError('Không thể tải analytics. Vui lòng kiểm tra kết nối và thử lại.');
            }
        } finally {
            setLoading(false);
        }
    }, [childId, period]);

    useEffect(() => {
        void loadAnalytics();
    }, [loadAnalytics]);

    return { analytics: data, loading, error, refetch: loadAnalytics };
}

// Convenience: get just the learning time chart data
export function useLearningTime(childId: number): { data: LearningTimeAnalytics | null } {
    const { analytics } = useChildAnalytics(childId);
    return { data: analytics?.learningTime ?? null };
}
