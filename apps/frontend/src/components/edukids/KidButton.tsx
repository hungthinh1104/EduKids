'use client';

import * as React from 'react';
import { cn } from '@/shared/utils/cn';

export interface KidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** 
     * If true, adds a bouncy scale effect on tap and hover. 
     * @default true 
     */
    animated?: boolean;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

/**
 * KidButton: A highly gamified wrapper over Shadcn's `<Button>` using Framer Motion.
 * It features large rounded borders, thick bottom borders for a 3D effect,
 * and playful bounce animations.
 */
export const KidButton = React.forwardRef<HTMLButtonElement, KidButtonProps>(
    ({ className, variant = 'default', size = 'default', animated = true, ...props }, ref) => {
    const { onDrag, onDragStart, onDragEnd, ...restProps } = props;
        // Determine internal variant logic to map into playful 3D classes
        // since standard Shadcn classes are a bit "flat".

        // Base 3D styling rules
        const baseKidStyles = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-heading font-bold tracking-wide transition-all border-b-4 active:border-b-0 active:translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';

        let gamifiedClasses = '';

        switch (variant) {
            case 'default':
                gamifiedClasses = 'bg-primary hover:bg-primary/90 text-white border-primary-dark';
                break;
            case 'destructive':
                gamifiedClasses = 'bg-error hover:bg-error/90 text-white border-error-dark';
                break;
            case 'outline':
                gamifiedClasses = 'bg-card hover:bg-background text-body border-border active:border-b-2 dark:bg-background dark:border-border dark:text-heading';
                break;
            case 'secondary':
                gamifiedClasses = 'bg-secondary hover:bg-secondary/90 text-white border-secondary-dark';
                break;
            case 'ghost':
                gamifiedClasses = 'border-b-0 active:translate-y-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-body dark:text-heading rounded-full';
                break;
            default:
                gamifiedClasses = '';
        }

        let sizeClasses = '';
        switch (size) {
            case 'default':
                sizeClasses = 'h-10 px-4 py-2';
                break;
            case 'sm':
                sizeClasses = 'h-9 px-3 text-xs';
                break;
            case 'lg':
                sizeClasses = 'h-14 px-8 text-lg';
                break;
            case 'icon':
                sizeClasses = 'h-10 w-10';
                break;
            default:
                sizeClasses = '';
        }

        return (
            <button
                ref={ref}
                className={cn(
                    baseKidStyles,
                    gamifiedClasses,
                    sizeClasses,
                    animated && 'transform-gpu transition-transform duration-150 hover:scale-105 active:scale-95',
                    className,
                )}
                onDrag={onDrag}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                {...restProps}
            />
        );
    }
);

KidButton.displayName = 'KidButton';
