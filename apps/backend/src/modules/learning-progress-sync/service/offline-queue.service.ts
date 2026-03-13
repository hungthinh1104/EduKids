import { Injectable, Inject, Logger } from "@nestjs/common";
import { Redis } from "ioredis";
import { OfflineQueueEntryDto } from "../dto/progress-update.dto";
import { ProgressUpdateDto } from "../dto/progress-update.dto";
import { v4 as uuidv4 } from "uuid";

/**
 * Offline Queue Service
 * Manages queuing of updates when device is offline
 * Implements retry logic and batch synchronization on reconnect
 */
@Injectable()
export class OfflineQueueService {
  private readonly logger = new Logger(OfflineQueueService.name);
  private readonly maxRetries = 5;
  private readonly maxQueueSize = 500; // Per device

  constructor(@Inject("REDIS_CLIENT") private redis: Redis) {}

  /**
   * Add update to offline queue
   * Key: queue:userId:deviceId (list)
   */
  async queueUpdate(
    userId: string,
    deviceId: string,
    update: ProgressUpdateDto,
  ): Promise<string> {
    const queueId = uuidv4();
    const queueKey = `queue:${userId}:${deviceId}`;

    const entry: OfflineQueueEntryDto = {
      queueId,
      userId,
      deviceId,
      update,
      queuedAt: Date.now(),
      retryCount: 0,
      status: "PENDING",
    };

    try {
      // Check queue size
      const size = await this.redis.llen(queueKey);
      if (size >= this.maxQueueSize) {
        this.logger.warn(
          `Queue full for ${userId}:${deviceId}, dropping oldest entry`,
        );
        // Remove oldest entry (tail)
        await this.redis.rpop(queueKey);
      }

      // Add to queue (head)
      await this.redis.lpush(queueKey, JSON.stringify(entry));

      // Set expiration for queue (7 days)
      await this.redis.expire(queueKey, 7 * 86400);

      this.logger.debug(`Queued update ${queueId} for ${userId}:${deviceId}`);
      return queueId;
    } catch (error) {
      this.logger.error(`Failed to queue update: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all queued updates for device
   */
  async getQueuedUpdates(
    userId: string,
    deviceId: string,
  ): Promise<OfflineQueueEntryDto[]> {
    const queueKey = `queue:${userId}:${deviceId}`;

    try {
      const entries = await this.redis.lrange(queueKey, 0, -1);
      return entries.map((entry) => JSON.parse(entry));
    } catch (error) {
      this.logger.error(`Failed to get queued updates: ${error.message}`);
      return [];
    }
  }

  /**
   * Get queue size
   */
  async getQueueSize(userId: string, deviceId: string): Promise<number> {
    const queueKey = `queue:${userId}:${deviceId}`;

    try {
      return await this.redis.llen(queueKey);
    } catch (error) {
      this.logger.error(`Failed to get queue size: ${error.message}`);
      return 0;
    }
  }

  /**
   * Mark update as synced and remove from queue
   */
  async markAsSynced(
    userId: string,
    deviceId: string,
    queueId: string,
  ): Promise<boolean> {
    const queueKey = `queue:${userId}:${deviceId}`;

    try {
      const entries = await this.redis.lrange(queueKey, 0, -1);

      for (let i = 0; i < entries.length; i++) {
        const entry = JSON.parse(entries[i]);
        if (entry.queueId === queueId) {
          // Remove this specific entry
          await this.redis.lset(
            queueKey,
            i,
            JSON.stringify({
              ...entry,
              status: "SYNCED",
            }),
          );

          // Also move to synced list for audit
          await this.recordSyncedUpdate(userId, deviceId, entry);

          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error(`Failed to mark as synced: ${error.message}`);
      return false;
    }
  }

  /**
   * Mark update as failed with retry count
   */
  async markAsFailed(
    userId: string,
    deviceId: string,
    queueId: string,
  ): Promise<boolean> {
    const queueKey = `queue:${userId}:${deviceId}`;

    try {
      const entries = await this.redis.lrange(queueKey, 0, -1);

      for (let i = 0; i < entries.length; i++) {
        const entry = JSON.parse(entries[i]);
        if (entry.queueId === queueId) {
          const retryCount = (entry.retryCount || 0) + 1;

          if (retryCount >= this.maxRetries) {
            // Max retries exceeded, mark as failed
            await this.redis.lset(
              queueKey,
              i,
              JSON.stringify({
                ...entry,
                status: "FAILED",
                retryCount,
                lastRetryAt: Date.now(),
              }),
            );

            // Move to dead letter queue
            await this.recordFailedUpdate(userId, deviceId, entry);

            this.logger.warn(
              `Update ${queueId} exceeded max retries, moved to DLQ`,
            );
          } else {
            // Retry later
            await this.redis.lset(
              queueKey,
              i,
              JSON.stringify({
                ...entry,
                retryCount,
                lastRetryAt: Date.now(),
              }),
            );
          }

          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error(`Failed to mark as failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get updates ready for retry
   * Returns updates that failed but haven't exceeded retry limit
   */
  async getRetryableUpdates(
    userId: string,
    deviceId: string,
    _maxAge: number = 60000, // 1 minute
  ): Promise<OfflineQueueEntryDto[]> {
    const queueKey = `queue:${userId}:${deviceId}`;
    const now = Date.now();

    try {
      const entries = await this.redis.lrange(queueKey, 0, -1);

      return entries
        .map((entry) => JSON.parse(entry))
        .filter((entry) => {
          // Should retry if:
          // 1. Status is PENDING, OR
          // 2. Status is FAILED but hasn't exceeded retries AND enough time passed
          if (entry.status === "PENDING") return true;

          if (entry.retryCount < this.maxRetries) {
            const lastRetry = entry.lastRetryAt || entry.queuedAt;
            const backoffTime = Math.pow(2, entry.retryCount) * 1000; // Exponential backoff
            return now - lastRetry >= backoffTime;
          }

          return false;
        });
    } catch (error) {
      this.logger.error(`Failed to get retryable updates: ${error.message}`);
      return [];
    }
  }

  /**
   * Clear entire queue (dangerous operation)
   */
  async clearQueue(userId: string, deviceId: string): Promise<boolean> {
    const queueKey = `queue:${userId}:${deviceId}`;

    try {
      await this.redis.del(queueKey);
      this.logger.log(`Cleared queue for ${userId}:${deviceId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to clear queue: ${error.message}`);
      return false;
    }
  }

  /**
   * Record successfully synced update for audit
   */
  private async recordSyncedUpdate(
    userId: string,
    deviceId: string,
    entry: OfflineQueueEntryDto,
  ): Promise<void> {
    const auditKey = `synced:${userId}:${deviceId}`;

    try {
      await this.redis.lpush(
        auditKey,
        JSON.stringify({
          ...entry,
          syncedAt: Date.now(),
        }),
      );

      // Keep last 1000 synced entries
      await this.redis.ltrim(auditKey, 0, 999);
      await this.redis.expire(auditKey, 30 * 86400); // 30 days
    } catch (error) {
      this.logger.error(`Failed to record synced update: ${error.message}`);
    }
  }

  /**
   * Record failed update to dead letter queue
   */
  private async recordFailedUpdate(
    userId: string,
    deviceId: string,
    entry: OfflineQueueEntryDto,
  ): Promise<void> {
    const dlqKey = `dlq:${userId}:${deviceId}`;

    try {
      await this.redis.lpush(
        dlqKey,
        JSON.stringify({
          ...entry,
          failedAt: Date.now(),
        }),
      );

      // Keep last 100 failed entries
      await this.redis.ltrim(dlqKey, 0, 99);
      await this.redis.expire(dlqKey, 7 * 86400); // 7 days
    } catch (error) {
      this.logger.error(`Failed to record failed update: ${error.message}`);
    }
  }

  /**
   * Get dead letter queue items
   */
  async getDeadLetterQueueItems(
    userId: string,
    deviceId: string,
  ): Promise<unknown[]> {
    const dlqKey = `dlq:${userId}:${deviceId}`;

    try {
      const items = await this.redis.lrange(dlqKey, 0, -1);
      return items.map((item) => JSON.parse(item));
    } catch (error) {
      this.logger.error(`Failed to get DLQ items: ${error.message}`);
      return [];
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(
    userId: string,
    deviceId: string,
  ): Promise<{
    queueSize: number;
    pendingUpdates: number;
    failedUpdates: number;
    totalSynced: number;
    oldestUpdate: number | null;
  }> {
    const queueKey = `queue:${userId}:${deviceId}`;
    const auditKey = `synced:${userId}:${deviceId}`;

    try {
      const entries = await this.redis.lrange(queueKey, 0, -1);
      const auditEntries = await this.redis.llen(auditKey);

      let pendingCount = 0;
      let failedCount = 0;
      let oldestTime = null;

      for (const entry of entries) {
        const parsed = JSON.parse(entry);
        if (parsed.status === "PENDING") pendingCount++;
        if (parsed.status === "FAILED") failedCount++;
        if (!oldestTime || parsed.queuedAt < oldestTime) {
          oldestTime = parsed.queuedAt;
        }
      }

      return {
        queueSize: entries.length,
        pendingUpdates: pendingCount,
        failedUpdates: failedCount,
        totalSynced: auditEntries,
        oldestUpdate: oldestTime,
      };
    } catch (error) {
      this.logger.error(`Failed to get queue stats: ${error.message}`);
      return {
        queueSize: 0,
        pendingUpdates: 0,
        failedUpdates: 0,
        totalSynced: 0,
        oldestUpdate: null,
      };
    }
  }

  /**
   * Get estimated sync time in seconds
   * Based on queue size and network conditions
   */
  async getEstimatedSyncTime(
    userId: string,
    deviceId: string,
  ): Promise<number> {
    const stats = await this.getQueueStats(userId, deviceId);

    // Assume ~100ms per update, plus base latency
    const baseLatency = 500; // ms
    const timePerUpdate = 100; // ms
    const totalTime = baseLatency + stats.queueSize * timePerUpdate;

    return Math.ceil(totalTime / 1000); // Convert to seconds
  }
}
