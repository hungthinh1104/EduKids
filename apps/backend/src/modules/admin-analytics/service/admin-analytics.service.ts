import { Injectable, BadRequestException } from "@nestjs/common";
import { AdminAnalyticsRepository } from "../repository/admin-analytics.repository";
import { RedisAnalyticsService } from "./redis-analytics.service";
import {
  AnalyticsQueryDto,
  TimeRange,
  ContentPopularityQueryDto,
} from "../dto/analytics-query.dto";
import {
  DAUResponseDto,
  DailyActiveUsersDto,
  SessionLengthResponseDto,
  SessionLengthDto,
  ContentPopularityResponseDto,
  ContentPopularityItemDto,
  DashboardSummaryDto,
  DbStatsResponseDto,
  InsufficientDataResponseDto,
} from "../dto/analytics-response.dto";

type TrackableContentType = "TOPIC" | "VOCABULARY" | "QUIZ";

@Injectable()
export class AdminAnalyticsService {
  constructor(
    private readonly analyticsRepository: AdminAnalyticsRepository,
    private readonly redisAnalytics: RedisAnalyticsService,
  ) {}

  /**
   * Get Daily Active Users (DAU) metrics
   */
  async getDailyActiveUsers(
    queryDto: AnalyticsQueryDto,
  ): Promise<DAUResponseDto | InsufficientDataResponseDto> {
    const {
      startDate,
      endDate,
      timeRange: timeRangeLabel,
    } = this.getDateRange(
      queryDto.timeRange,
      queryDto.startDate,
      queryDto.endDate,
    );

    const dates = this.redisAnalytics.getDatesInRange(startDate, endDate);

    if (dates.length === 0) {
      return this.insufficientDataResponse(1, 0);
    }

    const dailyData: DailyActiveUsersDto[] = [];
    let maxDAU = 0;
    let sumDAU = 0;

    // Collect all unique users across the period
    const allUniqueUsers = new Set<string>();

    for (let i = 0; i < dates.length; i++) {
      const dateStr = dates[i];
      const date = new Date(dateStr);

      // Get DAU from Redis
      const activeUsers = await this.redisAnalytics.getDailyActiveUsers(date);
      const activeUsersList =
        await this.redisAnalytics.getDailyActiveUsersList(date);

      activeUsersList.forEach((u) => allUniqueUsers.add(u));

      // Get new users from database
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      const newUsers = await this.analyticsRepository.getNewUsersCount(
        date,
        nextDay,
      );

      // Calculate change percent
      let changePercent: number | null = null;
      if (i > 0 && dailyData[i - 1]) {
        const prevDAU = dailyData[i - 1].activeUsers;
        if (prevDAU > 0) {
          changePercent = ((activeUsers - prevDAU) / prevDAU) * 100;
        }
      }

      dailyData.push({
        date: dateStr,
        activeUsers,
        newUsers,
        changePercent,
      });

      maxDAU = Math.max(maxDAU, activeUsers);
      sumDAU += activeUsers;
    }

    const totalUniqueUsers = allUniqueUsers.size;

    return {
      timeRange: timeRangeLabel,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      dailyData,
      averageDAU:
        dailyData.length > 0 ? Math.round(sumDAU / dailyData.length) : 0,
      peakDAU: maxDAU,
      totalUniqueUsers,
    };
  }

  /**
   * Get session length metrics
   */
  async getSessionLength(
    queryDto: AnalyticsQueryDto,
  ): Promise<SessionLengthResponseDto | InsufficientDataResponseDto> {
    const {
      startDate,
      endDate,
      timeRange: timeRangeLabel,
    } = this.getDateRange(
      queryDto.timeRange,
      queryDto.startDate,
      queryDto.endDate,
    );

    const dates = this.redisAnalytics.getDatesInRange(startDate, endDate);

    if (dates.length === 0) {
      return this.insufficientDataResponse(1, 0);
    }

    const dailyData: SessionLengthDto[] = [];
    let totalSessions = 0;
    let totalDuration = 0;

    for (const dateStr of dates) {
      const date = new Date(dateStr);

      // Get session durations from Redis
      const durations = await this.redisAnalytics.getSessionDurations(date);

      if (durations.length === 0) {
        dailyData.push({
          date: dateStr,
          averageSeconds: 0,
          averageFormatted: "00:00:00",
          medianSeconds: 0,
          sessionCount: 0,
        });
        continue;
      }

      const sessionCount = durations.length;
      const sum = durations.reduce((acc, d) => acc + d, 0);
      const averageSeconds = Math.round(sum / sessionCount);

      // Calculate median
      const sorted = [...durations].sort((a, b) => a - b);
      const medianSeconds =
        sorted.length % 2 === 0
          ? Math.round(
              (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2,
            )
          : sorted[Math.floor(sorted.length / 2)];

      dailyData.push({
        date: dateStr,
        averageSeconds,
        averageFormatted: this.formatSeconds(averageSeconds),
        medianSeconds,
        sessionCount,
      });

      totalSessions += sessionCount;
      totalDuration += sum;
    }

    const overallAverageSeconds =
      totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;

    return {
      timeRange: timeRangeLabel,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      dailyData,
      overallAverageSeconds,
      overallAverageFormatted: this.formatSeconds(overallAverageSeconds),
      totalSessions,
    };
  }

  /**
   * Get content popularity metrics
   */
  async getContentPopularity(
    queryDto: ContentPopularityQueryDto,
  ): Promise<ContentPopularityResponseDto | InsufficientDataResponseDto> {
    const {
      startDate,
      endDate,
      timeRange: timeRangeLabel,
    } = this.getDateRange(
      queryDto.timeRange,
      queryDto.startDate,
      queryDto.endDate,
    );
    const limit = queryDto.limit || 10;
    const contentType = queryDto.contentType;

    const dates = this.redisAnalytics.getDatesInRange(startDate, endDate);

    if (dates.length === 0) {
      return this.insufficientDataResponse(1, 0);
    }

    // Aggregate views across all dates
    const contentViews = new Map<string, { viewCount: number }>();

    for (const dateStr of dates) {
      const date = new Date(dateStr);

      // Get top content from Redis for each content type
      const types: TrackableContentType[] = contentType
        ? [contentType]
        : ["TOPIC", "VOCABULARY", "QUIZ"];

      for (const type of types) {
        const topContent = await this.redisAnalytics.getTopContentByViews(
          date,
          type,
          100,
        );

        for (const content of topContent) {
          const key = `${type}:${content.contentId}`;

          if (!contentViews.has(key)) {
            contentViews.set(key, { viewCount: 0 });
          }

          const stats = contentViews.get(key)!;
          stats.viewCount += content.viewCount;
        }
      }
    }

    // Sort by view count and take top N
    const sortedContent = Array.from(contentViews.entries())
      .sort((a, b) => b[1].viewCount - a[1].viewCount)
      .slice(0, limit);

    // Fetch content details and build response
    const topContent: ContentPopularityItemDto[] = [];

    for (let i = 0; i < sortedContent.length; i++) {
      const [key, stats] = sortedContent[i];
      const [type, contentId] = key.split(":");

      // Get content name from database
      let contentName = "Unknown";
      if (type === "TOPIC") {
        const topics = await this.analyticsRepository.getTopicsByIds([
          contentId,
        ]);
        contentName = topics[0]?.name || "Unknown Topic";
      } else if (type === "VOCABULARY") {
        const vocabs = await this.analyticsRepository.getVocabulariesByIds([
          contentId,
        ]);
        contentName = vocabs[0]?.word || "Unknown Vocabulary";
      } else if (type === "QUIZ") {
        const quizzes = await this.analyticsRepository.getQuizzesByIds([
          contentId,
        ]);
        contentName = quizzes[0]?.question || "Unknown Quiz";
      }

      // Get average time spent across selected period
      let totalTimeSpent = 0;
      let totalTimeRecords = 0;

      for (const dateStr of dates) {
        const timeSpentData = await this.redisAnalytics.getContentTimeSpent(
          contentId,
          type as TrackableContentType,
          new Date(dateStr),
        );
        totalTimeSpent += timeSpentData.reduce((acc, t) => acc + t, 0);
        totalTimeRecords += timeSpentData.length;
      }

      const averageTimeSpent =
        totalTimeRecords > 0
          ? Math.round(totalTimeSpent / totalTimeRecords)
          : 0;

      // Get completion rate across selected period
      let totalStarted = 0;
      let totalCompleted = 0;
      for (const dateStr of dates) {
        const completionStats =
          await this.redisAnalytics.getContentCompletionStats(
            contentId,
            type as TrackableContentType,
            new Date(dateStr),
          );
        totalStarted += completionStats.started;
        totalCompleted += completionStats.completed;
      }
      const completionRate =
        totalStarted > 0 ? (totalCompleted / totalStarted) * 100 : 0;

      // Get unique viewers (true distinct users across selected period)
      const uniqueUserIds = new Set<string>();
      for (const dateStr of dates) {
        const viewerIds = await this.redisAnalytics.getContentUniqueViewerIds(
          contentId,
          type as TrackableContentType,
          new Date(dateStr),
        );
        viewerIds.forEach((viewerId) => uniqueUserIds.add(viewerId));
      }
      const uniqueUsers = uniqueUserIds.size;

      topContent.push({
        contentId,
        contentName,
        contentType: type as TrackableContentType,
        viewCount: stats.viewCount,
        uniqueUsers,
        averageTimeSpent,
        completionRate,
        rank: i + 1,
      });
    }

    return {
      timeRange: timeRangeLabel,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      topContent,
      totalContentCount: contentViews.size,
    };
  }

  /**
   * Get dashboard summary (real-time)
   */
  async getDashboardSummary(): Promise<DashboardSummaryDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get today's DAU
    const currentDAU = await this.redisAnalytics.getDailyActiveUsers(today);

    // Get yesterday's DAU for comparison
    const yesterdayDAU =
      await this.redisAnalytics.getDailyActiveUsers(yesterday);
    const dauChangePercent =
      yesterdayDAU > 0 ? ((currentDAU - yesterdayDAU) / yesterdayDAU) * 100 : 0;

    // Get total users
    const totalUsers = await this.analyticsRepository.getTotalUsersCount();

    // Get new users today
    const newUsersToday = await this.analyticsRepository.getNewUsersCount(
      today,
      tomorrow,
    );

    // Get today's session data
    const sessionDurations =
      await this.redisAnalytics.getSessionDurations(today);
    const averageSessionLength =
      sessionDurations.length > 0
        ? Math.round(
            sessionDurations.reduce((acc, d) => acc + d, 0) /
              sessionDurations.length,
          )
        : 0;

    // Get top content today
    const topContentData = await this.redisAnalytics.getTopContentByViews(
      today,
      "TOPIC",
      1,
    );
    let topContent: ContentPopularityItemDto | undefined;

    if (topContentData.length > 0) {
      const content = topContentData[0];
      const topics = await this.analyticsRepository.getTopicsByIds([
        content.contentId,
      ]);
      const uniqueUsers = await this.redisAnalytics.getContentUniqueViewers(
        content.contentId,
        "TOPIC",
        today,
      );
      const timeSpentData = await this.redisAnalytics.getContentTimeSpent(
        content.contentId,
        "TOPIC",
        today,
      );
      const averageTimeSpent =
        timeSpentData.length > 0
          ? Math.round(
              timeSpentData.reduce((acc, t) => acc + t, 0) /
                timeSpentData.length,
            )
          : 0;

      topContent = {
        contentId: content.contentId,
        contentName: topics[0]?.name || "Unknown",
        contentType: "TOPIC",
        viewCount: content.viewCount,
        uniqueUsers,
        averageTimeSpent,
        completionRate: null,
        rank: 1,
      };
    }

    // Calculate total content views today
    const topicViews = await this.redisAnalytics.getTopContentByViews(
      today,
      "TOPIC",
      100,
    );
    const vocabViews = await this.redisAnalytics.getTopContentByViews(
      today,
      "VOCABULARY",
      100,
    );
    const quizViews = await this.redisAnalytics.getTopContentByViews(
      today,
      "QUIZ",
      100,
    );

    const totalContentViews =
      topicViews.reduce((acc, c) => acc + c.viewCount, 0) +
      vocabViews.reduce((acc, c) => acc + c.viewCount, 0) +
      quizViews.reduce((acc, c) => acc + c.viewCount, 0);

    return {
      currentDAU,
      dauChangePercent: Math.round(dauChangePercent * 10) / 10,
      totalUsers,
      newUsersToday,
      averageSessionLength,
      averageSessionLengthFormatted: this.formatSeconds(averageSessionLength),
      totalSessions: sessionDurations.length,
      topContent,
      totalContentViews,
    };
  }

  /**
   * Get real DB-backed platform statistics
   */
  async getDbStats(): Promise<DbStatsResponseDto> {
    return this.analyticsRepository.getDbStats();
  }

  /**
   * Helper: Get date range based on TimeRange enum
   */
  private getDateRange(
    timeRange: TimeRange,
    customStartDate?: string,
    customEndDate?: string,
  ): { startDate: Date; endDate: Date; timeRange: string } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let timeRangeLabel: string;

    switch (timeRange) {
      case TimeRange.TODAY:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        timeRangeLabel = "Today";
        break;

      case TimeRange.YESTERDAY:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        timeRangeLabel = "Yesterday";
        break;

      case TimeRange.LAST_7_DAYS:
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        timeRangeLabel = "Last 7 Days";
        break;

      case TimeRange.LAST_30_DAYS:
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        timeRangeLabel = "Last 30 Days";
        break;

      case TimeRange.LAST_90_DAYS:
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 89);
        startDate.setHours(0, 0, 0, 0);
        timeRangeLabel = "Last 90 Days";
        break;

      case TimeRange.THIS_MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );
        timeRangeLabel = "This Month";
        break;

      case TimeRange.LAST_MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
          23,
          59,
          59,
          999,
        );
        timeRangeLabel = "Last Month";
        break;

      case TimeRange.CUSTOM:
        if (!customStartDate || !customEndDate) {
          throw new BadRequestException(
            "Start date and end date are required for custom time range",
          );
        }
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        timeRangeLabel = "Custom Range";
        break;

      default:
        throw new BadRequestException("Invalid time range");
    }

    return { startDate, endDate, timeRange: timeRangeLabel };
  }

  /**
   * Helper: Format seconds to HH:MM:SS
   */
  private formatSeconds(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  /**
   * Helper: Create insufficient data response
   */
  private insufficientDataResponse(
    minimum: number,
    available: number,
  ): InsufficientDataResponseDto {
    return {
      message: "Not enough data yet",
      minimumRequired: minimum,
      currentAvailable: available,
      suggestion:
        "Please try a shorter time range or wait for more data to accumulate",
    };
  }
}
