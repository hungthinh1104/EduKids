'use client';

import { use, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Brain, Mic, HelpCircle, Play, Star, Lock } from 'lucide-react';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { LoadingScreen } from '@/components/edukids/LoadingScreen';
import { contentApi, Topic } from '@/features/learning/api/content.api';

type GameMode = { id: string; icon: React.ReactNode; label: string; desc: string; color: string; locked: boolean };

const GAME_MODES: GameMode[] = [
    { id: 'flashcard', icon: <Brain size={28} />, label: 'Flashcard', desc: 'Lật thẻ học từ vựng', color: 'success', locked: false },
    { id: 'quiz', icon: <HelpCircle size={28} />, label: 'Quiz Game', desc: 'Chọn đáp án đúng', color: 'primary', locked: false },
    { id: 'pronunciation', icon: <Mic size={28} />, label: 'Phát âm AI', desc: 'Luyện phát âm chuẩn', color: 'accent', locked: false },
    { id: 'video', icon: <Play size={28} />, label: 'Video Bài Giảng', desc: 'Xem hoạt hình', color: 'warning', locked: true },
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

export default function TopicDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [topic, setTopic] = useState<Topic | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [is403, setIs403] = useState(false);

    useEffect(() => {
        async function fetchTopic() {
            try {
                setLoading(true);
                setError(null);
                setIs403(false);
                const data = await contentApi.getTopicById(Number(id));
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
    }, [id]);

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
    const colorKey = COLOR_KEYS[Number(id) % COLOR_KEYS.length];
    const colors = COLOR_MAP[colorKey] ?? COLOR_MAP.primary;

    // TODO: Get real progress from LearningProgress API
    const completedCount = 0;
    const starsEarned = 0;
    const vocabularyCount = topic.vocabularyCount || (topic.vocabularies?.length || 0);
    const progressPct = vocabularyCount > 0 ? (completedCount / vocabularyCount) * 100 : 0;

    // Show first 5 vocabularies as preview
    const vocabPreview = (topic.vocabularies || []).slice(0, 5);

    return (
        <div className="min-h-screen pb-20 md:pb-8">
            {/* Hero Banner */}
            <div className={`${colors.bg} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/30" />
                <div className="relative z-10 max-w-lg md:max-w-4xl lg:max-w-7xl mx-auto px-6 md:px-8 pt-6 pb-12">
                    {/* Back Button */}
                    <Link href="/play">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-flex items-center gap-2 text-white/90 hover:text-white font-heading font-bold mb-6 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl backdrop-blur-sm transition-colors">
                            <ArrowLeft size={18} /> Bản đồ học tập
                        </motion.div>
                    </Link>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
                        <motion.div
                            animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.05, 1] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            className="text-8xl mb-4 block"
                        >
                            {icon}
                        </motion.div>
                        <Heading level={2} className="text-white text-3xl mb-2 drop-shadow-md">{topic.name}</Heading>
                        <Body className="text-white/85 text-base">{topic.description}</Body>

                        {/* Stars */}
                        <div className="flex justify-center gap-2 mt-4">
                            {[1, 2, 3].map((s) => (
                                <Star key={s} size={28} className={s <= starsEarned ? 'text-star fill-star drop-shadow-md' : 'text-white/30'} />
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
            {/* Progress panel (overlapping) */}
            <div className="max-w-lg md:max-w-4xl lg:max-w-7xl mx-auto px-6 md:px-8 -mt-6 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card border-2 border-border rounded-2xl p-5 shadow-xl"
                >
                    <div className="flex items-center justify-between mb-3">
                        <Caption className="font-bold text-heading">Tiến độ</Caption>
                        <Caption className={`font-black text-sm ${colors.text}`}>{completedCount}/{vocabularyCount} từ</Caption>
                    </div>
                    <div className="w-full h-3 bg-background rounded-full border border-border overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
                            className={`h-full ${colors.bg} rounded-full`}
                        />
                    </div>
                </motion.div>
            </div>

            {/* Game Modes */}
            <div className="max-w-lg md:max-w-4xl lg:max-w-7xl mx-auto px-6 md:px-8 mb-8">
                <Heading level={3} className="text-heading text-xl mb-4">Chọn cách học 🎮</Heading>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {GAME_MODES.map((mode, i) => {
                        const mc = COLOR_MAP[mode.color] ?? COLOR_MAP.primary;
                        return (
                            <motion.div
                                key={mode.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 * i }}
                                whileHover={!mode.locked ? { scale: 1.04, y: -4 } : undefined}
                                whileTap={!mode.locked ? { scale: 0.97 } : undefined}
                            >
                                {mode.locked ? (
                                    <div className="relative bg-background border-2 border-dashed border-border rounded-2xl p-5 opacity-50 cursor-not-allowed flex flex-col items-center gap-3">
                                        <div className="w-14 h-14 rounded-2xl bg-border/30 flex items-center justify-center text-body">{mode.icon}</div>
                                        <div className="text-center">
                                            <div className="font-heading font-black text-heading text-sm">{mode.label}</div>
                                            <Caption className="text-caption text-xs">{mode.desc}</Caption>
                                        </div>
                                        <div className="flex items-center gap-1 text-caption text-xs">
                                            <Lock size={12} /> Sắp ra mắt
                                        </div>
                                    </div>
                                ) : (
                                    <Link href={`/play/topic/${topic.id}/${mode.id}`}>
                                        <div className={`relative bg-card border-2 ${mc.border} rounded-2xl p-5 cursor-pointer flex flex-col items-center gap-3 shadow-md hover:shadow-lg transition-shadow group`}>
                                            <div className={`w-14 h-14 rounded-2xl ${mc.light} ${mc.text} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                                {mode.icon}
                                            </div>
                                            <div className="text-center">
                                                <div className={`font-heading font-black text-sm ${mc.text}`}>{mode.label}</div>
                                                <Caption className="text-caption text-xs">{mode.desc}</Caption>
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
                <Heading level={3} className="text-heading text-xl mb-4">Từ vựng trong bài</Heading>
                {vocabPreview.length > 0 ? (
                    <div className="bg-card border-2 border-border rounded-2xl overflow-hidden">
                        {vocabPreview.map((v, i) => (
                            <motion.div
                                key={v.id}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.07 }}
                                className={`flex items-center justify-between p-4 ${i < vocabPreview.length - 1 ? 'border-b border-border' : ''}`}
                            >
                                <div>
                                    <span className="font-heading font-black text-heading text-base mr-2">{v.word}</span>
                                    <Caption className="text-caption text-xs">{v.phonetic}</Caption>
                                    <div className="text-body text-sm">{v.translation}</div>
                                </div>
                                <div className="bg-background text-caption text-xs font-bold px-3 py-1.5 rounded-xl border border-border">Chưa học</div>
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
