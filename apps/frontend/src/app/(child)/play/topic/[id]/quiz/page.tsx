'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Heart, Flame, Zap, CheckCircle2, XCircle } from 'lucide-react';
import { Heading, Caption } from '@/shared/components/Typography';
import { quizApi, QuizQuestion, QuizOption } from '@/features/learning/api/quiz.api';
import { markTopicModeCompleted } from '@/features/learning/utils/topic-mode-progress';
import { playSound } from '@/shared/utils/sound';
import { LearningModeShell, ModeStatePanel } from '@/features/learning/components/LearningModeShell';
import { GameCompleteScreen } from '@/features/learning/components/GameCompleteScreen';

const MAX_HP = 5;
const STREAK_BONUS_AT = 3;
const TIME_LIMIT = 15;

type AnswerState = 'idle' | 'correct' | 'wrong';

type LocalQuizQuestion = QuizQuestion & {
    shuffledOptions: QuizOption[];
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

    const loadQuiz = useCallback(async () => {
        try {
            setLoading(true);
            setLoadError(null);

            if (!Number.isInteger(parsedTopicId) || parsedTopicId <= 0) {
                setLoadError('Chủ đề không hợp lệ.');
                setQuestions([]);
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
            })));
            setIndex(0);
            setSelected(null);
            setRevealedCorrectOptionId(null);
            setAnswerState('idle');
            setHp(MAX_HP);
            setStreak(0);
            setCorrectCount(0);
            setDone(false);
            setTimeLeft(TIME_LIMIT);
        } catch (error) {
            console.error('Failed to load quiz:', error);
            setLoadError('Không thể tải quiz. Vui lòng thử lại.');
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    }, [parsedTopicId]);

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
        void loadQuiz();
    }, [loadQuiz]);

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

    const pct = done && index > 0 ? Math.round((correctCount / (index + 1)) * 100) : 0;
    const starsEarned = pct >= 90 ? 3 : pct >= 60 ? 2 : 1;
    const titleComplete = pct >= 90 ? 'Hoàn hảo!' : pct >= 60 ? 'Không tệ!' : 'Cố lên nào!';
    const emojiComplete = pct >= 90 ? '🏆' : pct >= 60 ? '🎉' : '😅';

    return (
        <LearningModeShell
            backHref={`/play/topic/${id}`}
            progressCurrent={Math.min(index + 1, Math.max(questions.length, 1))}
            progressTotal={Math.max(questions.length, 1)}
            title="Quiz Game"
            subtitle="Chọn đáp án đúng và nhanh nhất có thể"
            progressFromClass="from-warning"
            progressToClass="to-primary"
            contentMaxWidthClass="max-w-lg"
            navRightSlot={
                <div className="flex items-center gap-3">
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
            }
        >
            <FeedbackOverlay state={answerState} />

            {loading ? (
                <ModeStatePanel
                    title="Đang tải câu hỏi"
                    description="Chuẩn bị câu hỏi cho bé..."
                    emoji="⏳"
                />
            ) : loadError ? (
                <ModeStatePanel
                    title="Có lỗi xảy ra"
                    description={loadError}
                    emoji="❌"
                />
            ) : questions.length === 0 ? (
                <ModeStatePanel
                    title="Chưa có câu hỏi"
                    description="Chủ đề này chưa có câu hỏi nào để luyện."
                    emoji="📭"
                />
            ) : done ? (
                <GameCompleteScreen
                    emoji={emojiComplete}
                    title={titleComplete}
                    subtitle={`Bé đã trả lời ${correctCount}/${index + 1} câu đúng`}
                    starsEarned={starsEarned}
                    topicId={id}
                    onRestart={() => {
                        if (answerTimeoutRef.current) {
                            clearTimeout(answerTimeoutRef.current);
                            answerTimeoutRef.current = null;
                        }
                        void loadQuiz();
                    }}
                    stats={[
                        { label: 'Chính xác', value: `${pct}%`, colorClass: pct >= 80 ? 'text-success' : 'text-primary' },
                        { label: 'Câu đúng', value: correctCount, colorClass: 'text-success' }
                    ]}
                />
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={index}
                        initial={{ opacity: 1, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6 pt-2"
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
                                    {q.questionImage ? (
                                        <div className="mb-5 w-full max-w-[260px] h-[160px] rounded-2xl overflow-hidden border border-border/70 bg-background">
                                            <Image
                                                src={q.questionImage}
                                                alt="Quiz question"
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                                width={260}
                                                height={160}
                                            />
                                        </div>
                                    ) : (
                                        <motion.div
                                            animate={{ scale: [1, 1.06, 1] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                            className="text-7xl mb-5"
                                        >
                                            ❓
                                        </motion.div>
                                    )}
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
            )}
        </LearningModeShell>
    );
}
