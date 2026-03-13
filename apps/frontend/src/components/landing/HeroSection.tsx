'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Play, Star, Brain, Mic, CheckCircle2 } from 'lucide-react';
import { Body } from '@/shared/components/Typography';
import { KidButton } from '@/components/edukids/KidButton';
import MagneticButton from '@/shared/components/landing/MagneticButton';
import { useAuthStore } from '@/shared/store/auth.store';
import { staggerContainer, fadeInUp, scaleIn } from './animations';

export function HeroSection() {
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
    const heroY = useTransform(scrollY, [0, 800], [0, 200]);

    const { isAuthenticated, user, isLoading } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isReady = mounted && !isLoading;

    const targetHref = isReady && isAuthenticated
        ? (user?.role === 'ADMIN' ? '/admin' : user?.role === 'PARENT' ? '/dashboard' : '/play')
        : '/register';

    return (
        <section ref={heroRef} className="relative pt-44 pb-20 lg:pt-52 lg:pb-32 px-4 flex items-center justify-center min-h-[95vh]">
            {/* Dynamic Background Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], opacity: [0.4, 0.6, 0.4] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                    className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] bg-primary-light/50 dark:bg-primary/20 rounded-full mix-blend-multiply dark:mix-blend-screen blur-[100px]"
                />
                <motion.div
                    animate={{ scale: [1, 1.5, 1], x: [0, 100, 0], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-[20%] right-[0%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-secondary-light/40 dark:bg-secondary/20 rounded-full mix-blend-multiply dark:mix-blend-screen blur-[100px]"
                />
                <motion.div
                    animate={{ y: [0, -100, 0], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -bottom-[20%] left-[30%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] bg-accent-light/40 dark:bg-accent/20 rounded-full mix-blend-multiply dark:mix-blend-screen blur-[120px]"
                />
                {/* Subtle Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 dark:opacity-10"></div>
            </div>

            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-8 relative z-10 w-full">
                {/* Left Column (Text Content) */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="flex-1 text-center lg:text-left z-20"
                >
                    <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/80 dark:border-slate-700 shadow-sm mb-8">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                        </span>
                        <span className="font-heading font-bold text-slate-700 dark:text-slate-200 text-sm tracking-wide">English for Future Leaders</span>
                    </motion.div>

                    <motion.div variants={fadeInUp}>
                        <h1 className="font-heading font-black text-5xl sm:text-6xl md:text-7xl lg:text-[5rem] leading-[1.05] tracking-tight text-slate-900 dark:text-white mb-6">
                            Giỏi Tiếng Anh <br />
                            <span className="relative inline-block mt-2">
                                Toả Sáng <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent animate-gradient bg-[length:200%_auto]">Tương Lai!</span> 🚀
                                {/* Decorative underline */}
                                <svg className="absolute w-full h-4 -bottom-1 left-0 text-accent/50 drop-shadow-sm" viewBox="0 0 100 20" preserveAspectRatio="none">
                                    <path d="M0 10 Q 50 20 100 10" fill="transparent" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                                </svg>
                            </span>
                        </h1>
                    </motion.div>

                    <motion.div variants={fadeInUp}>
                        <Body size="lg" className="mb-10 text-slate-600 dark:text-slate-300 text-lg sm:text-xl leading-relaxed sm:max-w-2xl mx-auto lg:mx-0 font-medium">
                            Vừa chơi vừa học với công nghệ Trí Tuệ Nhân Tạo (AI) hiện đại. Luyện phát âm chuẩn bản xứ, chơi game flashcard nhận quà liền tay!
                        </Body>
                    </motion.div>

                    <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-5 items-center justify-center lg:justify-start">
                        <Link href={targetHref}>
                            <MagneticButton className="group">
                                <KidButton variant="secondary" size="lg" className="text-xl sm:text-2xl px-10 py-7 shadow-xl shadow-secondary/30 hover:shadow-secondary/50 group-hover:-translate-y-2 transition-all overflow-hidden relative w-full h-full pointer-events-none">
                                    <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-out"></div>
                                    <span className="inline-block min-w-[140px] text-center transition-all duration-300">
                                        {!isReady ? 'Khám phá ngay' : isAuthenticated ? 'Tiếp tục học' : 'Khám phá ngay'}
                                    </span>
                                    <Sparkles className="ml-2 w-6 h-6 group-hover:rotate-12 transition-transform shrink-0" />
                                </KidButton>
                            </MagneticButton>
                        </Link>
                        <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 font-medium mt-4 sm:mt-0">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <Image priority width={40} height={40} key={i} src={`https://api.dicebear.com/7.x/notionists/svg?seed=${i}&scale=120`} alt={`Avatar ${i}`} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-100" />
                                ))}
                            </div>
                            <div>Hơn <b>10,000+</b> bé<br />đang học tập</div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Right Column (High-End Tablet Mockup) */}
                <motion.div
                    style={{ y: heroY }}
                    variants={scaleIn}
                    initial="hidden"
                    animate="visible"
                    className="flex-1 w-full max-w-2xl lg:max-w-none relative mt-10 lg:mt-0"
                >
                    {/* The iPad Frame */}
                    <div className="relative aspect-[4/3] rounded-[2.5rem] p-4 bg-slate-100/30 dark:bg-slate-800/30 backdrop-blur-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-white/40 dark:border-slate-700/50">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent dark:from-slate-700/20 rounded-[2.5rem] pointer-events-none"></div>

                        {/* Screen Content */}
                        <div className="relative w-full h-full bg-slate-900 rounded-[1.8rem] overflow-hidden shadow-inner group">
                            <Image
                                src="https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1400&auto=format&fit=crop"
                                alt="Trẻ em tương tác thiết bị thông minh"
                                fill
                                priority
                                sizes="(min-width: 1024px) 50vw, 90vw"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>

                            {/* Play Button Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-20 h-20 bg-white/20 backdrop-blur-md border border-white/50 rounded-full flex items-center justify-center shadow-lg cursor-pointer transform transition-all duration-300 group-hover:scale-110 group-hover:bg-white/30">
                                    <Play size={40} className="text-white fill-current ml-2" />
                                </div>
                            </div>

                            {/* UI Overlay Mockups within the screen */}
                            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-white font-medium flex items-center gap-2">
                                    <Star className="text-warning fill-warning" size={18} /> Đang xem bài 02
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white border-2 border-white shadow-lg z-10">
                                        <Brain size={18} />
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center text-white border-2 border-white shadow-lg -ml-4 z-0">
                                        <Mic size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Floating Element 1 - Achievement */}
                    <motion.div
                        animate={{ y: [0, -15, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute -bottom-8 -left-8 lg:-left-12 bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-4 z-20"
                    >
                        <div className="w-14 h-14 bg-gradient-to-br from-success-light to-success flex items-center justify-center rounded-2xl shadow-inner">
                            <CheckCircle2 size={32} className="text-white" />
                        </div>
                        <div>
                            <p className="font-heading font-bold text-slate-800 dark:text-white text-lg leading-tight">Tuyệt vời!</p>
                            <div className="flex items-center gap-1 text-sm font-bold text-success bg-success/10 px-2 py-1 rounded-lg w-fit mt-1">
                                <Star size={14} className="fill-current" /> +50 điểm
                            </div>
                        </div>
                    </motion.div>

                    {/* Floating Element 2 - AI Bot */}
                    <motion.div
                        animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                        className="absolute top-10 -right-8 lg:-right-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-white dark:border-slate-700 flex flex-col items-center gap-2 z-20"
                    >
                        <div className="relative">
                            <Image
                                priority
                                src="https://api.dicebear.com/7.x/bottts/svg?seed=edukidsAI&backgroundColor=b6e3f4"
                                alt="AI Avatar"
                                width={60}
                                height={60}
                                className="w-16 h-16 rounded-full shadow-md border-2 border-white"
                            />
                            <span className="absolute bottom-0 right-0 w-4 h-4 bg-success border-2 border-white rounded-full"></span>
                        </div>
                        <div className="text-center mt-1">
                            <p className="font-heading font-bold text-slate-800 dark:text-white">Robot AI</p>
                            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Đang Lắng Nghe</p>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
