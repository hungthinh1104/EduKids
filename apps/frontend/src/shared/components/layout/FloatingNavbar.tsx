'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

export interface NavLink {
    href: string;
    label: string;
    icon?: React.ReactNode;
}

export interface FloatingNavbarProps {
    links: NavLink[];
    rightActions?: React.ReactNode;
    showThemeToggle?: boolean;
}

export function FloatingNavbar({ links, rightActions, showThemeToggle = false }: FloatingNavbarProps) {
    const { resolvedTheme, setTheme } = useTheme();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        // Initial check
        handleScroll();
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, type: 'spring', bounce: 0.3 }}
            className={`fixed z-[100] flex items-center justify-between px-6 max-w-7xl mx-auto transition-all duration-500 ease-out left-0 right-0 ${isScrolled
                ? 'top-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-full'
                : 'top-6 py-5 bg-transparent border-transparent shadow-none rounded-3xl'
                }`}
        >
            <Link href="/" className="flex items-center gap-3 group cursor-pointer">
                <div className="bg-gradient-to-br from-primary to-primary-dark text-white p-2.5 rounded-2xl rotate-3 shadow-lg transform transition-all group-hover:-rotate-12 group-hover:scale-110 duration-300">
                    <Sparkles size={24} className="animate-pulse" />
                </div>
                <span className="font-heading font-black text-2xl text-slate-800 dark:text-white tracking-wider flex items-center">
                    EduKids<span className="text-primary text-4xl leading-none">.</span>
                </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-10 font-heading font-bold text-[17px]">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary-light transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-300"
                    >
                        {link.icon && <span className="mb-0.5">{link.icon}</span>}
                        {link.label}
                    </Link>
                ))}
            </div>

            <div className="flex items-center gap-3">
                {showThemeToggle && (
                    <button
                        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                        className="p-3 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:text-primary transition-all hover:scale-110 shadow-sm"
                        aria-label="Toggle Dark Mode"
                    >
                        {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                )}
                {rightActions}
            </div>
        </motion.nav>
    );
}
