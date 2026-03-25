import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { BadRequestException } from "@nestjs/common";
import { GamificationController } from "./gamification.controller";
import { GamificationService } from "./gamification.service";

describe("GamificationController", () => {
  let controller: GamificationController;

  const gamificationServiceMock = {
    getRewardSummary: jest.fn() as jest.Mock,
    getShopItemsByCategory: jest.fn() as jest.Mock,
    getShopItems: jest.fn() as jest.Mock,
    purchaseItem: jest.fn() as jest.Mock,
    getLeaderboard: jest.fn() as jest.Mock,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GamificationController],
      providers: [
        { provide: GamificationService, useValue: gamificationServiceMock },
      ],
    }).compile();

    controller = module.get<GamificationController>(GamificationController);
  });

  it("getRewardSummary throws when child profile is missing", async () => {
    await expect(controller.getRewardSummary({ id: 1 } as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("getRewardSummary delegates to service", async () => {
    const expected = { totalPoints: 100, currentLevel: 2 };
    (gamificationServiceMock.getRewardSummary as any).mockResolvedValue(expected);

    const result = await controller.getRewardSummary({ childId: 7 } as any);

    expect(gamificationServiceMock.getRewardSummary).toHaveBeenCalledWith(7);
    expect(result).toEqual(expected);
  });

  it("getShopItems uses category-specific service when category is provided", async () => {
    const expected = [{ id: 1, name: "Hat" }];
    (gamificationServiceMock.getShopItemsByCategory as any).mockResolvedValue(
      expected,
    );

    const result = await controller.getShopItems("AVATAR_HAIR" as any, {
      childId: 7,
    } as any);

    expect(gamificationServiceMock.getShopItemsByCategory).toHaveBeenCalledWith(
      7,
      "AVATAR_HAIR",
    );
    expect(result).toEqual(expected);
  });

  it("purchaseItem delegates to service", async () => {
    const dto = { shopItemId: 10 };
    const expected = { success: true, remainingPoints: 50 };
    (gamificationServiceMock.purchaseItem as any).mockResolvedValue(expected);

    const result = await controller.purchaseItem(dto as any, { childId: 9 } as any);

    expect(gamificationServiceMock.purchaseItem).toHaveBeenCalledWith(9, dto);
    expect(result).toEqual(expected);
  });

  it("getLeaderboard delegates with default limit", async () => {
    const expected = [{ rank: 1, childId: 9, points: 300 }];
    (gamificationServiceMock.getLeaderboard as any).mockResolvedValue(expected);

    const result = await controller.getLeaderboard(undefined as any, {
      childId: 9,
    } as any);

    expect(gamificationServiceMock.getLeaderboard).toHaveBeenCalledWith(9, 10);
    expect(result).toEqual(expected);
  });
});
