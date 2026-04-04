'use client';

import { useState, useEffect, useCallback, useMemo, useDeferredValue } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { Edit2, Trash2, CheckCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  getCMSTopics,
  getTopicVocabularies,
  createVocabulary,
  updateVocabulary,
  deleteVocabulary,
  publishVocabulary,
  type CMSTopic,
  type CMSVocabulary,
} from '@/features/cms/api/cms.api';

// Shared Components
import { AdminPageHeader } from '@/features/cms/components/AdminPageHeader';
import { AdminSearchBar } from '@/features/cms/components/AdminSearchBar';
import { AdminModal } from '@/features/cms/components/AdminModal';
import { AdminEmptyState } from '@/features/cms/components/AdminEmptyState';
import { AdminLoadingState } from '@/features/cms/components/AdminLoadingState';
import { VocabularyForm, type VocabularyFormData } from '@/features/cms/components/forms/VocabularyForm';

export default function AdminVocabulariesPage() {
  const [topics, setTopics] = useState<CMSTopic[]>([]);
  const [vocabularies, setVocabularies] = useState<CMSVocabulary[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [isLoadingVocabs, setIsLoadingVocabs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingVocab, setEditingVocab] = useState<CMSVocabulary | null>(null);

  const loadTopics = useCallback(async () => {
    try {
      setIsLoadingTopics(true);
      const result = await getCMSTopics({ status: 'all', page: 1, limit: 100 });
      setTopics(result.items);
      if (result.items.length > 0) {
        setSelectedTopicId(result.items[0].id);
      }
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          setTopics([]);
          toast.error('Bạn không có quyền ADMIN để xem danh sách chủ đề');
        } else {
          console.error('Failed to load topics:', error);
          toast.error('Lỗi tải danh sách chủ đề');
        }
    } finally {
      setIsLoadingTopics(false);
    }
  }, []);

  const loadVocabularies = useCallback(async () => {
    if (!selectedTopicId) return;
    try {
      setIsLoadingVocabs(true);
      const vocabs = await getTopicVocabularies(selectedTopicId, { page: 1, limit: 100 });
      setVocabularies(vocabs);
    } catch (error) {
      console.error('Failed to load vocabularies:', error);
      toast.error('Lỗi tải danh sách từ vựng');
    } finally {
      setIsLoadingVocabs(false);
    }
  }, [selectedTopicId]);

  useEffect(() => {
    void loadTopics();
  }, [loadTopics]);

  useEffect(() => {
    void loadVocabularies();
  }, [loadVocabularies]);

  const handleSubmit = async (data: VocabularyFormData) => {
    if (!selectedTopicId) return;

    try {
      setIsSubmitting(true);
      if (editingVocab) {
        await updateVocabulary(editingVocab.id, data);
        toast.success('Cập nhật từ vựng thành công');
      } else {
        await createVocabulary({
          topicId: selectedTopicId,
          ...data,
        });
        toast.success('Thêm từ vựng mới thành công');
      }
      setShowCreateModal(false);
      setEditingVocab(null);
      void loadVocabularies();
    } catch (error) {
      console.error('Failed to save vocabulary:', error);
      toast.error('Lỗi khi lưu từ vựng');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa từ vựng này?')) return;

    try {
      await deleteVocabulary(id);
      toast.success('Đã xóa từ vựng');
      void loadVocabularies();
    } catch (error) {
      console.error('Failed to delete vocabulary:', error);
      toast.error('Lỗi khi xóa từ vựng');
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await publishVocabulary(id);
      toast.success('Xuất bản từ vựng thành công');
      void loadVocabularies();
    } catch (error) {
      console.error('Failed to publish vocabulary:', error);
      toast.error('Lỗi khi xuất bản từ vựng');
    }
  };

  const openCreateModal = () => {
    if (!selectedTopicId) {
      toast.warning('Vui lòng chọn một chủ đề trước khi thêm từ vựng mới');
      return;
    }
    setEditingVocab(null);
    setShowCreateModal(true);
  };

  const openEditModal = (vocab: CMSVocabulary) => {
    setEditingVocab(vocab);
    setShowCreateModal(true);
  };

  const filteredVocabs = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();
    if (!query) return vocabularies;

    return vocabularies.filter((v) => {
      const word = v.word.toLowerCase();
      const translation = v.translation?.toLowerCase() ?? '';
      return word.includes(query) || translation.includes(query);
    });
  }, [vocabularies, deferredSearchQuery]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* 1. Header */}
      <AdminPageHeader 
        title="Quản lý Từ Vựng" 
        description="Quản lý thư viện từ vựng theo từng chủ đề học tập"
        actionButton={{
          label: 'Thêm Từ Mới',
          icon: <Plus className="w-5 h-5" />,
          onClick: openCreateModal
        }}
      />

      {/* 2. Topic Selector */}
      <div className="bg-card rounded-2xl shadow-sm border border-border/70 p-6 mb-6">
        <label className="block text-sm font-bold text-heading mb-3">Chọn Chủ Đề Học</label>
        <select
          value={selectedTopicId ?? ''}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedTopicId(value ? parseInt(value, 10) : null);
          }}
          disabled={isLoadingTopics}
          className="h-11 w-full rounded-xl border border-border px-4 text-heading font-medium transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-background disabled:text-caption"
        >
          <option value="">-- Chọn chủ đề --</option>
          {topics.map(topic => (
            <option key={topic.id} value={topic.id}>
              {topic.name} ({topic._count?.vocabularies || 0} từ vựng)
            </option>
          ))}
        </select>
      </div>

      {/* 3. Search */}
      {selectedTopicId && (
        <AdminSearchBar 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Tìm từ vựng hoặc nghĩa của từ..."
        />
      )}

      {/* 4. Data Grid */}
      {!selectedTopicId ? (
        <AdminEmptyState 
          icon="📂"
          title="Vui lòng chọn chủ đề"
          description="Bạn cần chọn một chủ đề học để xem và quản lý danh sách từ vựng tương ứng."
        />
      ) : isLoadingVocabs ? (
        <AdminLoadingState />
      ) : filteredVocabs.length === 0 ? (
        <AdminEmptyState 
          icon="📝"
          title="Chưa có từ vựng"
          description={searchQuery ? 'Không tìm thấy từ vựng nào khớp với từ khóa của bạn.' : 'Chủ đề này hiện tại chưa có từ vựng nào. Hãy thêm từ mới nhé.'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVocabs.map(vocab => (
            <div key={vocab.id} className="bg-card rounded-3xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-border/70 group flex flex-col">
              {/* Image Header */}
              <div className="h-40 bg-gradient-to-br from-primary-light/35 to-accent-light/35 relative overflow-hidden flex items-center justify-center">
                {vocab.imageUrl ? (
                  <Image
                    src={vocab.imageUrl}
                    alt={vocab.word}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    quality={75}
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <span className="text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">📝</span>
                )}

                {/* Status Badge Overlaid */}
                {vocab.status && (
                  <div className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-border/60">
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${
                      vocab.status === 'PUBLISHED' ? 'text-green-600' :
                      vocab.status === 'DRAFT' ? 'text-amber-600' :
                      'text-body'
                    }`}>
                      {vocab.status}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-2 flex min-h-[2.25rem] items-start justify-between gap-2">
                  <h3 className="line-clamp-1 text-xl font-extrabold tracking-tight text-heading transition-colors group-hover:text-primary">{vocab.word}</h3>
                  {vocab.phonetic && (
                    <span className="rounded-md border border-border/60 bg-background px-2 py-1 text-xs font-mono text-caption">{vocab.phonetic}</span>
                  )}
                </div>

                <p className="mb-3 min-h-[2.75rem] line-clamp-2 text-sm font-medium text-body">{vocab.translation}</p>

                {vocab.exampleSentence && (
                  <p className="mb-4 line-clamp-2 min-h-[3.5rem] rounded-lg border border-border/60 bg-background p-2.5 text-sm italic text-caption">&quot;{vocab.exampleSentence}&quot;</p>
                )}

                {!vocab.exampleSentence && <div className="mb-4 min-h-[3.5rem]"></div>}

                <div className="mt-auto pt-4 border-t border-border/60">
                  {vocab.audioUrl ? (
                    <div className="mb-4">
                      <audio controls preload="none" className="w-full h-8 custom-audio-player opacity-70 group-hover:opacity-100 transition-opacity">
                        <source src={vocab.audioUrl} type="audio/mpeg" />
                      </audio>
                    </div>
                  ) : <div className="h-10 mb-2"></div>}

                  {/* Actions */}
                  <div className="flex items-stretch gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(vocab)}
                      className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 text-sm font-medium text-body transition-colors hover:border-primary/30 hover:bg-primary-light/40 hover:text-primary"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Sửa</span>
                    </button>

                    {vocab.status === 'DRAFT' && (
                      <button
                        type="button"
                        onClick={() => handlePublish(vocab.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-light text-success transition-colors hover:bg-success-light/70"
                        title="Xuất bản"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(vocab.id)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-background text-caption transition-colors hover:bg-error-light hover:text-error"
                      title="Xóa từ vựng"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Modal Form */}
      <AdminModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        title={editingVocab ? 'Chỉnh sửa Từ Vựng' : 'Thêm Từ Vựng Mới'}
        maxWidth="lg"
      >
        <VocabularyForm 
          initialData={editingVocab}
          onSubmit={handleSubmit}
          onCancel={() => setShowCreateModal(false)}
          isLoading={isSubmitting}
        />
      </AdminModal>
    </div>
  );
}
