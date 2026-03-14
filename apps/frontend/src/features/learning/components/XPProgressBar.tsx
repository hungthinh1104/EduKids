'use client';

import { motion } from 'framer-motion';
import { Caption } from '@/shared/components/Typography';

interface XPProgressBarProps {
    currentLevel: number;
    currentPoints: number;
}

/**
 * Calculates XP required for a given level using an RPG scaling curve.
 * Formula: Base (100) * 1.5^(level-1)
 */
export function calculateRequiredXp(level: number): number {
    return Math.floor(100 * Math.pow(1.5, Math.max(0, level - 1)));
}

/**
 * XPProgressBar — shows level progress toward next level dynamically.
 */
export function XPProgressBar({ currentLevel, currentPoints }: XPProgressBarProps) {
    const pointsForNextLevel = calculateRequiredXp(currentLevel);
    // Calculate progress percentage (0-100)
    // Assuming backend returns total absolute points, true progress = currentPoints / pointsForNextLevel
    // If backend returns points relative to current level ONLY, then we use that directly.
    // For now we assume currentPoints is the absolute total XP.
    // Progress within current level = currentPoints / pointsForNextLevel
    const levelProgress = Math.min(100, Math.max(0, (currentPoints / pointsForNextLevel) * 100));
    return (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-card border-2 border-border rounded-2xl p-4 flex items-center gap-4"
        >
            <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                    <Caption className="text-caption text-xs font-bold">Level {currentLevel}</Caption>
                    <Caption className="text-caption text-xs">{currentPoints} / {pointsForNextLevel} XP</Caption>
                </div>
                <div className="w-full h-3 bg-background rounded-full border border-border overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${levelProgress}%` }}
                        transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    />
                </div>
            </div>
            <Caption className="text-primary font-heading font-black text-sm shrink-0">
                Level {currentLevel + 1} →
            </Caption>
        </motion.div>
    );
}
