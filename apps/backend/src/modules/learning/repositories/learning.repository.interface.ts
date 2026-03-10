import { LearningProgressEntity } from "../entities/learning-progress.entity";

export interface ILearningRepository {
  createProgress(
    progress: LearningProgressEntity,
  ): Promise<LearningProgressEntity>;
  findProgressByChild(childId: string): Promise<LearningProgressEntity[]>;
  getReviewQueue(
    childId: string,
    limit: number,
  ): Promise<LearningProgressEntity[]>;
  updateProgress(
    id: string,
    progress: Partial<LearningProgressEntity>,
  ): Promise<LearningProgressEntity>;
}
