import { useState, useEffect } from 'react';
import { getActiveProfile, ChildProfileWithStats } from '@/features/profile/api/profile.api';

export interface ChildProfile {
    id: number;
    nickname: string;
    avatarUrl: string;
    rewards: {
        streakDays: number;
        totalPoints: number;
        currentLevel: number;
    };
    hp?: number;
}

/**
 * Hook to get current active child profile
 * Fetches from /api/v1/profiles/active/current
 */
export function useCurrentChild(): { child: ChildProfileWithStats | null; loading: boolean; error: string | null } {
    const [child, setChild] = useState<ChildProfileWithStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchActiveProfile = async () => {
            try {
                setLoading(true);
                setError(null);
                const profile = await getActiveProfile();
                
                if (!profile) {
                    setError('Chưa chọn hồ sơ bé. Vui lòng chọn hồ sơ từ trang chính.');
                } else {
                    setChild(profile);
                }
            } catch (err: unknown) {
                console.error('Error fetching active child profile:', err);
                setError(err instanceof Error ? err.message : 'Không thể tải thông tin hồ sơ bé');
            } finally {
                setLoading(false);
            }
        };

        fetchActiveProfile();
    }, []);

    return { child, loading, error };
}
