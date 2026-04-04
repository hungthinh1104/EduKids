import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { TopicRepository } from "./repositories/topic.repository";
import { VocabularyRepository } from "./repositories/vocabulary.repository";
import { LearningProgressRepository } from "../learning/repositories/learning-progress.repository";
import {
  TopicListResponseDto,
  TopicDetailResponseDto,
} from "./dto/content-response.dto";
import { TopicDto } from "./dto/topic.dto";
import { VocabularyDto, VocabularyMediaDto } from "./dto/vocabulary.dto";
import { PaginatedResponseDto } from "../../common/dto/pagination.dto";

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);
  private readonly CDN_BASE_URL =
    process.env.CLOUDINARY_BASE_URL || "https://res.cloudinary.com/edukids";
  private readonly PLACEHOLDER_IMAGE = `${this.CDN_BASE_URL}/image/placeholder.png`;

  constructor(
    private topicRepository: TopicRepository,
    private vocabularyRepository: VocabularyRepository,
    private learningProgressRepository: LearningProgressRepository,
  ) {}

  /**
   * UC-01: Get all vocabulary topics with pagination
   * @param page Page number (default: 1)
   * @param limit Items per page (default: 20)
   * @returns Paginated topics with vocabulary count
   */
  async getTopicsPaginated(
    page: number = 1,
    limit: number = 20,
    childId?: number,
  ): Promise<PaginatedResponseDto<TopicDto>> {
    try {
      const paginatedTopics = await this.topicRepository.findAllPaginated(
        page,
        limit,
      );

      const topicsWithCount = await Promise.all(
        paginatedTopics.items.map(async (topic) => {
          const vocabularyCount =
            await this.topicRepository.countVocabulariesByTopicId(topic.id);
          const completedCount = childId
            ? await this.learningProgressRepository.countCompletedByChildAndTopic(
                childId,
                topic.id,
              )
            : 0;
          const progressPercentage =
            vocabularyCount > 0
              ? Math.round((completedCount / vocabularyCount) * 100)
              : 0;
          const hasVideo = await this.topicRepository.hasVideoByTopicId(
            topic.id,
          );
          return {
            ...topic,
            vocabularyCount,
            completedCount,
            progressPercentage,
            starsEarned: this.progressToStars(progressPercentage),
            hasVideo,
          } as TopicDto;
        }),
      );

      return {
        page: paginatedTopics.page,
        limit: paginatedTopics.limit,
        total: paginatedTopics.total,
        totalPages: paginatedTopics.totalPages,
        items: topicsWithCount,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch paginated topics: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * UC-01: Get all vocabulary topics (backward compatibility)
   * @returns List of topics with vocabulary count
   */
  async getTopics(): Promise<TopicListResponseDto> {
    try {
      const topics = await this.topicRepository.findAll();

      const topicsWithCount = await Promise.all(
        topics.map(async (topic) => {
          const vocabularyCount =
            await this.topicRepository.countVocabulariesByTopicId(topic.id);
          return {
            ...topic,
            vocabularyCount,
          } as TopicDto;
        }),
      );

      return {
        topics: topicsWithCount,
        total: topicsWithCount.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch topics: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * UC-01: Get topic detail with flashcards + video + progress
   * @param topicId Topic ID to fetch
   * @param childId Child ID for progress tracking
   * @returns Topic details with vocabularies, media, and progress
   */
  async getTopicById(
    topicId: number,
    childId: number,
  ): Promise<TopicDetailResponseDto> {
    try {
      const topicWithVocabularies =
        await this.topicRepository.findByIdWithVocabularies(topicId);

      if (!topicWithVocabularies) {
        throw new NotFoundException(`Topic with ID ${topicId} not found`);
      }

      // Transform vocabularies with CDN URLs
      const vocabularies: VocabularyDto[] =
        topicWithVocabularies.vocabularies.map((vocab) => ({
          id: vocab.id,
          topicId: vocab.topicId,
          word: vocab.word,
          phonetic: vocab.phonetic,
          translation: vocab.translation,
          partOfSpeech: vocab.partOfSpeech,
          exampleSentence: vocab.exampleSentence,
          difficulty: vocab.difficulty,
          media: vocab.media.map((m) => this.transformMediaUrl(m)),
          createdAt: vocab.createdAt,
        }));

      // Resolve video URL for lesson: prefer Topic.videoUrl from CMS,
      // fallback to first VIDEO media from vocabularies for backward compatibility.
      const topicVideoUrl =
        typeof topicWithVocabularies.videoUrl === "string" &&
        topicWithVocabularies.videoUrl.trim().length > 0
          ? topicWithVocabularies.videoUrl
          : undefined;
      const videoUrl = topicVideoUrl ?? this.findFirstVideoUrl(vocabularies);
      const hasVideo =
        Boolean(topicWithVocabularies.hasVideo) || Boolean(videoUrl);

      // Get progress for this child
      const completedCount =
        await this.learningProgressRepository.countCompletedByChildAndTopic(
          childId,
          topicId,
        );

      const totalVocabularies = vocabularies.length;
      const progressPercentage =
        totalVocabularies > 0
          ? Math.round((completedCount / totalVocabularies) * 100)
          : 0;

      return {
        topic: {
          id: topicWithVocabularies.id,
          name: topicWithVocabularies.name,
          description: topicWithVocabularies.description,
          imageUrl: topicWithVocabularies.imageUrl,
          learningLevel: topicWithVocabularies.learningLevel,
          tags: topicWithVocabularies.tags,
          vocabularyCount: totalVocabularies,
          createdAt: topicWithVocabularies.createdAt,
          completedCount,
          progressPercentage,
          starsEarned: this.progressToStars(progressPercentage),
          hasVideo,
          videoUrl,
        },
        vocabularies,
        videoUrl,
        completedCount,
        progressPercentage,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch topic ${topicId} for child ${childId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      // UC-01 Exception: Media loading fails
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Return friendly error for network issues
      const wrappedError = new Error("Connection is slow, try again!");
      (wrappedError as Error & { cause?: unknown }).cause = error;
      throw wrappedError;
    }
  }

  async getVocabularyById(vocabularyId: number): Promise<VocabularyDto> {
    const vocabulary = await this.vocabularyRepository.findById(vocabularyId);

    if (!vocabulary) {
      throw new NotFoundException(
        `Vocabulary with ID ${vocabularyId} not found`,
      );
    }

    return {
      id: vocabulary.id,
      topicId: vocabulary.topicId,
      word: vocabulary.word,
      phonetic: vocabulary.phonetic,
      translation: vocabulary.translation,
      partOfSpeech: vocabulary.partOfSpeech,
      exampleSentence: vocabulary.exampleSentence,
      difficulty: vocabulary.difficulty,
      media: vocabulary.media.map((media) => this.transformMediaUrl(media)),
      createdAt: vocabulary.createdAt,
    };
  }

  /**
   * Transform media URL with CDN base or fallback to placeholder
   * Handles UC-01 Exception: Media loading fails
   */
  private transformMediaUrl(media: {
    id: number;
    type: string;
    url: string;
  }): VocabularyMediaDto {
    try {
      // If URL is already full CDN URL, return as-is
      if (media.url.startsWith("http")) {
        return {
          id: media.id,
          type: media.type,
          url: media.url,
        };
      }

      // Otherwise, construct CDN URL
      return {
        id: media.id,
        type: media.type,
        url: `${this.CDN_BASE_URL}/${media.type.toLowerCase()}/${media.url}`,
      };
    } catch {
      this.logger.warn(
        `Failed to transform media URL for media ${media.id}, using placeholder`,
      );
      return {
        id: media.id,
        type: media.type,
        url: this.PLACEHOLDER_IMAGE,
      };
    }
  }

  /**
   * Find first VIDEO type media URL for topic lesson
   */
  private findFirstVideoUrl(vocabularies: VocabularyDto[]): string | undefined {
    for (const vocab of vocabularies) {
      const video = vocab.media?.find((media) => media.type === "VIDEO");
      if (video) {
        return video.url;
      }
    }
    return undefined;
  }

  private progressToStars(progressPercentage: number): number {
    if (progressPercentage >= 90) return 3;
    if (progressPercentage >= 60) return 2;
    if (progressPercentage > 0) return 1;
    return 0;
  }
}
