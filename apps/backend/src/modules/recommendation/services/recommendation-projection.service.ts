import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RecommendationDto, RecommendationsListDto } from '../recommendation.dto';

@Injectable()
export class RecommendationProjectionService {
  private readonly logger = new Logger(RecommendationProjectionService.name);
  private readonly ttlMs = 5 * 60 * 1000;

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  private key(childId: number): string {
    return `recommendation:projection:${childId}`;
  }

  async getRecommendationsProjection(
    childId: number,
  ): Promise<RecommendationsListDto | null> {
    const cached = await this.cacheManager.get<RecommendationsListDto>(
      this.key(childId),
    );
    return cached ?? null;
  }

  async saveRecommendationsProjection(
    childId: number,
    recommendations: RecommendationDto[],
  ): Promise<RecommendationsListDto> {
    const projection: RecommendationsListDto = {
      childId,
      recommendations,
      hasRecommendations: recommendations.length > 0,
      generatedAt: new Date(),
    };

    await this.cacheManager.set(this.key(childId), projection, this.ttlMs);
    return projection;
  }

  async invalidate(childId: number): Promise<void> {
    await this.cacheManager.del(this.key(childId));
    this.logger.debug(`Invalidated recommendation projection for child ${childId}`);
  }
}
