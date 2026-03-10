import { Injectable, Inject } from "@nestjs/common";
import { Redis } from "ioredis";

/**
 * Redis service for real-time analytics tracking
 * Uses Redis sorted sets and hashes for high-performance metric storage
 */
@Injectable()
export class RedisAnalyticsService {
  constructor(@Inject("REDIS_CLIENT") private readonly redis: Redis) {}

  /**
   * Track user activity (for DAU calculation)
   */
  async trackUserActivity(userId: string, timestamp?: Date): Promise<void> {
    const date = timestamp || new Date();
    const dateKey = this.getDateKey(date);

    // Add user to daily active users set
    const dauKey = `analytics:dau:${dateKey}`;
    await this.redis.sadd(dauKey, userId);
    await this.redis.expire(dauKey, 90 * 24 * 60 * 60); // Keep for 90 days

    // Track hourly activity for granular analysis
    const hour = date.getHours();
    const hourKey = `analytics:dau:${dateKey}:hour:${hour}`;
    await this.redis.sadd(hourKey, userId);
    await this.redis.expire(hourKey, 7 * 24 * 60 * 60); // Keep for 7 days
  }

  /**
   * Track session start
   */
  async trackSessionStart(userId: string, sessionId: string): Promise<void> {
    const timestamp = Date.now();
    const sessionKey = `analytics:session:${sessionId}`;

    await this.redis.hset(sessionKey, {
      userId,
      startTime: timestamp,
      lastActivity: timestamp,
    });
    await this.redis.expire(sessionKey, 24 * 60 * 60); // Expire after 24 hours
  }

  /**
   * Update session activity (heartbeat)
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    const sessionKey = `analytics:session:${sessionId}`;
    const timestamp = Date.now();

    await this.redis.hset(sessionKey, "lastActivity", timestamp);
    await this.redis.expire(sessionKey, 24 * 60 * 60);
  }

  /**
   * Track session end and calculate duration
   */
  async trackSessionEnd(sessionId: string): Promise<number | null> {
    const sessionKey = `analytics:session:${sessionId}`;
    const sessionData = await this.redis.hgetall(sessionKey);

    if (!sessionData || !sessionData.startTime || !sessionData.lastActivity) {
      return null;
    }

    const duration = Math.floor(
      (parseInt(sessionData.lastActivity) - parseInt(sessionData.startTime)) /
        1000,
    );

    // Store session duration for aggregation
    const date = new Date();
    const dateKey = this.getDateKey(date);
    const durationKey = `analytics:session_duration:${dateKey}`;

    await this.redis.rpush(durationKey, duration.toString());
    await this.redis.expire(durationKey, 90 * 24 * 60 * 60); // Keep for 90 days

    // Clean up session data
    await this.redis.del(sessionKey);

    return duration;
  }

  /**
   * Track content view
   */
  async trackContentView(
    contentId: string,
    contentType: "TOPIC" | "VOCABULARY" | "QUIZ",
    userId: string,
    timestamp?: Date,
  ): Promise<void> {
    const date = timestamp || new Date();
    const dateKey = this.getDateKey(date);

    // Increment total view count
    const viewCountKey = `analytics:content:${contentType}:${contentId}:views:${dateKey}`;
    await this.redis.incr(viewCountKey);
    await this.redis.expire(viewCountKey, 90 * 24 * 60 * 60);

    // Track unique viewers
    const uniqueViewersKey = `analytics:content:${contentType}:${contentId}:unique:${dateKey}`;
    await this.redis.sadd(uniqueViewersKey, userId);
    await this.redis.expire(uniqueViewersKey, 90 * 24 * 60 * 60);

    // Add to sorted set for ranking (score = view count)
    const rankingKey = `analytics:content_ranking:${contentType}:${dateKey}`;
    await this.redis.zincrby(rankingKey, 1, contentId);
    await this.redis.expire(rankingKey, 90 * 24 * 60 * 60);
  }

  /**
   * Track time spent on content
   */
  async trackContentTimeSpent(
    contentId: string,
    contentType: "TOPIC" | "VOCABULARY" | "QUIZ",
    timeSpentSeconds: number,
    timestamp?: Date,
  ): Promise<void> {
    const date = timestamp || new Date();
    const dateKey = this.getDateKey(date);

    const timeSpentKey = `analytics:content:${contentType}:${contentId}:time:${dateKey}`;
    await this.redis.rpush(timeSpentKey, timeSpentSeconds.toString());
    await this.redis.expire(timeSpentKey, 90 * 24 * 60 * 60);
  }

  /**
   * Track content completion
   */
  async trackContentCompletion(
    contentId: string,
    contentType: "TOPIC" | "VOCABULARY" | "QUIZ",
    completed: boolean,
    timestamp?: Date,
  ): Promise<void> {
    const date = timestamp || new Date();
    const dateKey = this.getDateKey(date);

    const completionKey = `analytics:content:${contentType}:${contentId}:completion:${dateKey}`;
    await this.redis.hincrby(
      completionKey,
      completed ? "completed" : "started",
      1,
    );
    await this.redis.expire(completionKey, 90 * 24 * 60 * 60);
  }

  /**
   * Get daily active users count for a specific date
   */
  async getDailyActiveUsers(date: Date): Promise<number> {
    const dateKey = this.getDateKey(date);
    const dauKey = `analytics:dau:${dateKey}`;
    return this.redis.scard(dauKey);
  }

  /**
   * Get daily active users list for a specific date
   */
  async getDailyActiveUsersList(date: Date): Promise<string[]> {
    const dateKey = this.getDateKey(date);
    const dauKey = `analytics:dau:${dateKey}`;
    return this.redis.smembers(dauKey);
  }

  /**
   * Get session durations for a specific date
   */
  async getSessionDurations(date: Date): Promise<number[]> {
    const dateKey = this.getDateKey(date);
    const durationKey = `analytics:session_duration:${dateKey}`;
    const durations = await this.redis.lrange(durationKey, 0, -1);
    return durations.map((d) => parseInt(d));
  }

  /**
   * Get top content by views for a specific date
   */
  async getTopContentByViews(
    date: Date,
    contentType: "TOPIC" | "VOCABULARY" | "QUIZ",
    limit: number = 10,
  ): Promise<Array<{ contentId: string; viewCount: number }>> {
    const dateKey = this.getDateKey(date);
    const rankingKey = `analytics:content_ranking:${contentType}:${dateKey}`;

    // Get top N with scores (view counts)
    const results = await this.redis.zrevrange(
      rankingKey,
      0,
      limit - 1,
      "WITHSCORES",
    );

    // Parse results: [contentId1, score1, contentId2, score2, ...]
    const topContent: Array<{ contentId: string; viewCount: number }> = [];
    for (let i = 0; i < results.length; i += 2) {
      topContent.push({
        contentId: results[i],
        viewCount: parseInt(results[i + 1]),
      });
    }

    return topContent;
  }

  /**
   * Get unique viewers count for content
   */
  async getContentUniqueViewers(
    contentId: string,
    contentType: "TOPIC" | "VOCABULARY" | "QUIZ",
    date: Date,
  ): Promise<number> {
    const dateKey = this.getDateKey(date);
    const uniqueViewersKey = `analytics:content:${contentType}:${contentId}:unique:${dateKey}`;
    return this.redis.scard(uniqueViewersKey);
  }

  /**
   * Get content time spent data
   */
  async getContentTimeSpent(
    contentId: string,
    contentType: "TOPIC" | "VOCABULARY" | "QUIZ",
    date: Date,
  ): Promise<number[]> {
    const dateKey = this.getDateKey(date);
    const timeSpentKey = `analytics:content:${contentType}:${contentId}:time:${dateKey}`;
    const times = await this.redis.lrange(timeSpentKey, 0, -1);
    return times.map((t) => parseInt(t));
  }

  /**
   * Get content completion stats
   */
  async getContentCompletionStats(
    contentId: string,
    contentType: "TOPIC" | "VOCABULARY" | "QUIZ",
    date: Date,
  ): Promise<{ started: number; completed: number; rate: number }> {
    const dateKey = this.getDateKey(date);
    const completionKey = `analytics:content:${contentType}:${contentId}:completion:${dateKey}`;
    const stats = await this.redis.hgetall(completionKey);

    const started = parseInt(stats.started || "0");
    const completed = parseInt(stats.completed || "0");
    const rate = started > 0 ? (completed / started) * 100 : 0;

    return { started, completed, rate };
  }

  /**
   * Get active sessions count (sessions active in last 5 minutes)
   */
  async getActiveSessionsCount(): Promise<number> {
    const pattern = "analytics:session:*";
    const keys = await this.redis.keys(pattern);

    // Filter sessions active in last 5 minutes
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    let activeCount = 0;
    for (const key of keys) {
      const lastActivity = await this.redis.hget(key, "lastActivity");
      if (lastActivity && parseInt(lastActivity) > fiveMinutesAgo) {
        activeCount++;
      }
    }

    return activeCount;
  }

  /**
   * Flush all analytics data (use with caution)
   */
  async flushAnalyticsData(): Promise<void> {
    const patterns = [
      "analytics:dau:*",
      "analytics:session:*",
      "analytics:session_duration:*",
      "analytics:content:*",
      "analytics:content_ranking:*",
    ];

    for (const pattern of patterns) {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
  }

  /**
   * Helper: Get date key in YYYY-MM-DD format
   */
  private getDateKey(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  /**
   * Helper: Get date range keys
   */
  getDatesInRange(startDate: Date, endDate: Date): string[] {
    const dates: string[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      dates.push(this.getDateKey(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }
}
