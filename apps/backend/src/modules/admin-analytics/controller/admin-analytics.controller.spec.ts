import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AdminAnalyticsController } from "./admin-analytics.controller";
import { AdminAnalyticsService } from "../service/admin-analytics.service";

describe("AdminAnalyticsController", () => {
  let controller: AdminAnalyticsController;

  const analyticsServiceMock = {
    getDashboardSummary: jest.fn() as jest.Mock,
    getDailyActiveUsers: jest.fn() as jest.Mock,
    getSessionLength: jest.fn() as jest.Mock,
    getContentPopularity: jest.fn() as jest.Mock,
    getDbStats: jest.fn() as jest.Mock,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminAnalyticsController],
      providers: [
        { provide: AdminAnalyticsService, useValue: analyticsServiceMock },
      ],
    }).compile();

    controller = module.get<AdminAnalyticsController>(AdminAnalyticsController);
  });

  it("getDashboardSummary delegates", async () => {
    const expected = { dau: 100 };
    (analyticsServiceMock.getDashboardSummary as any).mockResolvedValue(
      expected,
    );

    const result = await controller.getDashboardSummary();

    expect(analyticsServiceMock.getDashboardSummary).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expected);
  });

  it("getDailyActiveUsers delegates query", async () => {
    const query = { period: "7d" };
    (analyticsServiceMock.getDailyActiveUsers as any).mockResolvedValue({
      points: [],
    });

    await controller.getDailyActiveUsers(query as any);

    expect(analyticsServiceMock.getDailyActiveUsers).toHaveBeenCalledWith(
      query,
    );
  });

  it("getContentPopularity delegates query", async () => {
    const query = { limit: 5 };
    (analyticsServiceMock.getContentPopularity as any).mockResolvedValue({
      items: [],
    });

    await controller.getContentPopularity(query as any);

    expect(analyticsServiceMock.getContentPopularity).toHaveBeenCalledWith(
      query,
    );
  });

  it("getDbStats delegates", async () => {
    const expected = { topics: 10 };
    (analyticsServiceMock.getDbStats as any).mockResolvedValue(expected);

    const result = await controller.getDbStats();

    expect(analyticsServiceMock.getDbStats).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expected);
  });
});
