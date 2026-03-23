import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';
import { SectionHeader, TableBadge, TableBadgeVariant } from '@/features/admin/components/AdminUI';

export interface RecentUser {
    id: number;
    email: string;
    children: number;
    totalPoints: number;
    status: string;
    joinedAt: string;
}

interface RecentUsersTableProps {
    recentUsers: RecentUser[];
}

export const statusVariant = (s: string): TableBadgeVariant =>
    s === 'premium' ? 'success' : s === 'active' ? 'info' : s === 'pending' ? 'warning' : 'neutral';

export function RecentUsersTable({ recentUsers }: RecentUsersTableProps) {
    return (
        <section>
            <SectionHeader title="Người dùng mới đăng ký"
            action={<button type="button" className="text-primary text-sm font-heading font-bold hover:underline flex items-center gap-1"><Eye size={14} /> Quản lý</button>}
        />
            <div className="bg-card rounded-2xl overflow-hidden border border-border/70">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-background/80 border-b border-border">
                            <tr>
                                {['Email', 'Số bé', 'Tổng điểm', 'Trạng thái', 'Ngày tham gia'].map((h) => (
                                    <th key={h} className="text-left px-5 py-3 font-heading font-bold text-caption text-xs">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {recentUsers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-caption font-medium">
                                        Chưa có người dùng mới trong giai đoạn này.
                                    </td>
                                </tr>
                            )}
                            {recentUsers.map((u, i) => (
                                <motion.tr
                                    key={u.id}
                                    initial={{ opacity: 1 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.05 }}
                                    className="hover:bg-background/70 transition-colors"
                                >
                                    <td className="px-5 py-3 font-heading font-bold text-heading text-sm">{u.email}</td>
                                    <td className="px-5 py-3 text-body">{u.children}</td>
                                    <td className="px-5 py-3 font-heading font-black text-primary">{u.totalPoints.toLocaleString()}</td>
                                    <td className="px-5 py-3">
                                        <TableBadge
                                            label={u.status === 'premium' ? '⭐ Premium' : u.status === 'active' ? 'Đang học' : 'Chờ kích hoạt'}
                                            variant={statusVariant(u.status)}
                                        />
                                    </td>
                                    <td className="px-5 py-3 text-caption text-xs">
                                        {new Date(u.joinedAt).toLocaleDateString('vi-VN')}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
