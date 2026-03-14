'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Upload, Trash2, Eye, Copy, Calendar, HardDrive } from 'lucide-react';
import { motion } from 'framer-motion';
import { Heading, Body, Caption } from '@/shared/components/Typography';
import { uploadMediaFile, deleteMediaFile, listMediaFiles, type MediaFile } from '@/features/media/api/media.api';

export default function AdminMediaPage() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'audio' | 'video'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
        const mediaType = file.type.startsWith('image/')
          ? 'IMAGE'
          : file.type.startsWith('audio/')
            ? 'AUDIO'
            : file.type.startsWith('video/')
              ? 'VIDEO'
              : null;

        if (!mediaType) {
          alert(`Định dạng không hỗ trợ: ${file.type || file.name}`);
          continue;
        }

        await uploadMediaFile(file, {
          mediaType,
          context: 'GENERAL',
        });
        await loadMediaFiles();
      } catch (error) {
        console.error('Failed to upload file:', error);
        const errorMessage = error instanceof Error ? error.message : 'Không rõ lỗi';
        alert(`Lỗi khi tải file: ${errorMessage}`);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa file này?')) return;

    try {
      await deleteMediaFile(id);
      await loadMediaFiles();
    } catch (error) {
      console.error('Failed to delete media file:', error);
      alert('Lỗi khi xóa file');
    }
  };

  const copyToClipboard = (url: string, id: string) => {
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
      file.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (file.optimizedUrl || file.rawUrl || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = 
      filterType === 'all' || getFileType(file.mimeType) === filterType;

    return matchesSearch && matchesType;
  });

  const getTotalSize = () => {
    return mediaFiles.reduce((sum, file) => sum + (file.fileSize || 0), 0);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-primary/15 bg-gradient-to-r from-primary-light/55 via-card to-accent-light/40 p-6 shadow-sm">
        <div>
          <Heading level={2} className="text-heading text-3xl mb-1">Quản lý Tệp Phương Tiện</Heading>
          <Body className="text-body mt-1">Tải lên và quản lý hình ảnh, âm thanh, video</Body>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-2xl border border-border/70 shadow-sm p-4">
          <Caption className="text-caption text-sm mb-1">Tổng File</Caption>
          <p className="text-2xl font-heading font-black text-heading">{mediaFiles.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border/70 shadow-sm p-4">
          <Caption className="text-caption text-sm mb-1">Dung Lượng Sử Dụng</Caption>
          <p className="text-2xl font-heading font-black text-heading">{formatFileSize(getTotalSize())}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border/70 shadow-sm p-4">
          <Caption className="text-caption text-sm mb-1">Loại File</Caption>
          <p className="text-2xl font-heading font-black text-heading">
            {Array.from(new Set(mediaFiles.map(f => getFileType(f.mimeType)))).length}
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-gradient-to-br from-primary-light/40 to-accent-light/35 rounded-2xl shadow-sm border-2 border-dashed border-primary/35 p-8 mb-6 cursor-pointer hover:border-primary/60 transition group">
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
            <p className="font-bold text-heading mb-1">
              {isUploading ? 'Đang tải...' : 'Kéo và thả file vào đây hoặc nhấp để chọn'}
            </p>
            <p className="text-sm text-body">Hỗ trợ: Hình ảnh, Âm thanh, Video</p>
          </div>
        </label>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border/70 shadow-sm p-4 mb-6 flex gap-3 flex-wrap items-center">
        <input
          type="text"
          placeholder="Tìm kiếm file..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-64 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        <div className="flex gap-2">
          {(['all', 'image', 'audio', 'video'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg font-bold transition ${
                filterType === type
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-background text-body border border-border hover:border-primary/50 hover:text-primary'
              }`}
            >
              {type === 'all' ? 'Tất Cả' : type === 'image' ? '🖼️ Ảnh' : type === 'audio' ? '🎵 Âm' : '🎬 Video'}
            </button>
          ))}
        </div>
      </div>

      {/* Files List */}
      {isLoading ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border/70 shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-body">Đang tải...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border/70 shadow-sm">
          <HardDrive className="w-12 h-12 text-caption mx-auto mb-3" />
          <p className="text-caption">Không có file nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFiles.map((file, idx) => {
            const fileUrl = file.optimizedUrl || file.rawUrl || '';
            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 1, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card rounded-2xl border border-border/70 shadow-sm hover:shadow-md transition p-4"
              >
                <div className="flex items-center gap-4">
                  {/* Icon & Type */}
                  <div className="text-3xl">{getFileIcon(file.mimeType)}</div>

                  {/* File Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-heading">{file.originalFilename}</h3>
                      <span className="text-xs px-2 py-1 bg-background text-body rounded border border-border/60">
                        {getFileType(file.mimeType).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-caption">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        {formatFileSize(file.fileSize || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(file.uploadedAt || new Date().toISOString())}
                      </span>
                    </div>

                    {/* File Preview */}
                    {fileUrl && getFileType(file.mimeType) === 'image' && (
                      <div className="relative mt-2 h-32 w-full max-w-xs overflow-hidden rounded-lg">
                        <Image
                          src={fileUrl}
                          alt={file.originalFilename}
                          fill
                          sizes="(max-width: 768px) 100vw, 320px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    {fileUrl && getFileType(file.mimeType) === 'audio' && (
                      <audio src={fileUrl} controls className="mt-2 w-full max-w-xs" />
                    )}
                    {fileUrl && getFileType(file.mimeType) === 'video' && (
                      <video src={fileUrl} controls className="mt-2 h-32 rounded-lg" />
                    )}

                    {/* URL Display */}
                    <div className="mt-3 bg-background rounded-lg p-2 text-xs break-all border border-border/60">
                      <code className="text-body">{fileUrl || 'Chưa có URL xử lý'}</code>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => copyToClipboard(fileUrl, file.id)}
                      disabled={!fileUrl}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg transition ${
                        copiedId === file.id
                          ? 'bg-success-light text-success'
                          : fileUrl
                            ? 'bg-primary-light hover:bg-primary-light/70 text-primary'
                            : 'bg-background text-caption cursor-not-allowed'
                      }`}
                    >
                      <Copy className="w-4 h-4" />
                      {copiedId === file.id ? 'Đã sao' : 'Sao'}
                    </button>
                    {fileUrl ? (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center px-3 py-2 bg-background hover:bg-background/70 text-body rounded-lg border border-border/60 transition"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="flex items-center justify-center px-3 py-2 bg-background text-caption rounded-lg border border-border/60"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="flex items-center justify-center px-3 py-2 bg-error-light hover:bg-error-light/70 text-error rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
