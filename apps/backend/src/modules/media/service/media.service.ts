import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import * as fs from "fs/promises";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { v2 as cloudinary, type UploadApiResponse, type UploadApiErrorResponse } from "cloudinary";
import { UploadMediaDto } from "../dto/upload-media.dto";
import {
  MediaListResponseDto,
  MediaResponseDto,
  ProcessingStatus,
  ProcessingStatusResponseDto,
} from "../dto/media-response.dto";
import { QueryMediaDto } from "../dto/query-media.dto";
import { MediaRepository } from "../repository/media.repository";
import { ALLOWED_MIME_TYPES, CLOUDINARY_OPTIONS, FILE_SIZE_LIMITS } from "../config/cloudinary.config";

type CloudinaryUploadResult = UploadApiResponse & {
  eager?: Array<{ secure_url?: string }>;
  bytes?: number;
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
};

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly mediaRepository: MediaRepository,
    @InjectQueue('media-processing') private mediaQueue: Queue,
  ) {}

  private isCloudinaryConfigured() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const isValidSecret = (value?: string) => {
      if (!value) return false;
      const normalized = value.trim();
      if (!normalized) return false;
      // Avoid common placeholder values from env templates
      return !/^(your[-_]|change[-_]?me|replace[-_]?me|example|test|dummy)/i.test(normalized);
    };

    return Boolean(
      isValidSecret(cloudName) &&
      isValidSecret(apiKey) &&
      isValidSecret(apiSecret),
    );
  }

  private ensureCloudinaryConfigured() {
    if (!this.isCloudinaryConfigured()) {
      throw new ServiceUnavailableException(
        'Media upload chưa được cấu hình Cloudinary. Hãy cập nhật CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY và CLOUDINARY_API_SECRET.',
      );
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  private validateFile(file: Express.Multer.File, mediaType: UploadMediaDto['mediaType']) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file để tải lên');
    }

    const allowedMimeTypes = ALLOWED_MIME_TYPES[mediaType];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Định dạng file không được hỗ trợ cho ${mediaType}`);
    }

    const maxFileSize = FILE_SIZE_LIMITS[mediaType];
    if (file.size > maxFileSize) {
      throw new BadRequestException(`Kích thước file vượt quá giới hạn ${Math.round(maxFileSize / 1024 / 1024)}MB`);
    }
  }

  private async uploadToCloudinary(
    file: Express.Multer.File,
    mediaType: UploadMediaDto['mediaType'],
  ): Promise<CloudinaryUploadResult> {
    this.ensureCloudinaryConfigured();

    const options = CLOUDINARY_OPTIONS[mediaType];

    try {
      const uploadOptions = {
        ...options,
        public_id: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-')}`,
      };

      if (file.path) {
        const result = await cloudinary.uploader.upload(file.path, uploadOptions);
        return result as CloudinaryUploadResult;
      }

      if (!file.buffer) {
        throw new InternalServerErrorException('File upload payload is missing buffer data');
      }

      const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, response) => {
          if (error || !response) {
            reject(error ?? new Error('Cloudinary upload failed'));
            return;
          }
          resolve(response as CloudinaryUploadResult);
        });

        stream.end(file.buffer);
      });

      return result as CloudinaryUploadResult;
    } catch (error) {
      const cloudinaryError = error as UploadApiErrorResponse;
      throw new InternalServerErrorException(
        cloudinaryError?.message || 'Không thể tải file lên Cloudinary',
      );
    }
  }

  private toResponseDto(media: Record<string, any>): MediaResponseDto {
    return {
      id: media.id,
      mediaType: media.mediaType,
      context: media.context,
      originalFilename: media.originalFilename ?? 'unknown.bin',
      fileSize: media.fileSize ?? 0,
      mimeType: media.mimeType ?? 'application/octet-stream',
      status: media.status,
      rawUrl: media.rawUrl ?? null,
      optimizedUrl: media.optimizedUrl ?? media.url ?? null,
      thumbnailUrl: media.thumbnailUrl ?? null,
      cloudinaryPublicId: media.cloudinaryPublicId ?? null,
      description: media.description ?? null,
      altText: media.altText ?? null,
      uploadedBy: media.uploadedBy ?? '',
      uploadedAt: media.uploadedAt,
      processedAt: media.processedAt ?? null,
      errorMessage: media.errorMessage ?? null,
      metadata: media.metadata ?? null,
    };
  }

  async uploadMedia(
    file: Express.Multer.File,
    uploadDto: UploadMediaDto,
    adminId: string,
  ): Promise<MediaResponseDto> {
    let shouldKeepTempFile = false;

    try {
      this.validateFile(file, uploadDto.mediaType);

      const uploaded = await this.uploadToCloudinary(file, uploadDto.mediaType);

      // Create media record with COMPLETED status by default because Cloudinary already stores final asset
      const media = await this.mediaRepository.createMedia({
        mediaType: uploadDto.mediaType,
        context: uploadDto.context,
        originalFilename: file.originalname,
        fileSize: uploaded.bytes ?? file.size,
        mimeType: file.mimetype,
        rawUrl: uploaded.secure_url ?? null,
        optimizedUrl: uploaded.secure_url ?? null,
        thumbnailUrl: uploaded.eager?.[0]?.secure_url ?? null,
        cloudinaryPublicId: uploaded.public_id ?? null,
        description: uploadDto.description ?? null,
        altText: uploadDto.altText ?? null,
        uploadedBy: adminId,
        status: ProcessingStatus.COMPLETED,
        processedAt: new Date(),
        metadata: {
          width: uploaded.width ?? null,
          height: uploaded.height ?? null,
          duration: uploaded.duration ?? null,
          format: uploaded.format ?? null,
          resourceType: uploaded.resource_type ?? null,
        },
      });

      // Optional local post-processing pipeline (disabled by default).
      // Cloudinary upload above already provides a usable optimized URL.
      const enablePostProcessing =
        String(process.env.MEDIA_ENABLE_POST_PROCESSING || '').toLowerCase() === 'true';

      if (enablePostProcessing) {
        if (!file.path) {
          this.logger.warn(
            `Skip local post-processing for ${media.id}: no temporary file path (multer memory storage).`,
          );
        } else {
          try {
            await this.mediaRepository.updateMediaStatus(media.id, ProcessingStatus.PENDING, {
              processedAt: null,
            });

            await this.mediaQueue.add(
              'process-media',
              {
                mediaId: media.id,
                tempFilePath: file.path,
                mediaType: uploadDto.mediaType,
                mimeType: file.mimetype,
              },
              {
                attempts: 3,
                backoff: {
                  type: 'exponential',
                  delay: 2000,
                },
                removeOnComplete: true,
                removeOnFail: false,
              },
            );
            shouldKeepTempFile = true;
            this.logger.log(`Media processing queued for ${media.id}`);
          } catch (error) {
            this.logger.warn(`Failed to queue media ${media.id}: ${error instanceof Error ? error.message : String(error)}`);
            await this.mediaRepository.updateMediaStatus(media.id, ProcessingStatus.COMPLETED, {
              processedAt: new Date(),
            });
          }
        }
      }

      return this.toResponseDto(media);
    } finally {
      if (file.path && !shouldKeepTempFile) {
        try {
          await fs.unlink(file.path);
        } catch (error) {
          this.logger.warn(
            `Failed to cleanup temporary upload file ${file.path}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }
  }

  async getMediaById(id: string): Promise<MediaResponseDto> {
    const media = await this.mediaRepository.getMediaById(id) as Record<string, any> | null;
    if (!media) {
      throw new NotFoundException("Media not found");
    }
    return this.toResponseDto(media);
  }

  async getProcessingStatus(id: string): Promise<ProcessingStatusResponseDto> {
    const media = await this.getMediaById(id);
    return {
      id,
      status: media.status,
      progress: media.status === ProcessingStatus.COMPLETED ? 100 : 0,
      currentStep: media.status === ProcessingStatus.COMPLETED ? "Done" : "Queued",
      estimatedTimeRemaining: media.status === ProcessingStatus.COMPLETED ? 0 : null,
      errorMessage: media.errorMessage,
    };
  }

  async getMediaList(queryDto: QueryMediaDto): Promise<MediaListResponseDto> {
    const page = Number(queryDto.page || 1);
    const limit = Number(queryDto.limit || 20);
    const result = await this.mediaRepository.getMediaList({
      mediaType: queryDto.mediaType,
      context: queryDto.context,
      status: queryDto.status,
      uploadedBy: queryDto.uploadedBy,
      page,
      limit,
    });

    return {
      items: result.items.map((item) => this.toResponseDto(item)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  async deleteMedia(id: string, _adminId: string): Promise<void> {
    const media = await this.mediaRepository.getMediaById(id) as Record<string, any> | null;
    if (!media) {
      throw new NotFoundException("Media not found");
    }

    if (media.cloudinaryPublicId && this.isCloudinaryConfigured()) {
      await cloudinary.uploader.destroy(media.cloudinaryPublicId, {
        resource_type: media.mediaType === 'IMAGE' ? 'image' : 'video',
      });
    }

    await this.mediaRepository.deleteMedia(id);
  }

  async retryFailedMedia(id: string): Promise<void> {
    const media = await this.mediaRepository.getMediaById(id) as Record<string, any> | null;
    if (!media) {
      throw new NotFoundException('Media not found');
    }

    if (media.status !== ProcessingStatus.FAILED) {
      throw new BadRequestException('Chỉ có thể retry media ở trạng thái FAILED');
    }

    // The file is already on Cloudinary (upload succeeded before post-processing failed).
    // Reset to COMPLETED and clear the error so the URL remains usable.
    await this.mediaRepository.updateMediaStatus(id, ProcessingStatus.COMPLETED, {
      errorMessage: null,
      processedAt: new Date(),
    });
  }

  async getPendingMediaCount(): Promise<number> {
    return this.mediaRepository.getPendingMediaCount();
  }
}
