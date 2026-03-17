import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CMSQuiz, CMSVocabulary } from '@/features/cms/api/cms.api';
import { useEffect } from 'react';
import { toast } from 'sonner';

const trimmedText = (min: number, minMessage: string, max: number, maxMessage: string) =>
  z.string().trim().min(min, minMessage).max(max, maxMessage);

const quizSchema = z
  .object({
    title: trimmedText(3, 'Tiêu đề phải có ít nhất 3 ký tự', 100, 'Tiêu đề tối đa 100 ký tự'),
    description: trimmedText(5, 'Mô tả phải có ít nhất 5 ký tự', 500, 'Mô tả tối đa 500 ký tự'),
    questionText: trimmedText(5, 'Câu hỏi phải có ít nhất 5 ký tự', 500, 'Câu hỏi tối đa 500 ký tự'),
    options: z.array(
      z.object({
        value: z.string().trim().min(1, 'Lựa chọn không được để trống')
      })
    ).length(4, 'Phải có đúng 4 lựa chọn'),
    correctAnswerIndex: z
      .string()
      .refine((value) => ['0', '1', '2', '3'].includes(value), 'Vui lòng chọn 1 đáp án đúng'),
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
    options: string[];
    correctAnswerIndex: 0 | 1 | 2 | 3;
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
      options: [{ value: '' }, { value: '' }, { value: '' }, { value: '' }],
      correctAnswerIndex: '0',
      difficultyLevel: 1,
    }
  });

  const { fields } = useFieldArray({
    control,
    name: "options",
  });
  const correctAnswerIndex = watch('correctAnswerIndex');
  const optionValues = watch('options');

  useEffect(() => {
    if (initialData) {
      // Parse options from initialData which might be string[] or object[]
      const parsedOptions = Array.isArray(initialData.options)
        ? initialData.options
            .map((opt) => (typeof opt === 'string' ? opt : opt.text))
            .filter(Boolean)
        : ['', '', '', ''];
      
      // Pad to 4 if less than 4
      while (parsedOptions.length < 4) parsedOptions.push('');
      // Cap at 4
      const finalOptions = parsedOptions.slice(0, 4);

      // Find correct answer index
      const exactAnswer = initialData.correctAnswer || '';
      let correctIdx = finalOptions.findIndex((opt: string) => opt === exactAnswer);
      if (correctIdx === -1 && Array.isArray(initialData.options)) {
        correctIdx = initialData.options.findIndex(
          (opt) => typeof opt === 'object' && opt !== null && Boolean(opt.isCorrect),
        );
      }
      if (correctIdx === -1) correctIdx = 0;

      const difficulty =
        initialData.difficultyLevel && initialData.difficultyLevel >= 1 && initialData.difficultyLevel <= 5
          ? (initialData.difficultyLevel as 1 | 2 | 3 | 4 | 5)
          : 1;

      reset({
        title: initialData.title,
        description: initialData.description || '',
        questionText: initialData.questionText,
        options: finalOptions.map((v: string) => ({ value: v })),
        correctAnswerIndex: String(correctIdx) as '0' | '1' | '2' | '3',
        difficultyLevel: difficulty,
      });
    } else {
      reset({
        title: '',
        description: '',
        questionText: '',
        options: [{ value: '' }, { value: '' }, { value: '' }, { value: '' }],
        correctAnswerIndex: '0',
        difficultyLevel: 1,
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: QuizFormData) => {
    const stringOptions = data.options.map((opt) => opt.value.trim());
    const correctIndex = Number.parseInt(data.correctAnswerIndex, 10);
    const safeCorrectIndex = Number.isInteger(correctIndex) && correctIndex >= 0 && correctIndex <= 3 ? correctIndex : 0;
    
    onSubmit({
      title: data.title.trim(),
      description: data.description.trim(),
      questionText: data.questionText.trim(),
      options: stringOptions,
      correctAnswerIndex: safeCorrectIndex as 0 | 1 | 2 | 3,
      difficultyLevel: data.difficultyLevel as 1 | 2 | 3 | 4 | 5,
    });
  };

  const insertVocabularyIntoNextSlot = (word: string) => {
    const nextEmptyIndex = optionValues.findIndex((option) => option.value.trim().length === 0);
    if (nextEmptyIndex < 0) {
      toast.warning('4 đáp án đã đầy. Hãy xóa hoặc chỉnh một đáp án trước khi thêm từ mới.');
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

    if (vocabulary.definition?.trim() && !questionTextValue) {
      setValue(
        'questionText',
        `Từ tiếng Anh nào có nghĩa là "${vocabulary.definition.trim()}"?`,
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
          <label className="block text-sm font-bold text-gray-700 mb-2">Tiêu đề *</label>
          <input
            {...register('title')}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Bài tập về thú cưng..."
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả *</label>
          <textarea
            {...register('description')}
            rows={2}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Mô tả ngắn cho bài kiểm tra"
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
        </div>

        {/* Question */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Câu hỏi *</label>
          <textarea
            {...register('questionText')}
            rows={3}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.questionText ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Con chó trong tiếng Anh là gì?"
          />
          {errors.questionText && <p className="text-red-500 text-sm mt-1">{errors.questionText.message}</p>}
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Độ khó (1-5)</label>
          <input
            type="number"
            {...register('difficultyLevel', { valueAsNumber: true })}
            min={1} max={5}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.difficultyLevel ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
          />
        </div>

        {/* Options */}
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <label className="block text-sm font-bold text-gray-700 mb-4">Các lựa chọn (chọn đáp án đúng)</label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field, index) => (
              <div key={field.id} className="relative">
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200">
                  <input
                    type="radio"
                    {...register('correctAnswerIndex')}
                    value={String(index)}
                    className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                  />
                  <input
                    {...register(`options.${index}.value` as const)}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.options?.[index]?.value ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder={`Lựa chọn ${String.fromCharCode(65 + index)}`}
                  />
                </div>
                {errors.options?.[index]?.value && (
                  <p className="text-red-500 text-xs mt-1 ml-9">{errors.options[index]?.value?.message}</p>
                )}
              </div>
            ))}
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
              <span className="px-3 py-1 rounded-full bg-white text-primary text-xs font-bold border border-primary/10">
                {topicVocabularies.length} từ
              </span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {topicVocabularies.map((vocabulary) => (
                <div
                  key={vocabulary.id}
                  className="bg-white rounded-2xl border border-primary/10 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-heading">{vocabulary.word}</div>
                    <div className="text-sm text-caption">
                      {vocabulary.definition || 'Chưa có nghĩa tiếng Việt'}
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
      <div className="flex gap-4 pt-6 mt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all disabled:opacity-50"
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
