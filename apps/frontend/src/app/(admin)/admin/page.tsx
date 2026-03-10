'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heading } from '@/shared/components/Typography';
import { Skeleton } from '@/components/edukids/Skeleton';
import { apiClient } from '@/shared/services/api.client';
import { Users, Activity, BookOpen, HelpCircle, Package, Star } from 'lucide-react';
import { DashboardMetrics, PlatformMetric } from '@/features/admin/components/DashboardMetrics';
import { WeeklySessionsChart, WeeklyData } from '@/features/admin/components/WeeklySessionsChart';
import { ContentStatsTable, ContentStat } from '@/features/admin/components/ContentStatsTable';
import { RecentUsersTable, RecentUser } from '@/features/admin/components/RecentUsersTable';

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
                const res = await apiClient.get('/admin/analytics/dashboard');
                if (res.data?.data) {
                    const d = res.data.data;
                    setPlatformMetrics([
                        { label: 'Người dùng đăng ký', value: d.totalUsers?.toString() || '0', delta: d.usersDelta || 0, icon: <Users size={20} />, colorCls: 'text-primary bg-primary-light' },
                        { label: 'Học sinh đang học', value: d.activeChildren?.toString() || '0', delta: d.activeChildrenDelta || 0, icon: <Activity size={20} />, colorCls: 'text-success bg-success-light' },
                        { label: 'Chủ đề đã tạo', value: d.totalTopics?.toString() || '0', delta: d.topicsDelta || 0, icon: <BookOpen size={20} />, colorCls: 'text-accent bg-accent-light' },
                        { label: 'Quiz đã tạo', value: d.totalQuizzes?.toString() || '0', delta: d.quizzesDelta || 0, icon: <HelpCircle size={20} />, colorCls: 'text-warning bg-warning-light' },
                        { label: 'Từ vựng', value: d.totalWords?.toString() || '0', delta: d.wordsDelta || 0, icon: <Package size={20} />, colorCls: 'text-secondary bg-secondary-light' },
                        { label: 'Sao tổng cộng', value: d.totalStarsEarned?.toLocaleString() || '0', delta: d.starsDelta || 0, icon: <Star size={20} />, colorCls: 'text-star bg-warning-light' },
                    ]);

                    setRecentUsers(d.recentUsers || []);
                    setContentStats(d.contentPerformance || []);

                    if (d.weeklySessions) {
                        setWeeklyData(prev => prev.map((item, index) => ({
                            ...item,
                            sessions: d.weeklySessions[index] || 0
                        })));
                    }
                }
            } catch (err) {
                console.error('Failed to fetch dashboard overview:', err);
                // MOCK DATA for preview if API fails
                setPlatformMetrics([
                    { label: 'Người dùng đăng ký', value: '1,245', delta: 12, icon: <Users size={20} />, colorCls: 'text-primary bg-primary-light' },
                    { label: 'Học sinh đang học', value: '890', delta: 5, icon: <Activity size={20} />, colorCls: 'text-success bg-success-light' },
                    { label: 'Chủ đề đã tạo', value: '45', delta: 2, icon: <BookOpen size={20} />, colorCls: 'text-accent bg-accent-light' },
                    { label: 'Quiz đã tạo', value: '120', delta: 8, icon: <HelpCircle size={20} />, colorCls: 'text-warning bg-warning-light' },
                    { label: 'Từ vựng', value: '850', delta: 15, icon: <Package size={20} />, colorCls: 'text-secondary bg-secondary-light' },
                    { label: 'Sao tổng cộng', value: '45K', delta: -3, icon: <Star size={20} />, colorCls: 'text-star bg-warning-light' },
                ]);
                setRecentUsers([
                    { id: 1, email: 'parent1@gmail.com', children: 2, totalPoints: 1250, status: 'premium', joinedAt: '2024-03-01T10:00:00Z' },
                    { id: 2, email: 'nguyenvana@gmail.com', children: 1, totalPoints: 450, status: 'active', joinedAt: '2024-03-02T15:30:00Z' },
                    { id: 3, email: 'lethib@yahoo.com', children: 3, totalPoints: 3200, status: 'premium', joinedAt: '2024-03-03T08:15:00Z' },
                    { id: 4, email: 'tranvanc@hotmail.com', children: 1, totalPoints: 0, status: 'pending', joinedAt: '2024-03-04T12:00:00Z' }
                ]);
                setContentStats([
                    { topic: 'Động vật', words: 45, quizzes: 5, completionRate: 85, avgScore: 92 },
                    { topic: 'Giao tiếp hàng ngày', words: 120, quizzes: 12, completionRate: 65, avgScore: 78 },
                    { topic: 'Thức ăn', words: 30, quizzes: 3, completionRate: 90, avgScore: 88 }
                ]);
                setWeeklyData([
                    { day: 'CN', sessions: 450 }, { day: 'T2', sessions: 800 },
                    { day: 'T3', sessions: 850 }, { day: 'T4', sessions: 920 },
                    { day: 'T5', sessions: 880 }, { day: 'T6', sessions: 750 },
                    { day: 'T7', sessions: 520 }
                ]);
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
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <Heading level={2} className="text-heading text-2xl md:text-3xl mb-1">Tổng Quan Nền Tảng</Heading>
                <p className="text-body mt-2">Theo dõi các chỉ số quan trọng của EduKids</p>
            </motion.div>

            {/* Platform metrics */}
            <DashboardMetrics platformMetrics={platformMetrics} />

            {/* Two-column: chart + content table */}
            <div className="grid lg:grid-cols-3 gap-6">
                <WeeklySessionsChart weeklyData={weeklyData} maxSessions={maxSessions} />
                <ContentStatsTable contentStats={contentStats} />
            </div>

            {/* Recent users */}
            <RecentUsersTable recentUsers={recentUsers} />
        </div>
    );
}
