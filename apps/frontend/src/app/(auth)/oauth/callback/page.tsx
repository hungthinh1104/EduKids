'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/shared/store/auth.store';
import { Loader2 } from 'lucide-react';
import { getDefaultRouteByRole } from '@/shared/constants/navigation';
import { Heading, Body } from '@/shared/components/Typography';

function OAuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const dataParam = searchParams.get('data');
        if (!dataParam) {
            setError('Không tìm thấy thông tin đăng nhập.');
            setTimeout(() => router.push('/login'), 3000);
            return;
        }

        try {
            // Decode base64 containing utf-8 characters properly
            const binaryString = window.atob(dataParam);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const jsonStr = new TextDecoder('utf-8').decode(bytes);
            
            const authData = JSON.parse(jsonStr);

            if (authData?.accessToken && authData?.user) {
                setAuth(authData.user, authData.accessToken, authData.refreshToken, authData.role);
                // Hard reload to ensure all layouts fetch correct auth state
                window.location.href = getDefaultRouteByRole(authData.role);
            } else {
                setError('Dữ liệu đăng nhập không hợp lệ.');
                setTimeout(() => router.push('/login'), 3000);
            }
        } catch (err) {
            console.error('Failed to parse OAuth data', err);
            setError('Lỗi khi xử lý thông tin đăng nhập.');
            setTimeout(() => router.push('/login'), 3000);
        }
    }, [searchParams, router, setAuth]);

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
