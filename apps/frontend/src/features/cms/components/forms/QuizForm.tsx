import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CMSQuiz, CMSVocabulary } from '@/features/cms/api/cms.api';
import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { MediaUploadField } from './MediaUploadField';
import { deleteMediaFile } from '@/features/media/api/media.api';

const isSupportedAssetUrl = (value: string) => {
  if (!value) return true;

  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};

const trimmedText = (min: number, minMessage: string, max: number, maxMessage: string) =>
  z.string().trim().min(min, minMessage).max(max, maxMessage);

const quizSchema = z
  .object({
    title: trimmedText(3, 'Tiêu đề phải có ít nhất 3 ký tự', 100, 'Tiêu đề tối đa 100 ký tự'),
    description: trimmedText(5, 'Mô tả phải có ít nhất 5 ký tự', 500, 'Mô tả tối đa 500 ký tự'),
    questionText: trimmedText(5, 'Câu hỏi phải có ít nhất 5 ký tự', 500, 'Câu hỏi tối đa 500 ký tự'),
    questionImageUrl: z.string().refine(isSupportedAssetUrl, 'URL hình ảnh không hợp lệ').optional().or(z.literal('')),
    options: z.array(
      z.object({
        value: z.string().trim().min(1, 'Lựa chọn không được để trống')
      })
    ).min(2, 'Phải có ít nhất 2 lựa chọn').max(6, 'Tối đa 6 lựa chọn'),
    correctAnswerIndex: z
      .string()
      .refine((value) => ['0', '1', '2', '3', '4', '5'].includes(value), 'Vui lòng chọn 1 đáp án đúng'),
    difficultyLevel: z.number().min(1).max(5),
  })
  .superRefine((data, ctx) => {
    const normalizedOptions = data.options.map((option) => option.value.trim().toLowerCase());
    const seen = new Map<string, number>();

    normalizedOptions.forEach((option, index) => {
      if (!option) return;
      const firstIndex = seen.get(option);
      if (firstIndex !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options', index, 'value'],
          message: 'Các lựa chọn không được trùng nhau',
        });
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options', firstIndex, 'value'],
          message: 'Các lựa chọn không được trùng nhau',
        });
        return;
      }
      seen.set(option, index);
    });

    const selectedIndex = Number.parseInt(data.correctAnswerIndex, 10);
    if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= data.options.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['correctAnswerIndex'],
        message: 'Đáp án đúng phải nằm trong các lựa chọn hiện có',
      });
    }
  });

export type QuizFormData = z.infer<typeof quizSchema>;

interface QuizFormProps {
  initialData?: CMSQuiz | null;
  topicName?: string;
  topicVocabularies?: CMSVocabulary[];
  onSubmit: (data: {
    title: string;
    description: string;
    questionText: string;
    questionImageUrl?: string;
    options: string[];
    correctAnswerIndex: number;
    difficultyLevel: 1 | 2 | 3 | 4 | 5;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function QuizForm({
  initialData,
  topicName,
  topicVocabularies = [],
  onSubmit,
  onCancel,
  isLoading,
}: QuizFormProps) {
  const uploadedMediaIdsRef = useRef<string[]>([]);
  const fieldMediaIdRef = useRef<{ questionImageUrl?: string }>({});
  const didSaveRef = useRef(false);

  const cleanupUnsavedUploads = useCallback(async () => {
    const ids = [...new Set(uploadedMediaIdsRef.current)];
    if (ids.length === 0) return;

    await Promise.allSettled(ids.map((id) => deleteMediaFile(id)));
    uploadedMediaIdsRef.current = [];
  }, []);

  const trackUploadedMedia = useCallback((field: 'questionImageUrl', fileId: string) => {
    const previousId = fieldMediaIdRef.current[field];
    fieldMediaIdRef.current[field] = fileId;

    if (!uploadedMediaIdsRef.current.includes(fileId)) {
      uploadedMediaIdsRef.current.push(fileId);
    }

    if (previousId && previousId !== fileId) {
      void deleteMediaFile(previousId).finally(() => {
        uploadedMediaIdsRef.current = uploadedMediaIdsRef.current.filter((id) => id !== previousId);
      });
    }
  }, []);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: '',
      description: '',
      questionText: '',
      questionImageUrl: '',
      options: [{ value: '' }, { value: '' }, { value: '' }, { value: '' }],
      correctAnswerIndex: '0',
      difficultyLevel: 1,
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });
  const correctAnswerIndex = watch('correctAnswerIndex');
  const optionValues = watch('options');
  const questionImageUrlValue = watch('questionImageUrl');

  useEffect(() => {
    didSaveRef.current = false;
    uploadedMediaIdsRef.current = [];
    fieldMediaIdRef.current = {};

    if (initialData) {
      // Parse options from initialData which might be string[] or object[]
      const parsedOptions = Array.isArray(initialData.options)
        ? initialData.options
            .map((opt) => (typeof opt === 'string' ? opt : opt.text))
            .filter(Boolean)
        : ['', '', '', ''];

      // Keep between 2 and 6 options to match backend validation
      while (parsedOptions.length < 2) parsedOptions.push('');
      const finalOptions = parsedOptions.slice(0, 6);

      // Find correct answer index
      const exactAnswer = initialData.correctAnswer || '';
      let correctIdx = finalOptions.findIndex((opt: string) => opt === exactAnswer);
      if (correctIdx === -1 && Array.isArray(initialData.options)) {
        correctIdx = initialData.options.findIndex(
          (opt) => typeof opt === 'object' && opt !== null && Boolean(opt.isCorrect),
        );
      }
      if (correctIdx === -1) correctIdx = 0;
      if (finalOptions.length > 0) {
        correctIdx = Math.min(Math.max(correctIdx, 0), finalOptions.length - 1);
      }

      const difficulty =
        initialData.difficultyLevel && initialData.difficultyLevel >= 1 && initialData.difficultyLevel <= 5
          ? (initialData.difficultyLevel as 1 | 2 | 3 | 4 | 5)
          : 1;

      reset({
        title: initialData.title,
        description: initialData.description || '',
        questionText: initialData.questionText,
        questionImageUrl: initialData.questionImageUrl || '',
        options: finalOptions.map((v: string) => ({ value: v })),
        correctAnswerIndex: String(correctIdx),
        difficultyLevel: difficulty,
      });
    } else {
        reset({
          title: '',
          description: '',
          questionText: '',
          questionImageUrl: '',
          options: [{ value: '' }, { value: '' }, { value: '' }, { value: '' }],
          correctAnswerIndex: '0',
          difficultyLevel: 1,
        });
    }
  }, [initialData, reset]);

  useEffect(() => {
    return () => {
      if (!didSaveRef.current && uploadedMediaIdsRef.current.length > 0) {
        void cleanupUnsavedUploads();
      }
    };
  }, [cleanupUnsavedUploads]);

  const handleFormSubmit = (data: QuizFormData) => {
    const stringOptions = data.options.map((opt) => opt.value.trim());
    const correctIndex = Number.parseInt(data.correctAnswerIndex, 10);
    const safeCorrectIndex =
      Number.isInteger(correctIndex) && correctIndex >= 0 && correctIndex < stringOptions.length
        ? correctIndex
        : 0;
    
    onSubmit({
      title: data.title.trim(),
      description: data.description.trim(),
      questionText: data.questionText.trim(),
      questionImageUrl: data.questionImageUrl?.trim() || undefined,
      options: stringOptions,
      correctAnswerIndex: safeCorrectIndex,
      difficultyLevel: data.difficultyLevel as 1 | 2 | 3 | 4 | 5,
    });

    didSaveRef.current = true;

    const keepIds = new Set<string>();
    if (data.questionImageUrl && fieldMediaIdRef.current.questionImageUrl) {
      keepIds.add(fieldMediaIdRef.current.questionImageUrl);
    }

    const orphanIds = uploadedMediaIdsRef.current.filter((id) => !keepIds.has(id));
    if (orphanIds.length > 0) {
      void Promise.allSettled(orphanIds.map((id) => deleteMediaFile(id)));
    }

    uploadedMediaIdsRef.current = [];
    fieldMediaIdRef.current = {};
  };

  const handleCancel = async () => {
    await cleanupUnsavedUploads();
    onCancel();
  };

  const addOption = () => {
    if (fields.length >= 6) {
      toast.warning('Quiz chỉ hỗ trợ tối đa 6 lựa chọn.');
      return;
    }
    append({ value: '' });
  };

  const removeOption = (index: number) => {
    if (fields.length <= 2) {
      toast.warning('Quiz cần ít nhất 2 lựa chọn.');
      return;
    }

    const currentCorrectIndex = Number.parseInt(correctAnswerIndex, 10);
    remove(index);

    if (Number.isInteger(currentCorrectIndex)) {
      let nextCorrectIndex = currentCorrectIndex;

      if (index === currentCorrectIndex) {
        nextCorrectIndex = Math.max(0, index === 0 ? 0 : index - 1);
      } else if (index < currentCorrectIndex) {
        nextCorrectIndex = currentCorrectIndex - 1;
      }

      setValue('correctAnswerIndex', String(nextCorrectIndex), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const insertVocabularyIntoNextSlot = (word: string) => {
    const nextEmptyIndex = optionValues.findIndex((option) => option.value.trim().length === 0);
    if (nextEmptyIndex < 0) {
      toast.warning('Đáp án đã đầy. Hãy xóa hoặc chỉnh một đáp án trước khi thêm từ mới.');
      return;
    }
    const targetIndex = nextEmptyIndex;
    setValue(`options.${targetIndex}.value`, word, { shouldValidate: true, shouldDirty: true });
  };

  const applyVocabularyAsCorrectAnswer = (vocabulary: CMSVocabulary) => {
    const currentCorrectIndex = Number.parseInt(correctAnswerIndex, 10);
    const safeIndex = Number.isInteger(currentCorrectIndex) && currentCorrectIndex >= 0 && currentCorrectIndex < optionValues.length
      ? currentCorrectIndex
      : 0;

    setValue(`options.${safeIndex}.value`, vocabulary.word, { shouldValidate: true, shouldDirty: true });
    const titleValue = (watch('title') || '').trim();
    const questionTextValue = (watch('questionText') || '').trim();
    const descriptionValue = (watch('description') || '').trim();

    if (!titleValue) {
      setValue('title', `${topicName || 'Quiz'} - ${vocabulary.word}`, { shouldValidate: true, shouldDirty: true });
    }

    if (vocabulary.translation?.trim() && !questionTextValue) {
      setValue(
        'questionText',
        `Từ tiếng Anh nào có nghĩa là "${vocabulary.translation.trim()}"?`,
        { shouldValidate: true, shouldDirty: true },
      );
    }

    if (!descriptionValue) {
      setValue(
        'description',
        `Chọn đúng từ vựng thuộc chủ đề ${topicName || 'đã chọn'}.`,
        { shouldValidate: true, shouldDirty: true },
      );
    }

    if (titleValue || questionTextValue || descriptionValue) {
      toast.success('Đã điền đáp án đúng. Nội dung bạn đã nhập sẵn được giữ nguyên.');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-heading mb-2">Tiêu đề *</label>
          <input
            {...register('title')}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.title ? 'border-red-500 bg-red-50' : 'border-border'
            }`}
            placeholder="Bài tập về thú cưng..."
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-heading mb-2">Mô tả *</label>
          <textarea
            {...register('description')}
            rows={2}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.description ? 'border-red-500 bg-red-50' : 'border-border'
            }`}
            placeholder="Mô tả ngắn cho bài kiểm tra"
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
        </div>

        {/* Question */}
        <div>
          <label className="block text-sm font-bold text-heading mb-2">Câu hỏi *</label>
          <textarea
            {...register('questionText')}
            rows={3}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.questionText ? 'border-red-500 bg-red-50' : 'border-border'
            }`}
            placeholder="Con chó trong tiếng Anh là gì?"
          />
          {errors.questionText && <p className="text-red-500 text-sm mt-1">{errors.questionText.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-heading mb-2">Ảnh câu hỏi (tuỳ chọn)</label>
          <input
            type="text"
            {...register('questionImageUrl')}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.questionImageUrl ? 'border-red-500 bg-red-50' : 'border-border'
            }`}
            placeholder="https://..."
          />
          {errors.questionImageUrl && <p className="text-red-500 text-sm mt-1">{errors.questionImageUrl.message}</p>}
          <MediaUploadField
            mediaType="IMAGE"
            context="QUIZ"
            accept="image/*"
            buttonLabel="Tải ảnh câu hỏi"
            currentValue={questionImageUrlValue}
            disabled={isLoading}
            onUploaded={(url, fileId) => {
              if (fileId) trackUploadedMedia('questionImageUrl', fileId);
              setValue('questionImageUrl', url, { shouldDirty: true, shouldValidate: true });
            }}
          />
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-bold text-heading mb-2">Độ khó (1-5)</label>
          <input
            type="number"
            {...register('difficultyLevel', { valueAsNumber: true })}
            min={1} max={5}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.difficultyLevel ? 'border-red-500 bg-red-50' : 'border-border'
            }`}
          />
        </div>

        {/* Options */}
        <div className="bg-background p-6 rounded-2xl border border-border">
          <label className="block text-sm font-bold text-heading mb-4">Các lựa chọn (chọn đáp án đúng)</label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field, index) => (
              <div key={field.id} className="relative">
                <div className="flex items-center gap-3 bg-card p-3 rounded-xl border border-border">
                  <input
                    type="radio"
                    {...register('correctAnswerIndex')}
                    value={String(index)}
                    className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                  />
                  <input
                    {...register(`options.${index}.value` as const)}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.options?.[index]?.value ? 'border-red-500 bg-red-50' : 'border-border'
                    }`}
                    placeholder={`Lựa chọn ${String.fromCharCode(65 + index)}`}
                  />
                  {fields.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="px-2 py-1 rounded-lg text-xs font-semibold text-error hover:bg-error/10"
                    >
                      Xóa
                    </button>
                  )}
                </div>
                {errors.options?.[index]?.value && (
                  <p className="text-red-500 text-xs mt-1 ml-9">{errors.options[index]?.value?.message}</p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-caption">
              Tối thiểu 2 lựa chọn, tối đa 6 lựa chọn. Backend sẽ giữ đúng structure này.
            </p>
            <button
              type="button"
              onClick={addOption}
              disabled={fields.length >= 6}
              className="px-3 py-2 rounded-xl border border-border bg-background text-sm font-semibold hover:border-primary/40 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Thêm lựa chọn
            </button>
          </div>
          {errors.correctAnswerIndex && (
            <p className="text-red-500 text-sm mt-3 font-medium text-center">Vui lòng chọn 1 đáp án đúng</p>
          )}
        </div>

        {topicVocabularies.length > 0 && (
          <div className="bg-primary-light/20 p-6 rounded-2xl border border-primary/15">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <label className="block text-sm font-bold text-heading">Pick nhanh từ trong chủ đề</label>
                <p className="text-sm text-caption">
                  Bấm vào từ để thêm nhanh vào đáp án, hoặc dùng làm đáp án đúng hiện tại.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-card text-primary text-xs font-bold border border-primary/10">
                {topicVocabularies.length} từ
              </span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {topicVocabularies.map((vocabulary) => (
                <div
                  key={vocabulary.id}
                  className="bg-card rounded-2xl border border-primary/10 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-heading">{vocabulary.word}</div>
                    <div className="text-sm text-caption">
                      {vocabulary.translation || 'Chưa có nghĩa tiếng Việt'}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => insertVocabularyIntoNextSlot(vocabulary.word)}
                      className="px-3 py-2 rounded-xl border border-border bg-background text-body text-sm font-semibold hover:border-primary/40 hover:text-primary transition-colors"
                    >
                      Thêm vào đáp án
                    </button>
                    <button
                      type="button"
                      onClick={() => applyVocabularyAsCorrectAnswer(vocabulary)}
                      className="px-3 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
                    >
                      Dùng làm đáp án đúng
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-6 mt-6 border-t border-border">
        <button
          type="button"
          onClick={() => void handleCancel()}
          disabled={isLoading}
          className="flex-1 px-6 py-3.5 bg-muted/10 hover:bg-gray-200 text-heading rounded-xl font-bold transition-all disabled:opacity-50"
        >
          Hủy bỏ
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-[2] flex justify-center items-center px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
          ) : (
            initialData ? 'Cập nhật Bài' : 'Lưu Bài Kiểm Tra'
          )}
        </button>
      </div>
    </form>
  );
}
