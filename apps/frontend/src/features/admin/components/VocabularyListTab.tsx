import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Eye, Trash2 } from 'lucide-react';
import { TableBadge, AdminPagination } from '@/features/admin/components/AdminUI';

export interface Vocabulary {
    id: number;
    topicId: number;
    word: string;
    phonetic: string;
    translation: string;
    difficulty: number;
    hasAudio: boolean;
    hasImage: boolean;
}

interface VocabularyListTabProps {
    vocabularies: Vocabulary[];
    topics: { id: number; name: string }[];
    onEdit?: (vocab: Vocabulary) => void;
    onDelete?: (vocab: Vocabulary) => void;
}

export function VocabularyListTab({ vocabularies, topics, onEdit, onDelete }: VocabularyListTabProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;

    const totalPages = Math.max(1, Math.ceil(vocabularies.length / PAGE_SIZE));
    const effectivePage = Math.min(currentPage, totalPages);
    const paginatedVocabularies = vocabularies.slice((effectivePage - 1) * PAGE_SIZE, effectivePage * PAGE_SIZE);

    return (
        <motion.div key="vocabulary" initial={{ opacity: 1, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-card border-2 border-border rounded-2xl overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-background border-b-2 border-border">
                            <tr>
                                {['Từ', 'Phiên âm', 'Nghĩa', 'Chủ đề', 'Độ khó', 'Media', 'Thao tác'].map((h) => (
                                    <th key={h} className="text-left px-5 py-3 font-heading font-bold text-caption text-xs">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {paginatedVocabularies.map((v, i) => {
                                const topic = topics.find((t) => t.id === v.topicId);
                                return (
                                    <motion.tr key={v.id}
                                        initial={{ opacity: 1 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                                        className="hover:bg-background group"
                                    >
                                        <td className="px-5 py-3 font-heading font-black text-heading">{v.word}</td>
                                        <td className="px-5 py-3 text-caption text-xs font-mono">{v.phonetic}</td>
                                        <td className="px-5 py-3 text-body">{v.translation}</td>
                                        <td className="px-5 py-3">
                                            <TableBadge label={topic?.name ?? '-'} variant="neutral" />
                                        </td>
                                        <td className="px-5 py-3">
                                            <TableBadge
                                                label={v.difficulty === 1 ? 'Dễ' : v.difficulty === 2 ? 'TB' : 'Khó'}
                                                variant={v.difficulty === 1 ? 'success' : v.difficulty === 2 ? 'warning' : 'error'}
                                            />
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex gap-1.5 text-xs">
                                                <span className={v.hasImage ? 'text-success' : 'text-border'}>🖼️</span>
                                                <span className={v.hasAudio ? 'text-success' : 'text-border'}>🔊</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 rounded-lg bg-background border border-border text-body hover:bg-primary-light hover:text-primary transition-colors">
                                                    <Eye size={13} />
                                                </button>
                                                <button
                                                    onClick={() => onEdit?.(v)}
                                                    className="p-1.5 rounded-lg bg-primary-light text-primary hover:bg-primary hover:text-white transition-colors"
                                                    title="Sửa từ vựng"
                                                >
                                                    <Edit2 size={13} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Bạn có chắc chắn muốn xóa từ vựng "${v.word}" không?`)) {
                                                            onDelete?.(v);
                                                        }
                                                    }}
                                                    className="p-1.5 rounded-lg bg-background border border-border text-body hover:bg-error hover:text-white transition-colors"
                                                    title="Xóa từ vựng"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {vocabularies.length === 0 && (
                    <div className="py-12 text-center text-caption">Không tìm thấy từ vựng nào</div>
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
