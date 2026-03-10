'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Map, Trophy, ShoppingBag, RefreshCw } from 'lucide-react';
import { Caption } from '@/shared/components/Typography';
import { CHILD_NAV_ITEMS, type ChildNavTab } from '@/shared/constants/navigation';

interface BottomNavProps {
    active?: ChildNavTab;
}

const NAV_ICONS: Record<ChildNavTab, React.ReactNode> = {
    map: <Map size={22} />,
    achievements: <Trophy size={22} />,
    shop: <ShoppingBag size={22} />,
    review: <RefreshCw size={22} />,
};

/**
 * BottomNav — persistent bottom navigation for all /play/* screens.
 * Accepts `active` tab id to highlight current route.
 */
export function BottomNav({ active = 'map' }: BottomNavProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t-2 border-border md:hidden">
            <div className="max-w-lg mx-auto flex">
                {CHILD_NAV_ITEMS.map((item) => {
                    const isActive = item.id === active;
                    return (
                        <Link key={item.id} href={item.href} className="flex-1">
                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                className={`relative flex flex-col items-center gap-1 py-3 transition-colors ${isActive ? 'text-primary' : 'text-body hover:text-primary'}`}
                            >
                                {NAV_ICONS[item.id]}
                                <Caption className={`text-[10px] font-bold ${isActive ? 'text-primary' : ''}`}>
                                    {item.label}
                                </Caption>
                                {isActive && (
                                    <motion.div
                                        layoutId="bottom-nav-indicator"
                                        className="absolute bottom-1 w-1.5 h-1.5 bg-primary rounded-full"
                                    />
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
