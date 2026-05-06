import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../../prisma/prisma.service";
import { ChildProfileService } from "../child-profile/child-profile.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { AuthResponseDto } from "./dto/auth-response.dto";
import { ProfileActionResultDto } from "../child-profile/child-profile.dto";
import { AuthRateLimitService } from "./services/auth-rate-limit.service";
import { AuthTokenService } from "./services/auth-token.service";
import { AuthPasswordService } from "./services/auth-password.service";
import { RedisAnalyticsService } from "../admin-analytics/service/redis-analytics.service";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private childProfileService: ChildProfileService,
    private authRateLimitService: AuthRateLimitService,
    private authTokenService: AuthTokenService,
    private authPasswordService: AuthPasswordService,
    private redisAnalytics: RedisAnalyticsService,
  ) {}

  /**
   * UC-00: Register new parent account
   * Step 1-3 from Main Success Scenario
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException("Email already exists");
    }

    // Hash password with bcrypt (salt rounds: 10)
    const passwordHash = await bcrypt.hash(dto.password, 12);

    let user;

    try {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: "PARENT",
          isActive: true,
        },
      });
    } catch (error: any) {
      const code = error?.code ? String(error.code) : "";

      // Prisma unique_violation or PostgreSQL unique_violation
      if (code === "P2002" || code === "23505") {
        throw new ConflictException("Email already exists");
      }

      throw error;
    }

    if (!user) {
      throw new InternalServerErrorException("Failed to register user");
    }

    // Issue JWT tokens
    const tokens = this.authTokenService.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    // [C-3] Store REFRESH token in session (not access token)
    await this.authTokenService.createRefreshSession(
      user.id,
      tokens.refreshToken,
    );

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
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        isEmailVerified: false,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * UC-00: Login with email/password
   * Exception: Rate limiting after 5 failed attempts
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    // [C-4] Check rate limiting via Redis
    await this.authRateLimitService.checkRateLimit(dto.email);

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    if (!user) {
      await this.authRateLimitService.recordFailedAttempt(dto.email);
      throw new UnauthorizedException("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      await this.authRateLimitService.recordFailedAttempt(dto.email);
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ForbiddenException("Account is disabled");
    }

    // Reset login attempts on success
    await this.authRateLimitService.resetRateLimit(dto.email);

    // Generate tokens
    const tokens = this.authTokenService.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    // [C-3] Store REFRESH token in session, not access token
    await this.authTokenService.createRefreshSession(
      user.id,
      tokens.refreshToken,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "USER_LOGIN",
        details: `User logged in (ID: ${user.id})`,
      },
    });

    void this.redisAnalytics.trackSessionStart(String(user.id), tokens.accessToken).catch(() => {});

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      role: user.role,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        isEmailVerified: false,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * UC-00: Switch to child profile
   * Step 3: Role-based redirect
   * Delegates active profile handling to ChildProfileService
   */
  async switchProfile(
    parentId: number,
    childId: number,
  ): Promise<ProfileActionResultDto> {
    return this.childProfileService.switchProfile(parentId, childId);
  }

  /**
   * UC-00: Logout - Revoke refresh token and end session
   * Step 4: Token revoked, redirect to landing
   */
  async logout(userId: number, token: string): Promise<{ message: string }> {
    // Try revoking a single session by token first (when client sends refresh token).
    // If nothing was revoked (e.g. client sent access token), revoke all sessions for safety.
    const revokedByToken = token
      ? await this.prisma.session.deleteMany({
          where: {
            userId,
            token,
          },
        })
      : { count: 0 };

    if (revokedByToken.count === 0) {
      await this.prisma.session.deleteMany({
        where: { userId },
      });
    }

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "USER_LOGOUT",
        details: "User logged out",
      },
    });

    void this.redisAnalytics.trackSessionEnd(token).catch(() => {});

    return { message: "Logged out successfully" };
  }

  /**
   * Exit child mode and issue parent/admin tokens again
   */
  async exitChildMode(userId: number): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("User not found or inactive");
    }

    const tokens = this.authTokenService.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    await this.authTokenService.createRefreshSession(
      user.id,
      tokens.refreshToken,
    );

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "EXIT_CHILD_MODE",
        details: `Exited child mode and restored ${user.role} token`,
      },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      role: user.role,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        isEmailVerified: false,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * UC-00: Forgot password — generate reset token, store in Redis 15 min
   * Sends reset email when SMTP is configured
   */
  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ message: string; resetToken?: string }> {
    return this.authPasswordService.forgotPassword(dto);
  }

  /**
   * UC-00: Reset password using Redis-backed token
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authPasswordService.resetPassword(dto);
  }

  /**
   * UC-00: Change password (authenticated — requires current password)
   */
  async changePassword(
    userId: number,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authPasswordService.changePassword(userId, dto);
  }

  /**
   * Update current user's display name (firstName / lastName)
   */
  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<{ message: string }> {
    const data: { firstName?: string; lastName?: string } = {};

    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;

    if (Object.keys(data).length === 0) {
      return { message: "No changes provided." };
    }

    await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return { message: "Profile updated successfully." };
  }

  /**
   * [C-3 Security Fix] Refresh access token using refresh token
   * Validates the refresh token exists in the DB session — prevents use after logout.
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    return this.authTokenService.refreshAccessToken(refreshToken);
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
        isActive: true,
        createdAt: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("User not found");
    }

    return user;
  }

  /**
   * Handle Google OAuth: tìm hoặc tạo user trong DB, trả JWT + refresh token
   */
  async handleGoogleOAuth(googleUser: {
    providerId: string;
    email: string;
    displayName: string;
    photo?: string;
    provider: string;
  }): Promise<AuthResponseDto> {
    const { email, displayName } = googleUser;

    // Tách displayName thành firstName / lastName
    const nameParts = (displayName ?? "").split(" ");
    const firstName = nameParts[0] ?? null;
    const lastName = nameParts.slice(1).join(" ") || null;

    // Tìm user theo email
    const user = await this.prisma.user.upsert({
      where: { email },
      update: {
        firstName: firstName ?? undefined,
        lastName: lastName ?? undefined,
      },
      create: {
        email,
        passwordHash: "__GOOGLE_OAUTH__",
        firstName,
        lastName,
        role: "PARENT",
        isActive: true,
        isEmailVerified: true,
      },
    });

    if (!user.isActive) {
      throw new ForbiddenException("Account is disabled");
    }

    const tokens = this.authTokenService.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    // Lưu refresh token vào session
    await this.authTokenService.createRefreshSession(
      user.id,
      tokens.refreshToken,
    );

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "USER_LOGIN",
        details: `User logged in via Google OAuth (ID: ${user.id})`,
      },
    });

    void this.redisAnalytics.trackSessionStart(String(user.id), tokens.accessToken).catch(() => {});

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      role: user.role,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        isEmailVerified: true,
        createdAt: user.createdAt,
      },
    };
  }

  async loginWithOAuth(_provider: "facebook", _code: string) {
    throw new BadRequestException("Facebook OAuth not implemented yet");
  }
}
