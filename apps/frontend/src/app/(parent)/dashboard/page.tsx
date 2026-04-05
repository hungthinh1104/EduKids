'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Trophy, Mic, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { Skeleton } from '@/components/edukids/Skeleton';
import { Alert } from '@/components/edukids/Alert';
import { ChildProfileCard, AddChildCard } from '@/features/dashboard/components/ChildProfileCard';
import { useChildProfiles, useChildAnalytics } from '@/features/dashboard/hooks/useChildProfiles';
import type { ChartDataPoint } from '@/features/profile/types/child-profile.types';

const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
    hidden: { opacity: 1, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function ParentDashboardPage() {
    const {
        profiles,
        activeProfileId,
        loading: profileLoading,
        error: profileError,
        refetch: refetchProfiles,
        switchActiveProfile,
    } = useChildProfiles();
    const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

    const currentChildId = useMemo(
        () => selectedChildId ?? activeProfileId ?? profiles[0]?.id ?? null,
        [selectedChildId, activeProfileId, profiles],
    );

    // analytics shape: AnalyticsOverviewDto from GET /api/analytics/overview?childId=X
    const {
        analytics,
        loading: analyticsLoading,
        error: analyticsError,
        refetch: refetchAnalytics,
    } = useChildAnalytics(currentChildId ?? 0);

    const activeProfile = profiles.find((p) => p.id === currentChildId) ?? profiles[0] ?? null;

    const chartData = analytics?.learningTime.chartData ?? [];
    const maxMinutes = Math.max(...chartData.map((d: ChartDataPoint) => d.value), 1);

    return (
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-10 px-4 md:px-1">
            {/* ── Profile Selector ── */}
            <section>
                <motion.div
                    initial={{ opacity: 1, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-6 md:mb-8 rounded-2xl md:rounded-3xl border border-primary/15 bg-gradient-to-r from-primary-light/50 via-card to-accent-light/40 p-4 md:p-6 md:p-7 shadow-sm"
                >
                    <Heading level={2} className="text-heading text-2xl md:text-3xl mb-1">Chào buổi sáng! 👋</Heading>
                    <Body className="text-body text-sm md:text-base">Hôm nay bé nào muốn học tiếng Anh?</Body>
                </motion.div>

                {!profileLoading && profiles.length > 0 && (
                    <motion.div
                        initial={{ opacity: 1, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mb-4 md:mb-6 rounded-xl md:rounded-2xl border border-border/70 bg-card/90 p-2.5 md:p-3.5 md:p-4 shadow-sm"
                    >
                        <Caption className="text-caption font-bold text-[10px] md:text-xs uppercase tracking-wide mb-2 md:mb-2.5 block">
                            Chọn hồ sơ bé
                        </Caption>
                        <div className="flex gap-1.5 md:gap-2.5 overflow-x-auto pb-1">
                            {profiles.map((profile) => {
                                const isSelected = profile.id === currentChildId;
                                return (
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        key={`selector-${profile.id}`}
                                        onClick={async () => {
                                            setSelectedChildId(profile.id);
                                            const ok = await switchActiveProfile(profile.id);
                                            if (!ok) {
                                                // keep local selection for UI continuity even if backend switch fails
                                                setSelectedChildId(profile.id);
                                            }
                                        }}
                                        className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-heading font-bold border transition-all whitespace-nowrap flex-shrink-0 ${isSelected
                                            ? 'bg-primary text-white border-primary shadow-sm'
                                            : 'bg-card text-body border-border hover:border-primary/50 hover:text-primary hover:-translate-y-0.5'
                                            }`}
                                    >
                                        {profile.nickname}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                    {profileLoading && [1, 2, 3].map((key) => (
                        <motion.div key={`skeleton-${key}`} variants={fadeUp} className="w-full">
                            <Skeleton className="min-h-[240px] md:min-h-[280px] rounded-[1.5rem] md:rounded-[2rem]" />
                        </motion.div>
                    ))}

                    {!profileLoading && profiles.map((profile) => (
                        <motion.div key={profile.id} variants={fadeUp}>
                            <ChildProfileCard profile={profile} isActive={profile.id === currentChildId} />
                        </motion.div>
                    ))}

                    <motion.div variants={fadeUp}>
                        <AddChildCard />
                    </motion.div>
                </motion.div>

                {profileError && (
                    <div className="mt-4">
                        <Alert
                            type="warning"
                            message={profileError}
                            action={
                                <button
                                    onClick={() => void refetchProfiles()}
                                    className="px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-card border border-warning/40 text-warning text-[10px] md:text-xs font-heading font-bold hover:bg-warning-light/50 transition-colors whitespace-nowrap"
                                >
                                    Thử lại
                                </button>
                            }
                        />
                    </div>
                )}

                {!profileLoading && profiles.length === 0 && (
                    <div className="mt-4 md:mt-6 bg-card border-2 border-dashed border-border rounded-xl md:rounded-2xl p-4 md:p-8 text-center">
                        <Heading level={4} className="text-heading text-base md:text-lg mb-2">Chưa có hồ sơ bé</Heading>
                        <Body className="text-body text-sm md:text-base">Tạo hồ sơ đầu tiên để bắt đầu theo dõi tiến độ học tập.</Body>
                    </div>
                )}
            </section>

            {/* ── Analytics Overview (from AnalyticsOverviewDto) ── */}
            {!profileLoading && activeProfile && analytics?.hasData && (
                <section>
                    <motion.div initial={{ opacity: 1, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                        <Image 
                            src={activeProfile.avatar} 
                            alt={`Avatar của ${activeProfile.nickname}`} 
                            width={32} 
                            height={32} 
                            className="rounded-full bg-primary-light p-0.5 w-8 h-8 md:w-9 md:h-9" 
                            priority={false}
                            loading="lazy"
                        />
                        <Heading level={3} className="text-heading text-base md:text-xl">
                            Báo cáo của <span className="text-primary">{analytics.childNickname}</span> — 7 ngày
                        </Heading>
                    </motion.div>

                    <div className="bg-success-light/40 border border-success/20 rounded-lg md:rounded-2xl p-3 md:p-4 mb-4 md:mb-6 shadow-sm">
                        <Caption className="text-success font-semibold text-xs md:text-sm">{analytics.insightMessage}</Caption>
                    </div>

                    {/* Stat cards */}
                    <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-8">
                        {analyticsLoading && [1, 2, 3, 4].map((key) => (
                            <motion.div key={`analytics-skeleton-${key}`} variants={fadeUp} className="w-full">
                                <Skeleton className="min-h-[110px] md:min-h-[126px] rounded-lg md:rounded-2xl" />
                            </motion.div>
                        ))}

                        {!analyticsLoading && [
                            { icon: <BookOpen size={18} className="md:w-5.5 md:h-5.5" />, label: 'Từ đã học', value: analytics.vocabulary.wordsMastered, color: 'text-primary', bg: 'bg-primary-light' },
                            { icon: <Mic size={18} className="md:w-5.5 md:h-5.5" />, label: 'Phút học', value: analytics.learningTime.totalMinutes, color: 'text-secondary', bg: 'bg-secondary-light' },
                            { icon: <Trophy size={18} className="md:w-5.5 md:h-5.5" />, label: 'Điểm phát âm', value: `${analytics.pronunciation.averageAccuracy}%`, color: 'text-success', bg: 'bg-success-light' },
                            { icon: <TrendingUp size={18} className="md:w-5.5 md:h-5.5" />, label: 'Từ đã ôn', value: analytics.vocabulary.wordsReviewed, color: 'text-accent', bg: 'bg-accent-light' },
                        ].map((stat, i) => (
                            <motion.div key={i} variants={fadeUp} className="bg-card/90 backdrop-blur-sm border border-border/70 shadow-sm rounded-lg md:rounded-3xl p-3 md:p-5 flex flex-col gap-2 md:gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all">
                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 ${stat.bg} ${stat.color}`}>{stat.icon}</div>
                                <div className="min-w-0">
                                    <div className={`text-lg md:text-2xl font-heading font-black ${stat.color} truncate`}>{stat.value}</div>
                                    <Caption className="text-caption text-[10px] md:text-xs line-clamp-1">{stat.label}</Caption>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Activity bar chart — data from analytics.learningTime.chartData (ChartDataPoint[]) */}
                    <motion.div initial={{ opacity: 1, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="bg-card/90 backdrop-blur-sm border border-border/70 shadow-[0_8px_24px_rgba(0,0,0,0.05)] rounded-lg md:rounded-[2rem] p-4 md:p-6 md:p-8">
                        <div className="flex items-center justify-between mb-4 md:mb-6 gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <TrendingUp size={18} className="md:w-5 md:h-5 text-primary flex-shrink-0" />
                                <Heading level={4} className="text-heading text-base md:text-lg">Thời gian học mỗi ngày</Heading>
                            </div>
                            <Caption className="text-caption text-xs md:text-sm flex-shrink-0">phút / ngày</Caption>
                        </div>
                        {chartData.length === 0 ? (
                            <div className="h-28 md:h-32 grid place-items-center">
                                <Caption className="text-caption text-xs md:text-sm">Chưa có dữ liệu biểu đồ cho tuần này.</Caption>
                            </div>
                        ) : (
                            <div className="flex items-end justify-between gap-1 md:gap-2 h-28 md:h-32">
                                {chartData.map((pt: ChartDataPoint, i: number) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1 md:gap-1.5 group">
                                        <Caption className="text-caption text-[8px] md:text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">{pt.value}m</Caption>
                                        <motion.div
                                            initial={{ height: 0 }} whileInView={{ height: `${(pt.value / maxMinutes) * 100}%` }} viewport={{ once: true }}
                                            transition={{ duration: 0.8, delay: i * 0.05, ease: [0.175, 0.885, 0.32, 1.275] }}
                                            className="w-full min-h-[2px] md:min-h-1 bg-gradient-to-t from-primary/80 to-primary rounded-t-lg group-hover:from-primary group-hover:to-primary-dark transition-all shadow-[0_-2px_10px_rgba(var(--color-primary),0.2)]"
                                        />
                                        <Caption className="text-caption text-[9px] md:text-[11px] font-medium">{pt.label}</Caption>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </section>
            )}

            {!profileLoading && activeProfile && analyticsError && (
                <section className="mb-4 md:mb-6">
                    <Alert
                        type="warning"
                        message={analyticsError}
                        action={
                            <button
                                onClick={() => void refetchAnalytics()}
                                className="px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-card border border-warning/40 text-warning text-[10px] md:text-xs font-heading font-bold hover:bg-warning-light/50 transition-colors whitespace-nowrap"
                            >
                                Tải lại
                            </button>
                        }
                    />
                </section>
            )}

            {!profileLoading && activeProfile && !analyticsLoading && !analytics?.hasData && (
                <section className="bg-card border-2 border-border rounded-xl md:rounded-2xl p-4 md:p-8 text-center">
                    <Heading level={3} className="text-heading text-lg md:text-xl mb-2">Chưa có dữ liệu học tập</Heading>
                    <Body className="text-body text-sm md:text-base">Hãy cho bé bắt đầu một bài học để dashboard hiển thị báo cáo chi tiết.</Body>
                </section>
            )}
        </div>
    );
}
