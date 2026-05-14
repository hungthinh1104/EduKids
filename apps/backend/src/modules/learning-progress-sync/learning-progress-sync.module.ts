import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { Redis } from "ioredis";
import { ProgressSyncService } from "./service/progress-sync.service";
import { ConflictResolutionService } from "./service/conflict-resolution.service";
import { RedisProgressCacheService } from "./service/redis-progress-cache.service";
import { OfflineQueueService } from "./service/offline-queue.service";
import { ProgressSyncGateway } from "./gateway/progress-sync.gateway";
import { WsJwtGuard } from "@/common/guards/ws-jwt.guard";

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: "REDIS_CLIENT",
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>("REDIS_URL");
        const db = configService.get<number>("REDIS_PROGRESS_DB", 0);
        const useTls =
          configService.get<string>("REDIS_TLS", "false") === "true";

        const baseOptions = {
          db,
          retryStrategy: (times: number) => Math.min(times * 50, 2000),
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
    WsJwtGuard,
    ConflictResolutionService,
    RedisProgressCacheService,
    OfflineQueueService,
    ProgressSyncService,
    ProgressSyncGateway,
  ],
  exports: [
    "REDIS_CLIENT",
    ConflictResolutionService,
    RedisProgressCacheService,
    OfflineQueueService,
    ProgressSyncService,
  ],
})
export class LearningProgressSyncModule {}
