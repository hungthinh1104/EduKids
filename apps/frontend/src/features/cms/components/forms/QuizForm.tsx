import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CMSQuiz } from '@/features/cms/api/cms.api';
import { useEffect } from 'react';

const quizSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  description: z.string().optional(),
  questionText: z.string().min(1, 'Câu hỏi không được để trống'),
  options: z.array(
    z.object({
      value: z.string().min(1, 'Lựa chọn không được để trống')
    })
  ).length(4, 'Phải có đúng 4 lựa chọn'),
  correctAnswerIndex: z.number().min(0).max(3),
  difficultyLevel: z.number().min(1).max(5),
});

export type QuizFormData = z.infer<typeof quizSchema>;

interface QuizFormProps {
  initialData?: CMSQuiz | null;
  onSubmit: (data: {
    title: string;
    description: string;
    questionText: string;
    correctAnswer: string;
    options: string[];
    difficultyLevel: 1 | 2 | 3 | 4 | 5;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function QuizForm({ initialData, onSubmit, onCancel, isLoading }: QuizFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset
  } = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: '',
      description: '',
      questionText: '',
      options: [{ value: '' }, { value: '' }, { value: '' }, { value: '' }],
      correctAnswerIndex: 0,
      difficultyLevel: 1,
    }
  });

  const { fields } = useFieldArray({
    control,
    name: "options",
  });

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
        correctAnswerIndex: correctIdx,
        difficultyLevel: difficulty,
      });
    } else {
      reset({
        title: '',
        description: '',
        questionText: '',
        options: [{ value: '' }, { value: '' }, { value: '' }, { value: '' }],
        correctAnswerIndex: 0,
        difficultyLevel: 1,
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: QuizFormData) => {
    const stringOptions = data.options.map(opt => opt.value);
    const correctString = stringOptions[data.correctAnswerIndex];
    
    onSubmit({
      title: data.title,
      description: data.description || '',
      questionText: data.questionText,
      options: stringOptions,
      correctAnswer: correctString,
      difficultyLevel: data.difficultyLevel as 1 | 2 | 3 | 4 | 5,
    });
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
          <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả thêm</label>
          <textarea
            {...register('description')}
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="Mô tả cho bài kiểm tra (tùy chọn)"
          />
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
                    {...register('correctAnswerIndex', { valueAsNumber: true })}
                    value={index}
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
