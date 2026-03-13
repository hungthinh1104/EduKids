'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Edit2, Trash2, CheckCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  getCMSTopics,
  getTopicQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  publishQuiz,
  type CMSTopic,
  type CMSQuiz,
} from '@/features/cms/api/cms.api';

// Shared Components
import { AdminPageHeader } from '@/features/cms/components/AdminPageHeader';
import { AdminSearchBar } from '@/features/cms/components/AdminSearchBar';
import { AdminModal } from '@/features/cms/components/AdminModal';
import { AdminEmptyState } from '@/features/cms/components/AdminEmptyState';
import { AdminLoadingState } from '@/features/cms/components/AdminLoadingState';
import { QuizForm } from '@/features/cms/components/forms/QuizForm';

export default function AdminQuizzesPage() {
  const [topics, setTopics] = useState<CMSTopic[]>([]);
  const [quizzes, setQuizzes] = useState<CMSQuiz[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<CMSQuiz | null>(null);

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

  const loadQuizzes = useCallback(async () => {
    if (!selectedTopicId) return;
    try {
      setIsLoadingQuizzes(true);
      const quizzesData = await getTopicQuizzes(selectedTopicId, { page: 1, limit: 100 });
      setQuizzes(quizzesData);
    } catch (error) {
      console.error('Failed to load quizzes:', error);
      toast.error('Lỗi tải danh sách bài tập');
    } finally {
      setIsLoadingQuizzes(false);
    }
  }, [selectedTopicId]);

  useEffect(() => {
    void loadTopics();
  }, [loadTopics]);

  useEffect(() => {
    void loadQuizzes();
  }, [loadQuizzes]);

  const handleSubmit = async (data: {
    title: string;
    description: string;
    questionText: string;
    correctAnswer: string;
    options: string[];
    difficultyLevel: 1 | 2 | 3 | 4 | 5;
  }) => {
    if (!selectedTopicId) return;

    try {
      setIsSubmitting(true);
      // Map options to {text, isCorrect} format matching backend CreateQuizStructureDto
      const optionsPayload = data.options.map((text) => ({
        text,
        isCorrect: text === data.correctAnswer,
      }));

      const payload: Parameters<typeof createQuiz>[0] = {
        topicId: selectedTopicId,
        title: data.title,
        description: data.description,
        questionText: data.questionText,
        options: optionsPayload,
        difficultyLevel: data.difficultyLevel,
      };

      if (editingQuiz) {
        await updateQuiz(editingQuiz.id, payload);
        toast.success('Cập nhật bài tập thành công');
      } else {
        await createQuiz(payload);
        toast.success('Tạo bài tập mới thành công');
      }

      setShowCreateModal(false);
      setEditingQuiz(null);
      void loadQuizzes();
    } catch (error) {
      console.error('Failed to save quiz:', error);
      toast.error('Lỗi khi lưu bài tập');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa bài kiểm tra này?')) return;

    try {
      await deleteQuiz(id);
      toast.success('Đã xóa bài tập');
      void loadQuizzes();
    } catch (error) {
      console.error('Failed to delete quiz:', error);
      toast.error('Lỗi khi xóa bài tập');
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await publishQuiz(id);
      toast.success('Xuất bản bài tập thành công');
      void loadQuizzes();
    } catch (error) {
      console.error('Failed to publish quiz:', error);
      toast.error('Lỗi khi xuất bản bài tập');
    }
  };

  const openCreateModal = () => {
    if (!selectedTopicId) {
      toast.warning('Vui lòng chọn một chủ đề trước khi tạo bài tập');
      return;
    }
    setEditingQuiz(null);
    setShowCreateModal(true);
  };

  const openEditModal = (quiz: CMSQuiz) => {
    setEditingQuiz(quiz);
    setShowCreateModal(true);
  };

  const filteredQuizzes = quizzes.filter(q =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.questionText?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'text-green-600 bg-green-50 border-green-200';
      case 2: return 'text-blue-600 bg-blue-50 border-blue-200';
      case 3: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 4: return 'text-orange-600 bg-orange-50 border-orange-200';
      case 5: return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getDifficultyLabel = (level: number) => {
    switch (level) {
      case 1: return 'Rất dễ';
      case 2: return 'Dễ';
      case 3: return 'Trung bình';
      case 4: return 'Khó';
      case 5: return 'Rất khó';
      default: return 'Không xác định';
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* 1. Header */}
      <AdminPageHeader 
        title="Quản lý Bài Kiểm Tra (Quizzes)" 
        description="Biên soạn các câu hỏi trắc nghiệm cho từng chủ đề"
        actionButton={{
          label: 'Thêm Bài Tập',
          icon: <Plus className="w-5 h-5" />,
          onClick: openCreateModal
        }}
      />

      {/* 2. Topic Selector */}
      <div className="bg-card rounded-2xl shadow-sm border border-border/70 p-6 mb-6">
        <label className="block text-sm font-bold text-heading mb-3">Chọn Chủ Đề Học</label>
        <select
          value={selectedTopicId ?? ''}
          onChange={(e) => setSelectedTopicId(parseInt(e.target.value))}
          disabled={isLoadingTopics}
          className="w-full px-4 py-3.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:bg-background disabled:text-caption transition-all font-medium text-heading"
        >
          <option value="">-- Chọn chủ đề --</option>
          {topics.map(topic => (
            <option key={topic.id} value={topic.id}>
              {topic.name} ({topic._count?.quizzes || 0} bài tập)
            </option>
          ))}
        </select>
      </div>

      {/* 3. Search */}
      {selectedTopicId && (
        <AdminSearchBar 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Tìm tiêu đề hoặc nội dung câu hỏi..."
        />
      )}

      {/* 4. Data List */}
      {!selectedTopicId ? (
        <AdminEmptyState 
          icon="📚"
          title="Vui lòng chọn chủ đề"
          description="Bạn cần chọn một chủ đề học để xem danh sách câu hỏi trắc nghiệm tương ứng."
        />
      ) : isLoadingQuizzes ? (
        <AdminLoadingState />
      ) : filteredQuizzes.length === 0 ? (
        <AdminEmptyState 
          icon="📝"
          title="Chưa có bài tập nào"
          description={searchQuery ? 'Không tìm thấy câu hỏi nào khớp với từ khóa của bạn.' : 'Chủ đề này hiện tại chưa có câu hỏi nào. Hãy thêm câu hỏi mới nhé.'}
        />
      ) : (
        <div className="space-y-4">
          {filteredQuizzes.map(quiz => (
            <div key={quiz.id} className="bg-card rounded-3xl shadow-sm hover:shadow-md transition-all p-6 md:p-8 border border-border/70 flex flex-col md:flex-row gap-8">
              {/* Question Context */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h3 className="text-xl font-bold text-heading">{quiz.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getDifficultyColor(quiz.difficultyLevel || 1)}`}>
                    {getDifficultyLabel(quiz.difficultyLevel || 1)}
                  </span>
                  {quiz.status && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      quiz.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                      quiz.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {quiz.status}
                    </span>
                  )}
                </div>
                
                {quiz.description && <p className="text-caption text-sm mb-4">{quiz.description}</p>}

                <div className="bg-primary-light/35 rounded-2xl p-5 mb-6 border border-primary/15">
                  <p className="text-sm font-bold text-primary-dark mb-2 uppercase tracking-wide">Câu hỏi</p>
                  <p className="text-heading font-medium text-lg">&quot;{quiz.questionText}&quot;</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(quiz)}
                    className="flex-[2] flex justify-center items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-xl transition-colors font-medium text-sm border border-transparent hover:border-blue-100"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Chỉnh sửa</span>
                  </button>

                  {quiz.status === 'DRAFT' && (
                    <button
                      onClick={() => handlePublish(quiz.id)}
                      className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 bg-green-50/50 hover:bg-green-100/80 text-green-700 rounded-xl transition-colors text-sm"
                      title="Xuất bản"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Phê duyệt</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(quiz.id)}
                    className="flex items-center justify-center px-4 py-2 bg-gray-50/80 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Options Sidebar */}
              <div className="md:w-[320px] shrink-0 bg-background/70 rounded-2xl p-5 border border-border/70">
                <h4 className="text-sm font-bold text-body mb-4 tracking-wide">CÁC LỰA CHỌN</h4>
                <div className="space-y-3">
                  {(quiz.options || []).map((option, idx: number) => {
                    const optionText = typeof option === 'string' ? option : option.text;
                    const isCorrect = typeof option === 'string' ? option === quiz.correctAnswer : option.isCorrect;
                    
                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                          isCorrect
                            ? 'bg-green-50 border-green-200 text-green-800 shadow-sm'
                            : 'bg-white border-gray-200 text-gray-600'
                        }`}
                      >
                        <span className={`flex shrink-0 w-6 h-6 items-center justify-center rounded-full text-xs font-bold ${
                          isCorrect ? 'bg-green-200 text-green-800' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className={`font-medium text-sm mt-0.5 ${isCorrect ? 'font-bold' : ''}`}>
                          {optionText}
                        </span>
                        {isCorrect && (
                          <CheckCircle className="w-5 h-5 text-green-500 ml-auto shrink-0" />
                        )}
                      </div>
                    );
                  })}
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
        title={editingQuiz ? 'Chỉnh sửa Câu hỏi' : 'Thêm Câu hỏi Trắc nghiệm'}
        maxWidth="2xl"
      >
        <QuizForm 
          initialData={editingQuiz}
          onSubmit={handleSubmit}
          onCancel={() => setShowCreateModal(false)}
          isLoading={isSubmitting}
        />
      </AdminModal>
    </div>
  );
}
