'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Edit2, Trash2, Archive, CheckCircle, Plus } from 'lucide-react';
import { getCMSTopics, createTopic, updateTopic, deleteTopic, publishTopic, archiveTopic, type CMSTopic } from '@/features/cms/api/cms.api';
import { toast } from 'sonner';

// Shared Components
import { AdminPageHeader } from '@/features/cms/components/AdminPageHeader';
import { AdminSearchBar } from '@/features/cms/components/AdminSearchBar';
import { AdminModal } from '@/features/cms/components/AdminModal';
import { AdminEmptyState } from '@/features/cms/components/AdminEmptyState';
import { AdminLoadingState } from '@/features/cms/components/AdminLoadingState';
import { TopicForm, type TopicFormData } from '@/features/cms/components/forms/TopicForm';

export default function AdminTopicsPage() {
  const [topics, setTopics] = useState<CMSTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<CMSTopic | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTopics = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getCMSTopics({ status: statusFilter, page: 1, limit: 100 });
      setTopics(result.items);
    } catch (error) {
      console.error('Failed to load topics:', error);
      toast.error('Không thể tải danh sách chủ đề');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadTopics();
  }, [loadTopics]);

  const handleSubmit = async (data: TopicFormData) => {
    try {
      setIsSubmitting(true);
      
      const tagsArray = data.tags.split(',').map(t => t.trim()).filter(Boolean);

      if (editingTopic) {
        await updateTopic(editingTopic.id, {
          ...data,
          tags: tagsArray
        });
        toast.success('Đã cập nhật chủ đề thành công');
      } else {
        await createTopic({
          ...data,
          tags: tagsArray,
          status: 'DRAFT',
        });
        toast.success('Đã tạo chủ đề mới');
      }
      
      setShowCreateModal(false);
      setEditingTopic(null);
      void loadTopics();
    } catch (error) {
      console.error('Failed to save topic:', error);
      toast.error('Lỗi khi lưu chủ đề');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa chủ đề này? Hành động này không thể hoàn tác.')) return;
    
    try {
      await deleteTopic(id);
      toast.success('Đã xóa chủ đề');
      void loadTopics();
    } catch (error) {
      console.error('Failed to delete topic:', error);
      toast.error('Lỗi khi xóa chủ đề');
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await publishTopic(id);
      toast.success('Đã xuất bản chủ đề');
      void loadTopics();
    } catch (error) {
      console.error('Failed to publish topic:', error);
      toast.error('Lỗi khi xuất bản chủ đề');
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await archiveTopic(id);
      toast.success('Đã lưu trữ chủ đề');
      void loadTopics();
    } catch (error) {
      console.error('Failed to archive topic:', error);
      toast.error('Lỗi khi lưu trữ chủ đề');
    }
  };

  const openCreateModal = () => {
    setEditingTopic(null);
    setShowCreateModal(true);
  };

  const openEditModal = (topic: CMSTopic) => {
    setEditingTopic(topic);
    setShowCreateModal(true);
  };

  const filteredTopics = topics.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* 1. Header */}
      <AdminPageHeader 
        title="Quản lý Topics" 
        description="Tạo và quản lý các chủ đề học tập trong hệ thống"
        actionButton={{
          label: 'Tạo Topic Mới',
          icon: <Plus className="w-5 h-5" />,
          onClick: openCreateModal
        }}
      />

      {/* 2. Search & Filter */}
      <AdminSearchBar 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Tìm kiếm theo tên chủ đề hoặc mô tả..."
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => setStatusFilter(val as 'all' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')}
        filterOptions={[
          { label: 'Tất cả', value: 'all' },
          { label: 'Bản Nháp (Draft)', value: 'DRAFT' },
          { label: 'Đã Xuất Bản (Published)', value: 'PUBLISHED' },
          { label: 'Đã Lưu Trữ (Archived)', value: 'ARCHIVED' },
        ]}
      />

      {/* 3. Data Grid */}
      {isLoading ? (
        <AdminLoadingState />
      ) : filteredTopics.length === 0 ? (
        <AdminEmptyState 
          icon="📚"
          title="Không có Topic nào"
          description={searchQuery ? 'Không tìm thấy kết quả phù hợp với từ khóa của bạn.' : 'Chưa có chủ đề nào được tạo. Hãy nhấn "Tạo Topic Mới" để bắt đầu.'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topic) => (
            <div key={topic.id} className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all overflow-hidden border border-gray-100 group">
              {/* Image Header */}
              <div className="h-44 bg-gradient-to-br from-blue-100 to-indigo-100 relative overflow-hidden flex items-center justify-center">
                {topic.imageUrl ? (
                  <Image
                    src={topic.imageUrl}
                    alt={topic.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <span className="text-6xl drop-shadow-sm group-hover:scale-110 transition-transform duration-300">📚</span>
                )}
                
                {/* Status Badge Overlaid */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                  <span className={`text-xs font-bold tracking-wide ${
                    topic.status === 'PUBLISHED' ? 'text-green-600' :
                    topic.status === 'DRAFT' ? 'text-amber-600' :
                    'text-gray-600'
                  }`}>
                    {topic.status}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2 truncate group-hover:text-blue-600 transition-colors">{topic.name}</h3>
                <p className="text-gray-500 text-sm mb-5 line-clamp-2 leading-relaxed h-10">{topic.description}</p>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-5 pb-5 border-b border-gray-100">
                  <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                    <span className="font-semibold text-gray-700">Lvl {topic.learningLevel}/5</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                    <span className="font-semibold text-gray-700">{topic.vocabularyCount || 0}</span>
                    <span>Từ vựng</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(topic)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-xl transition-colors font-medium text-sm border border-transparent hover:border-blue-100"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Sửa</span>
                  </button>
                  
                  {topic.status === 'DRAFT' && (
                    <button
                      onClick={() => handlePublish(topic.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-50/50 hover:bg-green-100/80 text-green-700 rounded-xl transition-colors font-medium text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Xuất Bản</span>
                    </button>
                  )}

                  {topic.status === 'PUBLISHED' && (
                    <button
                      onClick={() => handleArchive(topic.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-orange-50/50 hover:bg-orange-100/80 text-orange-700 rounded-xl transition-colors font-medium text-sm"
                    >
                      <Archive className="w-4 h-4" />
                      <span>Lưu trữ</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(topic.id)}
                    className="flex items-center justify-center px-4 py-2.5 bg-gray-50/80 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors"
                    title="Xóa chủ đề"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Modal Form */}
      <AdminModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        title={editingTopic ? 'Chỉnh sửa Topic' : 'Tạo Topic Mới'}
        maxWidth="xl"
      >
        <TopicForm 
          initialData={editingTopic}
          onSubmit={handleSubmit}
          onCancel={() => setShowCreateModal(false)}
          isLoading={isSubmitting}
        />
      </AdminModal>
    </div>
  );
}
