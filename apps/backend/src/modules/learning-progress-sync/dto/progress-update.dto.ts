import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsISO8601,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * Types of progress updates
 */
export enum ProgressUpdateType {
  STARS_EARNED = "STARS_EARNED",
  BADGE_EARNED = "BADGE_EARNED",
  QUIZ_COMPLETED = "QUIZ_COMPLETED",
  LESSON_COMPLETED = "LESSON_COMPLETED",
  TOPIC_COMPLETED = "TOPIC_COMPLETED",
  SCORE_UPDATED = "SCORE_UPDATED",
  STREAK_UPDATED = "STREAK_UPDATED",
  VOCABULARY_LEARNED = "VOCABULARY_LEARNED",
  CHECKPOINT_REACHED = "CHECKPOINT_REACHED",
  CUSTOM = "CUSTOM",
}

/**
 * Star Points breakdown
 */
export class StarPointsDto {
  @IsNumber()
  current: number;

  @IsNumber()
  earned: number;

  @IsNumber()
  @IsOptional()
  previousValue?: number;
}

/**
 * Badge information
 */
export class BadgeDto {
  @IsString()
  @IsNotEmpty()
  badgeId: string;

  @IsString()
  badgeName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsISO8601()
  earnedAt: string;

  @IsNumber()
  @IsOptional()
  level?: number;
}

/**
 * Quiz/Test score
 */
export class ScoreDto {
  @IsString()
  @IsNotEmpty()
  quizId: string;

  @IsString()
  quizTitle: string;

  @IsNumber()
  score: number;

  @IsNumber()
  maxScore: number;

  @IsNumber()
  @IsOptional()
  percentageScore?: number;

  @IsString()
  @IsOptional()
  level?: string; // 'EASY', 'MEDIUM', 'HARD'
}

/**
 * Streak information
 */
export class StreakDto {
  @IsNumber()
  currentStreak: number;

  @IsNumber()
  longestStreak: number;

  @IsISO8601()
  lastActivityDate: string;
}

/**
 * Single progress update event
 */
export class ProgressUpdateDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsString()
  type: ProgressUpdateType;

  @IsNumber()
  timestamp: number; // Unix timestamp in milliseconds

  @IsOptional()
  @ValidateNested()
  @Type(() => StarPointsDto)
  starPoints?: StarPointsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BadgeDto)
  badge?: BadgeDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ScoreDto)
  score?: ScoreDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => StreakDto)
  streak?: StreakDto;

  @IsString()
  @IsOptional()
  contentId?: string; // Related content (topic, quiz, vocab, etc.)

  @IsString()
  @IsOptional()
  contentType?: string; // 'TOPIC', 'QUIZ', 'VOCABULARY', etc.

  @IsString()
  @IsOptional()
  customData?: string; // JSON string for additional context

  @IsNumber()
  @IsOptional()
  clientTimestamp?: number; // Client-side timestamp for validation

  @IsString()
  @IsOptional()
  sessionId?: string; // Session identifier for tracking
}

/**
 * Batch progress update (multiple updates at once)
 */
export class BatchProgressUpdateDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgressUpdateDto)
  updates: ProgressUpdateDto[];

  @IsISO8601()
  @IsOptional()
  syncAt?: string; // When sync occurred
}

/**
 * Offline queue entry (stores failed updates)
 */
export class OfflineQueueEntryDto {
  @IsString()
  @IsNotEmpty()
  queueId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ValidateNested()
  @Type(() => ProgressUpdateDto)
  update: ProgressUpdateDto;

  @IsNumber()
  queuedAt: number; // When added to queue

  @IsNumber()
  @IsOptional()
  retryCount?: number;

  @IsNumber()
  @IsOptional()
  lastRetryAt?: number;

  @IsString()
  @IsOptional()
  status?: "PENDING" | "FAILED" | "SYNCED"; // Queue status
}
