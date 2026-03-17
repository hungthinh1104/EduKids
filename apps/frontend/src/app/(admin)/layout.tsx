import type { ReactNode } from 'react';
import Link from 'next/link';
import {
    LayoutDashboard, BookOpen, HelpCircle, Users, BarChart2,
    Settings, Package,
} from 'lucide-react';
import { FloatingNavbar } from '@/shared/components/layout/FloatingNavbar';


const NAV = [
    { href: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { href: '/admin/topics-manage', icon: <BookOpen size={18} />, label: 'Chủ đề' },
    { href: '/admin/vocabularies', icon: <Package size={18} />, label: 'Từ vựng' },
    { href: '/admin/quizzes', icon: <HelpCircle size={18} />, label: 'Quiz' },
    { href: '/admin/users', icon: <Users size={18} />, label: 'Người dùng' },
    { href: '/admin/analytics', icon: <BarChart2 size={18} />, label: 'Phân tích' },
    { href: '/admin/settings', icon: <Settings size={18} />, label: 'Cài đặt' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 relative overflow-hidden flex flex-col">
            {/* Ambient Background Orbs */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 dark:bg-primary/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-overlay opacity-60 animate-blob pointer-events-none z-0" />
            <div className="fixed top-[20%] right-[-10%] w-[35%] h-[40%] bg-success/20 dark:bg-success/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-overlay opacity-50 animate-blob animation-delay-2000 pointer-events-none z-0" />
            <div className="fixed bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-accent/20 dark:bg-accent/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-overlay opacity-60 animate-blob animation-delay-4000 pointer-events-none z-0" />

            {/* Top Navigation Bar */}
            <div data-admin-navbar="true" className="transition-all duration-200 ease-out">
                <FloatingNavbar
                    links={NAV.map(nav => ({ href: nav.href, label: nav.label, icon: nav.icon }))}
                    showThemeToggle={true}
                    rightActions={
                        <div className="flex items-center gap-3">
                            <Link href="/admin/settings">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-heading font-bold text-sm shadow-md cursor-pointer hover:shadow-lg transition-all hover:scale-105">
                                    A
                                </div>
                            </Link>
                        </div>
                    }
                />
            </div>

            {/* Mobile bottom tab bar */}
            <div data-admin-bottom-nav="true" className="md:hidden fixed bottom-0 left-0 right-0 z-[100] flex border-t border-white/50 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl pb-1 shadow-[0_-8px_30px_rgb(0,0,0,0.05)] overflow-x-auto no-scrollbar transition-all duration-200 ease-out">
                {NAV.map((item) => (
                    <Link key={item.href} href={item.href} className="flex-1 min-w-[64px] flex flex-col items-center justify-center gap-0.5 py-3 text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary-light transition-colors relative">
                        {item.icon}
                        <span className="text-[9px] font-heading font-bold mt-0.5 whitespace-nowrap">{item.label}</span>
                    </Link>
                ))}
            </div>

            {/* Main content */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 mt-20 md:mt-24 pb-28 md:pb-8 relative z-10">
                {children}
            </main>

            {/* Mobile safe zone for bottom navbar */}
            <div className="md:hidden h-24 bg-slate-50 dark:bg-slate-900" aria-hidden="true" />
        </div>
    );
}
