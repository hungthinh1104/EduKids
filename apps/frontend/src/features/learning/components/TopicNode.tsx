'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Lock, Star, ChevronRight } from 'lucide-react';
import { Heading, Body, Caption } from '@/shared/components/Typography';

interface TopicNodeProps {
    id: number;
    name: string;
    icon: string;
    color: string;
    starsEarned: number;
    completed: number;
    total: number;
    locked: boolean;
    isCurrent: boolean;
    index: number;
}

const COLOR_MAP: Record<string, { bg: string; ring: string; text: string; glow: string }> = {
    primary: { bg: 'bg-primary', ring: 'ring-primary', text: 'text-primary', glow: 'shadow-primary/40' },
    success: { bg: 'bg-success', ring: 'ring-success', text: 'text-success', glow: 'shadow-success/40' },
    secondary: { bg: 'bg-secondary', ring: 'ring-secondary', text: 'text-secondary', glow: 'shadow-secondary/40' },
    accent: { bg: 'bg-accent', ring: 'ring-accent', text: 'text-accent', glow: 'shadow-accent/40' },
    warning: { bg: 'bg-warning', ring: 'ring-warning', text: 'text-warning', glow: 'shadow-warning/40' },
};

export function TopicNode({ id, name, icon, color, starsEarned, completed, total, locked, isCurrent, index }: TopicNodeProps) {
    const colors = COLOR_MAP[color] ?? COLOR_MAP.primary;
    const progressPct = total > 0 ? (completed / total) * 100 : 0;
    const isCompleted = completed === total && total > 0;

    // Alternate left/right for a winding path feel
    const isRight = index % 2 === 0;

    return (
        <motion.div
            initial={{ opacity: 0, x: isRight ? 40 : -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className={`flex ${isRight ? 'justify-end' : 'justify-start'}`}
        >
            {locked ? (
                // Locked node
                <motion.div 
                    whileTap={{ x: [-5, 5, -4, 4, -2, 2, 0] }}
                    className="relative w-48 rounded-[1.5rem] bg-card border-2 border-dashed border-border p-5 flex flex-col items-center gap-3 opacity-60 cursor-not-allowed"
                >
                    <div className="w-16 h-16 rounded-full bg-background border-2 border-border flex items-center justify-center text-3xl grayscale">
                        {icon}
                    </div>
                    <Body className="text-body text-sm font-bold text-center">{name}</Body>
                    <div className="flex items-center gap-1.5 text-body text-xs">
                        <Lock size={12} /> Chưa mở khóa
                    </div>
                </motion.div>
            ) : (
                // Unlocked / current node
                <Link href={`/play/topic/${id}`}>
                    <motion.div
                        animate={isCurrent ? { y: [0, -6, 0] } : {}}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{
                            y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
                            scale: { type: 'spring', stiffness: 300, damping: 20 }
                        }}
                        className={`relative w-52 rounded-[1.75rem] bg-card border-2 p-5 flex flex-col items-center gap-3 cursor-pointer
              shadow-lg group
              ${isCurrent ? `border-${color} shadow-${color}/30 shadow-xl ring-4 ring-${color}/20` : 'border-border hover:border-current hover:shadow-lg'}
            `}
                    >
                        {/* Current badge */}
                        {isCurrent && (
                            <motion.div
                                animate={{ scale: [1, 1.08, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className={`absolute -top-3 left-1/2 -translate-x-1/2 ${colors.bg} text-white text-[11px] font-heading font-bold px-3 py-0.5 rounded-full shadow-md whitespace-nowrap`}
                            >
                                ▶ Đang học
                            </motion.div>
                        )}

                        {/* Icon */}
                        <div className={`relative w-20 h-20 rounded-full flex items-center justify-center text-4xl
              ${isCurrent ? `${colors.bg} shadow-xl ${colors.glow}` : 'bg-background border-2 border-border group-hover:border-current'}`}
                        >
                            {isCompleted ? (
                                <span className="text-4xl">✅</span>
                            ) : (
                                <span className="text-4xl group-hover:animate-wiggle">{icon}</span>
                            )}
                        </div>

                        {/* Name */}
                        <Heading level={4} className={`text-heading text-base text-center group-hover:${colors.text} transition-colors`}>
                            {name}
                        </Heading>

                        {/* Stars */}
                        <div className="flex gap-1">
                            {[1, 2, 3].map((s) => (
                                <Star key={s} size={16} className={s <= starsEarned ? 'text-star fill-star' : 'text-border'} />
                            ))}
                        </div>

                        {/* Progress bar */}
                        <div className="w-full space-y-1">
                            <div className="w-full h-2.5 bg-background rounded-full overflow-hidden border border-border">
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${progressPct}%` }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.7, ease: 'easeOut' }}
                                    className={`h-full ${colors.bg} rounded-full`}
                                />
                            </div>
                            <Caption className="text-caption text-[11px] text-right">{completed}/{total} từ</Caption>
                        </div>

                        {/* CTA arrow */}
                        <div className={`flex items-center gap-1 text-sm font-heading font-bold ${colors.text}`}>
                            Vào học <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </motion.div>
                </Link>
            )}
        </motion.div>
    );
}
