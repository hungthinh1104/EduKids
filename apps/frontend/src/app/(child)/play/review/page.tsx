'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, Volume2, RotateCcw, Star, ChevronRight, Clock } from 'lucide-react';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { KidButton } from '@/components/edukids/KidButton';
import { LoadingScreen } from '@/components/edukids/LoadingScreen';
import { reviewApi, ReviewItem, ReviewSubmission } from '@/features/learning/api/review.api';
import { GameHUD } from '@/features/learning/components/GameHUD';
import { useCurrentChild } from '@/features/learning/hooks/useCurrentChild';

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

interface ReviewLog {
    vocabId: number;
    difficulty: Difficulty;
    correct: boolean;
}

// Difficulty → next review label (display only, actual schedule is BE-computed)
const DIFF_BUTTONS: { label: string; sublabel: string; difficulty: Difficulty; cls: string }[] = [
    { label: '😫 Quên rồi', sublabel: '< 1 phút', difficulty: 'HARD', cls: 'bg-error hover:bg-error/90 text-white border-red-700' },
    { label: '🤔 Nghĩ ra rồi', sublabel: '~6 phút', difficulty: 'MEDIUM', cls: 'bg-warning hover:bg-warning/90 text-white border-yellow-600' },
    { label: '😊 Nhớ rồi!', sublabel: '~4 ngày', difficulty: 'EASY', cls: 'bg-success hover:bg-success/90 text-white border-green-700' },
];

// ─────────────────────────────────────────────────────────────────────────────
// ReviewCard — flip card for SRS review words
// ─────────────────────────────────────────────────────────────────────────────
function ReviewCard({
    card,
    flipped,
    onFlip,
    onPlayAudio,
}: {
    card: ReviewItem;
    flipped: boolean;
    onFlip: () => void;
    onPlayAudio: () => void;
}) {
    // Use emoji from API if available, otherwise fallback
    const emoji = (card as ReviewItem & { emoji?: string }).emoji ?? '📚';

    return (
        <div className="relative w-full max-w-sm mx-auto cursor-pointer select-none" style={{ perspective: 1000 }} onClick={onFlip}>
            <motion.div animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.55, type: 'spring', stiffness: 200, damping: 22 }}
                style={{ transformStyle: 'preserve-3d' }} className="relative w-full"
            >
                {/* FRONT */}
                <div className="w-full bg-card border-4 border-secondary rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-5 shadow-2xl shadow-secondary/15 min-h-[280px]" style={{ backfaceVisibility: 'hidden' }}>
                    <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 3, repeat: Infinity }} className="text-8xl">{emoji}</motion.div>
                    <Heading level={2} className="text-heading text-5xl font-black">{card.word}</Heading>
                    <Caption className="text-caption">{card.phonetic || '/word/'}</Caption>
                    {/* Audio button on FRONT — doesn't require flip */}
                    <motion.button
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                        onClick={(e) => { e.stopPropagation(); onPlayAudio(); }}
                        className="flex items-center gap-2 bg-secondary-light border-2 border-secondary/30 text-secondary px-4 py-2 rounded-full font-heading font-bold text-xs hover:bg-secondary hover:text-white transition-colors"
                    >
                        <Volume2 size={15} /> Nghe phát âm
                    </motion.button>
                    <div className="flex items-center gap-2 text-secondary text-xs font-heading font-bold opacity-70">
                        <RotateCcw size={13} /> Nhấn để xem nghĩa
                    </div>
                </div>

                {/* BACK */}
                <div className="absolute inset-0 w-full bg-gradient-to-br from-secondary/90 to-primary rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-5 shadow-2xl min-h-[280px]"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                    <div className="text-6xl">{emoji}</div>
                    <Heading level={2} className="text-white text-4xl font-black drop-shadow">{card.translation}</Heading>
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/30">
                        <Caption className="text-white/90 text-sm">{card.word} — {card.phonetic || '/word/'}</Caption>
                    </div>
                    <Caption className="text-white/60 text-sm">Bé nhớ mức nào? ↓</Caption>
                </div>
            </motion.div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SessionComplete for SRS Review
// ─────────────────────────────────────────────────────────────────────────────
function ReviewSessionComplete({ logs, onRestart }: { logs: ReviewLog[]; onRestart: () => void }) {
    useEffect(() => {
        void import('@/shared/utils/confetti').then((m) => m.fireRewardConfetti());
    }, []);
    const easyCount = logs.filter((l) => l.difficulty === 'EASY').length;
    const hardCount = logs.filter((l) => l.difficulty === 'HARD').length;
    const stars = easyCount >= logs.length * 0.8 ? 3 : easyCount >= logs.length * 0.5 ? 2 : 1;
    return (
        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.4 }}
            className="flex flex-col items-center gap-8 py-8 text-center px-4"
        >
            <motion.div animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 1, delay: 0.3 }} className="text-7xl">🎓</motion.div>
            <div>
                <Heading level={2} className="text-heading text-3xl">Ôn tập xong!</Heading>
                <Body className="text-body mt-1">Bé đã ôn {logs.length} từ hôm nay</Body>
            </div>
            <div className="flex gap-2">
                {[1, 2, 3].map((s, i) => (
                    <motion.div key={s} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.4 + i * 0.15, type: 'spring', bounce: 0.6 }}>
                        <Star size={44} className={s <= stars ? 'text-warning fill-warning drop-shadow-lg' : 'text-border'} />
                    </motion.div>
                ))}
            </div>
            <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                {[
                    { label: '😊 Nhớ tốt', value: easyCount, color: 'text-success' },
                    { label: '🤔 Cần ôn', value: logs.filter((l) => l.difficulty === 'MEDIUM').length, color: 'text-warning' },
                    { label: '😫 Quên', value: hardCount, color: 'text-error' },
                ].map((s) => (
                    <div key={s.label} className="bg-card border-2 border-border rounded-2xl p-3">
                        <div className={`text-2xl font-heading font-black ${s.color}`}>{s.value}</div>
                        <Caption className="text-caption text-[10px]">{s.label}</Caption>
                    </div>
                ))}
            </div>
            <div className="flex flex-col gap-3 w-full max-w-xs">
                <KidButton variant="default" size="lg" className="w-full" onClick={onRestart}>
                    <RotateCcw size={18} /> Ôn lại
                </KidButton>
                <Link href="/play">
                    <KidButton variant="outline" size="default" className="w-full">
                        Về bản đồ <ChevronRight size={16} />
                    </KidButton>
                </Link>
            </div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main SRS Review Page — UC-16
// Endpoint: POST /api/vocabulary-review/submit { vocabId, difficulty, correct }
// ─────────────────────────────────────────────────────────────────────────────
export default function ReviewPage() {
    const { child, loading: childLoading } = useCurrentChild();
    const [index, setIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [logs, setLogs] = useState<ReviewLog[]>([]);
    const [done, setDone] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [reviewDeck, setReviewDeck] = useState<ReviewItem[]>([]);
    const [loading, setLoading] = useState(true);
    const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (transitionTimeoutRef.current) {
                clearTimeout(transitionTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const childId = child?.id;
        if (!childId) return;
        async function fetchReviewSession(resolvedChildId: number) {
            try {
                setLoading(true);
                const session = await reviewApi.getSession(resolvedChildId, 10);
                setReviewDeck(session.items);
            } catch (err) {
                console.error('Failed to fetch review session:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchReviewSession(childId);
    }, [child?.id]);

    if (loading) {
        return <LoadingScreen text="Đang tải bài ôn tập..." />;
    }

    if (reviewDeck.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md px-6">
                    <div className="text-6xl mb-4">🎉</div>
                    <Heading level={2} className="mb-2">Không có từ nào cần ôn!</Heading>
                    <Body className="text-caption mb-6">Bé đã ôn tất cả từ vựng rồi. Hãy quay lại sau nhé!</Body>
                    <Link href="/play">
                        <KidButton variant="default">Quay về màn hình chính</KidButton>
                    </Link>
                </div>
            </div>
        );
    }

    const card = reviewDeck[index];
    const progress = (index / reviewDeck.length) * 100;

    async function handleRate(difficulty: Difficulty) {
        if (!child?.id) return;
        const correct = difficulty !== 'HARD';
        const newLog: ReviewLog = { vocabId: card.vocabularyId, difficulty, correct };

        try {
            // Submit review to backend
            const submission: ReviewSubmission = {
                vocabularyId: card.vocabularyId,
                difficulty,
                correct,
            };
            await reviewApi.submitReview(child.id, submission);
        } catch (err) {
            console.error('Failed to submit review:', err);
        }

        const updated = [...logs, newLog];
        setLogs(updated);

        if (index + 1 >= reviewDeck.length) {
            setDone(true);
        } else {
            setLeaving(true);
            transitionTimeoutRef.current = setTimeout(() => {
                setIndex((i) => i + 1);
                setFlipped(false);
                setLeaving(false);
            }, 260);
        }
    }

    async function handleRestart() {
        if (!child?.id) return;
        setIndex(0);
        setFlipped(false);
        setLogs([]);
        setDone(false);

        try {
            const session = await reviewApi.getSession(child.id, 10);
            setReviewDeck(session.items);
        } catch (err) {
            console.error('Failed to fetch new session:', err);
        }
    }

    if (childLoading || !child) {
        return <LoadingScreen />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-secondary-light via-background to-background pb-20 md:pb-8">
            {/* Desktop GameHUD */}
            <div className="hidden md:block">
                <GameHUD
                    nickname={child.nickname}
                    avatarUrl={child.avatarUrl}
                    rewards={child.rewards}
                    activeNav="review"
                />
            </div>

            {/* Mobile Top bar */}
            <div className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b-2 border-border md:hidden">
                <div className="max-w-lg md:max-w-4xl lg:max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center gap-4">
                    <Link href="/play">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center">
                            <X size={14} className="text-body" />
                        </motion.div>
                    </Link>
                    <div className="flex-1 h-3.5 bg-background rounded-full border border-border overflow-hidden">
                        <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} className="h-full bg-gradient-to-r from-secondary to-primary rounded-full" />
                    </div>
                    <Caption className="text-caption text-sm font-black whitespace-nowrap">{index}/{reviewDeck.length}</Caption>
                </div>
            </div>

            <div className="max-w-lg md:max-w-4xl lg:max-w-7xl mx-auto px-6 md:px-8 pt-6 space-y-2">
                {/* Due notification */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 bg-secondary-light border border-secondary/30 rounded-2xl px-4 py-2.5 text-sm"
                >
                    <Clock size={15} className="text-secondary" />
                    <span className="font-heading font-bold text-secondary">{reviewDeck.length} từ cần ôn hôm nay</span>
                </motion.div>
            </div>

            <div className="max-w-lg md:max-w-4xl lg:max-w-7xl mx-auto px-6 md:px-8 pt-5">
                <AnimatePresence mode="wait">
                    {done ? (
                        <ReviewSessionComplete key="done" logs={logs} onRestart={handleRestart} />
                    ) : (
                        <motion.div key={index}
                                initial={{ opacity: 1, x: leaving ? -60 : 60, scale: 0.95 }}
                                animate={{ opacity: leaving ? 0 : 1, x: leaving ? -60 : 0, scale: leaving ? 0.95 : 1 }}
                                transition={{ duration: 0.26 }}
                                className="space-y-8 pt-3"
                            >
                            <ReviewCard
                                card={card}
                                flipped={flipped}
                                onFlip={() => setFlipped(true)}
                                onPlayAudio={() => {
                                    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                                        window.speechSynthesis.cancel();
                                        const utterance = new SpeechSynthesisUtterance(card.word);
                                        utterance.lang = 'en-US';
                                        utterance.rate = 0.85;
                                        utterance.pitch = 1.1;
                                        window.speechSynthesis.speak(utterance);
                                    }
                                }}
                            />

                            {/* Difficulty buttons — only after flip */}
                            <AnimatePresence>
                                {flipped && (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        className="grid grid-cols-3 gap-2"
                                    >
                                        {DIFF_BUTTONS.map((b) => (
                                            <motion.button key={b.difficulty} whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.94 }}
                                                onClick={() => handleRate(b.difficulty)}
                                                className={`flex flex-col items-center gap-0.5 py-3 px-2 rounded-2xl font-heading font-black text-xs border-b-4 active:border-b-0 active:translate-y-1 transition-all ${b.cls}`}
                                            >
                                                {b.label}
                                                <span className="text-[10px] font-medium opacity-80">{b.sublabel}</span>
                                            </motion.button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {!flipped && (
                                <div className="text-center">
                                    <KidButton variant="default" size="lg" onClick={() => setFlipped(true)} className="px-10">
                                        Xem nghĩa
                                    </KidButton>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
