import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../../prisma/prisma.module";
import { ValidationController } from "./controller/validation.controller";
import { ContentValidationService } from "./service/content-validation.service";
import { SafetyValidationService } from "./service/safety-validation.service";
import { ApprovalService } from "./service/approval.service";
import { PreviewService } from "./service/preview.service";
import { ValidationRepository } from "./repository/validation.repository";

/**
 * Media Validation Module
 * Handles content validation, safety detection, preview generation, and approval workflows
 * Implements NFR-03: Zero-tolerance child safety policy
 *
 * Key Features:
 * - Automated safety detection (profanity, violence, explicit content, etc.)
 * - Watermarked preview generation
 * - Admin approval/rejection workflow
 * - Audit trail for all validations and approvals
 * - Batch validation support
 * - Safety statistics and reporting
 *
 * Core Services:
 * - SafetyValidationService: Text, image, video, audio validation
 * - ContentValidationService: Orchestrates full validation workflow
 * - PreviewService: Generates watermarked previews
 * - ApprovalService: Manages approval/rejection workflow
 * - ValidationRepository: Data access layer
 *
 * Controller Endpoints:
 * - POST /media/validation/validate - Validate single content
 * - POST /media/validation/validate-batch - Batch validation
 * - GET /media/validation/:validationId - Get validation result
 * - GET /media/validation/:contentId/preview - Get watermarked preview
 * - POST /media/validation/:contentId/approve - Approve content
 * - POST /media/validation/:contentId/reject - Reject content
 * - GET /media/validation/flagged/list - Get auto-flagged content
 * - GET /media/validation/pending/list - Get pending approvals
 * - GET /media/validation/stats - Get statistics
 *
 * Database Models:
 * - ContentValidation: Validation records
 * - SafetyFlag: Detected safety issues
 * - ContentApproval: Approval history
 * - ContentRejection: Rejection history
 */
@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    ContentValidationService,
    SafetyValidationService,
    ApprovalService,
    PreviewService,
    ValidationRepository,
  ],
  controllers: [ValidationController],
  exports: [
    ContentValidationService,
    SafetyValidationService,
    ApprovalService,
    PreviewService,
    ValidationRepository,
  ],
})
export class MediaValidationModule {}
