import { Injectable } from "@nestjs/common";
import { TopicQuiz, TopicQuizOption } from "@prisma/client";
import { QuestionDto, QuestionType, QuizDifficulty } from "../dto/quiz.dto";
import { QuizSessionState } from "./quiz-session.service";
import { QuizScoringService } from "./quiz-scoring.service";

@Injectable()
export class QuizQuestionService {
  constructor(private readonly quizScoringService: QuizScoringService) {}

  buildQuestionDto(
    question: QuizSessionState["questions"][number],
    questionNumber: number,
    totalQuestions: number,
    difficulty: QuizDifficulty,
  ): QuestionDto {
    return {
      questionId: question.questionId,
      questionNumber,
      totalQuestions,
      questionType: QuestionType.MULTIPLE_CHOICE,
      questionText: question.promptText,
      questionImage: question.imageUrl,
      options: question.options,
      difficulty,
      pointsValue: question.pointsValue,
      timeLimit: 15,
    };
  }

  buildCmsQuestion(
    quiz: TopicQuiz & { options: TopicQuizOption[] },
    index: number,
  ): QuizSessionState["questions"][number] | null {
    const options = [...quiz.options];
    const correctOption = options.find((option) => option.isCorrect);

    if (!correctOption || options.length < 2) {
      return null;
    }

    const shuffledOptions = this.shuffleOptions(
      options.map((option, optionIndex) => ({
        id: optionIndex + 1,
        text: option.text,
      })),
    );
    const correctAnswer = shuffledOptions.find(
      (option) => option.text === correctOption.text,
    );
    const difficulty = this.mapDifficultyLevel(quiz.difficultyLevel);

    if (!correctAnswer) {
      return null;
    }

    return {
      questionId: index + 1,
      promptText: quiz.questionText,
      imageUrl:
        (quiz as TopicQuiz & { questionImageUrl?: string | null })
          .questionImageUrl ?? undefined,
      word: correctAnswer.text,
      translation: quiz.questionText,
      correctOptionId: correctAnswer.id,
      options: shuffledOptions,
      difficulty,
      pointsValue: this.quizScoringService.calculatePointsValue(difficulty),
    };
  }

  private mapDifficultyLevel(level: number): QuizDifficulty {
    if (level >= 4) {
      return QuizDifficulty.HARD;
    }
    if (level <= 2) {
      return QuizDifficulty.EASY;
    }
    return QuizDifficulty.MEDIUM;
  }

  private shuffleOptions(
    options: Array<{ id: number; text: string; imageUrl?: string }>,
  ): Array<{ id: number; text: string; imageUrl?: string }> {
    const shuffled = [...options];

    for (let index = shuffled.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [
        shuffled[swapIndex],
        shuffled[index],
      ];
    }

    return shuffled.map((option, index) => ({
      ...option,
      id: index + 1,
    }));
  }
}
