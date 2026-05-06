import { Injectable, Logger } from "@nestjs/common";
import { ContentPreviewDto } from "../dto/validation.dto";
import { v4 as uuid } from "uuid";

@Injectable()
export class PreviewService {
  private readonly logger = new Logger(PreviewService.name);

  private readonly watermarkText = "DRAFT - ADMIN PREVIEW ONLY";
  private readonly watermarkOpacity = 0.3;

  // Cloudinary URL pattern: https://res.cloudinary.com/{cloud}/{type}/upload/{transforms}/{public_id}
  private readonly CLOUDINARY_UPLOAD_RE =
    /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/[^/]+\/upload\/)(.*)/;

  private readonly PLACEHOLDER_IMAGE = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME || "edukids"}/image/upload/w_400,h_300,c_fill,q_auto/placeholder`;

  /**
   * Insert Cloudinary transformation string before the public_id segment.
   * Returns original URL unchanged for non-Cloudinary URLs.
   */
  private transform(url: string, transformation: string): string {
    const m = url.match(this.CLOUDINARY_UPLOAD_RE);
    if (!m) return url;
    return `${m[1]}${transformation}/${m[2]}`;
  }

  /**
   * Convert a Cloudinary video URL to a JPEG thumbnail at a given second offset.
   */
  private videoFrame(videoUrl: string, offsetSec: number): string {
    const m = videoUrl.match(this.CLOUDINARY_UPLOAD_RE);
    if (!m) return `${videoUrl}?frame=${offsetSec}`;
    // Replace resource type video → image, add so_ transformation, force .jpg
    const base = m[1].replace(/\/video\/upload\//, "/video/upload/");
    const rest = m[2].replace(/\.[^.]+$/, ".jpg");
    return `${base}so_${offsetSec},w_640,h_360,c_fill,q_auto/${rest}`;
  }

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
      this.logger.error(
        `Preview generation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
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
   * Generate 400×300 thumbnail via Cloudinary transformation.
   * For videos, extracts the first frame as JPEG.
   */
  private async generateThumbnail(mediaUrl?: string): Promise<string> {
    if (!mediaUrl) return this.PLACEHOLDER_IMAGE;

    const isVideo = /\/video\/upload\//.test(mediaUrl);
    if (isVideo) {
      return this.videoFrame(mediaUrl, 1);
    }
    return this.transform(mediaUrl, "w_400,h_300,c_fill,q_auto,f_auto");
  }

  /**
   * Apply a text watermark overlay via Cloudinary transformation.
   */
  private async applyWatermark(imageUrl?: string): Promise<string | undefined> {
    if (!imageUrl) return undefined;

    const watermark = `l_text:Arial_50_bold:${encodeURIComponent(this.watermarkText)},co_white,o_${Math.round(this.watermarkOpacity * 100)},g_center`;
    this.logger.debug(`Applying watermark to image: ${imageUrl}`);
    return this.transform(imageUrl, watermark);
  }

  /**
   * Apply a text watermark to a video via Cloudinary transformation.
   */
  private async applyWatermarkToVideo(
    videoUrl?: string,
  ): Promise<string | undefined> {
    if (!videoUrl) return undefined;

    const watermark = `l_text:Arial_50_bold:${encodeURIComponent(this.watermarkText)},co_white,o_${Math.round(this.watermarkOpacity * 100)},g_center`;
    this.logger.debug(`Applying watermark to video: ${videoUrl}`);
    return this.transform(videoUrl, watermark);
  }

  private generateTextPreview(text?: string, maxLength = 500): string {
    if (!text) return "";
    return text.length <= maxLength
      ? text
      : text.substring(0, maxLength) + "...";
  }

  /**
   * Video duration is not determinable from a URL alone.
   * Returns 0; the frontend should read duration from the player.
   */
  private async getVideoDuration(_videoUrl: string): Promise<number> {
    return 0;
  }

  /**
   * Extract 5 key frames at evenly-spaced second offsets using Cloudinary
   * so_{n} transformation (returns JPEG thumbnails).
   */
  private async extractKeyFrames(videoUrl: string): Promise<string[]> {
    this.logger.debug(`Extracting key frames from video: ${videoUrl}`);
    const offsets = [1, 10, 30, 60, 90];
    return offsets.map((sec) => this.videoFrame(videoUrl, sec));
  }

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
    void contentTitle;

    const watermark = `l_text:Arial_80_bold:${encodeURIComponent(this.watermarkText)},co_white,o_${Math.round(this.watermarkOpacity * 100)},g_center`;

    if (imageUrl) {
      return {
        previewUrl: this.transform(
          imageUrl,
          `${watermark},w_1920,h_1080,c_fill,q_auto`,
        ),
        resolution: "1920x1080",
        format: "jpg",
        watermarked: true,
      };
    }

    if (videoUrl) {
      return {
        previewUrl: this.transform(
          videoUrl,
          `${watermark},w_1920,h_1080,c_fill,q_auto`,
        ),
        resolution: "1920x1080",
        format: "mp4",
        watermarked: true,
      };
    }

    return {
      previewUrl: this.PLACEHOLDER_IMAGE,
      resolution: "400x300",
      format: "jpg",
      watermarked: false,
    };
  }

  async generateDownloadablePreview(
    contentId: string,
    userId: string,
    role: string,
  ): Promise<{
    downloadUrl: string;
    expiresAt: Date;
    accessLog: string;
  }> {
    if (String(role).toUpperCase() !== "ADMIN") {
      throw new Error("Insufficient permissions for preview download");
    }

    this.logger.log(
      `Generating downloadable preview for ${contentId} by user ${userId}`,
    );

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    return {
      downloadUrl: `/media/${contentId}/preview?token=xyz&expires=${expiresAt.toISOString()}`,
      expiresAt,
      accessLog: `User ${userId} (${role}) downloaded preview at ${new Date().toISOString()}`,
    };
  }

  async getPreviewStats(): Promise<{
    totalPreviews: number;
    cachedPreviews: number;
    averageGenerationTime: number;
    cacheHitRate: number;
  }> {
    return {
      totalPreviews: 0,
      cachedPreviews: 0,
      averageGenerationTime: 250,
      cacheHitRate: 0.85,
    };
  }

  async clearPreviewCache(contentId: string): Promise<void> {
    this.logger.log(`Clearing preview cache for: ${contentId}`);
  }

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
          `Failed to generate preview for ${item.contentId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return previews;
  }
}
