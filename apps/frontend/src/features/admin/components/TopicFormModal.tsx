import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Plus } from 'lucide-react';
import { Heading } from '@/shared/components/Typography';
import { KidButton } from '@/components/edukids/KidButton';
import { toast } from 'sonner';

export interface TopicFormData {
    id?: number;
    name: string;
    description: string;
}

interface TopicFormModalProps {
    isOpen: boolean;
    initialData?: TopicFormData | null;
    onClose: () => void;
    onSave: (data: TopicFormData) => void;
}

export function TopicFormModal({ isOpen, initialData, onClose, onSave }: TopicFormModalProps) {
    const modalKey = initialData?.id ? `edit-${initialData.id}` : 'create';

    return (
        <AnimatePresence>
            {isOpen && (
                <TopicFormModalContent
                    key={modalKey}
                    initialData={initialData}
                    onClose={onClose}
                    onSave={onSave}
                />
            )}
        </AnimatePresence>
    );
}

function TopicFormModalContent({ initialData, onClose, onSave }: Omit<TopicFormModalProps, 'isOpen'>) {
    const isEdit = !!initialData?.id;
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Vui lòng nhập tên chủ đề!');
            return;
        }
        onSave({ id: initialData?.id, name, description });
    };

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
                <div className="bg-card border-2 border-border rounded-3xl p-6 w-full max-w-md shadow-2xl pointer-events-auto">
                    <div className="flex items-center justify-between mb-6 border-b-2 border-border pb-4">
                        <Heading level={3} className="text-heading text-xl">{isEdit ? 'Sửa Chủ Đề' : 'Thêm Chủ Đề Mới'}</Heading>
                        <button onClick={onClose} className="p-2 rounded-xl bg-background border border-border hover:bg-error hover:text-white transition-colors text-body">✕</button>
                    </div>

                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-heading font-bold text-heading mb-1.5">Tên chủ đề <span className="text-error">*</span></label>
                            <input
                                type="text"
                                autoFocus
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="VD: Động vật"
                                className="w-full input-base py-2.5 px-4 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-heading font-bold text-heading mb-1.5">Mô tả</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Mô tả ngắn gọn về chủ đề này..."
                                rows={3}
                                className="w-full input-base py-2.5 px-4 text-sm resize-none"
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <KidButton type="button" variant="secondary" onClick={onClose} className="px-5 py-2.5 text-sm">Hủy</KidButton>
                            <KidButton type="submit" variant="default" className="px-5 py-2.5 text-sm gap-2">
                                {isEdit ? <Save size={16} /> : <Plus size={16} />}
                                {isEdit ? 'Lưu Thay Đổi' : 'Tạo Mới'}
                            </KidButton>
                        </div>
                    </form>
                </div>
            </motion.div>
        </>
    );
}
