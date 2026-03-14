'use client';

import { motion } from 'framer-motion';
import { Caption } from '@/shared/components/Typography';
import { SectionHeader } from '@/features/admin/components/AdminUI';

// ── Shared chart types ────────────────────────────────────────────────────
export interface BarChartDataPoint {
    label: string;
    value: number;
}

// ─────────────────────────────────────────────────────────────────────────
// BarChart — animated CSS bar chart used in analytics
// ─────────────────────────────────────────────────────────────────────────
interface BarChartProps {
    title: string;
    data: BarChartDataPoint[];
    height?: number;
    /** Tailwind gradient class e.g. 'from-primary to-accent' */
    gradient?: string;
    /** Optional: render color per-bar based on value threshold */
    colorByValue?: boolean;
    action?: React.ReactNode;
}

export function BarChart({ title, data, height = 160, gradient = 'from-primary to-accent', colorByValue = false, action }: BarChartProps) {
    const max = Math.max(...data.map((d) => d.value), 1);
    return (
        <motion.div initial={{ opacity: 1, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card border border-border/70 rounded-2xl p-6 shadow-sm">
            <SectionHeader title={title} action={action} />
            {data.length === 0 ? (
                <div className="mt-4 grid place-items-center rounded-2xl border border-dashed border-border/70 bg-background/60 text-center" style={{ height }}>
                    <Caption className="px-6 text-caption">Chưa có dữ liệu trong khoảng thời gian này.</Caption>
                </div>
            ) : (
            <div className={`flex items-end gap-2 mt-4`} style={{ height }}>
                {data.map((d, i) => {
                    const barColor = colorByValue
                        ? d.value >= 70 ? 'bg-success' : d.value >= 50 ? 'bg-warning' : 'bg-error'
                        : '';
                    return (
                        <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5 group">
                            <span className="text-[10px] text-caption opacity-0 group-hover:opacity-100 transition-opacity">{d.value}</span>
                            <motion.div
                                initial={{ height: 0 }}
                                whileInView={{ height: `${(d.value / max) * 100}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: i * 0.07, ease: 'easeOut' }}
                                className={`w-full min-h-1 rounded-t-xl ${colorByValue ? barColor : `bg-gradient-to-t ${gradient}`}`}
                            />
                            <span className="text-[10px] text-caption">{d.label}</span>
                        </div>
                    );
                })}
            </div>
            )}
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// HorizontalBarList — topic popularity / conversion funnel etc.
// ─────────────────────────────────────────────────────────────────────────
interface HorizontalBarListProps {
    title: string;
    data: Array<{ label: string; value: number; maxValue?: number; meta?: React.ReactNode; barColor?: string }>;
    action?: React.ReactNode;
}

export function HorizontalBarList({ title, data, action }: HorizontalBarListProps) {
    const max = Math.max(...data.map((d) => d.maxValue ?? d.value), 1);
    return (
        <motion.div initial={{ opacity: 1, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card border border-border/70 rounded-2xl p-6 shadow-sm">
            <SectionHeader title={title} action={action} />
            {data.length === 0 ? (
                <div className="mt-2 rounded-2xl border border-dashed border-border/70 bg-background/60 px-4 py-10 text-center">
                    <Caption className="text-caption">Chưa có dữ liệu để hiển thị.</Caption>
                </div>
            ) : (
            <div className="space-y-4 mt-2">
                {data.map((item, i) => (
                    <motion.div key={item.label} initial={{ opacity: 1, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="font-heading font-bold text-heading text-sm">{item.label}</span>
                            {item.meta && <span>{item.meta}</span>}
                        </div>
                        <div className="w-full h-2.5 bg-background rounded-full border border-border overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${((item.maxValue ?? item.value) / max) * 100}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: i * 0.06 }}
                                className={`h-full rounded-full ${item.barColor ?? 'bg-gradient-to-r from-primary to-accent'}`}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
            )}
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// DonutRing — SVG ring chart for pronunciation accuracy etc.
// ─────────────────────────────────────────────────────────────────────────
interface DonutRingProps {
    pct: number;           // 0-100
    label: string;
    color?: string;        // CSS var or Tailwind color token
    size?: number;         // pixel size of the ring
}

export function DonutRing({ pct, label, color = 'var(--color-accent)', size = 112 }: DonutRingProps) {
    const r = (size / 2) * 0.84;
    const circumference = 2 * Math.PI * r;
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border)" strokeWidth={size * 0.1} />
                <motion.circle
                    cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={size * 0.1} strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    whileInView={{ strokeDashoffset: circumference * (1 - pct / 100) }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2 }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading font-black text-heading text-2xl">{pct}%</span>
                <Caption className="text-caption text-[10px]">{label}</Caption>
            </div>
        </div>
    );
}
