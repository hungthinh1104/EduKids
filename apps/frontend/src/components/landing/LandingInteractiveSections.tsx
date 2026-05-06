'use client';

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';

const FloatingNavbar = dynamic(
    () => import('@/shared/components/layout/FloatingNavbar').then((mod) => mod.FloatingNavbar),
    { ssr: false },
);

const HeroSection = dynamic(
    () => import('@/components/landing/HeroSection').then((mod) => mod.HeroSection),
    { ssr: false },
);

const TestimonialsSection = dynamic(
    () => import('@/components/landing/TestimonialsSection').then((mod) => mod.TestimonialsSection),
    { ssr: false },
);

interface LandingInteractiveSectionsProps {
    rightActions: ReactNode;
}

export function LandingInteractiveSections({ rightActions }: LandingInteractiveSectionsProps) {
    return (
        <>
            <FloatingNavbar
                links={[
                    { href: '#features', label: 'Khám Phá' },
                    { href: '#how-it-works', label: 'Phương Pháp' },
                    { href: '#parents', label: 'Phụ Huynh' },
                ]}
                showThemeToggle
                rightActions={rightActions}
            />
            <HeroSection />
            <TestimonialsSection />
        </>
    );
}