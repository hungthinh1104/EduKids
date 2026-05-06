'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/shared/store/auth.store';
import { Loader2 } from 'lucide-react';
import { getDefaultRouteByRole } from '@/shared/constants/navigation';
import { Heading, Body } from '@/shared/components/Typography';
import { authApi } from '@/features/auth/api/auth.api';

function OAuthCallbackContent() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const accessToken = hashParams.get('token');
        const refreshToken = hashParams.get('refresh') ?? undefined;

        if (!accessToken) {
            window.setTimeout(() => {
                setError('Không tìm thấy thông tin đăng nhập.');
            }, 0);
            const timeout = setTimeout(() => router.push('/login'), 3000);
            return () => clearTimeout(timeout);
        }

        // Clear tokens from URL bar so they don't linger in history
        window.history.replaceState(null, '', window.location.pathname);

        let cancelled = false;

        void (async () => {
            try {
                const user = await authApi.me(accessToken);
                if (cancelled) return;
                setAuth(user, accessToken, refreshToken, user.role);
                window.location.href = getDefaultRouteByRole(user.role);
            } catch (err) {
                console.error('Failed to finalize OAuth login', err);
                if (!cancelled) {
                    setError('Lỗi khi xử lý thông tin đăng nhập.');
                    setTimeout(() => router.push('/login'), 3000);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [router, setAuth]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center py-12 text-center">
            {error ? (
                <>
                    <Heading level={3} className="text-secondary mb-4">Đăng nhập thất bại</Heading>
                    <Body className="text-muted">{error}</Body>
                    <Body className="text-muted mt-2 text-sm">Đang chuyển hướng về trang đăng nhập...</Body>
                </>
            ) : (
                <>
                    <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                    <Heading level={3} className="text-heading mb-2">Đang hoàn tất đăng nhập...</Heading>
                    <Body className="text-muted">Vui lòng đợi giây lát</Body>
                </>
            )}
        </div>
    );
}

export default function OAuthCallbackPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}>
            <OAuthCallbackContent />
        </Suspense>
    );
}
