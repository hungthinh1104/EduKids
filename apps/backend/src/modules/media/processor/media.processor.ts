import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs/promises';
import * as sharp from 'sharp';
import * as ffmpeg from 'fluent-ffmpeg';
import { MediaRepository } from '../repository/media.repository';
import { MediaType } from '../dto/upload-media.dto';
import { ProcessingStatus } from '../dto/media-response.dto';
import { CLOUDINARY_OPTIONS } from '../config/cloudinary.config';

interface MediaProcessingJob {
  mediaId: string;
  tempFilePath: string;
  mediaType: MediaType;
  mimeType: string;
}

@Processor('media-processing')
export class MediaProcessor {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly configService: ConfigService,
  ) {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
      secure: true,
    });
  }

  @Process('process-media')
  async processMedia(job: Job<MediaProcessingJob>) {
    const { mediaId, tempFilePath, mediaType, mimeType } = job.data;

    try {
      // Update status to processing
      await this.mediaRepository.updateMediaStatus(mediaId, ProcessingStatus.PROCESSING);
      await job.progress(10);

      // Process based on media type
      let result: any;
      switch (mediaType) {
        case MediaType.IMAGE:
          result = await this.processImage(job, tempFilePath);
          break;
        case MediaType.AUDIO:
          result = await this.processAudio(job, tempFilePath);
          break;
        case MediaType.VIDEO:
          result = await this.processVideo(job, tempFilePath);
          break;
        default:
          throw new Error(`Unsupported media type: ${mediaType}`);
      }

      await job.progress(90);

      // Update media with results
      await this.mediaRepository.updateMediaStatus(mediaId, ProcessingStatus.COMPLETED, {
        optimizedUrl: result.optimizedUrl,
        thumbnailUrl: result.thumbnailUrl,
        cloudinaryPublicId: result.publicId,
        metadata: result.metadata,
      });

      await job.progress(100);

      // Clean up temp file
      await this.cleanupTempFile(tempFilePath);

      return { success: true, mediaId };
    } catch (error) {
      console.error('Media processing failed:', error);

      // Update status to failed
      await this.mediaRepository.updateMediaStatus(mediaId, ProcessingStatus.FAILED, {
        errorMessage: error.message || 'Unknown processing error',
      });

      // Clean up temp file
      await this.cleanupTempFile(tempFilePath);

      throw error;
    }
  }

  /**
   * Process image: compress, resize, upload to Cloudinary
   */
  private async processImage(job: Job, tempFilePath: string) {
    await job.updateData({ ...job.data, currentStep: 'Optimizing image' });
    await job.progress(20);

    // Read and optimize image with sharp
    const imageBuffer = await fs.readFile(tempFilePath);
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    // Optimize image
    const optimizedBuffer = await image
      .resize(1920, 1080, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();

    await job.progress(40);

    // Save optimized image temporarily
    const optimizedPath = tempFilePath.replace(/\.[^.]+$/, '-optimized.jpg');
    await fs.writeFile(optimizedPath, optimizedBuffer);

    await job.updateData({ ...job.data, currentStep: 'Uploading to cloud' });
    await job.progress(60);

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(optimizedPath, {
      ...CLOUDINARY_OPTIONS.IMAGE,
      public_id: `media/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });

    await job.progress(80);

    // Clean up optimized file
    await fs.unlink(optimizedPath);

    return {
      optimizedUrl: uploadResult.secure_url,
      thumbnailUrl: uploadResult.eager?.[0]?.secure_url || uploadResult.secure_url,
      publicId: uploadResult.public_id,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: optimizedBuffer.length,
        originalSize: imageBuffer.length,
        compressionRatio: ((1 - optimizedBuffer.length / imageBuffer.length) * 100).toFixed(2) + '%',
      },
    };
  }

  /**
   * Process audio: convert to MP3, upload to Cloudinary
   */
  private async processAudio(job: Job, tempFilePath: string) {
    await job.updateData({ ...job.data, currentStep: 'Converting audio format' });
    await job.progress(20);

    return new Promise((resolve, reject) => {
      const outputPath = tempFilePath.replace(/\.[^.]+$/, '-converted.mp3');

      ffmpeg(tempFilePath)
        .toFormat('mp3')
        .audioBitrate('128k')
        .audioChannels(2)
        .on('progress', (progress) => {
          if (progress.percent) {
            job.progress(20 + Math.round(progress.percent * 0.3));
          }
        })
        .on('end', async () => {
          try {
            await job.progress(60);
            await job.updateData({ ...job.data, currentStep: 'Uploading to cloud' });

            // Upload to Cloudinary
            const uploadResult = await cloudinary.uploader.upload(outputPath, {
              ...CLOUDINARY_OPTIONS.AUDIO,
              public_id: `audio/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            });

            await job.progress(80);

            // Get file stats
            const stats = await fs.stat(outputPath);
            const originalStats = await fs.stat(tempFilePath);

            // Clean up converted file
            await fs.unlink(outputPath);

            resolve({
              optimizedUrl: uploadResult.secure_url,
              thumbnailUrl: null,
              publicId: uploadResult.public_id,
              metadata: {
                duration: uploadResult.duration,
                format: 'mp3',
                bitrate: '128k',
                size: stats.size,
                originalSize: originalStats.size,
              },
            });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        })
        .save(outputPath);
    });
  }

  /**
   * Process video: transcode to MP4, generate thumbnail, upload to Cloudinary
   */
  private async processVideo(job: Job, tempFilePath: string) {
    await job.updateData({ ...job.data, currentStep: 'Transcoding video' });
    await job.progress(20);

    return new Promise((resolve, reject) => {
      const outputPath = tempFilePath.replace(/\.[^.]+$/, '-transcoded.mp4');
      const thumbnailPath = tempFilePath.replace(/\.[^.]+$/, '-thumb.jpg');

      ffmpeg(tempFilePath)
        .toFormat('mp4')
        .videoCodec('libx264')
        .audioCodec('aac')
        .size('1280x720')
        .videoBitrate('1000k')
        .audioBitrate('128k')
        .screenshots({
          timestamps: ['1'],
          filename: thumbnailPath,
          size: '400x300',
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            job.progress(20 + Math.round(progress.percent * 0.4));
          }
        })
        .on('end', async () => {
          try {
            await job.progress(70);
            await job.updateData({ ...job.data, currentStep: 'Uploading to cloud' });

            // Upload video to Cloudinary
            const videoUploadResult = await cloudinary.uploader.upload(outputPath, {
              ...CLOUDINARY_OPTIONS.VIDEO,
              public_id: `video/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            });

            await job.progress(85);

            // Upload thumbnail
            let thumbnailUrl = null;
            try {
              const thumbnailUploadResult = await cloudinary.uploader.upload(thumbnailPath, {
                folder: 'edukids/thumbnails',
                resource_type: 'image',
              });
              thumbnailUrl = thumbnailUploadResult.secure_url;
            } catch (error) {
              console.error('Failed to upload thumbnail:', error);
            }

            await job.progress(90);

            // Get file stats
            const stats = await fs.stat(outputPath);
            const originalStats = await fs.stat(tempFilePath);

            // Clean up processed files
            await fs.unlink(outputPath);
            try {
              await fs.unlink(thumbnailPath);
            } catch (error) {
              console.error('Failed to delete thumbnail:', error);
            }

            resolve({
              optimizedUrl: videoUploadResult.secure_url,
              thumbnailUrl,
              publicId: videoUploadResult.public_id,
              metadata: {
                duration: videoUploadResult.duration,
                width: videoUploadResult.width,
                height: videoUploadResult.height,
                format: 'mp4',
                size: stats.size,
                originalSize: originalStats.size,
                videoBitrate: '1000k',
                audioBitrate: '128k',
              },
            });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        })
        .save(outputPath);
    });
  }

  /**
   * Clean up temporary file
   */
  private async cleanupTempFile(filePath: string) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Failed to delete temp file:', error);
    }
  }
}
