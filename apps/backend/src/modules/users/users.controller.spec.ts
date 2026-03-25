import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

describe("UsersController", () => {
  let controller: UsersController;

  const usersServiceMock = {
    getAdminUsers: jest.fn() as jest.Mock,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersServiceMock }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it("returns admin users with meta total", async () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
    (usersServiceMock.getAdminUsers as any).mockResolvedValue(items);

    const result = await controller.getAdminUsers();

    expect(usersServiceMock.getAdminUsers).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      data: items,
      meta: {
        total: 3,
      },
    });
  });

  it("returns total zero when empty list", async () => {
    (usersServiceMock.getAdminUsers as any).mockResolvedValue([]);

    const result = await controller.getAdminUsers();

    expect(result.meta.total).toBe(0);
    expect(result.data).toEqual([]);
  });
});
