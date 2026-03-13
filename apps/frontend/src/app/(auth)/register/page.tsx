'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import * as z from 'zod';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { Mail, Lock, User as UserIcon, Loader2, AlertCircle } from 'lucide-react';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/shared/store/auth.store';
import { motion } from 'framer-motion';
import MagneticButton from '@/shared/components/landing/MagneticButton';
import { getDefaultRouteByRole, PARENT_PATHS, CHILD_PATHS, ADMIN_PATHS } from '@/shared/constants/navigation';
import { colors } from '@/shared/utils/design-tokens';

// Animation Variants
const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

// Strong password regex required by backend
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

// Validation schema
const registerSchema = z.object({
    firstName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(50, 'Tên quá dài'),
    lastName: z.string().min(2, 'Họ phải có ít nhất 2 ký tự').max(50, 'Họ quá dài'),
    email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
    password: z.string()
        .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
        .regex(passwordRegex, 'Mật khẩu phải có chữ hoa, chữ thường và số'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

function isValidRedirectPath(path: string | null, role: string): boolean {
    if (!path) return false;
    
    // Decode URL if needed
    const decodedPath = decodeURIComponent(path);
    
    // Helper to check path prefix
    const matchesPrefix = (pathname: string, prefixes: string[]) => {
        return prefixes.some((p) => pathname === p || pathname.startsWith(p + '/'));
    };
    
    // Check if path is valid for user's role
    if (role === 'ADMIN') {
        // ADMIN can access ADMIN, PARENT routes
        return matchesPrefix(decodedPath, [...ADMIN_PATHS, ...PARENT_PATHS]);
    } else if (role === 'LEARNER') {
        // LEARNER can only access CHILD routes
        return matchesPrefix(decodedPath, CHILD_PATHS);
    } else {
        // PARENT (default) can access PARENT routes
        return matchesPrefix(decodedPath, PARENT_PATHS);
    }
}

function RegisterPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [isLoading, setIsLoading] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    });

    const onSubmit = async (data: RegisterFormValues) => {
        setIsLoading(true);
        setGlobalError(null);
        try {
            // Strip confirmPassword before sending to API
            const registerPayload = {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: data.password,
            };

            const response = await authApi.register(registerPayload);
            setAuth(response.user, response.accessToken, response.refreshToken, response.role);
            
            // Check if 'next' param exists and is valid for user's role
            const nextPath = searchParams.get('next');
            if (nextPath && isValidRedirectPath(nextPath, response.role || response.user?.role)) {
                router.push(decodeURIComponent(nextPath));
            } else {
                // Fallback to default home based on role
                router.push(getDefaultRouteByRole(response.role || response.user?.role));
            }
        } catch (error: unknown) {
            console.error('Register error:', error);
            const status = axios.isAxiosError(error) ? error.response?.status : undefined;
            if (status === 409) {
                setGlobalError('Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.');
            } else if (status === 400) {
                setGlobalError('Thông tin không hợp lệ. Vui lòng kiểm tra lại.');
            } else {
                setGlobalError('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="w-full"
        >
            <motion.div variants={fadeInUp} className="text-center mb-8">
                <Heading level={2} className="text-3xl text-success mb-2">Đăng Ký</Heading>
                <Body className="text-text-muted">Tạo tài khoản để bắt đầu hành trình học tập!</Body>
            </motion.div>

            {globalError && (
                <motion.div variants={fadeInUp} className="mb-6 p-4 rounded-xl bg-secondary-light border border-secondary/20 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                    <Caption className="text-secondary-dark">{globalError}</Caption>
                </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {/* Name Fields Row */}
                <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-4 group">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-text-heading ml-1 block">Họ</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                                <UserIcon size={18} />
                            </div>
                            <input
                                {...register('lastName')}
                                type="text"
                                placeholder="Nguyễn"
                                className={`input-base pl-10 ${errors.lastName ? 'border-secondary focus:border-secondary focus:ring-secondary/20' : ''}`}
                                disabled={isLoading}
                            />
                        </div>
                        {errors.lastName && (
                            <p className="text-secondary text-xs font-medium ml-1 mt-1">{errors.lastName.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-text-heading ml-1 block">Tên</label>
                        <div className="relative">
                            <input
                                {...register('firstName')}
                                type="text"
                                placeholder="Văn A"
                                className={`input-base ${errors.firstName ? 'border-secondary focus:border-secondary focus:ring-secondary/20' : ''}`}
                                disabled={isLoading}
                            />
                        </div>
                        {errors.firstName && (
                            <p className="text-secondary text-xs font-medium ml-1 mt-1">{errors.firstName.message}</p>
                        )}
                    </div>
                </motion.div>

                {/* Email Field */}
                <motion.div variants={fadeInUp} className="space-y-2 group">
                    <label className="text-sm font-bold text-text-heading ml-1 block">Email</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                            <Mail size={18} />
                        </div>
                        <input
                            {...register('email')}
                            type="email"
                            placeholder="email@example.com"
                            className={`input-base pl-10 ${errors.email ? 'border-secondary focus:border-secondary focus:ring-secondary/20' : ''}`}
                            disabled={isLoading}
                        />
                    </div>
                    {errors.email && (
                        <p className="text-secondary text-sm font-medium ml-1 mt-1">{errors.email.message}</p>
                    )}
                </motion.div>

                {/* Password Field */}
                <motion.div variants={fadeInUp} className="space-y-2 group">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-sm font-bold text-text-heading block">Mật khẩu</label>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                            <Lock size={18} />
                        </div>
                        <input
                            {...register('password')}
                            type="password"
                            placeholder="Mật khẩu (có chữ Hoa, số)"
                            className={`input-base pl-10 ${errors.password ? 'border-secondary focus:border-secondary focus:ring-secondary/20' : ''}`}
                            disabled={isLoading}
                        />
                    </div>
                    {errors.password && (
                        <p className="text-secondary text-xs font-medium ml-1 mt-1 leading-tight">{errors.password.message}</p>
                    )}
                </motion.div>

                {/* Confirm Password Field */}
                <motion.div variants={fadeInUp} className="space-y-2 group">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-sm font-bold text-text-heading block">Xác nhận Mật khẩu</label>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                            <Lock size={18} />
                        </div>
                        <input
                            {...register('confirmPassword')}
                            type="password"
                            placeholder="Nhập lại mật khẩu"
                            className={`input-base pl-10 ${errors.confirmPassword ? 'border-secondary focus:border-secondary focus:ring-secondary/20' : ''}`}
                            disabled={isLoading}
                        />
                    </div>
                    {errors.confirmPassword && (
                        <p className="text-secondary text-sm font-medium ml-1 mt-1">{errors.confirmPassword.message}</p>
                    )}
                </motion.div>

                {/* Terms agreement notice */}
                <motion.div variants={fadeInUp} className="pt-2 pb-2">
                    <Caption className="text-text-muted text-center text-[13px]">
                        Bằng việc đăng ký, bạn đồng ý với{' '}
                        <Link href="/terms" className="text-primary hover:underline">Điều khoản Dịch vụ</Link> và{' '}
                        <Link href="/privacy" className="text-primary hover:underline">Chính sách Bảo mật</Link> của EduKids.
                    </Caption>
                </motion.div>

                {/* Submit logic */}
                <motion.div variants={fadeInUp} className="pt-2">
                    <button type="submit" className="hidden" /> {/* Hidden submit for Enter key */}
                    <MagneticButton
                        className="w-full block"
                        onClick={handleSubmit(onSubmit)}
                    >
                        <div
                            className={`w-full flex items-center justify-center btn-success h-14 text-lg transition-transform duration-300 ${isLoading ? 'opacity-80 scale-95' : 'hover:scale-105'}`}
                        >
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                'Tạo tài khoản ⭐'
                            )}
                        </div>
                    </MagneticButton>
                </motion.div>
            </form>

            <motion.div variants={fadeInUp} className="mt-6">
                <div className="relative flex items-center py-4">
                    <div className="flex-grow border-t border-border"></div>
                    <span className="shrink-0 px-4 text-text-muted text-sm font-semibold">Hoặc đăng ký với</span>
                    <div className="flex-grow border-t border-border"></div>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setGlobalError('Đăng ký Google hiện chưa khả dụng. Vui lòng đăng ký bằng email.');
                    }}
                    className="w-full flex justify-center items-center gap-3 px-4 py-3 border-2 border-border rounded-xl bg-white hover:bg-background hover:border-primary/50 transition-colors shadow-sm font-heading font-bold text-text-heading"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill={colors.blue[500]} />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill={colors.green[500]} />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill={colors.yellow[400]} />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill={colors.red[500]} />
                    </svg>
                    bằng Google (Sắp ra mắt)
                </button>
            </motion.div>

            <motion.div variants={fadeInUp} className="mt-6 text-center">
                <p className="text-text-muted font-medium">
                    Đã có tài khoản?{' '}
                    <Link href="/login" className="text-primary font-bold hover:underline decoration-2 underline-offset-4 transition-all">
                        Đăng nhập ngay
                    </Link>
                </p>
            </motion.div>
        </motion.div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={null}>
            <RegisterPageContent />
        </Suspense>
    );
}
