import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';
import { SectionHeader } from '@/features/admin/components/AdminUI';

export interface ContentStat {
    topic: string;
    words: number;
    quizzes: number;
    completionRate: number;
    avgScore: number;
}

interface ContentStatsTableProps {
    contentStats: ContentStat[];
}

export function ContentStatsTable({ contentStats }: ContentStatsTableProps) {
    return (
        <motion.div
            initial={{ opacity: 1, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl"
        >
            <SectionHeader title="Hiệu quả chủ đề"
            action={<button type="button" className="text-primary text-sm font-heading font-bold hover:underline flex items-center gap-1"><Eye size={14} /> Xem tất cả</button>}
        />
            <div className="overflow-x-auto mt-2">
                <table className="w-full text-sm">
                    <thead className="bg-background/80 border-b border-border">
                        <tr>
                            {['Chủ đề', 'Khối lượng', 'Tỉ lệ HT', 'Điểm số'].map((h) => (
                                <th key={h} className="text-left py-3 px-4 font-heading font-bold text-caption text-xs">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {contentStats.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-10 text-center text-sm text-caption font-medium">
                                    Chưa có dữ liệu hiệu quả chủ đề.
                                </td>
                            </tr>
                        )}
                        {contentStats.map((c, i) => (
                            <motion.tr
                                key={c.topic}
                                initial={{ opacity: 1, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                                className="group hover:bg-background/70 transition-colors"
                            >
                                <td className="py-3 px-4 font-heading font-bold text-heading text-sm">{c.topic}</td>
                                <td className="py-3 px-4 text-caption text-xs">
                                    {c.words} từ · {c.quizzes} quiz
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-1.5 bg-background border border-border rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${c.completionRate > 70 ? 'bg-success' : 'bg-warning'}`}
                                                style={{ width: `${c.completionRate}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-body">{c.completionRate}%</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${c.avgScore > 80 ? 'bg-success-light text-success' : 'bg-warning-light text-warning'
                                        }`}>
                                        {c.avgScore}%
                                    </span>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
