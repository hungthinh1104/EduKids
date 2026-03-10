import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  ApprovalRequestDto,
  ApprovalResponseDto,
  ApprovalDecision,
  ValidationStatus,
  RejectionReasonDto,
} from "../dto/validation.dto";

/**
 * Approval Service
 * Manages content approval workflow and admin decisions
 * Tracks all approval history for audit trail
 */
@Injectable()
export class ApprovalService {
  private readonly logger = new Logger(ApprovalService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Approve content for publishing
   */
  async approveContent(
    request: ApprovalRequestDto,
  ): Promise<ApprovalResponseDto> {
    try {
      const approvalId = randomUUID();

      if (!request.contentId || !request.approvedBy) {
        throw new BadRequestException("contentId and approvedBy are required");
      }

      this.logger.log(
        `Approving content ${request.contentId} by user ${request.approvedBy}`,
      );

      // Verify validation passed (no critical flags)
      const validation = await this.prisma.contentValidation.findFirst({
        where: { contentId: request.contentId },
        orderBy: { validatedAt: "desc" },
      });

      if (
        validation?.hasAutoFlags &&
        validation.status === ValidationStatus.AUTO_FLAGGED
      ) {
        throw new BadRequestException(
          "Cannot approve content with auto-flagged critical issues",
        );
      }

      // Create approval record
      await this.prisma.contentApproval.create({
        data: {
          id: approvalId,
          contentId: request.contentId,
          decision: request.decision || ApprovalDecision.APPROVE,
          approvedBy: request.approvedBy,
          comments: request.comments || "",
          conditionsTags: request.conditionsTags || [],
          scheduledPublishAt: request.scheduledPublishAt,
        },
      });

      // Update validation status
      if (validation) {
        await this.prisma.contentValidation.update({
          where: { id: validation.id },
          data: {
            status: ValidationStatus.APPROVED,
            isApproved: true,
          },
        });
      }

      // Schedule publish if provided
      let publishUrl = "";
      if (request.scheduledPublishAt) {
        const scheduledDate =
          typeof request.scheduledPublishAt === "string"
            ? new Date(request.scheduledPublishAt)
            : request.scheduledPublishAt;
        publishUrl = await this.schedulePublish(
          request.contentId,
          scheduledDate,
        );
        this.logger.log(
          `Content ${request.contentId} scheduled for publish at ${request.scheduledPublishAt}`,
        );
      } else {
        // Publish immediately
        publishUrl = await this.publishContent(request.contentId);
        this.logger.log(`Content ${request.contentId} published immediately`);
      }

      // Send notification
      await this.notifyCreator(
        request.contentId,
        ApprovalDecision.APPROVE,
        request.comments || "",
      );

      const response: ApprovalResponseDto = {
        contentId: request.contentId,
        status: ValidationStatus.APPROVED,
        decision: ApprovalDecision.APPROVE,
        approvedBy: request.approvedBy,
        comments: request.comments || "",
        approvedAt: new Date().toISOString(),
        publishUrl,
        conditionsMet: [],
        notificationId: randomUUID(),
      };

      this.logger.log(`Content approved: ${request.contentId}`);
      return response;
    } catch (error: any) {
      this.logger.error(
        `Approval failed: ${error?.message || "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Conditionally approve content (requires modifications)
   */
  async conditionalApprove(
    request: ApprovalRequestDto,
  ): Promise<ApprovalResponseDto> {
    try {
      const approvalId = randomUUID();

      this.logger.log(
        `Conditional approval for ${request.contentId} by ${request.approvedBy}`,
      );

      // Create conditional approval record
      await this.prisma.contentApproval.create({
        data: {
          id: approvalId,
          contentId: request.contentId,
          decision: ApprovalDecision.CONDITIONAL_APPROVE,
          approvedBy: request.approvedBy,
          comments: request.comments || "",
          conditionsTags: request.conditionsTags || [],
        },
      });

      // Update validation status
      await this.prisma.contentValidation.updateMany({
        where: { contentId: request.contentId },
        data: { status: ValidationStatus.CONDITIONAL_APPROVE },
      });

      // Send notification with conditions
      await this.notifyCreator(
        request.contentId,
        ApprovalDecision.CONDITIONAL_APPROVE,
        `Conditional approval. Required modifications: ${request.conditionsTags?.join(", ")}. ${request.comments || ""}`,
      );

      const response: ApprovalResponseDto = {
        contentId: request.contentId,
        status: ValidationStatus.CONDITIONAL_APPROVE,
        decision: ApprovalDecision.CONDITIONAL_APPROVE,
        approvedBy: request.approvedBy,
        comments: request.comments || "",
        approvedAt: new Date().toISOString(),
        publishUrl: "",
        conditionsMet: request.conditionsTags || [],
        notificationId: randomUUID(),
      };

      this.logger.log(`Conditional approval created: ${request.contentId}`);
      return response;
    } catch (error: any) {
      this.logger.error(
        `Conditional approval failed: ${error?.message || "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Reject content
   */
  async rejectContent(
    contentId: string,
    reason: string,
    flaggedIssues: string[],
    rejectedBy: string,
    canResubmit = true,
  ): Promise<RejectionReasonDto> {
    try {
      if (!contentId || !rejectedBy) {
        throw new BadRequestException("contentId and rejectedBy are required");
      }

      this.logger.log(`Rejecting content ${contentId} by ${rejectedBy}`);

      // Create rejection record
      await this.prisma.contentRejection.create({
        data: {
          id: randomUUID(),
          contentId,
          reason,
          flaggedIssues,
          rejectedBy,
          canResubmit,
        },
      });

      // Update validation status
      await this.prisma.contentValidation.updateMany({
        where: { contentId },
        data: { status: ValidationStatus.REJECTED, isApproved: false },
      });

      // Send notification
      await this.notifyCreator(
        contentId,
        ApprovalDecision.REJECT,
        `Content rejected. Reason: ${reason}. Issues: ${flaggedIssues.join(", ")}.`,
      );

      const response: RejectionReasonDto = {
        contentId,
        reason,
        flaggedIssues: [],
        suggestions:
          this.generateRejectionSuggestions(flaggedIssues).join("; "),
        rejectedBy,
        rejectedAt: new Date().toISOString(),
        canResubmit,
      };

      this.logger.log(`Content rejected: ${contentId}`);
      return response;
    } catch (error: any) {
      this.logger.error(
        `Rejection failed: ${error?.message || "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Get approval history for content
   */
  async getApprovalHistory(contentId: string) {
    return this.prisma.contentApproval.findMany({
      where: { contentId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get rejection history for content
   */
  async getRejectionHistory(contentId: string) {
    return this.prisma.contentRejection.findMany({
      where: { contentId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals(limit = 50): Promise<any[]> {
    return this.prisma.contentValidation.findMany({
      where: {
        status: {
          in: [ValidationStatus.IN_REVIEW, ValidationStatus.AUTO_FLAGGED],
        },
      },
      orderBy: { validatedAt: "asc" },
      take: limit,
    });
  }

  /**
   * Get approval statistics
   */
  async getApprovalStats(): Promise<{
    totalApprovals: number;
    approved: number;
    rejected: number;
    conditional: number;
    averageReviewTime: number;
    topRejectionReasons: { reason: string; count: number }[];
  }> {
    const approvals = await this.prisma.contentApproval.findMany();
    const rejections = await this.prisma.contentRejection.findMany();

    // Calculate reason distribution
    const reasonCounts: { [key: string]: number } = {};
    for (const rejection of rejections) {
      reasonCounts[rejection.reason] =
        (reasonCounts[rejection.reason] || 0) + 1;
    }

    const topReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate average review time
    const validations = await this.prisma.contentValidation.findMany();
    const reviewTimes = validations
      .filter((v) => v.validationTimeMs)
      .map((v) => v.validationTimeMs);
    const averageReviewTime =
      reviewTimes.length > 0
        ? reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length
        : 0;

    return {
      totalApprovals: approvals.length,
      approved: approvals.filter((a) => a.decision === ApprovalDecision.APPROVE)
        .length,
      rejected: rejections.length,
      conditional: approvals.filter(
        (a) => a.decision === ApprovalDecision.CONDITIONAL_APPROVE,
      ).length,
      averageReviewTime: Math.round(averageReviewTime),
      topRejectionReasons: topReasons,
    };
  }

  /**
   * Publish approved content
   * In production: Integrate with CMS/CDN
   */
  private async publishContent(contentId: string): Promise<string> {
    this.logger.log(`Publishing content: ${contentId}`);

    // In production:
    // 1. Copy from draft to live in CMS
    // 2. Update CDN cache
    // 3. Trigger webhooks
    // 4. Update search indexes

    return `/published/${contentId}`;
  }

  /**
   * Schedule content for future publishing
   */
  private async schedulePublish(
    contentId: string,
    scheduledAt: Date,
  ): Promise<string> {
    this.logger.log(`Scheduling publish for ${contentId} at ${scheduledAt}`);

    // In production: Create scheduled job
    // - Use Bull Queue or similar job scheduler
    // - Trigger publish at scheduled time
    // - Send notification 1 hour before publish

    return `/scheduled/${contentId}`;
  }

  /**
   * Notify content creator of approval/rejection
   */
  private async notifyCreator(
    contentId: string,
    decision: ApprovalDecision,
    message: string,
  ): Promise<void> {
    try {
      this.logger.log(`Sending notification for ${contentId}: ${decision}`);

      // In production:
      // 1. Find content creator
      // 2. Send email notification
      // 3. Create in-app notification
      // 4. Add to notification queue

      const notifications = {
        [ApprovalDecision.APPROVE]:
          "Your content has been approved and published!",
        [ApprovalDecision.REJECT]:
          "Your content was rejected. Please review the feedback.",
        [ApprovalDecision.CONDITIONAL_APPROVE]:
          "Your content requires modifications before publishing.",
        [ApprovalDecision.REQUEST_REVISION]:
          "Please revise your content and resubmit for approval.",
      };

      const title = notifications[decision] || "Content Review Update";

      // Mock: Log notification
      this.logger.debug(`Notification: ${title} - ${message}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to send notification: ${error?.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Generate suggestions for rejection
   */
  private generateRejectionSuggestions(flaggedIssues: string[]): string[] {
    const suggestions: string[] = [];

    const suggestionMap: { [key: string]: string } = {
      PROFANITY:
        "Remove all profane language and replace with age-appropriate words.",
      VIOLENCE: "Remove violent content or tone down descriptions.",
      EXPLICIT_CONTENT:
        "Remove explicit references and make content age-appropriate.",
      HATE_SPEECH: "Remove any hateful, discriminatory, or offensive language.",
      PERSONAL_INFO:
        "Remove personal information such as email addresses and phone numbers.",
      EXTERNAL_LINKS:
        "Verify all external links are safe and appropriate for children.",
      MISLEADING_CONTENT:
        "Verify claims with credible sources and cite references.",
      COPYRIGHT:
        "Ensure all content is original or properly licensed/attributed.",
      BULLYING: "Remove any bullying or mean-spirited content.",
      QUALITY_ISSUE: "Improve content quality (grammar, clarity, formatting).",
    };

    for (const issue of flaggedIssues) {
      if (suggestionMap[issue]) {
        suggestions.push(suggestionMap[issue]);
      }
    }

    if (suggestions.length === 0) {
      suggestions.push("Review feedback and make necessary improvements.");
    }

    return suggestions;
  }

  /**
   * Bulk approve content (admin only)
   */
  async bulkApprove(
    contentIds: string[],
    approvedBy: string,
    comments = "",
  ): Promise<ApprovalResponseDto[]> {
    this.logger.log(`Bulk approving ${contentIds.length} content items`);

    const results: ApprovalResponseDto[] = [];

    for (const contentId of contentIds) {
      try {
        const result = await this.approveContent({
          contentId,
          decision: ApprovalDecision.APPROVE,
          approvedBy,
          comments,
        });
        results.push(result);
      } catch (error: any) {
        this.logger.error(
          `Failed to approve ${contentId}: ${error?.message || "Unknown error"}`,
        );
      }
    }

    return results;
  }

  /**
   * Bulk reject content (admin only)
   */
  async bulkReject(
    contentIds: string[],
    reason: string,
    rejectedBy: string,
  ): Promise<RejectionReasonDto[]> {
    this.logger.log(`Bulk rejecting ${contentIds.length} content items`);

    const results: RejectionReasonDto[] = [];

    for (const contentId of contentIds) {
      try {
        const result = await this.rejectContent(
          contentId,
          reason,
          [],
          rejectedBy,
        );
        results.push(result);
      } catch (error: any) {
        this.logger.error(
          `Failed to reject ${contentId}: ${error?.message || "Unknown error"}`,
        );
      }
    }

    return results;
  }
}
