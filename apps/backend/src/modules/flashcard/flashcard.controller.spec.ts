import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { HttpStatus } from "@nestjs/common";
import { FlashcardController } from "./flashcard.controller";
import { FlashcardService } from "./flashcard.service";
import { ActivityType } from "./dto/flashcard.dto";

describe("FlashcardController", () => {
  let controller: FlashcardController;

  const flashcardServiceMock = {
    getFlashcard: jest.fn() as jest.Mock,
    submitDragDropActivity: jest.fn() as jest.Mock,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlashcardController],
      providers: [
        { provide: FlashcardService, useValue: flashcardServiceMock },
      ],
    }).compile();

    controller = module.get<FlashcardController>(FlashcardController);
  });

  it("getFlashcard delegates to FlashcardService", async () => {
    const expected = {
      id: 1,
      vocabularyId: 5,
      word: "dog",
      media: [],
      audioUrl: "audio",
      imageUrl: "image",
      options: [],
    };
    (flashcardServiceMock.getFlashcard as any).mockResolvedValue(expected);

    const result = await controller.getFlashcard(5);

    expect(flashcardServiceMock.getFlashcard).toHaveBeenCalledWith(5);
    expect(result).toEqual(expected);
  });

  it("submitDragDropActivity throws FORBIDDEN when childId is missing", async () => {
    const dto = {
      vocabularyId: 3,
      selectedOptionId: 1,
      activityType: ActivityType.DRAG_DROP,
    };

    await expect(
      controller.submitDragDropActivity(3, dto, { user: {} } as any),
    ).rejects.toMatchObject({ status: HttpStatus.FORBIDDEN });
  });

  it("submitDragDropActivity throws BAD_REQUEST on vocabularyId mismatch", async () => {
    const dto = {
      vocabularyId: 99,
      selectedOptionId: 1,
      activityType: ActivityType.DRAG_DROP,
    };

    await expect(
      controller.submitDragDropActivity(3, dto, {
        user: { childId: 2 },
      } as any),
    ).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST });
  });

  it("submitDragDropActivity delegates to service with childId", async () => {
    const dto = {
      vocabularyId: 3,
      selectedOptionId: 1,
      activityType: ActivityType.DRAG_DROP,
    };
    const expected = {
      activityId: 7,
      feedback: { isCorrect: true, message: "Nice!", audioUrl: "audio" },
      audioPlaybackFailed: false,
      totalPoints: 120,
      currentLevel: 2,
    };
    (flashcardServiceMock.submitDragDropActivity as any).mockResolvedValue(
      expected,
    );

    const result = await controller.submitDragDropActivity(3, dto, {
      user: { childId: 2 },
    } as any);

    expect(flashcardServiceMock.submitDragDropActivity).toHaveBeenCalledWith(
      2,
      dto,
    );
    expect(result).toEqual(expected);
  });
});
