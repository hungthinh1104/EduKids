'use client';

import { useMotionValue, motion, useMotionTemplate } from 'framer-motion';

export default function SpotlightCard({
    children,
    className,
    spotlightColor = 'rgba(16, 185, 129, 0.15)', // Default to success green theme
}: {
    children: React.ReactNode;
    className?: string;
    spotlightColor?: string;
}) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();

        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <div
            className={`group relative overflow-hidden rounded-[2.5rem] border border-border bg-background dark:bg-card/50 ${className}`}
            onMouseMove={handleMouseMove}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-[2.5rem] opacity-0 transition duration-300 group-hover:opacity-100 mix-blend-overlay dark:mix-blend-screen"
                style={{
                    background: useMotionTemplate`
            radial-gradient(
              600px circle at ${mouseX}px ${mouseY}px,
              ${spotlightColor},
              transparent 80%
            )
          `,
                }}
            />
            <div className="relative h-full">{children}</div>
        </div>
    );
}
