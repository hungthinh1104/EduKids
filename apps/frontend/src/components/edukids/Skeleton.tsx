import { HTMLAttributes } from 'react';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`animate-pulse rounded-xl bg-border/50 ${className}`}
            {...props}
        />
    );
}
