'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function MagneticButton({
    children,
    className,
    onClick,
}: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
        const { clientX, clientY } = e;
        const { height, width, left, top } =
            ref.current?.getBoundingClientRect() || { height: 0, width: 0, left: 0, top: 0 };
        const middleX = clientX - (left + width / 2);
        const middleY = clientY - (top + height / 2);
        setPosition({ x: middleX * 0.3, y: middleY * 0.3 }); // 0.3 is the pull strength
    };

    const reset = () => {
        setPosition({ x: 0, y: 0 });
    };

    const { x, y } = position;

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouse}
            onMouseLeave={reset}
            animate={{ x, y }}
            transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
            className={`relative inline-flex items-center justify-center ${className}`}
            onClick={onClick}
        >
            {/* Container for content that also moves slightly more for a 3d effect */}
            <motion.div
                animate={{ x: x * 0.5, y: y * 0.5 }}
                transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
                className="w-full h-full flex items-center justify-center font-bold"
            >
                {children}
            </motion.div>
        </motion.div>
    );
}
