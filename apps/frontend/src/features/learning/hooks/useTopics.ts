'use client';

import { useState, useEffect } from 'react';
import { contentApi, Topic } from '../api/content.api';

// Matches: TopicDto (content/dto/topic.dto.ts)
// + learning progress from GET /api/content/topics/:id (LEARNER only)
export interface TopicWithProgress {
    id: number;
    name: string;
    description?: string;
    vocabularyCount: number;
    createdAt: string;
    // FE-computed from LearningProgress records:
    completedCount: number;   // words with accuracy >= 80%
    starsEarned: number;      // 0-3
    isLocked: boolean;        // FE logic: previous topic not completed
    isCurrent: boolean;       // FE logic: first incomplete topic
    // UI helper (not from BE — FE assigns per topic)
    icon: string;             // emoji placeholder until BE provides imageUrl
    colorKey: string;         // color token name — purely FE
    hasVideo: boolean;
}

// ── Topics shape verified against Prisma schema:
// Topic { id, name, description?, imageUrl?, createdAt }
// LearningProgress { childId, vocabularyId, masteryLevel, accuracy }
// ─────────────────────────────────────────────────────────
// NOTE: `icon` and `colorKey` are FE-only helpers until
// real imageUrl comes from BE (GET /api/content/topics)
// ─────────────────────────────────────────────────────────
const ICON_MAP: Record<string, string> = {
    'Động vật': '🦁',
    'Animals': '🦁',
    'Màu sắc': '🎨',
    'Colors': '🎨',
    'Số đếm': '🔢',
    'Numbers': '🔢',
    'Cơ thể người': '🫀',
    'Body parts': '🫀',
    'Thức ăn': '🍎',
    'Food': '🍎',
    'Gia đình': '👨‍👩‍👧',
    'Family': '👨‍👩‍👧',
    'Đồ vật': '🏠',
    'Objects': '🏠',
    'Cảm xúc': '😊',
    'Emotions': '😊',
};

const COLOR_KEYS = ['success', 'accent', 'primary', 'secondary', 'warning'];

export function useTopics(childId: number) {
    const [loading, setLoading] = useState(true);
    const [topics, setTopics] = useState<TopicWithProgress[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchTopics() {
            try {
                setLoading(true);
                setError(null);

                // Fetch topics from backend
                const backendTopics: Topic[] = await contentApi.getTopics();
                // Transform backend topics to TopicWithProgress
                const transformedTopics: TopicWithProgress[] = backendTopics.map((topic, index) => {
                    const total = topic.vocabularyCount || 0;
                    const completed = topic.completedCount ?? topic.progress?.completed ?? 0;
                    const stars = topic.starsEarned ?? topic.progress?.starsEarned ?? 0;
                    const icon = ICON_MAP[topic.name] || ICON_MAP[topic.description || ''] || '📚';
                    const colorKey = COLOR_KEYS[index % COLOR_KEYS.length];

                    return {
                        id: topic.id,
                        name: topic.name,
                        description: topic.description || undefined,
                        vocabularyCount: total,
                        createdAt: topic.createdAt,
                        completedCount: completed,
                        starsEarned: stars,
                        isLocked: false, // Will be computed below
                        isCurrent: false, // Will be computed below
                        icon,
                        colorKey,
                        hasVideo: topic.hasVideo ?? Boolean(topic.videoUrl),
                    };
                });

                // Lock/current logic: a topic is locked if the previous topic
                // has < 50% completion
                const topicsWithLocks = transformedTopics.map((t, i) => {
                    const prevComplete = i === 0 ? true : transformedTopics[i - 1].completedCount >= transformedTopics[i - 1].vocabularyCount * 0.5;
                    return {
                        ...t,
                        isLocked: !prevComplete,
                        isCurrent: prevComplete && t.completedCount < t.vocabularyCount,
                    };
                });

                // Mark only the first qualifying topic as isCurrent
                const firstCurrentIndex = topicsWithLocks.findIndex((topic) => topic.isCurrent);
                const finalTopics = topicsWithLocks.map((topic, index) => ({
                    ...topic,
                    isCurrent: firstCurrentIndex !== -1 && index === firstCurrentIndex,
                }));

                setTopics(finalTopics);
            } catch (err) {
                console.error('Failed to fetch topics:', err);
                setError(err instanceof Error ? err.message : 'Failed to load topics');
                setTopics([]);
            } finally {
                setLoading(false);
            }
        }

        void fetchTopics();
    }, [childId]);

    return { topics, loading, error };
}
