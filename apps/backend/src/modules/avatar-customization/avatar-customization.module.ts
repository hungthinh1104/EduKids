import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RedisModule } from "@nestjs-modules/ioredis";
import { PrismaModule } from "../../prisma/prisma.module";
import { AvatarCustomizationService } from "./service/avatar-customization.service";
import { AvatarCustomizationController } from "./controller/avatar-customization.controller";
import { AvatarRepository } from "./repository/avatar.repository";
import { AvatarCacheService } from "./service/avatar-cache.service";

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "single" as const,
        url:
          configService.get<string>("REDIS_URL") ||
          "redis://:password@redis:6379",
      }),
    }),
  ],
  providers: [AvatarCustomizationService, AvatarRepository, AvatarCacheService],
  controllers: [AvatarCustomizationController],
  exports: [AvatarCustomizationService, AvatarRepository],
})
export class AvatarCustomizationModule {}
