import { motion } from 'framer-motion';
import { MetricCard } from '@/features/admin/components/AdminUI';

export interface PlatformMetric {
    label: string;
    value: string;
    delta: number;
    icon: React.ReactNode;
    colorCls: string;
}

interface DashboardMetricsProps {
    platformMetrics: PlatformMetric[];
}

export function DashboardMetrics({ platformMetrics }: DashboardMetricsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
            {platformMetrics.map((m, i) => (
                <motion.div
                    key={m.label}
                    initial={{ opacity: 1, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                >
                    <MetricCard
                        label={m.label}
                        value={m.value}
                        icon={m.icon}
                        delta={m.delta}
                        colorCls={m.colorCls}
                        index={i}
                    />
                </motion.div>
            ))}
        </div>
    );
}
