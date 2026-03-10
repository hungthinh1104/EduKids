'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, BookOpen, Package, ChevronDown, ShieldCheck } from 'lucide-react';
import { Heading } from '@/shared/components/Typography';
import { KidButton } from '@/components/edukids/KidButton';
import { Skeleton } from '@/components/edukids/Skeleton';
import { apiClient } from '@/shared/services/api.client';
import { TopicListTab } from '@/features/admin/components/TopicListTab';
import { VocabularyListTab, Vocabulary } from '@/features/admin/components/VocabularyListTab';
import { ContentValidationTab, PendingItem } from '@/features/admin/components/ContentValidationTab';
import { TopicFormModal, TopicFormData } from '@/features/admin/components/TopicFormModal';
import { VocabularyFormModal, VocabularyFormData } from '@/features/admin/components/VocabularyFormModal';
import { toast } from 'sonner';

interface Topic {
    id: number;
    name: string;
    description: string;
    vocabularyCount: number;
    createdAt: string;
}

type Tab = 'topics' | 'vocabulary' | 'validation';

export default function ContentManagementPage() {
    const [tab, setTab] = useState<Tab>('topics');
    const [search, setSearch] = useState('');
    const [selectedTopic, setSelectedTopic] = useState<number | null>(null);

    // Modal States
    const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
    const [selectedTopicForEdit, setSelectedTopicForEdit] = useState<TopicFormData | null>(null);

    const [isVocabModalOpen, setIsVocabModalOpen] = useState(false);
    const [selectedVocabForEdit, setSelectedVocabForEdit] = useState<VocabularyFormData | null>(null);

    const [topics, setTopics] = useState<Topic[]>([]);
    const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
    const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [topicsRes] = await Promise.all([
                    apiClient.get('/cms/topics')
                ]);
                // Note: Vocabularies fetched per-topic, validation pending not implemented yet

                if (topicsRes.data?.data) setTopics(topicsRes.data.data);
                // Pending items will be implemented later
            } catch (err) {
                console.error('Failed to fetch CMS data:', err);
                // MOCK DATA (if API is not ready)
                setTopics([
                    { id: 1, name: 'Động vật', description: 'Các loài vật gần gũi và hoang dã', vocabularyCount: 45, createdAt: '2024-03-01T10:00:00Z' },
                    { id: 2, name: 'Giao tiếp hàng ngày', description: 'Mẫu câu hỏi đáp cơ bản', vocabularyCount: 120, createdAt: '2024-03-02T15:30:00Z' },
                    { id: 3, name: 'Thức ăn', description: 'Tên các món ăn và nguyên liệu', vocabularyCount: 30, createdAt: '2024-03-03T08:15:00Z' }
                ]);
                setVocabularies([
                    { id: 1, topicId: 1, word: 'Elephant', phonetic: '/ˈelɪfənt/', translation: 'Con voi', difficulty: 2, hasAudio: true, hasImage: true },
                    { id: 2, topicId: 1, word: 'Lion', phonetic: '/ˈlaɪən/', translation: 'Con sư tử', difficulty: 1, hasAudio: true, hasImage: true },
                    { id: 3, topicId: 1, word: 'Giraffe', phonetic: '/dʒɪˈrɑːf/', translation: 'Hươu cao cổ', difficulty: 3, hasAudio: false, hasImage: true },
                    { id: 4, topicId: 3, word: 'Apple', phonetic: '/ˈæpl/', translation: 'Quả táo', difficulty: 1, hasAudio: true, hasImage: false }
                ]);
                setPendingItems([
                    { id: 1, type: 'vocabulary', word: 'Crocodile', topicName: 'Động vật', submittedBy: 'contributor1@gmail.com', submittedAt: '2 giờ trước', hasAudio: true, hasImage: true },
                    { id: 2, type: 'vocabulary', word: 'Watermelon', topicName: 'Thức ăn', submittedBy: 'teacherA@gmail.com', submittedAt: '5 giờ trước', hasAudio: false, hasImage: true },
                    { id: 3, type: 'topic', word: 'Gia đình', topicName: 'New Topic', submittedBy: 'admin2@gmail.com', submittedAt: '1 ngày trước', hasAudio: true, hasImage: false }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // CRUD Handlers (Mock logic combined with API structure)
    const handleSaveTopic = async (data: TopicFormData) => {
        try {
            if (data.id) {
                // Update
                await apiClient.put(`/cms/topics/${data.id}`, data);
                setTopics(prev => prev.map(t => t.id === data.id ? { ...t, name: data.name, description: data.description } : t));
                toast.success('Cập nhật chủ đề thành công');
            } else {
                // Create
                const res = await apiClient.post('/cms/topics', data);
                const newTopic: Topic = res.data?.data || { id: Date.now(), name: data.name, description: data.description, vocabularyCount: 0, createdAt: new Date().toISOString() };
                setTopics([newTopic, ...topics]);
                toast.success('Thêm chủ đề thành công');
            }
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi lưu chủ đề');
        } finally {
            setIsTopicModalOpen(false);
        }
    };

    const handleDeleteTopic = async (id: number) => {
        try {
            await apiClient.delete(`/cms/topics/${id}`);
            setTopics(prev => prev.filter(t => t.id !== id));
            toast.success('Xóa chủ đề thành công');
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi xóa chủ đề');
        }
    };

    const handleSaveVocab = async (data: VocabularyFormData) => {
        try {
            if (data.id) {
                await apiClient.put(`/cms/vocabularies/${data.id}`, data);
                setVocabularies(prev => prev.map(v => v.id === data.id ? { ...v, ...data } as Vocabulary : v));
                toast.success('Cập nhật từ vựng thành công');
            } else {
                const res = await apiClient.post('/cms/vocabularies', data);
                const newVocab: Vocabulary = res.data?.data || { id: Date.now(), ...data } as Vocabulary;
                setVocabularies([newVocab, ...vocabularies]);
                toast.success('Thêm từ vựng thành công');
            }
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi lưu từ vựng');
        } finally {
            setIsVocabModalOpen(false);
        }
    };

    const handleDeleteVocab = async (id: number) => {
        try {
            await apiClient.delete(`/cms/vocabularies/${id}`);
            setVocabularies(prev => prev.filter(v => v.id !== id));
            toast.success('Xóa từ vựng thành công');
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi xóa từ vựng');
        }
    };

    const filteredTopics = topics.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
    const filteredVocab = vocabularies.filter(v =>
        (selectedTopic ? v.topicId === selectedTopic : true) &&
        (v.word.toLowerCase().includes(search.toLowerCase()) || v.translation.toLowerCase().includes(search.toLowerCase()))
    );

    const filteredPendingItems = pendingItems;

    if (loading) {
        return (
            <div className="p-6 md:p-10 space-y-8">
                <Skeleton className="h-10 w-64 mb-6" />
                <Skeleton className="h-12 w-full max-w-2xl mb-4" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 space-y-8 max-w-[1600px] mx-auto">
            {/* Header & Quick Stats */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <Heading level={2} className="text-heading text-2xl md:text-3xl mb-1">Quản Lý Nội Dung</Heading>
                    <p className="text-caption mt-1 flex gap-4 text-sm font-medium">
                        <span><b className="text-body font-black">{topics.length}</b> chủ đề</span>
                        <span><b className="text-body font-black">{vocabularies.length}</b> từ vựng</span>
                    </p>
                </motion.div>
                <div className="flex gap-3">
                    <KidButton variant="secondary" onClick={() => { setSelectedTopicForEdit(null); setIsTopicModalOpen(true); }} className="px-5 py-2.5 text-sm gap-2 whitespace-nowrap">
                        <Plus size={16} strokeWidth={3} /> Thêm chủ đề
                    </KidButton>
                    <KidButton variant="default" onClick={() => { setSelectedVocabForEdit(null); setIsVocabModalOpen(true); }} className="px-5 py-2.5 text-sm gap-2 whitespace-nowrap">
                        <Plus size={16} strokeWidth={3} /> Thêm từ vựng
                    </KidButton>
                </div>
            </div>

            {/* Controls: Tabs & Search & Filter */}
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex bg-background border-2 border-border rounded-2xl p-1 gap-1">
                    {([['topics', 'Chủ đề', BookOpen], ['vocabulary', 'Từ vựng', Package], ['validation', 'Kiểm duyệt', ShieldCheck]] as const).map(([id, label, Icon]) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-heading font-bold text-sm transition-all ${tab === id ? 'bg-card border-2 border-border text-heading shadow-sm' : 'text-caption hover:text-body'
                                }`}
                        >
                            <Icon size={15} /> {label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-caption" />
                    <input
                        type="text"
                        placeholder={tab === 'topics' ? 'Tìm chủ đề...' : 'Tìm từ vựng...'}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-base pl-10 py-2.5 w-full text-sm"
                    />
                </div>

                {/* Topic filter (only in vocab tab) */}
                {tab === 'vocabulary' && (
                    <div className="relative">
                        <select
                            value={selectedTopic ?? ''}
                            onChange={(e) => setSelectedTopic(e.target.value ? Number(e.target.value) : null)}
                            className="input-base pr-8 py-2.5 text-sm appearance-none cursor-pointer"
                        >
                            <option value="">Tất cả chủ đề</option>
                            {topics.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-caption pointer-events-none" />
                    </div>
                )}
            </div>

            {/* Tables */}
            <AnimatePresence mode="wait">
                {tab === 'topics' ? (
                    <TopicListTab
                        topics={filteredTopics}
                        onEdit={(t) => { setSelectedTopicForEdit({ id: t.id, name: t.name, description: t.description }); setIsTopicModalOpen(true); }}
                        onDelete={(t) => handleDeleteTopic(t.id)}
                    />
                ) : tab === 'vocabulary' ? (
                    <VocabularyListTab
                        vocabularies={filteredVocab}
                        topics={topics}
                        onEdit={(v) => { setSelectedVocabForEdit({ id: v.id, topicId: v.topicId, word: v.word, phonetic: v.phonetic, translation: v.translation, difficulty: v.difficulty, hasAudio: v.hasAudio, hasImage: v.hasImage }); setIsVocabModalOpen(true); }}
                        onDelete={(v) => handleDeleteVocab(v.id)}
                    />
                ) : (
                    // UC-14: Content Validation Workflow ──────────────────────
                    <ContentValidationTab
                        pendingItems={filteredPendingItems}
                        onItemsChange={(ids) => setPendingItems((prev) => prev.filter((p) => !ids.includes(p.id)))}
                    />
                )}
            </AnimatePresence>

            {/* Modals */}
            <TopicFormModal
                isOpen={isTopicModalOpen}
                initialData={selectedTopicForEdit}
                onClose={() => setIsTopicModalOpen(false)}
                onSave={handleSaveTopic}
            />
            <VocabularyFormModal
                isOpen={isVocabModalOpen}
                initialData={selectedVocabForEdit}
                topics={topics}
                onClose={() => setIsVocabModalOpen(false)}
                onSave={handleSaveVocab}
            />
        </div>
    );
}
