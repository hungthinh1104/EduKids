'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { authApi } from '@/features/auth/api/auth.api';

const schema = z.object({
    email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
});
type FormValues = z.infer<typeof schema>;

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

function ForgotPasswordContent() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resetToken, setResetToken] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await authApi.forgotPassword(data.email);
            // Demo: backend returns token directly
            setResetToken(res.resetToken ?? '');
        } catch {
            setError('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    };

    if (resetToken !== null) {
        return (
            <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="w-full text-center space-y-6">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-success-light flex items-center justify-center">
                        <CheckCircle2 size={32} className="text-success" />
                    </div>
                    <Heading level={2} className="text-2xl text-heading">Yêu cầu đã được gửi!</Heading>
                    <Body className="text-body max-w-xs">
                        Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu.
                    </Body>
                </div>

                {/* Demo mode: show reset token + link directly */}
                {resetToken && (
                    <div className="bg-warning-light border-2 border-warning/40 rounded-2xl p-4 text-left space-y-3">
                        <Caption className="text-warning font-bold text-xs uppercase tracking-wide">
                            ⚠️ Chế độ Demo — Token đặt lại:
                        </Caption>
                        <code className="block text-xs break-all bg-background rounded-lg p-3 text-heading font-mono select-all">
                            {resetToken}
                        </code>
                        <Link
                            href={`/reset-password?token=${resetToken}`}
                            className="block w-full text-center py-3 rounded-2xl bg-primary text-white font-heading font-bold hover:bg-primary-dark transition-colors"
                        >
                            Đặt lại mật khẩu ngay →
                        </Link>
                        <Caption className="text-caption text-xs text-center">
                            Token có hiệu lực trong 15 phút
                        </Caption>
                    </div>
                )}

                <Link href="/login" className="inline-flex items-center gap-2 text-primary font-heading font-bold hover:underline">
                    <ArrowLeft size={16} /> Quay lại đăng nhập
                </Link>
            </motion.div>
        );
    }

    return (
        <motion.div initial="hidden" animate="visible" className="w-full space-y-6">
            <motion.div variants={fadeInUp} className="text-center">
                <Heading level={2} className="text-3xl text-primary mb-2">Quên mật khẩu?</Heading>
                <Body className="text-body">Nhập email để nhận link đặt lại mật khẩu</Body>
            </motion.div>

            {error && (
                <motion.div variants={fadeInUp} className="p-4 rounded-xl bg-secondary-light border border-secondary/20 flex items-center gap-3">
                    <AlertCircle size={18} className="text-secondary shrink-0" />
                    <Caption className="text-secondary-dark">{error}</Caption>
                </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <motion.div variants={fadeInUp} className="space-y-2">
                    <label className="text-sm font-bold text-heading ml-1 block">Email</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-caption">
                            <Mail size={18} />
                        </div>
                        <input
                            {...register('email')}
                            type="email"
                            placeholder="email@example.com"
                            className={`input-base pl-10 ${errors.email ? 'border-secondary' : ''}`}
                            disabled={isLoading}
                        />
                    </div>
                    {errors.email && (
                        <p className="text-secondary text-sm font-medium ml-1">{errors.email.message}</p>
                    )}
                </motion.div>

                <motion.div variants={fadeInUp} className="pt-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center btn-primary h-14 text-lg transition-all hover:scale-105 disabled:opacity-70 disabled:scale-100"
                    >
                        {isLoading ? <Loader2 size={22} className="animate-spin" /> : 'Gửi link đặt lại 📧'}
                    </button>
                </motion.div>
            </form>

            <motion.div variants={fadeInUp} className="text-center">
                <Link href="/login" className="inline-flex items-center gap-2 text-primary font-heading font-bold hover:underline">
                    <ArrowLeft size={16} /> Quay lại đăng nhập
                </Link>
            </motion.div>
        </motion.div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={null}>
            <ForgotPasswordContent />
        </Suspense>
    );
}
