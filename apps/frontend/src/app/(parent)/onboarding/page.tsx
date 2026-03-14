'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowRight, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { getDefaultRouteByRole } from '@/shared/constants/navigation';
import { createProfile } from '@/features/profile/api/profile.api';

// ── Onboarding multi-step flow ──────────────────────────────────────────────
// Matches: POST /auth/register → POST /children (CreateChildProfileDto)
// Fields: nickname (2-30 chars), age (4-12), avatarUrl (optional)

const AVATARS = [
    { seed: 'cat', emoji: '🐱' }, { seed: 'dog', emoji: '🐶' }, { seed: 'bunny', emoji: '🐰' },
    { seed: 'bear', emoji: '🐻' }, { seed: 'panda', emoji: '🐼' }, { seed: 'fox', emoji: '🦊' },
    { seed: 'lion', emoji: '🦁' }, { seed: 'owl', emoji: '🦉' }, { seed: 'dino', emoji: '🦕' },
];

const AGES = [4, 5, 6, 7, 8, 9, 10, 11, 12];

const STEPS = ['Chào mừng', 'Đặt tên bé', 'Tuổi của bé', 'Chọn avatar', 'Hoàn thành'];

const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [dir, setDir] = useState(1);
    const [nickname, setNickname] = useState('');
    const [age, setAge] = useState<number | null>(null);
    const [avatar, setAvatar] = useState(AVATARS[0].seed);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    const nicknameValid = nickname.trim().length >= 2 && nickname.trim().length <= 30;
    const canProceed = step === 0 ? true : step === 1 ? nicknameValid : step === 2 ? age !== null : step === 3 ? true : false;

    const goNext = () => {
        if (!canProceed) return;
        setDir(1);
        setStep((s) => s + 1);
    };

    const goBack = () => {
        setDir(-1);
        setStep((s) => s - 1);
    };

    const handleCreate = async () => {
        if (!age) return;
        setCreating(true);
        setCreateError(null);
        try {
            await createProfile({
                nickname: nickname.trim(),
                age,
                avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${avatar}`,
            });
            router.push(getDefaultRouteByRole('PARENT'));
        } catch (err) {
            console.error('Failed to create profile:', err);
            setCreateError('Không thể tạo hồ sơ. Vui lòng thử lại.');
        } finally {
            setCreating(false);
        }
    };

    const selectedAvatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${avatar}`;

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            {/* Progress dots */}
            <div className="flex gap-2.5 mb-10">
                {STEPS.map((_, i) => (
                    <motion.div key={i} animate={{ scale: i === step ? 1.4 : 1, opacity: i <= step ? 1 : 0.3 }}
                        className={`h-2.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-primary' : i < step ? 'w-2.5 bg-success' : 'w-2.5 bg-border'}`}
                    />
                ))}
            </div>

            {/* Step content */}
            <div className="w-full max-w-sm relative overflow-hidden">
                <AnimatePresence mode="wait" custom={dir}>
                    {/* ── Step 0: Welcome ── */}
                    {step === 0 && (
                        <motion.div key="welcome" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: 'easeInOut' }} className="text-center space-y-6">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                                className="w-28 h-28 bg-gradient-to-br from-primary to-accent rounded-[2rem] flex items-center justify-center text-6xl shadow-2xl shadow-primary/30 mx-auto"
                            >🎓</motion.div>
                            <Heading level={2} className="text-heading text-3xl">Chào mừng đến với EduKids! 🌟</Heading>
                            <Body className="text-body">Hãy tạo hồ sơ cho bé để bắt đầu hành trình học tiếng Anh thú vị nhé!</Body>
                            <div className="grid grid-cols-3 gap-3 py-2">
                                {['🗺️ Bản đồ học vui', '🏆 Huy hiệu thú vị', '🎤 AI phát âm'].map((f) => (
                                    <div key={f} className="bg-card border-2 border-border rounded-2xl p-3 text-center">
                                        <Caption className="text-caption text-xs">{f}</Caption>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── Step 1: Nickname ── */}
                    {step === 1 && (
                        <motion.div key="nickname" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: 'easeInOut' }} className="space-y-6">
                            <div className="text-center">
                                <div className="text-5xl mb-4">✏️</div>
                                <Heading level={2} className="text-heading text-2xl">Tên bé là gì?</Heading>
                                <Caption className="text-caption text-sm mt-1">Tên hiển thị (từ 2-30 ký tự)</Caption>
                            </div>
                            <div>
                                <input
                                    type="text"
                                    maxLength={30}
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    placeholder="vd: Bé Bông, Tommy…"
                                    className="input-base w-full py-4 text-center text-2xl font-heading font-bold text-heading placeholder:text-caption"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && goNext()}
                                />
                                <div className="flex items-center justify-between mt-2 px-1">
                                    <Caption className={`text-xs ${!nicknameValid && nickname.length > 0 ? 'text-error' : 'text-caption'}`}>
                                        {nickname.trim().length < 2 && nickname.length > 0 ? 'Tên quá ngắn' : 'Tên bé'}
                                    </Caption>
                                    <Caption className="text-caption text-xs">{nickname.length}/30</Caption>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Step 2: Age ── */}
                    {step === 2 && (
                        <motion.div key="age" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: 'easeInOut' }} className="space-y-6">
                            <div className="text-center">
                                <div className="text-5xl mb-4">🎂</div>
                                <Heading level={2} className="text-heading text-2xl">{nickname} mấy tuổi?</Heading>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {AGES.map((a, i) => (
                                    <motion.button key={a}
                                        initial={{ opacity: 1, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                                        onClick={() => setAge(a)}
                                        className={`py-4 rounded-2xl font-heading font-black text-2xl border-2 transition-all ${age === a ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-110' : 'bg-card border-border text-heading hover:border-primary/60'}`}
                                    >
                                        {a}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── Step 3: Avatar ── */}
                    {step === 3 && (
                        <motion.div key="avatar" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: 'easeInOut' }} className="space-y-6">
                            <div className="text-center">
                                <motion.div animate={{ rotate: [0, -5, 5, 0] }} transition={{ repeat: Infinity, duration: 2 }}
                                    className="w-24 h-24 rounded-[2rem] bg-primary-light border-4 border-primary mx-auto overflow-hidden mb-4"
                                >
                                    <Image src={selectedAvatarUrl} alt="avatar" width={96} height={96} />
                                </motion.div>
                                <Heading level={2} className="text-heading text-2xl">Avatar cho {nickname}</Heading>
                                <Caption className="text-caption text-sm">Chọn một nhân vật yêu thích</Caption>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {AVATARS.map((av, i) => (
                                    <motion.button key={av.seed}
                                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                                        onClick={() => setAvatar(av.seed)}
                                        className={`relative p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${avatar === av.seed ? 'border-primary bg-primary-light shadow-lg shadow-primary/20' : 'border-border bg-card hover:border-primary/40'}`}
                                    >
                                        <Image src={`https://api.dicebear.com/7.x/bottts/svg?seed=${av.seed}`} alt={av.seed} width={48} height={48} className="rounded-xl" />
                                        {avatar === av.seed && (
                                            <motion.div layoutId="avatar-check" className="absolute -top-1.5 -right-1.5">
                                                <CheckCircle2 size={18} className="text-primary fill-white" />
                                            </motion.div>
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── Step 4: Complete ── */}
                    {step === 4 && (
                        <motion.div key="complete" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: 'easeInOut' }} className="text-center space-y-6">
                            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200 }}
                                className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-primary to-accent mx-auto flex items-center justify-center shadow-2xl shadow-primary/30 overflow-hidden border-4 border-white"
                            >
                                <Image src={selectedAvatarUrl} alt={nickname} width={112} height={112} />
                            </motion.div>

                            <div>
                                <motion.div initial={{ opacity: 1, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                    <Heading level={2} className="text-heading text-3xl">{nickname} {age} tuổi 🎉</Heading>
                                    <Body className="text-body mt-2">Hồ sơ đã sẵn sàng! Bắt đầu hành trình học nào!</Body>
                                </motion.div>
                                <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex justify-center gap-4 mt-6">
                                    {['Học từ vựng', 'Làm quiz', 'Luyện phát âm'].map((f, i) => (
                                        <div key={f} className="flex flex-col items-center gap-1">
                                            <div className="w-12 h-12 rounded-2xl bg-primary-light border-2 border-primary flex items-center justify-center text-xl">
                                                {['📚', '🎯', '🎤'][i]}
                                            </div>
                                            <Caption className="text-caption text-[10px] text-center">{f}</Caption>
                                        </div>
                                    ))}
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between w-full max-w-sm mt-10 gap-4">
                {step > 0 && step < 4 ? (
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={goBack}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-card border-2 border-border font-heading font-bold text-body hover:border-primary/50 transition-colors"
                    >
                        <ArrowLeft size={16} /> Quay lại
                    </motion.button>
                ) : <div />}

                {step < 4 ? (
                    <motion.button whileHover={{ scale: canProceed ? 1.04 : 1 }} whileTap={{ scale: canProceed ? 0.97 : 1 }} onClick={goNext} disabled={!canProceed}
                        className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-heading font-bold transition-all ml-auto ${canProceed ? 'bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-dark' : 'bg-border text-caption cursor-not-allowed'}`}
                    >
                        {step === 3 ? 'Xong' : 'Tiếp theo'} <ArrowRight size={16} />
                    </motion.button>
                ) : (
                    <div className="w-full">
                        {createError && (
                            <Caption className="block mb-2 text-center text-error text-sm">{createError}</Caption>
                        )}
                        <motion.button
                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={handleCreate} disabled={creating}
                            className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-heading font-bold shadow-lg shadow-primary/30 w-full justify-center disabled:opacity-70"
                        >
                            {creating ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>
                                    <Sparkles size={18} />
                                </motion.div>
                            ) : <Sparkles size={18} />}
                            {creating ? 'Đang tạo hồ sơ…' : 'Bắt đầu học ngay! 🚀'}
                        </motion.button>
                    </div>
                )}
            </div>
        </div>
    );
}
