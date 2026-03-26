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
  updateReportPreferences,
  subscribeToReports,
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
        if (!profiles.length) return;
        if (selectedChildId === null || !profiles.some((p) => p.id === selectedChildId)) {
            setSelectedChildId(profiles[0].id);
        }
    }, [profiles, selectedChildId]);

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
                : await getReportPreferences();

            setSubscriptionPrefs(nextPrefs);
            setSubscriptionMessage(
                enabled
                    ? `Đã bật gửi báo cáo tự động qua ${channel === 'zalo' ? 'Zalo' : 'email'}.`
                    : 'Đã cập nhật cài đặt gửi báo cáo.'
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
            <motion.div initial={{ opacity: 1, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                    <Heading level={2} className="text-heading text-2xl md:text-3xl mb-1">Báo cáo học tập 📊</Heading>
                    <Body className="text-body text-sm md:text-base">Theo dõi hành trình tiến bộ của bé</Body>
                    <Caption className="text-caption text-xs mt-2 block">
                        Gửi tự động: {subscriptionPrefs?.isSubscribed ? `${subscriptionLabel} lúc ${String(subscriptionPrefs.reportHour ?? 9).padStart(2, '0')}:00` : 'Chưa bật'}
                    </Caption>
                </div>
                <div className="flex gap-2 flex-wrap md:flex-nowrap">
                    <button 
                        onClick={() => setShowSubscriptionModal(true)} 
                        className="flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 bg-card border border-border rounded-xl text-xs md:text-sm font-heading font-bold text-body hover:bg-purple-50 hover:border-purple-400 transition-colors shadow-sm print:hidden flex-1 md:flex-none whitespace-nowrap"
                    >
                        <Bell size={14} className="md:w-4 md:h-4" /> <span className="hidden md:inline">{subscriptionPrefs?.isSubscribed ? 'Chỉnh lịch gửi tự động' : 'Thiết lập gửi tự động'}</span>
                        <span className="md:hidden">Lịch gửi</span>
                    </button>
                    <button onClick={handleExportPDF} className="flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 bg-card border border-border rounded-xl text-xs md:text-sm font-heading font-bold text-body hover:bg-primary hover:text-white hover:border-primary transition-colors shadow-sm print:hidden flex-1 md:flex-none whitespace-nowrap">
                        <Download size={14} className="md:w-4 md:h-4" /> <span className="hidden md:inline">Xuất PDF</span>
                        <span className="md:hidden">PDF</span>
                    </button>
                </div>
            </motion.div>

                    <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 -mx-4 md:mx-0 px-4 md:px-0 scrollbar-hide">
                {profiles.map((p) => (
                    <motion.button
                        key={p.id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedChildId(p.id)}
                        className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-2xl border-2 font-heading font-bold text-xs md:text-sm whitespace-nowrap transition-all flex-shrink-0 ${activeChild?.id === p.id
                            ? 'bg-primary-light border-primary text-primary shadow-md shadow-primary/15'
                            : 'bg-card border-border text-body hover:border-primary/40'
                            }`}
                    >
                        <Image
                            src={p.avatar}
                            alt={`Avatar của ${p.nickname}`}
                            width={20}
                            height={20}
                            className="rounded-full w-5 h-5 md:w-6 md:h-6"
                            loading="lazy"
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
                        className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-4"
                    >
                        {summaryCards.map((s, i) => (
                            <motion.div key={i} variants={fadeUp} className="bg-card/60 dark:bg-card/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-sm rounded-[1.5rem] md:rounded-[2rem] p-3 md:p-5 flex flex-col gap-2 md:gap-3 hover:shadow-md transition-shadow">
                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg} ${s.color}`}>
                                    <span className="text-sm md:text-base">{s.icon}</span>
                                </div>
                                <div className="min-w-0">
                                    <div className={`text-lg md:text-2xl font-heading font-black ${s.color} truncate`}>{s.value}</div>
                                    <Caption className="text-caption text-[10px] md:text-xs line-clamp-1">{s.label}</Caption>
                                    <Caption className="text-caption text-[8px] md:text-[10px] opacity-70 line-clamp-1">{s.sub}</Caption>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Activity chart with range selector */}
                    <motion.div initial={{ opacity: 1, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card/60 dark:bg-card/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-8 mt-6 mb-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-5 mb-5">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={18} className="md:w-5 md:h-5 text-primary flex-shrink-0" />
                                <Heading level={4} className="text-heading text-base md:text-lg">Thời gian học mỗi ngày</Heading>
                            </div>
                            <div className="flex gap-1.5 overflow-x-auto">
                                {RANGE_OPTIONS.map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => setRange(opt)}
                                        className={`px-2 md:px-3 py-1 rounded-lg md:rounded-xl text-[10px] md:text-xs font-heading font-bold border-2 transition-all flex-shrink-0 ${range === opt ? 'border-primary bg-primary-light text-primary' : 'border-border text-body hover:border-primary/40'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-end justify-between gap-1 md:gap-1.5 h-32 md:h-36">
                            {chartData.map((pt, i) => {
                                const heightPct = (pt.value / maxMinutes) * 100;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1 md:gap-1.5 group">
                                        <span className="text-caption text-[8px] md:text-[10px] opacity-0 group-hover:opacity-100 transition-opacity font-bold">{pt.value}p</span>
                                        <motion.div
                                            initial={{ height: 0 }}
                                            whileInView={{ height: `${heightPct}%` }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.7, delay: i * 0.06, ease: 'easeOut' }}
                                            className="w-full min-h-0.5 md:min-h-1 bg-gradient-to-t from-primary to-accent rounded-t-lg group-hover:from-primary-dark transition-colors"
                                        />
                                        <Caption className="text-[9px] md:text-[11px]">{pt.label}</Caption>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Two-column: Mastered words + Badges */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
                        {/* Mastered Vocabulary */}
                        <motion.div initial={{ opacity: 1, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-card/60 dark:bg-card/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-8">
                            <div className="flex items-center gap-2 mb-4 md:mb-5">
                                <Star size={18} className="md:w-5 md:h-5 text-star fill-star flex-shrink-0" />
                                <Heading level={4} className="text-heading text-base md:text-lg">Từ đã thuộc tốt nhất</Heading>
                            </div>
                            <div className="space-y-2 md:space-y-3">
                                {masteredWords.slice(0, 5).map((v, i) => {
                                    const score = Math.min(100, Math.round(v.easeFactor * 30));
                                    return (
                                        <motion.div
                                            key={v.vocabularyId}
                                            initial={{ opacity: 1, x: -10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.06 }}
                                            whileHover={{ x: 2, backgroundColor: 'rgba(var(--color-primary), 0.05)' }}
                                            className="flex items-center justify-between py-2 md:py-3 px-2 md:px-3 rounded-xl md:rounded-2xl border border-transparent hover:border-primary/20 transition-all cursor-default gap-2"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <span className="font-heading font-black text-heading text-sm md:text-base mr-1 md:mr-2 line-clamp-1">{v.word}</span>
                                                <span className="text-caption text-xs md:text-xs">{v.phonetic}</span>
                                                <div className="text-body text-xs md:text-sm mt-0.5 line-clamp-1">{v.translation}</div>
                                            </div>
                                            <div className={`text-xs md:text-sm font-heading font-black px-2 md:px-2.5 py-1 rounded-lg md:rounded-xl whitespace-nowrap flex-shrink-0 ${score >= 95 ? 'bg-success-light text-success' : score >= 88 ? 'bg-primary-light text-primary' : 'bg-warning-light text-warning'
                                                }`}>
                                                {score}%
                                            </div>
                                        </motion.div>
                                    );
                                })}
                                {masteredWords.length === 0 && <Caption className="text-xs md:text-sm block py-3 md:py-4 text-center">Bé chưa có từ nào đạt mức thuần thục</Caption>}
                            </div>
                        </motion.div>
                        {/* Recent Badges */}
                        <motion.div initial={{ opacity: 1, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-card/60 dark:bg-card/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-8">
                            <div className="flex items-center gap-2 mb-4 md:mb-5">
                                <Trophy size={18} className="md:w-5 md:h-5 text-accent flex-shrink-0" />
                                <Heading level={4} className="text-heading text-base md:text-lg">Huy hiệu gần đây</Heading>
                            </div>
                            <div className="space-y-3 md:space-y-4">
                                {recentBadges.slice(0, 5).map((b, i) => (
                                    <motion.div
                                        key={b.id}
                                        initial={{ opacity: 1, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-center gap-3 md:gap-4"
                                    >
                                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-warning-light flex items-center justify-center text-2xl md:text-3xl flex-shrink-0 shadow-sm">
                                            {b.icon || '🏆'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-heading font-black text-heading text-xs md:text-sm line-clamp-1">{b.name}</div>
                                            <Caption className="text-caption text-[10px] md:text-xs line-clamp-2">{b.description}</Caption>
                                        </div>
                                        <div className="flex items-center gap-1 text-caption text-[9px] md:text-xs flex-shrink-0 whitespace-nowrap">
                                            <Calendar size={10} className="md:w-2.5 md:h-2.5" />
                                            {new Date(b.earnedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                        </div>
                                    </motion.div>
                                ))}
                                {recentBadges.length === 0 && <Caption className="text-xs md:text-sm block py-3 md:py-4 text-center">Bé chưa nhận được huy hiệu nào</Caption>}
                            </div>
                        </motion.div>
                    </div>

                    {/* UC-09: Send Report ─────────────────────────────── */}
                    <motion.div initial={{ opacity: 1, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="bg-card border-2 border-border rounded-2xl p-4 md:p-6"
                    >
                        <div className="flex items-center gap-2 mb-3 md:mb-4">
                            <Mail size={18} className="md:w-5 md:h-5 text-primary flex-shrink-0" />
                            <Heading level={4} className="text-heading text-base md:text-lg">Gửi báo cáo ngay</Heading>
                        </div>
                        <Body className="text-body text-xs md:text-sm mb-3 md:mb-4">
                            Gửi ngay báo cáo học tập của <strong>{activeChild?.nickname}</strong> qua {immediateChannelLabel} hiện tại của bạn.
                        </Body>

                        {/* Schedule picker */}
                        <div className="flex gap-2 mb-4 md:mb-5">
                            <button
                                disabled
                                className="px-3 md:px-4 py-2 rounded-lg md:rounded-xl font-heading font-bold text-xs md:text-sm border-2 transition-all bg-primary-light border-primary text-primary cursor-default"
                            >
                                📅 Hàng tuần
                            </button>
                        </div>

                        <button onClick={handleSendReport} disabled={sendStatus !== 'idle'}
                            className={`w-full flex items-center justify-center gap-2 py-2.5 md:py-3 rounded-lg md:rounded-2xl font-heading font-black text-xs md:text-sm transition-all ${sendStatus === 'sent' ? 'bg-success text-white' :
                                sendStatus === 'error' ? 'bg-error text-white' :
                                    sendStatus === 'sending' ? 'bg-primary/60 text-white cursor-wait' :
                                        'bg-primary text-white hover:bg-primary-dark'
                                }`}
                        >
                            {sendStatus === 'sent' ? <><CheckCircle2 size={14} className="md:w-4 md:h-4" /> Đã gửi thành công!</> :
                                sendStatus === 'error' ? <><Mail size={14} className="md:w-4 md:h-4" /> Gửi thất bại</> :
                                    sendStatus === 'sending' ? <><Send size={14} className="md:w-4 md:h-4 animate-spin" /> Đang gửi...</> :
                                        <><Send size={14} className="md:w-4 md:h-4" /> Gửi báo cáo ngay</>}
                        </button>
                        {sendError && (
                            <Caption className="text-error text-[10px] md:text-xs mt-2 text-center">
                                {sendError}
                            </Caption>
                        )}
                        <Caption className="text-caption text-[9px] md:text-xs mt-2 text-center">
                            Gửi ngay dùng child đang chọn. Lịch gửi tự động ở trên áp dụng cho tài khoản phụ huynh, không tách riêng theo từng bé.
                        </Caption>
                    </motion.div>
                </>
            )}

            {/* Subscription Modal */}
            {showSubscriptionModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 1, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-4 md:mb-6">
                            <h3 className="text-lg md:text-2xl font-bold text-heading">Cài đặt gửi báo cáo</h3>
                            <button
                                onClick={() => setShowSubscriptionModal(false)}
                                className="text-muted hover:text-body dark:hover:text-gray-300 transition text-lg"
                            >
                                ✕
                            </button>
                        </div>

                        {isLoadingPrefs ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                                <p className="mt-4 text-body dark:text-muted text-sm">Đang tải...</p>
                            </div>
                        ) : (
                            <div className="space-y-4 md:space-y-6">
                                <div className="rounded-lg md:rounded-2xl bg-background dark:bg-card px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-body">
                                    {subscriptionPrefs?.isSubscribed
                                        ? `Hiện đang bật gửi tự động qua ${subscriptionLabel} vào ${String(subscriptionPrefs.reportHour ?? 9).padStart(2, '0')}:00 mỗi tuần.`
                                        : 'Hiện tại bạn chưa bật gửi báo cáo tự động.'}
                                </div>

                                <p className="text-xs md:text-sm font-bold text-heading dark:text-body">
                                    Chọn kênh nhận báo cáo tự động
                                </p>
                                <p className="mt-1 text-[10px] md:text-xs text-muted">
                                    Hệ thống chỉ hỗ trợ một kênh tại một thời điểm.
                                </p>

                                {/* Email Subscription */}
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg md:rounded-2xl p-3 md:p-4">
                                    <div className="flex items-center justify-between mb-2 md:mb-3">
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <Mail className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                            <span className="font-bold text-xs md:text-sm text-heading">Email</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="report-channel"
                                                checked={subscriptionPrefs?.preferredChannel === 'EMAIL'}
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
                                            <div className="w-10 h-6 md:w-11 md:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                    <p className="text-xs md:text-sm text-body dark:text-muted">Nhận báo cáo qua email mỗi tuần</p>
                                </div>

                                {/* Zalo Subscription */}
                                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg md:rounded-2xl p-3 md:p-4">
                                    <div className="flex items-center justify-between mb-2 md:mb-3">
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <Bell className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                                            <span className="font-bold text-xs md:text-sm text-heading">Zalo</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="report-channel"
                                                checked={subscriptionPrefs?.preferredChannel === 'ZALO'}
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
                                            <div className="w-10 h-6 md:w-11 md:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>
                                    <p className="text-xs md:text-sm text-body dark:text-muted">Nhận báo cáo qua Zalo mỗi tuần</p>
                                </div>

                                <button
                                    type="button"
                                    onClick={async () => {
                                        setIsSavingPrefs(true);
                                        setSubscriptionMessage(null);
                                        try {
                                            const nextPrefs = await updateReportPreferences({
                                                emailEnabled: false,
                                                zaloEnabled: false,
                                            });
                                            setSubscriptionPrefs(nextPrefs);
                                            setSubscriptionMessage('Đã tắt gửi báo cáo tự động.');
                                        } catch (err) {
                                            console.error('Failed to unsubscribe reports:', err);
                                            setSubscriptionMessage('Không thể tắt gửi báo cáo tự động. Vui lòng thử lại.');
                                        } finally {
                                            setIsSavingPrefs(false);
                                        }
                                    }}
                                    disabled={isSavingPrefs || !subscriptionPrefs?.isSubscribed}
                                    className="w-full rounded-lg md:rounded-xl border border-border bg-card px-4 py-2.5 text-xs md:text-sm font-bold text-body transition disabled:opacity-50"
                                >
                                    Tắt báo cáo tự động
                                </button>

                                {/* Frequency Selector */}
                                <div>
                                    <label className="block text-xs md:text-sm font-bold text-heading dark:text-body mb-2">Tần suất gửi</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        <button
                                            disabled
                                            className="px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl font-bold text-xs md:text-sm transition bg-purple-600/90 text-white shadow-lg cursor-not-allowed"
                                        >
                                            Hàng tuần
                                        </button>
                                    </div>
                                    <p className="mt-2 text-[10px] md:text-xs text-muted">Hiện tại hệ thống hỗ trợ gửi báo cáo tự động theo tuần.</p>
                                    {subscriptionPrefs?.isSubscribed && (
                                        <p className="mt-2 text-[10px] md:text-xs text-body dark:text-muted">
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
                                    <div className={`rounded-lg md:rounded-2xl px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm ${subscriptionMessage.includes('Không thể') ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}>
                                        {subscriptionMessage}
                                    </div>
                                )}

                                {isSavingPrefs && (
                                    <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-muted">
                                        <Loader2 size={14} className="md:w-4 md:h-4 animate-spin" />
                                        Đang lưu cài đặt...
                                    </div>
                                )}

                                <button
                                    onClick={() => setShowSubscriptionModal(false)}
                                    className="w-full px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs md:text-sm rounded-lg md:rounded-xl shadow-lg hover:shadow-xl transition transform hover:scale-105"
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
