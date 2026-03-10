'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { Sparkles } from 'lucide-react';

export interface RewardBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Adds a sparkling animation icon */
    showSparkle?: boolean;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export function RewardBadge({ className, variant = 'default', showSparkle = true, children, ...props }: RewardBadgeProps) {
    const baseClasses = 'inline-flex items-center px-4 py-1.5 rounded-full text-sm font-heading font-bold tracking-wide shadow-sm border-2';

    // Custom playful variants mapped over shadcn ones
    let variantClasses = '';
    switch (variant) {
        case 'default':
            variantClasses = 'bg-primary-light text-primary border-primary/20';
            break;
        case 'secondary':
            variantClasses = 'bg-secondary-light text-secondary border-secondary/20';
            break;
        case 'destructive':
            variantClasses = 'bg-error-light text-error border-error/20';
            break;
        case 'outline':
            variantClasses = 'bg-white text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200';
            break;
    }

    return (
        <motion.div
            whileHover={{ scale: 1.05, rotate: [-2, 2, -2, 0] }}
            transition={{ type: 'spring', stiffness: 400 }}
            className="inline-block"
        >
            <div className={cn(baseClasses, variantClasses, className)} {...props}>
                {showSparkle && (
                    <Sparkles className="w-4 h-4 mr-1.5 text-yellow-400 animate-pulse" />
                )}
                {children}
            </div>
        </motion.div>
    );
}
