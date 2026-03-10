import { QuizQuestionEntity } from "../entities/quiz-question.entity";

export interface IQuizRepository {
  createQuestion(question: QuizQuestionEntity): Promise<QuizQuestionEntity>;
  findQuizByVocabulary(
    vocabularyId: string,
  ): Promise<QuizQuestionEntity | null>;
  findRandomQuiz(limit: number): Promise<QuizQuestionEntity[]>;
}
