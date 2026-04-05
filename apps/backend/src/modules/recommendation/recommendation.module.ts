import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { RecommendationRepository } from './recommendation.repository';
import { RecommendationGeminiApiService } from './recommendation.gemini-api.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RecommendationProjectionService } from './services/recommendation-projection.service';
import { WeakTopicDetectionService } from './services/weak-topic-detection.service';

/**
 * Recommendation Module
 * Manages AI-powered personalized learning path recommendations
 * Features:
 * - Daily AI recommendation generation
 * - Personalized learning paths based on performance metrics
 * - Parent-controlled path application and feedback
 * - Multi-dimensional scoring algorithm
 * - NFR-01 compliant AI computation
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    CacheModule.register({
      ttl: 5 * 60 * 1000,
      max: 1000,
    }),
  ],
  controllers: [RecommendationController],
  providers: [
    RecommendationService,
    RecommendationRepository,
    RecommendationGeminiApiService,
    RecommendationProjectionService,
    WeakTopicDetectionService,
    PrismaService,
  ],
  exports: [RecommendationService],
})
export class RecommendationModule {}
