'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { Skeleton } from '@/components/edukids/Skeleton';
import { Users, Activity, BookOpen, HelpCircle, Package, Star, Sparkles } from 'lucide-react';
import { DashboardMetrics, PlatformMetric } from '@/features/admin/components/DashboardMetrics';
import { WeeklySessionsChart, WeeklyData } from '@/features/admin/components/WeeklySessionsChart';
import { ContentStatsTable, ContentStat } from '@/features/admin/components/ContentStatsTable';
import { RecentUsersTable, RecentUser } from '@/features/admin/components/RecentUsersTable';
import { getAdminDashboard, getContentPopularity, getDAUMetrics } from '@/features/admin/api/admin-analytics.api';
import { getAdminUsers } from '@/features/admin/api/admin-users.api';

export default function AdminDashboardPage() {
    const [platformMetrics, setPlatformMetrics] = useState<PlatformMetric[]>([
        { label: 'Người dùng đăng ký', value: '0', delta: 0, icon: <Users size={20} />, colorCls: 'text-primary bg-primary-light' },
        { label: 'Học sinh đang học', value: '0', delta: 0, icon: <Activity size={20} />, colorCls: 'text-success bg-success-light' },
        { label: 'Chủ đề đã tạo', value: '0', delta: 0, icon: <BookOpen size={20} />, colorCls: 'text-accent bg-accent-light' },
        { label: 'Quiz đã tạo', value: '0', delta: 0, icon: <HelpCircle size={20} />, colorCls: 'text-warning bg-warning-light' },
        { label: 'Từ vựng', value: '0', delta: 0, icon: <Package size={20} />, colorCls: 'text-secondary bg-secondary-light' },
        { label: 'Sao tổng cộng', value: '0', delta: 0, icon: <Star size={20} />, colorCls: 'text-star bg-warning-light' },
    ]);
    const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
    const [contentStats, setContentStats] = useState<ContentStat[]>([]);
    const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([
        { day: 'CN', sessions: 0 },
        { day: 'T2', sessions: 0 },
        { day: 'T3', sessions: 0 },
        { day: 'T4', sessions: 0 },
        { day: 'T5', sessions: 0 },
        { day: 'T6', sessions: 0 },
        { day: 'T7', sessions: 0 },
    ]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [dashboard, dauMetrics, contentPopularity, users] = await Promise.all([
                    getAdminDashboard(),
                    getDAUMetrics('7d'),
                    getContentPopularity({ period: '30d', limit: 5, contentType: 'TOPIC' }),
                    getAdminUsers(),
                ]);

                setPlatformMetrics([
                    { label: 'Người dùng đăng ký', value: dashboard.totalUsers.toString(), delta: dashboard.userGrowth || 0, icon: <Users size={20} />, colorCls: 'text-primary bg-primary-light' },
                    { label: 'Học sinh đang học', value: dashboard.activeUsers.toString(), delta: dashboard.engagementRate || 0, icon: <Activity size={20} />, colorCls: 'text-success bg-success-light' },
                    { label: 'Chủ đề đã tạo', value: dashboard.totalTopics.toString(), delta: 0, icon: <BookOpen size={20} />, colorCls: 'text-accent bg-accent-light' },
                    { label: 'Quiz đã tạo', value: dashboard.totalQuizzes.toString(), delta: 0, icon: <HelpCircle size={20} />, colorCls: 'text-warning bg-warning-light' },
                    { label: 'Từ vựng', value: dashboard.totalVocabularies.toString(), delta: 0, icon: <Package size={20} />, colorCls: 'text-secondary bg-secondary-light' },
                    { label: 'Lượt xem nội dung', value: String(dashboard.totalContentViews || 0), delta: 0, icon: <Star size={20} />, colorCls: 'text-star bg-warning-light' },
                ]);

                setRecentUsers(users.slice(0, 5).map((user) => ({
                    id: user.id,
                    email: user.email,
                    children: user.children.length,
                    totalPoints: user.children.reduce((sum, child) => sum + child.totalPoints, 0),
                    status: user.plan === 'premium' ? 'premium' : user.status,
                    joinedAt: user.joinedAt,
                })) as RecentUser[]);

                setContentStats(contentPopularity.topics.map((topic) => ({
                    topic: topic.name,
                    words: topic.views,
                    quizzes: topic.completions,
                    completionRate: topic.averageScore,
                    avgScore: topic.averageScore,
                })) as ContentStat[]);

                setWeeklyData(prev => prev.map((item, index) => ({
                    ...item,
                    sessions: dauMetrics.chartData[index]?.dau || 0,
                })));
            } catch (err) {
                console.error('Failed to fetch dashboard overview:', err);
                setPlatformMetrics((prev) => prev.map((metric) => ({ ...metric, value: '0', delta: 0 })));
                setRecentUsers([]);
                setContentStats([]);
                setWeeklyData((prev) => prev.map((item) => ({ ...item, sessions: 0 })));
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const maxSessions = Math.max(...weeklyData.map(w => w.sessions), 1);

    if (loading) {
        return (
            <div className="p-6 md:p-10 space-y-8">
                <Skeleton className="h-10 w-48 mb-6" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-28 w-full" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 space-y-8 max-w-[1600px] mx-auto">
            <motion.div initial={{ opacity: 1, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="rounded-3xl border border-primary/15 bg-gradient-to-r from-primary-light/55 via-card to-accent-light/40 p-6 md:p-7 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <Caption className="text-primary font-bold uppercase tracking-wide text-[11px]">
                            Admin Dashboard
                        </Caption>
                    </div>
                    <Heading level={2} className="text-heading text-2xl md:text-3xl mb-1">Tổng Quan Nền Tảng</Heading>
                    <Body className="text-body mt-1">Theo dõi các chỉ số quan trọng của EduKids</Body>
                </div>
            </motion.div>

            {/* Platform metrics */}
            <div className="rounded-3xl border border-border/70 bg-card/90 p-4 md:p-5 shadow-sm">
                <DashboardMetrics platformMetrics={platformMetrics} />
            </div>

            {/* Two-column: chart + content table */}
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 rounded-3xl border border-border/70 bg-card/90 p-4 md:p-5 shadow-sm">
                    <WeeklySessionsChart weeklyData={weeklyData} maxSessions={maxSessions} />
                </div>
                <div className="lg:col-span-2 rounded-3xl border border-border/70 bg-card/90 p-4 md:p-5 shadow-sm">
                    <ContentStatsTable contentStats={contentStats} />
                </div>
            </div>

            {/* Recent users */}
            <RecentUsersTable recentUsers={recentUsers} />
        </div>
    );
}
