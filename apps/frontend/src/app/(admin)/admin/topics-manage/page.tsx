'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
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
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        setTopics([]);
        toast.error('Bạn không có quyền ADMIN để xem danh sách chủ đề');
      } else {
        console.error('Failed to load topics:', error);
        toast.error('Không thể tải danh sách chủ đề');
      }
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
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (topic: CMSTopic) => {
    if (!confirm('Bạn có chắc muốn xóa chủ đề này? Hành động này không thể hoàn tác.')) return;

    try {
      if (topic.status === 'PUBLISHED') {
        const shouldArchiveFirst = confirm(
          'Topic đang ở trạng thái PUBLISHED nên cần lưu trữ trước khi xóa. Bạn có muốn lưu trữ ngay bây giờ không?',
        );

        if (!shouldArchiveFirst) {
          return;
        }

        await archiveTopic(topic.id);
      }

      await deleteTopic(topic.id);
      toast.success('Đã xóa chủ đề');
      void loadTopics();
    } catch (error) {
      console.error('Failed to delete topic:', error);
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        const backendMessage =
          (error.response.data as { message?: string })?.message ||
          'Không thể xóa topic đang được publish. Hãy lưu trữ trước rồi thử lại.';
        toast.error(backendMessage);
        return;
      }

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

  const filteredTopics = topics.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (t.status ?? 'DRAFT') === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
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
            <div key={topic.id} className="bg-card rounded-3xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-border/70 group">
              {/* Image Header */}
              <div className="h-44 bg-gradient-to-br from-primary-light/40 to-accent-light/35 relative overflow-hidden flex items-center justify-center">
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

                {(topic.hasVideo || topic.videoUrl) && (
                  <div className="absolute top-4 left-4 rounded-full border border-blue-200/70 bg-blue-50/90 px-3 py-1 text-[11px] font-bold tracking-wide text-blue-700 shadow-sm backdrop-blur-sm">
                    🎬 Có video
                  </div>
                )}
                
                {/* Status Badge Overlaid */}
                <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-border/60">
                  <span className={`text-xs font-bold tracking-wide ${
                    topic.status === 'PUBLISHED' ? 'text-green-600' :
                    topic.status === 'DRAFT' ? 'text-amber-600' :
                    'text-body'
                  }`}>
                    {topic.status}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-heading mb-2 truncate group-hover:text-primary transition-colors">{topic.name}</h3>
                <p className="text-caption text-sm mb-5 line-clamp-2 leading-relaxed h-10">{topic.description}</p>

                <div className="flex items-center gap-4 text-sm text-caption mb-5 pb-5 border-b border-border/60">
                  <div className="flex items-center gap-1.5 bg-background px-3 py-1.5 rounded-lg border border-border/60">
                    <span className="font-semibold text-body">Lvl {topic.learningLevel}/5</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-background px-3 py-1.5 rounded-lg border border-border/60">
                    <span className="font-semibold text-body">{topic.vocabularyCount || 0}</span>
                    <span>Từ vựng</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-stretch gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(topic)}
                    className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 text-sm font-medium text-body transition-colors hover:border-primary/30 hover:bg-primary-light/40 hover:text-primary"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Sửa</span>
                  </button>
                  
                  {topic.status === 'DRAFT' && (
                    <button
                      type="button"
                      onClick={() => handlePublish(topic.id)}
                      className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-success-light px-3 text-sm font-medium text-success transition-colors hover:bg-success-light/70"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Xuất Bản</span>
                    </button>
                  )}

                  {topic.status === 'PUBLISHED' && (
                    <button
                      type="button"
                      onClick={() => handleArchive(topic.id)}
                      className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-warning-light px-3 text-sm font-medium text-warning transition-colors hover:bg-warning-light/70"
                    >
                      <Archive className="w-4 h-4" />
                      <span>Lưu trữ</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(topic)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-background text-caption transition-colors hover:bg-error-light hover:text-error"
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
