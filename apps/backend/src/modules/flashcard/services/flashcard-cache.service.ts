import { Injectable, Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class FlashcardCacheService {
  private readonly VOCABULARY_CACHE_TTL = 3600 * 1000; // 1 hour in ms
  private readonly CACHE_PREFIX = "flashcard";

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService,
  ) {}

  /**
   * Get vocabulary list from cache with fallback to database
   * NFR-01: Response < 500ms optimization
   * Cache miss: First load from DB, then cache for 1 hour
   */
  async getTopicVocabulariesWithCache(topicId: number) {
    const cacheKey = `${this.CACHE_PREFIX}:topic:${topicId}`;

    // Try cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from DB
    const vocabularies = await this.prisma.vocabulary.findMany({
      where: { topicId },
      include: {
        media: true,
      },
      orderBy: { id: "asc" },
    });

    // Store in cache (1 hour TTL)
    await this.cacheManager.set(
      cacheKey,
      vocabularies,
      this.VOCABULARY_CACHE_TTL,
    );

    return vocabularies;
  }

  /**
   * Cache single vocabulary with media
   */
  async getVocabularyWithCache(vocabularyId: number) {
    const cacheKey = `${this.CACHE_PREFIX}:vocab:${vocabularyId}`;

    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const vocabulary = await this.prisma.vocabulary.findUnique({
      where: { id: vocabularyId },
      include: {
        media: true,
        topic: true,
      },
    });

    if (vocabulary) {
      await this.cacheManager.set(
        cacheKey,
        vocabulary,
        this.VOCABULARY_CACHE_TTL,
      );
    }

    return vocabulary;
  }

  /**
   * Invalidate topic vocabulary cache when vocabulary is added/updated
   */
  async invalidateTopicCache(topicId: number) {
    const cacheKey = `${this.CACHE_PREFIX}:topic:${topicId}`;
    await this.cacheManager.del(cacheKey);
  }

  /**
   * Invalidate single vocabulary cache
   */
  async invalidateVocabularyCache(vocabularyId: number) {
    const cacheKey = `${this.CACHE_PREFIX}:vocab:${vocabularyId}`;
    await this.cacheManager.del(cacheKey);
  }
}
