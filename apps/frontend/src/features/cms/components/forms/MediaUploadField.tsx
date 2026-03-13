'use client';

import { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { uploadMediaFile } from '@/features/media/api/media.api';

type MediaType = 'IMAGE' | 'AUDIO';
type MediaContext = 'VOCABULARY' | 'TOPIC';

interface MediaUploadFieldProps {
  mediaType: MediaType;
  context: MediaContext;
  accept: string;
  buttonLabel: string;
  disabled?: boolean;
  currentValue?: string;
  onUploaded: (url: string) => void;
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Không thể đọc file đã chọn'));
    };
    reader.onerror = () => reject(new Error('Không thể đọc file đã chọn'));
    reader.readAsDataURL(file);
  });

export function MediaUploadField({
  mediaType,
  context,
  accept,
  buttonLabel,
  disabled,
  currentValue,
  onUploaded,
}: MediaUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleChooseFile = () => {
    if (disabled || isUploading) return;
    inputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    try {
      setIsUploading(true);
      const result = await uploadMediaFile(file, {
        mediaType,
        context,
        description: file.name,
      });

      let finalUrl = result.url;

      if (!finalUrl && (mediaType === 'IMAGE' || mediaType === 'AUDIO')) {
        finalUrl = await readFileAsDataUrl(file);
        toast.warning('Upload media chưa trả URL công khai, tạm dùng dữ liệu nhúng trong form.');
      }

      if (!finalUrl) {
        throw new Error('Upload thành công nhưng chưa nhận được URL sử dụng được');
      }

      onUploaded(finalUrl);
      toast.success('Đã tải file lên và điền link vào form');
    } catch (error) {
      console.error('Failed to upload media from form:', error);
      toast.error(error instanceof Error ? error.message : 'Không thể tải file lên');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleChooseFile}
          disabled={disabled || isUploading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span>{isUploading ? 'Đang tải...' : buttonLabel}</span>
        </button>

        <p className="text-xs text-gray-500 sm:text-right">
          {currentValue
            ? 'Đã có file gắn vào field này.'
            : 'Có thể upload trực tiếp hoặc dán URL thủ công.'}
        </p>
      </div>
    </div>
  );
}