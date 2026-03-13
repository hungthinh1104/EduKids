import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { SectionHeader } from '@/features/admin/components/AdminUI';

export interface WeeklyData {
    day: string;
    sessions: number;
}

interface WeeklySessionsChartProps {
    weeklyData: WeeklyData[];
    maxSessions: number;
}

export function WeeklySessionsChart({ weeklyData, maxSessions }: WeeklySessionsChartProps) {
    const hasData = weeklyData.some((w) => w.sessions > 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl"
        >
            <SectionHeader
                title="Phiên học / ngày"
                action={<TrendingUp size={16} className="text-primary" />}
            />
            {hasData ? (
                <div className="flex items-end gap-2 h-40 mt-2">
                    {weeklyData.map((w, i) => (
                        <div key={w.day} className="flex-1 flex flex-col items-center gap-1.5 group">
                            <span className="text-[10px] text-caption opacity-0 group-hover:opacity-100 transition-opacity">{w.sessions}</span>
                            <motion.div
                                initial={{ height: 0 }}
                                whileInView={{ height: `${(w.sessions / maxSessions) * 100}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: i * 0.06, ease: 'easeOut' }}
                                className="w-full min-h-1.5 rounded-t-xl bg-gradient-to-t from-primary/85 via-primary to-accent shadow-[0_-2px_8px_rgba(0,0,0,0.08)]"
                            />
                            <span className="text-[10px] font-semibold text-caption">{w.day}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-40 grid place-items-center rounded-xl border border-dashed border-border/70 bg-background/50">
                    <span className="text-xs font-medium text-caption">Chưa có dữ liệu phiên học tuần này</span>
                </div>
            )}
        </motion.div>
    );
}
