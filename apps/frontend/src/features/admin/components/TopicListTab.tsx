import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Eye, Trash2 } from 'lucide-react';
import { AdminPagination } from '@/features/admin/components/AdminUI';

interface Topic {
    id: number;
    name: string;
    description: string;
    vocabularyCount: number;
    createdAt: string;
}

interface TopicListTabProps {
    topics: Topic[];
    onEdit?: (topic: Topic) => void;
    onDelete?: (topic: Topic) => void;
}

export function TopicListTab({ topics, onEdit, onDelete }: TopicListTabProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;

    const totalPages = Math.max(1, Math.ceil(topics.length / PAGE_SIZE));
    const effectivePage = Math.min(currentPage, totalPages);
    const paginatedTopics = topics.slice((effectivePage - 1) * PAGE_SIZE, effectivePage * PAGE_SIZE);

    return (
        <motion.div key="topics" initial={{ opacity: 1, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-card border-2 border-border rounded-2xl overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-background border-b-2 border-border">
                            <tr>
                                {['ID', 'Chủ đề', 'Mô tả', 'Từ vựng', 'Ngày tạo', 'Thao tác'].map((h) => (
                                    <th key={h} className="text-left px-5 py-3 font-heading font-bold text-caption text-xs">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {paginatedTopics.map((topic, i) => (
                                <motion.tr key={topic.id}
                                    initial={{ opacity: 1 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                    className="hover:bg-background group"
                                >
                                    <td className="px-5 py-3 text-caption text-xs">#{topic.id}</td>
                                    <td className="px-5 py-3 font-heading font-black text-heading text-sm">{topic.name}</td>
                                    <td className="px-5 py-3 text-body truncate max-w-[200px]">{topic.description}</td>
                                    <td className="px-5 py-3">
                                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold text-xs">{topic.vocabularyCount} từ</span>
                                    </td>
                                    <td className="px-5 py-3 text-caption text-xs">{new Date(topic.createdAt).toLocaleDateString()}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 rounded-lg bg-background border border-border text-body hover:bg-primary-light hover:text-primary transition-colors">
                                                <Eye size={14} />
                                            </button>
                                            <button
                                                onClick={() => onEdit?.(topic)}
                                                className="p-1.5 rounded-lg bg-primary-light text-primary hover:bg-primary hover:text-white transition-colors"
                                                title="Sửa chủ đề"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Bạn có chắc chắn muốn xóa chủ đề "${topic.name}" không?`)) {
                                                        onDelete?.(topic);
                                                    }
                                                }}
                                                className="p-1.5 rounded-lg bg-background border border-border text-body hover:bg-error hover:text-white transition-colors"
                                                title="Xóa chủ đề"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {topics.length === 0 && (
                    <div className="py-12 text-center text-caption">Không tìm thấy chủ đề nào</div>
                )}

                <AdminPagination
                    currentPage={effectivePage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>
        </motion.div>
    );
}
