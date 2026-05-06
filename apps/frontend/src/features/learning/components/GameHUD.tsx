'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Flame, Star, Heart, ArrowLeft } from 'lucide-react';
import type { RewardSummary } from '@/features/profile/types/child-profile.types';
import { DesktopNav } from './DesktopNav';

interface GameHUDProps {
    nickname: string;
    avatar: string;
    rewards: Pick<RewardSummary, 'streakDays' | 'totalPoints' | 'currentLevel'>;
    hp?: number;
    maxHp?: number;
    backHref?: string;
    onBackClick?: () => void;
    activeNav?: 'map' | 'leaderboard' | 'achievements' | 'shop' | 'review';
}

/**
 * GameHUD — sticky top bar for all child game screens.
 * Used by: /play, /play/topic/[id], /play/topic/[id]/flashcard, /play/topic/[id]/quiz
 */
export function GameHUD({ nickname, avatar, rewards, hp = 5, maxHp = 5, backHref = '/play', onBackClick, activeNav = 'map' }: GameHUDProps) {
    return (
        <motion.div
            initial={{ opacity: 1, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="sticky top-0 z-50 w-full bg-card/90 backdrop-blur-xl border-b-2 border-border"
        >
            <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between gap-3 md:gap-6">
                {/* Left section: Back + Avatar */}
                <div className="flex items-center gap-3 md:gap-4">
                    {/* Back */}
                    {onBackClick ? (
                        <motion.button
                            type="button"
                            onClick={onBackClick}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-background border-2 border-border hover:border-primary transition-colors flex items-center justify-center"
                        >
                            <ArrowLeft size={16} className="text-body md:w-5 md:h-5" />
                        </motion.button>
                    ) : (
                        <Link href={backHref}>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-background border-2 border-border hover:border-primary transition-colors flex items-center justify-center"
                            >
                                <ArrowLeft size={16} className="text-body md:w-5 md:h-5" />
                            </motion.div>
                        </Link>
                    )}

                    {/* Avatar + name */}
                    <div className="flex items-center gap-2.5 md:gap-3">
                        <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-primary-light border-2 border-primary overflow-hidden flex items-center justify-center">
                            {avatar ? (
                                <Image src={avatar} alt={nickname} width={36} height={36} className="md:w-12 md:h-12" />
                            ) : (
                                <span className="text-xl md:text-2xl">👶</span>
                            )}
                        </div>
                        <span className="font-heading font-black text-heading text-sm md:text-lg">{nickname}</span>
                    </div>
                </div>

                {/* Center section: Desktop Navigation (hidden on mobile) */}
                <DesktopNav active={activeNav} />

                {/* Right section: Stats */}
                <div className="flex items-center gap-2 md:gap-3">
                    {/* Streak */}
                    <div className="flex items-center gap-1.5 md:gap-2 bg-warning-light border border-warning/30 px-3 md:px-4 py-1.5 md:py-2 rounded-full">
                        <Flame size={16} className="text-warning fill-warning md:w-5 md:h-5" />
                        <span className="font-heading font-black text-warning text-sm md:text-base">{rewards.streakDays}</span>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-1.5 md:gap-2 bg-warning-light border border-warning/30 px-3 md:px-4 py-1.5 md:py-2 rounded-full">
                        <Star size={16} className="text-star fill-star md:w-5 md:h-5" />
                        <span className="font-heading font-black text-warning text-sm md:text-base">{rewards.totalPoints.toLocaleString()}</span>
                    </div>

                    {/* HP */}
                    <div className="flex gap-0.5 md:gap-1">
                        {[...Array(maxHp)].map((_, i) => (
                            <Heart key={i} size={16} className={`${i < hp ? 'text-secondary fill-secondary' : 'text-border'} md:w-5 md:h-5`} />
                        ))}
                    </div>

                    {/* Level */}
                    <div className="bg-primary text-white font-heading font-black text-xs md:text-base px-3 md:px-5 py-1.5 md:py-2 rounded-full shadow-md shadow-primary/30">
                        Lv.{rewards.currentLevel}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
