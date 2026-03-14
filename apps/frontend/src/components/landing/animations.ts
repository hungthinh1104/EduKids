export const staggerContainer = {
    hidden: { opacity: 1 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
};

export const fadeInUp = {
    hidden: { opacity: 1, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export const scaleIn = {
    hidden: { opacity: 1, scale: 0.96 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.8, type: 'spring' as const, bounce: 0.4 } },
};
