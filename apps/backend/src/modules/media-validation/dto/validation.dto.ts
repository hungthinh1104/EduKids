import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsEnum,
  IsBoolean,
  ValidateNested,
  Min,
  Max,
  IsISO8601,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * Content validation status
 */
export enum ValidationStatus {
  PENDING = "PENDING",
  IN_REVIEW = "IN_REVIEW",
  AUTO_FLAGGED = "AUTO_FLAGGED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CONDITIONAL_APPROVE = "CONDITIONAL_APPROVE", // Approve with warnings
}

/**
 * Safety flag severity levels
 */
export enum SafetySeverity {
  CRITICAL = "CRITICAL", // Block immediately (violence, explicit content)
  HIGH = "HIGH", // Requires admin review (inappropriate language)
  MEDIUM = "MEDIUM", // Warning (mild content)
  LOW = "LOW", // Info only (annotations)
}

/**
 * Safety flag type/category
 */
export enum SafetyFlagType {
  PROFANITY = "PROFANITY",
  VIOLENCE = "VIOLENCE",
  EXPLICIT_CONTENT = "EXPLICIT_CONTENT",
  HATE_SPEECH = "HATE_SPEECH",
  PERSONAL_INFO = "PERSONAL_INFO",
  INAPPROPRIATE_LANGUAGE = "INAPPROPRIATE_LANGUAGE",
  MISLEADING_CONTENT = "MISLEADING_CONTENT",
  COPYRIGHT_CONCERN = "COPYRIGHT_CONCERN",
  BULLYING = "BULLYING",
  EXTERNAL_LINKS = "EXTERNAL_LINKS",
  UNVERIFIED_CLAIMS = "UNVERIFIED_CLAIMS",
  QUALITY_ISSUE = "QUALITY_ISSUE",
  OTHER = "OTHER",
}

/**
 * Content approval decision
 */
export enum ApprovalDecision {
  APPROVE = "APPROVE",
  REJECT = "REJECT",
  CONDITIONAL_APPROVE = "CONDITIONAL_APPROVE",
  REQUEST_REVISION = "REQUEST_REVISION",
}

/**
 * Content type for validation
 */
export enum ContentTypeValidation {
  TOPIC = "TOPIC",
  LESSON = "LESSON",
  QUIZ = "QUIZ",
  VOCABULARY = "VOCABULARY",
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  AUDIO = "AUDIO",
  DOCUMENT = "DOCUMENT",
}

/**
 * Safety flag detected during validation
 */
export class SafetyFlagDto {
  @IsString()
  @IsNotEmpty()
  flagId: string;

  @IsEnum(SafetyFlagType)
  type: SafetyFlagType;

  @IsEnum(SafetySeverity)
  severity: SafetySeverity;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  detectedText?: string; // The problematic text/segment

  @IsNumber()
  @IsOptional()
  confidence?: number; // 0-1 confidence score

  @IsString()
  @IsOptional()
  location?: string; // Timestamp for video/audio or position for text

  @IsBoolean()
  @IsOptional()
  isAutoDetected?: boolean; // Was detected by automated system

  @IsString()
  @IsOptional()
  suggestedAction?: string; // What action to take

  @IsISO8601()
  detectedAt: string;
}

/**
 * Content validation request
 */
export class ContentValidationRequestDto {
  @IsString()
  @IsNotEmpty()
  contentId: string;

  @IsEnum(ContentTypeValidation)
  contentType: ContentTypeValidation;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  text?: string; // For text-based content

  @IsString()
  @IsOptional()
  imageUrl?: string; // For image/video thumbnail

  @IsString()
  @IsOptional()
  audioUrl?: string; // For audio content

  @IsString()
  @IsOptional()
  videoUrl?: string; // For video content

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsOptional()
  keywords?: string[];

  @IsNumber()
  @IsOptional()
  ageRecommendation?: number; // Minimum age

  @IsString()
  @IsOptional()
  createdBy?: string; // Creator/uploader ID

  @IsISO8601()
  @IsOptional()
  uploadedAt?: string;

  @IsString()
  @IsOptional()
  source?: string; // Content source/URL
}

/**
 * Content validation response with flags
 */
export class ContentValidationResponseDto {
  @IsString()
  @IsNotEmpty()
  validationId: string;

  @IsString()
  @IsNotEmpty()
  contentId: string;

  @IsEnum(ValidationStatus)
  status: ValidationStatus;

  @IsBoolean()
  isApproved: boolean; // Overall approval

  @IsBoolean()
  hasAutoFlags: boolean; // Auto-flagged content

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SafetyFlagDto)
  safetyFlags: SafetyFlagDto[];

  @IsNumber()
  @Min(0)
  @Max(100)
  safetyScore: number; // 0-100, higher = safer

  @IsArray()
  @IsOptional()
  recommendations?: string[]; // Suggestions for improvement

  @IsString()
  @IsOptional()
  detailedReport?: string; // Full validation report

  @IsISO8601()
  validatedAt: string;

  @IsNumber()
  @IsOptional()
  validationTimeMs?: number; // How long validation took
}

/**
 * Content preview with watermark
 */
export class ContentPreviewDto {
  @IsString()
  @IsNotEmpty()
  contentId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string; // Preview image URL

  @IsString()
  @IsOptional()
  previewUrl?: string; // Watermarked preview URL

  @IsString()
  @IsOptional()
  textPreview?: string; // First 500 chars for text content

  @IsNumber()
  @IsOptional()
  duration?: number; // Duration in seconds for video/audio

  @IsArray()
  @IsOptional()
  keyFrames?: string[]; // Key frames for video

  @IsBoolean()
  hasWatermark: boolean;

  @IsString()
  @IsOptional()
  watermarkText?: string; // "DRAFT - ADMIN PREVIEW ONLY"

  @IsISO8601()
  previewGeneratedAt: string;
}

/**
 * Approval request from admin
 */
export class ApprovalRequestDto {
  @IsString()
  @IsNotEmpty()
  contentId: string;

  @IsEnum(ApprovalDecision)
  decision: ApprovalDecision;

  @IsString()
  @IsNotEmpty()
  approvedBy: string; // Admin user ID

  @IsString()
  @IsOptional()
  comments?: string; // Admin comments

  @IsArray()
  @IsOptional()
  conditionsTags?: string[]; // Tags/conditions for conditional approval

  @IsBoolean()
  @IsOptional()
  requiresModeration?: boolean; // Requires human moderation

  @IsISO8601()
  @IsOptional()
  scheduledPublishAt?: string; // Schedule for future publish
}

/**
 * Approval response
 */
export class ApprovalResponseDto {
  @IsString()
  @IsNotEmpty()
  contentId: string;

  @IsEnum(ValidationStatus)
  status: ValidationStatus;

  @IsEnum(ApprovalDecision)
  decision: ApprovalDecision;

  @IsString()
  approvedBy: string;

  @IsString()
  @IsOptional()
  comments?: string;

  @IsISO8601()
  approvedAt: string;

  @IsString()
  @IsOptional()
  publishUrl?: string; // Published URL if approved

  @IsArray()
  @IsOptional()
  conditionsMet?: string[];

  @IsString()
  @IsOptional()
  notificationId?: string; // Notification sent to uploader
}

/**
 * Rejection reason
 */
export class RejectionReasonDto {
  @IsString()
  @IsNotEmpty()
  contentId: string;

  @IsString()
  @IsNotEmpty()
  reason: string; // Why content was rejected

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SafetyFlagDto)
  flaggedIssues: SafetyFlagDto[]; // Associated safety flags

  @IsString()
  @IsOptional()
  suggestions?: string; // How to fix for resubmission

  @IsString()
  rejectedBy: string; // Admin user ID

  @IsISO8601()
  rejectedAt: string;

  @IsBoolean()
  @IsOptional()
  canResubmit?: boolean; // Can creator resubmit after fixes
}

/**
 * Batch validation request
 */
export class BatchValidationRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentValidationRequestDto)
  items: ContentValidationRequestDto[];

  @IsString()
  @IsOptional()
  batchId?: string;

  @IsString()
  @IsOptional()
  priority?: string; // 'HIGH', 'NORMAL', 'LOW'
}

/**
 * Batch validation response
 */
export class BatchValidationResponseDto {
  @IsString()
  @IsNotEmpty()
  batchId: string;

  @IsNumber()
  totalItems: number;

  @IsNumber()
  successCount: number;

  @IsNumber()
  approvedCount?: number;

  @IsNumber()
  rejectedCount?: number;

  @IsNumber()
  flaggedCount?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentValidationResponseDto)
  results: ContentValidationResponseDto[];

  @IsISO8601()
  completedAt: string;

  @IsNumber()
  @IsOptional()
  totalTimeMs?: number;
}
