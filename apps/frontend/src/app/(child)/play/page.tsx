'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { RefreshCw, Flame } from 'lucide-react';
import { Heading, Caption } from '@/shared/components/Typography';
import { GameHUD } from '@/features/learning/components/GameHUD';
import { BottomNav } from '@/features/learning/components/BottomNav';
import { XPProgressBar } from '@/features/learning/components/XPProgressBar';
import { TopicNode } from '@/features/learning/components/TopicNode';
import { useTopics } from '@/features/learning/hooks/useTopics';
import { useCurrentChild } from '@/features/learning/hooks/useCurrentChild';
import { LoadingScreen } from '@/components/edukids/LoadingScreen';
import { reviewApi } from '@/features/learning/api/review.api';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/shared/store/auth.store';

// ── Play Page (Learning Map) ───────────────────────────────────────────────
export default function PlayPage() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);
    const { child, loading: childLoading, error: childError } = useCurrentChild();
    const { topics } = useTopics(child?.id ?? 0);
    const [dueReviews, setDueReviews] = useState(0);
    const [isExitingChild, setIsExitingChild] = useState(false);

    useEffect(() => {
        if (!child?.id) return;
        reviewApi.getProgress()
            .then((progress) => setDueReviews(progress.dueToday ?? 0))
            .catch(() => setDueReviews(0));
    }, [child?.id]);

    if (childLoading) {
        return <LoadingScreen />
    }

    const handleExitChildMode = async () => {
        if (isExitingChild) return;
        setIsExitingChild(true);
        try {
            const auth = await authApi.exitChildMode();
            setAuth(auth.user, auth.accessToken, auth.refreshToken, auth.role);
            router.replace('/dashboard');
        } catch (error) {
            console.error('Failed to exit child mode:', error);

            // Backward compatibility: if backend does not expose /auth/exit-child yet,
            // or if it fails, gracefully fallback to dashboard instead of un-authing the parent.
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                 router.replace('/dashboard');
            } else {
                 router.replace('/dashboard');
            }
        } finally {
            setIsExitingChild(false);
        }
    };

    // No active profile selected
    if (childError || !child) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-primary-light/50 to-background">
                <motion.div 
                    initial={{ opacity: 1, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="max-w-md w-full bg-card rounded-[2.5rem] p-8 md:p-10 text-center shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border-4 border-border/50 relative overflow-hidden"
                >
                    {/* Decorative blobs */}
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary-light/40 rounded-full blur-2xl" />
                    <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-secondary-light/40 rounded-full blur-2xl" />

                    <motion.div 
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="text-[5rem] mb-6 drop-shadow-md"
                    >
                        🧐
                    </motion.div>
                    
                    <Heading level={2} className="text-heading text-2xl md:text-3xl mb-3 font-black">
                        Ôi không!
                    </Heading>
                    
                    <Caption className="text-body text-base md:text-lg mb-8" style={{ lineHeight: 1.6 }}>
                        Bạn làm hệ thống bối rối rồi! Vui lòng nhờ ba mẹ chọn hồ sơ học nhé.
                    </Caption>
                    
                    <Link
                        href="/dashboard"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-primary text-white w-full py-4 rounded-full font-heading font-black text-lg shadow-[0_4px_0_0_var(--color-primary-dark)] hover:shadow-[0_2px_0_0_var(--color-primary-dark)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all"
                        >
                            Gọi ba mẹ giúp 🏃‍♂️
                        </motion.button>
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20 md:pb-8 bg-gradient-to-b from-primary-light/25 via-background to-background">
            <GameHUD
                nickname={child.nickname}
                avatarUrl={child.avatarUrl}
                rewards={child.rewards}
                hp={child.hp || 5}
                onBackClick={handleExitChildMode}
                activeNav="map"
            />

            {/* Page header */}
            <div className="max-w-lg md:max-w-4xl lg:max-w-7xl mx-auto px-4 md:px-6 pt-8 pb-4">
                <motion.div
                    initial={{ opacity: 1, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="rounded-3xl border border-border/70 bg-card/90 p-5 md:p-6 text-center shadow-sm"
                >
                    <Heading level={2} className="text-heading text-2xl mb-1">Hành trình học tập 🗺️</Heading>
                    <Caption className="text-caption text-sm">Chinh phục từng chặng để lên level!</Caption>

                    {/* XP progress */}
                    <div className="mt-4">
                        <XPProgressBar
                            currentLevel={child.rewards.currentLevel}
                            currentPoints={child.rewards.totalPoints}
                        />
                    </div>
                </motion.div>

                {/* Daily Streak Banner */}
                {(child.rewards.streakDays ?? 0) > 0 && (
                    <motion.div
                        initial={{ opacity: 1, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-3 flex items-center gap-3 bg-warning-light/90 border border-warning/40 rounded-2xl px-4 py-2.5 shadow-sm"
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
                            initial={{ opacity: 1, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="mt-3 flex items-center gap-3 bg-secondary-light/80 border border-secondary/50 rounded-2xl px-4 py-2.5 cursor-pointer relative overflow-hidden ring-2 ring-secondary/20 shadow-sm custom-glow-pulse"
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
                <div className="rounded-[2rem] border border-border/70 bg-card/90 p-6 md:p-8 shadow-sm relative overflow-hidden">
                {/* SVG Animated vertical connector */}
                <div className="absolute left-1/2 -translate-x-1/2 top-10 bottom-28 w-4 -z-0 flex justify-center">
                    <svg className="h-full w-1" preserveAspectRatio="none">
                        <motion.line
                            x1="50%" y1="0" x2="50%" y2="100%"
                            stroke="currentColor" strokeWidth="4" strokeDasharray="10 10" strokeLinecap="round"
                            className="text-border/80 dark:text-border-dark/80"
                            initial={{ pathLength: 0, opacity: 1 }}
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
                        initial={{ opacity: 1 }}
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
            </div>

            <BottomNav active="map" />
        </div>
    );
}
