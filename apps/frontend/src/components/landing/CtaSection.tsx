'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Star, Trophy, Sparkles, Brain, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/shared/store/auth.store';

export function CtaSection() {
    const { isAuthenticated, user } = useAuthStore();
    const targetHref = isAuthenticated
        ? (user?.role === 'ADMIN' ? '/admin' : user?.role === 'PARENT' ? '/dashboard' : '/play')
        : '/register';

    return (
        <section className="py-24 relative overflow-hidden">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-secondary bg-[length:200%_200%] animate-gradient"></div>

            {/* Glass overlay */}
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>

            {/* Floating Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <motion.div animate={{ y: [0, -30, 0], rotate: [0, 15, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-[15%] left-[10%] opacity-40">
                    <Star size={72} className="text-white fill-white" />
                </motion.div>
                <motion.div animate={{ y: [0, 40, 0], rotate: [0, -20, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }} className="absolute bottom-[10%] right-[15%] opacity-30">
                    <Trophy size={96} className="text-white fill-transparent" strokeWidth={1} />
                </motion.div>
                <motion.div animate={{ y: [0, -20, 0], scale: [1, 1.2, 1] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }} className="absolute top-[30%] right-[25%] opacity-50">
                    <Sparkles size={48} className="text-white fill-white" />
                </motion.div>
                <motion.div animate={{ x: [0, 30, 0], y: [0, 20, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 3 }} className="absolute bottom-[30%] left-[20%] opacity-20">
                    <Brain size={64} className="text-white" />
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 1, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, type: 'spring' }}
                className="max-w-4xl mx-auto px-4 z-10 relative text-center"
            >
                <div className="inline-flex justify-center items-center w-20 h-20 bg-card/20 rounded-3xl backdrop-blur-md mb-8 shadow-2xl border border-white/30">
                    <Trophy size={40} className="text-white fill-white/50" />
                </div>
                <h2 className="text-5xl md:text-7xl text-white mb-8 font-black font-heading tracking-wide drop-shadow-lg">
                    Khóa Cửa Tương Lai. <br /> Mở Ra Bằng Tiếng Anh!
                </h2>
                <p className="text-2xl mb-12 text-white/90 font-medium max-w-2xl mx-auto leading-relaxed">
                    Đăng ký ngay hôm nay để nhận thú cưng đồng hành và <strong className="text-warning-light">1,000 kim cương</strong> miễn phí!
                </p>
                <Link href={targetHref}>
                    <button className="bg-card text-primary text-2xl font-bold px-12 py-6 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.2)] hover:shadow-[0_20px_50px_rgba(255,255,255,0.3)] hover:-translate-y-2 transition-all duration-300 transform inline-flex items-center gap-3">
                        {isAuthenticated ? 'Vào ứng dụng ngay' : 'Bắt đầu miễn phí'} <ArrowRight size={28} />
                    </button>
                </Link>
            </motion.div>
        </section>
    );
}
