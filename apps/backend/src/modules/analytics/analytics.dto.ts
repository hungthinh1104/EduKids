import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

/**
 * Time period for analytics queries
 */
export enum AnalyticsPeriod {
  WEEK = 'WEEK',       // Last 7 days
  MONTH = 'MONTH',     // Last 30 days
  QUARTER = 'QUARTER', // Last 90 days
  YEAR = 'YEAR',       // Last 365 days
  ALL = 'ALL',         // All time
}

/**
 * Query DTO for analytics endpoints
 */
export class AnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Time period for analytics',
    enum: AnalyticsPeriod,
    default: AnalyticsPeriod.WEEK,
  })
  @IsOptional()
  @IsEnum(AnalyticsPeriod)
  period?: AnalyticsPeriod = AnalyticsPeriod.WEEK;

  @ApiPropertyOptional({
    description: 'Child profile ID (parent selects which child to view)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  childId?: number;
}

/**
 * Data point for chart visualization
 */
export class ChartDataPointDto {
  @ApiProperty({ example: '2024-03-01', description: 'Date label for X-axis' })
  date: string;

  @ApiProperty({ example: 45, description: 'Value for Y-axis' })
  value: number;

  @ApiProperty({
    example: 'Monday',
    description: 'Human-readable label',
  })
  label: string;
}

/**
 * Learning time analytics
 */
export class LearningTimeDto {
  @ApiProperty({ example: 315, description: 'Total minutes learned in period' })
  totalMinutes: number;

  @ApiProperty({
    example: 45,
    description: 'Average minutes per session',
  })
  averageSessionMinutes: number;

  @ApiProperty({ example: 12, description: 'Total number of sessions' })
  totalSessions: number;

  @ApiProperty({ example: 5, description: 'Days active in period' })
  daysActive: number;

  @ApiProperty({ example: 3, description: 'Current streak (consecutive days)' })
  currentStreak: number;

  @ApiProperty({
    type: [ChartDataPointDto],
    description: 'Daily learning time chart data',
  })
  chartData: ChartDataPointDto[];
}

/**
 * Vocabulary retention analytics
 */
export class VocabularyRetentionDto {
  @ApiProperty({
    example: 150,
    description: 'Total vocabulary words encountered',
  })
  totalWordsEncountered: number;

  @ApiProperty({
    example: 120,
    description: 'Words mastered (80%+ accuracy)',
  })
  wordsMastered: number;

  @ApiProperty({
    example: 80,
    description: 'Overall retention rate percentage',
  })
  retentionRate: number;

  @ApiProperty({
    example: 25,
    description: 'Words reviewed in period',
  })
  wordsReviewed: number;

  @ApiProperty({
    type: [ChartDataPointDto],
    description: 'Retention rate over time',
  })
  chartData: ChartDataPointDto[];

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Words by mastery level',
    example: {
      mastered: 120,
      learning: 20,
      new: 10,
    },
  })
  wordsByLevel: {
    mastered: number;
    learning: number;
    new: number;
  };
}

/**
 * Pronunciation accuracy analytics
 */
export class PronunciationAccuracyDto {
  @ApiProperty({
    example: 85,
    description: 'Average pronunciation accuracy percentage',
  })
  averageAccuracy: number;

  @ApiProperty({
    example: 45,
    description: 'Total pronunciation practices in period',
  })
  totalPractices: number;

  @ApiProperty({
    example: 38,
    description: 'Practices with 4+ stars (76%+ confidence)',
  })
  highAccuracyCount: number;

  @ApiProperty({
    example: 3,
    description: 'Most challenging sounds count',
  })
  challengingSoundsCount: number;

  @ApiProperty({
    type: [ChartDataPointDto],
    description: 'Accuracy over time',
  })
  chartData: ChartDataPointDto[];

  @ApiProperty({
    type: 'array',
    description: 'Most improved words',
    example: [
      { word: 'Apple', improvement: 25 },
      { word: 'Elephant', improvement: 20 },
    ],
  })
  mostImprovedWords: Array<{ word: string; improvement: number }>;

  @ApiProperty({
    type: 'array',
    description: 'Words needing practice',
    example: [
      { word: 'Vocabulary', accuracy: 55 },
      { word: 'Pronunciation', accuracy: 60 },
    ],
  })
  wordsNeedingPractice: Array<{ word: string; accuracy: number }>;
}

/**
 * Quiz performance analytics
 */
export class QuizPerformanceDto {
  @ApiProperty({ example: 15, description: 'Total quizzes completed' })
  totalQuizzes: number;

  @ApiProperty({
    example: 82,
    description: 'Average quiz score percentage',
  })
  averageScore: number;

  @ApiProperty({
    example: 95,
    description: 'Highest quiz score percentage',
  })
  highestScore: number;

  @ApiProperty({
    example: 12,
    description: 'Quizzes passed (80%+ score)',
  })
  quizzesPassed: number;

  @ApiProperty({
    type: [ChartDataPointDto],
    description: 'Quiz scores over time',
  })
  chartData: ChartDataPointDto[];

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Quiz performance by difficulty',
    example: {
      easy: 95,
      medium: 85,
      hard: 70,
    },
  })
  scoresByDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
}

/**
 * Gamification progress analytics
 */
export class GamificationProgressDto {
  @ApiProperty({ example: 420, description: 'Total star points earned' })
  totalPoints: number;

  @ApiProperty({ example: 9, description: 'Current level' })
  currentLevel: number;

  @ApiProperty({ example: 5, description: 'Badges earned' })
  badgesEarned: number;

  @ApiProperty({ example: 15, description: 'Total badges available' })
  totalBadges: number;

  @ApiProperty({
    example: 8,
    description: 'Items purchased from shop',
  })
  itemsPurchased: number;

  @ApiProperty({
    type: [ChartDataPointDto],
    description: 'Points earned over time',
  })
  chartData: ChartDataPointDto[];

  @ApiProperty({
    type: 'array',
    description: 'Recent badges earned',
    example: [
      {
        name: 'Quiz Master',
        earnedAt: '2024-03-05T10:00:00Z',
      },
    ],
  })
  recentBadges: Array<{ name: string; earnedAt: Date }>;
}

/**
 * Overall analytics overview for dashboard
 */
export class AnalyticsOverviewDto {
  @ApiProperty({ example: 1, description: 'Child profile ID' })
  childId: number;

  @ApiProperty({ example: 'Alice', description: 'Child nickname' })
  childNickname: string;

  @ApiProperty({ example: 'WEEK', description: 'Analytics period' })
  period: AnalyticsPeriod;

  @ApiProperty({ type: LearningTimeDto })
  learningTime: LearningTimeDto;

  @ApiProperty({ type: VocabularyRetentionDto })
  vocabulary: VocabularyRetentionDto;

  @ApiProperty({ type: PronunciationAccuracyDto })
  pronunciation: PronunciationAccuracyDto;

  @ApiProperty({ type: QuizPerformanceDto })
  quizPerformance: QuizPerformanceDto;

  @ApiProperty({ type: GamificationProgressDto })
  gamification: GamificationProgressDto;

  @ApiProperty({
    example: '2024-03-05T10:30:00Z',
    description: 'When analytics were generated',
  })
  generatedAt: Date;

  @ApiProperty({
    example: false,
    description: 'Whether child has any learning data',
  })
  hasData: boolean;

  @ApiProperty({
    example: 'Great progress this week! 🎉',
    description: 'AI-generated insight message',
  })
  insightMessage: string;
}

/**
 * Response when no data available
 */
export class NoDataResponseDto {
  @ApiProperty({ example: false })
  hasData: boolean;

  @ApiProperty({
    example: 'No data yet – encourage your child to learn! 🌟',
  })
  message: string;

  @ApiProperty({ example: 1 })
  childId: number;

  @ApiProperty({ example: 'Alice' })
  childNickname: string;
}
