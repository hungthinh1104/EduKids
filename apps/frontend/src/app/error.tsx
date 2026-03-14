'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, Home, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Heading, Body } from '@/shared/components/Typography';
import { KidButton } from '@/components/edukids/KidButton';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('EduKids Global Error Caught:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
            <motion.div
                initial={{ opacity: 1, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-card border-4 border-error/50 rounded-[2.5rem] p-8 shadow-xl"
            >
                <motion.div
                    animate={{ rotate: [-0, -10, 10, -10, 10, 0] }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-20 h-20 bg-error-light text-error rounded-3xl flex items-center justify-center mx-auto mb-6"
                >
                    <AlertCircle size={40} strokeWidth={2.5} />
                </motion.div>

                <Heading level={2} className="text-heading text-2xl mb-2">
                    Ôi hỏng rồi! 🛠️
                </Heading>
                <Body className="text-body mb-8">
                    Hệ thống gặp một lỗi nhỏ. Bé hoặc ba mẹ đừng lo nhé, hãy thử tải lại trang hoặc quay về trang chủ.
                </Body>

                <div className="flex flex-col gap-3">
                    <KidButton variant="default" onClick={() => reset()} className="w-full justify-center">
                        <RefreshCcw size={18} className="mr-2" /> Thử lại
                    </KidButton>
                    <Link href="/" className="w-full">
                        <KidButton variant="outline" className="w-full justify-center">
                            <Home size={18} className="mr-2" /> Về trang chủ
                        </KidButton>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
