import { apiClient } from '@/shared/services/api.client';
import axios from 'axios';

// ==================== MEDIA UPLOAD API ====================
// File upload and media management

export interface MediaFile {
  id: string;
  mediaType: 'IMAGE' | 'AUDIO' | 'VIDEO';
  context: 'VOCABULARY' | 'TOPIC' | 'QUIZ' | 'PROFILE' | 'GENERAL';
  originalFilename: string;
  mimeType: string;
  fileSize: number; // bytes
  rawUrl: string | null;
  optimizedUrl: string | null;
  thumbnailUrl: string | null;
  uploadedBy: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  uploadedAt: string;
  processedAt?: string | null;
  description?: string | null;
  altText?: string | null;
  errorMessage?: string | null;
}

export interface UploadResponse {
  fileId: string;
  url: string | null;
  filename: string;
  status: string;
  message: string;
}

type MediaType = 'IMAGE' | 'AUDIO' | 'VIDEO';
type MediaContext = 'VOCABULARY' | 'TOPIC' | 'QUIZ' | 'PROFILE' | 'GENERAL';

const normalizeMediaFile = (raw: MediaFile): MediaFile => raw;

/**
 * Upload media file
 * POST /api/media/upload
 * @Roles ADMIN
 * @body FormData with file + media metadata
 */
export const uploadMediaFile = async (
  file: File,
  options: {
    mediaType: MediaType;
    context: MediaContext;
    description?: string;
    altText?: string;
  }
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mediaType', options.mediaType);
  formData.append('context', options.context);
  if (options.description) formData.append('description', options.description);
  if (options.altText) formData.append('altText', options.altText);

  let response;
  try {
    response = await apiClient.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const backendMessage =
        (error.response?.data as { message?: string })?.message ||
        (error.response?.data as { error?: string })?.error;

      if (backendMessage) {
        throw new Error(status ? `[${status}] ${backendMessage}` : backendMessage);
      }

      throw new Error(status ? `Upload failed with status ${status}` : 'Không thể tải file lên');
    }

    throw error;
  }

  const data = response.data.data as MediaFile;
  return {
    fileId: data.id,
    url: data.optimizedUrl,
    filename: data.originalFilename,
    status: data.status,
    message: 'Media uploaded successfully',
  };
};

/**
 * Get media file details
 * GET /api/media/:id
 * @Roles ADMIN
 */
export const getMediaFile = async (id: string): Promise<MediaFile> => {
  const response = await apiClient.get(`/media/${id}`);
  return normalizeMediaFile(response.data.data as MediaFile);
};

/**
 * Get media upload status
 * GET /api/media/:id/status
 * @Roles ADMIN
 */
export const getMediaStatus = async (id: string): Promise<{
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress?: number;
  error?: string;
}> => {
  const response = await apiClient.get(`/media/${id}/status`);
  const data = response.data.data as {
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    progress?: number;
    errorMessage?: string | null;
  };
  return {
    status: data.status,
    progress: data.progress,
    error: data.errorMessage ?? undefined,
  };
};

/**
 * List all media files
 * GET /api/media?page=1&limit=20
 * @Roles ADMIN
 */
export const listMediaFiles = async (params?: {
  page?: number;
  limit?: number;
  mediaType?: MediaType;
  context?: MediaContext;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}): Promise<{ items: MediaFile[]; total: number }> => {
  const queryParams = new URLSearchParams();
  if (params?.page !== undefined) queryParams.set('page', String(params.page));
  if (params?.limit !== undefined) queryParams.set('limit', String(params.limit));
  if (params?.mediaType !== undefined) queryParams.set('mediaType', params.mediaType);
  if (params?.context !== undefined) queryParams.set('context', params.context);
  if (params?.status !== undefined) queryParams.set('status', params.status);
  const query = queryParams.toString();
  const response = await apiClient.get(`/media?${query}`);
  const data = response.data.data as { items: MediaFile[]; total: number };
  return {
    items: Array.isArray(data.items) ? data.items.map(normalizeMediaFile) : [],
    total: data.total ?? 0,
  };
};

/**
 * Delete media file
 * DELETE /api/media/:id
 * @Roles ADMIN
 */
export const deleteMediaFile = async (id: string): Promise<{ message: string }> => {
  await apiClient.delete(`/media/${id}`);
  return { message: 'Media deleted successfully' };
};

/**
 * Retry failed upload
 * POST /api/media/:id/retry
 * @Roles ADMIN
 */
export const retryMediaUpload = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.post(`/media/${id}/retry`);
  return response.data.data;
};

/**
 * Get pending media stats
 * GET /api/media/stats/pending
 * @Roles ADMIN
 */
export const getPendingMediaStats = async (): Promise<{
  pending: number;
}> => {
  const response = await apiClient.get('/media/stats/pending');
  const data = response.data.data as { pendingCount?: number };
  return {
    pending: data.pendingCount ?? 0,
  };
};
