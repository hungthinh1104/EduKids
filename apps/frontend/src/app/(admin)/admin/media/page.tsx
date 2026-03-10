'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Upload, Trash2, Eye, Copy, Calendar, HardDrive } from 'lucide-react';
import { motion } from 'framer-motion';
import { uploadMediaFile, deleteMediaFile, listMediaFiles, type MediaFile } from '@/features/media/api/media.api';

export default function AdminMediaPage() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'audio' | 'video'>('all');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    loadMediaFiles();
  }, []);

  const loadMediaFiles = async () => {
    try {
      setIsLoading(true);
      const data = await listMediaFiles({ page: 1, limit: 50 });
      setMediaFiles(data.items);
    } catch (error) {
      console.error('Failed to load media files:', error);
      setMediaFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      try {
        setIsUploading(true);
        await uploadMediaFile(file);
        loadMediaFiles();
      } catch (error) {
        console.error('Failed to upload file:', error);
        const errorMessage = error instanceof Error ? error.message : 'Không rõ lỗi';
        alert(`Lỗi khi tải file: ${errorMessage}`);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa file này?')) return;

    try {
      await deleteMediaFile(id);
      loadMediaFiles();
    } catch (error) {
      console.error('Failed to delete media file:', error);
      alert('Lỗi khi xóa file');
    }
  };

  const copyToClipboard = (url: string, id: number) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getFileType = (mimeType: string) => {
    if (mimeType.startsWith('image')) return 'image';
    if (mimeType.startsWith('audio')) return 'audio';
    if (mimeType.startsWith('video')) return 'video';
    return 'other';
  };

  const getFileIcon = (mimeType: string) => {
    const type = getFileType(mimeType);
    switch (type) {
      case 'image':
        return '🖼️';
      case 'audio':
        return '🎵';
      case 'video':
        return '🎬';
      default:
        return '📄';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredFiles = mediaFiles.filter(file => {
    const matchesSearch = 
      file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.url.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = 
      filterType === 'all' || getFileType(file.mimeType) === filterType;

    return matchesSearch && matchesType;
  });

  const getTotalSize = () => {
    return mediaFiles.reduce((sum, file) => sum + (file.size || 0), 0);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Quản lý Tệp Phương Tiện</h1>
          <p className="text-gray-600 mt-1">Tải lên và quản lý hình ảnh, âm thanh, video</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-md p-4">
          <p className="text-gray-600 text-sm mb-1">Tổng File</p>
          <p className="text-2xl font-bold text-gray-800">{mediaFiles.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-4">
          <p className="text-gray-600 text-sm mb-1">Dung Lượng Sử Dụng</p>
          <p className="text-2xl font-bold text-gray-800">{formatFileSize(getTotalSize())}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-4">
          <p className="text-gray-600 text-sm mb-1">Loại File</p>
          <p className="text-2xl font-bold text-gray-800">
            {Array.from(new Set(mediaFiles.map(f => getFileType(f.mimeType)))).length}
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-md border-2 border-dashed border-blue-300 p-8 mb-6 cursor-pointer hover:border-blue-500 transition group">
        <input
          type="file"
          multiple
          accept="image/*,audio/*,video/*"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer block">
          <div className="text-center">
            <Upload className="w-12 h-12 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition" />
            <p className="font-bold text-gray-800 mb-1">
              {isUploading ? 'Đang tải...' : 'Kéo và thả file vào đây hoặc nhấp để chọn'}
            </p>
            <p className="text-sm text-gray-600">Hỗ trợ: Hình ảnh, Âm thanh, Video</p>
          </div>
        </label>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-md p-4 mb-6 flex gap-3 flex-wrap items-center">
        <input
          type="text"
          placeholder="Tìm kiếm file..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          {(['all', 'image', 'audio', 'video'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg font-bold transition ${
                filterType === type
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type === 'all' ? 'Tất Cả' : type === 'image' ? '🖼️ Ảnh' : type === 'audio' ? '🎵 Âm' : '🎬 Video'}
            </button>
          ))}
        </div>
      </div>

      {/* Files List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-md">
          <HardDrive className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Không có file nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFiles.map((file, idx) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition p-4"
            >
              <div className="flex items-center gap-4">
                {/* Icon & Type */}
                <div className="text-3xl">{getFileIcon(file.mimeType)}</div>

                {/* File Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-800">{file.filename}</h3>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      {getFileType(file.mimeType).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      {formatFileSize(file.size || 0)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(file.createdAt || new Date().toISOString())}
                    </span>
                  </div>

                  {/* File Preview */}
                  {getFileType(file.mimeType) === 'image' && (
                    <div className="relative mt-2 h-32 w-full max-w-xs overflow-hidden rounded-lg">
                      <Image
                        src={file.url}
                        alt={file.filename}
                        fill
                        sizes="(max-width: 768px) 100vw, 320px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  {getFileType(file.mimeType) === 'audio' && (
                    <audio src={file.url} controls className="mt-2 w-full max-w-xs" />
                  )}
                  {getFileType(file.mimeType) === 'video' && (
                    <video src={file.url} controls className="mt-2 h-32 rounded-lg" />
                  )}

                  {/* URL Display */}
                  <div className="mt-3 bg-gray-100 rounded-lg p-2 text-xs break-all">
                    <code className="text-gray-700">{file.url}</code>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => copyToClipboard(file.url, file.id)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg transition ${
                      copiedId === file.id
                        ? 'bg-green-100 text-green-600'
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                    {copiedId === file.id ? 'Đã sao' : 'Sao'}
                  </button>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="flex items-center justify-center px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
