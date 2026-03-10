import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRepository } from './analytics.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { ChildProfileModule } from '../child-profile/child-profile.module';

/**
 * UC-07: View AI Analytics Dashboard Module
 * Parent views charts with Redis caching (NFR-01)
 */
@Module({
  imports: [
    ChildProfileModule, // For profile verification
    CacheModule.register({
      ttl: 3600, // 1 hour cache TTL
      max: 100, // Max 100 items in cache
    }),
  ],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    AnalyticsRepository,
    PrismaService,
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}