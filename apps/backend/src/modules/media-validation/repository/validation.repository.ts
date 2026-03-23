import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { SafetyFlagDto } from "../dto/validation.dto";
import { ValidationStatus } from "../dto/validation.dto";

/**
 * Validation Repository
 * Data access layer for content validation records
 */
@Injectable()
export class ValidationRepository {
  private readonly logger = new Logger(ValidationRepository.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create validation record
   */
  async createValidation(data: {
    id: string;
    contentId: string;
    status: string;
    isApproved: boolean;
    hasAutoFlags: boolean;
    safetyScore: number;
    recommendations: string;
    detailedReport: string;
    validationTimeMs: number;
    validatedAt: Date;
    contentType: string;
    contentTitle?: string;
    flags?: SafetyFlagDto[];
  }) {
    return this.prisma.contentValidation.create({
      data: {
        id: data.id,
        contentId: data.contentId,
        status: data.status as ValidationStatus,
        isApproved: data.isApproved,
        hasAutoFlags: data.hasAutoFlags,
        safetyScore: data.safetyScore,
        recommendations: data.recommendations,
        detailedReport: data.detailedReport,
        validationTimeMs: data.validationTimeMs,
        validatedAt: data.validatedAt,
        contentType: data.contentType,
        contentTitle: data.contentTitle,
        safetyFlags: data.flags?.length
          ? {
              createMany: {
                data: data.flags.map((flag) => ({
                  id: flag.flagId,
                  type: flag.type,
                  severity: flag.severity,
                  description: flag.description,
                  detectedText: flag.detectedText,
                  confidence: flag.confidence,
                  isAutoDetected: flag.isAutoDetected,
                  suggestedAction: flag.suggestedAction,
                })),
              },
            }
          : undefined,
      },
      include: { safetyFlags: true },
    });
  }

  /**
   * Find validation by ID
   */
  async findValidationById(id: string) {
    return this.prisma.contentValidation.findUnique({
      where: { id },
      include: { safetyFlags: true },
    });
  }

  /**
   * Find latest validation for content
   */
  async findLatestValidation(contentId: string) {
    return this.prisma.contentValidation.findFirst({
      where: { contentId },
      orderBy: { validatedAt: "desc" },
      include: { safetyFlags: true },
    });
  }

  /**
   * Find all validations for content
   */
  async findValidationHistory(contentId: string, limit = 10) {
    return this.prisma.contentValidation.findMany({
      where: { contentId },
      orderBy: { validatedAt: "desc" },
      take: limit,
      include: { safetyFlags: true },
    });
  }

  /**
   * Find all auto-flagged content
   */
  async findAutoFlaggedContent(limit = 50) {
    return this.prisma.contentValidation.findMany({
      where: {
        hasAutoFlags: true,
        status: ValidationStatus.AUTO_FLAGGED,
      },
      orderBy: { validatedAt: "desc" },
      take: limit,
      include: { safetyFlags: true },
    });
  }

  /**
   * Find content pending review
   */
  async findPendingReview(limit = 50) {
    return this.prisma.contentValidation.findMany({
      where: {
        status: {
          in: [ValidationStatus.IN_REVIEW, ValidationStatus.AUTO_FLAGGED],
        },
      },
      orderBy: { validatedAt: "desc" },
      take: limit,
      include: { safetyFlags: true },
    });
  }

  /**
   * Update validation status
   */
  async updateValidationStatus(
    id: string,
    status: ValidationStatus,
    isApproved: boolean,
  ) {
    return this.prisma.contentValidation.update({
      where: { id },
      data: { status, isApproved },
    });
  }

  /**
   * Get validation statistics
   */
  async getValidationStats() {
    const validations = await this.prisma.contentValidation.findMany();
    const flags = await this.prisma.safetyFlag.findMany();

    const stats = {
      totalValidations: validations.length,
      approved: validations.filter(
        (v) => v.status === ValidationStatus.APPROVED,
      ).length,
      rejected: validations.filter(
        (v) => v.status === ValidationStatus.REJECTED,
      ).length,
      flagged: validations.filter((v) => v.hasAutoFlags).length,
      inReview: validations.filter(
        (v) =>
          v.status === ValidationStatus.IN_REVIEW ||
          v.status === ValidationStatus.AUTO_FLAGGED,
      ).length,
      averageSafetyScore:
        validations.length > 0
          ? validations.reduce((sum, v) => sum + v.safetyScore, 0) /
            validations.length
          : 100,
      averageValidationTime:
        validations.length > 0
          ? validations.reduce((sum, v) => sum + v.validationTimeMs, 0) /
            validations.length
          : 0,
      flagTypeDistribution: {} as { [key: string]: number },
      contentTypeDistribution: {} as { [key: string]: number },
    };

    // Calculate flag type distribution
    for (const flag of flags) {
      stats.flagTypeDistribution[flag.type] =
        (stats.flagTypeDistribution[flag.type] || 0) + 1;
    }

    // Calculate content type distribution
    for (const validation of validations) {
      if (validation.contentType) {
        stats.contentTypeDistribution[validation.contentType] =
          (stats.contentTypeDistribution[validation.contentType] || 0) + 1;
      }
    }

    return stats;
  }

  /**
   * Get daily validation trends
   */
  async getDailyValidationTrends(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const validations = await this.prisma.contentValidation.findMany({
      where: {
        validatedAt: {
          gte: startDate,
        },
      },
    });

    // Group by date
    const trends: {
      [key: string]: { validated: number; approved: number; rejected: number };
    } = {};

    for (const validation of validations) {
      const date = validation.validatedAt.toISOString().split("T")[0];

      if (!trends[date]) {
        trends[date] = { validated: 0, approved: 0, rejected: 0 };
      }

      trends[date].validated++;

      if (validation.isApproved) {
        trends[date].approved++;
      } else if (validation.status === ValidationStatus.REJECTED) {
        trends[date].rejected++;
      }
    }

    return Object.entries(trends).map(([date, data]) => ({
      date,
      ...data,
    }));
  }

  /**
   * Get safety score distribution
   */
  async getSafetyScoreDistribution() {
    const validations = await this.prisma.contentValidation.findMany();

    const distribution = {
      veryLow: 0, // 0-20
      low: 0, // 21-40
      medium: 0, // 41-60
      high: 0, // 61-80
      veryHigh: 0, // 81-100
    };

    for (const validation of validations) {
      const score = validation.safetyScore;

      if (score <= 20) distribution.veryLow++;
      else if (score <= 40) distribution.low++;
      else if (score <= 60) distribution.medium++;
      else if (score <= 80) distribution.high++;
      else distribution.veryHigh++;
    }

    return distribution;
  }

  /**
   * Find content by safety score range
   */
  async findContentByScoreRange(
    minScore: number,
    maxScore: number,
    limit = 50,
  ) {
    return this.prisma.contentValidation.findMany({
      where: {
        safetyScore: {
          gte: minScore,
          lte: maxScore,
        },
      },
      orderBy: { safetyScore: "asc" },
      take: limit,
      include: { safetyFlags: true },
    });
  }

  /**
   * Delete old validations (cleanup)
   */
  async deleteOldValidations(daysOld: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.contentValidation.deleteMany({
      where: {
        validatedAt: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(
      `Deleted ${result.count} validations older than ${daysOld} days`,
    );

    return result;
  }

  /**
   * Find most common issues
   */
  async getMostCommonIssues(limit = 10) {
    const flags = await this.prisma.safetyFlag.findMany();

    const issueMap: { [key: string]: { count: number; severity: string } } = {};

    for (const flag of flags) {
      if (!issueMap[flag.type]) {
        issueMap[flag.type] = { count: 0, severity: flag.severity };
      }
      issueMap[flag.type].count++;
    }

    return Object.entries(issueMap)
      .map(([type, data]) => ({
        type,
        count: data.count,
        severity: data.severity,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Find false positives (approved content with flags)
   */
  async findFalsePositives(limit = 50) {
    return this.prisma.contentValidation.findMany({
      where: {
        hasAutoFlags: true,
        status: ValidationStatus.APPROVED,
      },
      orderBy: { validatedAt: "desc" },
      take: limit,
      include: { safetyFlags: true },
    });
  }

  /**
   * Search validations by content ID or title
   */
  async searchValidations(query: string, limit = 50) {
    return this.prisma.contentValidation.findMany({
      where: {
        OR: [
          { contentId: { contains: query, mode: "insensitive" } },
          { contentTitle: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { validatedAt: "desc" },
      take: limit,
      include: { safetyFlags: true },
    });
  }

  /**
   * Get content validation report
   */
  async getValidationReport(contentId: string) {
    const validations = await this.findValidationHistory(contentId, 100);
    const latest = validations[0];

    if (!latest) {
      return null;
    }

    const report = {
      contentId,
      latestValidation: latest,
      totalValidations: validations.length,
      validationHistory: validations,
      safetyTrend:
        validations.length > 1
          ? {
              previous: validations[1].safetyScore,
              current: validations[0].safetyScore,
              improvement:
                validations[0].safetyScore - validations[1].safetyScore,
            }
          : null,
      mostCommonIssues: latest.safetyFlags.map((f) => ({
        type: f.type,
        severity: f.severity,
        count: validations.filter((v) =>
          v.safetyFlags.some((vf) => vf.type === f.type),
        ).length,
      })),
    };

    return report;
  }
}
