'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Heading, Caption } from '@/shared/components/Typography';
import { TableBadge } from '@/features/admin/components/AdminUI';

interface Quiz {
    id: number;
    topicId: number;  // FK reference to Topic
    topicName: string;
    question: string;
    type: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    options: string[];
    correctIndex: number;
    timesAttempted: number;
    accuracy: number;
}

const DIFFICULTY_COLORS = { EASY: 'success', MEDIUM: 'warning', HARD: 'error' } as const;
const DIFFICULTY_LABELS = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' } as const;

interface QuizPreviewModalProps {
    quiz: Quiz | null;
    onClose: () => void;
}

/**
 * QuizPreviewModal — centered modal showing full quiz question + options.
 * Correct answer is highlighted with a CheckCircle. Shows attempt stats.
 * Used by: /admin/quizzes
 */
export function QuizPreviewModal({ quiz, onClose }: QuizPreviewModalProps) {
    return (
        <AnimatePresence>
            {quiz && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-card border-2 border-border rounded-3xl p-8 w-full max-w-md shadow-2xl">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <TableBadge label={DIFFICULTY_LABELS[quiz.difficulty]} variant={DIFFICULTY_COLORS[quiz.difficulty]} />
                                    <Caption className="text-caption text-xs mt-1">{quiz.topicName}</Caption>
                                </div>
                                <button onClick={onClose} className="p-2 rounded-xl bg-background border border-border hover:bg-error hover:text-white transition-colors text-body">✕</button>
                            </div>

                            {/* Question */}
                            <Heading level={3} className="text-heading text-xl mb-6 text-center">{quiz.question}</Heading>

                            {/* Options */}
                            {quiz.options.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {quiz.options.map((opt, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                            className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${i === quiz.correctIndex ? 'border-success bg-success-light' : 'border-border bg-background'}`}
                                        >
                                            {i === quiz.correctIndex
                                                ? <CheckCircle size={16} className="text-success shrink-0" />
                                                : <div className="w-4 h-4 rounded-full border-2 border-border shrink-0" />
                                            }
                                            <span className={`font-heading font-bold text-sm ${i === quiz.correctIndex ? 'text-success' : 'text-body'}`}>{opt}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-background border-2 border-dashed border-border rounded-2xl p-6 text-center">
                                    <Caption className="text-caption">Dạng kéo thả — xem trước trong app</Caption>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="mt-6 grid grid-cols-2 gap-3 pt-4 border-t-2 border-border">
                                <div className="text-center">
                                    <div className="font-heading font-black text-heading text-xl">{quiz.timesAttempted.toLocaleString()}</div>
                                    <Caption className="text-caption text-xs">lần thử</Caption>
                                </div>
                                <div className="text-center">
                                    <div className={`font-heading font-black text-xl flex items-center justify-center gap-1.5 ${quiz.accuracy >= 80 ? 'text-success' : quiz.accuracy >= 65 ? 'text-warning' : 'text-error'}`}>
                                        {quiz.accuracy}%
                                        {quiz.accuracy < 70 && <AlertCircle size={14} />}
                                    </div>
                                    <Caption className="text-caption text-xs">độ chính xác</Caption>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Re-export Quiz type so pages can reference it
export type { Quiz };
