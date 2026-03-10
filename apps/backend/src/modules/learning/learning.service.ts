import { Injectable, Logger } from "@nestjs/common";
import { LearningProgressRepository } from "./repositories/learning-progress.repository";
import { UpdateProgressDto, ProgressResponseDto } from "./dto/progress.dto";

@Injectable()
export class LearningService {
  private readonly logger = new Logger(LearningService.name);

  constructor(private learningProgressRepository: LearningProgressRepository) {}

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
      const data: { completedAt?: Date } = {};

      // If marked as completed, set completedAt timestamp
      if (dto.completed) {
        data.completedAt = new Date();
      }

      const progress = await this.learningProgressRepository.upsertProgress(
        childId,
        dto.vocabularyId,
        data,
      );

      this.logger.log(
        `Progress updated for child ${childId}, vocabulary ${dto.vocabularyId}, completed: ${dto.completed}`,
      );

      return {
        childId: progress.childId,
        vocabularyId: progress.vocabularyId,
        completedAt: progress.completedAt,
        message: "Progress updated successfully",
      };
    } catch (error) {
      this.logger.error(
        `Failed to update progress for child ${childId}, vocabulary ${dto.vocabularyId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
