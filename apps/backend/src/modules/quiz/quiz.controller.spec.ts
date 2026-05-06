import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { BadRequestException } from "@nestjs/common";
import { QuizController } from "./quiz.controller";
import { QuizService } from "./quiz.service";
import { RedisAnalyticsService } from "../admin-analytics/service/redis-analytics.service";

describe("QuizController", () => {
  let controller: QuizController;

  const quizServiceMock = {
    startQuiz: jest.fn() as jest.Mock,
    submitAnswer: jest.fn() as jest.Mock,
    getQuizResults: jest.fn() as jest.Mock,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizController],
      providers: [
        { provide: QuizService, useValue: quizServiceMock },
        { provide: RedisAnalyticsService, useValue: { trackContentView: jest.fn().mockReturnValue(Promise.resolve()), trackQuizStarted: jest.fn().mockReturnValue(Promise.resolve()), trackQuizCompleted: jest.fn().mockReturnValue(Promise.resolve()) } },
      ],
    }).compile();

    controller = module.get<QuizController>(QuizController);
  });

  it("startQuiz throws when child profile is missing", async () => {
    await expect(
      controller.startQuiz({ topicId: 1 } as any, { id: 1 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("startQuiz delegates to service", async () => {
    const dto = { topicId: 1, questionCount: 10 };
    const expected = { quizSessionId: "s1", topicId: 1 };
    (quizServiceMock.startQuiz as any).mockResolvedValue(expected);

    const result = await controller.startQuiz(
      dto as any,
      { childId: 5 } as any,
    );

    expect(quizServiceMock.startQuiz).toHaveBeenCalledWith(5, dto);
    expect(result).toEqual(expected);
  });

  it("submitAnswer delegates to service", async () => {
    const dto = {
      quizSessionId: "s1",
      questionId: 1,
      selectedOptionId: 2,
      timeTakenMs: 1200,
    };
    const expected = { isCorrect: true, pointsEarned: 10 };
    (quizServiceMock.submitAnswer as any).mockResolvedValue(expected);

    const result = await controller.submitAnswer(
      dto as any,
      { childId: 5 } as any,
    );

    expect(quizServiceMock.submitAnswer).toHaveBeenCalledWith(5, dto);
    expect(result).toEqual(expected);
  });

  it("getQuizResults delegates to service", async () => {
    const expected = { quizSessionId: "s1", finalScore: 80 };
    (quizServiceMock.getQuizResults as any).mockResolvedValue(expected);

    const result = await controller.getQuizResults("s1", { childId: 9 } as any);

    expect(quizServiceMock.getQuizResults).toHaveBeenCalledWith(9, "s1");
    expect(result).toEqual(expected);
  });
});
