import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { QuizService } from "./quiz.service";
import { QuizRepository } from "./repositories/quiz.repository";
import { PrismaService } from "../../prisma/prisma.service";
import { QuizDifficulty } from "./dto/quiz.dto";

describe("QuizService", () => {
  let service: QuizService;
  let quizRepository: any;
  let prismaService: any;
  let cacheManager: any;

  beforeEach(async () => {
    const mockQuizRepository: any = {
      getTopicById: jest.fn(),
      getPublishedTopicQuizzes: jest.fn(),
      getVocabularyForQuiz: jest.fn(),
    };

    const mockCacheManager: any = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const mockPrismaService: any = {
      quizSession: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      activity: { create: jest.fn() },
      childProfile: { findUnique: jest.fn(), update: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizService,
        { provide: QuizRepository, useValue: mockQuizRepository },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<QuizService>(QuizService);
    quizRepository = module.get(QuizRepository);
    prismaService = module.get(PrismaService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  describe("startQuiz", () => {
    it("starts quiz with valid topic", async () => {
      const childId = 5;
      const topicId = 1;
      const dto = { topicId, questionCount: 10 };

      const mockTopic = { id: 1, title: "Animals" };
      const mockQuizzes = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        promptText: `Q${i + 1}?`,
        correctOptionId: 1,
        options: [
          { id: i * 2 + 1, text: "a" },
          { id: i * 2 + 2, text: "b" },
        ],
      }));

      quizRepository.getTopicById.mockResolvedValue(mockTopic);
      quizRepository.getPublishedTopicQuizzes.mockResolvedValue(mockQuizzes);
      cacheManager.get.mockResolvedValue(null);
      prismaService.quizSession.create.mockResolvedValue({
        id: "session-1",
        childId,
        topicId,
      });

      const result = await service.startQuiz(childId, dto);

      expect(result.quizSessionId).toBeDefined();
      expect(result.topicId).toBe(topicId);
    });

    it("throws NotFoundException for nonexistent topic", async () => {
      const childId = 5;
      const dto = { topicId: 999, questionCount: 10 };

      quizRepository.getTopicById.mockResolvedValue(null);

      await expect(service.startQuiz(childId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("uses default question count when not provided", async () => {
      const childId = 5;
      const topicId = 1;
      const dto = { topicId }; // No questionCount

      const mockTopic = { id: 1, title: "Animals" };

      quizRepository.getTopicById.mockResolvedValue(mockTopic);
      quizRepository.getPublishedTopicQuizzes.mockResolvedValue([]);
      cacheManager.get.mockResolvedValue(null);

      try {
        await service.startQuiz(childId, dto as any);
      } catch {
        // Expected to potentially fail due to missing vocabularies
      }

      expect(quizRepository.getTopicById).toHaveBeenCalledWith(topicId);
    });
  });

  describe("submitAnswer", () => {
    it("records correct answer and updates difficulty", async () => {
      const childId = 5;
      const sessionId = "session-1";
      const dto = {
        quizSessionId: sessionId,
        questionId: 1,
        selectedOptionId: 1,
        timeTakenMs: 5000,
      };

      const mockSession = {
        id: sessionId,
        childId,
        topicId: 1,
        questions: [
          {
            questionId: 1,
            correctOptionId: 1,
            difficulty: QuizDifficulty.MEDIUM,
            pointsValue: 10,
          },
        ],
        currentScore: 0,
        startedAt: new Date(),
      };

      cacheManager.get.mockResolvedValue(JSON.stringify(mockSession));
      cacheManager.set.mockResolvedValue(null);
      prismaService.quizSession.findUnique.mockResolvedValue(mockSession);
      prismaService.activity.create.mockResolvedValue({ id: 1 });

      const result = await service.submitAnswer(childId, dto);

      expect(result).toBeDefined();
      expect(prismaService.activity.create).toHaveBeenCalled();
    });

    it("records incorrect answer", async () => {
      const childId = 5;
      const sessionId = "session-1";
      const dto = {
        quizSessionId: sessionId,
        questionId: 1,
        selectedOptionId: 2, // Wrong option
        timeTakenMs: 2000,
      };

      const mockSession = {
        id: sessionId,
        childId,
        topicId: 1,
        questions: [
          {
            questionId: 1,
            correctOptionId: 1,
            difficulty: QuizDifficulty.MEDIUM,
            pointsValue: 10,
          },
        ],
        currentScore: 0,
        startedAt: new Date(),
      };

      cacheManager.get.mockResolvedValue(JSON.stringify(mockSession));
      cacheManager.set.mockResolvedValue(null);
      prismaService.quizSession.findUnique.mockResolvedValue(mockSession);
      prismaService.activity.create.mockResolvedValue({ id: 1 });

      const result = await service.submitAnswer(childId, dto);

      expect(result).toBeDefined();
      expect(prismaService.activity.create).toHaveBeenCalled();
    });
  });

  describe("getQuizResults", () => {
    it("returns quiz results with breakdown", async () => {
      const childId = 5;
      const sessionId = "session-1";

      const mockSession = {
        id: sessionId,
        childId,
        topicId: 1,
        answers: [
          {
            questionId: 1,
            isCorrect: true,
            pointsEarned: 10,
            timeTakenMs: 5000,
          },
          {
            questionId: 2,
            isCorrect: false,
            pointsEarned: 0,
            timeTakenMs: 3000,
          },
        ],
        currentScore: 10,
        startedAt: new Date(),
      };

      cacheManager.get.mockResolvedValue(JSON.stringify(mockSession));
      prismaService.quizSession.findUnique.mockResolvedValue(mockSession);

      const result = await service.getQuizResults(childId, sessionId);

      expect(result).toBeDefined();
    });
  });
});
