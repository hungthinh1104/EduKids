'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Heading, Caption } from '@/shared/components/Typography';

// ── Shared Admin UI primitives ─────────────────────────────────────────────
// These live here because they're used across multiple Admin pages.
// For now co-located; move to shared/ if ever used outside admin route group.

interface MetricCardProps {
    label: string;
    value: string | number;
    delta?: number;         // % change vs previous period, undefined = no trend
    icon: React.ReactNode;
    colorCls: string;       // e.g. 'text-primary bg-primary-light'
    index?: number;
}

export function MetricCard({ label, value, delta, icon, colorCls, index = 0 }: MetricCardProps) {
    const Trend = delta === undefined ? null : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
    const trendCls = delta === undefined ? '' : delta > 0 ? 'text-success' : delta < 0 ? 'text-error' : 'text-caption';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07 }}
            className="bg-card border-2 border-border rounded-2xl p-5 flex flex-col gap-3"
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorCls}`}>
                {icon}
            </div>
            <div>
                <div className="text-2xl font-heading font-black text-heading">{value}</div>
                <Caption className="text-caption text-xs">{label}</Caption>
            </div>
            {Trend && (
                <div className={`flex items-center gap-1 text-xs font-bold ${trendCls}`}>
                    <Trend size={13} />
                    {Math.abs(delta!)}% so với tuần trước
                </div>
            )}
        </motion.div>
    );
}

interface SectionHeaderProps {
    title: string;
    action?: React.ReactNode;
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-4">
            <Heading level={3} className="text-heading text-xl">{title}</Heading>
            {action}
        </div>
    );
}

interface TableBadgeProps {
    label: string;
    variant: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

export type TableBadgeVariant = TableBadgeProps['variant'];

const BADGE_CLS: Record<TableBadgeProps['variant'], string> = {
    success: 'bg-success-light text-success',
    warning: 'bg-warning-light text-warning',
    error: 'bg-error-light text-error',
    info: 'bg-primary-light text-primary',
    neutral: 'bg-background text-caption',
};

export function TableBadge({ label, variant }: TableBadgeProps) {
    return (
        <span className={`text-xs font-heading font-bold px-2.5 py-1 rounded-full ${BADGE_CLS[variant]}`}>
            {label}
        </span>
    );
}

// ── Pagination ─────────────────────────────────────────────────────────────

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminPaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function AdminPagination({ currentPage, totalPages, onPageChange }: AdminPaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between px-5 py-3 border-t-2 border-border bg-background">
            <Caption className="text-caption text-xs font-medium pl-2">
                Trang {currentPage} / {totalPages}
            </Caption>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-border text-body hover:bg-card disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`w-8 h-8 rounded-lg text-sm font-heading font-bold transition-colors ${currentPage === page
                                    ? 'bg-primary text-white border-2 border-primary'
                                    : 'text-body hover:bg-card border-2 border-transparent hover:border-border'
                                }`}
                        >
                            {page}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-border text-body hover:bg-card disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}
