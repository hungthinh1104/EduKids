'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Flame, Star, Lock, ChevronRight, Loader2 } from 'lucide-react';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { switchProfile } from '@/features/profile/api/profile.api';
import type { ChildProfile } from '@/features/profile/types/child-profile.types';

interface ChildProfileCardProps {
    profile: ChildProfile;
    isActive?: boolean;
}

const LEVEL_COLORS = [
    'from-success to-success-dark',
    'from-primary to-primary-dark',
    'from-accent to-purple-600',
    'from-warning to-orange-500',
    'from-secondary to-rose-700',
];

function getLevelColor(level: number) {
    return LEVEL_COLORS[(level - 1) % LEVEL_COLORS.length];
}

export function ChildProfileCard({ profile, isActive }: ChildProfileCardProps) {
    const router = useRouter();
    const [switching, setSwitching] = useState(false);
    const [switchError, setSwitchError] = useState<string | null>(null);
    const levelGradient = getLevelColor(profile.currentLevel);
    const isOnStreak = profile.streakDays > 0;

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        
        if (switching) return;

        try {
            setSwitchError(null);
            setSwitching(true);
            
            // Switch profile to get LEARNER role JWT + set role=LEARNER cookie
            await switchProfile(profile.id);
            
            // Use router.push for smooth navigation with new cookies
            // Middleware will validate role=LEARNER and allow /play access
            router.push('/play');
        } catch (error) {
            console.error('Failed to switch profile:', error);
            setSwitchError('Không thể chuyển hồ sơ. Vui lòng thử lại.');
            setSwitching(false);
        }
    };

    return (
        <motion.div
            whileHover={{ scale: switching ? 1 : 1.04, y: switching ? 0 : -6 }}
            whileTap={{ scale: switching ? 1 : 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="relative"
        >
            <div
                onClick={handleClick}
                className={`relative rounded-[2.25rem] p-6 border border-border/70 shadow-[0_8px_24px_rgba(0,0,0,0.05)] cursor-pointer transition-all duration-300 overflow-hidden group
            ${switching ? 'opacity-60 cursor-wait' : ''}
            ${isActive ? 'bg-card shadow-primary/15 shadow-xl ring-2 ring-primary/40' : 'bg-card/90 hover:bg-card hover:shadow-lg hover:border-primary/30'}`}
            >
                    {/* Background gradient blob */}
                    <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${levelGradient} opacity-10 rounded-bl-full -z-0`} />

                    {/* Active indicator */}
                    {isActive && (
                        <div className="absolute top-4 right-4 bg-primary text-white text-xs font-heading font-bold px-3 py-1 rounded-full shadow-md z-10">
                            <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping opacity-75"></span>
                            Đang học
                        </div>
                    )}

                    <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                        {/* Avatar */}
                        <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${levelGradient} p-1 shadow-md`}>
                            <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                                <Image
                                    src={profile.avatar}
                                    alt={profile.nickname}
                                    width={88}
                                    height={88}
                                    className="object-contain p-1"
                                />
                            </div>
                            {/* Level Badge */}
                            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r ${levelGradient} text-white text-xs font-heading font-black px-3 py-0.5 rounded-full shadow-md whitespace-nowrap`}>
                                Lv.{profile.currentLevel}
                            </div>
                        </div>

                        {/* Name */}
                        <Heading level={3} className="text-heading text-xl mt-3">{profile.nickname}</Heading>
                        <Caption className="text-caption text-sm">{profile.age} tuổi</Caption>

                        {/* Stats chips */}
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${isOnStreak ? 'bg-warning-light text-warning' : 'bg-background text-body'}`}>
                                <Flame size={14} className={isOnStreak ? 'fill-warning' : ''} />
                                {profile.streakDays}
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning-light text-warning text-sm font-bold">
                                <Star size={14} className="fill-warning" />
                                <span suppressHydrationWarning>{profile.totalPoints.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-heading font-bold text-sm transition-all duration-300 
              bg-primary text-white group-hover:bg-primary-dark shadow-sm`}
                        >
                            {switching ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Đang chuyển...
                                </>
                            ) : (
                                <>
                                    Học ngay <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </div>
                        {switchError && (
                            <Caption className="text-error text-xs">{switchError}</Caption>
                        )}
                    </div>
                </div>
            </motion.div>
    );
}

export function AddChildCard() {
    return (
        <motion.div
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
            <Link href="/add-child">
                <div className="relative bg-card/85 rounded-[2.25rem] p-6 border-2 border-dashed border-border hover:border-primary/60 hover:bg-card cursor-pointer transition-all duration-300 group h-full min-h-[280px]">
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-20 h-20 rounded-full border-4 border-dashed border-border group-hover:border-primary/60 flex items-center justify-center transition-colors duration-300">
                            <span className="text-4xl text-body group-hover:text-primary transition-colors">+</span>
                        </div>
                        <Body className="text-body group-hover:text-primary font-bold transition-colors">
                            Thêm hồ sơ bé
                        </Body>
                        <Caption className="text-caption text-xs max-w-[140px]">
                            Tạo tài khoản học cho bé của bạn
                        </Caption>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

export function LockedChildCard() {
    return (
        <motion.div whileTap={{ x: [-5, 5, -4, 4, -2, 2, 0] }} className="relative bg-card rounded-[2rem] p-6 border-2 border-dashed border-border opacity-60 cursor-not-allowed">
            <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-20 h-20 rounded-full bg-background flex items-center justify-center">
                    <Lock size={32} className="text-body" />
                </div>
                <Body className="text-body font-bold">Nâng cấp để thêm bé</Body>
                <Caption className="text-caption text-xs">Gói Premium hỗ trợ nhiều hồ sơ bé</Caption>
            </div>
        </motion.div>
    );
}
