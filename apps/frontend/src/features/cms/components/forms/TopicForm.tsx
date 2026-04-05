import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CMSTopic } from '@/features/cms/api/cms.api';
import { useEffect, useRef, useCallback } from 'react';
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

// Form validation schema
const topicSchema = z.object({
  name: z.string().min(2, 'Tên chủ đề phải có ít nhất 2 ký tự').max(50, 'Tên chủ đề tối đa 50 ký tự'),
  description: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự').max(500),
  learningLevel: z.number().min(1).max(5),
  imageUrl: z.string().refine(isSupportedAssetUrl, 'URL hình ảnh không hợp lệ').optional().or(z.literal('')),
  videoUrl: z.string().refine(isSupportedAssetUrl, 'URL video không hợp lệ').optional().or(z.literal('')),
  tags: z.string() // We handle tags as comma-separated strings in the UI
});

export type TopicFormData = z.infer<typeof topicSchema>;

interface TopicFormProps {
  initialData?: CMSTopic | null;
  onSubmit: (data: TopicFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TopicForm({ initialData, onSubmit, onCancel, isLoading }: TopicFormProps) {
  const uploadedMediaIdsRef = useRef<string[]>([]);
  const fieldMediaIdRef = useRef<{ imageUrl?: string; videoUrl?: string }>({});
  const didSaveRef = useRef(false);

  const cleanupUnsavedUploads = useCallback(async () => {
    const ids = [...new Set(uploadedMediaIdsRef.current)];
    if (ids.length === 0) return;

    await Promise.allSettled(ids.map((id) => deleteMediaFile(id)));
    uploadedMediaIdsRef.current = [];
  }, []);

  const trackUploadedMedia = useCallback((field: 'imageUrl' | 'videoUrl', fileId: string) => {
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
      videoUrl: '',
      tags: '',
    }
  });

  const imageUrlValue = useWatch({ control, name: 'imageUrl' });
  const videoUrlValue = useWatch({ control, name: 'videoUrl' });

  useEffect(() => {
    didSaveRef.current = false;
    uploadedMediaIdsRef.current = [];
    fieldMediaIdRef.current = {};

    if (initialData) {
      reset({
        name: initialData.name,
        description: initialData.description || '',
        learningLevel: initialData.learningLevel || 1,
        imageUrl: initialData.imageUrl || '',
        videoUrl: initialData.videoUrl || '',
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : '',
      });
    } else {
      reset({
        name: '',
        description: '',
        learningLevel: 1,
        imageUrl: '',
        videoUrl: '',
        tags: '',
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

  const handleFormSubmit = async (data: TopicFormData) => {
    await onSubmit(data);

    const keepIds = new Set<string>();
    if (data.imageUrl && fieldMediaIdRef.current.imageUrl) {
      keepIds.add(fieldMediaIdRef.current.imageUrl);
    }
    if (data.videoUrl && fieldMediaIdRef.current.videoUrl) {
      keepIds.add(fieldMediaIdRef.current.videoUrl);
    }

    const orphanIds = uploadedMediaIdsRef.current.filter((id) => !keepIds.has(id));
    if (orphanIds.length > 0) {
      await Promise.allSettled(orphanIds.map((id) => deleteMediaFile(id)));
    }

    didSaveRef.current = true;
    uploadedMediaIdsRef.current = [];
    fieldMediaIdRef.current = {};
  };

  const handleCancel = async () => {
    await cleanupUnsavedUploads();
    onCancel();
  };

  return (
    // eslint-disable-next-line react-hooks/refs
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-bold text-heading mb-2">Tên Topic *</label>
          <input
            {...register('name')}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.name ? 'border-red-500 bg-red-50' : 'border-border'
            }`}
            placeholder="Ví dụ: Animals, Colors..."
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-heading mb-2">Mô tả *</label>
          <textarea
            {...register('description')}
            rows={4}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.description ? 'border-red-500 bg-red-50' : 'border-border'
            }`}
            placeholder="Mô tả chi tiết về topic..."
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
        </div>

        {/* Learning Level */}
        <div>
          <label className="block text-sm font-bold text-heading mb-2">Cấp độ (1-5)</label>
          <input
            type="number"
            {...register('learningLevel', { valueAsNumber: true })}
            min={1} max={5}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.learningLevel ? 'border-red-500 bg-red-50' : 'border-border'
            }`}
          />
          {errors.learningLevel && <p className="text-red-500 text-sm mt-1">{errors.learningLevel.message}</p>}
        </div>

        {/* Image/Video URLs */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-bold text-heading mb-2">URL hình ảnh</label>
            <input
              type="text"
              {...register('imageUrl')}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.imageUrl ? 'border-red-500 bg-red-50' : 'border-border'
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
              onUploaded={(url, fileId) => {
                if (fileId) trackUploadedMedia('imageUrl', fileId);
                setValue('imageUrl', url, { shouldDirty: true, shouldValidate: true });
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-heading mb-2">URL video</label>
            <input
              type="text"
              {...register('videoUrl')}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.videoUrl ? 'border-red-500 bg-red-50' : 'border-border'
              }`}
              placeholder="https://..."
            />
            {errors.videoUrl && <p className="text-red-500 text-sm mt-1">{errors.videoUrl.message}</p>}
            <MediaUploadField
              mediaType="VIDEO"
              context="TOPIC"
              accept="video/*"
              buttonLabel="Tải video lên"
              currentValue={videoUrlValue}
              disabled={isLoading}
              onUploaded={(url, fileId) => {
                if (fileId) trackUploadedMedia('videoUrl', fileId);
                setValue('videoUrl', url, { shouldDirty: true, shouldValidate: true });
              }}
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-bold text-heading mb-2">Tags (phân cách bằng dấu phẩy)</label>
          <input
            type="text"
            {...register('tags')}
            className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="education, vocabulary, beginner"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 grid grid-cols-1 gap-3 border-t border-border pt-6 sm:grid-cols-2 sm:gap-4">
        <button
          type="button"
          onClick={() => void handleCancel()}
          disabled={isLoading}
          className="h-12 px-6 bg-muted/10 hover:bg-gray-200 text-heading rounded-xl font-bold transition-all disabled:opacity-50"
        >
          Hủy bỏ
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex h-12 items-center justify-center px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg hover:shadow-blue-600/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
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
