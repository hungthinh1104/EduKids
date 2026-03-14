'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import axios from 'axios';
import { BookOpen, Flame, Mic, Trophy, Star, TrendingUp, Calendar, Send, Mail, CheckCircle2, Download, Bell, Loader2 } from 'lucide-react';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { useChildProfiles, useChildAnalytics } from '@/features/dashboard/hooks/useChildProfiles';
import { 
  sendReport,
  getReportPreferences, 
  subscribeToReports,
  unsubscribeFromReports,
  type ReportPreferences 
} from '@/features/reports/api/reports.api';

const RANGE_OPTIONS = ['7 ngày', '30 ngày', 'Tất cả'];

const fadeUp = { hidden: { opacity: 1, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

export default function ReportsPage() {
    const { profiles } = useChildProfiles();
    const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
    const [range, setRange] = useState('7 ngày');
    const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [sendError, setSendError] = useState<string | null>(null);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [subscriptionPrefs, setSubscriptionPrefs] = useState<ReportPreferences | null>(null);
    const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
    const [isSavingPrefs, setIsSavingPrefs] = useState(false);
    const [subscriptionMessage, setSubscriptionMessage] = useState<string | null>(null);

    const analyticsPeriod: 'WEEK' | 'MONTH' | 'ALL' =
        range === '30 ngày' ? 'MONTH' : range === 'Tất cả' ? 'ALL' : 'WEEK';


    const activeChild = useMemo(
        () => profiles.find((p) => p.id === selectedChildId) ?? profiles[0],
        [profiles, selectedChildId],
    );

    useEffect(() => {
        getReportPreferences()
            .then(setSubscriptionPrefs)
            .catch(() => setSubscriptionPrefs(null))
            .finally(() => setIsLoadingPrefs(false));
    }, []);

    async function toggleReportChannel(channel: 'email' | 'zalo', enabled: boolean) {
        setIsSavingPrefs(true);
        setSubscriptionMessage(null);
        try {
            const nextPrefs = enabled
                ? await subscribeToReports(channel)
                : await (async () => {
                    await unsubscribeFromReports();
                    return getReportPreferences();
                })();

            setSubscriptionPrefs(nextPrefs);
            setSubscriptionMessage(
                enabled
                    ? `Đã bật gửi báo cáo tự động qua ${channel === 'zalo' ? 'Zalo' : 'email'}.`
                    : 'Đã tắt gửi báo cáo tự động.'
            );
        } catch (err) {
            console.error(`Failed to ${enabled ? 'enable' : 'disable'} ${channel} reports:`, err);
            setSubscriptionMessage('Không thể cập nhật cài đặt gửi báo cáo. Vui lòng thử lại.');
        } finally {
            setIsSavingPrefs(false);
        }
    }

    async function handleSendReport() {
        if (!activeChild) return;
        setSendStatus('sending');
        setSendError(null);

        try {
            const period = 'weekly' as const;
            await sendReport(activeChild.id, period);

            setSendStatus('sent');
            setTimeout(() => setSendStatus('idle'), 4000);
        } catch (error: unknown) {
            setSendStatus('error');
            if (axios.isAxiosError(error)) {
                setSendError(
                    String(
                        error.response?.data?.message ||
                            'Không thể gửi báo cáo lúc này. Vui lòng thử lại.',
                    ),
                );
            } else {
                setSendError('Không thể gửi báo cáo lúc này. Vui lòng thử lại.');
            }
            setTimeout(() => setSendStatus('idle'), 4000);
        }
    }

    const handleExportPDF = () => {
        window.print();
    };

    const { analytics } = useChildAnalytics(activeChild?.id ?? 1, analyticsPeriod);
    const masteredWords = (analytics?.pronunciation.mostImprovedWords ?? []).map((item, index) => ({
        vocabularyId: index + 1,
        word: item.word,
        phonetic: '',
        translation: `Cải thiện ${item.improvement}%`,
        easeFactor: Math.max(1.3, Math.min(3, item.improvement / 20 + 1.5)),
    }));
    const recentBadges = (analytics?.gamification.recentBadges ?? []).map((item, index) => ({
        id: index + 1,
        name: item.name,
        description: 'Đạt được từ tiến trình học tập gần đây',
        icon: '🏆',
        earnedAt: item.earnedAt,
    }));

    const allChartData = analytics?.learningTime.chartData ?? [];
    const chartData =
        range === '7 ngày'
            ? allChartData.slice(-7)
            : range === '30 ngày'
                ? allChartData.slice(-30)
                : allChartData;
    const maxMinutes = Math.max(...chartData.map((d) => d.value), 1);
    const summaryCards = [
        {
            icon: <BookOpen size={22} />,
            label: 'Từ đã học',
            value: analytics?.vocabulary.wordsMastered ?? 0,
            sub: 'từ vựng mới',
            color: 'text-primary',
            bg: 'bg-primary-light',
        },
        {
            icon: <Flame size={22} />,
            label: 'Học liên tục',
            value: activeChild?.streakDays ?? 0,
            sub: 'ngày streak',
            color: 'text-warning',
            bg: 'bg-warning-light',
        },
        {
            icon: <Mic size={22} />,
            label: 'Điểm phát âm',
            value: `${analytics?.pronunciation.averageAccuracy ?? 0}%`,
            sub: 'điểm trung bình',
            color: 'text-success',
            bg: 'bg-success-light',
        },
        {
            icon: <Trophy size={22} />,
            label: 'Tổng XP',
            value: (activeChild?.totalPoints ?? 0).toLocaleString(),
            sub: 'điểm kinh nghiệm',
            color: 'text-accent',
            bg: 'bg-accent-light',
        },
    ];
    const subscriptionLabel =
        subscriptionPrefs?.preferredChannel === 'ZALO'
            ? 'Zalo'
            : subscriptionPrefs?.preferredChannel === 'EMAIL'
                ? 'Email'
                : 'Chưa bật';
    const immediateChannelLabel =
        subscriptionPrefs?.preferredChannel === 'ZALO' ? 'Zalo' : 'email';

    return (
        <div className="space-y-8 pb-8">
            {/* Header */}
            <motion.div initial={{ opacity: 1, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
                <div>
                    <Heading level={2} className="text-heading text-3xl mb-1">Báo cáo học tập 📊</Heading>
                    <Body className="text-body">Theo dõi hành trình tiến bộ của bé</Body>
                    <Caption className="text-caption text-xs mt-2 block">
                        Gửi tự động: {subscriptionPrefs?.isSubscribed ? `${subscriptionLabel} lúc ${String(subscriptionPrefs.reportHour ?? 9).padStart(2, '0')}:00` : 'Chưa bật'}
                    </Caption>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowSubscriptionModal(true)} 
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border rounded-xl text-sm font-heading font-bold text-body hover:bg-purple-50 hover:border-purple-400 transition-colors shadow-sm print:hidden"
                    >
                        <Bell size={16} /> {subscriptionPrefs?.isSubscribed ? 'Chỉnh lịch gửi tự động' : 'Thiết lập gửi tự động'}
                    </button>
                    <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border rounded-xl text-sm font-heading font-bold text-body hover:bg-primary hover:text-white hover:border-primary transition-colors shadow-sm print:hidden">
                        <Download size={16} /> Xuất PDF
                    </button>
                </div>
            </motion.div>

            {/* Child Selector Tabs */}
            <div className="flex gap-3 overflow-x-auto pb-1">
                {profiles.map((p) => (
                    <motion.button
                        key={p.id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedChildId(p.id)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border-2 font-heading font-bold text-sm whitespace-nowrap transition-all ${activeChild?.id === p.id
                            ? 'bg-primary-light border-primary text-primary shadow-md shadow-primary/15'
                            : 'bg-card border-border text-body hover:border-primary/40'
                            }`}
                    >
                        <Image
                            src={p.avatar}
                            alt={p.nickname}
                            width={24}
                            height={24}
                            className="rounded-full"
                        />
                        {p.nickname}
                    </motion.button>
                ))}
            </div>

            {profiles.length === 0 ? (
                <div className="bg-card border-2 border-border rounded-2xl p-8 text-center">
                    <Heading level={4} className="text-heading text-xl mb-2">Chưa có hồ sơ bé</Heading>
                    <Body className="text-body">Tài khoản hiện tại chưa có child profile nên chưa có dữ liệu báo cáo.</Body>
                </div>
            ) : !analytics?.hasData ? (
                <div className="bg-card border-2 border-border rounded-2xl p-8 text-center">
                    <Heading level={4} className="text-heading text-xl mb-2">Chưa có dữ liệu báo cáo</Heading>
                    <Body className="text-body">{analytics?.insightMessage || 'Bé cần hoàn thành một số bài học để hiển thị báo cáo.'}</Body>
                </div>
            ) : (
                <>
                    {/* Summary Stats */}
                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                        {summaryCards.map((s, i) => (
                            <motion.div key={i} variants={fadeUp} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-sm rounded-[2rem] p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>{s.icon}</div>
                                <div>
                                    <div className={`text-2xl font-heading font-black ${s.color}`}>{s.value}</div>
                                    <Caption className="text-caption text-xs">{s.label}</Caption>
                                    <Caption className="text-caption text-[10px] opacity-70">{s.sub}</Caption>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Activity chart with range selector */}
                    <motion.div initial={{ opacity: 1, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] p-8 mt-6 mb-8">
                        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={20} className="text-primary" />
                                <Heading level={4} className="text-heading text-lg">Thời gian học mỗi ngày</Heading>
                            </div>
                            <div className="flex gap-1.5">
                                {RANGE_OPTIONS.map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => setRange(opt)}
                                        className={`px-3 py-1 rounded-xl text-xs font-heading font-bold border-2 transition-all ${range === opt ? 'border-primary bg-primary-light text-primary' : 'border-border text-body hover:border-primary/40'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-end justify-between gap-1.5 h-36">
                            {chartData.map((pt, i) => {
                                const heightPct = (pt.value / maxMinutes) * 100;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                                        <span className="text-caption text-[10px] opacity-0 group-hover:opacity-100 transition-opacity font-bold">{pt.value}p</span>
                                        <motion.div
                                            initial={{ height: 0 }}
                                            whileInView={{ height: `${heightPct}%` }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.7, delay: i * 0.06, ease: 'easeOut' }}
                                            className="w-full min-h-1 bg-gradient-to-t from-primary to-accent rounded-t-lg group-hover:from-primary-dark transition-colors"
                                        />
                                        <Caption className="text-[11px]">{pt.label}</Caption>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Two-column: Mastered words + Badges */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        {/* Mastered Vocabulary */}
                        <motion.div initial={{ opacity: 1, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] p-8">
                            <div className="flex items-center gap-2 mb-5">
                                <Star size={20} className="text-star fill-star" />
                                <Heading level={4} className="text-heading text-lg">Từ đã thuộc tốt nhất</Heading>
                            </div>
                            <div className="space-y-3">
                                {masteredWords.slice(0, 5).map((v, i) => {
                                    const score = Math.min(100, Math.round(v.easeFactor * 30));
                                    return (
                                        <motion.div
                                            key={v.vocabularyId}
                                            initial={{ opacity: 1, x: -10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.06 }}
                                            whileHover={{ x: 4, backgroundColor: 'rgba(var(--color-primary), 0.05)' }}
                                            className="flex items-center justify-between py-3 px-3 rounded-2xl border border-transparent hover:border-primary/20 transition-all cursor-default"
                                        >
                                            <div>
                                                <span className="font-heading font-black text-heading text-base mr-2">{v.word}</span>
                                                <span className="text-caption text-xs">{v.phonetic}</span>
                                                <div className="text-body text-sm mt-0.5">{v.translation}</div>
                                            </div>
                                            <div className={`text-sm font-heading font-black px-2.5 py-1 rounded-xl ${score >= 95 ? 'bg-success-light text-success' : score >= 88 ? 'bg-primary-light text-primary' : 'bg-warning-light text-warning'
                                                }`}>
                                                {score}%
                                            </div>
                                        </motion.div>
                                    );
                                })}
                                {masteredWords.length === 0 && <Caption className="text-sm block py-4 text-center">Bé chưa có từ nào đạt mức thuần thục</Caption>}
                            </div>
                        </motion.div>
                        {/* Recent Badges */}
                        <motion.div initial={{ opacity: 1, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] p-8">
                            <div className="flex items-center gap-2 mb-5">
                                <Trophy size={20} className="text-accent" />
                                <Heading level={4} className="text-heading text-lg">Huy hiệu gần đây</Heading>
                            </div>
                            <div className="space-y-4">
                                {recentBadges.slice(0, 5).map((b, i) => (
                                    <motion.div
                                        key={b.id}
                                        initial={{ opacity: 1, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-center gap-4"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-warning-light flex items-center justify-center text-3xl flex-shrink-0 shadow-sm">
                                            {b.icon || '🏆'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-heading font-black text-heading text-sm">{b.name}</div>
                                            <Caption className="text-caption text-xs">{b.description}</Caption>
                                        </div>
                                        <div className="flex items-center gap-1 text-caption text-xs flex-shrink-0">
                                            <Calendar size={11} />
                                            {new Date(b.earnedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                        </div>
                                    </motion.div>
                                ))}
                                {recentBadges.length === 0 && <Caption className="text-sm block py-4 text-center">Bé chưa nhận được huy hiệu nào</Caption>}
                            </div>
                        </motion.div>
                    </div>

                    {/* UC-09: Send Report ─────────────────────────────── */}
                    <motion.div initial={{ opacity: 1, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="bg-card border-2 border-border rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Mail size={20} className="text-primary" />
                            <Heading level={4} className="text-heading text-lg">Gửi báo cáo ngay</Heading>
                        </div>
                        <Body className="text-body text-sm mb-4">
                            Gửi ngay báo cáo học tập của <strong>{activeChild?.nickname}</strong> qua {immediateChannelLabel} hiện tại của bạn.
                        </Body>

                        {/* Schedule picker */}
                        <div className="flex gap-2 mb-5">
                            <button
                                disabled
                                className="px-4 py-2 rounded-xl font-heading font-bold text-sm border-2 transition-all bg-primary-light border-primary text-primary cursor-default"
                            >
                                📅 Hàng tuần
                            </button>
                        </div>

                        <button onClick={handleSendReport} disabled={sendStatus !== 'idle'}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-heading font-black text-sm transition-all ${sendStatus === 'sent' ? 'bg-success text-white' :
                                sendStatus === 'error' ? 'bg-error text-white' :
                                    sendStatus === 'sending' ? 'bg-primary/60 text-white cursor-wait' :
                                        'bg-primary text-white hover:bg-primary-dark'
                                }`}
                        >
                            {sendStatus === 'sent' ? <><CheckCircle2 size={16} /> Đã gửi thành công!</> :
                                sendStatus === 'error' ? <><Mail size={16} /> Gửi thất bại</> :
                                    sendStatus === 'sending' ? <><Send size={16} className="animate-spin" /> Đang gửi...</> :
                                        <><Send size={16} /> Gửi báo cáo ngay</>}
                        </button>
                        {sendError && (
                            <Caption className="text-error text-xs mt-2 text-center">
                                {sendError}
                            </Caption>
                        )}
                        <Caption className="text-caption text-xs mt-2 text-center">
                            Gửi ngay dùng child đang chọn. Lịch gửi tự động ở trên áp dụng cho tài khoản phụ huynh, không tách riêng theo từng bé.
                        </Caption>
                    </motion.div>
                </>
            )}

            {/* Subscription Modal */}
            {showSubscriptionModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-gray-800">Cài đặt gửi báo cáo</h3>
                            <button
                                onClick={() => setShowSubscriptionModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                ✕
                            </button>
                        </div>

                        {isLoadingPrefs ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                                <p className="mt-4 text-gray-600">Đang tải...</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                    {subscriptionPrefs?.isSubscribed
                                        ? `Hiện đang bật gửi tự động qua ${subscriptionLabel} vào ${String(subscriptionPrefs.reportHour ?? 9).padStart(2, '0')}:00 mỗi tuần.`
                                        : 'Hiện tại bạn chưa bật gửi báo cáo tự động.'}
                                </div>

                                {/* Email Subscription */}
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-6 h-6 text-blue-600" />
                                            <span className="font-bold text-gray-800">Email</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={subscriptionPrefs?.emailEnabled ?? false}
                                                onChange={async (e) => {
                                                    const enabled = e.target.checked;

                                                    try {
                                                        await toggleReportChannel('email', enabled);
                                                    } catch (err) {
                                                        console.error('Failed to update email subscription:', err);
                                                    }
                                                }}
                                                disabled={isSavingPrefs}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                    <p className="text-sm text-gray-600">Nhận báo cáo qua email mỗi tuần</p>
                                </div>

                                {/* Zalo Subscription */}
                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <Bell className="w-6 h-6 text-green-600" />
                                            <span className="font-bold text-gray-800">Zalo</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={subscriptionPrefs?.zaloEnabled ?? false}
                                                onChange={async (e) => {
                                                    const enabled = e.target.checked;

                                                    try {
                                                        await toggleReportChannel('zalo', enabled);
                                                    } catch (err) {
                                                        console.error('Failed to update Zalo subscription:', err);
                                                    }
                                                }}
                                                disabled={isSavingPrefs}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>
                                    <p className="text-sm text-gray-600">Nhận báo cáo qua Zalo mỗi tuần</p>
                                </div>

                                {/* Frequency Selector */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Tần suất gửi</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        <button
                                            disabled
                                            className="px-4 py-3 rounded-xl font-bold text-sm transition bg-purple-600/90 text-white shadow-lg cursor-not-allowed"
                                        >
                                            Hàng tuần
                                        </button>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500">Hiện tại hệ thống hỗ trợ gửi báo cáo tự động theo tuần.</p>
                                    {subscriptionPrefs?.isSubscribed && (
                                        <p className="mt-2 text-xs text-gray-600">
                                            Kênh hiện tại: {subscriptionPrefs.preferredChannel === 'ZALO' ? 'Zalo' : 'Email'}
                                            {' • '}
                                            Thời gian: {String(subscriptionPrefs.reportHour ?? 9).padStart(2, '0')}:00
                                            {subscriptionPrefs.lastReportSentAt ? (
                                                <>
                                                    {' • '}
                                                    Lần gần nhất: {new Date(subscriptionPrefs.lastReportSentAt).toLocaleDateString('vi-VN')}
                                                </>
                                            ) : null}
                                        </p>
                                    )}
                                </div>

                                {subscriptionMessage && (
                                    <div className={`rounded-2xl px-4 py-3 text-sm ${subscriptionMessage.includes('Không thể') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                                        {subscriptionMessage}
                                    </div>
                                )}

                                {isSavingPrefs && (
                                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                                        <Loader2 size={16} className="animate-spin" />
                                        Đang lưu cài đặt...
                                    </div>
                                )}

                                <button
                                    onClick={() => setShowSubscriptionModal(false)}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition transform hover:scale-105"
                                >
                                    Xong
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </div>
    );
}
