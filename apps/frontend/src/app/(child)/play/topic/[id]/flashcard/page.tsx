'use client';

import { useState, useCallback, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, Volume2, RotateCcw, Star, ChevronRight } from 'lucide-react';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { KidButton } from '@/components/edukids/KidButton';
import { contentApi, Vocabulary } from '@/features/learning/api/content.api';

type SRSRating = 'again' | 'hard' | 'good' | 'easy';

interface SRSLog {
    vocabId: number;
    rating: SRSRating;
}

// ── Flip Card ──────────────────────────────────────────────────────────────
function FlipCard({ card, flipped, onFlip }: { card: Vocabulary; flipped: boolean; onFlip: () => void }) {
    return (
        <div
            className="relative w-full max-w-sm mx-auto cursor-pointer select-none"
            style={{ perspective: 1000 }}
            onClick={onFlip}
        >
            <motion.div
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.55, type: 'spring', stiffness: 200, damping: 22 }}
                style={{ transformStyle: 'preserve-3d' }}
                className="relative w-full"
            >
                {/* FRONT */}
                <div
                    className="w-full bg-card border-4 border-primary rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-6 shadow-2xl shadow-primary/15 min-h-[340px]"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <motion.div
                        animate={{ scale: [1, 1.08, 1], rotate: [0, -3, 3, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        className="text-8xl"
                    >
                        {card.emoji}
                    </motion.div>
                    <Heading level={2} className="text-heading text-5xl font-black tracking-wide">{card.word}</Heading>
                    <Caption className="text-caption text-base font-medium">{card.phonetic}</Caption>
                    <div className="flex items-center gap-2 text-primary text-sm font-heading font-bold mt-2 opacity-70">
                        <RotateCcw size={14} /> Nhấn để lật thẻ
                    </div>
                </div>

                {/* BACK */}
                <div
                    className="absolute inset-0 w-full bg-gradient-candy rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-5 shadow-2xl min-h-[340px]"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                    <div className="text-7xl">{card.emoji}</div>
                    <Heading level={2} className="text-white text-5xl font-black drop-shadow-md">{card.translation}</Heading>
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/30">
                        <Body className="text-white text-base italic text-center">&quot;{card.exampleSentence || `${card.word} means ${card.translation}`}&quot;</Body>
                    </div>
                    <Caption className="text-white/70 text-sm">Nhấn để đánh giá ↓</Caption>
                </div>
            </motion.div>
        </div>
    );
}

// ── SRS Rating Buttons ─────────────────────────────────────────────────────
function SRSButtons({ onRate }: { onRate: (r: SRSRating) => void }) {
    const buttons: { label: string; rating: SRSRating; subLabel: string; cls: string }[] = [
        { label: 'Quên rồi', rating: 'again', subLabel: '<1 phút', cls: 'bg-error hover:bg-error/90 text-white border-error-dark' },
        { label: 'Khó', rating: 'hard', subLabel: '~6 phút', cls: 'bg-warning hover:bg-warning/90 text-white border-warning/80' },
        { label: 'Tốt', rating: 'good', subLabel: '~1 ngày', cls: 'bg-primary hover:bg-primary/90 text-white border-primary-dark' },
        { label: 'Dễ', rating: 'easy', subLabel: '~4 ngày', cls: 'bg-success hover:bg-success/90 text-white border-success-dark' },
    ];
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-4 gap-2 w-full max-w-sm mx-auto"
        >
            {buttons.map((b) => (
                <motion.button
                    key={b.rating}
                    whileHover={{ scale: 1.06, y: -3 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => onRate(b.rating)}
                    className={`flex flex-col items-center gap-0.5 py-3 px-2 rounded-2xl font-heading font-black text-sm border-b-4 active:border-b-0 active:translate-y-1 transition-all ${b.cls}`}
                >
                    {b.label}
                    <span className="text-[10px] font-medium opacity-80">{b.subLabel}</span>
                </motion.button>
            ))}
        </motion.div>
    );
}

// ── Session Complete Screen ────────────────────────────────────────────────
function SessionComplete({ logs, topicId, onRestart }: { logs: SRSLog[]; topicId: string; onRestart: () => void }) {
    useEffect(() => {
        void import('@/shared/utils/confetti').then((m) => m.fireRewardConfetti());
    }, []);
    const easyCount = logs.filter((l) => l.rating === 'easy' || l.rating === 'good').length;
    const starsEarned = easyCount >= logs.length * 0.8 ? 3 : easyCount >= logs.length * 0.5 ? 2 : 1;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', bounce: 0.4 }}
            className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center px-6"
        >
            <motion.div
                animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 1, delay: 0.3 }}
                className="text-8xl"
            >
                🎉
            </motion.div>
            <div>
                <Heading level={2} className="text-heading text-4xl mb-2">Xuất sắc!</Heading>
                <Body className="text-body text-lg">Bé đã hoàn thành {logs.length} từ</Body>
            </div>

            {/* Stars */}
            <div className="flex gap-3">
                {[1, 2, 3].map((s, i) => (
                    <motion.div
                        key={s}
                        initial={{ opacity: 0, scale: 0, rotate: -30 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ delay: 0.4 + i * 0.15, type: 'spring', bounce: 0.6 }}
                    >
                        <Star size={48} className={s <= starsEarned ? 'text-star fill-star drop-shadow-lg' : 'text-border'} />
                    </motion.div>
                ))}
            </div>

            {/* Score summary */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                {[
                    { label: 'Thuộc tốt', value: logs.filter((l) => l.rating === 'good' || l.rating === 'easy').length, color: 'text-success' },
                    { label: 'Cần ôn lại', value: logs.filter((l) => l.rating === 'again' || l.rating === 'hard').length, color: 'text-warning' },
                ].map((s) => (
                    <div key={s.label} className="bg-card border-2 border-border rounded-2xl p-4">
                        <div className={`text-3xl font-heading font-black ${s.color}`}>{s.value}</div>
                        <Caption className="text-caption text-xs">{s.label}</Caption>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                <KidButton variant="default" size="lg" className="w-full" onClick={onRestart}>
                    <RotateCcw size={18} /> Học lại
                </KidButton>
                <Link href={`/play/topic/${topicId}`}>
                    <KidButton variant="outline" size="default" className="w-full">
                        Quay lại chủ đề <ChevronRight size={16} />
                    </KidButton>
                </Link>
            </div>
        </motion.div>
    );
}

// ── Main Flashcard Page ────────────────────────────────────────────────────
export default function FlashcardPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const topicId = resolvedParams.id;
    const [deck, setDeck] = useState<Vocabulary[]>([]);
    const [loading, setLoading] = useState(true);
    const [index, setIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [logs, setLogs] = useState<SRSLog[]>([]);
    const [done, setDone] = useState(false);
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        async function loadVocabularies() {
            try {
                setLoading(true);
                const topic = await contentApi.getTopicById(Number(topicId));
                setDeck(topic.vocabularies || []);
            } catch (error) {
                console.error('Failed to load vocabularies:', error);
                setDeck([]);
            } finally {
                setLoading(false);
            }
        }
        loadVocabularies();
    }, [topicId]);

    const card = deck[index];
    const progress = ((index) / deck.length) * 100;

    const handleRate = useCallback((rating: SRSRating) => {
        if (!card) return;
        const newLog = { vocabId: card.id, rating };
        const updatedLogs = [...logs, newLog];
        // TODO: POST /vocabulary-review with SRS data
        setLogs(updatedLogs);
        if (index + 1 >= deck.length) {
            setDone(true);
        } else {
            setLeaving(true);
            setTimeout(() => {
                setIndex((i) => i + 1);
                setFlipped(false);
                setLeaving(false);
            }, 280);
        }
    }, [card, index, deck.length, logs]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary-light via-background to-background pb-20 md:pb-8">
            {/* Top bar */}
            <div className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b-2 border-border">
                <div className="max-w-lg md:max-w-4xl lg:max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center gap-4">
                    <Link href={`/play/topic/${topicId}`}>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-border hover:border-primary transition-colors">
                            <X size={14} className="text-body" />
                        </motion.div>
                    </Link>

                    {/* Progress bar */}
                    <div className="flex-1 h-3.5 bg-background rounded-full border border-border overflow-hidden">
                        <motion.div
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                        />
                    </div>

                    <Caption className="text-caption text-sm font-black whitespace-nowrap">
                        {index}/{deck.length}
                    </Caption>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-6 pt-8">
                {loading ? (
                    <div className="text-center py-12">
                        <Body className="text-caption">Đang tải từ vựng...</Body>
                    </div>
                ) : deck.length === 0 ? (
                    <div className="text-center py-12">
                        <Body className="text-caption">Chưa có từ vựng nào</Body>
                    </div>
                ) : done ? (
                    <SessionComplete logs={logs} topicId={topicId} onRestart={() => { setIndex(0); setFlipped(false); setLogs([]); setDone(false); }} />
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: leaving ? -60 : 60, scale: 0.95 }}
                            animate={{ opacity: leaving ? 0 : 1, x: leaving ? -60 : 0, scale: leaving ? 0.95 : 1 }}
                            exit={{ opacity: 0, x: -60, scale: 0.95 }}
                            transition={{ duration: 0.28 }}
                            className="space-y-8"
                        >
                            {/* Card */}
                            {card && <FlipCard card={card} flipped={flipped} onFlip={() => setFlipped(true)} />}

                            {/* Audio button */}
                            <div className="flex justify-center">
                                <motion.button
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.92 }}
                                    className="flex items-center gap-2 bg-primary-light border-2 border-primary/30 text-primary px-5 py-2.5 rounded-full font-heading font-bold text-sm hover:bg-primary hover:text-white transition-colors"
                                    onClick={() => {/* TODO: play audio */ }}
                                >
                                    <Volume2 size={18} /> Nghe phát âm
                                </motion.button>
                            </div>

                            {/* SRS Buttons — only show after flip */}
                            <AnimatePresence>
                                {flipped && (
                                    <SRSButtons onRate={handleRate} />
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
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
