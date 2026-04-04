import { ApiProperty } from "@nestjs/swagger";

export class DailyActiveUsersDto {
  @ApiProperty({
    description: "Date of the metric",
    example: "2026-03-06",
  })
  date: string;

  @ApiProperty({
    description: "Number of active users on this date",
    example: 1250,
  })
  activeUsers: number;

  @ApiProperty({
    description: "Number of new users on this date",
    example: 45,
  })
  newUsers: number;

  @ApiProperty({
    description: "Percentage change from previous period",
    example: 12.5,
    nullable: true,
  })
  changePercent: number | null;
}

export class DAUResponseDto {
  @ApiProperty({
    description: "Time range description",
    example: "Last 7 Days",
  })
  timeRange: string;

  @ApiProperty({
    description: "Start date of the period",
    example: "2026-03-01T00:00:00Z",
  })
  startDate: string;

  @ApiProperty({
    description: "End date of the period",
    example: "2026-03-06T23:59:59Z",
  })
  endDate: string;

  @ApiProperty({
    description: "Daily active users data",
    type: [DailyActiveUsersDto],
  })
  dailyData: DailyActiveUsersDto[];

  @ApiProperty({
    description: "Average DAU for the period",
    example: 1180,
  })
  averageDAU: number;

  @ApiProperty({
    description: "Peak DAU in the period",
    example: 1350,
  })
  peakDAU: number;

  @ApiProperty({
    description: "Total unique active users in the period",
    example: 2500,
  })
  totalUniqueUsers: number;
}

export class SessionLengthDto {
  @ApiProperty({
    description: "Date of the metric",
    example: "2026-03-06",
  })
  date: string;

  @ApiProperty({
    description: "Average session length in seconds",
    example: 1800,
  })
  averageSeconds: number;

  @ApiProperty({
    description: "Average session length formatted (HH:MM:SS)",
    example: "00:30:00",
  })
  averageFormatted: string;

  @ApiProperty({
    description: "Median session length in seconds",
    example: 1500,
  })
  medianSeconds: number;

  @ApiProperty({
    description: "Total number of sessions",
    example: 3500,
  })
  sessionCount: number;
}

export class SessionLengthResponseDto {
  @ApiProperty({
    description: "Time range description",
    example: "Last 7 Days",
  })
  timeRange: string;

  @ApiProperty({
    description: "Start date of the period",
    example: "2026-03-01T00:00:00Z",
  })
  startDate: string;

  @ApiProperty({
    description: "End date of the period",
    example: "2026-03-06T23:59:59Z",
  })
  endDate: string;

  @ApiProperty({
    description: "Daily session length data",
    type: [SessionLengthDto],
  })
  dailyData: SessionLengthDto[];

  @ApiProperty({
    description: "Overall average session length in seconds",
    example: 1750,
  })
  overallAverageSeconds: number;

  @ApiProperty({
    description: "Overall average session length formatted",
    example: "00:29:10",
  })
  overallAverageFormatted: string;

  @ApiProperty({
    description: "Total sessions in the period",
    example: 24500,
  })
  totalSessions: number;
}

export class ContentPopularityItemDto {
  @ApiProperty({
    description: "Content ID",
    example: "clx1234567890abcdef",
  })
  contentId: string;

  @ApiProperty({
    description: "Content name",
    example: "Animals Topic",
  })
  contentName: string;

  @ApiProperty({
    description: "Content type",
    enum: ["TOPIC", "VOCABULARY", "QUIZ"],
    example: "TOPIC",
  })
  contentType: "TOPIC" | "VOCABULARY" | "QUIZ";

  @ApiProperty({
    description: "Number of views",
    example: 5420,
  })
  viewCount: number;

  @ApiProperty({
    description: "Number of unique users who viewed",
    example: 1250,
  })
  uniqueUsers: number;

  @ApiProperty({
    description: "Average time spent (seconds)",
    example: 420,
  })
  averageTimeSpent: number;

  @ApiProperty({
    description: "Completion rate (0-100)",
    example: 78.5,
    nullable: true,
  })
  completionRate: number | null;

  @ApiProperty({
    description: "Ranking position",
    example: 1,
  })
  rank: number;
}

export class ContentPopularityResponseDto {
  @ApiProperty({
    description: "Time range description",
    example: "Last 7 Days",
  })
  timeRange: string;

  @ApiProperty({
    description: "Start date of the period",
    example: "2026-03-01T00:00:00Z",
  })
  startDate: string;

  @ApiProperty({
    description: "End date of the period",
    example: "2026-03-06T23:59:59Z",
  })
  endDate: string;

  @ApiProperty({
    description: "Top content items by popularity",
    type: [ContentPopularityItemDto],
  })
  topContent: ContentPopularityItemDto[];

  @ApiProperty({
    description: "Total content items analyzed",
    example: 150,
  })
  totalContentCount: number;
}

export class DashboardSummaryDto {
  @ApiProperty({
    description: "Current daily active users",
    example: 1250,
  })
  currentDAU: number;

  @ApiProperty({
    description: "DAU change from yesterday",
    example: 8.5,
  })
  dauChangePercent: number;

  @ApiProperty({
    description: "Total registered users",
    example: 15420,
  })
  totalUsers: number;

  @ApiProperty({
    description: "New users today",
    example: 45,
  })
  newUsersToday: number;

  @ApiProperty({
    description: "Average session length today (seconds)",
    example: 1800,
  })
  averageSessionLength: number;

  @ApiProperty({
    description: "Average session length formatted",
    example: "00:30:00",
  })
  averageSessionLengthFormatted: string;

  @ApiProperty({
    description: "Total sessions today",
    example: 3500,
  })
  totalSessions: number;

  @ApiProperty({
    description: "Most popular content today",
    type: ContentPopularityItemDto,
    required: false,
    nullable: true,
  })
  topContent?: ContentPopularityItemDto;

  @ApiProperty({
    description: "Total content views today",
    example: 8750,
  })
  totalContentViews: number;
}

export class UserEngagementDto {
  @ApiProperty({
    description: "Date of the metric",
    example: "2026-03-06",
  })
  date: string;

  @ApiProperty({
    description: "Engagement rate (active users / total users)",
    example: 45.5,
  })
  engagementRate: number;

  @ApiProperty({
    description: "Average actions per user",
    example: 12.5,
  })
  averageActionsPerUser: number;

  @ApiProperty({
    description: "Return rate (users who came back)",
    example: 68.2,
  })
  returnRate: number;
}

export class DbStatsResponseDto {
  @ApiProperty({ description: "Total topics in DB", example: 12 })
  totalTopics: number;

  @ApiProperty({ description: "Total vocabularies in DB", example: 340 })
  totalVocabularies: number;

  @ApiProperty({ description: "Total quiz questions in DB", example: 87 })
  totalQuizQuestions: number;

  @ApiProperty({ description: "Total topic-level quizzes in DB", example: 25 })
  totalTopicQuizzes: number;

  @ApiProperty({
    description: "Average pronunciation accuracy score (0-100)",
    example: 72.5,
  })
  avgPronunciationScore: number;

  @ApiProperty({ description: "Total pronunciation attempts", example: 1500 })
  totalPronunciationAttempts: number;

  @ApiProperty({
    description: "Average quiz score in learning progress (0-100)",
    example: 68.3,
  })
  avgLearningScore: number;

  @ApiProperty({
    description: "Total learning progress records",
    example: 2200,
  })
  totalLearningRecords: number;
}

export class InsufficientDataResponseDto {
  @ApiProperty({
    description: "Error message",
    example: "Not enough data yet",
  })
  message: string;

  @ApiProperty({
    description: "Minimum data points required",
    example: 7,
  })
  minimumRequired: number;

  @ApiProperty({
    description: "Current data points available",
    example: 2,
  })
  currentAvailable: number;

  @ApiProperty({
    description: "Suggested time range",
    example:
      "Please try a shorter time range or wait for more data to accumulate",
  })
  suggestion: string;
}
