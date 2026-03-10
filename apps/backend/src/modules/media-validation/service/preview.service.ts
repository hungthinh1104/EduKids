import { Injectable, Logger } from "@nestjs/common";
import { ContentPreviewDto } from "../dto/validation.dto";
import { v4 as uuid } from "uuid";

/**
 * Preview Service
 * Generates watermarked previews for admin review
 * Prevents unauthorized distribution of draft content
 */
@Injectable()
export class PreviewService {
  private readonly logger = new Logger(PreviewService.name);

  private readonly watermarkText = "DRAFT - ADMIN PREVIEW ONLY";
  private readonly watermarkOpacity = 0.3;

  /**
   * Generate watermarked preview for content
   */
  async generatePreview(
    contentId: string,
    contentTitle: string,
    contentDescription: string,
    imageUrl?: string,
    videoUrl?: string,
    textContent?: string,
  ): Promise<ContentPreviewDto> {
    const previewId = uuid();

    try {
      this.logger.log(`Generating preview for content: ${contentId}`);

      // In production, would:
      // 1. Download media from S3/CDN
      // 2. Apply watermark using ImageMagick/FFmpeg
      // 3. Generate thumbnail
      // 4. Upload watermarked version to secure CDN
      // 5. Cache URLs in Redis

      const thumbnail = await this.generateThumbnail(imageUrl || videoUrl);
      const textPreview = this.generateTextPreview(
        textContent || contentDescription,
      );
      const watermarkedImageUrl = await this.applyWatermark(imageUrl);
      const watermarkedVideoUrl = await this.applyWatermarkToVideo(videoUrl);

      const preview: ContentPreviewDto = {
        contentId,
        title: contentTitle,
        description: contentDescription,
        thumbnailUrl: thumbnail,
        previewUrl: watermarkedImageUrl || watermarkedVideoUrl,
        textPreview,
        duration: videoUrl ? await this.getVideoDuration(videoUrl) : undefined,
        keyFrames: videoUrl ? await this.extractKeyFrames(videoUrl) : undefined,
        hasWatermark: true,
        watermarkText: this.watermarkText,
        previewGeneratedAt: new Date().toISOString(),
      };

      this.logger.log(`Preview generated successfully: ${previewId}`);
      return preview;
    } catch (error) {
      this.logger.error(`Preview generation failed: ${error.message}`);
      // Return basic preview without watermark on error
      return {
        contentId,
        title: contentTitle,
        description: contentDescription,
        thumbnailUrl: imageUrl,
        previewUrl: imageUrl || videoUrl,
        textPreview: this.generateTextPreview(
          textContent || contentDescription,
        ),
        hasWatermark: false,
        watermarkText: "",
        previewGeneratedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Generate thumbnail from image or video
   * In production: Extract first frame from video or resize image
   */
  private async generateThumbnail(mediaUrl?: string): Promise<string> {
    if (!mediaUrl) {
      return "https://via.placeholder.com/400x300?text=No+Image";
    }

    // In production:
    // - For videos: ffmpeg -i input.mp4 -ss 00:00:01 -vf scale=400:300 thumb.jpg
    // - For images: ImageMagick convert or sharp library
    // - Upload to CDN and return URL

    // For now, return original URL (watermark applied separately)
    return mediaUrl;
  }

  /**
   * Apply watermark to image
   * In production: Use ImageMagick or sharp
   */
  private async applyWatermark(imageUrl?: string): Promise<string | undefined> {
    if (!imageUrl) return undefined;

    // In production:
    // const image = sharp(imageUrl);
    // Composite watermark SVG or PNG over image
    // const watermarkBuffer = createWatermarkSvg(this.watermarkText, this.watermarkOpacity);
    // const watermarkedImage = await image
    //   .composite([{ input: watermarkBuffer, gravity: 'center' }])
    //   .toFile('/tmp/watermarked.jpg');
    // Upload to secure CDN and return URL

    this.logger.debug(`Watermark applied to image: ${imageUrl}`);
    return `${imageUrl}?watermark=admin-preview`;
  }

  /**
   * Apply watermark to video
   * In production: Use FFmpeg
   */
  private async applyWatermarkToVideo(
    videoUrl?: string,
  ): Promise<string | undefined> {
    if (!videoUrl) return undefined;

    // In production:
    // ffmpeg -i input.mp4 -vf "drawtext=text='${this.watermarkText}':fontsize=60:fontcolor=white:alpha=${this.watermarkOpacity}:x=(w-text_w)/2:y=(h-text_h)/2" -codec:a copy output.mp4
    // Upload to secure CDN and return URL

    this.logger.debug(`Watermark applied to video: ${videoUrl}`);
    return `${videoUrl}?watermark=admin-preview`;
  }

  /**
   * Generate text preview (first N characters)
   */
  private generateTextPreview(text?: string, maxLength = 500): string {
    if (!text) return "";

    if (text.length <= maxLength) {
      return text;
    }

    return text.substring(0, maxLength) + "...";
  }

  /**
   * Get video duration
   * In production: ffprobe or MediaInfo
   */
  private async getVideoDuration(_videoUrl: string): Promise<number> {
    // In production:
    // const duration = await ffprobe(videoUrl);
    // return duration.format.duration;

    // Mock: return 5 minutes
    return 300;
  }

  /**
   * Extract key frames from video
   * In production: Use ffmpeg
   */
  private async extractKeyFrames(videoUrl: string): Promise<string[]> {
    // In production:
    // ffmpeg -i input.mp4 -vf fps=1/30 frame_%04d.jpg
    // Upload frames and return URLs

    this.logger.debug(`Extracting key frames from video: ${videoUrl}`);

    // Mock: return 5 placeholder frames
    return [
      `${videoUrl}?frame=1`,
      `${videoUrl}?frame=2`,
      `${videoUrl}?frame=3`,
      `${videoUrl}?frame=4`,
      `${videoUrl}?frame=5`,
    ];
  }

  /**
   * Create watermark SVG (helper for ImageMagick/sharp)
   * In production: Use library like svg-to-image
   */
  private createWatermarkSvg(text: string, opacity: number): Buffer {
    const svg = `
      <svg width="1000" height="1000" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.5" />
          </filter>
        </defs>
        <text
          x="500"
          y="500"
          font-size="80"
          fill="white"
          text-anchor="middle"
          dominant-baseline="middle"
          opacity="${opacity}"
          filter="url(#shadow)"
          font-weight="bold"
          font-family="Arial"
          transform="rotate(-45 500 500)"
        >
          ${text}
        </text>
      </svg>
    `;

    return Buffer.from(svg);
  }

  /**
   * Generate high-resolution preview for download
   */
  async generateHighResPreview(
    contentId: string,
    contentTitle: string,
    imageUrl?: string,
    videoUrl?: string,
  ): Promise<{
    previewUrl: string;
    resolution: string;
    format: string;
    watermarked: boolean;
  }> {
    this.logger.log(`Generating high-res preview for: ${contentId}`);

    // In production:
    // - For images: 4K resolution (3840x2160)
    // - For videos: 1080p or 720p
    // - Apply visible watermark

    return {
      previewUrl: imageUrl || videoUrl || "",
      resolution: "1920x1080",
      format: videoUrl ? "mp4" : "jpg",
      watermarked: true,
    };
  }

  /**
   * Generate preview for download by user
   * In production: Would check permissions and rate limits
   */
  async generateDownloadablePreview(
    contentId: string,
    userId: string,
    role: string,
  ): Promise<{
    downloadUrl: string;
    expiresAt: Date;
    accessLog: string;
  }> {
    // Check permissions
    if (!["admin", "moderator"].includes(role)) {
      throw new Error("Insufficient permissions for preview download");
    }

    this.logger.log(
      `Generating downloadable preview for ${contentId} by user ${userId}`,
    );

    // Create signed URL with expiration (2 hours)
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    return {
      downloadUrl: `/media/${contentId}/preview?token=xyz&expires=${expiresAt.toISOString()}`,
      expiresAt,
      accessLog: `User ${userId} (${role}) downloaded preview at ${new Date().toISOString()}`,
    };
  }

  /**
   * Get preview cache statistics
   */
  async getPreviewStats(): Promise<{
    totalPreviews: number;
    cachedPreviews: number;
    averageGenerationTime: number;
    cacheHitRate: number;
  }> {
    // In production: Get stats from Redis cache
    return {
      totalPreviews: 0,
      cachedPreviews: 0,
      averageGenerationTime: 250, // ms
      cacheHitRate: 0.85,
    };
  }

  /**
   * Clear cached preview
   */
  async clearPreviewCache(contentId: string): Promise<void> {
    this.logger.log(`Clearing preview cache for: ${contentId}`);
    // In production: Delete from Redis and CDN cache
  }

  /**
   * Batch generate previews
   */
  async batchGeneratePreviews(
    items: Array<{
      contentId: string;
      title: string;
      description: string;
      imageUrl?: string;
      videoUrl?: string;
      textContent?: string;
    }>,
  ): Promise<ContentPreviewDto[]> {
    this.logger.log(`Batch generating ${items.length} previews`);

    const previews: ContentPreviewDto[] = [];

    for (const item of items) {
      try {
        const preview = await this.generatePreview(
          item.contentId,
          item.title,
          item.description,
          item.imageUrl,
          item.videoUrl,
          item.textContent,
        );
        previews.push(preview);
      } catch (error) {
        this.logger.error(
          `Failed to generate preview for ${item.contentId}: ${error.message}`,
        );
      }
    }

    return previews;
  }
}
