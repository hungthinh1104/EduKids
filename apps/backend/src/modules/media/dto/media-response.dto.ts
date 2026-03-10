import { ApiProperty } from '@nestjs/swagger';
import { MediaType, MediaContext } from './upload-media.dto';

export enum ProcessingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class MediaResponseDto {
  @ApiProperty({
    description: 'Unique media ID',
    example: 'clx1234567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Type of media',
    enum: MediaType,
    example: MediaType.IMAGE,
  })
  mediaType: MediaType;

  @ApiProperty({
    description: 'Context where media is used',
    enum: MediaContext,
    example: MediaContext.VOCABULARY,
  })
  context: MediaContext;

  @ApiProperty({
    description: 'Original filename',
    example: 'apple-image.jpg',
  })
  originalFilename: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
  })
  fileSize: number;

  @ApiProperty({
    description: 'MIME type',
    example: 'image/jpeg',
  })
  mimeType: string;

  @ApiProperty({
    description: 'Processing status',
    enum: ProcessingStatus,
    example: ProcessingStatus.COMPLETED,
  })
  status: ProcessingStatus;

  @ApiProperty({
    description: 'URL for raw uploaded file (temporary)',
    example: 'https://temp-storage.com/raw/abc123.jpg',
    nullable: true,
  })
  rawUrl: string | null;

  @ApiProperty({
    description: 'URL for optimized file (permanent)',
    example: 'https://cloudinary.com/edukids/v1234567890/media/abc123.jpg',
    nullable: true,
  })
  optimizedUrl: string | null;

  @ApiProperty({
    description: 'Thumbnail URL (for images and videos)',
    example: 'https://cloudinary.com/edukids/thumb/abc123.jpg',
    nullable: true,
  })
  thumbnailUrl: string | null;

  @ApiProperty({
    description: 'Cloudinary public ID',
    example: 'edukids/media/abc123',
    nullable: true,
  })
  cloudinaryPublicId: string | null;

  @ApiProperty({
    description: 'Optional description',
    example: 'Apple illustration',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Alt text for accessibility',
    example: 'Red apple',
    nullable: true,
  })
  altText: string | null;

  @ApiProperty({
    description: 'Admin who uploaded the media',
    example: 'admin123',
  })
  uploadedBy: string;

  @ApiProperty({
    description: 'Upload timestamp',
    example: '2026-03-06T10:30:00Z',
  })
  uploadedAt: Date;

  @ApiProperty({
    description: 'Processing completion timestamp',
    example: '2026-03-06T10:30:05Z',
    nullable: true,
  })
  processedAt: Date | null;

  @ApiProperty({
    description: 'Error message if processing failed',
    example: null,
    nullable: true,
  })
  errorMessage: string | null;

  @ApiProperty({
    description: 'Metadata (dimensions, duration, etc.)',
    example: { width: 1920, height: 1080, format: 'jpg' },
    nullable: true,
  })
  metadata: Record<string, any> | null;
}

export class MediaListResponseDto {
  @ApiProperty({
    description: 'List of media items',
    type: [MediaResponseDto],
  })
  items: MediaResponseDto[];

  @ApiProperty({
    description: 'Total number of media items',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
  })
  limit: number;
}

export class ProcessingStatusResponseDto {
  @ApiProperty({
    description: 'Media ID',
    example: 'clx1234567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Processing status',
    enum: ProcessingStatus,
    example: ProcessingStatus.PROCESSING,
  })
  status: ProcessingStatus;

  @ApiProperty({
    description: 'Progress percentage (0-100)',
    example: 75,
  })
  progress: number;

  @ApiProperty({
    description: 'Current processing step',
    example: 'Uploading to cloud storage',
    nullable: true,
  })
  currentStep: string | null;

  @ApiProperty({
    description: 'Estimated time remaining in seconds',
    example: 5,
    nullable: true,
  })
  estimatedTimeRemaining: number | null;

  @ApiProperty({
    description: 'Error message if failed',
    example: null,
    nullable: true,
  })
  errorMessage: string | null;
}
