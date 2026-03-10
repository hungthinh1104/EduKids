import type { ReactNode } from 'react';
import Link from 'next/link';
import { Bell, LayoutDashboard, BarChart2, Lightbulb, Settings } from 'lucide-react';
import { FloatingNavbar } from '@/shared/components/layout/FloatingNavbar';
import { PARENT_NAV_ITEMS } from '@/shared/constants/navigation';

const PARENT_NAV = PARENT_NAV_ITEMS.map((item) => ({
    ...item,
    Icon:
        item.href === '/dashboard'
            ? LayoutDashboard
            : item.href === '/reports'
                ? BarChart2
                : item.href === '/recommendations'
                    ? Lightbulb
                    : Settings,
}));

export default function ParentLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
            {/* Ambient Background Orbs */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 dark:bg-primary/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-overlay opacity-60 animate-blob pointer-events-none z-0" />
            <div className="fixed top-[20%] right-[-10%] w-[35%] h-[40%] bg-success/20 dark:bg-success/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-overlay opacity-50 animate-blob animation-delay-2000 pointer-events-none z-0" />
            <div className="fixed bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-accent/20 dark:bg-accent/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-overlay opacity-60 animate-blob animation-delay-4000 pointer-events-none z-0" />
            {/* Top Navigation Bar */}
            <FloatingNavbar
                links={PARENT_NAV.map(nav => {
                    const IconComponent = nav.Icon;
                    return { href: nav.href, label: nav.label, icon: <IconComponent size={15} /> };
                })}
                showThemeToggle={true}
                rightActions={
                    <div className="flex items-center gap-3">
                        <button
                            className="relative w-10 h-10 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 hover:border-primary transition-all hover:scale-110 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-primary shadow-sm"
                            aria-label="Thông báo"
                        >
                            <Bell size={18} />
                            <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-secondary rounded-full border border-card" />
                        </button>
                        <Link href="/settings">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-heading font-bold text-sm shadow-md cursor-pointer hover:shadow-lg transition-all hover:scale-105">
                                P
                            </div>
                        </Link>
                    </div>
                }
            />

            {/* Mobile bottom tab bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] flex border-t border-white/50 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl pb-1 shadow-[0_-8px_30px_rgb(0,0,0,0.05)]">
                {PARENT_NAV.map(({ href, label, Icon }) => (
                    <Link key={href} href={href} className="flex-1 flex flex-col items-center gap-0.5 py-3 text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary-light transition-colors relative">
                        <Icon size={20} />
                        <span className="text-[10px] font-heading font-bold mt-0.5">{label}</span>
                    </Link>
                ))}
            </div>
            {/* Page Content */}
            <main className="max-w-7xl mx-auto px-4 pt-8 mt-20 md:mt-24 pb-28 md:pb-8">
                {children}
            </main>

            {/* Mobile safe zone for bottom navbar */}
            <div className="md:hidden h-24 bg-slate-50 dark:bg-slate-900" aria-hidden="true" />
        </div>
    );
}
