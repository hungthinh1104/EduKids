import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { RecommendationRepository } from './recommendation.repository';
import { RecommendationGeminiApiService } from './recommendation.gemini-api.service';
import { PrismaService } from 'src/prisma/prisma.service';

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
  imports: [ScheduleModule.forRoot()],
  controllers: [RecommendationController],
  providers: [
    RecommendationService,
    RecommendationRepository,
    RecommendationGeminiApiService,
    PrismaService,
  ],
  exports: [RecommendationService],
})
export class RecommendationModule {}
