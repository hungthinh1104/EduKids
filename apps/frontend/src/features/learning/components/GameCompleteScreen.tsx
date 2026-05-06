'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Star, RotateCcw, ChevronRight } from 'lucide-react';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { KidButton } from '@/components/edukids/KidButton';
import { playSound } from '@/shared/utils/sound';

export interface GameStat {
    label: string;
    value: React.ReactNode;
    colorClass?: string;
}

export interface GameCompleteScreenProps {
    emoji?: string;
    title: string;
    subtitle: string;
    starsEarned: number;
    maxStars?: number;
    stats: GameStat[];
    topicId: string;
    onRestart: () => void;
    restartLabel?: string;
    backLabel?: string;
}

export function GameCompleteScreen({
    emoji = '🎉',
    title,
    subtitle,
    starsEarned,
    maxStars = 3,
    stats,
    topicId,
    onRestart,
    restartLabel = 'Chơi lại',
    backLabel = 'Quay lại chủ đề',
}: GameCompleteScreenProps) {
    useEffect(() => {
        void import('@/shared/utils/confetti').then((m) => m.fireRewardConfetti());
        playSound('fanfare');
    }, []);

    // Create array for stars [1, 2, 3, ...]
    const starArray = Array.from({ length: maxStars }, (_, i) => i + 1);

    return (
        <motion.div
            initial={{ opacity: 1, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', bounce: 0.4 }}
            className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center px-4 md:px-6 py-8"
        >
            <motion.div
                animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 1, delay: 0.3 }}
                className="text-7xl md:text-8xl drop-shadow-md"
            >
                {emoji}
            </motion.div>
            
            <div>
                <Heading level={2} className="text-heading text-3xl md:text-4xl mb-2">{title}</Heading>
                <Body className="text-body text-lg">{subtitle}</Body>
            </div>

            {/* Stars */}
            <div className="flex gap-2 justify-center">
                {starArray.map((s, i) => (
                    <motion.div
                        key={s}
                        initial={{ opacity: 0, scale: 0, rotate: -30 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ delay: 0.4 + i * 0.15, type: 'spring', bounce: 0.6 }}
                    >
                        <Star 
                            size={maxStars > 3 ? 36 : 48} 
                            className={s <= starsEarned ? 'text-star fill-star drop-shadow-lg' : 'text-border'} 
                        />
                    </motion.div>
                ))}
            </div>

            {/* Score summary */}
            {stats.length > 0 && (
                <div className={`grid gap-3 w-full max-w-md ${stats.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'}`}>
                    {stats.map((s, idx) => (
                        <div key={idx} className="bg-card border-2 border-border rounded-2xl p-4 text-center">
                            <div className={`text-2xl md:text-3xl font-heading font-black ${s.colorClass || 'text-heading'}`}>
                                {s.value}
                            </div>
                            <Caption className="text-caption text-xs mt-1">{s.label}</Caption>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
                <KidButton variant="default" size="lg" className="w-full" onClick={onRestart}>
                    <RotateCcw size={18} /> {restartLabel}
                </KidButton>
                <Link href={`/play/topic/${topicId}`}>
                    <KidButton variant="outline" size="default" className="w-full">
                        {backLabel} <ChevronRight size={16} />
                    </KidButton>
                </Link>
            </div>
        </motion.div>
    );
}
