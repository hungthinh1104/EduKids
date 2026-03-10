import { Injectable, NotFoundException } from "@nestjs/common";
import { UploadMediaDto } from "../dto/upload-media.dto";
import {
  MediaListResponseDto,
  MediaResponseDto,
  ProcessingStatus,
  ProcessingStatusResponseDto,
} from "../dto/media-response.dto";
import { QueryMediaDto } from "../dto/query-media.dto";

@Injectable()
export class MediaService {
  private readonly store = new Map<string, MediaResponseDto>();

  async uploadMedia(
    file: Express.Multer.File,
    uploadDto: UploadMediaDto,
    adminId: string,
  ): Promise<MediaResponseDto> {
    const id = `media_${Date.now()}`;
    const now = new Date();

    const item: MediaResponseDto = {
      id,
      mediaType: uploadDto.mediaType,
      context: uploadDto.context,
      originalFilename: file?.originalname || "unknown.bin",
      fileSize: file?.size || 0,
      mimeType: file?.mimetype || "application/octet-stream",
      status: ProcessingStatus.COMPLETED,
      rawUrl: null,
      optimizedUrl: null,
      thumbnailUrl: null,
      cloudinaryPublicId: null,
      description: uploadDto.description || null,
      altText: uploadDto.altText || null,
      uploadedBy: adminId,
      uploadedAt: now,
      processedAt: now,
      errorMessage: null,
      metadata: { mocked: true },
    };

    this.store.set(id, item);
    return item;
  }

  async getMediaById(id: string): Promise<MediaResponseDto> {
    const media = this.store.get(id);
    if (!media) {
      throw new NotFoundException("Media not found");
    }
    return media;
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
    const all = Array.from(this.store.values());
    const start = (page - 1) * limit;
    const items = all.slice(start, start + limit);

    return {
      items,
      total: all.length,
      page,
      limit,
    };
  }

  async deleteMedia(id: string, _adminId: string): Promise<void> {
    if (!this.store.has(id)) {
      throw new NotFoundException("Media not found");
    }
    this.store.delete(id);
  }

  async retryFailedMedia(id: string): Promise<void> {
    const media = await this.getMediaById(id);
    media.status = ProcessingStatus.PROCESSING;
    media.status = ProcessingStatus.COMPLETED;
    media.processedAt = new Date();
    this.store.set(id, media);
  }

  async getPendingMediaCount(): Promise<number> {
    return Array.from(this.store.values()).filter(
      (m) =>
        m.status === ProcessingStatus.PENDING ||
        m.status === ProcessingStatus.PROCESSING,
    ).length;
  }
}
