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
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-1 bg-card border-2 border-border rounded-2xl p-6"
        >
            <SectionHeader
                title="Phiên học / ngày"
                action={<TrendingUp size={16} className="text-primary" />}
            />
            <div className="flex items-end gap-1.5 h-36 mt-2">
                {weeklyData.map((w, i) => (
                    <div key={w.day} className="flex-1 flex flex-col items-center gap-1 group">
                        <span className="text-[10px] text-caption opacity-0 group-hover:opacity-100 transition-opacity">{w.sessions}</span>
                        <motion.div
                            initial={{ height: 0 }}
                            whileInView={{ height: `${(w.sessions / maxSessions) * 100}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: i * 0.06, ease: 'easeOut' }}
                            className="w-full min-h-1 bg-gradient-to-t from-primary to-accent rounded-t-lg group-hover:from-primary-dark"
                        />
                        <span className="text-[10px] text-caption">{w.day}</span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
