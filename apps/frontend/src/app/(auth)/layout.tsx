import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Sparkles, MoveLeft } from 'lucide-react';
import { Heading, Body } from '@/shared/components/Typography';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-background flex overflow-hidden relative selection:bg-primary/20">
            {/* Background Decorative Elements (Glowing Orbs) */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 dark:bg-primary/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-lighten opacity-70 animate-blob pointer-events-none z-0" />
            <div className="absolute top-[20%] right-[-10%] w-[35%] h-[40%] bg-secondary/20 dark:bg-secondary/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-lighten opacity-50 animate-blob animation-delay-2000 pointer-events-none z-0" />
            <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-accent/20 dark:bg-accent/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-lighten opacity-60 animate-blob animation-delay-4000 pointer-events-none z-0" />

            <div className="absolute top-0 right-0 p-8 opacity-20 dark:opacity-10 pointer-events-none z-0">
                <Star className="w-24 h-24 text-star animate-pulse" />
            </div>
            <div className="absolute bottom-10 left-10 p-8 opacity-20 dark:opacity-10 pointer-events-none z-0">
                <Sparkles className="w-32 h-32 text-accent animate-bounce-gentle" />
            </div>

            {/* Left Side: Illustration / Gamification Panel (Hidden on Mobile) */}
            <div className="hidden lg:flex w-1/2 bg-primary-light dark:bg-primary-dark flex-col justify-center items-center p-12 relative shadow-2xl z-10">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10 w-full max-w-lg text-center space-y-8 flex flex-col items-center">
                    <div className="w-48 h-48 bg-white/40 dark:bg-black/20 rounded-full flex items-center justify-center backdrop-blur-sm border-4 border-primary/30 shadow-xl animate-bounce-gentle">
                        <Image
                            src="https://api.dicebear.com/7.x/bottts/svg?seed=edukids-hero"
                            alt="EduKids Mascot"
                            width={140}
                            height={140}
                            priority
                            className="drop-shadow-lg"
                        />
                    </div>
                    <Heading level={2} className="text-black drop-shadow-sm text-5xl font-extrabold">
                        Học Tiếng Anh Thật Vui!
                    </Heading>
                    <Body className="text-black text-xl font-medium leading-relaxed">
                        Tham gia ngay để nhận điểm thưởng, phiêu lưu vượt ải và mở khóa hàng ngàn từ vựng mới mỗi ngày.
                    </Body>
                </div>

                {/* Return Home Button */}
                <div className="absolute top-8 left-8 z-10">
                    <Link href="/">
                        <div className="inline-flex items-center gap-2 text-primary-dark dark:text-primary-light hover:text-primary font-heading font-bold text-lg transition-colors cursor-pointer bg-white/50 dark:bg-black/30 hover:bg-white/80 dark:hover:bg-black/50 px-4 py-2 rounded-xl backdrop-blur-sm shadow-sm">
                            <MoveLeft size={20} /> Quay lại trang chủ
                        </div>
                    </Link>
                </div>
            </div>

            {/* Right Side: Form Area */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 z-10">
                <div className="w-full max-w-md relative">
                    {/* Mobile Only Logo & Home Link */}
                    <div className="lg:hidden flex flex-col items-center mb-8 space-y-4">
                        <Image
                            src="https://api.dicebear.com/7.x/bottts/svg?seed=edukids-hero"
                            alt="EduKids Mascot"
                            width={80}
                            height={80}
                            priority
                            className="bg-card/50 backdrop-blur-md shadow-lg rounded-full p-2 border border-background/40"
                        />
                        <Link href="/" className="inline-flex items-center gap-2 text-primary-dark dark:text-primary-light hover:text-primary font-heading font-bold transition-colors bg-white/50 dark:bg-black/30 hover:bg-white/80 dark:hover:bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm shadow-sm">
                            <MoveLeft size={16} /> Trang chủ
                        </Link>
                    </div>

                    {/* Forms rendered here with Ultra Glassmorphism */}
                    <div className="bg-card/70 dark:bg-background/70 backdrop-blur-2xl border border-border/50 rounded-[2.5rem] p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden">
                        {/* Decorative inner glow for the glass card */}
                        <div className="absolute inset-x-0 -top-px h-px w-full bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>
                        <div className="relative z-10">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
