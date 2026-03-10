import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { MediaType, MediaContext } from '../dto/upload-media.dto';
import { ProcessingStatus } from '../dto/media-response.dto';

@Injectable()
export class MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new media record
   */
  async createMedia(data: {
    mediaType: MediaType;
    context: MediaContext;
    originalFilename: string;
    fileSize: number;
    mimeType: string;
    rawUrl: string;
    description?: string;
    altText?: string;
    uploadedBy: string;
  }) {
    return this.prisma.media.create({
      data: {
        mediaType: data.mediaType,
        context: data.context,
        originalFilename: data.originalFilename,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        status: ProcessingStatus.PENDING,
        rawUrl: data.rawUrl,
        description: data.description,
        altText: data.altText,
        uploadedBy: data.uploadedBy,
        uploadedAt: new Date(),
      },
    });
  }

  /**
   * Get media by ID
   */
  async getMediaById(id: string) {
    return this.prisma.media.findUnique({
      where: { id },
    });
  }

  /**
   * Update media processing status
   */
  async updateMediaStatus(
    id: string,
    status: ProcessingStatus,
    data?: {
      optimizedUrl?: string;
      thumbnailUrl?: string;
      cloudinaryPublicId?: string;
      metadata?: Record<string, any>;
      errorMessage?: string;
      processedAt?: Date;
    },
  ) {
    return this.prisma.media.update({
      where: { id },
      data: {
        status,
        ...data,
      },
    });
  }

  /**
   * Get media list with filters and pagination
   */
  async getMediaList(params: {
    mediaType?: MediaType;
    context?: MediaContext;
    status?: ProcessingStatus;
    uploadedBy?: string;
    page: number;
    limit: number;
  }) {
    const { mediaType, context, status, uploadedBy, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (mediaType) where.type = mediaType;
    if (context) where.context = context;
    if (status) where.status = status;
    if (uploadedBy) where.uploadedBy = uploadedBy;

    const [items, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        skip,
        take: limit,
        orderBy: { uploadedAt: 'desc' },
      }),
      this.prisma.media.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  /**
   * Delete media by ID
   */
  async deleteMedia(id: string) {
    return this.prisma.media.delete({
      where: { id },
    });
  }

  /**
   * Get media by Cloudinary public ID
   */
  async getMediaByCloudinaryId(cloudinaryPublicId: string) {
    return this.prisma.media.findFirst({
      where: { cloudinaryPublicId },
    });
  }

  /**
   * Get pending/processing media count for monitoring
   */
  async getPendingMediaCount() {
    return this.prisma.media.count({
      where: {
        status: {
          in: [ProcessingStatus.PENDING, ProcessingStatus.PROCESSING],
        },
      },
    });
  }

  /**
   * Get failed media for retry
   */
  async getFailedMedia(limit: number = 10) {
    return this.prisma.media.findMany({
      where: { status: ProcessingStatus.FAILED },
      orderBy: { uploadedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Update metadata
   */
  async updateMetadata(id: string, metadata: Record<string, any>) {
    return this.prisma.media.update({
      where: { id },
      data: { metadata },
    });
  }
}
