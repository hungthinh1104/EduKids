import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { BadRequestException } from "@nestjs/common";
import { PronunciationController } from "./pronunciation.controller";
import { PronunciationService } from "./pronunciation.service";

describe("PronunciationController", () => {
  let controller: PronunciationController;

  const pronunciationServiceMock = {
    submitPronunciationAttempt: jest.fn() as jest.Mock,
    getPronunciationProgress: jest.fn() as jest.Mock,
    getPronunciationHistory: jest.fn() as jest.Mock,
    getPronunciationStats: jest.fn() as jest.Mock,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PronunciationController],
      providers: [
        { provide: PronunciationService, useValue: pronunciationServiceMock },
      ],
    }).compile();

    controller = module.get<PronunciationController>(PronunciationController);
  });

  it("submitPronunciation throws when childId missing", async () => {
    await expect(
      controller.submitPronunciation(5, { audioBase64: "abc" } as any, {} as any),
    ).rejects.toThrow(BadRequestException);
  });

  it("submitPronunciation delegates to service", async () => {
    const expected = { score: 88, stars: 4 };
    (pronunciationServiceMock.submitPronunciationAttempt as any).mockResolvedValue(expected);

    const result = await controller.submitPronunciation(
      6,
      { audioBase64: "abc" } as any,
      { childId: 12 } as any,
    );

    expect(pronunciationServiceMock.submitPronunciationAttempt).toHaveBeenCalledWith(12, 6, {
      audioBase64: "abc",
    });
    expect(result).toEqual(expected);
  });

  it("getPronunciationProgress delegates with childId and vocabularyId", async () => {
    (pronunciationServiceMock.getPronunciationProgress as any).mockResolvedValue({ best: 90 });

    const result = await controller.getPronunciationProgress(4, { childId: 3 } as any);

    expect(pronunciationServiceMock.getPronunciationProgress).toHaveBeenCalledWith(3, 4);
    expect(result).toEqual({ best: 90 });
  });

  it("getPronunciationHistory delegates with fixed limit 10", async () => {
    (pronunciationServiceMock.getPronunciationHistory as any).mockResolvedValue([]);

    await controller.getPronunciationHistory({ childId: 7 } as any);

    expect(pronunciationServiceMock.getPronunciationHistory).toHaveBeenCalledWith(7, 10);
  });

  it("getPronunciationStats delegates", async () => {
    (pronunciationServiceMock.getPronunciationStats as any).mockResolvedValue({ avg: 75 });

    const result = await controller.getPronunciationStats({ childId: 5 } as any);

    expect(pronunciationServiceMock.getPronunciationStats).toHaveBeenCalledWith(5);
    expect(result).toEqual({ avg: 75 });
  });
});
