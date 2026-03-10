import type { ReactNode } from 'react';
import Link from 'next/link';

export default function PoliciesLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background dark:bg-slate-900 overflow-hidden relative pb-24">
            {/* Background Decorations to keep it somewhat fun but unobtrusive */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-40 left-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl -z-10" />

            {/* Standardized Header specific for policies so user isn't distracted */}
            <header className="bg-white dark:bg-slate-800 border-b border-border py-6 sticky top-0 z-40 backdrop-blur-sm bg-white/80 dark:bg-slate-800/80">
                <div className="max-w-3xl mx-auto px-6 lg:px-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary-dark transition-colors font-bold font-heading">
                        &larr; Về trang chủ
                    </Link>
                </div>
            </header>

            {/* Content Container: Narrow max-width for optimal reading length (line-length accessibility) */}
            <main className="max-w-3xl mx-auto px-6 lg:px-8 pt-12">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 shadow-sm border border-border/50">
                    {children}
                </div>
            </main>
        </div>
    );
}
