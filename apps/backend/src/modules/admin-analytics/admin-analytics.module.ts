import { Module, Global } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";
import { AdminAnalyticsController } from "./controller/admin-analytics.controller";
import { AdminAnalyticsService } from "./service/admin-analytics.service";
import { RedisAnalyticsService } from "./service/redis-analytics.service";
import { AdminAnalyticsRepository } from "./repository/admin-analytics.repository";
import { PrismaModule } from "../../prisma/prisma.module";

/**
 * UC-12: View Platform Analytics (Admin Dashboard)
 * System-wide metrics with Redis real-time tracking
 */
@Global()
@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [AdminAnalyticsController],
  providers: [
    AdminAnalyticsService,
    RedisAnalyticsService,
    AdminAnalyticsRepository,
    {
      provide: "REDIS_CLIENT",
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>("REDIS_URL");
        const db = configService.get<number>("REDIS_ANALYTICS_DB", 0);
        const useTls =
          configService.get<string>("REDIS_TLS", "false") === "true";

        const baseOptions = {
          db,
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          ...(useTls ? { tls: {} } : {}),
        };

        if (redisUrl) {
          return new Redis(redisUrl, baseOptions);
        }

        return new Redis({
          host: configService.get<string>("REDIS_HOST", "localhost"),
          port: configService.get<number>("REDIS_PORT", 6379),
          username: configService.get<string>("REDIS_USERNAME"),
          password: configService.get<string>("REDIS_PASSWORD"),
          ...baseOptions,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [RedisAnalyticsService, AdminAnalyticsService],
})
export class AdminAnalyticsModule {}
