import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";

/**
 * Repository for admin analytics data persistence and aggregation
 * Handles historical data stored in PostgreSQL
 */
@Injectable()
export class AdminAnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get new users count for a date range
   */
  async getNewUsersCount(startDate: Date, endDate: Date): Promise<number> {
    return this.prisma.user.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  /**
   * Get new users grouped by date
   */
  async getNewUsersByDate(
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ date: string; count: number }>> {
    const users = await this.prisma.$queryRaw<
      Array<{ date: string; count: bigint }>
    >`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= ${startDate} AND created_at <= ${endDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return users.map((u) => ({
      date: u.date,
      count: Number(u.count),
    }));
  }

  /**
   * Get total registered users
   */
  async getTotalUsersCount(): Promise<number> {
    return this.prisma.user.count();
  }

  /**
   * Get user activity sessions for date range
   */
  async getUserSessions(startDate: Date, endDate: Date) {
    return this.prisma.$queryRaw<
      Array<{
        user_id: string;
        session_date: Date;
        session_count: bigint;
        total_duration: bigint;
      }>
    >`
      SELECT 
        user_id,
        DATE(created_at) as session_date,
        COUNT(*) as session_count,
        SUM(EXTRACT(EPOCH FROM (updated_at - created_at))) as total_duration
      FROM user_sessions
      WHERE created_at >= ${startDate} 
        AND created_at <= ${endDate}
        AND updated_at IS NOT NULL
      GROUP BY user_id, DATE(created_at)
      ORDER BY session_date ASC
    `;
  }

  /**
   * Get content views aggregated by content
   */
  async getContentViews(
    startDate: Date,
    endDate: Date,
    contentType?: "TOPIC" | "VOCABULARY" | "QUIZ",
  ) {
    const whereClause = contentType
      ? `WHERE created_at >= ${startDate} AND created_at <= ${endDate} AND content_type = '${contentType}'`
      : `WHERE created_at >= ${startDate} AND created_at <= ${endDate}`;

    return this.prisma.$queryRaw<
      Array<{
        content_id: string;
        content_type: string;
        view_count: bigint;
        unique_users: bigint;
      }>
    >`
      SELECT 
        content_id,
        content_type,
        COUNT(*) as view_count,
        COUNT(DISTINCT user_id) as unique_users
      FROM content_views
      ${whereClause}
      GROUP BY content_id, content_type
      ORDER BY view_count DESC
    `;
  }

  /**
   * Get topic details by IDs
   */
  async getTopicsByIds(topicIds: string[]) {
    const numIds = topicIds.map((id) => parseInt(id, 10));
    return this.prisma.topic.findMany({
      where: {
        id: { in: numIds },
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  /**
   * Get vocabulary (flashcard) details by IDs
   */
  async getVocabulariesByIds(vocabIds: string[]) {
    // flashcard model doesn't exist, use vocabulary instead
    const numIds = vocabIds.map((id) => parseInt(id, 10));
    return this.prisma.vocabulary.findMany({
      where: {
        id: { in: numIds },
      },
      select: {
        id: true,
        word: true,
      },
    });
  }

  /**
   * Get quiz details by IDs
   */
  async getQuizzesByIds(_quizIds: string[]) {
    // quizStructure model doesn't exist in schema
    return [];
  }

  /**
   * Get content completion stats
   */
  async getContentCompletionStats(
    _contentId: string,
    _contentType: "TOPIC" | "VOCABULARY" | "QUIZ",
    _startDate: Date,
    _endDate: Date,
  ): Promise<{ started: number; completed: number }> {
    // Stub implementation - schema doesn't have user_progress table
    return { started: 0, completed: 0 };
  }

  /**
   * Get average time spent on content
   */
  async getContentAverageTimeSpent(
    contentId: string,
    contentType: "TOPIC" | "VOCABULARY" | "QUIZ",
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.prisma.$queryRaw<
      Array<{
        avg_time: number;
      }>
    >`
      SELECT 
        AVG(time_spent_seconds) as avg_time
      FROM content_interactions
      WHERE content_id = ${contentId}
        AND content_type = ${contentType}
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
    `;

    return result[0]?.avg_time || 0;
  }

  /**
   * Get learning progress stats
   */
  async getLearningProgressStats(startDate: Date, endDate: Date) {
    return this.prisma.$queryRaw<
      Array<{
        user_id: string;
        topics_completed: bigint;
        vocab_learned: bigint;
        quizzes_completed: bigint;
        avg_score: number;
      }>
    >`
      SELECT 
        user_id,
        COUNT(DISTINCT CASE WHEN content_type = 'TOPIC' AND completed = true THEN content_id END) as topics_completed,
        COUNT(DISTINCT CASE WHEN content_type = 'VOCABULARY' AND completed = true THEN content_id END) as vocab_learned,
        COUNT(DISTINCT CASE WHEN content_type = 'QUIZ' AND completed = true THEN content_id END) as quizzes_completed,
        AVG(CASE WHEN content_type = 'QUIZ' THEN score ELSE NULL END) as avg_score
      FROM user_progress
      WHERE created_at >= ${startDate} AND created_at <= ${endDate}
      GROUP BY user_id
    `;
  }

  /**
   * Get user engagement metrics
   */
  async getUserEngagementMetrics(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get active users count
    const activeUsers = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT user_id) as count
      FROM user_sessions
      WHERE created_at >= ${startOfDay} AND created_at <= ${endOfDay}
    `;

    // Get total users count
    const totalUsers = await this.getTotalUsersCount();

    // Get users who returned (had session before and today)
    const returningUsers = await this.prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(DISTINCT s1.user_id) as count
      FROM user_sessions s1
      WHERE s1.created_at >= ${startOfDay} 
        AND s1.created_at <= ${endOfDay}
        AND EXISTS (
          SELECT 1 FROM user_sessions s2
          WHERE s2.user_id = s1.user_id
            AND s2.created_at < ${startOfDay}
        )
    `;

    // Get average actions per user
    const actionsPerUser = await this.prisma.$queryRaw<
      Array<{ avg_actions: number }>
    >`
      SELECT AVG(action_count) as avg_actions
      FROM (
        SELECT user_id, COUNT(*) as action_count
        FROM user_actions
        WHERE created_at >= ${startOfDay} AND created_at <= ${endOfDay}
        GROUP BY user_id
      ) as user_actions_count
    `;

    return {
      activeUsers: Number(activeUsers[0]?.count || 0),
      totalUsers,
      returningUsers: Number(returningUsers[0]?.count || 0),
      averageActionsPerUser: actionsPerUser[0]?.avg_actions || 0,
    };
  }

  /**
   * Store aggregated analytics snapshot (for historical data)
   */
  async storeAnalyticsSnapshot(data: {
    date: Date;
    metric: string;
    value: number;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.analyticsSnapshot.create({
      data: {
        date: data.date,
        metric: data.metric,
        value: data.value,
        metadata: data.metadata || {},
      },
    });
  }

  /**
   * Get analytics snapshot by metric and date range
   */
  async getAnalyticsSnapshots(metric: string, startDate: Date, endDate: Date) {
    return this.prisma.analyticsSnapshot.findMany({
      where: {
        metric,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });
  }
}
