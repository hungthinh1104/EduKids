import { useState, useEffect, useRef } from 'react';
import { getActiveProfile, ChildProfileWithStats } from '@/features/profile/api/profile.api';
import { gamificationApi } from '@/features/learning/api/gamification.api';
import { resolveChildAvatarUrl } from '@/features/profile/utils/avatar-sync';

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

/**
 * Hook to get current active child profile
 * Fetches from /api/profiles/active/current
 */
export function useCurrentChild(): { child: ChildProfileWithStats | null; loading: boolean; error: string | null } {
    const [child, setChild] = useState<ChildProfileWithStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const childIdRef = useRef<number | null>(null);

    useEffect(() => {
        const fetchActiveProfile = async () => {
            try {
                setLoading(true);
                setError(null);
                const profile = await getActiveProfile();
                
                if (!profile) {
                    setError('Chưa chọn hồ sơ bé. Vui lòng chọn hồ sơ từ trang chính.');
                } else {
                    let customizationAvatarUrl: string | null = null;

                    try {
                        const customization = await gamificationApi.getAvatarCustomization(profile.id);
                        customizationAvatarUrl = customization.avatar?.trim() || null;
                    } catch {
                        // Fallback to active profile avatar if customization API is unavailable
                    }

                    const syncedAvatarUrl = resolveChildAvatarUrl(profile, {
                        avatar: customizationAvatarUrl,
                    }, profile.avatar);

                    setChild({
                        ...profile,
                        avatar: syncedAvatarUrl,
                    });
                    childIdRef.current = profile.id;
                }
            } catch (err: unknown) {
                console.error('Error fetching active child profile:', err);
                setError(err instanceof Error ? err.message : 'Không thể tải thông tin hồ sơ bé');
            } finally {
                setLoading(false);
            }
        };

        const onAvatarUpdate = (event: Event) => {
            const customEvent = event as CustomEvent<{ avatar?: string; childId?: number }>;
            const nextAvatar = customEvent.detail?.avatar;
            const targetChildId = customEvent.detail?.childId;

            if (targetChildId != null && targetChildId !== childIdRef.current) {
                return;
            }

            if (!nextAvatar) {
                return;
            }

            setChild((prev) => {
                if (!prev) {
                    return prev;
                }
                return {
                    ...prev,
                    avatar: nextAvatar,
                };
            });
        };

        fetchActiveProfile();
        window.addEventListener('edukids-avatar-updated', onAvatarUpdate as EventListener);

        return () => {
            window.removeEventListener('edukids-avatar-updated', onAvatarUpdate as EventListener);
        };
    }, []);

    return { child, loading, error };
}
