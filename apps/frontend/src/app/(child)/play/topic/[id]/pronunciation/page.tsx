'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { X, Mic, Volume2, Star, RotateCcw, ChevronRight } from 'lucide-react';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { KidButton } from '@/components/edukids/KidButton';
import { contentApi, Vocabulary } from '@/features/learning/api/content.api';

// Confidence → stars mapping (matches BE: <61%=2star, 61-75%=3star, 76-90%=4star, >91%=5star)
function confidenceToStars(pct: number) {
    if (pct >= 91) return 5;
    if (pct >= 76) return 4;
    if (pct >= 61) return 3;
    return 2;
}

// Points per star tier (matches AnalyticsService)
function starsToPoints(stars: number) {
    return stars >= 5 ? 20 : stars >= 4 ? 15 : 10;
}

type Stage = 'ready' | 'recording' | 'result';

interface PronunciationResult {
    vocabId: number;
    confidence: number;
    stars: number;
    points: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// WaveAnimation — mic wave visual while recording
// ─────────────────────────────────────────────────────────────────────────────
function WaveAnimation() {
    return (
        <div className="flex items-center justify-center gap-1.5 h-12">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <motion.div
                    key={i}
                    className="w-2 bg-gradient-to-t from-primary to-accent rounded-full"
                    animate={{ height: ['8px', `${16 + (i % 3) * 14}px`, '8px'] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' }}
                />
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// StarRating — animated star reveal
// ─────────────────────────────────────────────────────────────────────────────
function StarRating({ stars }: { stars: number }) {
    return (
        <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((s, i) => (
                <motion.div
                    key={s}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: i * 0.12, type: 'spring', bounce: 0.6 }}
                >
                    <Star
                        size={36}
                        className={s <= stars ? 'text-warning fill-warning drop-shadow-lg' : 'text-border'}
                    />
                </motion.div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SessionComplete — summary after all words
// ─────────────────────────────────────────────────────────────────────────────
function SessionComplete({ results, topicId, onRestart }: { results: PronunciationResult[]; topicId: string; onRestart: () => void }) {
    useEffect(() => {
        void import('@/shared/utils/confetti').then((m) => m.fireRewardConfetti());
    }, []);
    const avgStars = results.reduce((a, r) => a + r.stars, 0) / results.length;
    const totalPoints = results.reduce((a, r) => a + r.points, 0);
    const avgConf = Math.round(results.reduce((a, r) => a + r.confidence, 0) / results.length);

    return (
        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.4 }}
            className="flex flex-col items-center gap-8 text-center px-4 py-8"
        >
            <motion.div animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 1, delay: 0.3 }} className="text-7xl">🎤</motion.div>
            <div>
                <Heading level={2} className="text-heading text-3xl">Luyện xong rồi! 🎉</Heading>
                <Body className="text-body mt-1">Bé đã phát âm {results.length} từ</Body>
            </div>
            <StarRating stars={Math.round(avgStars)} />

            <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                {[
                    { label: 'Tổng điểm', value: `+${totalPoints}⭐`, color: 'text-warning' },
                    { label: 'Độ chính xác', value: `${avgConf}%`, color: avgConf >= 76 ? 'text-success' : 'text-primary' },
                    { label: 'Từ giỏi (4-5⭐)', value: results.filter((r) => r.stars >= 4).length, color: 'text-success' },
                ].map((s) => (
                    <div key={s.label} className="bg-card border-2 border-border rounded-2xl p-3 text-center">
                        <div className={`text-xl font-heading font-black ${s.color}`}>{s.value}</div>
                        <Caption className="text-caption text-[10px]">{s.label}</Caption>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                <KidButton variant="default" size="lg" className="w-full" onClick={onRestart}>
                    <RotateCcw size={18} /> Luyện lại
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

// ─────────────────────────────────────────────────────────────────────────────
// Main Pronunciation Page — UC-03
// Endpoint: POST /api/learning/pronunciation with { vocabularyId, audioBlob }
// → Response: { confidenceScore, starsEarned, pointsAwarded }
// ─────────────────────────────────────────────────────────────────────────────
export default function PronunciationPage() {
    const params = useParams<{ id: string }>();
    const id = params?.id ?? '';
    const [vocabList, setVocabList] = useState<Vocabulary[]>([]);
    const [loading, setLoading] = useState(true);
    const [index, setIndex] = useState(0);
    const [stage, setStage] = useState<Stage>('ready');
    const [countdown, setCountdown] = useState(3);
    const [confidence, setConfidence] = useState(0);
    const [results, setResults] = useState<PronunciationResult[]>([]);
    const [done, setDone] = useState(false);

    useEffect(() => {
        async function loadVocabularies() {
            try {
                setLoading(true);
                const topic = await contentApi.getTopicById(Number(id));
                setVocabList(topic.vocabularies || []);
            } catch (error) {
                console.error('Failed to load vocabularies:', error);
                setVocabList([]);
            } finally {
                setLoading(false);
            }
        }
        loadVocabularies();
    }, [id]);

    const vocab = vocabList[index];
    const progress = vocabList.length > 0 ? (index / vocabList.length) * 100 : 0;

    // Simulate recording + AI scoring (3-second countdown)

    return (
        <div className="min-h-screen bg-gradient-to-b from-accent-light via-background to-background pb-20 md:pb-8">
            {/* Top bar */}
            <div className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b-2 border-border">
                <div className="max-w-lg md:max-w-4xl lg:max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center gap-4">
                    <Link href={`/play/topic/${id}`}>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center">
                            <X size={14} className="text-body" />
                        </motion.div>
                    </Link>
                    <div className="flex-1 h-3.5 bg-background rounded-full border border-border overflow-hidden">
                        <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} className="h-full bg-gradient-to-r from-accent to-primary rounded-full" />
                    </div>
                    <Caption className="text-caption text-sm font-black whitespace-nowrap">{index}/{vocabList.length}</Caption>
                </div>
            </div>

            <div className="max-w-lg md:max-w-4xl lg:max-w-7xl mx-auto px-6 md:px-8 pt-8">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <div className="text-center py-12">
                            <Body className="text-caption">Đang tải từ vựng...</Body>
                        </div>
                    ) : vocabList.length === 0 ? (
                        <div className="text-center py-12">
                            <Body className="text-caption">Chưa có từ vựng nào</Body>
                        </div>
                    ) : done ? (
                        <SessionComplete key="done" results={results} topicId={id} onRestart={() => {
                            setIndex(0);
                            setStage('ready');
                            setConfidence(0);
                            setResults([]);
                            setDone(false);
                        }} />
                    ) : vocab ? (
                        <motion.div key={index} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.25 }} className="space-y-8">

                            {/* Word card */}
                            <motion.div className="bg-card border-4 border-accent rounded-[2.5rem] p-8 flex flex-col items-center gap-5 shadow-2xl shadow-accent/15">
                                <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 3, repeat: Infinity }} className="text-8xl">{vocab.emoji}</motion.div>
                                <Heading level={2} className="text-heading text-5xl font-black">{vocab.word}</Heading>
                                <Caption className="text-caption text-xl">{vocab.phonetic}</Caption>
                                <Caption className="text-caption text-sm">{vocab.translation}</Caption>

                                {/* Listen button */}
                                <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                                    className="flex items-center gap-2 bg-primary-light border-2 border-primary/30 text-primary px-5 py-2.5 rounded-full font-heading font-bold text-sm hover:bg-primary hover:text-white transition-colors"
                                    onClick={() => {/* TODO: play audio */ }}
                                >
                                    <Volume2 size={18} /> Nghe
                                </motion.button>
                            </motion.div>

                            {/* Stage: ready */}
                            <AnimatePresence mode="wait">
                                {stage === 'ready' && (
                                    <motion.div key="ready" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
                                        <Body className="text-body text-center">Nhấn nút để bắt đầu nói từ này</Body>
                                        <motion.button
                                            whileHover={{ scale: 1.06 }}
                                            whileTap={{ scale: 0.94 }}
                                            onClick={() => {
                                                setStage('recording');
                                                setCountdown(3);
                                                let c = 3;
                                                const interval = setInterval(() => {
                                                    c -= 1;
                                                    setCountdown(c);
                                                    if (c <= 0) {
                                                        clearInterval(interval);
                                                        const simulatedConf = Math.floor(Math.random() * 40) + 60;
                                                        setConfidence(simulatedConf);
                                                        setStage('result');
                                                    }
                                                }, 1000);
                                            }}
                                            className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-2xl shadow-primary/30 border-4 border-white"
                                        >
                                            <Mic size={40} className="text-white" />
                                        </motion.button>
                                        <Caption className="text-caption text-sm">Phát âm rõ ràng và to nhé!</Caption>
                                    </motion.div>
                                )}

                                {/* Stage: recording */}
                                {stage === 'recording' && (
                                    <motion.div key="recording" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-5">
                                        <WaveAnimation />
                                        <motion.div className="w-20 h-20 rounded-full bg-error flex items-center justify-center shadow-2xl shadow-error/40"
                                            animate={{ scale: [1, 1.08, 1], boxShadow: ['0 0 0 0px rgba(239,68,68,0.3)', '0 0 0 20px rgba(239,68,68,0)', '0 0 0 0px rgba(239,68,68,0)'] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                        >
                                            <span className="text-white font-heading font-black text-3xl">{countdown}</span>
                                        </motion.div>
                                        <Caption className="text-caption">AI đang lắng nghe...</Caption>
                                    </motion.div>
                                )}

                                {/* Stage: result */}
                                {stage === 'result' && (
                                    <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                        {/* Score ring */}
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="relative w-28 h-28">
                                                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-border)" strokeWidth="10" />
                                                    <motion.circle cx="50" cy="50" r="42" fill="none"
                                                        stroke={confidence >= 76 ? 'var(--color-success)' : confidence >= 61 ? 'var(--color-primary)' : 'var(--color-warning)'}
                                                        strokeWidth="10" strokeLinecap="round"
                                                        strokeDasharray={2 * Math.PI * 42}
                                                        initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                                                        animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - confidence / 100) }}
                                                        transition={{ duration: 1 }}
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="font-heading font-black text-heading text-2xl">{confidence}%</span>
                                                    <Caption className="text-caption text-[10px]">chính xác</Caption>
                                                </div>
                                            </div>
                                            <StarRating stars={confidenceToStars(confidence)} />
                                            <Caption className="text-success font-bold">+{starsToPoints(confidenceToStars(confidence))} ⭐ điểm</Caption>
                                        </div>

                                        {/* Feedback message */}
                                        <div className={`text-center p-4 rounded-2xl border-2 ${confidence >= 76 ? 'bg-success-light border-success text-success' : confidence >= 61 ? 'bg-primary-light border-primary text-primary' : 'bg-warning-light border-warning text-warning'}`}>
                                            <Body className="font-heading font-bold">
                                                {confidence >= 91 ? '🌟 Hoàn hảo! Phát âm chuẩn lắm!' :
                                                    confidence >= 76 ? '✨ Rất tốt! Gần như hoàn hảo!' :
                                                        confidence >= 61 ? '👍 Tốt! Cố lên nha!' :
                                                            '💪 Thử lại để tốt hơn nhé!'}
                                            </Body>
                                        </div>

                                        <div className="flex gap-3">
                                            <button onClick={() => setStage('ready')} className="flex-1 py-3 rounded-2xl bg-background border-2 border-border font-heading font-bold text-body hover:border-primary/50 transition-colors flex items-center justify-center gap-2">
                                                <RotateCcw size={16} /> Thử lại
                                            </button>
                                            <KidButton variant="default" size="default" className="flex-2 flex-1" onClick={() => {
                                                const stars = confidenceToStars(confidence);
                                                const points = starsToPoints(stars);
                                                const newResult: PronunciationResult = { vocabId: vocab.id, confidence, stars, points };
                                                const updated = [...results, newResult];
                                                setResults(updated);

                                                if (index + 1 >= vocabList.length) {
                                                    setDone(true);
                                                } else {
                                                    setIndex((i) => i + 1);
                                                    setStage('ready');
                                                    setConfidence(0);
                                                }
                                            }}>
                                                {index + 1 >= vocabList.length ? 'Hoàn thành' : 'Từ tiếp'} <ChevronRight size={16} />
                                            </KidButton>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>
        </div>
    );
}
