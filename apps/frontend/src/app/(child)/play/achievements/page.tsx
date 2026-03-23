'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Trophy, Star, ArrowLeft, Lock, Info } from 'lucide-react';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { GameHUD } from '@/features/learning/components/GameHUD';
import { LoadingScreen } from '@/components/edukids/LoadingScreen';
import { gamificationApi, Badge } from '@/features/learning/api/gamification.api';
import { useCurrentChild } from '@/features/learning/hooks/useCurrentChild';

const RARITY_STYLE: Record<string, { label: string; earnedCls: string; lockedCls: string }> = {
    common: { label: 'Thường', earnedCls: 'from-muted/20 to-muted/10 border-border', lockedCls: 'from-card/50 to-card border-border/60' },
    rare: { label: 'Hiếm', earnedCls: 'from-primary-light/40 to-primary-light/20 border-primary/40', lockedCls: 'from-card/50 to-card border-border/60' },
    epic: { label: 'Huyền thoại', earnedCls: 'from-accent-light/40 to-accent-light/20 border-accent/40', lockedCls: 'from-card/50 to-card border-border/60' },
    legendary: { label: '✨ Huyền tích', earnedCls: 'from-warning-light/40 to-warning-light/20 border-warning/50', lockedCls: 'from-card/50 to-card border-border/60' },
};

const badgeTone = (category?: string) => {
    switch (category) {
        case 'MILESTONE':
            return 'legendary';
        case 'QUIZ':
            return 'epic';
        case 'PRONUNCIATION':
            return 'rare';
        default:
            return 'common';
    }
};

export default function AchievementsPage() {
    const { child, loading: childLoading } = useCurrentChild();
    const [allBadges, setAllBadges] = useState<Badge[]>([]);
    const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState('Tất cả');
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

    useEffect(() => {
        const childId = child?.id;
        if (!childId) return;
        async function loadBadges() {
            try {
                setLoading(true);
                setLoadError(null);
                const all = await gamificationApi.getBadges();
                const earned = all.filter((badge) => badge.isEarned);
                setAllBadges(all);
                setEarnedBadges(earned);
            } catch (error) {
                console.error('Failed to load badges:', error);
                setLoadError('Không thể tải huy hiệu lúc này.');
                setAllBadges([]);
                setEarnedBadges([]);
            } finally {
                setLoading(false);
            }
        }
        void loadBadges();
    }, [child?.id]);

    const categories = Array.from(new Set(['Tất cả', ...allBadges.map(b => b.category || 'Khác')]));
    const earnedIds = earnedBadges.map(b => b.id);

    const filtered = allBadges
        .filter((b) => activeCategory === 'Tất cả' || b.category === activeCategory)
        .sort((a, b) => {
            const aEarned = earnedIds.includes(a.id) ? 0 : 1;
            const bEarned = earnedIds.includes(b.id) ? 0 : 1;
            return aEarned - bEarned;
        });

    const totalEarned = earnedBadges.length;

    if (childLoading || !child) {
        return <LoadingScreen />
    }

    return (
        <div className="min-h-screen pb-20 md:pb-8 bg-gradient-to-b from-warning-light via-background to-background">
            {/* Desktop GameHUD */}
            <div className="hidden md:block">
                <GameHUD
                    nickname={child.nickname}
                    avatarUrl={child.avatarUrl}
                    rewards={child.rewards}
                    activeNav="achievements"
                />
            </div>

            {/* Mobile Header */}
            <div className="sticky top-0 z-30 bg-card/90 backdrop-blur-xl border-b-2 border-border md:hidden">
                <div className="max-w-lg md:max-w-4xl lg:max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center gap-4">
                    <Link href="/play">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-9 h-9 rounded-full bg-background border-2 border-border flex items-center justify-center">
                            <ArrowLeft size={16} className="text-body" />
                        </motion.div>
                    </Link>
                    <Trophy size={20} className="text-warning fill-warning" />
                    <Heading level={3} className="text-heading text-xl">Huy Hiệu</Heading>
                    <div className="ml-auto bg-warning-light border border-warning/30 text-warning font-heading font-black text-sm px-3 py-1 rounded-full">
                        {totalEarned}/{allBadges.length}
                    </div>
                </div>
            </div>

            <div className="max-w-lg md:max-w-4xl lg:max-w-7xl mx-auto px-4 md:px-6 pt-5 space-y-5">
                {loading ? (
                    <div className="text-center py-12">
                        <Body className="text-caption">Đang tải huy hiệu...</Body>
                    </div>
                ) : loadError ? (
                    <div className="text-center py-12 bg-card rounded-[2rem] border-2 border-border">
                        <Heading level={4} className="text-heading text-lg mb-2">Chưa tải được huy hiệu</Heading>
                        <Body className="text-caption">{loadError}</Body>
                    </div>
                ) : (
                    <>
                        {/* Progress banner */}
                        <motion.div initial={{ opacity: 1, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-warning to-orange-400 rounded-[2rem] p-5 text-white">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <Heading level={3} className="text-white text-xl mb-0.5">Bộ sưu tập</Heading>
                                    <Body className="text-white/80 text-sm">Còn {allBadges.length - totalEarned} huy hiệu chưa đạt</Body>
                                </div>
                                <div className="text-5xl font-heading font-black text-white/90">{allBadges.length > 0 ? Math.round((totalEarned / allBadges.length) * 100) : 0}%</div>
                            </div>
                            <div className="w-full h-3 bg-card/30 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }} animate={{ width: `${allBadges.length > 0 ? (totalEarned / allBadges.length) * 100 : 0}%` }}
                                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                                    className="h-full bg-card rounded-full"
                                />
                            </div>
                        </motion.div>

                        {/* Category filter */}
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {categories.map((cat) => (
                                <motion.button key={cat} whileTap={{ scale: 0.95 }}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`whitespace-nowrap px-4 py-2 rounded-2xl font-heading font-bold text-sm border-2 transition-all ${activeCategory === cat ? 'bg-warning-light border-warning text-warning' : 'bg-card border-border text-body hover:border-warning/40'
                                        }`}
                                >
                                    {cat}
                                </motion.button>
                            ))}
                        </div>

                        {/* Badge grid */}
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                            <AnimatePresence mode="popLayout">
                                {filtered.map((badge, i) => {
                                    const isEarned = Boolean(badge.isEarned);
                                    const rarity = RARITY_STYLE[badgeTone(badge.category)] ?? RARITY_STYLE.common;

                                    return (
                                        <motion.button
                                            key={badge.id}
                                            layout
                                            initial={{ opacity: 1, scale: 0.8 }}
                                            animate={{ opacity: isEarned ? 1 : 0.55, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ delay: i * 0.04 }}
                                            whileHover={{ scale: 1.06, opacity: 1, y: -4 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setSelectedBadge(badge)}
                                            className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 bg-gradient-to-b text-center cursor-pointer
                                ${isEarned ? rarity.earnedCls : rarity.lockedCls}`}
                                        >
                                            {/* Legendary shimmer effect */}
                                            {isEarned && badgeTone(badge.category) === 'legendary' && (
                                                <motion.div
                                                    animate={{ opacity: [0, 0.6, 0], x: [-30, 30] }}
                                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-2xl pointer-events-none"
                                                />
                                            )}

                                            <div className="relative">
                                                <span className={`text-4xl ${!isEarned ? 'grayscale opacity-50' : ''}`}>{badge.icon || '⭐'}</span>
                                                {!isEarned && (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Lock size={16} className="text-body" />
                                                    </div>
                                                )}
                                            </div>
                                            <Caption className={`text-[11px] font-bold leading-tight ${isEarned ? 'text-heading' : 'text-caption'}`}>{badge.name}</Caption>
                                            {isEarned && badge.earnedAt && (
                                                <div className="text-[9px] text-caption">
                                                    {new Date(badge.earnedAt).toLocaleDateString('vi-VN')}
                                                </div>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                        {filtered.length === 0 && (
                            <div className="rounded-[2rem] border-2 border-dashed border-border bg-card p-8 text-center">
                                <Heading level={4} className="text-heading text-lg mb-2">Chưa có huy hiệu trong mục này</Heading>
                                <Body className="text-caption">Thử chuyển sang nhóm khác hoặc hoàn thành thêm hoạt động để mở khóa huy hiệu.</Body>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Badge Detail Drawer */}
            <AnimatePresence>
                {selectedBadge && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setSelectedBadge(null)} />
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-[2.5rem] p-6 border-t-4 border-warning shadow-2xl max-w-lg mx-auto"
                        >
                            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-5" />
                            <div className="flex flex-col items-center text-center gap-4">
                                <motion.span
                                    animate={{ rotate: selectedBadge.isEarned ? [0, -8, 8, 0] : [] }}
                                    transition={{ duration: 1, delay: 0.2 }}
                                    className="text-8xl"
                                >
                                    {selectedBadge.icon || '⭐'}
                                </motion.span>

                                <div>
                                    <div className={`text-xs font-heading font-black px-3 py-0.5 rounded-full border inline-block mb-2 ${RARITY_STYLE[badgeTone(selectedBadge.category)]?.earnedCls}`}>
                                        {RARITY_STYLE[badgeTone(selectedBadge.category)]?.label}
                                    </div>
                                    <Heading level={3} className="text-heading text-2xl mb-1">{selectedBadge.name}</Heading>
                                    <Body className="text-body">{selectedBadge.description}</Body>
                                </div>

                                {selectedBadge.isEarned ? (
                                    <div className="w-full bg-success-light border-2 border-success/30 text-success font-heading font-black text-sm rounded-2xl py-3 flex items-center justify-center gap-2">
                                        <Star size={16} className="fill-success" />
                                        Đã đạt ngày {selectedBadge.earnedAt ? new Date(selectedBadge.earnedAt).toLocaleDateString('vi-VN') : 'N/A'}
                                    </div>
                                ) : (
                                    <div className="w-full bg-background border-2 border-dashed border-border rounded-2xl p-4 text-left">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Info size={14} className="text-primary" />
                                            <Caption className="text-primary font-bold text-xs">Cách đạt huy hiệu</Caption>
                                        </div>
                                        <Body className="text-body text-sm">
                                            {selectedBadge.progress !== undefined && selectedBadge.requirement !== undefined
                                                ? `Tiến độ: ${selectedBadge.progress}/${selectedBadge.requirement}. ${selectedBadge.description}`
                                                : selectedBadge.description}
                                        </Body>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
