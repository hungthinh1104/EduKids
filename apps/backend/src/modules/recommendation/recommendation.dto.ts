import {
  IsNumber,
  IsString,
  IsEnum,
  IsBoolean,
  IsArray,
  IsOptional,
  IsPositive,
  Min,
  Max,
  MinLength,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Recommendation Type Enum
 * Categorizes different types of AI-generated suggestions
 */
export enum RecommendationType {
  TOPIC_REVIEW = 'TOPIC_REVIEW',              // Review a previously learned topic
  TOPIC_ADVANCE = 'TOPIC_ADVANCE',            // Progress to next topic
  WEAKNESS_PRACTICE = 'WEAKNESS_PRACTICE',    // Practice weak pronunciation/vocab
  SPEED_CHALLENGE = 'SPEED_CHALLENGE',        // Timed challenges for fluency
  VOCABULARY_EXTENSION = 'VOCABULARY_EXTENSION', // Learn new words related to strong topics
  PRONUNCIATION_REFINEMENT = 'PRONUNCIATION_REFINEMENT', // Improve pronunciation
  QUIZ_PREPARATION = 'QUIZ_PREPARATION',      // Prepare for next quiz level
  CONSISTENCY_BOOST = 'CONSISTENCY_BOOST',    // Build daily learning habit
}

/**
 * Recommendation Priority Enum
 * Urgency level of the suggestion
 */
export enum RecommendationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Recommendation Status Enum
 * Tracks recommendation lifecycle
 */
export enum RecommendationStatus {
  PENDING = 'PENDING',       // Not yet viewed
  VIEWED = 'VIEWED',         // Parent viewed but didn't apply
  APPLIED = 'APPLIED',       // Parent applied the recommendation
  COMPLETED = 'COMPLETED',   // Child completed the recommended path
  DISMISSED = 'DISMISSED',   // Parent explicitly dismissed
}

/**
 * AI Scoring Details
 * Transparent breakdown of recommendation scoring
 */
export class AIScoreBreakdown {
  @ApiProperty({
    description: 'Weakness detection score (0-100)',
    example: 75,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  weaknessScore: number;

  @ApiProperty({
    description: 'Vocabulary gap score (0-100)',
    example: 60,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  vocabularyGapScore: number;

  @ApiProperty({
    description: 'Readiness to advance score (0-100)',
    example: 85,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  readinessScore: number;

  @ApiProperty({
    description: 'Engagement consistency score (0-100)',
    example: 70,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  engagementScore: number;

  @ApiProperty({
    description: 'Overall recommendation score (0-100)',
    example: 72,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  overallScore: number;
}

/**
 * Learning Path Item
 * Individual step in recommended path
 */
export class LearningPathItemDto {
  @ApiProperty({
    description: 'Content/topic ID',
    example: 5,
  })
  @IsNumber()
  @IsPositive()
  contentId: number;

  @ApiProperty({
    description: 'Content/topic name',
    example: 'Present Simple Tense',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  contentName: string;

  @ApiProperty({
    description: 'Sequence order in path',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  sequenceOrder: number;

  @ApiProperty({
    description: 'Estimated minutes to complete',
    example: 30,
  })
  @IsNumber()
  @IsPositive()
  estimatedMinutes: number;

  @ApiPropertyOptional({
    description: 'Difficulty level',
    example: 'INTERMEDIATE',
  })
  @IsOptional()
  @IsString()
  difficultyLevel?: string;

  @ApiPropertyOptional({
    description: 'Why this item is included',
    example: 'Based on pronunciation weakness in verb conjugation',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rationale?: string;
}

/**
 * Recommendation DTO
 * Single AI-generated recommendation
 */
export class RecommendationDto {
  @ApiProperty({
    description: 'Unique recommendation ID',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  recommendationId: number;

  @ApiProperty({
    description: 'Child profile ID',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  childId: number;

  @ApiProperty({
    description: 'Recommendation type',
    enum: RecommendationType,
  })
  @IsEnum(RecommendationType)
  type: RecommendationType;

  @ApiProperty({
    description: 'Priority level',
    enum: RecommendationPriority,
  })
  @IsEnum(RecommendationPriority)
  priority: RecommendationPriority;

  @ApiProperty({
    description: 'Current status',
    enum: RecommendationStatus,
  })
  @IsEnum(RecommendationStatus)
  status: RecommendationStatus;

  @ApiProperty({
    description: 'Human-readable title',
    example: 'Review Grammar Basics',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Detailed description',
    example: 'Your child showed weakness in verb conjugation. This review session will strengthen this skill.',
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000)
  description: string;

  @ApiProperty({
    description: 'AI scoring breakdown',
    type: AIScoreBreakdown,
  })
  @ValidateNested()
  @Type(() => AIScoreBreakdown)
  scoreBreakdown: AIScoreBreakdown;

  @ApiProperty({
    description: 'Suggested learning path items',
    type: [LearningPathItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LearningPathItemDto)
  learningPath: LearningPathItemDto[];

  @ApiProperty({
    description: 'Total estimated time in minutes',
    example: 90,
  })
  @IsNumber()
  @IsPositive()
  totalEstimatedMinutes: number;

  @ApiPropertyOptional({
    description: 'Expected outcome after completing path',
    example: 'Master verb conjugation and improve quiz scores by 15-20%',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  expectedOutcome?: string;

  @ApiProperty({
    description: 'When recommendation was generated',
    example: '2024-01-22T10:30:00Z',
  })
  generatedAt: Date;

  @ApiPropertyOptional({
    description: 'When parent viewed recommendation',
    example: '2024-01-22T14:30:00Z',
  })
  @IsOptional()
  viewedAt?: Date;

  @ApiPropertyOptional({
    description: 'When parent applied recommendation',
    example: '2024-01-22T15:00:00Z',
  })
  @IsOptional()
  appliedAt?: Date;
}

/**
 * Recommendations List DTO
 * Collection of recommendations for a child
 */
export class RecommendationsListDto {
  @ApiProperty({
    description: 'Child profile ID',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  childId: number;

  @ApiProperty({
    description: 'List of recommendations',
    type: [RecommendationDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecommendationDto)
  recommendations: RecommendationDto[];

  @ApiProperty({
    description: 'Whether recommendations are available',
    example: true,
  })
  @IsBoolean()
  hasRecommendations: boolean;

  @ApiPropertyOptional({
    description: 'Message if no recommendations',
    example: 'Continue regular learning!',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  noRecommendationMessage?: string;

  @ApiProperty({
    description: 'When recommendations were last generated',
    example: '2024-01-22T09:00:00Z',
  })
  generatedAt: Date;
}

/**
 * Apply Recommendation Request DTO
 * Parent applies selected recommendations
 */
export class ApplyRecommendationDto {
  @ApiProperty({
    description: 'Recommendation ID to apply',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  recommendationId: number;

  @ApiPropertyOptional({
    description: 'Parent notes or feedback',
    example: 'Great suggestion! Started today.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  parentNotes?: string;
}

/**
 * Applied Learning Path DTO
 * Result of applying a recommendation
 */
export class AppliedLearningPathDto {
  @ApiProperty({
    description: 'Applied path ID',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  pathId: number;

  @ApiProperty({
    description: 'Child profile ID',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  childId: number;

  @ApiProperty({
    description: 'Original recommendation ID',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  recommendationId: number;

  @ApiProperty({
    description: 'Learning path items',
    type: [LearningPathItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LearningPathItemDto)
  learningPath: LearningPathItemDto[];

  @ApiProperty({
    description: 'Total estimated time',
    example: 90,
  })
  @IsNumber()
  @IsPositive()
  totalEstimatedMinutes: number;

  @ApiProperty({
    description: 'Items completed count',
    example: 2,
  })
  @IsNumber()
  @Min(0)
  itemsCompleted: number;

  @ApiProperty({
    description: 'Total items in path',
    example: 5,
  })
  @IsNumber()
  @IsPositive()
  totalItems: number;

  @ApiProperty({
    description: 'Progress percentage',
    example: 40,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercentage: number;

  @ApiProperty({
    description: 'When path was applied',
    example: '2024-01-22T15:00:00Z',
  })
  appliedAt: Date;

  @ApiPropertyOptional({
    description: 'When path was completed',
    example: '2024-01-25T18:30:00Z',
  })
  @IsOptional()
  completedAt?: Date;

  @ApiPropertyOptional({
    description: 'Parent notes',
    example: 'Great progress so far!',
  })
  @IsOptional()
  @IsString()
  parentNotes?: string;
}

/**
 * Recommendation Feedback DTO
 * Parent provides feedback on recommendation
 */
export class RecommendationFeedbackDto {
  @ApiProperty({
    description: 'Recommendation ID',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  recommendationId: number;

  @ApiProperty({
    description: 'Parent rating 1-5',
    example: 4,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    description: 'Helpful feedback text',
    example: 'Very helpful! My child enjoyed the pronunciation practice.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  feedback?: string;

  @ApiProperty({
    description: 'Whether parent found it helpful',
    example: true,
  })
  @IsBoolean()
  isHelpful: boolean;
}

/**
 * Recommendation Statistics DTO
 * Overview of recommendations for a child
 */
export class RecommendationStatisticsDto {
  @ApiProperty({
    description: 'Child ID',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  childId: number;

  @ApiProperty({
    description: 'Total recommendations generated',
    example: 10,
  })
  @IsNumber()
  @Min(0)
  totalRecommendations: number;

  @ApiProperty({
    description: 'Applied count',
    example: 6,
  })
  @IsNumber()
  @Min(0)
  appliedCount: number;

  @ApiProperty({
    description: 'Applied percentage',
    example: 60,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  appliedPercentage: number;

  @ApiProperty({
    description: 'Completed count',
    example: 4,
  })
  @IsNumber()
  @Min(0)
  completedCount: number;

  @ApiProperty({
    description: 'Average parent rating (1-5)',
    example: 4.2,
  })
  @IsNumber()
  @Min(0)
  @Max(5)
  averageRating: number;

  @ApiProperty({
    description: 'Helpful count',
    example: 5,
  })
  @IsNumber()
  @Min(0)
  helpfulCount: number;

  @ApiProperty({
    description: 'Currently active paths',
    example: 2,
  })
  @IsNumber()
  @Min(0)
  activePathsCount: number;

  @ApiPropertyOptional({
    description: 'Most common recommendation type',
    enum: RecommendationType,
  })
  @IsOptional()
  @IsEnum(RecommendationType)
  mostCommonType?: RecommendationType;

  @ApiProperty({
    description: 'Average path completion time (days)',
    example: 3,
  })
  @IsNumber()
  @Min(0)
  averageCompletionDays: number;
}

/**
 * Apply Recommendation Result DTO
 * Response after applying recommendation
 */
export class ApplyRecommendationResultDto {
  @ApiProperty({
    description: 'Success indicator',
    example: true,
  })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    description: 'Result message',
    example: 'Learning path successfully applied',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Applied path details',
    type: AppliedLearningPathDto,
  })
  @ValidateNested()
  @Type(() => AppliedLearningPathDto)
  appliedPath: AppliedLearningPathDto;
}

/**
 * Bulk Dismiss Recommendations DTO
 * Dismiss multiple recommendations at once
 */
export class DismissRecommendationsDto {
  @ApiProperty({
    description: 'List of recommendation IDs to dismiss',
    example: [1, 2, 3],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  recommendationIds: number[];

  @ApiPropertyOptional({
    description: 'Reason for dismissal',
    example: 'Will handle this later',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}

/**
 * Dismiss Result DTO
 * Result of dismissing recommendations
 */
export class DismissResultDto {
  @ApiProperty({
    description: 'Number of dismissed recommendations',
    example: 3,
  })
  @IsNumber()
  @Min(0)
  dismissedCount: number;

  @ApiProperty({
    description: 'Total recommendations before dismissal',
    example: 5,
  })
  @IsNumber()
  @Min(0)
  previousTotal: number;

  @ApiProperty({
    description: 'Remaining recommendations',
    example: 2,
  })
  @IsNumber()
  @Min(0)
  remainingCount: number;
}
