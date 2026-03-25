import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { HttpException, HttpStatus } from "@nestjs/common";
import { LearningController } from "./learning.controller";
import { LearningService } from "./learning.service";

describe("LearningController", () => {
  let controller: LearningController;

  const learningServiceMock = {
    updateViewingProgress: jest.fn() as jest.Mock,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LearningController],
      providers: [{ provide: LearningService, useValue: learningServiceMock }],
    }).compile();

    controller = module.get<LearningController>(LearningController);
  });

  it("throws FORBIDDEN when childId missing", async () => {
    await expect(
      controller.updateProgress({ vocabularyId: 1 } as any, {
        user: { role: "LEARNER" },
      } as any),
    ).rejects.toMatchObject({
      status: HttpStatus.FORBIDDEN,
    });
  });

  it("delegates updateProgress to service with childId", async () => {
    const dto = { vocabularyId: 2, isCompleted: true };
    const expected = { success: true };
    (learningServiceMock.updateViewingProgress as any).mockResolvedValue(expected);

    const result = await controller.updateProgress(dto as any, {
      user: { childId: 99, role: "LEARNER" },
    } as any);

    expect(learningServiceMock.updateViewingProgress).toHaveBeenCalledWith(99, dto);
    expect(result).toEqual(expected);
  });
});
