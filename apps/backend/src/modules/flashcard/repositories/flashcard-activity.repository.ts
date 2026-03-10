import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ActivityType } from "../dto/flashcard.dto";
import { $Enums } from "@prisma/client";

@Injectable()
export class FlashcardActivityRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Save flashcard interaction (drag-drop result)
   * UC-02 Post-condition: Interaction results saved
   */
  async createActivity(data: {
    childId: number;
    vocabularyId: number;
    activityType: ActivityType;
    isCorrect: boolean;
    timeTakenMs?: number;
    selectedOptionId: number;
  }) {
    // Convert DTO ActivityType to Prisma ActivityType
    const prismaActivityType =
      data.activityType as unknown as $Enums.ActivityType;

    return await this.prisma.activityLog.create({
      data: {
        childId: data.childId,
        vocabularyId: data.vocabularyId,
        activityType: prismaActivityType,
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
