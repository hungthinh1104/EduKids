import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { createClient, RedisClientType } from "redis";
import { PrismaService } from "../../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import {
  AuthResponseDto,
  SwitchProfileResponseDto,
} from "./dto/auth-response.dto";

// [C-4] Redis client for rate limiting — persistent across server restarts,
// works correctly with multiple instances (load balancer).
let redisClient: RedisClientType | null = null;
async function getRedisClient(): Promise<RedisClientType | null> {
  if (!process.env.REDIS_URL) return null;
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL,
    }) as RedisClientType;
    redisClient.on("error", (err) =>
      console.error("[Redis] Rate limit client error:", err),
    );
    await redisClient.connect();
  }
  return redisClient;
}

/** Login attempts before lockout */
const MAX_LOGIN_ATTEMPTS = 5;
/** Lockout duration in seconds */
const LOCKOUT_SECONDS = 5 * 60; // 5 minutes

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * UC-00: Register new parent account
   * Step 1-3 from Main Success Scenario
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Check if email already exists (raw SQL workaround for Prisma adapter issue on User model)
    const existingUsers = await this.prisma.$queryRawUnsafe<
      Array<{ id: number }>
    >('SELECT "id" FROM "User" WHERE "email" = $1 LIMIT 1', dto.email);

    if (existingUsers.length > 0) {
      throw new ConflictException("Email already exists");
    }

    // Hash password with bcrypt (salt rounds: 10)
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user with PARENT role (raw SQL workaround)
    const createdUsers = await this.prisma.$queryRawUnsafe<
      Array<{
        id: number;
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: string;
      }>
    >(
      'INSERT INTO "User" ("email", "passwordHash", "firstName", "lastName", "role", "isActive", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW()) RETURNING "id", "email", "firstName", "lastName", "role"',
      dto.email,
      passwordHash,
      dto.firstName,
      dto.lastName,
      "PARENT",
    );

    const user = createdUsers[0];

    // Issue JWT tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // [C-3] Store REFRESH token in session (not access token)
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Log audit (use user ID, not email, to avoid PII in logs)
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "USER_REGISTERED",
        details: `User registered (ID: ${user.id})`,
      },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      role: user.role,
      user: {
        id: user.id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * UC-00: Login with email/password
   * Exception: Rate limiting after 5 failed attempts
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    // [C-4] Check rate limiting via Redis
    await this.checkRateLimit(dto.email);

    // Find user by email (raw SQL workaround for Prisma adapter issue on User model)
    const users = await this.prisma.$queryRawUnsafe<
      Array<{
        id: number;
        email: string;
        passwordHash: string;
        firstName: string | null;
        lastName: string | null;
        role: string;
        isActive: boolean;
      }>
    >(
      'SELECT "id", "email", "passwordHash", "firstName", "lastName", "role", "isActive" FROM "User" WHERE "email" = $1 LIMIT 1',
      dto.email,
    );

    const user = users[0];

    if (!user) {
      await this.recordFailedAttempt(dto.email);
      throw new UnauthorizedException("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      await this.recordFailedAttempt(dto.email);
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ForbiddenException("Account is disabled");
    }

    // Reset login attempts on success
    await this.resetRateLimit(dto.email);

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // [C-3] Store REFRESH token in session, not access token
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Update last login (raw SQL workaround)
    await this.prisma.$executeRawUnsafe(
      'UPDATE "User" SET "lastLoginAt" = NOW(), "updatedAt" = NOW() WHERE "id" = $1',
      user.id,
    );

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "USER_LOGIN",
        details: `User logged in (ID: ${user.id})`,
      },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      role: user.role,
      user: {
        id: user.id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * UC-00: Switch to child profile (get learner token)
   * Step 3: Role-based redirect
   * Updates User.activeChildId for subsequent API calls
   */
  async switchProfile(
    parentId: number,
    childId: string,
  ): Promise<SwitchProfileResponseDto> {
    // Verify child belongs to parent
    const child = await this.prisma.childProfile.findFirst({
      where: {
        id: parseInt(childId),
        userId: parentId,
      },
    });

    if (!child) {
      throw new ForbiddenException("Not owner of this child profile");
    }

    // Update User.activeChildId in database
    await this.prisma.user.update({
      where: { id: parentId },
      data: { activeChildId: child.id },
    });

    // Generate learner token with childId
    const learnerToken = this.jwtService.sign({
      sub: parentId,
      childId: child.id,
      role: "LEARNER",
    });

    // Log profile switch
    await this.prisma.auditLog.create({
      data: {
        userId: parentId,
        action: "PROFILE_SWITCH",
        details: `Switched to child profile ID: ${child.id}`,
      },
    });

    return {
      learnerToken,
      child: {
        id: child.id.toString(),
        nickname: child.nickname,
        age: child.age,
      },
    };
  }

  /**
   * UC-00: Logout - Revoke refresh token and end session
   * Step 4: Token revoked, redirect to landing
   */
  async logout(userId: number, token: string): Promise<{ message: string }> {
    // Delete session by refresh token if passed, else expire all user sessions
    await this.prisma.session.deleteMany({
      where: {
        userId,
        token,
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "USER_LOGOUT",
        details: "User logged out",
      },
    });

    return { message: "Logged out successfully" };
  }

  /**
   * [C-3 Security Fix] Refresh access token using refresh token
   * Validates the refresh token exists in the DB session — prevents use after logout.
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    let payload: { sub: number; email: string; role: string };
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException("Session expired, please log in again");
    }

    // [C-3] Verify refresh token is still in the DB (not logged out)
    const session = await this.prisma.session.findFirst({
      where: {
        userId: payload.sub,
        token: refreshToken,
      },
    });

    if (!session) {
      throw new UnauthorizedException(
        "Session has been revoked. Please log in again.",
      );
    }

    if (session.expiresAt < new Date()) {
      // Clean up expired session
      await this.prisma.session.delete({ where: { id: session.id } });
      throw new UnauthorizedException("Session expired, please log in again");
    }

    const newAccessToken = this.jwtService.sign(
      {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      },
      { expiresIn: "15m" },
    );

    return { accessToken: newAccessToken };
  }

  /**
   * Get current user info
   */
  async getCurrentUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return user;
  }

  /**
   * OAuth placeholder (Google/Facebook)
   * TODO: Implement OAuth 2.0 flow
   */
  async loginWithOAuth(_provider: "google" | "facebook", _code: string) {
    // TODO: Exchange code for OAuth token
    // TODO: Get user profile from provider
    // TODO: Create or find user in database
    // TODO: Issue JWT tokens
    throw new BadRequestException("OAuth not implemented yet");
  }

  // === Private Helper Methods ===

  /**
   * Generate JWT access and refresh tokens
   */
  private async generateTokens(
    userId: number,
    email: string,
    role: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: "15m",
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: "7d",
    });

    return { accessToken, refreshToken };
  }

  /**
   * [C-4 Security Fix] Rate limiting via Redis.
   * Checks if the email is locked out.
   */
  private async checkRateLimit(email: string): Promise<void> {
    const redis = await getRedisClient();

    if (!redis) {
      // Redis unavailable — fail open with a warning (in-memory fallback removed intentionally)
      console.warn(
        "[Security] Redis unavailable — login rate limiting bypassed for:",
        email,
      );
      return;
    }

    const key = `login_attempts:${email}`;
    const attemptsStr = await redis.get(key);
    if (!attemptsStr) return;

    const attempts = parseInt(attemptsStr as string, 10);
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      const ttl = await redis.ttl(key);
      const minutesLeft = Math.ceil(ttl / 60);
      throw new ForbiddenException(
        `Account temporarily locked. Try again in ${minutesLeft} minute(s).`,
      );
    }
  }

  /**
   * [C-4 Security Fix] Record a failed login attempt in Redis.
   */
  private async recordFailedAttempt(email: string): Promise<void> {
    const redis = await getRedisClient();
    if (!redis) return;

    const key = `login_attempts:${email}`;
    const current = await redis.incr(key);
    if (current === 1) {
      // Set expiry only on first attempt (so it resets after LOCKOUT_SECONDS)
      await redis.expire(key, LOCKOUT_SECONDS);
    }
  }

  /**
   * [C-4 Security Fix] Clear rate limit counter after successful login.
   */
  private async resetRateLimit(email: string): Promise<void> {
    const redis = await getRedisClient();
    if (!redis) return;
    await redis.del(`login_attempts:${email}`);
  }
}
