import {
  IsNumber,
  IsString,
  IsBoolean,
  IsArray,
  IsDate,
  IsOptional,
  ValidateNested,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * Review difficulty levels
 */
export enum ReviewDifficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
}

/**
 * Single vocabulary item for review
 */
export class VocabularyItemForReviewDto {
  @IsNumber()
  vocabularyId: number;

  @IsString()
  word: string;

  @IsString()
  definition: string;

  @IsString()
  @IsOptional()
  example?: string;

  @IsString()
  @IsOptional()
  pronunciation?: string;

  @IsNumber()
  currentInterval: number; // Days until next review

  @IsNumber()
  reviewCount: number; // How many times reviewed

  @IsNumber()
  easeFactor: number; // Ease factor (1.3 - 2.5)
}

/**
 * Request: Submit review result for item
 */
export class SubmitReviewRequestDto {
  @IsNumber()
  vocabularyId: number;

  @IsEnum(ReviewDifficulty)
  difficulty: ReviewDifficulty;

  @IsBoolean()
  correct: boolean;

  @IsNumber()
  @IsOptional()
  timeSpentMs?: number; // Time spent on this review item
}

/**
 * Response: Review result recorded
 */
export class ReviewResultDto {
  @IsNumber()
  vocabularyId: number;

  @IsNumber()
  nextReview: number; // Unix timestamp

  @IsNumber()
  newInterval: number; // New interval in days

  @IsNumber()
  newEase: number; // Updated ease factor

  @IsNumber()
  reviewCount: number; // Updated repetition count

  @IsBoolean()
  correct: boolean;

  @IsString()
  message: string;
}

/**
 * Response: Review session
 */
export class ReviewSessionDto {
  @IsNumber()
  sessionId: number;

  @IsNumber()
  childId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VocabularyItemForReviewDto)
  items: VocabularyItemForReviewDto[];

  @IsNumber()
  itemCount: number;

  @IsString()
  sessionStartedAt: string;
}

/**
 * Response: Review progress
 */
export class ReviewProgressDto {
  @IsNumber()
  reviewedToday: number;

  @IsNumber()
  totalDueForReview: number;

  @IsNumber()
  percentageComplete: number;

  @IsNumber()
  averageAccuracy: number; // 0-100

  @IsArray()
  upcomingReviews: {
    daysFromNow: number;
    count: number;
  }[];
}

/**
 * Response: Review statistics
 */
export class ReviewStatsDto {
  @IsNumber()
  childId: number;

  @IsNumber()
  totalReviewed: number;

  @IsNumber()
  totalCorrect: number;

  @IsNumber()
  accuracy: number; // 0-100

  @IsNumber()
  averageEase: number;

  @IsNumber()
  averageInterval: number; // Days

  @IsNumber()
  totalTimeSpent: number; // Minutes
}

/**
 * Spaced repetition algorithm metrics
 */
export class SpacedRepetitionMetricsDto {
  @IsNumber()
  currentInterval: number; // Current interval in days

  @IsNumber()
  easeFactor: number; // Ease factor (1.3 - 2.5)

  @IsNumber()
  reviewCount: number; // Number of successful reviews

  @IsDate()
  createdAt: Date;

  @IsDate()
  nextReview: Date;
}
