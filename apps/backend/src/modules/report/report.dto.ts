import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsBoolean, IsOptional, IsString, IsInt, Min } from 'class-validator';

/**
 * Delivery channel for progress reports
 */
export enum DeliveryChannel {
  EMAIL = 'EMAIL',
  ZALO = 'ZALO',
  IN_APP = 'IN_APP', // Fallback channel
}

/**
 * Report frequency (currently weekly)
 */
export enum ReportFrequency {
  WEEKLY = 'WEEKLY',
  // MONTHLY = 'MONTHLY', // Future enhancement
}

/**
 * Report preference DTO for parent subscription management
 */
export class ReportPreferenceDto {
  @ApiProperty({
    description: 'Parent user ID',
    example: 1,
  })
  parentId: number;

  @ApiProperty({
    description: 'Is parent subscribed to reports?',
    example: true,
  })
  isSubscribed: boolean;

  @ApiProperty({
    description: 'Preferred delivery channel',
    enum: DeliveryChannel,
    example: DeliveryChannel.EMAIL,
  })
  preferredChannel: DeliveryChannel;

  @ApiProperty({
    description: 'Email address for delivery (if EMAIL channel selected)',
    example: 'parent@edukids.com',
  })
  email?: string;

  @ApiProperty({
    description: 'Zalo phone number (if ZALO channel selected)',
    example: '84912345678',
  })
  zaloPhoneNumber?: string;

  @ApiProperty({
    description: 'Report frequency',
    enum: ReportFrequency,
    example: ReportFrequency.WEEKLY,
  })
  frequency: ReportFrequency;

  @ApiProperty({
    description: 'Day of week to receive report (0=Sunday, 6=Saturday)',
    example: 1, // Monday
  })
  reportDay: number;

  @ApiProperty({
    description: 'Time to receive report (24-hour format: 0-23)',
    example: 9, // 9 AM
  })
  reportHour: number;

  @ApiProperty({
    description: 'Last report sent timestamp',
    example: '2024-03-03T09:00:00Z',
  })
  lastReportSentAt?: Date;

  @ApiProperty({
    description: 'When preference was created',
    example: '2024-01-01T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When preference was last updated',
    example: '2024-03-01T10:00:00Z',
  })
  updatedAt: Date;
}

/**
 * Update report preference DTO
 */
export class UpdateReportPreferenceDto {
  @ApiPropertyOptional({
    description: 'Subscribe/unsubscribe',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isSubscribed?: boolean;

  @ApiPropertyOptional({
    description: 'Preferred delivery channel',
    enum: DeliveryChannel,
  })
  @IsOptional()
  @IsEnum(DeliveryChannel)
  preferredChannel?: DeliveryChannel;

  @ApiPropertyOptional({
    description: 'Email address',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Zalo phone number',
  })
  @IsOptional()
  @IsString()
  zaloPhoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Day of week (0-6)',
  })
  @IsOptional()
  reportDay?: number;

  @ApiPropertyOptional({
    description: 'Hour (0-23)',
  })
  @IsOptional()
  reportHour?: number;
}

/**
 * Child summary for report
 */
export class ReportChildSummaryDto {
  @ApiProperty({ example: 1 })
  childId: number;

  @ApiProperty({ example: 'Alice' })
  childName: string;

  @ApiProperty({ example: 7 })
  childAge: number;

  @ApiProperty({ example: 'https://cdn.edukids.com/avatars/child-1.png' })
  avatar: string;

  @ApiProperty({ example: 315, description: 'Minutes learned this week' })
  minutesLearned: number;

  @ApiProperty({ example: 5, description: 'Sessions completed' })
  sessionsCompleted: number;

  @ApiProperty({ example: 85, description: 'Pronunciation accuracy %' })
  pronunciationAccuracy: number;

  @ApiProperty({ example: 15, description: 'Quizzes completed' })
  quizzesCompleted: number;

  @ApiProperty({ example: 82, description: 'Average quiz score %' })
  averageQuizScore: number;

  @ApiProperty({ example: 120, description: 'Words learned' })
  wordsLearned: number;

  @ApiProperty({ example: 80, description: 'Vocabulary retention %' })
  vocabularyRetention: number;

  @ApiProperty({ example: 420, description: 'Total points earned' })
  totalPoints: number;

  @ApiProperty({ example: 9, description: 'Current level' })
  currentLevel: number;

  @ApiProperty({ example: 5, description: 'Badges earned this week' })
  newBadges: number;

  @ApiProperty({ example: 'Great progress this week! 🎉' })
  aiInsight: string;
}

/**
 * Weekly progress report DTO
 */
export class ProgressReportDto {
  @ApiProperty({ example: 'c7dc685d-4aa6-4ff7-a6d8-c4dd4c8228af' })
  reportId: string;

  @ApiProperty({ example: 1 })
  parentId: number;

  @ApiProperty({ example: '2024-03-03T09:00:00Z', description: 'Report week ending date' })
  weekEndingDate: Date;

  @ApiProperty({
    type: [ReportChildSummaryDto],
    description: 'Summary for each child',
  })
  children: ReportChildSummaryDto[];

  @ApiProperty({
    example: 'Your children completed 25 sessions this week with great results! 📊',
    description: 'Personalized summary message',
  })
  summaryMessage: string;

  @ApiProperty({
    example: 'Keep encouraging your children to learn daily! 🌟',
    description: 'Encouragement/next steps',
  })
  recommendations: string;

  @ApiProperty({
    example: '2024-03-03T09:00:00Z',
    description: 'When report was generated',
  })
  generatedAt: Date;

  @ApiProperty({
    example: '2024-03-03T09:05:00Z',
    description: 'When report was sent',
  })
  sentAt?: Date;

  @ApiProperty({
    example: DeliveryChannel.EMAIL,
    description: 'Channel used to send report',
  })
  deliveryChannel?: DeliveryChannel;
}

/**
 * In-app notification DTO (fallback)
 */
export class NotificationDto {
  @ApiProperty({ example: 'c7dc685d-4aa6-4ff7-a6d8-c4dd4c8228af' })
  notificationId: string;

  @ApiProperty({ example: 1 })
  parentId: number;

  @ApiProperty({ example: 'Weekly Progress Report' })
  title: string;

  @ApiProperty({
    example: 'Your children completed 25 sessions this week! View the full report.',
  })
  message: string;

  @ApiProperty({
    example: 'REPORT',
    description: 'Notification type',
  })
  type: string;

  @ApiProperty({ example: '101', description: 'Related entity ID if applicable' })
  relatedId?: string;

  @ApiProperty({ example: false, description: 'Has parent read this?' })
  isRead: boolean;

  @ApiProperty({ example: '2024-03-03T09:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-03-05T10:30:00Z' })
  readAt?: Date;
}

/**
 * Subscribe to reports DTO
 */
export class SubscribeToReportsDto {
  @ApiProperty({
    description: 'Preferred delivery channel',
    enum: DeliveryChannel,
    example: DeliveryChannel.EMAIL,
  })
  preferredChannel: DeliveryChannel;

  @ApiPropertyOptional({
    description: 'Email address (if EMAIL channel)',
    example: 'parent@edukids.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Zalo phone number (if ZALO channel)',
    example: '84912345678',
  })
  @IsOptional()
  @IsString()
  zaloPhoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Day of week (0=Sunday, 6=Saturday). Default: 1 (Monday)',
    example: 1,
  })
  @IsOptional()
  reportDay?: number;

  @ApiPropertyOptional({
    description: 'Hour to receive (0-23). Default: 9 (9 AM)',
    example: 9,
  })
  @IsOptional()
  reportHour?: number;
}

/**
 * Response after subscription
 */
export class SubscriptionResultDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Successfully subscribed to weekly progress reports! 📧' })
  message: string;

  @ApiProperty({ type: ReportPreferenceDto })
  preference: ReportPreferenceDto;
}

/**
 * Response for unsubscribe
 */
export class UnsubscriptionResultDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Successfully unsubscribed from progress reports.' })
  message: string;
}

export enum ReportRange {
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  ALL = 'ALL',
}

export class GenerateReportDto {
  @ApiProperty({ example: 1, description: 'Child profile ID' })
  @IsInt()
  @Min(1)
  childId: number;

  @ApiPropertyOptional({
    enum: ReportRange,
    example: ReportRange.WEEK,
    description: 'Report range for analytics aggregation',
  })
  @IsOptional()
  @IsEnum(ReportRange)
  range?: ReportRange;
}

export class SendReportDto {
  @ApiProperty({ example: 1, description: 'Child profile ID' })
  @IsInt()
  @Min(1)
  childId: number;

  @ApiPropertyOptional({
    enum: ReportRange,
    example: ReportRange.WEEK,
    description: 'Report range for analytics aggregation',
  })
  @IsOptional()
  @IsEnum(ReportRange)
  range?: ReportRange;

  @ApiPropertyOptional({
    example: 'weekly',
    description: 'Requested recurring schedule from client UI',
  })
  @IsOptional()
  @IsString()
  schedule?: string;
}

export class ReportSendResultDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Report sent successfully' })
  message: string;

  @ApiProperty({ example: 'c7dc685d-4aa6-4ff7-a6d8-c4dd4c8228af' })
  reportId: string;

  @ApiProperty({ type: ProgressReportDto })
  report: ProgressReportDto;
}
