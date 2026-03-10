'use client';

import * as React from 'react';
import { cn } from '@/shared/utils/cn';
import { semanticColors } from '@/shared/utils/design-tokens';

export interface FeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Enables hover tilt/float animations */
    animated?: boolean;
    /** Custom border color to make it playful */
    borderColor?: keyof typeof semanticColors;
}

export const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
    ({ className, animated = true, borderColor = 'primary', children, ...props }, ref) => {
        const { onDrag, onDragStart, onDragEnd, ...restProps } = props;

        // Convert color to tailwind class if needed, or use inline style mapping
        // But since it's dynamic, we'll use a style object or standard map
        const borderClassMap: Record<string, string> = {
            primary: 'border-b-primary',
            secondary: 'border-b-secondary',
            accent: 'border-b-accent',
            success: 'border-b-success',
            warning: 'border-b-warning',
            error: 'border-b-error',
        };

        const baseClasses = 'rounded-[2rem] border-t-8 border-x-2 border-b-8 bg-white dark:bg-card shadow-lg hover:shadow-xl transition-shadow overflow-hidden relative';
        const borderBClass = borderClassMap[borderColor as string] || 'border-b-primary';
        const borderTClass = borderClassMap[borderColor as string]?.replace('border-b-', 'border-t-') || 'border-t-primary';

        return (
            <div
                ref={ref}
                className={cn(
                    baseClasses,
                    borderBClass,
                    borderTClass,
                    animated && 'transform-gpu transition-transform duration-300 hover:-translate-y-2',
                    className,
                )}
                onDrag={onDrag}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                {...restProps}
            >
                {children}
            </div>
        );
    }
);

FeatureCard.displayName = 'FeatureCard';
