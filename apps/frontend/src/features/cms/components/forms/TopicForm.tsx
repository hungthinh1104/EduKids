import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CMSTopic } from '@/features/cms/api/cms.api';
import { useEffect } from 'react';
import { MediaUploadField } from './MediaUploadField';

const isSupportedAssetUrl = (value: string) => {
  if (!value) return true;

  try {
    const url = new URL(value);
    return ['http:', 'https:', 'data:'].includes(url.protocol);
  } catch {
    return false;
  }
};

// Form validation schema
const topicSchema = z.object({
  name: z.string().min(2, 'Tên chủ đề phải có ít nhất 2 ký tự').max(50, 'Tên chủ đề tối đa 50 ký tự'),
  description: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự').max(500),
  learningLevel: z.number().min(1).max(5),
  imageUrl: z.string().refine(isSupportedAssetUrl, 'URL hình ảnh không hợp lệ').optional().or(z.literal('')),
  tags: z.string() // We handle tags as comma-separated strings in the UI
});

export type TopicFormData = z.infer<typeof topicSchema>;

interface TopicFormProps {
  initialData?: CMSTopic | null;
  onSubmit: (data: TopicFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TopicForm({ initialData, onSubmit, onCancel, isLoading }: TopicFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
    reset
  } = useForm<TopicFormData>({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      name: '',
      description: '',
      learningLevel: 1,
      imageUrl: '',
      tags: '',
    }
  });

  const imageUrlValue = useWatch({ control, name: 'imageUrl' });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        description: initialData.description || '',
        learningLevel: initialData.learningLevel || 1,
        imageUrl: initialData.imageUrl || '',
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : '',
      });
    } else {
      reset({
        name: '',
        description: '',
        learningLevel: 1,
        imageUrl: '',
        tags: '',
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Tên Topic *</label>
          <input
            {...register('name')}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Ví dụ: Animals, Colors..."
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả *</label>
          <textarea
            {...register('description')}
            rows={4}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Mô tả chi tiết về topic..."
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
        </div>

        {/* Learning Level */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Cấp độ (1-5)</label>
          <input
            type="number"
            {...register('learningLevel', { valueAsNumber: true })}
            min={1} max={5}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.learningLevel ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
          />
          {errors.learningLevel && <p className="text-red-500 text-sm mt-1">{errors.learningLevel.message}</p>}
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">URL hình ảnh</label>
          <input
            type="text"
            {...register('imageUrl')}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.imageUrl ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="https://..."
          />
          {errors.imageUrl && <p className="text-red-500 text-sm mt-1">{errors.imageUrl.message}</p>}
          <MediaUploadField
            mediaType="IMAGE"
            context="TOPIC"
            accept="image/*"
            buttonLabel="Tải ảnh lên"
            currentValue={imageUrlValue}
            disabled={isLoading}
            onUploaded={(url) => setValue('imageUrl', url, { shouldDirty: true, shouldValidate: true })}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Tags (phân cách bằng dấu phẩy)</label>
          <input
            type="text"
            {...register('tags')}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="education, vocabulary, beginner"
          />
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
          className="flex-[2] flex justify-center items-center px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg hover:shadow-blue-600/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
          ) : (
            initialData ? 'Cập nhật Chủ đề' : 'Tạo mới Chủ đề'
          )}
        </button>
      </div>
    </form>
  );
}
