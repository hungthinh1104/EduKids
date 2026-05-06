'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
    ArrowLeft,
    Brain,
    Mic,
    HelpCircle,
    Play,
    Star,
    Lock,
    CheckCircle2,
    BookOpen,
    Video,
    Sparkles,
} from 'lucide-react';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { LoadingScreen } from '@/components/edukids/LoadingScreen';
import { contentApi, Topic } from '@/features/learning/api/content.api';
import { readTopicModeProgress, type TopicModeProgress } from '@/features/learning/utils/topic-mode-progress';

type GameModeId = 'flashcard' | 'quiz' | 'pronunciation' | 'video';
type TrackedModeId = 'flashcard' | 'quiz' | 'pronunciation';
type GameMode = { id: GameModeId; icon: React.ReactNode; label: string; desc: string; color: string; locked: boolean };

const BASE_GAME_MODES: Omit<GameMode, 'locked'>[] = [
    { id: 'flashcard', icon: <Brain size={28} />, label: 'Flashcard', desc: 'Lật thẻ học từ vựng', color: 'success' },
    { id: 'quiz', icon: <HelpCircle size={28} />, label: 'Quiz Game', desc: 'Chọn đáp án đúng', color: 'primary' },
    { id: 'pronunciation', icon: <Mic size={28} />, label: 'Phát âm AI', desc: 'Luyện phát âm chuẩn', color: 'accent' },
    { id: 'video', icon: <Play size={28} />, label: 'Video Bài Giảng', desc: 'Xem hoạt hình', color: 'warning' },
];

const COLOR_MAP: Record<string, { bg: string; light: string; text: string; border: string }> = {
    primary: { bg: 'bg-primary', light: 'bg-primary-light', text: 'text-primary', border: 'border-primary' },
    success: { bg: 'bg-success', light: 'bg-success-light', text: 'text-success', border: 'border-success' },
    accent: { bg: 'bg-accent', light: 'bg-accent-light', text: 'text-accent', border: 'border-accent' },
    warning: { bg: 'bg-warning', light: 'bg-warning-light', text: 'text-warning', border: 'border-warning' },
};

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
const TRACKED_MODE_IDS: TrackedModeId[] = ['flashcard', 'quiz', 'pronunciation'];

export default function TopicDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params?.id ?? '';
    const parsedTopicId = Number.parseInt(id, 10);
    const [topic, setTopic] = useState<Topic | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [is403, setIs403] = useState(false);
    const [modeProgress, setModeProgress] = useState<TopicModeProgress>({
        flashcard: false,
        quiz: false,
        pronunciation: false,
        updatedAt: null,
    });

    useEffect(() => {
        if (!Number.isInteger(parsedTopicId) || parsedTopicId <= 0) {
            return;
        }

        setModeProgress(readTopicModeProgress(parsedTopicId));

        const onStorage = () => setModeProgress(readTopicModeProgress(parsedTopicId));
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [parsedTopicId]);

    useEffect(() => {
        async function fetchTopic() {
            try {
                setLoading(true);
                setError(null);
                setIs403(false);
                if (!Number.isInteger(parsedTopicId) || parsedTopicId <= 0) {
                    setError('Chủ đề không hợp lệ');
                    return;
                }
                const data = await contentApi.getTopicById(parsedTopicId);
                setTopic(data);
            } catch (err: unknown) {
                console.error('Failed to fetch topic:', err);

                const status =
                    typeof err === 'object' &&
                    err !== null &&
                    'response' in err &&
                    typeof (err as { response?: { status?: unknown } }).response?.status === 'number'
                        ? (err as { response?: { status?: number } }).response?.status
                        : undefined;

                if (status === 403) {
                    setIs403(true);
                    setError('Bạn cần chọn hồ sơ bé để xem chủ đề này');
                } else if (status === 401) {
                    setError('Vui lòng đăng nhập để tiếp tục');
                } else {
                    setError(err instanceof Error ? err.message : 'Không thể tải chủ đề');
                }
            } finally {
                setLoading(false);
            }
        }
        fetchTopic();
    }, [parsedTopicId]);

    if (loading) {
        return <LoadingScreen text="Đang tải chủ đề..." />;
    }

    if (error || !topic) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-light via-background to-accent-light">
                <div className="text-center max-w-md px-6">
                    <div className="text-6xl mb-4">{is403 ? '🔒' : '😢'}</div>
                    <Heading level={2} className="mb-2 text-heading">
                        {is403 ? 'Cần chọn hồ sơ bé' : 'Không thể tải chủ đề'}
                    </Heading>
                    <Body className="text-body mb-6">{error || 'Chủ đề không tồn tại'}</Body>
                    {is403 ? (
                        <Link href="/dashboard">
                            <motion.div 
                                whileHover={{ scale: 1.05 }} 
                                whileTap={{ scale: 0.95 }} 
                                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-heading font-bold shadow-lg"
                            >
                                <ArrowLeft size={18} /> Về Dashboard chọn bé
                            </motion.div>
                        </Link>
                    ) : (
                        <Link href="/play">
                            <motion.div 
                                whileHover={{ scale: 1.05 }} 
                                whileTap={{ scale: 0.95 }} 
                                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-heading font-bold shadow-lg"
                            >
                                <ArrowLeft size={18} /> Quay về bản đồ
                            </motion.div>
                        </Link>
                    )}
                </div>
            </div>
        );
    }

    const icon = ICON_MAP[topic.name] || ICON_MAP[topic.description || ''] || '📚';
    const colorKey = COLOR_KEYS[(Number.isInteger(parsedTopicId) ? parsedTopicId : 0) % COLOR_KEYS.length];
    const colors = COLOR_MAP[colorKey] ?? COLOR_MAP.primary;
    const safeTopicId = topic.id || parsedTopicId;
    const completedCount = topic.progress?.completed ?? 0;
    const starsEarned = topic.progress?.starsEarned ?? 0;
    const vocabularyCount = topic.vocabularyCount || (topic.vocabularies?.length || 0);
    const progressPct = vocabularyCount > 0 ? (completedCount / vocabularyCount) * 100 : 0;
    const learningLevelLabel = topic.learningLevel ? `Level ${topic.learningLevel}/5` : 'Level cơ bản';
    const topicTags = (topic.tags || []).slice(0, 3);
    const gameModes: GameMode[] = BASE_GAME_MODES.map((mode) => ({
        ...mode,
        locked:
            mode.id === 'video'
                ? !topic.hasVideo
                : mode.id === 'flashcard'
                    ? vocabularyCount < 2
                    : false,
    }));
    const availableModes = gameModes.filter((mode) => !mode.locked);
    const primaryMode =
        availableModes.find((mode) => mode.id === 'flashcard') ??
        availableModes.find((mode) => mode.id === 'quiz') ??
        availableModes[0] ??
        null;
    const secondaryModes = availableModes.filter((mode) => mode.id !== primaryMode?.id).slice(0, 2);
    const primaryModeHref = primaryMode ? `/play/topic/${safeTopicId}/${primaryMode.id}` : '/play';

    // Show first 5 vocabularies as preview
    const vocabPreview = (topic.vocabularies || []).slice(0, 5);

    return (
        <div className="min-h-screen pb-20 md:pb-8">
            {/* Hero Banner */}
            <div className="relative overflow-hidden">
                <div className={`absolute inset-0 ${colors.bg}`} />
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20" />
                <div className="relative z-10 max-w-lg md:max-w-4xl lg:max-w-7xl mx-auto px-4 md:px-8 pt-4 md:pt-6 pb-10">
                    <div className="rounded-[2rem] border border-white/20 bg-black/10 p-4 md:p-6 shadow-xl backdrop-blur-md">
                        <div className="mb-4">
                            <Link href="/play">
                                <motion.div
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-heading font-bold text-white/95 transition-colors hover:bg-white/15"
                                >
                                    <ArrowLeft size={18} /> Bản đồ học tập
                                </motion.div>
                            </Link>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr] lg:items-center">
                            <motion.div
                                initial={{ opacity: 1, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="space-y-5"
                            >
                                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white/90">
                                    <Sparkles size={14} />
                                    {learningLevelLabel}
                                </div>

                                <div>
                                    <Heading level={2} color="textInverse" className="text-3xl md:text-4xl drop-shadow-md">
                                        {topic.name}
                                    </Heading>
                                    <Body color="textInverse" className="mt-3 max-w-2xl text-sm md:text-base leading-7 text-white/90">
                                        {topic.description || 'Chủ đề học tập được thiết kế để bé vừa chơi vừa học một cách nhẹ nhàng.'}
                                    </Body>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-sm font-semibold text-white">
                                        <BookOpen size={16} />
                                        {vocabularyCount} từ vựng
                                    </div>
                                    <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-sm font-semibold text-white">
                                        <Star size={16} className="fill-current" />
                                        {starsEarned}/3 sao
                                    </div>
                                    <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-sm font-semibold text-white">
                                        <Video size={16} />
                                        {topic.hasVideo ? 'Có video' : 'Chưa có video'}
                                    </div>
                                </div>

                                {topicTags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {topicTags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-white/90"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-3">
                                    {[1, 2, 3].map((s) => (
                                        <Star
                                            key={s}
                                            size={28}
                                            className={s <= starsEarned ? 'text-star fill-star drop-shadow-md' : 'text-white/25'}
                                        />
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 1, y: 20, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.55, delay: 0.08 }}
                                className="relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/10 shadow-2xl"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/25" />
                                <div className="relative flex min-h-[220px] items-center justify-center p-5">
                                    {topic.imageUrl ? (
                                        <Image
                                            src={topic.imageUrl}
                                            alt={topic.name}
                                            fill
                                            sizes="(max-width: 1024px) 100vw, 420px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 text-center">
                                            <motion.div
                                                animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.04, 1] }}
                                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                                className="text-8xl drop-shadow-md"
                                            >
                                                {icon}
                                            </motion.div>
                                            <Caption color="textInverse" className="text-white/75">
                                                Chủ đề {topic.id}
                                            </Caption>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress panel */}
            <div className="max-w-lg md:max-w-4xl lg:max-w-7xl mx-auto px-6 md:px-8 mb-8">
                <motion.div
                    initial={{ opacity: 1, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
                    className="bg-card border-2 border-border rounded-[1.75rem] p-5 md:p-6 shadow-xl"
                >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-5">
                        <div>
                            <Heading level={3} className="text-heading text-xl">Tiến độ chủ đề</Heading>
                            <Caption className="text-caption mt-1">Theo dõi nhanh để biết bé đang đi đến đâu</Caption>
                        </div>
                        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${colors.light} ${colors.text}`}>
                            <CheckCircle2 size={16} /> {Math.round(progressPct)}% hoàn thành
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                        <div className="rounded-2xl border border-border bg-background p-4">
                            <Caption className="text-caption">Từ đã học</Caption>
                            <div className="mt-1 text-xl font-black text-heading">{completedCount}/{vocabularyCount}</div>
                        </div>
                        <div className="rounded-2xl border border-border bg-background p-4">
                            <Caption className="text-caption">Sao đạt được</Caption>
                            <div className="mt-1 text-xl font-black text-heading">{starsEarned}/3 ⭐</div>
                        </div>
                        <div className="rounded-2xl border border-border bg-background p-4">
                            <Caption className="text-caption">Mức độ</Caption>
                            <div className="mt-1 text-xl font-black text-heading">{learningLevelLabel}</div>
                        </div>
                    </div>

                    <div className="w-full h-3 bg-background rounded-full border border-border overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
                            className={`h-full ${colors.bg} rounded-full`}
                        />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                        <Caption className="text-caption">Bắt đầu bằng Flashcard để tăng tốc ghi nhớ</Caption>
                        <Caption className={`font-bold ${colors.text}`}>{Math.round(progressPct)}%</Caption>
                    </div>
                </motion.div>
            </div>

            {/* Quick start */}
            <div className="max-w-lg md:max-w-4xl lg:max-w-7xl mx-auto px-6 md:px-8 mb-8">
                <motion.div
                    initial={{ opacity: 1, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.26 }}
                    className="rounded-[2rem] border-2 border-border bg-card shadow-xl p-5 md:p-6"
                >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <Caption className="text-caption font-bold uppercase tracking-[0.18em]">Lộ trình gợi ý</Caption>
                            <Heading level={3} className="text-heading text-xl md:text-2xl">
                                Học theo thứ tự dễ nhất, đỡ bị rối
                            </Heading>
                            <Body className="text-body text-sm md:text-base max-w-2xl leading-7">
                                Bắt đầu bằng Flashcard để làm quen từ vựng, sau đó chuyển sang Quiz hoặc Phát âm để ôn luyện tự nhiên hơn.
                            </Body>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:w-[460px]">
                            <Link href={primaryModeHref} className="sm:col-span-2">
                                <motion.div
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center justify-between gap-4 rounded-2xl border-2 border-primary bg-primary text-white px-4 py-4 shadow-lg shadow-primary/25"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="grid place-items-center w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm">
                                            {primaryMode?.icon ?? <Play size={22} />}
                                        </div>
                                        <div className="text-left">
                                            <div className="text-xs font-black uppercase tracking-[0.18em] text-white/80">Bắt đầu ngay</div>
                                            <div className="font-heading font-black text-lg leading-tight">
                                                {primaryMode ? primaryMode.label : 'Quay về bản đồ học'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-full bg-white/15 px-3 py-1 text-sm font-black">
                                        ▶
                                    </div>
                                </motion.div>
                            </Link>

                            {secondaryModes.map((mode) => {
                                const mc = COLOR_MAP[mode.color] ?? COLOR_MAP.primary;
                                return (
                                    <Link key={mode.id} href={`/play/topic/${safeTopicId}/${mode.id}`}>
                                        <motion.div
                                            whileHover={{ scale: 1.02, y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`rounded-2xl border-2 ${mc.border} bg-card px-4 py-4 shadow-md transition-shadow hover:shadow-lg`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`grid place-items-center w-11 h-11 rounded-2xl ${mc.light} ${mc.text}`}>
                                                    {mode.icon}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-heading font-black text-heading text-sm">{mode.label}</div>
                                                    <Caption className="text-caption text-[11px] line-clamp-2">{mode.desc}</Caption>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Game Modes */}
            <div className="max-w-lg md:max-w-4xl lg:max-w-7xl mx-auto px-6 md:px-8 mb-8">
                <Heading level={3} className="text-heading text-xl mb-4">Chọn cách học 🎮</Heading>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {gameModes.map((mode, i) => {
                        const mc = COLOR_MAP[mode.color] ?? COLOR_MAP.primary;
                        const isModeTracked = TRACKED_MODE_IDS.includes(mode.id as TrackedModeId);
                        const completed = isModeTracked ? modeProgress[mode.id as TrackedModeId] : false;
                        return (
                            <motion.div
                                key={mode.id}
                                initial={{ opacity: 1, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 * i }}
                                whileHover={!mode.locked ? { scale: 1.04, y: -4 } : undefined}
                                whileTap={mode.locked ? { x: [-5, 5, -4, 4, -2, 2, 0] } : { scale: 0.97 }}
                                className={mode.locked ? "cursor-not-allowed" : ""}
                            >
                                {mode.locked ? (
                                    <div className="relative min-h-[168px] bg-background border-2 border-dashed border-border rounded-2xl p-5 opacity-50 cursor-not-allowed flex flex-col items-center gap-3">
                                        <div className="w-14 h-14 rounded-2xl bg-border/30 flex items-center justify-center text-body">{mode.icon}</div>
                                        <div className="text-center">
                                            <div className="font-heading font-black text-heading text-sm">{mode.label}</div>
                                            <Caption className="text-caption text-xs">{mode.desc}</Caption>
                                        </div>
                                            <div className="flex items-center gap-1 text-caption text-xs">
                                            <Lock size={12} /> {mode.id === 'video' ? 'Chưa có video' : mode.id === 'flashcard' ? 'Cần ít nhất 2 từ' : 'Sắp ra mắt'}
                                        </div>
                                    </div>
                                ) : (
                                    <Link href={`/play/topic/${safeTopicId}/${mode.id}`}>
                                        <div className={`relative min-h-[168px] bg-card border-2 ${mc.border} rounded-2xl p-5 cursor-pointer flex flex-col items-center gap-3 shadow-md hover:shadow-lg transition-shadow group`}>
                                            {isModeTracked && completed && (
                                                <div className="absolute top-2 right-2 inline-flex items-center gap-1 bg-success text-white text-[10px] font-bold px-2 py-1 rounded-full">
                                                    <CheckCircle2 className="w-3 h-3" /> Xong
                                                </div>
                                            )}
                                            <div className={`w-14 h-14 rounded-2xl ${mc.light} ${mc.text} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                                {mode.icon}
                                            </div>
                                            <div className="text-center">
                                                <div className={`font-heading font-black text-sm ${mc.text}`}>{mode.label}</div>
                                                <Caption className="text-caption text-xs">{mode.desc}</Caption>
                                                {isModeTracked && !completed && (
                                                    <Caption className="text-caption text-[10px] mt-1">Chưa hoàn thành</Caption>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Vocabulary Preview */}
            <div className="max-w-lg md:max-w-4xl lg:max-w-7xl mx-auto px-6 md:px-8">
                <div className="flex items-end justify-between gap-4 mb-4">
                    <Heading level={3} className="text-heading text-xl">Từ vựng trong bài</Heading>
                    <Caption className="text-caption text-sm text-right">Xem trước vài từ đầu tiên để bé đỡ bị ngợp</Caption>
                </div>
                {vocabPreview.length > 0 ? (
                    <div className="bg-card border-2 border-border rounded-2xl overflow-hidden">
                        {vocabPreview.map((v, i) => (
                            <motion.div
                                key={v.id}
                                initial={{ opacity: 1, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.07 }}
                                whileHover={{ x: 4, backgroundColor: 'rgba(0,0,0,0.02)' }}
                                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 transition-colors ${i < vocabPreview.length - 1 ? 'border-b border-border' : ''}`}
                            >
                                <div className="min-w-0">
                                    <span className="font-heading font-black text-heading text-base mr-2">{v.word}</span>
                                    <Caption className="text-caption text-xs block mt-1">{v.phonetic}</Caption>
                                    <div className="text-body text-sm mt-1 line-clamp-2">{v.translation}</div>
                                </div>
                                <div className="self-start sm:self-auto bg-background text-caption text-xs font-bold px-3 py-1.5 rounded-xl border border-border whitespace-nowrap">Chưa học</div>
                            </motion.div>
                        ))}
                        {vocabularyCount > vocabPreview.length && (
                            <div className="p-4 text-center border-t border-border">
                                <Caption className="text-caption text-sm">+{vocabularyCount - vocabPreview.length} từ nữa khi bắt đầu học</Caption>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-card border-2 border-border rounded-2xl p-8 text-center">
                        <div className="text-4xl mb-2">📚</div>
                        <Caption className="text-caption">Chưa có từ vựng trong chủ đề này</Caption>
                    </div>
                )}
            </div>
        </div>
    );
}
