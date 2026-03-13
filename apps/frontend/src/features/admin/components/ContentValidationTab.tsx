import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, ShieldCheck, ShieldX } from 'lucide-react';
import { TableBadge } from '@/features/admin/components/AdminUI';
import { toast } from 'sonner';

export interface PendingItem {
    id: number;
    type: string;
    word: string;
    topicName: string;
    submittedBy: string;
    submittedAt: string;
    hasAudio: boolean;
    hasImage: boolean;
}

interface ContentValidationTabProps {
    pendingItems: PendingItem[];
    onItemsChange: (ids: number[]) => void;
    onApproveItem?: (item: PendingItem) => Promise<void>;
    onRejectItem?: (item: PendingItem) => Promise<void>;
}

export function ContentValidationTab({ pendingItems, onItemsChange, onApproveItem, onRejectItem }: ContentValidationTabProps) {
    const [processing, setProcessing] = useState<Set<number>>(new Set());

    async function handleApprove(item: PendingItem) {
        setProcessing((prev) => new Set([...prev, item.id]));
        try {
            if (onApproveItem) {
                await onApproveItem(item);
            }
            toast.success(`✅ Đã duyệt: ${item.word}`);
            onItemsChange([item.id]);
        } catch {
            toast.error(`Không thể duyệt "${item.word}"`, { description: 'Vui lòng thử lại.' });
        } finally {
            setProcessing((prev) => { const n = new Set(prev); n.delete(item.id); return n; });
        }
    }

    async function handleReject(item: PendingItem) {
        setProcessing((prev) => new Set([...prev, item.id]));
        try {
            if (onRejectItem) {
                await onRejectItem(item);
            }
            toast.success(`❌ Đã từ chối: ${item.word}`);
            onItemsChange([item.id]);
        } catch {
            toast.error(`Không thể từ chối "${item.word}"`, { description: 'Vui lòng thử lại.' });
        } finally {
            setProcessing((prev) => { const n = new Set(prev); n.delete(item.id); return n; });
        }
    }

    return (
        <motion.div key="validation" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-card border-2 border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b-2 border-border flex items-center gap-3">
                    <Clock size={16} className="text-warning" />
                    <span className="font-heading font-bold text-heading text-sm">{pendingItems.length} nội dung chờ duyệt</span>
                </div>
                {pendingItems.length === 0 ? (
                    <div className="py-16 text-center">
                        <ShieldCheck size={40} className="text-success mx-auto mb-3" />
                        <p className="font-heading font-bold text-heading">Tất cả đã được duyệt!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {pendingItems.map((item, i) => (
                            <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                className="px-5 py-4 flex items-center gap-5"
                            >
                                <div className="w-10 h-10 rounded-xl bg-warning-light flex items-center justify-center text-xl shrink-0">
                                    {item.type === 'topic' ? '📚' : '📝'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-heading font-black text-heading text-sm">{item.word}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <TableBadge label={item.topicName} variant="neutral" />
                                        <span className="text-caption text-xs">{item.submittedBy}</span>
                                        <span className="text-caption text-xs">· {item.submittedAt}</span>
                                    </div>
                                    <div className="flex gap-2 mt-1 text-xs">
                                        {item.hasImage && <span className="text-success">🖼️ Ảnh</span>}
                                        {item.hasAudio && <span className="text-success">📢 Audio</span>}
                                        {!item.hasImage && <span className="text-error">🖼️ Thiếu ảnh</span>}
                                        {!item.hasAudio && <span className="text-error">📢 Thiếu audio</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => void handleApprove(item)}
                                        disabled={processing.has(item.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success-light text-success font-heading font-bold text-xs border border-success/30 hover:bg-success hover:text-white transition-colors disabled:opacity-50"
                                    >
                                        <ShieldCheck size={13} /> Duyệt
                                    </button>
                                    <button
                                        onClick={() => void handleReject(item)}
                                        disabled={processing.has(item.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-error-light text-error font-heading font-bold text-xs border border-error/30 hover:bg-error hover:text-white transition-colors disabled:opacity-50"
                                    >
                                        <ShieldX size={13} /> Từ chối
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
