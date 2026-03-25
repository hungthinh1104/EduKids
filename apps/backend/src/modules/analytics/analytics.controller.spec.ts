import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { NotFoundException, UnauthorizedException } from "@nestjs/common";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { ChildProfileRepository } from "../child-profile/child-profile.repository";
import { AnalyticsPeriod } from "./analytics.dto";

describe("AnalyticsController", () => {
  let controller: AnalyticsController;

  const analyticsServiceMock = {
    getAnalyticsOverview: jest.fn() as jest.Mock,
    getLearningTime: jest.fn() as jest.Mock,
    getVocabularyRetention: jest.fn() as jest.Mock,
    getPronunciationAccuracy: jest.fn() as jest.Mock,
    getQuizPerformance: jest.fn() as jest.Mock,
    getGamificationProgress: jest.fn() as jest.Mock,
  };

  const childProfileRepoMock = {
    getActiveProfile: jest.fn() as jest.Mock,
    getAllProfilesForParent: jest.fn() as jest.Mock,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        { provide: AnalyticsService, useValue: analyticsServiceMock },
        { provide: ChildProfileRepository, useValue: childProfileRepoMock },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
  });

  it("getAnalyticsOverview uses childId from query and default period", async () => {
    const expected = { hasData: true };
    (analyticsServiceMock.getAnalyticsOverview as any).mockResolvedValue(expected);

    const result = await controller.getAnalyticsOverview(
      { childId: 15 } as any,
      { user: { userId: 9 } } as any,
    );

    expect(analyticsServiceMock.getAnalyticsOverview).toHaveBeenCalledWith(
      15,
      9,
      AnalyticsPeriod.WEEK,
    );
    expect(result).toEqual(expected);
  });

  it("getLearningTime uses active profile when childId missing", async () => {
    (childProfileRepoMock.getActiveProfile as any).mockResolvedValue({ id: 22 });
    (analyticsServiceMock.getLearningTime as any).mockResolvedValue({ hasData: false });

    await controller.getLearningTime({} as any, { user: { userId: 8 } } as any);

    expect(childProfileRepoMock.getActiveProfile).toHaveBeenCalledWith(8);
    expect(analyticsServiceMock.getLearningTime).toHaveBeenCalledWith(
      22,
      8,
      AnalyticsPeriod.WEEK,
    );
  });

  it("falls back to first profile when no active profile", async () => {
    (childProfileRepoMock.getActiveProfile as any).mockResolvedValue(null);
    (childProfileRepoMock.getAllProfilesForParent as any).mockResolvedValue([{ id: 31 }]);
    (analyticsServiceMock.getQuizPerformance as any).mockResolvedValue({ hasData: false });

    await controller.getQuizPerformance({} as any, { user: { userId: 5 } } as any);

    expect(childProfileRepoMock.getAllProfilesForParent).toHaveBeenCalledWith(5);
    expect(analyticsServiceMock.getQuizPerformance).toHaveBeenCalledWith(
      31,
      5,
      AnalyticsPeriod.WEEK,
    );
  });

  it("throws NotFoundException when parent has no profiles", async () => {
    (childProfileRepoMock.getActiveProfile as any).mockResolvedValue(null);
    (childProfileRepoMock.getAllProfilesForParent as any).mockResolvedValue([]);

    await expect(
      controller.getVocabularyRetention({} as any, { user: { userId: 1 } } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it("throws UnauthorizedException for invalid jwt payload", async () => {
    await expect(controller.getGamificationProgress({} as any, {} as any)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
