import { Injectable, Inject, Logger } from "@nestjs/common";
import { Redis } from "ioredis";
import { ProgressUpdateDto } from "../dto/progress-update.dto";
import { DeviceSessionDto } from "../dto/sync-response.dto";

/**
 * Redis Progress Cache Service
 * Manages real-time progress state and device session tracking
 * Implements NFR-01: Redis for scalability
 */
@Injectable()
export class RedisProgressCacheService {
  private readonly logger = new Logger(RedisProgressCacheService.name);
  private readonly retentionDays = 90; // Cache retention period

  constructor(@Inject("REDIS_CLIENT") private redis: Redis) {}

  /**
   * Store progress update in cache
   * Key: progress:user:userId:deviceId:type
   * Tracks latest value with timestamp
   */
  async cacheProgressUpdate(update: ProgressUpdateDto): Promise<boolean> {
    const key = `progress:${update.userId}:${update.deviceId}:${update.type}`;
    const data = {
      timestamp: update.timestamp,
      value: JSON.stringify(this.extractProgressValue(update)),
      contentId: update.contentId || "",
      sessionId: update.sessionId || "",
      clientTimestamp: update.clientTimestamp || update.timestamp,
    };

    try {
      // Set with 90-day expiration
      await this.redis.setex(
        key,
        this.retentionDays * 86400, // Convert days to seconds
        JSON.stringify(data),
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to cache progress update: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * Get latest progress value from cache
   */
  async getLatestProgress(
    userId: string,
    deviceId: string,
    type: string,
  ): Promise<{ timestamp: number; value: unknown } | null> {
    const key = `progress:${userId}:${deviceId}:${type}`;

    try {
      const data = await this.redis.get(key);
      if (!data) return null;

      const parsed = JSON.parse(data);
      return {
        timestamp: parsed.timestamp,
        value: JSON.parse(parsed.value),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get latest progress: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Get complete progress snapshot for user across all devices
   */
  async getUserProgressSnapshot(userId: string): Promise<Map<string, unknown>> {
    const pattern = `progress:${userId}:*`;
    const keys = await this.redis.keys(pattern);

    const snapshot = new Map<string, unknown>();

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const parsed = JSON.parse(data);
        snapshot.set(key, parsed);
      }
    }

    return snapshot;
  }

  /**
   * Store device session information
   * Key: session:user:userId:deviceId
   */
  async registerDeviceSession(
    userId: string,
    deviceId: string,
    deviceInfo: Partial<DeviceSessionDto>,
  ): Promise<boolean> {
    const key = `session:${userId}:${deviceId}`;
    const sessionData = {
      deviceId,
      deviceName: deviceInfo.deviceName || "Unknown",
      deviceType: deviceInfo.deviceType || "WEB",
      lastSyncTime: Date.now(),
      status: "ONLINE",
      pendingUpdates: 0,
      userAgent: deviceInfo.userAgent || "",
      connectedAt: Date.now(),
    };

    try {
      // Session expires after 24 hours of inactivity
      await this.redis.setex(key, 24 * 3600, JSON.stringify(sessionData));

      // Add to user's device list
      await this.redis.sadd(`user_devices:${userId}`, deviceId);

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to register device session: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserActiveSessions(userId: string): Promise<DeviceSessionDto[]> {
    const deviceIds = await this.redis.smembers(`user_devices:${userId}`);
    const sessions: DeviceSessionDto[] = [];

    for (const deviceId of deviceIds) {
      const key = `session:${userId}:${deviceId}`;
      const data = await this.redis.get(key);

      if (data) {
        sessions.push(JSON.parse(data));
      }
    }

    return sessions;
  }

  /**
   * Mark device as online
   */
  async markDeviceOnline(userId: string, deviceId: string): Promise<boolean> {
    const key = `session:${userId}:${deviceId}`;

    try {
      const data = await this.redis.get(key);
      if (!data) {
        return this.registerDeviceSession(userId, deviceId, {});
      }

      const session = JSON.parse(data);
      session.status = "ONLINE";
      session.lastSyncTime = Date.now();
      session.pendingUpdates = 0;

      await this.redis.setex(key, 24 * 3600, JSON.stringify(session));

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to mark device online: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * Mark device as offline
   */
  async markDeviceOffline(userId: string, deviceId: string): Promise<boolean> {
    const key = `session:${userId}:${deviceId}`;

    try {
      const data = await this.redis.get(key);
      if (!data) return false;

      const session = JSON.parse(data);
      session.status = "OFFLINE";

      await this.redis.set(key, JSON.stringify(session));
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to mark device offline: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * Increment pending updates counter for device
   */
  async incrementPendingUpdates(
    userId: string,
    deviceId: string,
  ): Promise<number> {
    const key = `pending:${userId}:${deviceId}`;
    return this.redis.incr(key);
  }

  /**
   * Decrement pending updates counter
   */
  async decrementPendingUpdates(
    userId: string,
    deviceId: string,
  ): Promise<number> {
    const key = `pending:${userId}:${deviceId}`;
    const value = await this.redis.decr(key);
    return Math.max(0, value);
  }

  /**
   * Get pending updates count for device
   */
  async getPendingUpdatesCount(
    userId: string,
    deviceId: string,
  ): Promise<number> {
    const key = `pending:${userId}:${deviceId}`;
    const value = await this.redis.get(key);
    return value ? parseInt(value, 10) : 0;
  }

  /**
   * Store sync event for audit trail
   * Key: sync:events:userId (list)
   */
  async recordSyncEvent(
    userId: string,
    deviceId: string,
    eventType: string,
    details: unknown,
  ): Promise<boolean> {
    const key = `sync:events:${userId}`;
    const event = {
      timestamp: Date.now(),
      deviceId,
      type: eventType,
      details,
    };

    try {
      // Keep last 1000 sync events per user
      await this.redis.lpush(key, JSON.stringify(event));
      await this.redis.ltrim(key, 0, 999);
      await this.redis.expire(key, this.retentionDays * 86400);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to record sync event: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * Get recent sync events
   */
  async getSyncEvents(userId: string, limit: number = 100): Promise<unknown[]> {
    const key = `sync:events:${userId}`;

    try {
      const events = await this.redis.lrange(key, 0, limit - 1);
      return events.map((e) => JSON.parse(e));
    } catch (error) {
      this.logger.error(
        `Failed to get sync events: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * Create conflict record
   * Key: conflicts:userId (sorted set)
   */
  async recordConflict(
    userId: string,
    conflictId: string,
    conflictData: Record<string, unknown>,
  ): Promise<boolean> {
    const key = `conflicts:${userId}`;

    try {
      // Store with score = timestamp for sorting
      await this.redis.zadd(
        key,
        Date.now(),
        JSON.stringify({ conflictId, ...conflictData }),
      );
      await this.redis.expire(key, this.retentionDays * 86400);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to record conflict: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * Get unresolved conflicts
   */
  async getUnresolvedConflicts(
    userId: string,
    limit: number = 10,
  ): Promise<unknown[]> {
    const key = `conflicts:${userId}`;

    try {
      // Get most recent conflicts
      const conflicts = await this.redis.zrevrange(
        key,
        0,
        limit - 1,
        "WITHSCORES",
      );
      const result = [];

      for (let i = 0; i < conflicts.length; i += 2) {
        result.push(JSON.parse(conflicts[i]));
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to get conflicts: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * Publish sync event to WebSocket subscribers
   */
  async publishSyncUpdate(
    userId: string,
    channel: string,
    update: unknown,
  ): Promise<boolean> {
    try {
      const message = {
        userId,
        timestamp: Date.now(),
        data: update,
      };

      await this.redis.publish(channel, JSON.stringify(message));
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to publish sync update: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * Clean up old cache entries
   */
  async cleanupExpiredData(): Promise<number> {
    const cleanedCount = 0;

    try {
      // Redis handles TTL automatically, but we can log stats
      const keys = await this.redis.keys("progress:*");
      this.logger.debug(`Cleanup checked ${keys.length} progress keys`);
      return cleanedCount;
    } catch (error) {
      this.logger.error(
        `Cleanup error: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 0;
    }
  }

  /**
   * Extract numeric value from progress update
   */
  private extractProgressValue(update: ProgressUpdateDto): unknown {
    if (update.starPoints) return update.starPoints;
    if (update.badge) return update.badge;
    if (update.score) return update.score;
    if (update.streak) return update.streak;
    return { type: update.type, timestamp: update.timestamp };
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    progressUpdates: number;
    activeSessions: number;
  }> {
    try {
      const info = await this.redis.info("memory");
      const progressKeys = await this.redis.keys("progress:*");
      const sessionKeys = await this.redis.keys("session:*");

      return {
        totalKeys: await this.redis.dbsize(),
        memoryUsage:
          info
            .split("\r\n")
            .find((line) => line.includes("used_memory_human")) || "unknown",
        progressUpdates: progressKeys.length,
        activeSessions: sessionKeys.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get cache stats: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        totalKeys: 0,
        memoryUsage: "unknown",
        progressUpdates: 0,
        activeSessions: 0,
      };
    }
  }
}
