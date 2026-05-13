import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { LearningProgressRepository } from "./repositories/learning-progress.repository";
import { UpdateProgressDto, ProgressResponseDto, LogVideoActivityDto, VideoActivityResponseDto } from "./dto/progress.dto";

@Injectable()
export class LearningService {
  private readonly logger = new Logger(LearningService.name);

  constructor(
    private learningProgressRepository: LearningProgressRepository,
    private prisma: PrismaService,
  ) {}

  /**
   * UC-01: Update viewing progress when child completes flashcard/video
   * @param childId Child ID from JWT
   * @param dto Contains vocabularyId and completion status
   * @returns Updated progress
   */
  async updateViewingProgress(
    childId: number,
    dto: UpdateProgressDto,
  ): Promise<ProgressResponseDto> {
    try {
      const vocabularyExists =
        await this.learningProgressRepository.vocabularyExists(
          dto.vocabularyId,
        );

      if (!vocabularyExists) {
        throw new NotFoundException("Vocabulary not found");
      }

      const existingProgress =
        await this.learningProgressRepository.findProgress(
          childId,
          dto.vocabularyId,
        );

      if (dto.completed && existingProgress?.completedAt) {
        return {
          childId: existingProgress.childId,
          vocabularyId: existingProgress.vocabularyId,
          completedAt: existingProgress.completedAt,
          message: "Progress updated successfully",
        };
      }

      const data: { completedAt?: Date } = {};

      // Preserve the first completion timestamp once a vocabulary is completed.
      if (dto.completed) {
        data.completedAt = new Date();
      }

      const progress = await this.learningProgressRepository.upsertProgress(
        childId,
        dto.vocabularyId,
        data,
      );

      this.logger.debug(
        `Progress updated for child ${childId}, vocabulary ${dto.vocabularyId}, completed: ${dto.completed}`,
      );

      return {
        childId: progress.childId,
        vocabularyId: progress.vocabularyId,
        completedAt: progress.completedAt,
        message: "Progress updated successfully",
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to update progress for child ${childId}, vocabulary ${dto.vocabularyId}: ${message}`,
        stack,
      );
      throw error;
    }
  }

  /**
   * Log video watch completion to activityLog (ActivityType.VIDEO)
   */
  async logVideoActivity(
    childId: number,
    dto: LogVideoActivityDto,
  ): Promise<VideoActivityResponseDto> {
    const topicExists = await this.prisma.topic.findUnique({
      where: { id: dto.topicId },
      select: { id: true },
    });
    if (!topicExists) {
      throw new NotFoundException(`Topic ${dto.topicId} not found`);
    }

    const durationSec = dto.durationSec ?? 0;
    await this.prisma.activityLog.create({
      data: {
        childId,
        topicId: dto.topicId,
        activityType: "VIDEO",
        durationSec,
        score: 100,
        pointsEarned: 0,
      },
    });

    return { childId, topicId: dto.topicId, durationSec, message: "Video activity logged" };
  }
}
