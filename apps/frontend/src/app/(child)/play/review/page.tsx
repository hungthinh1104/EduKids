'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Volume2, RotateCcw, Clock } from 'lucide-react';
import { Heading, Caption } from '@/shared/components/Typography';
import { KidButton } from '@/components/edukids/KidButton';
import { reviewApi, ReviewItem, ReviewSubmission } from '@/features/learning/api/review.api';
import { useCurrentChild } from '@/features/learning/hooks/useCurrentChild';
import { LearningModeShell, ModeStatePanel } from '@/features/learning/components/LearningModeShell';
import { GameCompleteScreen } from '@/features/learning/components/GameCompleteScreen';

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

interface ReviewLog {
    vocabId: number;
    difficulty: Difficulty;
    correct: boolean;
}

// Difficulty → next review label (display only, actual schedule is BE-computed)
const DIFF_BUTTONS: { label: string; sublabel: string; difficulty: Difficulty; cls: string }[] = [
    { label: '😫 Quên rồi', sublabel: '< 1 phút', difficulty: 'HARD', cls: 'bg-error hover:bg-error/90 text-white border-error-dark/50' },
    { label: '🤔 Nghĩ ra rồi', sublabel: '~6 phút', difficulty: 'MEDIUM', cls: 'bg-warning hover:bg-warning/90 text-white border-warning-dark/50' },
    { label: '😊 Nhớ rồi!', sublabel: '~4 ngày', difficulty: 'EASY', cls: 'bg-success hover:bg-success/90 text-white border-success-dark/50' },
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
                    <Heading level={2} color="textInverse" className="text-4xl font-black drop-shadow">{card.translation}</Heading>
                    <div className="bg-card/20 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/30">
                        <Caption color="textInverse" className="text-sm text-white/90">{card.word} — {card.phonetic || '/word/'}</Caption>
                    </div>
                    <Caption color="textInverse" className="text-sm text-white/60">Bé nhớ mức nào? ↓</Caption>
                </div>
            </motion.div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main SRS Review Page — UC-16
// ─────────────────────────────────────────────────────────────────────────────
export default function ReviewPage() {
    const { child, loading: childLoading } = useCurrentChild();
    const [index, setIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [logs, setLogs] = useState<ReviewLog[]>([]);
    const [done, setDone] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [reviewDeck, setReviewDeck] = useState<ReviewItem[]>([]);
    const [suggestedItems, setSuggestedItems] = useState<ReviewItem[]>([]);
    const [suggestionMessage, setSuggestionMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
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
                setLoadError(null);
                const session = await reviewApi.getSession(resolvedChildId, 10);
                setReviewDeck(session.items);
                setSuggestedItems(session.suggestedItems ?? []);
                setSuggestionMessage(session.suggestionMessage ?? null);
            } catch (err) {
                console.error('Failed to fetch review session:', err);
                setLoadError('Không thể tải bài ôn tập lúc này.');
                setReviewDeck([]);
                setSuggestedItems([]);
                setSuggestionMessage(null);
            } finally {
                setLoading(false);
            }
        }
        fetchReviewSession(childId);
    }, [child?.id]);
    const card = reviewDeck[index];

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
            setLoading(true);
            setLoadError(null);
            const session = await reviewApi.getSession(child.id, 10);
            setReviewDeck(session.items);
            setSuggestedItems(session.suggestedItems ?? []);
            setSuggestionMessage(session.suggestionMessage ?? null);
        } catch (err) {
            console.error('Failed to fetch new session:', err);
            setLoadError('Không thể tải lại bài ôn tập.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <LearningModeShell
            backHref="/play"
            progressCurrent={Math.min(index + 1, Math.max(reviewDeck.length, 1))}
            progressTotal={Math.max(reviewDeck.length, 1)}
            title="Ôn tập từ vựng"
            subtitle="Xem thẻ và đánh giá độ khó để AI lên lịch ôn tập cho bé"
            progressFromClass="from-secondary"
            progressToClass="to-primary"
            contentMaxWidthClass="max-w-lg md:max-w-2xl"
        >
            <AnimatePresence mode="wait">
                {childLoading || loading ? (
                    <ModeStatePanel
                        title="Đang tải bài ôn tập"
                        description="Vui lòng chờ trong giây lát..."
                        emoji="📚"
                    />
                ) : loadError ? (
                    <ModeStatePanel
                        title="Chưa mở được bài ôn tập"
                        description={loadError}
                        emoji="😵"
                        action={
                            <Link href="/play">
                                <KidButton variant="default">Quay về màn hình chính</KidButton>
                            </Link>
                        }
                    />
                ) : reviewDeck.length === 0 ? (
                    <ModeStatePanel
                        title="Chưa có từ đến lượt ôn"
                        description={suggestionMessage || 'Bé chưa có thẻ ôn tập đến hạn. Mình gợi ý vài từ mới để tiếp tục học nhé!'}
                        emoji="🎉"
                        action={
                            <div className="flex flex-col gap-3 w-full">
                                {suggestedItems.length > 0 && (
                                    <div className="mb-2 rounded-2xl border border-border bg-card p-4 text-left">
                                        <Heading level={4} className="text-heading text-base mb-2">Gợi ý học tiếp</Heading>
                                        <div className="space-y-2">
                                            {suggestedItems.slice(0, 3).map((item, index) => (
                                                <div
                                                    key={item.reviewId ?? item.vocabularyId ?? `${item.word}-${index}`}
                                                    className="rounded-xl bg-background px-3 py-2 border border-border"
                                                >
                                                    <div className="font-heading font-black text-sm text-heading">{item.word}</div>
                                                    <Caption className="text-caption text-xs">{item.translation}</Caption>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <Link href="/play">
                                    <KidButton variant="default" className="w-full">Quay về màn hình chính</KidButton>
                                </Link>
                                <Link href="/play">
                                    <KidButton variant="outline" className="w-full">Chọn chủ đề mới để học</KidButton>
                                </Link>
                            </div>
                        }
                    />
                ) : done ? (
                    (() => {
                        const easyCount = logs.filter((l) => l.difficulty === 'EASY').length;
                        const hardCount = logs.filter((l) => l.difficulty === 'HARD').length;
                        const stars = easyCount >= logs.length * 0.8 ? 3 : easyCount >= logs.length * 0.5 ? 2 : 1;

                        return (
                            <GameCompleteScreen
                                emoji="🎓"
                                title="Ôn tập xong!"
                                subtitle={`Bé đã ôn ${logs.length} từ hôm nay`}
                                starsEarned={stars}
                                maxStars={3}
                                topicId=""
                                onRestart={handleRestart}
                                restartLabel="Ôn lại"
                                backLabel="Về bản đồ"
                                stats={[
                                    { label: '😊 Nhớ tốt', value: easyCount, colorClass: 'text-success' },
                                    { label: '🤔 Cần ôn', value: logs.filter((l) => l.difficulty === 'MEDIUM').length, colorClass: 'text-warning' },
                                    { label: '😫 Quên', value: hardCount, colorClass: 'text-error' },
                                ]}
                            />
                        );
                    })()
                ) : (
                    <motion.div key={index}
                        initial={{ opacity: 1, x: leaving ? -60 : 60, scale: 0.95 }}
                        animate={{ opacity: leaving ? 0 : 1, x: leaving ? -60 : 0, scale: leaving ? 0.95 : 1 }}
                        transition={{ duration: 0.26 }}
                        className="space-y-8 pt-2"
                    >
                        {/* Due notification */}
                        <div className="flex justify-center">
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 bg-secondary-light border border-secondary/30 rounded-2xl px-4 py-2.5 text-sm"
                            >
                                <Clock size={15} className="text-secondary" />
                                <span className="font-heading font-bold text-secondary">{reviewDeck.length} từ cần ôn hôm nay</span>
                            </motion.div>
                        </div>

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
                                    className="grid grid-cols-3 gap-2 max-w-sm mx-auto"
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
                                <KidButton variant="default" size="lg" onClick={() => setFlipped(true)} className="px-10 max-w-sm w-full">
                                    Xem nghĩa
                                </KidButton>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </LearningModeShell>
    );
}
