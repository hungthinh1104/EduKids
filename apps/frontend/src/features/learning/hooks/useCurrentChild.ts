import { useState, useEffect } from 'react';
import { getActiveProfile, ChildProfileWithStats } from '@/features/profile/api/profile.api';
import { DEFAULT_CHILD_AVATAR } from '@/features/profile/utils/avatar-sync';

export interface ChildProfile {
    id: number;
    nickname: string;
    avatar: string;
    rewards: {
        streakDays: number;
        totalPoints: number;
        currentLevel: number;
    };
    hp?: number;
}

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
                    setChild({
                        ...profile,
                        avatar: profile.avatar || DEFAULT_CHILD_AVATAR,
                    });
                }
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Không thể tải thông tin hồ sơ bé');
            } finally {
                setLoading(false);
            }
        };

        fetchActiveProfile();
    }, []);

    return { child, loading, error };
}
