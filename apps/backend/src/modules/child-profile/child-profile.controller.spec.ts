import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { NotFoundException } from "@nestjs/common";
import { ChildProfileController } from "./child-profile.controller";
import { ChildProfileService } from "./child-profile.service";

describe("ChildProfileController", () => {
  let controller: ChildProfileController;

  const childProfileServiceMock = {
    createProfile: jest.fn() as jest.Mock,
    getAllProfiles: jest.fn() as jest.Mock,
    getProfileById: jest.fn() as jest.Mock,
    updateProfile: jest.fn() as jest.Mock,
    deleteProfile: jest.fn() as jest.Mock,
    switchProfile: jest.fn() as jest.Mock,
    setActiveProfile: jest.fn() as jest.Mock,
    getActiveProfile: jest.fn() as jest.Mock,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChildProfileController],
      providers: [
        { provide: ChildProfileService, useValue: childProfileServiceMock },
      ],
    }).compile();

    controller = module.get<ChildProfileController>(ChildProfileController);
  });

  it("createProfile delegates with parentId from req.user", async () => {
    const dto = { nickname: "Anna", age: 7 };
    const expected = { success: true };
    (childProfileServiceMock.createProfile as any).mockResolvedValue(expected);

    const result = await controller.createProfile(dto as any, {
      user: { userId: 12, role: "PARENT" },
    } as any);

    expect(childProfileServiceMock.createProfile).toHaveBeenCalledWith(12, dto);
    expect(result).toEqual(expected);
  });

  it("getAllProfiles delegates with parentId", async () => {
    const expected = { items: [{ id: 1 }] };
    (childProfileServiceMock.getAllProfiles as any).mockResolvedValue(expected);

    const result = await controller.getAllProfiles({
      user: { userId: 77, role: "PARENT" },
    } as any);

    expect(childProfileServiceMock.getAllProfiles).toHaveBeenCalledWith(77);
    expect(result).toEqual(expected);
  });

  it("switchProfile delegates with parentId and childId", async () => {
    const expected = { success: true };
    (childProfileServiceMock.switchProfile as any).mockResolvedValue(expected);

    const result = await controller.switchProfile(
      { childId: 5 } as any,
      { user: { userId: 7, role: "PARENT" } } as any,
    );

    expect(childProfileServiceMock.switchProfile).toHaveBeenCalledWith(7, 5);
    expect(result).toEqual(expected);
  });

  it("getActiveProfile for LEARNER uses childId path", async () => {
    const expected = { id: 10, nickname: "Kid" };
    (childProfileServiceMock.getProfileById as any).mockResolvedValue(expected);

    const result = await controller.getActiveProfile({
      user: { userId: 20, role: "LEARNER", childId: 10 },
    } as any);

    expect(childProfileServiceMock.getProfileById).toHaveBeenCalledWith(10, 20);
    expect(result).toEqual(expected);
  });

  it("getActiveProfile for PARENT uses getActiveProfile service", async () => {
    const expected = { id: 11, nickname: "Tom" };
    (childProfileServiceMock.getActiveProfile as any).mockResolvedValue(expected);

    const result = await controller.getActiveProfile({
      user: { userId: 30, role: "PARENT" },
    } as any);

    expect(childProfileServiceMock.getActiveProfile).toHaveBeenCalledWith(30);
    expect(result).toEqual(expected);
  });

  it("getActiveProfile throws NotFoundException when no active profile", async () => {
    (childProfileServiceMock.getActiveProfile as any).mockResolvedValue(null);

    await expect(
      controller.getActiveProfile({ user: { userId: 44, role: "PARENT" } } as any),
    ).rejects.toThrow(NotFoundException);
  });
});
