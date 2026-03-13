import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CMSVocabulary } from '@/features/cms/api/cms.api';
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

const vocabularySchema = z.object({
  word: z.string().min(1, 'Từ vựng không được để trống').max(100),
  definition: z.string().min(1, 'Định nghĩa không được để trống'),
  phonetic: z.string().optional(),
  example: z.string().optional(),
  imageUrl: z.string().refine(isSupportedAssetUrl, 'URL hình ảnh không hợp lệ').optional().or(z.literal('')),
  audioUrl: z.string().refine(isSupportedAssetUrl, 'URL âm thanh không hợp lệ').optional().or(z.literal('')),
});

export type VocabularyFormData = z.infer<typeof vocabularySchema>;

interface VocabularyFormProps {
  initialData?: CMSVocabulary | null;
  onSubmit: (data: VocabularyFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function VocabularyForm({ initialData, onSubmit, onCancel, isLoading }: VocabularyFormProps) {
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
      definition: '',
      phonetic: '',
      example: '',
      imageUrl: '',
      audioUrl: '',
    }
  });

  const imageUrlValue = useWatch({ control, name: 'imageUrl' });
  const audioUrlValue = useWatch({ control, name: 'audioUrl' });

  useEffect(() => {
    if (initialData) {
      reset({
        word: initialData.word,
        definition: initialData.definition,
        phonetic: initialData.phonetic || '',
        example: initialData.example || '',
        imageUrl: initialData.imageUrl || '',
        audioUrl: initialData.audioUrl || '',
      });
    } else {
      reset({
        word: '',
        definition: '',
        phonetic: '',
        example: '',
        imageUrl: '',
        audioUrl: '',
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Word */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Từ vựng *</label>
          <input
            {...register('word')}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.word ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="dog"
          />
          {errors.word && <p className="text-red-500 text-sm mt-1">{errors.word.message}</p>}
        </div>

        {/* Definition */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Nghĩa / Định nghĩa *</label>
          <textarea
            {...register('definition')}
            rows={3}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.definition ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="A domestic animal..."
          />
          {errors.definition && <p className="text-red-500 text-sm mt-1">{errors.definition.message}</p>}
        </div>

        {/* Phonetic */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Phiên âm</label>
          <input
            {...register('phonetic')}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="/dɔːg/"
          />
        </div>

        {/* Example */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Ví dụ câu</label>
          <textarea
            {...register('example')}
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="The dog is playing in the yard."
          />
        </div>

        {/* Image URL & Audio URL in 2 cols */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">URL Ảnh</label>
            <input
              {...register('imageUrl')}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.imageUrl ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="https://..."
            />
            {errors.imageUrl && <p className="text-red-500 text-sm mt-1">{errors.imageUrl.message}</p>}
            <MediaUploadField
              mediaType="IMAGE"
              context="VOCABULARY"
              accept="image/*"
              buttonLabel="Tải ảnh lên"
              currentValue={imageUrlValue}
              disabled={isLoading}
              onUploaded={(url) => setValue('imageUrl', url, { shouldDirty: true, shouldValidate: true })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">URL Âm thanh (Audio)</label>
            <input
              {...register('audioUrl')}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.audioUrl ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="https://..."
            />
            {errors.audioUrl && <p className="text-red-500 text-sm mt-1">{errors.audioUrl.message}</p>}
            <MediaUploadField
              mediaType="AUDIO"
              context="VOCABULARY"
              accept="audio/*"
              buttonLabel="Tải audio lên"
              currentValue={audioUrlValue}
              disabled={isLoading}
              onUploaded={(url) => setValue('audioUrl', url, { shouldDirty: true, shouldValidate: true })}
            />
          </div>
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
            initialData ? 'Cập nhật Từ vựng' : 'Lưu Từ vựng mới'
          )}
        </button>
      </div>
    </form>
  );
}
