import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { FlashcardController } from "./flashcard.controller";
import { FlashcardService } from "./flashcard.service";
import { FlashcardRepository } from "./repositories/flashcard.repository";
import { FlashcardActivityRepository } from "./repositories/flashcard-activity.repository";
import { FlashcardCacheService } from "./services/flashcard-cache.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { LearningModule } from "../learning/learning.module";

@Module({
  imports: [
    PrismaModule,
    LearningModule,
    CacheModule.register({
      isGlobal: false,
      ttl: 3600 * 1000, // 1 hour default TTL
    }),
  ],
  controllers: [FlashcardController],
  providers: [
    FlashcardService,
    FlashcardRepository,
    FlashcardActivityRepository,
    FlashcardCacheService,
  ],
  exports: [FlashcardService, FlashcardRepository, FlashcardActivityRepository],
})
export class FlashcardModule {}
