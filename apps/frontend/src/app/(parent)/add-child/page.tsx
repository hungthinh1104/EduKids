'use client';

import { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Check, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { KidButton } from '@/components/edukids/KidButton';
import { apiClient as axiosInstance } from '@/shared/services/api.client';
import { setActiveProfile } from '@/features/profile/api/profile.api';
import type { ApiEnvelope } from '@/features/auth/types';
import type { CreateChildProfileRequest, ProfileActionResultDto } from '@/features/profile/types/child-profile.types';
import { getDefaultRouteByRole } from '@/shared/constants/navigation';

const AVATAR_SEEDS = ['bong', 'chip', 'luna', 'robo', 'kiwi', 'mochi', 'pixel', 'star'];
const DIFFICULTIES = [
    { value: 1, label: 'Dễ', desc: 'Bé mới bắt đầu', emoji: '🌱' },
    { value: 2, label: 'Trung bình', desc: 'Đã biết một ít', emoji: '📚' },
    { value: 3, label: 'Thử thách', desc: 'Muốn học nhanh hơn', emoji: '🚀' },
];

const STEPS = ['Nhân vật', 'Avatar', 'Cài đặt'];

export default function AddChildPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [nickname, setNickname] = useState('');
    const [age, setAge] = useState(7);
    const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_SEEDS[0]);
    const [difficulty, setDifficulty] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const canGoNext =
        (step === 0 && nickname.trim().length >= 2) ||
        step === 1 ||
        step === 2;

    async function handleSubmit() {
        if (nickname.trim().length < 2) {
            setSubmitError('Biệt danh cần ít nhất 2 ký tự.');
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const payload: CreateChildProfileRequest = {
                nickname: nickname.trim(),
                age,
                avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedAvatar}`,
            };

            const response = await axiosInstance.post<ApiEnvelope<ProfileActionResultDto>>('profiles', payload);
            const createdProfile = response.data.data.profile;

            // Best-effort: select the new child in parent session without switching role
            await setActiveProfile(createdProfile.id);

            router.push(getDefaultRouteByRole('PARENT'));
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                if (status === 400) {
                    setSubmitError('Không thể tạo hồ sơ. Kiểm tra tuổi (4-12) hoặc đã đạt giới hạn 5 hồ sơ.');
                } else if (status === 401) {
                    setSubmitError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                } else {
                    setSubmitError('Không thể tạo hồ sơ lúc này. Vui lòng thử lại sau.');
                }
            } else {
                setSubmitError('Đã xảy ra lỗi không xác định. Vui lòng thử lại.');
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center pb-12">
            {/* Stepper */}
            <div className="flex items-center gap-2 mb-10">
                {STEPS.map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                        <motion.div
                            animate={{
                                backgroundColor: i < step ? 'var(--color-success)' : i === step ? 'var(--color-primary)' : 'var(--color-bg-main)',
                                scale: i === step ? 1.1 : 1,
                            }}
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-heading font-bold text-sm border-2 ${i <= step ? 'border-primary text-white' : 'border-border text-body'
                                }`}
                        >
                            {i < step ? <Check size={16} /> : i + 1}
                        </motion.div>
                        <Caption className={`text-sm font-bold hidden sm:block ${i === step ? 'text-primary' : 'text-caption'}`}>{s}</Caption>
                        {i < STEPS.length - 1 && <div className={`w-12 h-0.5 rounded ${i < step ? 'bg-success' : 'bg-border'}`} />}
                    </div>
                ))}
            </div>

            {/* Card */}
            <div className="w-full max-w-lg bg-card border-2 border-border rounded-[2.5rem] p-8 shadow-xl">
                <AnimatePresence mode="wait">
                    {/* Step 0: Name + Age */}
                    {step === 0 && (
                        <motion.div key="step0" initial={{ opacity: 1, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                            <Heading level={2} className="text-heading text-2xl mb-2">Bé tên gì nào? 👶</Heading>
                            <Body className="text-body mb-8">Đặt biệt danh thật dễ thương cho bé nhé!</Body>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-heading font-heading font-bold mb-2">Biệt danh</label>
                                    <input
                                        type="text"
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                        placeholder="Vd: Bé Bông, Bé Chip..."
                                        className="input-base w-full"
                                        maxLength={20}
                                    />
                                    {nickname.length > 0 && nickname.trim().length < 2 && (
                                        <Caption className="text-secondary text-xs mt-1">Biệt danh cần ít nhất 2 ký tự</Caption>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-heading font-heading font-bold mb-3">Tuổi: <span className="text-primary">{age}</span></label>
                                    <input
                                        type="range"
                                        min={4}
                                        max={12}
                                        value={age}
                                        onChange={(e) => setAge(Number(e.target.value))}
                                        className="w-full accent-primary"
                                    />
                                    <div className="flex justify-between mt-1">
                                        <Caption className="text-caption text-xs">4 tuổi</Caption>
                                        <Caption className="text-caption text-xs">12 tuổi</Caption>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 1: Avatar */}
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 1, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                            <Heading level={2} className="text-heading text-2xl mb-2">Chọn Avatar! 🎭</Heading>
                            <Body className="text-body mb-6">Ấn vào nhân vật bé yêu thích nhé!</Body>
                            <div className="grid grid-cols-4 gap-3">
                                {AVATAR_SEEDS.map((seed) => (
                                    <motion.button
                                        key={seed}
                                        whileHover={{ scale: 1.08 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setSelectedAvatar(seed)}
                                        className={`relative rounded-2xl p-2 border-4 transition-all ${selectedAvatar === seed ? 'border-primary shadow-lg shadow-primary/25' : 'border-border hover:border-primary/40'
                                            }`}
                                    >
                                        <Image
                                            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`}
                                            alt={`Avatar ${seed}`}
                                            width={64}
                                            height={64}
                                            className="w-full aspect-square object-contain"
                                        />
                                        {selectedAvatar === seed && (
                                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                                <Check size={12} className="text-white" />
                                            </div>
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Difficulty */}
                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 1, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                            <Heading level={2} className="text-heading text-2xl mb-2">Mức độ học 🎯</Heading>
                            <Body className="text-body mb-6">Bé đã biết tiếng Anh chưa?</Body>
                            <div className="space-y-3">
                                {DIFFICULTIES.map((d) => (
                                    <motion.button
                                        key={d.value}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setDifficulty(d.value)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${difficulty === d.value
                                            ? 'border-primary bg-primary-light'
                                            : 'border-border hover:border-primary/40 bg-background'
                                            }`}
                                    >
                                        <span className="text-3xl">{d.emoji}</span>
                                        <div className="flex-1">
                                            <div className={`font-heading font-bold text-lg ${difficulty === d.value ? 'text-primary' : 'text-heading'}`}>{d.label}</div>
                                            <Caption className="text-caption text-sm">{d.desc}</Caption>
                                        </div>
                                        {difficulty === d.value && <Check size={20} className="text-primary flex-shrink-0" />}
                                    </motion.button>
                                ))}
                            </div>

                            {/* Preview */}
                            <div className="mt-6 p-4 rounded-2xl bg-background border-2 border-border flex items-center gap-4">
                                <Image src={`https://api.dicebear.com/7.x/bottts/svg?seed=${selectedAvatar}`} alt="preview" width={56} height={56} className="rounded-full bg-primary-light p-1" />
                                <div>
                                    <div className="font-heading font-black text-heading text-lg">{nickname || 'Bé của bạn'}</div>
                                    <Caption className="text-caption text-sm">{age} tuổi · Lv.1 mới</Caption>
                                </div>
                                <Sparkles size={20} className="text-star ml-auto animate-pulse" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex gap-3 mt-8">
                    {submitError && step === STEPS.length - 1 && (
                        <div className="w-full mb-2 px-4 py-2 rounded-xl bg-secondary-light border border-secondary/30 text-secondary text-sm font-medium">
                            {submitError}
                        </div>
                    )}

                    {step > 0 && (
                        <KidButton variant="outline" onClick={() => setStep(step - 1)} className="flex-1" disabled={isSubmitting}>
                            <ChevronLeft size={20} /> Quay lại
                        </KidButton>
                    )}
                    {step < STEPS.length - 1 ? (
                        <KidButton variant="default" onClick={() => setStep(step + 1)} disabled={!canGoNext || isSubmitting} className="flex-1">
                            Tiếp theo <ChevronRight size={20} />
                        </KidButton>
                    ) : (
                        <KidButton variant="secondary" onClick={handleSubmit} className="flex-1 text-lg py-6" disabled={isSubmitting}>
                            {isSubmitting ? 'Đang tạo hồ sơ...' : '🎉 Tạo nhân vật!'}
                        </KidButton>
                    )}
                </div>
            </div>
        </div>
    );
}
