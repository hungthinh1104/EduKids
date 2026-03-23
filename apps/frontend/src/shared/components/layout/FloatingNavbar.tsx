'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Sun, Moon, Menu, X } from 'lucide-react';
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            initial={{ y: -18, opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className={`fixed z-[100] flex items-center justify-between px-6 max-w-7xl mx-auto transition-all duration-500 ease-out left-0 right-0 ${isScrolled
                ? 'top-4 py-3 bg-card/70 backdrop-blur-2xl border border-white/50 dark:border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-full'
                : 'top-6 py-5 bg-transparent border-transparent shadow-none rounded-3xl'
                }`}
        >
            <Link href="/" className="flex items-center gap-3 group cursor-pointer">
                <div className="bg-gradient-to-br from-primary to-primary-dark text-white p-2.5 rounded-2xl rotate-3 shadow-lg transform transition-all group-hover:-rotate-12 group-hover:scale-110 duration-300">
                    <Sparkles size={24} className="animate-pulse" />
                </div>
                <span className="font-heading font-black text-2xl text-heading tracking-wider flex items-center">
                    EduKids<span className="text-primary text-4xl leading-none">.</span>
                </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-10 font-heading font-bold text-[17px]">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center gap-1.5 text-body hover:text-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-300"
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
                        className="p-3 rounded-full bg-card/50 backdrop-blur-md border border-border/50 text-body hover:text-primary transition-all hover:scale-110 shadow-sm min-h-[46px] min-w-[46px] flex items-center justify-center group"
                        aria-label="Toggle Dark Mode"
                    >
                        <Sun size={20} className="hidden dark:block group-hover:rotate-12 transition-transform" />
                        <Moon size={20} className="block dark:hidden group-hover:-rotate-12 transition-transform" />
                    </button>
                )}
                {rightActions}
                
                {/* Mobile Menu Toggle Button */}
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden p-3 text-body hover:text-primary bg-card/50 backdrop-blur-md border border-border/50 rounded-full shadow-sm"
                    aria-label="Toggle Mobile Menu"
                >
                    {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 right-0 mt-4 mx-2 sm:mx-6 p-6 rounded-3xl bg-card/95 backdrop-blur-3xl border border-border/80 shadow-2xl md:hidden flex flex-col gap-6"
                    >
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 text-lg font-heading font-bold text-body hover:text-primary transition-colors"
                            >
                                {link.icon && <span>{link.icon}</span>}
                                {link.label}
                            </Link>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
