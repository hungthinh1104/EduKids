import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CMSVocabulary } from '@/features/cms/api/cms.api';
import { useEffect, useRef, useCallback } from 'react';
import { Caption } from '@/shared/components/Typography';
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

const vocabularySchema = z.object({
  word: z.string().min(1, 'Từ vựng không được để trống').max(100),
  translation: z.string().min(1, 'Định nghĩa không được để trống'),
  phonetic: z.string().optional(),
  exampleSentence: z.string().optional(),
  imageUrl: z.string().refine(isSupportedAssetUrl, 'URL hình ảnh không hợp lệ').optional().or(z.literal('')),
  audioUrl: z.string().refine(isSupportedAssetUrl, 'URL âm thanh không hợp lệ').optional().or(z.literal('')),
});

export type VocabularyFormData = z.infer<typeof vocabularySchema>;

interface VocabularyFormProps {
  initialData?: CMSVocabulary | null;
  onSubmit: (data: VocabularyFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function VocabularyForm({ initialData, onSubmit, onCancel, isLoading }: VocabularyFormProps) {
  const uploadedMediaIdsRef = useRef<string[]>([]);
  const fieldMediaIdRef = useRef<{ imageUrl?: string; audioUrl?: string }>({});
  const didSaveRef = useRef(false);

  const cleanupUnsavedUploads = useCallback(async () => {
    const ids = [...new Set(uploadedMediaIdsRef.current)];
    if (ids.length === 0) return;

    await Promise.allSettled(ids.map((id) => deleteMediaFile(id)));
    uploadedMediaIdsRef.current = [];
  }, []);

  const trackUploadedMedia = useCallback((field: 'imageUrl' | 'audioUrl', fileId: string) => {
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
  } = useForm<VocabularyFormData>({
    resolver: zodResolver(vocabularySchema),
    defaultValues: {
      word: '',
      translation: '',
      phonetic: '',
      exampleSentence: '',
      imageUrl: '',
      audioUrl: '',
    }
  });

  const imageUrlValue = useWatch({ control, name: 'imageUrl' });
  const audioUrlValue = useWatch({ control, name: 'audioUrl' });

  useEffect(() => {
    didSaveRef.current = false;
    uploadedMediaIdsRef.current = [];
    fieldMediaIdRef.current = {};

    if (initialData) {
      reset({
        word: initialData.word,
        translation: initialData.translation,
        phonetic: initialData.phonetic || '',
        exampleSentence: initialData.exampleSentence || '',
        imageUrl: initialData.imageUrl || '',
        audioUrl: initialData.audioUrl || '',
      });
    } else {
      reset({
        word: '',
        translation: '',
        phonetic: '',
        exampleSentence: '',
        imageUrl: '',
        audioUrl: '',
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

  const handleFormSubmit = async (data: VocabularyFormData) => {
    await onSubmit(data);

    const keepIds = new Set<string>();
    if (data.imageUrl && fieldMediaIdRef.current.imageUrl) {
      keepIds.add(fieldMediaIdRef.current.imageUrl);
    }
    if (data.audioUrl && fieldMediaIdRef.current.audioUrl) {
      keepIds.add(fieldMediaIdRef.current.audioUrl);
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
        {/* Word */}
        <div>
          <label className="block text-sm font-bold text-heading mb-2">Từ vựng *</label>
          <input
            {...register('word')}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.word ? 'border-error bg-error-light' : 'border-border'
            }`}
            placeholder="dog"
          />
          {errors.word && <Caption className="text-error text-sm mt-1">{errors.word.message}</Caption>}
        </div>

        {/* Definition */}
        <div>
          <label className="block text-sm font-bold text-heading mb-2">Nghĩa / Định nghĩa *</label>
          <textarea
            {...register('translation')}
            rows={3}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.translation ? 'border-error bg-error-light' : 'border-border'
            }`}
            placeholder="A domestic animal..."
          />
          {errors.translation && <Caption className="text-error text-sm mt-1">{errors.translation.message}</Caption>}
        </div>

        {/* Phonetic */}
        <div>
          <label className="block text-sm font-bold text-heading mb-2">Phiên âm</label>
          <input
            {...register('phonetic')}
            className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="/dɔːg/"
          />
        </div>

        {/* Example */}
        <div>
          <label className="block text-sm font-bold text-heading mb-2">Ví dụ câu</label>
          <textarea
            {...register('exampleSentence')}
            rows={2}
            className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="The dog is playing in the yard."
          />
        </div>

        {/* Image URL & Audio URL in 2 cols */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-heading mb-2">URL Ảnh</label>
            <input
              {...register('imageUrl')}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.imageUrl ? 'border-error bg-error-light' : 'border-border'
              }`}
              placeholder="https://..."
            />
            {errors.imageUrl && <Caption className="text-error text-sm mt-1">{errors.imageUrl.message}</Caption>}
            <MediaUploadField
              mediaType="IMAGE"
              context="VOCABULARY"
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
            <label className="block text-sm font-bold text-heading mb-2">URL Âm thanh (Audio)</label>
            <input
              {...register('audioUrl')}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.audioUrl ? 'border-error bg-error-light' : 'border-border'
              }`}
              placeholder="https://..."
            />
            {errors.audioUrl && <Caption className="text-error text-sm mt-1">{errors.audioUrl.message}</Caption>}
            <MediaUploadField
              mediaType="AUDIO"
              context="VOCABULARY"
              accept="audio/*"
              buttonLabel="Tải audio lên"
              currentValue={audioUrlValue}
              disabled={isLoading}
              onUploaded={(url, fileId) => {
                if (fileId) trackUploadedMedia('audioUrl', fileId);
                setValue('audioUrl', url, { shouldDirty: true, shouldValidate: true });
              }}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 grid grid-cols-1 gap-3 border-t border-border pt-6 sm:grid-cols-2 sm:gap-4">
        <button
          type="button"
          onClick={() => void handleCancel()}
          disabled={isLoading}
          className="h-12 px-6 bg-background hover:bg-background/80 border border-border text-heading rounded-xl font-bold transition-all disabled:opacity-50"
        >
          Hủy bỏ
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex h-12 items-center justify-center px-6 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
          ) : (
            initialData ? 'Cập nhật Từ vựng' : 'Lưu Từ vựng mới'
          )}
        </button>
      </div>
    </form>
  );
}
