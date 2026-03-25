import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { BadRequestException } from "@nestjs/common";
import { AvatarCustomizationController } from "./avatar-customization.controller";
import { AvatarCustomizationService } from "../service/avatar-customization.service";

describe("AvatarCustomizationController", () => {
  let controller: AvatarCustomizationController;

  const avatarServiceMock = {
    applyItem: jest.fn() as jest.Mock,
    removeItem: jest.fn() as jest.Mock,
    getAvatarConfig: jest.fn() as jest.Mock,
    getAvatarPreview: jest.fn() as jest.Mock,
    getOwnedItems: jest.fn() as jest.Mock,
    getAvailableItems: jest.fn() as jest.Mock,
    resetAvatar: jest.fn() as jest.Mock,
    getActivityHistory: jest.fn() as jest.Mock,
    getStatistics: jest.fn() as jest.Mock,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvatarCustomizationController],
      providers: [
        { provide: AvatarCustomizationService, useValue: avatarServiceMock },
      ],
    }).compile();

    controller = module.get<AvatarCustomizationController>(AvatarCustomizationController);
  });

  it("applyItem throws BadRequestException when childId missing", async () => {
    await expect(
      controller.applyItem({ user: {} } as any, { itemId: 1 } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it("applyItem delegates and wraps response", async () => {
    const config = { hairItemId: 10 };
    (avatarServiceMock.applyItem as any).mockResolvedValue(config);

    const result = await controller.applyItem(
      { user: { childId: 7 } } as any,
      { itemId: 10, layer: "HAIR" } as any,
    );

    expect(avatarServiceMock.applyItem).toHaveBeenCalledWith(7, {
      itemId: 10,
      layer: "HAIR",
    });
    expect(result).toEqual(
      expect.objectContaining({ childId: 7, success: true, avatarConfig: config }),
    );
  });

  it("removeItem delegates and wraps response", async () => {
    const config = { hairItemId: null };
    (avatarServiceMock.removeItem as any).mockResolvedValue(config);

    const result = await controller.removeItem(
      { user: { childId: 7 } } as any,
      "HAIR" as any,
    );

    expect(avatarServiceMock.removeItem).toHaveBeenCalledWith(7, "HAIR");
    expect(result.success).toBe(true);
  });

  it("getAvailableItems delegates layer filter", async () => {
    const expected = { items: [] };
    (avatarServiceMock.getAvailableItems as any).mockResolvedValue(expected);

    const result = await controller.getAvailableItems("HAT" as any);

    expect(avatarServiceMock.getAvailableItems).toHaveBeenCalledWith("HAT");
    expect(result).toEqual(expected);
  });

  it("getHistory uses default limit 20", async () => {
    const expected = [{ id: 1 }];
    (avatarServiceMock.getActivityHistory as any).mockResolvedValue(expected);

    const result = await controller.getHistory({ user: { childId: 9 } } as any, undefined);

    expect(avatarServiceMock.getActivityHistory).toHaveBeenCalledWith(9, 20);
    expect(result).toEqual(expected);
  });
});
