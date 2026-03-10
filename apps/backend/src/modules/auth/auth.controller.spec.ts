import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

describe("AuthController", () => {
  let controller: AuthController;

  const authServiceMock = {
    register: jest.fn() as jest.Mock,
    login: jest.fn() as jest.Mock,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it("register delegates to AuthService.register", async () => {
    const dto: RegisterDto = {
      email: "parent@example.com",
      password: "SecurePass123",
      firstName: "John",
      lastName: "Doe",
    };

    const expected = {
      accessToken: "a",
      refreshToken: "r",
      role: "PARENT",
      user: {
        id: "1",
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    };

    authServiceMock.register.mockImplementation(async () => expected);

    const result = await controller.register(dto);

    expect(authServiceMock.register).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it("login delegates to AuthService.login", async () => {
    const dto: LoginDto = {
      email: "parent@example.com",
      password: "SecurePass123",
    };

    const expected = {
      accessToken: "a",
      refreshToken: "r",
      role: "PARENT",
      user: {
        id: "1",
        email: dto.email,
        firstName: "John",
        lastName: "Doe",
      },
    };

    authServiceMock.login.mockImplementation(async () => expected);

    const result = await controller.login(dto);

    expect(authServiceMock.login).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });
});
