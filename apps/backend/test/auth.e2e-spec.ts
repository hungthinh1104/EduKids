import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AuthController } from "../src/modules/auth/auth.controller";
import { AuthService } from "../src/modules/auth/auth.service";
import { ResponseInterceptor } from "../src/common/interceptors/response.interceptor";

describe("AuthController (e2e)", () => {
  let app: INestApplication;

  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
    forgotPassword: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it("POST /api/auth/register returns 201 with wrapped response on valid payload", async () => {
    const now = new Date().toISOString();
    authServiceMock.register.mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      role: "PARENT",
      user: {
        id: 1,
        email: "parent@example.com",
        firstName: "Parent",
        lastName: "User",
        isActive: true,
        isEmailVerified: true,
        createdAt: now,
      },
    });

    const payload = {
      email: "parent@example.com",
      password: "SecurePass123",
      firstName: "Parent",
      lastName: "User",
    };

    const res = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send(payload)
      .expect(201);

    expect(authServiceMock.register).toHaveBeenCalledWith(payload);
    expect(res.body).toMatchObject({
      statusCode: 201,
      message: "Created",
      data: {
        role: "PARENT",
        user: { email: "parent@example.com" },
      },
    });
  });

  it("POST /api/auth/register returns 400 when email is invalid", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({
        email: "invalid-email",
        password: "SecurePass123",
        firstName: "Parent",
        lastName: "User",
      })
      .expect(400);

    expect(authServiceMock.register).not.toHaveBeenCalled();
  });

  it("POST /api/auth/login returns 200 for valid payload", async () => {
    authServiceMock.login.mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      role: "PARENT",
      user: {
        id: 1,
        email: "parent@example.com",
        firstName: "Parent",
        lastName: "User",
      },
    });

    const payload = {
      email: "parent@example.com",
      password: "SecurePass123",
    };

    const res = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send(payload)
      .expect(200);

    expect(authServiceMock.login).toHaveBeenCalledWith(payload);
    expect(res.body).toMatchObject({
      statusCode: 200,
      message: "Success",
      data: {
        role: "PARENT",
      },
    });
  });

  it("POST /api/auth/forgot-password returns token-safe response contract", async () => {
    authServiceMock.forgotPassword.mockResolvedValue({
      message: "If this email is registered, a reset link has been sent.",
      resetToken: "test-reset-token",
    });

    const res = await request(app.getHttpServer())
      .post("/api/auth/forgot-password")
      .send({ email: "parent@example.com" })
      .expect(200);

    expect(authServiceMock.forgotPassword).toHaveBeenCalledWith({
      email: "parent@example.com",
    });
    expect(res.body).toMatchObject({
      statusCode: 200,
      message: "Success",
      data: {
        message: "If this email is registered, a reset link has been sent.",
      },
    });
  });
});
