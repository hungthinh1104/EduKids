import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Plus } from 'lucide-react';
import { Heading } from '@/shared/components/Typography';
import { KidButton } from '@/components/edukids/KidButton';
import { toast } from 'sonner';

export interface VocabularyFormData {
    id?: number;
    topicId: number;
    word: string;
    phonetic: string;
    translation: string;
    difficulty: number;
    hasAudio: boolean;
    hasImage: boolean;
}

interface VocabularyFormModalProps {
    isOpen: boolean;
    initialData?: VocabularyFormData | null;
    topics: { id: number; name: string }[];
    onClose: () => void;
    onSave: (data: VocabularyFormData) => void;
}

export function VocabularyFormModal({ isOpen, initialData, topics, onClose, onSave }: VocabularyFormModalProps) {
    const modalKey = initialData?.id ? `edit-${initialData.id}` : `create-${topics[0]?.id ?? 0}`;

    return (
        <AnimatePresence>
            {isOpen && (
                <VocabularyFormModalContent
                    key={modalKey}
                    initialData={initialData}
                    topics={topics}
                    onClose={onClose}
                    onSave={onSave}
                />
            )}
        </AnimatePresence>
    );
}

function VocabularyFormModalContent({ initialData, topics, onClose, onSave }: Omit<VocabularyFormModalProps, 'isOpen'>) {
    const isEdit = !!initialData?.id;

    const [topicId, setTopicId] = useState<number>(initialData?.topicId || (topics[0]?.id ?? 0));
    const [word, setWord] = useState(initialData?.word || '');
    const [phonetic, setPhonetic] = useState(initialData?.phonetic || '');
    const [translation, setTranslation] = useState(initialData?.translation || '');
    const [difficulty, setDifficulty] = useState<number>(initialData?.difficulty || 1);
    const [hasAudio, setHasAudio] = useState(initialData ? initialData.hasAudio : true);
    const [hasImage, setHasImage] = useState(initialData ? initialData.hasImage : true);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!word.trim() || !translation.trim() || !topicId) {
            toast.error('Vui lòng nhập đầy đủ các trường bắt buộc (*)');
            return;
        }
        onSave({ id: initialData?.id, topicId, word, phonetic, translation, difficulty, hasAudio, hasImage });
    };

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 z-[190] backdrop-blur-sm overflow-y-auto" />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-4 pointer-events-none"
            >
                <div className="bg-card border-2 border-border rounded-3xl p-6 w-full max-w-lg shadow-2xl pointer-events-auto max-h-full overflow-y-auto hidden-scrollbar">
                    <div className="flex items-center justify-between mb-6 border-b-2 border-border pb-4">
                        <Heading level={3} className="text-heading text-xl">{isEdit ? 'Sửa Từ Vựng' : 'Thêm Từ Vựng Mới'}</Heading>
                        <button type="button" onClick={onClose} className="p-2 rounded-xl bg-background border border-border hover:bg-error hover:text-white transition-colors text-body shrink-0">✕</button>
                    </div>

                    <form onSubmit={handleSave} className="space-y-4">
                        {/* Row 1 */}
                        <div>
                            <label className="block text-sm font-heading font-bold text-heading mb-1.5">Chủ đề <span className="text-error">*</span></label>
                            <select
                                value={topicId}
                                onChange={(e) => setTopicId(Number(e.target.value))}
                                className="w-full input-base py-2.5 px-4 text-sm appearance-none cursor-pointer"
                            >
                                <option value={0} disabled>Chọn chủ đề</option>
                                {topics.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Row 2 */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-heading font-bold text-heading mb-1.5">Từ vựng (EN) <span className="text-error">*</span></label>
                                <input
                                    type="text" autoFocus
                                    value={word} onChange={e => setWord(e.target.value)}
                                    placeholder="VD: Elephant"
                                    className="w-full input-base py-2.5 px-4 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-heading font-bold text-heading mb-1.5">Nghĩa (VN) <span className="text-error">*</span></label>
                                <input
                                    type="text"
                                    value={translation} onChange={e => setTranslation(e.target.value)}
                                    placeholder="VD: Con voi"
                                    className="w-full input-base py-2.5 px-4 text-sm"
                                />
                            </div>
                        </div>

                        {/* Row 3 */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-heading font-bold text-heading mb-1.5">Phiên âm</label>
                                <input
                                    type="text"
                                    value={phonetic} onChange={e => setPhonetic(e.target.value)}
                                    placeholder="VD: /ˈelɪfənt/"
                                    className="w-full input-base py-2.5 px-4 text-sm font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-heading font-bold text-heading mb-1.5">Độ khó (1-3) <span className="text-error">*</span></label>
                                <select
                                    value={difficulty} onChange={e => setDifficulty(Number(e.target.value))}
                                    className="w-full input-base py-2.5 px-4 text-sm appearance-none cursor-pointer"
                                >
                                    <option value={1}>1 - Dễ</option>
                                    <option value={2}>2 - Trung bình</option>
                                    <option value={3}>3 - Khó</option>
                                </select>
                            </div>
                        </div>

                        {/* Row 4 - Media toggles */}
                        <div className="pt-2 flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-heading font-bold text-body select-none">
                                <input type="checkbox" checked={hasImage} onChange={e => setHasImage(e.target.checked)} className="w-4 h-4 rounded text-primary focus:ring-primary border-border" />
                                <span>Có hình minh họa 🖼️</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-heading font-bold text-body select-none">
                                <input type="checkbox" checked={hasAudio} onChange={e => setHasAudio(e.target.checked)} className="w-4 h-4 rounded text-primary focus:ring-primary border-border" />
                                <span>Có âm thanh 📢</span>
                            </label>
                        </div>

                        <div className="pt-6 flex justify-end gap-3 border-t-2 border-border mt-4">
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
