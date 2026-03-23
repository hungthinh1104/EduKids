import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import {
  ContentValidationRequestDto,
  ContentValidationResponseDto,
  SafetyFlagDto,
  ValidationStatus,
  SafetySeverity,
  SafetyFlagType,
} from "../dto/validation.dto";
import { SafetyValidationService } from "./safety-validation.service";
import { randomUUID } from "crypto";
import { ValidationRepository } from "../repository/validation.repository";

/**
 * Content Validation Service
 * Orchestrates validation of content across multiple dimensions
 * Implements NFR-03: Zero-tolerance child safety policy
 */
@Injectable()
export class ContentValidationService {
  private readonly logger = new Logger(ContentValidationService.name);

  constructor(
    private validationRepository: ValidationRepository,
    private safetyService: SafetyValidationService,
  ) {}

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Unknown error";
  }

  private parseRecommendations(raw: string | null): string[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as string[]) : [String(parsed)];
    } catch {
      return [raw];
    }
  }

  /**
   * Validate single content item
   */
  async validateContent(
    request: ContentValidationRequestDto,
  ): Promise<ContentValidationResponseDto> {
    const validationId = randomUUID();
    const startTime = Date.now();

    try {
      if (!request.contentId) {
        throw new BadRequestException("contentId is required");
      }

      this.logger.log(`Starting validation for content: ${request.contentId}`);

      // Collect all safety flags from different sources
      const allFlags: SafetyFlagDto[] = [];

      // Validate text content
      if (request.text) {
        const textFlags = await this.safetyService.validateTextContent(
          request.text,
          request.contentId,
        );
        allFlags.push(...textFlags);
      }

      // Validate title and description
      if (request.title) {
        const titleFlags = await this.safetyService.validateTextContent(
          request.title,
          `${request.contentId}:title`,
        );
        allFlags.push(...titleFlags);
      }

      if (request.description) {
        const descFlags = await this.safetyService.validateTextContent(
          request.description,
          `${request.contentId}:desc`,
        );
        allFlags.push(...descFlags);
      }

      // Validate image
      if (request.imageUrl) {
        const imageFlags = await this.safetyService.validateImageContent(
          request.imageUrl,
          request.contentId,
        );
        allFlags.push(...imageFlags);
      }

      // Validate video
      if (request.videoUrl) {
        const videoFlags = await this.safetyService.validateVideoContent(
          request.videoUrl,
          request.contentId,
        );
        allFlags.push(...videoFlags);
      }

      // Validate audio
      if (request.audioUrl) {
        const audioFlags = await this.safetyService.validateAudioTranscript(
          "", // In production, would transcribe first
          request.contentId,
        );
        allFlags.push(...audioFlags);
      }

      // Calculate safety score
      const safetyScore = this.safetyService.calculateSafetyScore(allFlags);
      const shouldAutoBlock = this.safetyService.shouldAutoBlock(allFlags);

      // Determine validation status
      let status = ValidationStatus.APPROVED;
      if (allFlags.length > 0) {
        if (shouldAutoBlock) {
          status = ValidationStatus.AUTO_FLAGGED;
        } else if (allFlags.some((f) => f.severity === SafetySeverity.HIGH)) {
          status = ValidationStatus.IN_REVIEW;
        } else {
          status = ValidationStatus.IN_REVIEW;
        }
      }

      const validationTime = Date.now() - startTime;

      // Save validation result
      const response: ContentValidationResponseDto = {
        validationId,
        contentId: request.contentId,
        status,
        isApproved: status === ValidationStatus.APPROVED,
        hasAutoFlags: shouldAutoBlock,
        safetyFlags: allFlags,
        safetyScore,
        recommendations: this.generateRecommendations(allFlags),
        detailedReport: this.generateDetailedReport(allFlags, safetyScore),
        validatedAt: new Date().toISOString(),
        validationTimeMs: validationTime,
      };

      // Store in database
      await this.saveValidationResult(validationId, response, request);

      this.logger.log(
        `Validation complete for ${request.contentId}: status=${status}, score=${safetyScore}, flags=${allFlags.length}, time=${validationTime}ms`,
      );

      return response;
    } catch (error: unknown) {
      this.logger.error(
        `Validation failed for ${request.contentId}: ${this.getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  /**
   * Batch validate multiple content items
   */
  async batchValidateContent(
    requests: ContentValidationRequestDto[],
  ): Promise<ContentValidationResponseDto[]> {
    this.logger.log(`Starting batch validation for ${requests.length} items`);

    const results: ContentValidationResponseDto[] = [];

    for (const request of requests) {
      try {
        const result = await this.validateContent(request);
        results.push(result);
      } catch (error: unknown) {
        this.logger.error(
          `Batch validation error for ${request.contentId}: ${this.getErrorMessage(error)}`,
        );
        // Continue with other items even if one fails
      }
    }

    this.logger.log(
      `Batch validation complete: ${results.length}/${requests.length} successful`,
    );
    return results;
  }

  /**
   * Get validation result by ID
   */
  async getValidationResult(
    validationId: string,
  ): Promise<ContentValidationResponseDto | null> {
    const result = await this.validationRepository.findValidationById(
      validationId,
    );

    if (!result) return null;

    return {
      validationId: result.id,
      contentId: result.contentId,
      status: result.status as ValidationStatus,
      isApproved: result.isApproved,
      hasAutoFlags: result.hasAutoFlags,
      safetyFlags: result.safetyFlags.map((flag) => ({
        flagId: flag.id,
        type: flag.type as SafetyFlagType,
        severity: flag.severity as SafetySeverity,
        description: flag.description,
        detectedText: flag.detectedText || undefined,
        confidence: flag.confidence ? Number(flag.confidence) : undefined,
        isAutoDetected: flag.isAutoDetected,
        suggestedAction: flag.suggestedAction || undefined,
        detectedAt: flag.detectedAt.toISOString(),
      })),
      safetyScore: result.safetyScore,
      recommendations: this.parseRecommendations(result.recommendations),
      detailedReport: result.detailedReport || undefined,
      validatedAt: result.validatedAt.toISOString(),
      validationTimeMs: result.validationTimeMs,
    };
  }

  /**
   * Get validation history for content
   */
  async getContentValidationHistory(contentId: string, limit = 10) {
    return this.validationRepository.findValidationHistory(contentId, limit);
  }

  /**
   * Get all auto-flagged content
   */
  async getAutoFlaggedContent(limit = 50) {
    return this.validationRepository.findAutoFlaggedContent(limit);
  }

  /**
   * Get pending review content
   */
  async getPendingReview(limit = 50) {
    return this.validationRepository.findPendingReview(limit);
  }

  /**
   * Get validation statistics
   */
  async getValidationStats(): Promise<{
    totalValidations: number;
    approved: number;
    rejected: number;
    flagged: number;
    averageSafetyScore: number;
    flagTypeDistribution: { [key: string]: number };
  }> {
    const stats = await this.validationRepository.getValidationStats();
    return {
      totalValidations: stats.totalValidations,
      approved: stats.approved,
      rejected: stats.rejected,
      flagged: stats.flagged,
      averageSafetyScore: stats.averageSafetyScore,
      flagTypeDistribution: stats.flagTypeDistribution,
    };
  }

  /**
   * Generate recommendations based on flags
   */
  private generateRecommendations(safetyFlags: SafetyFlagDto[]): string[] {
    const recommendations: string[] = [];

    if (safetyFlags.length === 0) {
      return ["Content appears safe for all ages."];
    }

    const hasCritical = safetyFlags.some(
      (f: SafetyFlagDto) => f.severity === SafetySeverity.CRITICAL,
    );
    const hasHigh = safetyFlags.some(
      (f: SafetyFlagDto) => f.severity === SafetySeverity.HIGH,
    );
    const hasMultiple = safetyFlags.length > 3;

    if (hasCritical) {
      recommendations.push(
        "CRITICAL: Do not publish. Content contains prohibited material.",
      );
      recommendations.push("Please remove flagged content and resubmit.");
    } else if (hasHigh) {
      recommendations.push("REVIEW REQUIRED: Submit for manual admin review.");
      recommendations.push(
        "Consider revising content based on flagged issues.",
      );
    } else if (hasMultiple) {
      recommendations.push("CAUTION: Multiple minor issues detected.");
      recommendations.push(
        "Review and address flagged content before publishing.",
      );
    } else {
      recommendations.push(
        "Minor issues detected. Consider addressing flagged items.",
      );
    }

    // Add specific recommendations based on flag types
    for (const flag of safetyFlags) {
      if (flag.suggestedAction) {
        recommendations.push(`• ${flag.suggestedAction}`);
      }
    }

    return recommendations;
  }

  /**
   * Generate detailed validation report
   */
  private generateDetailedReport(
    safetyFlags: SafetyFlagDto[],
    safetyScore: number,
  ): string {
    let report = `# Content Validation Report\n\n`;
    report += `## Safety Score: ${safetyScore}/100\n\n`;

    if (safetyScore >= 80) {
      report += `Status: **SAFE** - Content is appropriate for all ages.\n\n`;
    } else if (safetyScore >= 60) {
      report += `Status: **CAUTION** - Content requires review before publishing.\n\n`;
    } else {
      report += `Status: **UNSAFE** - Content contains critical safety issues.\n\n`;
    }

    if (safetyFlags.length === 0) {
      report += `No safety issues detected.\n`;
      return report;
    }

    report += `## Detected Issues (${safetyFlags.length} total)\n\n`;

    // Group by severity
    const bySeverity = {
      [SafetySeverity.CRITICAL]: safetyFlags.filter(
        (f: SafetyFlagDto) => f.severity === SafetySeverity.CRITICAL,
      ),
      [SafetySeverity.HIGH]: safetyFlags.filter(
        (f: SafetyFlagDto) => f.severity === SafetySeverity.HIGH,
      ),
      [SafetySeverity.MEDIUM]: safetyFlags.filter(
        (f: SafetyFlagDto) => f.severity === SafetySeverity.MEDIUM,
      ),
      [SafetySeverity.LOW]: safetyFlags.filter(
        (f: SafetyFlagDto) => f.severity === SafetySeverity.LOW,
      ),
    };

    for (const [severity, severityFlags] of Object.entries(bySeverity)) {
      if (severityFlags.length > 0) {
        report += `### ${severity} Severity (${severityFlags.length})\n`;
        for (const flag of severityFlags) {
          report += `- **${flag.type}**: ${flag.description}\n`;
          report += `  - Confidence: ${(((flag.confidence || 0) as number) * 100).toFixed(0)}%\n`;
          if (flag.detectedText) {
            report += `  - Detected: "${flag.detectedText}"\n`;
          }
          if (flag.suggestedAction) {
            report += `  - Action: ${flag.suggestedAction}\n`;
          }
        }
        report += `\n`;
      }
    }

    return report;
  }

  /**
   * Save validation result to database
   */
  private async saveValidationResult(
    validationId: string,
    response: ContentValidationResponseDto,
    request: ContentValidationRequestDto,
  ): Promise<void> {
    try {
      await this.validationRepository.createValidation({
        id: validationId,
        contentId: response.contentId,
        status: response.status,
        isApproved: response.isApproved,
        hasAutoFlags: response.hasAutoFlags,
        safetyScore: response.safetyScore,
        recommendations: JSON.stringify(response.recommendations),
        detailedReport: response.detailedReport ?? "",
        validationTimeMs: response.validationTimeMs ?? 0,
        validatedAt: new Date(response.validatedAt),
        contentType: request.contentType,
        contentTitle: request.title,
        flags: response.safetyFlags,
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to save validation result: ${this.getErrorMessage(error)}`,
      );
      // Don't throw - validation was successful, just storage failed
    }
  }
}
