import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { FlashcardService } from "./flashcard.service";
import { FlashcardRepository } from "./repositories/flashcard.repository";
import { FlashcardActivityRepository } from "./repositories/flashcard-activity.repository";
import { LearningProgressRepository } from "../learning/repositories/learning-progress.repository";
import { PrismaService } from "../../prisma/prisma.service";
import { ActivityType } from "./dto/flashcard.dto";

describe("FlashcardService", () => {
  let service: FlashcardService;
  let flashcardRepository: any;
  let activityRepository: any;
  let learningProgressRepository: any;
  let prismaService: any;

  beforeEach(async () => {
    const mockFlashcardRepository = {
      getFlashcardByVocabularyId: jest.fn(),
      generateDragDropOptions: jest.fn(),
      getOptionById: jest.fn(),
    };
    const mockActivityRepository = {
      create: jest.fn(),
      findLatestByVocabularyId: jest.fn(),
    };
    const mockLearningProgressRepository = {
      updatePoints: jest.fn(),
      getProgress: jest.fn(),
    };
    const mockPrismaService = {
      childProfile: { update: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlashcardService,
        { provide: FlashcardRepository, useValue: mockFlashcardRepository },
        { provide: FlashcardActivityRepository, useValue: mockActivityRepository },
        { provide: LearningProgressRepository, useValue: mockLearningProgressRepository },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<FlashcardService>(FlashcardService);
    flashcardRepository = module.get(FlashcardRepository);
    activityRepository = module.get(FlashcardActivityRepository);
    learningProgressRepository = module.get(LearningProgressRepository);
    prismaService = module.get(PrismaService);
  });

  describe("getFlashcard", () => {
    it("returns flashcard with media and options", async () => {
      const vocabularyId = 5;
      const mockVocab = {
        id: 5,
        word: "dog",
        phonetic: "/dɒɡ/",
        exampleSentence: "The dog is running.",
        translation: "chó",
        difficulty: 1,
        topicId: 1,
        media: [
          { id: 1, type: "IMAGE", url: "https://cdn.com/dog.jpg" },
          { id: 2, type: "AUDIO", url: "https://cdn.com/dog.mp3" },
        ],
      };
      const mockOptions = [
        { id: 1, text: "chó", isCorrect: true },
        { id: 2, text: "mèo", isCorrect: false },
        { id: 3, text: "chim", isCorrect: false },
      ];

      flashcardRepository.getFlashcardByVocabularyId.mockResolvedValue(mockVocab);
      flashcardRepository.generateDragDropOptions.mockResolvedValue(mockOptions);

      const result = await service.getFlashcard(vocabularyId);

      expect(result).toMatchObject({
        id: 5,
        word: "dog",
        exampleSentence: "The dog is running.",
        audioUrl: "https://cdn.com/dog.mp3",
        imageUrl: "https://cdn.com/dog.jpg",
      });
      expect(result.options).toHaveLength(3);
      expect(result.options[0]).toMatchObject({ id: 1, text: "chó" });
    });

    it("throws NotFoundException when vocabulary not found", async () => {
      flashcardRepository.getFlashcardByVocabularyId.mockResolvedValue(null);

      await expect(service.getFlashcard(999)).rejects.toThrow(NotFoundException);
    });

    it("throws BadRequestException when insufficient options", async () => {
      const mockVocab = {
        id: 5,
        word: "dog",
        media: [],
        topicId: 1,
      };
      flashcardRepository.getFlashcardByVocabularyId.mockResolvedValue(mockVocab);
      flashcardRepository.generateDragDropOptions.mockResolvedValue([]);

      await expect(service.getFlashcard(5)).rejects.toThrow(BadRequestException);
    });
  });

  describe("submitDragDropActivity", () => {
    it("awards points for correct answer", async () => {
      const childId = 2;
      const dto = {
        vocabularyId: 5,
        selectedOptionId: 1,
        activityType: ActivityType.DRAG_DROP,
        timeTakenMs: 3000,
      };

      const mockVocab = {
        id: 5,
        word: "dog",
        translation: "chó",
        media: [{ type: "AUDIO", url: "https://cdn.com/dog.mp3" }],
      };
      const mockCorrectOption = { id: 1, text: "chó", isCorrect: true };
      const mockOtherOptions = [
        { id: 2, text: "mèo" },
        { id: 3, text: "chim" },
      ];

      flashcardRepository.getFlashcardByVocabularyId.mockResolvedValue(mockVocab);
      flashcardRepository.getOptionById.mockResolvedValue(mockCorrectOption);
      flashcardRepository.generateDragDropOptions.mockResolvedValue([
        mockCorrectOption,
        ...mockOtherOptions,
      ]);
      activityRepository.create.mockResolvedValue({ id: 1 });
      learningProgressRepository.updatePoints.mockResolvedValue({
        totalPoints: 120,
        currentLevel: 2,
      });

      const result = await service.submitDragDropActivity(childId, dto);

      expect(result.feedback.isCorrect).toBe(true);
      expect(result.totalPoints).toBe(120);
      expect(activityRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          childId,
          vocabularyId: 5,
          isCorrect: true,
        }),
      );
    });

    it("rejects answer for incorrect option", async () => {
      const childId = 2;
      const dto = {
        vocabularyId: 5,
        selectedOptionId: 2, // Wrong option
        activityType: ActivityType.DRAG_DROP,
        timeTakenMs: 1000,
      };

      const mockVocab = {
        id: 5,
        word: "dog",
        translation: "chó",
        media: [{ type: "AUDIO", url: "https://cdn.com/dog.mp3" }],
      };
      const mockCorrectOption = { id: 1, text: "chó", isCorrect: true };
      const mockWrongOption = { id: 2, text: "mèo", isCorrect: false };

      flashcardRepository.getFlashcardByVocabularyId.mockResolvedValue(mockVocab);
      flashcardRepository.getOptionById.mockResolvedValue(mockWrongOption);
      flashcardRepository.generateDragDropOptions.mockResolvedValue([
        mockCorrectOption,
        mockWrongOption,
      ]);
      activityRepository.create.mockResolvedValue({ id: 1 });
      learningProgressRepository.updatePoints.mockResolvedValue({
        totalPoints: 100,
        currentLevel: 1,
      });

      const result = await service.submitDragDropActivity(childId, dto);

      expect(result.feedback.isCorrect).toBe(false);
      expect(result.feedback.correctAnswer).toBe("chó");
    });

    it("throws NotFoundException for nonexistent vocabulary", async () => {
      const childId = 2;
      const dto = {
        vocabularyId: 999,
        selectedOptionId: 1,
        activityType: ActivityType.DRAG_DROP,
      };

      flashcardRepository.getFlashcardByVocabularyId.mockResolvedValue(null);

      await expect(service.submitDragDropActivity(childId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
