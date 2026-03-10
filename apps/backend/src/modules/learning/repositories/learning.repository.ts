import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { LearningProgressEntity } from "../entities/learning-progress.entity";
import { ILearningRepository } from "./learning.repository.interface";

@Injectable()
export class LearningRepository implements ILearningRepository {
  constructor(private prisma: PrismaService) {}

  async createProgress(
    progress: LearningProgressEntity,
  ): Promise<LearningProgressEntity> {
    // TODO: Implement createProgress
    return progress;
  }

  async findProgressByChild(
    _childId: string,
  ): Promise<LearningProgressEntity[]> {
    // TODO: Implement findProgressByChild
    return [];
  }

  async getReviewQueue(
    _childId: string,
    _limit: number,
  ): Promise<LearningProgressEntity[]> {
    // TODO: Implement getReviewQueue (spaced repetition logic)
    return [];
  }

  async updateProgress(
    id: string,
    progress: Partial<LearningProgressEntity>,
  ): Promise<LearningProgressEntity> {
    // TODO: Implement updateProgress
    return progress as LearningProgressEntity;
  }
}
