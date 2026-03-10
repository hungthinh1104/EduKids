import { Injectable } from "@nestjs/common";
import { Redis } from "ioredis";
import { InjectRedis } from "@nestjs-modules/ioredis";

@Injectable()
export class AvatarCacheService {
  constructor(@InjectRedis() private redis: Redis) {}

  private readonly CACHE_TTL = 600; // 10 minutes
  private readonly CONFIG_PREFIX = "avatar:config:";
  private readonly ITEMS_PREFIX = "avatar:items:";

  /**
   * Cache avatar configuration
   */
  async cacheAvatarConfig(childId: number, config: any) {
    const key = `${this.CONFIG_PREFIX}${childId}`;
    await this.redis.setex(key, this.CACHE_TTL, JSON.stringify(config));
  }

  /**
   * Get cached avatar configuration
   */
  async getCachedConfig(childId: number) {
    const key = `${this.CONFIG_PREFIX}${childId}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Cache child's avatar items
   */
  async cacheChildItems(childId: number, items: any[]) {
    const key = `${this.ITEMS_PREFIX}${childId}`;
    await this.redis.setex(key, this.CACHE_TTL, JSON.stringify(items));
  }

  /**
   * Get cached child items
   */
  async getCachedItems(childId: number) {
    const key = `${this.ITEMS_PREFIX}${childId}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Invalidate avatar cache for child
   */
  async invalidateCache(childId: number) {
    await this.redis.del(
      `${this.CONFIG_PREFIX}${childId}`,
      `${this.ITEMS_PREFIX}${childId}`,
    );
  }

  /**
   * Invalidate all avatar caches
   */
  async invalidateAllCache() {
    const configKeys = await this.redis.keys(`${this.CONFIG_PREFIX}*`);
    const itemsKeys = await this.redis.keys(`${this.ITEMS_PREFIX}*`);

    if (configKeys.length > 0) await this.redis.del(...configKeys);
    if (itemsKeys.length > 0) await this.redis.del(...itemsKeys);
  }
}
