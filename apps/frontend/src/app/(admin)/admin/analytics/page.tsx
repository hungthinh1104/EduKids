'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, Clock, BookOpen, Trophy, Target, Star, Mic, BarChart2 } from 'lucide-react';
import { Heading, Caption } from '@/shared/components/Typography';
import { MetricCard, SectionHeader } from '@/features/admin/components/AdminUI';
import { BarChart, HorizontalBarList, DonutRing } from '@/features/admin/components/Charts';
import { Skeleton } from '@/components/edukids/Skeleton';
import { getAdminDashboard, getContentPopularity, getDAUMetrics, getSessionLengthAnalytics } from '@/features/admin/api/admin-analytics.api';
import { DateRangePicker } from '@/shared/components/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';

interface AnalyticsData {
    dailyActive: { label: string; value: number }[];
    retention: { label: string; value: number }[];
    topicPopularity: { label: string; value: number; maxValue: number; meta: React.ReactNode }[];
    funnel: { label: string; value: number; barColor: string }[];
    gameModes: { mode: string; sessions: number; avgScore: number; color: string }[];
    kpis: { label: string; value: string; delta: number; icon: React.ReactNode; colorCls: string }[];
    engagementRate: number;
    totalQuizzes: number;
    totalTopics: number;
    totalVocabularies: number;
    averageSessionLength: number;
    avgPronunciationScore: number;
    totalPronunciationAttempts: number;
    totalQuizQuestions: number;
    avgLearningScore: number;
}

const periodFromDateRange = (range: DateRange | undefined): '7d' | '30d' | '90d' => {
    if (!range?.from || !range?.to) return '7d';
    const diffMs = Math.abs(range.to.getTime() - range.from.getTime());
    const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    if (diffDays <= 7) return '7d';
    if (diffDays <= 30) return '30d';
    return '90d';
};

export default function AdminAnalyticsPage() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: addDays(new Date(), -7),
        to: new Date()
    });
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [warning, setWarning] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            setWarning(null);
            try {
                const period = periodFromDateRange(dateRange);
                const [dashboardResult, dauResult, sessionResult, popularityResult] = await Promise.allSettled([
                    getAdminDashboard(),
                    getDAUMetrics(period),
                    getSessionLengthAnalytics(period),
                    getContentPopularity({ period, limit: 10, contentType: 'TOPIC' }),
                ]);

                if (dashboardResult.status === 'rejected') {
                    throw dashboardResult.reason;
                }

                const dashboard = dashboardResult.value;
                const dauMetrics = dauResult.status === 'fulfilled'
                    ? dauResult.value
                    : { date: '', dau: 0, new: 0, returning: 0, chartData: [] };
                const sessionLength = sessionResult.status === 'fulfilled'
                    ? sessionResult.value
                    : { average: 0, median: 0, byUserType: { free: 0, premium: 0 }, distribution: [], trend: [] };
                const contentPopularity = popularityResult.status === 'fulfilled'
                    ? popularityResult.value
                    : { topics: [], vocabularies: [], quizzes: [] };

                const degradedResponses = [dauResult, sessionResult, popularityResult].some((r) => r.status === 'rejected');
                if (degradedResponses) {
                    setWarning('Một vài nguồn analytics chưa sẵn sàng. Dashboard đang hiển thị dữ liệu khả dụng.');
                }

                const dailyActive = dauMetrics.chartData.map((point) => ({
                    label: point.date,
                    value: point.dau,
                }));

                const retention = dauMetrics.chartData.map((point) => ({
                    label: point.date,
                    value: point.dau > 0 ? Math.round((point.returning / point.dau) * 100) : 0,
                }));

                const maxTopicCompletion = Math.max(
                    1,
                    ...contentPopularity.topics.map((topic) => topic.completions)
                );

                const topicPopularity = contentPopularity.topics.map((topic) => ({
                    label: topic.name,
                    value: topic.completions,
                    maxValue: maxTopicCompletion,
                    meta: (
                        <span className={`text-xs font-heading font-black ${topic.averageScore >= 85 ? 'text-success' : topic.averageScore >= 75 ? 'text-primary' : 'text-warning'}`}>
                            {topic.averageScore}%
                        </span>
                    ),
                }));

                const activeUserRate = dashboard.totalUsers > 0
                    ? Math.round((dashboard.activeUsers / dashboard.totalUsers) * 100)
                    : 0;
                const completionRate = contentPopularity.topics.length > 0
                    ? Math.round(
                        contentPopularity.topics.reduce((sum, topic) => sum + topic.averageScore, 0) /
                        contentPopularity.topics.length
                    )
                    : 0;
                const contentViewRate = dashboard.totalUsers > 0 && (dashboard.totalContentViews ?? 0) > 0
                    ? Math.min(100, Math.round((dashboard.totalContentViews ?? 0) / dashboard.totalUsers))
                    : 0;

                setData({
                    dailyActive,
                    retention,
                    topicPopularity,
                    funnel: [
                        { label: 'Người dùng hoạt động', value: activeUserRate, barColor: 'bg-primary' },
                        { label: 'Hoàn thành nội dung', value: completionRate, barColor: 'bg-success' },
                        { label: 'Lượt xem nội dung', value: contentViewRate, barColor: 'bg-warning' },
                    ],
                    gameModes: [],
                    kpis: [
                        { label: 'Tổng users', value: dashboard.totalUsers.toLocaleString(), delta: dashboard.userGrowth, icon: <Users size={20} />, colorCls: 'text-primary bg-primary-light' },
                        { label: 'Active users', value: dashboard.activeUsers.toLocaleString(), delta: dashboard.engagementRate, icon: <Users size={20} />, colorCls: 'text-accent bg-accent-light' },
                        { label: 'Thời gian TB', value: `${dashboard.averageSessionLength} phút`, delta: sessionLength.average - sessionLength.median, icon: <Clock size={20} />, colorCls: 'text-success bg-success-light' },
                        { label: 'Tổng bài học', value: dashboard.totalTopics.toLocaleString(), delta: 0, icon: <BookOpen size={20} />, colorCls: 'text-secondary bg-secondary-light' },
                        { label: 'Engagement', value: `${dashboard.engagementRate}%`, delta: dashboard.engagementRate, icon: <Target size={20} />, colorCls: 'text-warning bg-warning-light' },
                        { label: 'Quiz đã tạo', value: dashboard.totalQuizzes.toLocaleString(), delta: 0, icon: <Trophy size={20} />, colorCls: 'text-primary bg-primary-light' },
                    ],
                    engagementRate: dashboard.engagementRate,
                    totalQuizzes: dashboard.totalQuizzes,
                    totalTopics: dashboard.totalTopics,
                    totalVocabularies: dashboard.totalVocabularies,
                    averageSessionLength: dashboard.averageSessionLength,
                    avgPronunciationScore: dashboard.avgPronunciationScore,
                    totalPronunciationAttempts: dashboard.totalPronunciationAttempts,
                    totalQuizQuestions: dashboard.totalQuizQuestions,
                    avgLearningScore: dashboard.avgLearningScore,
                });
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
                setData(null);
                setWarning('Không thể tải đầy đủ analytics lúc này. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [dateRange]);

    return (
        <div className="space-y-10">
            {/* Header */}
            <motion.div initial={{ opacity: 1, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4 rounded-3xl border border-primary/15 bg-gradient-to-r from-primary-light/55 via-card to-accent-light/40 p-5 md:p-6 shadow-sm">
                <div>
                    <Heading level={2} className="text-heading text-3xl mb-1">Phân tích nền tảng 📈</Heading>
                    <Caption className="text-caption">Hiệu suất toàn bộ hệ thống EduKids</Caption>
                </div>
                <div className="flex items-center gap-2">
                    <DateRangePicker
                        date={dateRange}
                        setDate={setDateRange}
                        className="w-[260px] justify-between"
                    />
                </div>
            </motion.div>

            {warning && (
                <div className="rounded-2xl border border-warning/30 bg-warning-light/40 px-4 py-3 shadow-sm">
                    <Caption className="text-warning">{warning}</Caption>
                </div>
            )}

            {/* KPIs */}
            {loading || !data ? (
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
                    {data.kpis.map((m, i) => (
                        <MetricCard key={m.label} {...m} index={i} />
                    ))}
                </div>
            )}

            {/* Charts row — using extracted BarChart component */}
            {data && (
                <>
                    <div className="grid lg:grid-cols-2 gap-6">
                        <BarChart title="DAU / ngày" data={data.dailyActive} action={<TrendingUp size={16} className="text-success" />} />
                        <BarChart title="Tỉ lệ giữ chân người dùng" data={data.retention} colorByValue height={160} action={<TrendingDown size={16} className="text-warning" />} />
                    </div>

                    {/* Topic popularity + funnel */}
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <HorizontalBarList title="Chủ đề phổ biến nhất" data={data.topicPopularity} action={<BarChart2 size={16} className="text-primary" />} />
                        </div>
                        <HorizontalBarList title="Phễu chuyển đổi (%)" data={data.funnel} />
                    </div>

                    {/* Game mode breakdown */}
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card border border-border/70 rounded-2xl p-6 shadow-sm">
                        <SectionHeader title="Phân bổ theo chế độ học" />
                        {data.gameModes.length === 0 ? (
                            <div className="mt-2 rounded-2xl border border-dashed border-border/70 bg-background/60 px-4 py-10 text-center">
                                <Caption className="text-caption">Chưa có dữ liệu phân bổ theo chế độ học.</Caption>
                            </div>
                        ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                            {data.gameModes.map((m, i) => (
                                <motion.div key={m.mode} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} className="bg-background border border-border/70 rounded-2xl p-4">
                                    <div className={`text-lg font-heading font-black mb-1 ${m.color}`}>{m.mode}</div>
                                    <div className="text-2xl font-heading font-black text-heading">{m.sessions.toLocaleString()}</div>
                                    <Caption className="text-caption text-xs mb-3">phiên học</Caption>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-card border border-border rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} whileInView={{ width: `${m.avgScore}%` }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.07 }} className="h-full rounded-full bg-gradient-to-r from-primary to-accent" />
                                        </div>
                                        <span className="text-xs font-heading font-black text-heading">{m.avgScore}%</span>
                                    </div>
                                    <Caption className="text-caption text-[10px]">avg score</Caption>
                                </motion.div>
                            ))}
                        </div>
                        )}
                    </motion.div>

                    {/* Pronunciation + gamification */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Pronunciation — uses DonutRing */}
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card border border-border/70 rounded-2xl p-6 shadow-sm">
                            <SectionHeader title="Điểm phát âm" action={<Mic size={16} className="text-accent" />} />
                            <div className="flex items-center gap-6 mt-4">
                                <DonutRing pct={Math.min(100, Math.max(0, Math.round(data.avgPronunciationScore)))} label="avg" />
                                <div className="space-y-3 flex-1">
                                    {[
                                        { label: 'Lượt thực hành', value: data.totalPronunciationAttempts.toLocaleString() },
                                        { label: 'Điểm học tập TB', value: data.avgLearningScore > 0 ? `${Math.round(data.avgLearningScore)}%` : '—' },
                                        { label: 'Câu hỏi quiz DB', value: data.totalQuizQuestions.toLocaleString() },
                                    ].map((row) => (
                                        <div key={row.label}>
                                            <Caption className="text-caption text-xs">{row.label}</Caption>
                                            <div className="font-heading font-bold text-heading text-sm">{row.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Gamification */}
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-card border border-border/70 rounded-2xl p-6 shadow-sm">
                            <SectionHeader title="Gamification" action={<Star size={16} className="text-warning" />} />
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                {[
                                    { label: 'Tổng topics', value: data.totalTopics.toLocaleString(), icon: '📚' },
                                    { label: 'Tổng vocab', value: data.totalVocabularies.toLocaleString(), icon: '🧠' },
                                    { label: 'Quiz đã tạo', value: data.totalQuizzes.toLocaleString(), icon: '🏅' },
                                    { label: 'Phiên học TB', value: `${data.averageSessionLength} phút`, icon: '🔥' },
                                ].map((s, i) => (
                                    <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} className="bg-background border border-border/70 rounded-xl p-3">
                                        <div className="text-xl mb-1">{s.icon}</div>
                                        <div className="font-heading font-black text-heading text-base">{s.value}</div>
                                        <Caption className="text-caption text-xs">{s.label}</Caption>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </div>
    );
}
