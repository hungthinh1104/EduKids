import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";

// Services
// import { ProgressSyncService } from './service/progress-sync.service';
// import { ConflictResolutionService } from './service/conflict-resolution.service';
// import { RedisProgressCacheService } from './service/redis-progress-cache.service';
// import { OfflineQueueService } from './service/offline-queue.service';

// Gateway
// import { ProgressSyncGateway } from './gateway/progress-sync.gateway';

/**
 * Learning Progress Synchronization Module
 * Manages real-time sync of user progress across devices
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    // Redis client factory for progress sync
    {
      provide: "REDIS_CLIENT",
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>("REDIS_URL");
        const db = configService.get<number>("REDIS_PROGRESS_DB", 0);
        const useTls =
          configService.get<string>("REDIS_TLS", "false") === "true";

        const baseOptions = {
          db,
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          enableReadyCheck: false,
          enableOfflineQueue: true,
          lazyConnect: false,
          ...(useTls ? { tls: {} } : {}),
        };

        if (redisUrl) {
          return new Redis(redisUrl, baseOptions);
        }

        return new Redis({
          host: configService.get("REDIS_HOST", "redis"),
          port: configService.get("REDIS_PORT", 6379),
          username: configService.get("REDIS_USERNAME"),
          password: configService.get("REDIS_PASSWORD"),
          ...baseOptions,
        });
      },
      inject: [ConfigService],
    },

    // Core services
    // ConflictResolutionService,
    // RedisProgressCacheService,
    // OfflineQueueService,
    // ProgressSyncService,

    // WebSocket gateway
    // ProgressSyncGateway,
  ],
  exports: [
    "REDIS_CLIENT",
    // ConflictResolutionService,
    // RedisProgressCacheService,
    // OfflineQueueService,
    // ProgressSyncService,
    // ProgressSyncGateway,
  ],
})
export class LearningProgressSyncModule {}
