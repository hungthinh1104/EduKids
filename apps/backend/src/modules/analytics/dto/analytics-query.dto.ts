import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';

export enum TimeRange {
  TODAY = 'TODAY',
  YESTERDAY = 'YESTERDAY',
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_30_DAYS = 'LAST_30_DAYS',
  LAST_90_DAYS = 'LAST_90_DAYS',
  THIS_MONTH = 'THIS_MONTH',
  LAST_MONTH = 'LAST_MONTH',
  CUSTOM = 'CUSTOM',
}

export enum MetricType {
  DAU = 'DAU',                          // Daily Active Users
  WAU = 'WAU',                          // Weekly Active Users
  MAU = 'MAU',                          // Monthly Active Users
  SESSION_LENGTH = 'SESSION_LENGTH',    // Average session duration
  CONTENT_POPULARITY = 'CONTENT_POPULARITY',
  USER_ENGAGEMENT = 'USER_ENGAGEMENT',
  LEARNING_PROGRESS = 'LEARNING_PROGRESS',
}

export class AnalyticsQueryDto {
  @ApiProperty({
    description: 'Time range for analytics',
    enum: TimeRange,
    example: TimeRange.LAST_7_DAYS,
    required: false,
    default: TimeRange.LAST_7_DAYS,
  })
  @IsEnum(TimeRange)
  @IsOptional()
  timeRange?: TimeRange = TimeRange.LAST_7_DAYS;

  @ApiProperty({
    description: 'Start date for custom time range (ISO 8601)',
    example: '2026-03-01T00:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'End date for custom time range (ISO 8601)',
    example: '2026-03-06T23:59:59Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Metric type to retrieve',
    enum: MetricType,
    example: MetricType.DAU,
    required: false,
  })
  @IsEnum(MetricType)
  @IsOptional()
  metricType?: MetricType;
}

export class ContentPopularityQueryDto extends AnalyticsQueryDto {
  @ApiProperty({
    description: 'Number of top items to return',
    example: 10,
    default: 10,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({
    description: 'Filter by content type',
    enum: ['TOPIC', 'VOCABULARY', 'QUIZ'],
    example: 'TOPIC',
    required: false,
  })
  @IsEnum(['TOPIC', 'VOCABULARY', 'QUIZ'])
  @IsOptional()
  contentType?: 'TOPIC' | 'VOCABULARY' | 'QUIZ';
}
