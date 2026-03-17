import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { PrismaService } from "../../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { MailTemplateService } from "../mail/mail-template.service";
import { RegisterDto } from "./dto/register.dto";

describe("AuthService - register", () => {
  let service: AuthService;

  const prismaMock = {
    $queryRaw: jest.fn() as jest.Mock,
    session: { create: jest.fn() as jest.Mock },
    auditLog: { create: jest.fn() as jest.Mock },
  };

  const jwtServiceMock = {
    sign: jest.fn() as jest.Mock,
  };

  const mailServiceMock = {
    sendMail: jest.fn() as jest.Mock,
  };

  const mailTemplateServiceMock = {
    renderResetPasswordEmail: jest.fn() as jest.Mock,
    renderWeeklyProgressReportEmail: jest.fn() as jest.Mock,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: MailService, useValue: mailServiceMock },
        { provide: MailTemplateService, useValue: mailTemplateServiceMock },
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

    prismaMock.$queryRaw.mockImplementationOnce(async () => [{ id: 1 }]);

    await expect(service.register(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
    expect(prismaMock.session.create).not.toHaveBeenCalled();
  });

  it("registers successfully and returns auth payload", async () => {
    const dto: RegisterDto = {
      email: "new-parent@example.com",
      password: "SecurePass123",
      firstName: "Alice",
      lastName: "Nguyen",
    };

    prismaMock.$queryRaw
      .mockImplementationOnce(async () => [])
      .mockImplementationOnce(async () => [
        {
          id: 42,
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: "PARENT",
        },
      ]);

    jwtServiceMock.sign
      .mockReturnValueOnce("access-token-123")
      .mockReturnValueOnce("refresh-token-123");

    prismaMock.session.create.mockImplementation(async () => ({ id: 100 }));
    prismaMock.auditLog.create.mockImplementation(async () => ({ id: 200 }));

    const result = await service.register(dto);

    expect(result).toEqual({
      accessToken: "access-token-123",
      refreshToken: "refresh-token-123",
      role: "PARENT",
      user: {
        id: "42",
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(2);

    const secondCallArgs = prismaMock.$queryRaw.mock.calls[1];
    expect(secondCallArgs[1]).toBe(dto.email);
    expect(secondCallArgs[2]).not.toBe(dto.password);
    expect(secondCallArgs[5]).toBe("PARENT");

    expect(prismaMock.session.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 42,
          token: "refresh-token-123",
        }),
      }),
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
});
