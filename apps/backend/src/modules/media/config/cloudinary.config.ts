import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const configureCloudinary = (configService: ConfigService) => {
  cloudinary.config({
    cloud_name: configService.get<string>('CLOUDINARY_CLOUD_NAME'),
    api_key: configService.get<string>('CLOUDINARY_API_KEY'),
    api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
    secure: true,
  });

  return cloudinary;
};

/**
 * Cloudinary upload options by media type
 */
export const CLOUDINARY_OPTIONS = {
  IMAGE: {
    folder: 'edukids/images',
    resource_type: 'image' as const,
    format: 'jpg',
    quality: 'auto:good',
    fetch_format: 'auto',
    transformation: [
      {
        width: 1920,
        height: 1080,
        crop: 'limit',
        quality: 'auto:good',
      },
    ],
    eager: [
      {
        width: 400,
        height: 400,
        crop: 'thumb',
        gravity: 'auto',
        format: 'jpg',
        quality: 80,
      },
    ],
    eager_async: true,
  },
  AUDIO: {
    folder: 'edukids/audio',
    resource_type: 'video' as const, // Cloudinary uses 'video' for audio files
    format: 'mp3',
  },
  VIDEO: {
    folder: 'edukids/videos',
    resource_type: 'video' as const,
    quality: 'auto:good',
    format: 'mp4',
    transformation: [
      {
        width: 1280,
        height: 720,
        crop: 'limit',
        quality: 'auto:good',
      },
    ],
    eager: [
      {
        width: 400,
        height: 300,
        crop: 'fill',
        format: 'jpg',
        start_offset: '1',
      },
    ],
    eager_async: true,
  },
};

/**
 * File size limits (in bytes)
 */
export const FILE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024, // 10 MB
  AUDIO: 50 * 1024 * 1024, // 50 MB
  VIDEO: 200 * 1024 * 1024, // 200 MB
};

/**
 * Allowed MIME types
 */
export const ALLOWED_MIME_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  AUDIO: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'],
  VIDEO: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'],
};
