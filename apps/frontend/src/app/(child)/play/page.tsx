'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { RefreshCw, Flame } from 'lucide-react';
import { Heading, Caption } from '@/shared/components/Typography';
import { GameHUD } from '@/features/learning/components/GameHUD';
import { BottomNav } from '@/features/learning/components/BottomNav';
import { XPProgressBar } from '@/features/learning/components/XPProgressBar';
import { TopicNode } from '@/features/learning/components/TopicNode';
import { useTopics } from '@/features/learning/hooks/useTopics';
import { useCurrentChild } from '@/features/learning/hooks/useCurrentChild';
import { LoadingScreen } from '@/components/edukids/LoadingScreen';
import { apiClient } from '@/shared/services/api.client';

// ── Play Page (Learning Map) ───────────────────────────────────────────────
export default function PlayPage() {
    const { child, loading: childLoading, error: childError } = useCurrentChild();
    const { topics } = useTopics(child?.id ?? 0);
    const [dueReviews, setDueReviews] = useState(0);

    useEffect(() => {
        if (!child?.id) return;
        apiClient.get(`/vocabulary/review/progress?childId=${child.id}`)
            .then(res => setDueReviews(res.data?.data?.dueToday ?? 0))
            .catch(() => setDueReviews(0));
    }, [child?.id]);

    if (childLoading) {
        return <LoadingScreen />
    }

    // No active profile selected
    if (childError || !child) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="max-w-md text-center">
                    <div className="text-6xl mb-6">👶</div>
                    <Heading level={2} className="text-heading mb-3">
                        Chưa chọn hồ sơ bé
                    </Heading>
                    <Caption className="text-caption mb-8">
                        {childError || 'Vui lòng chọn hồ sơ bé để bắt đầu học tập'}
                    </Caption>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-heading font-bold hover:bg-primary-hover transition-colors"
                    >
                        Quay về trang chính
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20 md:pb-8">
            <GameHUD
                nickname={child.nickname}
                avatarUrl={child.avatarUrl}
                rewards={child.rewards}
                hp={child.hp || 5}
                activeNav="map"
            />

            {/* Page header */}
            <div className="max-w-lg md:max-w-4xl lg:max-w-7xl mx-auto px-4 md:px-6 pt-8 pb-4 text-center">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <Heading level={2} className="text-heading text-2xl mb-1">Hành trình học tập 🗺️</Heading>
                    <Caption className="text-caption text-sm">Chinh phục từng chặng để lên level!</Caption>
                </motion.div>

                {/* XP progress */}
                <div className="mt-4">
                    <XPProgressBar
                        currentLevel={child.rewards.currentLevel}
                        currentPoints={child.rewards.totalPoints}
                    />
                </div>

                {/* Daily Streak Banner */}
                {(child.rewards.streakDays ?? 0) > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-3 flex items-center gap-3 bg-warning-light border-2 border-warning/40 rounded-2xl px-4 py-2.5"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <Flame size={20} className="text-warning fill-warning" />
                        </motion.div>
                        <span className="font-heading font-black text-warning text-sm">
                            {child.rewards.streakDays} ngày streak liên tục! 🔥
                        </span>
                    </motion.div>
                )}

                {/* Review due banner (UC-16) */}
                {dueReviews > 0 && (
                    <Link href="/play/review">
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="mt-3 flex items-center gap-3 bg-secondary-light/80 border-2 border-secondary/50 rounded-2xl px-4 py-2.5 cursor-pointer relative overflow-hidden ring-4 ring-secondary/20 shadow-[0_0_15px_rgba(0,0,0,0.1)] custom-glow-pulse"
                        >
                            {/* Inner absolute glow */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                animate={{ x: ['-200%', '200%'] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            />
                            <RefreshCw size={16} className="text-secondary shrink-0 animate-spin [animation-duration:3s]" />
                            <div className="flex-1 text-left">
                                <span className="font-heading font-black text-secondary text-sm">
                                    {dueReviews} từ cần ôn hôm nay
                                </span>
                                <Caption className="text-caption text-xs block">Chỉ 5 phút — đừng để quên nhé!</Caption>
                            </div>
                            <span className="text-secondary text-xs font-bold">→</span>
                        </motion.div>
                    </Link>
                )}
            </div>

            {/* Learning Map (winding path) */}
            <div className="max-w-lg md:max-w-4xl lg:max-w-7xl mx-auto px-6 md:px-8 py-4 relative">
                {/* SVG Animated vertical connector */}
                <div className="absolute left-1/2 -translate-x-1/2 top-4 bottom-24 w-4 -z-0 flex justify-center">
                    <svg className="h-full w-1" preserveAspectRatio="none">
                        <motion.line
                            x1="50%" y1="0" x2="50%" y2="100%"
                            stroke="currentColor" strokeWidth="4" strokeDasharray="10 10" strokeLinecap="round"
                            className="text-border/80 dark:text-border-dark/80"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                        />
                    </svg>
                </div>

                <div className="relative z-10 space-y-8">
                    {topics.map((topic, i) => (
                        <TopicNode
                            key={topic.id}
                            id={topic.id}
                            name={topic.name}
                            icon={topic.icon}
                            color={topic.colorKey}
                            starsEarned={topic.starsEarned}
                            completed={topic.completedCount}
                            total={topic.vocabularyCount}
                            locked={topic.isLocked}
                            isCurrent={topic.isCurrent}
                            index={i}
                        />
                    ))}

                    {/* End of content */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="flex flex-col items-center gap-3 pt-4"
                    >
                        <div className="w-20 h-20 rounded-full bg-warning-light border-4 border-dashed border-warning flex items-center justify-center text-4xl animate-pulse">
                            🌟
                        </div>
                        <Heading level={4} className="text-heading text-base text-center mt-3">Nội dung mới sắp ra mắt!</Heading>
                        <Caption className="text-caption text-xs text-center">Hoàn thành các chủ đề trên để mở khóa</Caption>
                    </motion.div>
                </div>
            </div>

            <BottomNav active="map" />
        </div>
    );
}
