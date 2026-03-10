export class LearningProgressEntity {
  id: string;
  childId: string;
  vocabularyId: string;
  quizScore: number;
  pronunciationScore?: number;
  reviewCount: number;
  lastReviewedAt: Date;
}
