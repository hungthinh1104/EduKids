'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { X, Heart, Flame, Zap, CheckCircle2, XCircle, ChevronRight, RotateCcw, Star } from 'lucide-react';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { KidButton } from '@/components/edukids/KidButton';
import { quizApi, QuizQuestion, QuizOption } from '@/features/learning/api/quiz.api';
import { markTopicModeCompleted } from '@/features/learning/utils/topic-mode-progress';
import { playSound } from '@/shared/utils/sound';
import { useRef } from 'react';

const MAX_HP = 5;
const STREAK_BONUS_AT = 3;
const TIME_LIMIT = 15;

type AnswerState = 'idle' | 'correct' | 'wrong';

type LocalQuizQuestion = QuizQuestion & {
    shuffledOptions: QuizOption[];
    image?: string; // Currently missing from BE DTO, but used in UI
};

function shuffleOptions<T>(options: T[]): T[] {
    return [...options].sort(() => Math.random() - 0.5);
}

// ── Feedback Overlay ───────────────────────────────────────────────────────
function FeedbackOverlay({ state }: { state: AnswerState }) {
    if (state === 'idle') return null;
    return (
        <AnimatePresence>
            <motion.div
                key={state}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
            >
                <div className={`text-[120px] drop-shadow-2xl ${state === 'correct' ? 'animate-bounce' : ''}`}>
                    {state === 'correct' ? '✅' : '❌'}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// ── Timer ring ─────────────────────────────────────────────────────────────
function TimerRing({ seconds, total }: { seconds: number; total: number }) {
    const r = 20;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (seconds / total) * circumference;
    const color = seconds <= 5 ? 'var(--color-error)' : seconds <= 10 ? 'var(--color-warning)' : 'var(--color-primary)';

    return (
        <div className="relative w-14 h-14 flex items-center justify-center">
            <svg viewBox="0 0 48 48" className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="24" cy="24" r={r} fill="none" stroke="var(--color-border)" strokeWidth="4" />
                <motion.circle
                    cx="24" cy="24" r={r}
                    fill="none" stroke={color} strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transition={{ duration: 1, ease: 'linear' }}
                />
            </svg>
            <span className={`font-heading font-black text-lg z-10 ${seconds <= 5 ? 'text-secondary animate-pulse' : 'text-heading'}`}>{seconds}</span>
        </div>
    );
}

// ── Session Result ─────────────────────────────────────────────────────────
function QuizComplete({ correct, total, topicId, onRestart }: { correct: number; total: number; topicId: string; onRestart: () => void }) {
    useEffect(() => {
        void import('@/shared/utils/confetti').then((m) => m.fireRewardConfetti());
        playSound('fanfare');
    }, []);
    const pct = Math.round((correct / total) * 100);
    const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : 1;
    const msg = pct >= 90 ? '🏆 Hoàn hảo!' : pct >= 60 ? '💪 Không tệ!' : '📚 Cố lên nào!';

    return (
        <motion.div
            initial={{ opacity: 1, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', bounce: 0.4 }}
            className="flex flex-col items-center justify-center min-h-[70vh] gap-7 text-center px-6"
        >
            <motion.div animate={{ rotate: [0, -12, 12, 0] }} transition={{ duration: 1, delay: 0.3 }} className="text-8xl">
                {pct >= 90 ? '🏆' : pct >= 60 ? '🎉' : '😅'}
            </motion.div>

            <div>
                <Heading level={2} className="text-heading text-4xl mb-1">{msg}</Heading>
                <Body className="text-body text-xl">{correct}/{total} câu đúng</Body>
            </div>

            {/* Stars */}
            <div className="flex gap-3">
                {[1, 2, 3].map((s, i) => (
                    <motion.div key={s} initial={{ opacity: 0, scale: 0, rotate: -30 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ delay: 0.4 + i * 0.15, type: 'spring', bounce: 0.6 }}>
                        <Star size={52} className={s <= stars ? 'text-star fill-star drop-shadow-lg' : 'text-border'} />
                    </motion.div>
                ))}
            </div>

            {/* Accuracy ring */}
            <div className="relative w-32 h-32">
                <svg viewBox="0 0 100 100" className="-rotate-90 w-full h-full">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-border)" strokeWidth="8" />
                    <motion.circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-success)" strokeWidth="8"
                        strokeDasharray={251.2}
                        initial={{ strokeDashoffset: 251.2 }}
                        animate={{ strokeDashoffset: 251.2 - (pct / 100) * 251.2 }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-heading font-black text-3xl text-heading">{pct}%</span>
                    <Caption className="text-caption text-xs">chính xác</Caption>
                </div>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                <KidButton variant="default" size="lg" className="w-full" onClick={onRestart}>
                    <RotateCcw size={18} /> Chơi lại
                </KidButton>
                <Link href={`/play/topic/${topicId}`}>
                    <KidButton variant="outline" className="w-full">
                        Quay lại chủ đề <ChevronRight size={16} />
                    </KidButton>
                </Link>
            </div>
        </motion.div>
    );
}

// ── Main Quiz Page ─────────────────────────────────────────────────────────
export default function QuizPage() {
    const params = useParams<{ id: string }>();
    const id = params?.id ?? '';
    const parsedTopicId = Number.parseInt(id, 10);
    const [questions, setQuestions] = useState<LocalQuizQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [quizSessionId, setQuizSessionId] = useState<string | null>(null);
    const [index, setIndex] = useState(0);
    const [selected, setSelected] = useState<string | null>(null);
    const [revealedCorrectOptionId, setRevealedCorrectOptionId] = useState<number | null>(null);
    const [answerState, setAnswerState] = useState<AnswerState>('idle');
    const [hp, setHp] = useState(MAX_HP);
    const [streak, setStreak] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [done, setDone] = useState(false);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

    // Refs to track timeouts and prevent memory leaks
    const answerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const timeLeftRef = useRef(TIME_LIMIT);

    useEffect(() => {
        timeLeftRef.current = timeLeft;
    }, [timeLeft]);

    useEffect(() => {
        return () => {
            if (answerTimeoutRef.current) {
                clearTimeout(answerTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        async function loadQuiz() {
            try {
                setLoading(true);
                setLoadError(null);

                if (!Number.isInteger(parsedTopicId) || parsedTopicId <= 0) {
                    setLoadError('Chủ đề không hợp lệ.');
                    return;
                }

                const session = await quizApi.startQuiz(parsedTopicId);
                setQuizSessionId(session.quizSessionId);

                const questionList = session.questions?.length
                    ? session.questions
                    : session.firstQuestion
                        ? [session.firstQuestion]
                        : [];

                setQuestions(questionList.map((q: QuizQuestion) => ({
                    ...q,
                    shuffledOptions: shuffleOptions(q.options),
                    image: '❓' // Fallback image since not in schema yet
                })));
            } catch (error) {
                console.error('Failed to load quiz:', error);
                setLoadError('Không thể tải quiz. Vui lòng thử lại.');
                setQuestions([]);
            } finally {
                setLoading(false);
            }
        }
        loadQuiz();
    }, [parsedTopicId]);

    const q = questions[index];

    const handleAnswer = useCallback(async (option: QuizOption | '__timeout__' | null) => {
        if (selected || !q || !quizSessionId || option === null) return;

        const isTimeout = option === '__timeout__';
        const answerText = isTimeout ? '__timeout__' : option.text;
        setSelected(answerText);

        let isCorrect = false;
        let correctAnswerId: number | null = null;

        try {
            const result = await quizApi.submitAnswer({
                quizSessionId,
                questionId: q.questionId,
                selectedOptionId: isTimeout ? 0 : option.id,
                timeTakenMs: (TIME_LIMIT - timeLeftRef.current) * 1000,
            });

            isCorrect = Boolean(result.isCorrect);
            correctAnswerId = Number(result.correctAnswerId);
        } catch (error) {
            console.error('Failed to submit answer:', error);

            // Fallback when submit fails: keep UI responsive
            if (!isTimeout && typeof option.id === 'number') {
                isCorrect = false;
                correctAnswerId = option.id;
            }
        }

        if (isCorrect) {
            playSound('success');
            setAnswerState('correct');
            setCorrectCount((c) => c + 1);
            setStreak((s) => s + 1);
        }

        if (!isCorrect) {
            playSound('error');
            setAnswerState('wrong');
            setHp((h) => Math.max(0, h - 1));
            setStreak(0);
        }

        setRevealedCorrectOptionId(correctAnswerId);

        answerTimeoutRef.current = setTimeout(() => {
            setAnswerState('idle');
            setSelected(null);
            setRevealedCorrectOptionId(null);
            setTimeLeft(TIME_LIMIT);
            if (index + 1 >= questions.length || hp - (isCorrect ? 0 : 1) <= 0) {
                markTopicModeCompleted(parsedTopicId, 'quiz');
                setDone(true);
            } else {
                setIndex((i) => i + 1);
            }
        }, 1000);
    }, [selected, q, quizSessionId, index, questions.length, hp, parsedTopicId]);

    // Timer
    useEffect(() => {
        if (selected || done) return;
        if (timeLeft <= 0) {
            const timeoutTick = setTimeout(() => handleAnswer('__timeout__'), 0);
            return () => clearTimeout(timeoutTick);
        }
        const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [timeLeft, selected, done, handleAnswer]);

    if (done) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-warning-light via-background to-background">
                <QuizComplete correct={correctCount} total={index + 1} topicId={id} onRestart={() => { setIndex(0); setSelected(null); setRevealedCorrectOptionId(null); setAnswerState('idle'); setHp(MAX_HP); setStreak(0); setCorrectCount(0); setDone(false); setTimeLeft(TIME_LIMIT); }} />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-warning-light via-background to-background flex items-center justify-center">
                <Body className="text-caption">Đang tải câu hỏi...</Body>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-warning-light via-background to-background flex items-center justify-center">
                <Body className="text-error">{loadError}</Body>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-warning-light via-background to-background flex items-center justify-center">
                <Body className="text-caption">Chưa có câu hỏi nào</Body>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-warning-light via-background to-background pb-20 md:pb-8">
            <FeedbackOverlay state={answerState} />

            {/* HUD Bar */}
            <div className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b-2 border-border">
                <div className="max-w-lg md:max-w-4xl lg:max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center gap-3">
                    <Link href={`/play/topic/${id}`}>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-border hover:border-primary transition-colors">
                            <X size={14} className="text-body" />
                        </motion.div>
                    </Link>

                    {/* Progress */}
                    <div className="flex-1 h-3.5 bg-background rounded-full border border-border overflow-hidden">
                        <motion.div
                            animate={{ width: `${(index / questions.length) * 100}%` }}
                            className="h-full bg-gradient-to-r from-warning to-primary rounded-full"
                        />
                    </div>

                    {/* HP */}
                    <div className="flex gap-0.5">
                        {[...Array(MAX_HP)].map((_, i) => (
                            <motion.div key={i} animate={{ scale: i < hp ? 1 : 0.6 }} transition={{ duration: 0.2 }}>
                                <Heart size={16} className={i < hp ? 'text-secondary fill-secondary' : 'text-border'} />
                            </motion.div>
                        ))}
                    </div>

                    {/* Streak */}
                    {streak > 0 && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 bg-warning-light text-warning px-2 py-1 rounded-full text-xs font-heading font-black">
                            <Flame size={12} className="fill-warning" /> {streak}
                        </motion.div>
                    )}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ opacity: 1, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-lg mx-auto px-6 pt-6 space-y-6"
                >
                    {/* Timer + Question number */}
                    <div className="flex items-center justify-between">
                        <Caption className="text-caption font-black text-base">Câu {index + 1}/{questions.length}</Caption>
                        <TimerRing seconds={timeLeft} total={TIME_LIMIT} />
                    </div>

                    {/* Streak bonus notification */}
                    <AnimatePresence>
                        {streak > 0 && streak % STREAK_BONUS_AT === 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex items-center justify-center gap-2 bg-warning text-white px-4 py-2 rounded-2xl font-heading font-black text-sm shadow-lg shadow-warning/30"
                            >
                                <Zap size={16} className="fill-white" /> Streak x{streak}! +Bonus sao 🌟
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Question */}
                    {q && (
                        <>
                            <div className="bg-card border-2 border-border rounded-[2rem] p-8 text-center shadow-lg min-h-[220px] flex flex-col items-center justify-center">
                                <motion.div
                                    animate={{ scale: [1, 1.06, 1] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                    className="text-7xl mb-5"
                                >
                                    {q.image}
                                </motion.div>
                                <Heading level={3} className="text-heading text-2xl">{q.questionText}</Heading>
                            </div>

                            {/* Options */}
                            <div className="grid grid-cols-2 gap-3">
                                {q.shuffledOptions.map((opt: QuizOption, i: number) => {
                                    const isSelected = selected === opt.text;
                                    const isCorrect = revealedCorrectOptionId === opt.id;
                                    const showFeedback = selected !== null;

                                    let optCls = 'bg-card border-2 border-border text-heading hover:border-primary/60 hover:bg-primary-light hover:text-primary';
                                    if (showFeedback) {
                                        if (isCorrect) optCls = 'bg-success border-success text-white shadow-lg shadow-success/30';
                                        else if (isSelected && !isCorrect) optCls = 'bg-error border-error text-white shadow-lg shadow-error/30';
                                        else optCls = 'bg-background border-border text-caption opacity-50';
                                    }

                                    return (
                                        <motion.button
                                            key={opt.id}
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={
                                                showFeedback && isCorrect
                                                    ? { scale: [1, 1.1, 1.05], boxShadow: ['0px 0px 0px rgba(0,0,0,0)', '0px 0px 40px rgba(16, 185, 129, 0.6)', '0px 0px 20px rgba(16, 185, 129, 0.4)'] }
                                                    : showFeedback && isSelected && !isCorrect
                                                        ? { x: [0, -10, 10, -10, 10, 0] }
                                                        : { opacity: 1, y: 0 }
                                            }
                                            transition={
                                                showFeedback && isSelected && !isCorrect
                                                    ? { duration: 0.4 }
                                                    : { delay: !showFeedback ? 0.05 * i : 0 }
                                            }
                                            whileHover={!selected ? { scale: 1.03, y: -3 } : undefined}
                                            whileTap={!selected ? { scale: 0.97 } : undefined}
                                            onClick={() => handleAnswer(opt)}
                                            disabled={!!selected}
                                            className={`relative flex items-center justify-center gap-2 p-4 rounded-2xl font-heading font-black text-base border-2 min-h-[80px] transition-all duration-200 ${optCls}`}
                                        >
                                            {showFeedback && isCorrect && <CheckCircle2 size={18} className="flex-shrink-0" />}
                                            {showFeedback && isSelected && !isCorrect && <XCircle size={18} className="flex-shrink-0" />}
                                            {opt.text}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
