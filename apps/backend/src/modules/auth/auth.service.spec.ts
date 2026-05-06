import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ConflictException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ChildProfileService } from "../child-profile/child-profile.service";
import { RegisterDto } from "./dto/register.dto";
import { AuthRateLimitService } from "./services/auth-rate-limit.service";
import { AuthTokenService } from "./services/auth-token.service";
import { AuthPasswordService } from "./services/auth-password.service";
import { RedisAnalyticsService } from "../admin-analytics/service/redis-analytics.service";

describe("AuthService - register", () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn() as jest.MockedFunction<any>,
      findFirst: jest.fn() as jest.MockedFunction<any>,
      create: jest.fn() as jest.MockedFunction<any>,
      update: jest.fn() as jest.MockedFunction<any>,
    },
    session: { create: jest.fn() as jest.MockedFunction<any> },
    auditLog: { create: jest.fn() as jest.MockedFunction<any> },
  };

  const childProfileServiceMock = {
    switchProfile: jest.fn() as jest.Mock,
  };

  const authRateLimitServiceMock = {
    checkRateLimit: jest.fn() as jest.Mock,
    recordFailedAttempt: jest.fn() as jest.Mock,
    resetRateLimit: jest.fn() as jest.Mock,
  };

  const authTokenServiceMock = {
    generateTokens: jest.fn() as jest.Mock,
    createRefreshSession: jest.fn() as jest.Mock,
    refreshAccessToken: jest.fn() as jest.Mock,
  };

  const authPasswordServiceMock = {
    forgotPassword: jest.fn() as jest.Mock,
    resetPassword: jest.fn() as jest.Mock,
    changePassword: jest.fn() as jest.Mock,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ChildProfileService, useValue: childProfileServiceMock },
        { provide: AuthRateLimitService, useValue: authRateLimitServiceMock },
        { provide: AuthTokenService, useValue: authTokenServiceMock },
        { provide: AuthPasswordService, useValue: authPasswordServiceMock },
        { provide: RedisAnalyticsService, useValue: { trackUserLogin: jest.fn(), trackUserRegistration: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("throws ConflictException when email already exists", async () => {
    const dto: RegisterDto = {
      email: "parent@example.com",
      password: "SecurePass123",
      firstName: "John",
      lastName: "Doe",
    };

    // findUnique returns existing user → should throw ConflictException
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 1 });

    await expect(service.register(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);
    expect(prismaMock.session.create).not.toHaveBeenCalled();
  });

  it("registers successfully and returns auth payload", async () => {
    const dto: RegisterDto = {
      email: "new-parent@example.com",
      password: "SecurePass123",
      firstName: "Alice",
      lastName: "Nguyen",
    };

    const createdUser = {
      id: 42,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: "PARENT",
      isActive: true,
      createdAt: new Date("2026-03-22T00:00:00.000Z"),
    };

    // findUnique returns null → no duplicate
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    // create returns the new user
    prismaMock.user.create.mockResolvedValueOnce(createdUser);

    authTokenServiceMock.generateTokens.mockReturnValue({
      accessToken: "access-token-123",
      refreshToken: "refresh-token-123",
    });
    authTokenServiceMock.createRefreshSession.mockImplementation(
      async () => undefined,
    );
    prismaMock.auditLog.create.mockResolvedValue({ id: 200 });

    const result = await service.register(dto);

    expect(result).toEqual({
      accessToken: "access-token-123",
      refreshToken: "refresh-token-123",
      role: "PARENT",
      user: {
        id: 42,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        isActive: true,
        isEmailVerified: false,
        createdAt: new Date("2026-03-22T00:00:00.000Z"),
      },
    });

    expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);
    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: dto.email,
          role: "PARENT",
        }),
      }),
    );
    expect(authTokenServiceMock.createRefreshSession).toHaveBeenCalledWith(
      42,
      "refresh-token-123",
    );
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 42,
          action: "USER_REGISTERED",
        }),
      }),
    );
  });

  it("delegates switchProfile to ChildProfileService", async () => {
    const expected = {
      success: true,
      message: "Switched to Anna's profile! 👋",
      profile: {
        id: 2,
        nickname: "Anna",
        age: 8,
        avatar: "",
        totalPoints: 0,
        currentLevel: 1,
        badgesEarned: 0,
        streakDays: 0,
        isActive: true,
        createdAt: new Date("2026-03-22T00:00:00.000Z"),
        lastActivityAt: new Date("2026-03-22T00:00:00.000Z"),
      },
      accessToken: "access-token",
      refreshToken: "refresh-token",
    };

    childProfileServiceMock.switchProfile.mockImplementation(
      async () => expected,
    );

    const result = await service.switchProfile(1, 2);

    expect(childProfileServiceMock.switchProfile).toHaveBeenCalledWith(1, 2);
    expect(result).toEqual(expected);
  });
});
