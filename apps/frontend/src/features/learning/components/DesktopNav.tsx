'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Map, Trophy, ShoppingBag, RefreshCw, Medal } from 'lucide-react';
import { CHILD_NAV_ITEMS, type ChildNavTab } from '@/shared/constants/navigation';

interface DesktopNavProps {
    active?: ChildNavTab;
}

const NAV_ICONS: Record<ChildNavTab, React.ReactNode> = {
    map: <Map size={20} />,
    leaderboard: <Medal size={20} />,
    achievements: <Trophy size={20} />,
    shop: <ShoppingBag size={20} />,
    review: <RefreshCw size={20} />,
};

/**
 * DesktopNav — horizontal navigation bar for desktop screens.
 * Displayed as part of the GameHUD on larger screens (md+).
 */
export function DesktopNav({ active = 'map' }: DesktopNavProps) {
    return (
        <div className="hidden md:flex items-center gap-2 lg:gap-3">
            {CHILD_NAV_ITEMS.map((item) => {
                const isActive = item.id === active;
                return (
                    <Link key={item.id} href={item.href}>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-heading font-bold text-sm transition-all ${
                                isActive
                                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                    : 'bg-background text-body hover:bg-primary-light hover:text-primary border-2 border-border hover:border-primary/40'
                            }`}
                        >
                            {NAV_ICONS[item.id]}
                            <span className="hidden lg:inline">{item.label}</span>
                        </motion.div>
                    </Link>
                );
            })}
        </div>
    );
}
