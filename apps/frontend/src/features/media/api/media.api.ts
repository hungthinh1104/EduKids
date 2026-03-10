import { apiClient } from '@/shared/services/api.client';

// ==================== MEDIA UPLOAD API ====================
// File upload and media management

export interface MediaFile {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number; // bytes
  url: string;
  uploadedBy: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export interface UploadResponse {
  fileId: number;
  url: string;
  filename: string;
  status: string;
  message: string;
}

/**
 * Upload media file
 * POST /api/media/upload
 * @Roles ADMIN
 * @body FormData with file
 */
export const uploadMediaFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/media/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
};

/**
 * Get media file details
 * GET /api/media/:id
 * @Roles ADMIN
 */
export const getMediaFile = async (id: number): Promise<MediaFile> => {
  const response = await apiClient.get(`/media/${id}`);
  return response.data.data;
};

/**
 * Get media upload status
 * GET /api/media/:id/status
 * @Roles ADMIN
 */
export const getMediaStatus = async (id: number): Promise<{
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress?: number;
  error?: string;
}> => {
  const response = await apiClient.get(`/media/${id}/status`);
  return response.data.data;
};

/**
 * List all media files
 * GET /api/media?page=1&limit=20
 * @Roles ADMIN
 */
export const listMediaFiles = async (params?: {
  page?: number;
  limit?: number;
  type?: 'image' | 'audio' | 'video';
}): Promise<{ items: MediaFile[]; total: number }> => {
  const queryParams = new URLSearchParams();
  if (params?.page !== undefined) queryParams.set('page', String(params.page));
  if (params?.limit !== undefined) queryParams.set('limit', String(params.limit));
  if (params?.type !== undefined) queryParams.set('type', params.type);
  const query = queryParams.toString();
  const response = await apiClient.get(`/media?${query}`);
  return response.data.data;
};

/**
 * Delete media file
 * DELETE /api/media/:id
 * @Roles ADMIN
 */
export const deleteMediaFile = async (id: number): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/media/${id}`);
  return response.data.data;
};

/**
 * Retry failed upload
 * POST /api/media/:id/retry
 * @Roles ADMIN
 */
export const retryMediaUpload = async (id: number): Promise<{ message: string }> => {
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
  processing: number;
  failed: number;
}> => {
  const response = await apiClient.get('/media/stats/pending');
  return response.data.data;
};
