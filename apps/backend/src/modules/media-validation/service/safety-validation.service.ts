import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  SafetyFlagDto,
  SafetyFlagType,
  SafetySeverity,
} from "../dto/validation.dto";

/**
 * Content Safety Validation Service
 * Detects profanity, violent content, explicit material, and other unsafe content
 * Implements NFR-03: Zero-tolerance child safety policy
 */
@Injectable()
export class SafetyValidationService {
  private readonly logger = new Logger(SafetyValidationService.name);

  // Profanity word lists (simplified - in production use external API)
  private readonly profanityList = [
    "fuck",
    "fucking",
    "bitch",
    "shit",
    "asshole",
    "cunt",
    "dick",
    "đụ",
    "cặc",
    "lồn",
    "địt",
    "đéo",
    "chó đẻ",
    "offensive",
    "inappropriate",
  ];

  // Suspicious keywords (violence, explicit, etc.)
  private readonly violenceKeywords = [
    "kill",
    "destroy",
    "violence",
    "fight",
    "blood",
    "gun",
    "weapon",
  ];

  private readonly explicitKeywords = [
    "adult",
    "explicit",
    "nsfw",
    "xxx",
    "nude",
    "sexual",
  ];

  private readonly hateSpeechKeywords = [
    "racist",
    "sexist",
    "discriminate",
    "hate",
    "slur",
  ];

  constructor(private configService: ConfigService) {}

  /**
   * Validate text content for safety issues
   */
  async validateTextContent(
    text: string,
    contentId: string,
  ): Promise<SafetyFlagDto[]> {
    const safetyFlags: SafetyFlagDto[] = [];

    if (!text) return safetyFlags;

    const lowerText = text.toLowerCase();

    // Check for profanity
    const profanityFlags = this.detectProfanity(text, lowerText, contentId);
    safetyFlags.push(...profanityFlags);

    // Check for violence
    const violenceFlags = this.detectViolence(lowerText, contentId);
    safetyFlags.push(...violenceFlags);

    // Check for explicit content
    const explicitFlags = this.detectExplicitContent(lowerText, contentId);
    safetyFlags.push(...explicitFlags);

    // Check for hate speech
    const hateSpeechFlags = this.detectHateSpeech(lowerText, contentId);
    safetyFlags.push(...hateSpeechFlags);

    // Check for personal information
    const piFlags = this.detectPersonalInfo(text, contentId);
    safetyFlags.push(...piFlags);

    // Check for external links
    const linkFlags = this.detectExternalLinks(text, contentId);
    safetyFlags.push(...linkFlags);

    // Check for suspicious claims
    const claimFlags = this.detectMisleadingClaims(text, contentId);
    safetyFlags.push(...claimFlags);

    this.logger.debug(
      `Text validation found ${safetyFlags.length} safetyFlags for ${contentId}`,
    );
    return safetyFlags;
  }

  /**
   * Validate image content for safety issues
   * In production, would call Google Vision API or similar
   */
  async validateImageContent(
    imageUrl: string,
    contentId: string,
  ): Promise<SafetyFlagDto[]> {
    const safetyFlags: SafetyFlagDto[] = [];

    try {
      // In production: Call Google Vision API
      // const result = await vision.safeSearchDetection(imageUrl);
      // Check for ADULT, MEDICAL, RACY, SPOOF, VIOLENCE, etc.

      // For now, simulate validation
      if (imageUrl.includes("unsafe")) {
        safetyFlags.push({
          flagId: `safety:${contentId}:image:1`,
          type: SafetyFlagType.EXPLICIT_CONTENT,
          severity: SafetySeverity.CRITICAL,
          description: "Image detected as containing explicit content",
          confidence: 0.95,
          isAutoDetected: true,
          detectedAt: new Date().toISOString(),
        });
      }

      this.logger.debug(
        `Image validation found ${safetyFlags.length} safetyFlags for ${contentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Image validation error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return safetyFlags;
  }

  /**
   * Validate video content for safety issues
   * Would transcribe audio and check visuals
   */
  async validateVideoContent(
    videoUrl: string,
    contentId: string,
  ): Promise<SafetyFlagDto[]> {
    const safetyFlags: SafetyFlagDto[] = [];

    try {
      // In production:
      // 1. Extract frames from video
      // 2. Check frames with image safety API
      // 3. Extract and transcribe audio
      // 4. Validate audio transcript with text safety checks

      // Current fallback mode (no transcript service integrated):
      // DO NOT validate using the raw video URL string as transcript,
      // because URLs naturally contain patterns that trigger false positives
      // (e.g. external-link keywords), causing valid topics to be rejected.
      // Keep this check no-op until real transcript content is available.
      if (videoUrl.includes("unsafe")) {
        safetyFlags.push({
          flagId: `safety:${contentId}:video:1`,
          type: SafetyFlagType.EXPLICIT_CONTENT,
          severity: SafetySeverity.CRITICAL,
          description: "Video detected as containing unsafe content",
          confidence: 0.95,
          isAutoDetected: true,
          detectedAt: new Date().toISOString(),
        });
      }

      this.logger.debug(
        `Video validation found ${safetyFlags.length} safetyFlags for ${contentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Video validation error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return safetyFlags;
  }

  /**
   * Validate audio content and transcript
   */
  async validateAudioTranscript(
    transcript: string,
    contentId: string,
  ): Promise<SafetyFlagDto[]> {
    const safetyFlags: SafetyFlagDto[] = [];

    try {
      // In production: Use speech-to-text service
      // For now, validate transcript if provided

      if (transcript) {
        const textFlags = await this.validateTextContent(transcript, contentId);
        safetyFlags.push(...textFlags);
      }

      this.logger.debug(
        `Audio validation found ${safetyFlags.length} safetyFlags for ${contentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Audio validation error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return safetyFlags;
  }

  /**
   * Calculate overall safety score (0-100, higher = safer)
   */
  calculateSafetyScore(safetyFlags: SafetyFlagDto[]): number {
    let score = 100;

    for (const flag of safetyFlags) {
      switch (flag.severity) {
        case SafetySeverity.CRITICAL:
          score -= 40;
          break;
        case SafetySeverity.HIGH:
          score -= 20;
          break;
        case SafetySeverity.MEDIUM:
          score -= 10;
          break;
        case SafetySeverity.LOW:
          score -= 3;
          break;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Determine if content should auto-block (critical issues)
   */
  shouldAutoBlock(safetyFlags: SafetyFlagDto[]): boolean {
    // Auto-block if any CRITICAL severity safetyFlags
    return safetyFlags.some(
      (flag) => flag.severity === SafetySeverity.CRITICAL,
    );
  }

  /**
   * Detect profanity in text
   */
  private detectProfanity(
    text: string,
    lowerText: string,
    contentId: string,
  ): SafetyFlagDto[] {
    const safetyFlags: SafetyFlagDto[] = [];

    // Split text into words and check against profanity list (using unicode support for Vietnamese)
    const words = text.split(/\s+/);
    const profanities: string[] = [];

    for (const word of words) {
      // Remove only punctuation, keep unicode characters intact
      const cleanWord = word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
      if (this.profanityList.includes(cleanWord)) {
        profanities.push(word);
      }
    }

    if (profanities.length > 0) {
      safetyFlags.push({
        flagId: `safety:${contentId}:profanity:${Date.now()}`,
        type: SafetyFlagType.PROFANITY,
        severity:
          profanities.length > 5 ? SafetySeverity.HIGH : SafetySeverity.MEDIUM,
        description: `Detected ${profanities.length} profane word(s)`,
        detectedText: profanities.join(", "),
        confidence: 0.9,
        isAutoDetected: true,
        suggestedAction: "Edit text to remove profanity",
        detectedAt: new Date().toISOString(),
      });
    }

    return safetyFlags;
  }

  /**
   * Detect violence keywords
   */
  private detectViolence(
    lowerText: string,
    contentId: string,
  ): SafetyFlagDto[] {
    const safetyFlags: SafetyFlagDto[] = [];

    for (const keyword of this.violenceKeywords) {
      if (lowerText.includes(keyword)) {
        safetyFlags.push({
          flagId: `safety:${contentId}:violence:${Date.now()}`,
          type: SafetyFlagType.VIOLENCE,
          severity: SafetySeverity.CRITICAL,
          description: `Content contains violence reference: "${keyword}"`,
          detectedText: keyword,
          confidence: 0.8,
          isAutoDetected: true,
          suggestedAction: "Replace with age-appropriate content",
          detectedAt: new Date().toISOString(),
        });
        break; // Only flag once
      }
    }

    return safetyFlags;
  }

  /**
   * Detect explicit content keywords
   */
  private detectExplicitContent(
    lowerText: string,
    contentId: string,
  ): SafetyFlagDto[] {
    const safetyFlags: SafetyFlagDto[] = [];

    for (const keyword of this.explicitKeywords) {
      if (lowerText.includes(keyword)) {
        safetyFlags.push({
          flagId: `safety:${contentId}:explicit:${Date.now()}`,
          type: SafetyFlagType.EXPLICIT_CONTENT,
          severity: SafetySeverity.CRITICAL,
          description: `Content contains explicit reference: "${keyword}"`,
          detectedText: keyword,
          confidence: 0.85,
          isAutoDetected: true,
          suggestedAction: "Remove explicit content",
          detectedAt: new Date().toISOString(),
        });
        break; // Only flag once
      }
    }

    return safetyFlags;
  }

  /**
   * Detect hate speech
   */
  private detectHateSpeech(
    lowerText: string,
    contentId: string,
  ): SafetyFlagDto[] {
    const safetyFlags: SafetyFlagDto[] = [];

    for (const keyword of this.hateSpeechKeywords) {
      if (lowerText.includes(keyword)) {
        safetyFlags.push({
          flagId: `safety:${contentId}:hate:${Date.now()}`,
          type: SafetyFlagType.HATE_SPEECH,
          severity: SafetySeverity.CRITICAL,
          description: `Content may contain hate speech: "${keyword}"`,
          detectedText: keyword,
          confidence: 0.7,
          isAutoDetected: true,
          suggestedAction: "Review and remove offensive content",
          detectedAt: new Date().toISOString(),
        });
        break; // Only flag once
      }
    }

    return safetyFlags;
  }

  /**
   * Detect personal information (emails, phone numbers, addresses)
   */
  private detectPersonalInfo(text: string, contentId: string): SafetyFlagDto[] {
    const safetyFlags: SafetyFlagDto[] = [];

    // Email regex
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailRegex);
    if (emails) {
      safetyFlags.push({
        flagId: `safety:${contentId}:email:${Date.now()}`,
        type: SafetyFlagType.PERSONAL_INFO,
        severity: SafetySeverity.HIGH,
        description: `Content contains email address(es)`,
        detectedText: emails.join(", "),
        confidence: 0.99,
        isAutoDetected: true,
        suggestedAction: "Remove email addresses for privacy",
        detectedAt: new Date().toISOString(),
      });
    }

    // Phone number regex (US format as example)
    const phoneRegex = /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/g;
    const phones = text.match(phoneRegex);
    if (phones) {
      safetyFlags.push({
        flagId: `safety:${contentId}:phone:${Date.now()}`,
        type: SafetyFlagType.PERSONAL_INFO,
        severity: SafetySeverity.HIGH,
        description: `Content contains phone number(s)`,
        detectedText: phones.join(", "),
        confidence: 0.9,
        isAutoDetected: true,
        suggestedAction: "Remove phone numbers for privacy",
        detectedAt: new Date().toISOString(),
      });
    }

    return safetyFlags;
  }

  /**
   * Detect external links
   */
  private detectExternalLinks(
    text: string,
    contentId: string,
  ): SafetyFlagDto[] {
    const safetyFlags: SafetyFlagDto[] = [];

    // URL regex
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);
    if (urls) {
      safetyFlags.push({
        flagId: `safety:${contentId}:links:${Date.now()}`,
        type: SafetyFlagType.EXTERNAL_LINKS,
        severity: SafetySeverity.MEDIUM,
        description: `Content contains ${urls.length} external link(s)`,
        detectedText: urls.join(", "),
        confidence: 0.99,
        isAutoDetected: true,
        suggestedAction: "Review external links for appropriateness",
        detectedAt: new Date().toISOString(),
      });
    }

    return safetyFlags;
  }

  /**
   * Detect misleading or unverified claims
   */
  private detectMisleadingClaims(
    text: string,
    contentId: string,
  ): SafetyFlagDto[] {
    const safetyFlags: SafetyFlagDto[] = [];

    // Look for common misleading phrases
    const suspiciousPhrases = [
      "guaranteed cure",
      "scientifically proven",
      "doctors hate",
      "big pharma",
    ];

    const lowerText = text.toLowerCase();
    for (const phrase of suspiciousPhrases) {
      if (lowerText.includes(phrase)) {
        safetyFlags.push({
          flagId: `safety:${contentId}:misleading:${Date.now()}`,
          type: SafetyFlagType.UNVERIFIED_CLAIMS,
          severity: SafetySeverity.MEDIUM,
          description: `Content may contain unverified claims`,
          detectedText: phrase,
          confidence: 0.6,
          isAutoDetected: true,
          suggestedAction: "Verify and cite credible sources",
          detectedAt: new Date().toISOString(),
        });
        break; // Only flag once
      }
    }

    return safetyFlags;
  }

  /**
   * Get safety validation rules for documentation
   */
  getSafetyRules(): {
    [key: string]: string[];
  } {
    return {
      PROFANITY: this.profanityList,
      VIOLENCE: this.violenceKeywords,
      EXPLICIT: this.explicitKeywords,
      HATE_SPEECH: this.hateSpeechKeywords,
    };
  }

  /**
   * Update safety rules (for admin configuration)
   */
  updateSafetyRules(category: string, rules: string[]): void {
    switch (category) {
      case "PROFANITY":
        this.profanityList.push(...rules);
        break;
      case "VIOLENCE":
        this.violenceKeywords.push(...rules);
        break;
      case "EXPLICIT":
        this.explicitKeywords.push(...rules);
        break;
      case "HATE_SPEECH":
        this.hateSpeechKeywords.push(...rules);
        break;
    }

    this.logger.log(`Updated ${category} safety rules`);
  }
}
