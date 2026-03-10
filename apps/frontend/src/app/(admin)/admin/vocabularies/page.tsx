'use client';

import { useState, useEffect, useCallback } from 'react';
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
      console.error('Failed to load topics:', error);
      toast.error('Lỗi tải danh sách chủ đề');
    } finally {
      setIsLoadingTopics(false);
    }
  }, []);

  const loadVocabularies = useCallback(async () => {
    if (!selectedTopicId) return;
    try {
      setIsLoadingVocabs(true);
      const vocabs = await getTopicVocabularies(selectedTopicId, 'all');
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

  const filteredVocabs = vocabularies.filter(v =>
    v.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.definition?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-3">Chọn Chủ Đề Học</label>
        <select
          value={selectedTopicId ?? ''}
          onChange={(e) => setSelectedTopicId(parseInt(e.target.value))}
          disabled={isLoadingTopics}
          className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400 transition-all font-medium text-gray-800"
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
            <div key={vocab.id} className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all overflow-hidden border border-gray-100 group flex flex-col">
              {/* Image Header */}
              <div className="h-40 bg-gradient-to-br from-indigo-50 to-blue-50 relative overflow-hidden flex items-center justify-center">
                {vocab.imageUrl ? (
                  <Image
                    src={vocab.imageUrl}
                    alt={vocab.word}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <span className="text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">📝</span>
                )}

                {/* Status Badge Overlaid */}
                {vocab.status && (
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${
                      vocab.status === 'PUBLISHED' ? 'text-green-600' :
                      vocab.status === 'DRAFT' ? 'text-amber-600' :
                      'text-gray-600'
                    }`}>
                      {vocab.status}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-xl font-extrabold text-gray-800 tracking-tight group-hover:text-blue-600 transition-colors">{vocab.word}</h3>
                  {vocab.phonetic && (
                    <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-md text-xs font-mono">{vocab.phonetic}</span>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-3 font-medium">{vocab.definition}</p>

                {vocab.example && (
                  <p className="text-gray-500 text-sm italic mb-4 bg-gray-50 p-2.5 rounded-lg border border-gray-100">&quot;{vocab.example}&quot;</p>
                )}

                <div className="mt-auto pt-4 border-t border-gray-50">
                  {vocab.audioUrl ? (
                    <div className="mb-4">
                      <audio controls className="w-full h-8 custom-audio-player opacity-70 group-hover:opacity-100 transition-opacity">
                        <source src={vocab.audioUrl} type="audio/mpeg" />
                      </audio>
                    </div>
                  ) : <div className="h-10 mb-2"></div>}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(vocab)}
                      className="flex-[2] flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-xl transition-colors font-medium text-sm border border-transparent hover:border-blue-100"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Sửa</span>
                    </button>

                    {vocab.status === 'DRAFT' && (
                      <button
                        onClick={() => handlePublish(vocab.id)}
                        className="flex-1 flex items-center justify-center px-2 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl transition-colors"
                        title="Xuất bản"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(vocab.id)}
                      className="flex-1 flex items-center justify-center px-2 py-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors"
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
