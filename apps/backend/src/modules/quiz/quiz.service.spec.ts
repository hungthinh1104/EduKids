import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { QuizService } from "./quiz.service";
import { QuizRepository } from "./repositories/quiz.repository";
import { PrismaService } from "../../prisma/prisma.service";
import { QuizSessionService } from "./services/quiz-session.service";
import { QuizScoringService } from "./services/quiz-scoring.service";
import { QuizQuestionService } from "./services/quiz-question.service";
import { QuizEventPublisherService } from "./services/quiz-event-publisher.service";
import { GamificationService } from "../gamification/gamification.service";
import { QuizDifficulty } from "./dto/quiz.dto";

describe("QuizService", () => {
  let service: QuizService;
  let quizRepository: any;
  let quizSessionService: any;

  beforeEach(async () => {
    const mockQuizRepository: any = {
      getTopicById: jest.fn(),
      getPublishedTopicQuizzes: jest.fn(),
      analyzeLearnerPerformance: jest.fn(),
      selectAdaptiveQuestions: jest.fn(),
      generateDistractors: jest.fn(),
      calculateAdaptiveDifficulty: jest.fn(),
      recordQuizAttempt: jest.fn(),
      updateQuizProgress: jest.fn(),
      getQuizStats: jest.fn(),
    };

    const mockPrismaService: any = {
      vocabulary: { findMany: jest.fn() },
      childProfile: { findUnique: jest.fn(), update: jest.fn() },
    };

    const mockQuizSessionService: any = {
      getSession: jest.fn(),
      saveSession: jest.fn(),
      assertOwnership: jest.fn(),
      assertCurrentQuestionOrder: jest.fn(),
      acquireAnswerLock: jest.fn(),
      releaseAnswerLock: jest.fn(),
    };

    const mockQuizScoringService: any = {
      calculatePointsValue: jest.fn().mockReturnValue(10),
      calculateStarsFromPercentage: jest.fn().mockReturnValue(4),
      calculateQuizRewardPoints: jest.fn().mockReturnValue(20),
      checkQuizBadges: jest.fn().mockReturnValue(undefined),
      generatePerformanceMessage: jest.fn().mockReturnValue("Great job!"),
    };

    const mockQuizQuestionService: any = {
      buildQuestionDto: jest.fn((q: any) => ({
        questionId: q.questionId,
        questionNumber: 1,
        totalQuestions: 1,
        questionType: "MULTIPLE_CHOICE",
        questionText: q.promptText,
        options: q.options,
        difficulty: q.difficulty,
        pointsValue: q.pointsValue,
        timeLimit: 15,
      })),
      buildCmsQuestion: jest.fn(),
    };

    const mockQuizEventPublisherService: any = {
      publishQuizSubmitted: jest.fn(),
      publishQuizCompleted: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizService,
        { provide: QuizRepository, useValue: mockQuizRepository },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: QuizSessionService, useValue: mockQuizSessionService },
        { provide: QuizScoringService, useValue: mockQuizScoringService },
        { provide: QuizQuestionService, useValue: mockQuizQuestionService },
        {
          provide: QuizEventPublisherService,
          useValue: mockQuizEventPublisherService,
        },
        {
          provide: GamificationService,
          useValue: { awardPoints: jest.fn(), checkAndAwardBadges: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<QuizService>(QuizService);
    quizRepository = module.get(QuizRepository);
    quizSessionService = module.get(QuizSessionService);
  });

  it("throws NotFoundException for nonexistent topic", async () => {
    quizRepository.getTopicById.mockResolvedValue(null);

    await expect(
      service.startQuiz(5, { topicId: 999, questionCount: 10 }),
    ).rejects.toThrow(NotFoundException);
  });

  it("rejects submit when the same question is already in-flight", async () => {
    const dto = {
      quizSessionId: "session-1",
      questionId: 1,
      selectedOptionId: 1,
      timeTakenMs: 1000,
    };

    const session = {
      quizSessionId: "session-1",
      childId: 5,
      topicId: 1,
      topicName: "Animals",
      questions: [
        {
          questionId: 1,
          promptText: "What is this?",
          word: "dog",
          translation: "chó",
          correctOptionId: 1,
          options: [{ id: 1, text: "dog" }],
          difficulty: QuizDifficulty.MEDIUM,
          pointsValue: 10,
        },
      ],
      currentQuestionIndex: 0,
      answers: [],
      currentScore: 0,
      currentDifficulty: QuizDifficulty.MEDIUM,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      startedAt: new Date(),
    };

    quizSessionService.getSession.mockResolvedValue(session);
    quizSessionService.acquireAnswerLock.mockReturnValue(false);

    await expect(service.submitAnswer(5, dto as any)).rejects.toThrow(
      BadRequestException,
    );

    expect(quizSessionService.releaseAnswerLock).not.toHaveBeenCalled();
  });
});
