'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Lock, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { authApi } from '@/features/auth/api/auth.api';
import axios from 'axios';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

const schema = z.object({
    newPassword: z
        .string()
        .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
        .regex(passwordRegex, 'Phải có chữ hoa, chữ thường và số'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
}).refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
});
type FormValues = z.infer<typeof schema>;

const fadeInUp = {
    hidden: { opacity: 1, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token') ?? '';

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
    });

    if (!token) {
        return (
            <div className="w-full text-center space-y-4">
                <AlertCircle size={48} className="text-secondary mx-auto" />
                <Heading level={2} className="text-heading">Link không hợp lệ</Heading>
                <Body className="text-body">Token đặt lại mật khẩu bị thiếu hoặc đã hết hạn.</Body>
                <Link href="/forgot-password" className="text-primary font-bold hover:underline">
                    Yêu cầu link mới
                </Link>
            </div>
        );
    }

    if (done) {
        return (
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="w-full text-center space-y-6">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-success-light flex items-center justify-center">
                        <CheckCircle2 size={32} className="text-success" />
                    </div>
                    <Heading level={2} className="text-2xl text-heading">Đặt lại thành công! 🎉</Heading>
                    <Body className="text-body">Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập lại.</Body>
                </div>
                <button
                    onClick={() => router.push('/login')}
                    className="w-full btn-primary h-14 text-lg hover:scale-105 transition-all"
                >
                    Đăng nhập ngay
                </button>
            </motion.div>
        );
    }

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        setError(null);
        try {
            await authApi.resetPassword(token, data.newPassword);
            setDone(true);
        } catch (err) {
            const status = axios.isAxiosError(err) ? err.response?.status : undefined;
            if (status === 400) {
                setError('Link đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu link mới.');
            } else {
                setError('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div initial="hidden" animate="visible" className="w-full space-y-6">
            <motion.div variants={fadeInUp} className="text-center">
                <Heading level={2} className="text-3xl text-heading mb-2">Đặt lại mật khẩu</Heading>
                <Body className="text-body">Nhập mật khẩu mới cho tài khoản của bạn</Body>
            </motion.div>

            {error && (
                <motion.div variants={fadeInUp} className="p-4 rounded-xl bg-secondary-light border border-secondary/20 flex items-center gap-3">
                    <AlertCircle size={18} className="text-secondary shrink-0" />
                    <div>
                        <Caption className="text-secondary-dark">{error}</Caption>
                        {' '}
                        <Link href="/forgot-password" className="text-primary font-bold underline text-sm">
                            Yêu cầu link mới
                        </Link>
                    </div>
                </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* New Password */}
                <motion.div variants={fadeInUp} className="space-y-2">
                    <label className="text-sm font-bold text-heading ml-1 block">Mật khẩu mới</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-caption">
                            <Lock size={18} />
                        </div>
                        <input
                            {...register('newPassword')}
                            type={showNew ? 'text' : 'password'}
                            placeholder="Ít nhất 8 ký tự, chữ hoa + số"
                            className={`input-base pl-10 pr-10 ${errors.newPassword ? 'border-secondary' : ''}`}
                            disabled={isLoading}
                        />
                        <button type="button" onClick={() => setShowNew((v) => !v)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-caption hover:text-heading">
                            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {errors.newPassword && (
                        <p className="text-secondary text-sm font-medium ml-1">{errors.newPassword.message}</p>
                    )}
                </motion.div>

                {/* Confirm Password */}
                <motion.div variants={fadeInUp} className="space-y-2">
                    <label className="text-sm font-bold text-heading ml-1 block">Xác nhận mật khẩu</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-caption">
                            <Lock size={18} />
                        </div>
                        <input
                            {...register('confirmPassword')}
                            type={showConfirm ? 'text' : 'password'}
                            placeholder="Nhập lại mật khẩu mới"
                            className={`input-base pl-10 pr-10 ${errors.confirmPassword ? 'border-secondary' : ''}`}
                            disabled={isLoading}
                        />
                        <button type="button" onClick={() => setShowConfirm((v) => !v)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-caption hover:text-heading">
                            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {errors.confirmPassword && (
                        <p className="text-secondary text-sm font-medium ml-1">{errors.confirmPassword.message}</p>
                    )}
                </motion.div>

                <motion.div variants={fadeInUp} className="pt-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center btn-primary h-14 text-lg transition-all hover:scale-105 disabled:opacity-70 disabled:scale-100"
                    >
                        {isLoading ? <Loader2 size={22} className="animate-spin" /> : 'Đặt lại mật khẩu 🔐'}
                    </button>
                </motion.div>
            </form>
        </motion.div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={null}>
            <ResetPasswordContent />
        </Suspense>
    );
}
