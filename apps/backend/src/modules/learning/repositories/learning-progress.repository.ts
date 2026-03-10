import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class LearningProgressRepository {
  constructor(private prisma: PrismaService) {}

  async findProgressByChildAndTopic(childId: number, topicId: number) {
    return await this.prisma.learningProgress.findMany({
      where: {
        childId,
        vocabulary: {
          topicId,
        },
      },
    });
  }

  async countCompletedByChildAndTopic(
    childId: number,
    topicId: number,
  ): Promise<number> {
    return await this.prisma.learningProgress.count({
      where: {
        childId,
        vocabulary: {
          topicId,
        },
        completedAt: {
          not: null,
        },
      },
    });
  }

  async upsertProgress(
    childId: number,
    vocabularyId: number,
    data: { completedAt?: Date },
  ) {
    return await this.prisma.learningProgress.upsert({
      where: {
        childId_vocabularyId: {
          childId,
          vocabularyId,
        },
      },
      create: {
        childId,
        vocabularyId,
        ...data,
      },
      update: {
        ...data,
      },
    });
  }
}
