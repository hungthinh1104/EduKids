import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ActivityType } from "../dto/flashcard.dto";
import { $Enums } from "@prisma/client";

@Injectable()
export class FlashcardActivityRepository {
  constructor(private prisma: PrismaService) {}

  private toPrismaActivityType(
    activityType: ActivityType,
  ): $Enums.ActivityType {
    switch (activityType) {
      case ActivityType.DRAG_DROP:
      case ActivityType.MATCHING:
      case ActivityType.FILL_BLANK:
      default:
        return "FLASHCARD";
    }
  }

  /**
   * Save flashcard interaction (drag-drop result)
   * UC-02 Post-condition: Interaction results saved
   */
  async createActivity(data: {
    childId: number;
    vocabularyId: number;
    activityType: ActivityType;
    isCorrect: boolean;
    pointsEarned: number;
    timeTakenMs?: number;
    selectedOptionId: number;
  }) {
    // Convert DTO ActivityType to Prisma ActivityType
    const prismaActivityType = this.toPrismaActivityType(data.activityType);

    return await this.prisma.activityLog.create({
      data: {
        childId: data.childId,
        vocabularyId: data.vocabularyId,
        activityType: prismaActivityType,
        pointsEarned: data.pointsEarned,
        score: data.isCorrect ? 100 : 0,
        metadata: {
          selectedOptionId: data.selectedOptionId,
          isCorrect: data.isCorrect,
          activityType: data.activityType,
          timeTakenMs: data.timeTakenMs ?? null,
        },
        durationSec: data.timeTakenMs ? Math.floor(data.timeTakenMs / 1000) : 0,
      },
    });
  }

  /**
   * Get child's activity history for topic
   * Used to avoid repetition
   */
  async getActivityHistory(
    childId: number,
    vocabularyId: number,
    limit: number = 10,
  ) {
    return await this.prisma.activityLog.findMany({
      where: {
        childId,
        vocabularyId,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        durationSec: true,
      },
    });
  }
}
