import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { RecommendationController } from "./recommendation.controller";
import { RecommendationService } from "./recommendation.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("RecommendationController", () => {
  let controller: RecommendationController;

  const recommendationServiceMock = {
    getRecommendations: jest.fn() as jest.Mock,
    applyRecommendation: jest.fn() as jest.Mock,
    getAppliedPaths: jest.fn() as jest.Mock,
    getStatistics: jest.fn() as jest.Mock,
    getInsights: jest.fn() as jest.Mock,
    saveFeedback: jest.fn() as jest.Mock,
    dismissRecommendations: jest.fn() as jest.Mock,
    regenerateRecommendations: jest.fn() as jest.Mock,
    regenerateRecommendationsWithGemini: jest.fn() as jest.Mock,
  };

  const prismaMock = {
    childProfile: {
      findFirst: jest.fn() as jest.Mock,
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecommendationController],
      providers: [
        { provide: RecommendationService, useValue: recommendationServiceMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    controller = module.get<RecommendationController>(RecommendationController);
  });

  it("getRecommendations throws BadRequestException for invalid childId", async () => {
    await expect(controller.getRecommendations("abc", 1)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("getRecommendations throws NotFoundException when child is not owned", async () => {
    (prismaMock.childProfile.findFirst as any).mockResolvedValue(null);

    await expect(controller.getRecommendations("5", 1)).rejects.toThrow(
      NotFoundException,
    );
  });

  it("getRecommendations returns service data when ownership is valid", async () => {
    const expected = { recommendations: [{ id: 1 }] };
    (prismaMock.childProfile.findFirst as any).mockResolvedValue({ id: 5 });
    (recommendationServiceMock.getRecommendations as any).mockResolvedValue(expected);

    const result = await controller.getRecommendations("5", 9);

    expect(recommendationServiceMock.getRecommendations).toHaveBeenCalledWith(5);
    expect(result).toEqual(expected);
  });

  it("applyRecommendation maps not found error from service", async () => {
    (prismaMock.childProfile.findFirst as any).mockResolvedValue({ id: 5 });
    (recommendationServiceMock.applyRecommendation as any).mockRejectedValue(
      new Error("recommendation not found"),
    );

    await expect(
      controller.applyRecommendation("5", { recommendationId: 99 } as any, 2),
    ).rejects.toThrow(NotFoundException);
  });

  it("dismissRecommendations validates empty recommendationIds", async () => {
    await expect(
      controller.dismissRecommendations("5", { recommendationIds: [] } as any, 2),
    ).rejects.toThrow(BadRequestException);
  });

  it("dismissRecommendations delegates to service", async () => {
    const expected = { dismissedCount: 2 };
    (prismaMock.childProfile.findFirst as any).mockResolvedValue({ id: 5 });
    (recommendationServiceMock.dismissRecommendations as any).mockResolvedValue(
      expected,
    );

    const result = await controller.dismissRecommendations(
      "5",
      { recommendationIds: [1, 2] } as any,
      10,
    );

    expect(recommendationServiceMock.dismissRecommendations).toHaveBeenCalledWith(
      5,
      [1, 2],
    );
    expect(result).toEqual(expected);
  });
});
