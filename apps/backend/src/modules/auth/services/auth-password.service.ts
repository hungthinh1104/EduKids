import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { createClient, RedisClientType } from "redis";
import { PrismaService } from "../../../prisma/prisma.service";
import { MailService } from "../../mail/mail.service";
import { MailTemplateService } from "../../mail/mail-template.service";
import { ForgotPasswordDto } from "../dto/forgot-password.dto";
import { ResetPasswordDto } from "../dto/reset-password.dto";
import { ChangePasswordDto } from "../dto/change-password.dto";

@Injectable()
export class AuthPasswordService {
  private readonly logger = new Logger(AuthPasswordService.name);
  private redisClient: RedisClientType | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly mailTemplateService: MailTemplateService,
  ) {}

  private async getRedisClient(): Promise<RedisClientType | null> {
    if (!process.env.REDIS_URL) return null;

    if (!this.redisClient) {
      this.redisClient = createClient({
        url: process.env.REDIS_URL,
      }) as RedisClientType;

      this.redisClient.on("error", (err) =>
        this.logger.error(
          "Password reset redis client error",
          err instanceof Error ? err.stack : String(err),
        ),
      );

      await this.redisClient.connect();
    }

    return this.redisClient;
  }

  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ message: string; resetToken?: string }> {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email, isActive: true },
      select: { id: true, email: true, firstName: true },
    });

    if (!existingUser) {
      return {
        message: "If this email is registered, a reset link has been sent.",
      };
    }

    const userId = existingUser.id;
    const userEmail = existingUser.email;
    const userFirstName = existingUser.firstName;
    const { randomBytes } = await import("crypto");
    const resetToken = randomBytes(32).toString("hex");

    const redis = await this.getRedisClient();
    if (redis) {
      await redis.set(`pwd_reset:${resetToken}`, userId.toString(), {
        EX: 15 * 60,
      });
    }

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "PASSWORD_RESET_REQUESTED",
        details: `Password reset requested`,
      },
    });

    const frontendUrl =
      process.env.FRONTEND_URL?.trim() ||
      (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");

    if (!frontendUrl) {
      throw new InternalServerErrorException(
        "FRONTEND_URL is required in production to build password reset links.",
      );
    }

    const resetUrl = `${frontendUrl.replace(/\/$/, "")}/reset-password?token=${resetToken}`;
    const emailTemplate = this.mailTemplateService.renderResetPasswordEmail({
      firstName: userFirstName,
      email: userEmail,
      resetUrl,
      expiresInMinutes: 15,
    });

    await this.mailService.sendMail({
      to: userEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    const response: { message: string; resetToken?: string } = {
      message: "If this email is registered, a reset link has been sent.",
    };

    if (process.env.NODE_ENV !== "production") {
      response.resetToken = resetToken;
    }

    return response;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const redis = await this.getRedisClient();
    if (!redis) {
      throw new BadRequestException(
        "Password reset service unavailable. Please try again later.",
      );
    }

    const rawUserIdStr = await redis.get(`pwd_reset:${dto.token}`);
    const userIdStr = typeof rawUserIdStr === "string" ? rawUserIdStr : null;
    if (!userIdStr) {
      throw new BadRequestException(
        "Invalid or expired reset link. Please request a new one.",
      );
    }

    const userId = parseInt(userIdStr, 10);
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        updatedAt: new Date(),
      },
    });

    await redis.del(`pwd_reset:${dto.token}`);
    await this.prisma.session.deleteMany({ where: { userId } });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "PASSWORD_RESET_COMPLETED",
        details: `Password reset completed`,
      },
    });

    return {
      message:
        "Password reset successfully. Please log in with your new password.",
    };
  }

  async changePassword(
    userId: number,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isActive: true },
      select: { passwordHash: true },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const isValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isValid) {
      throw new BadRequestException("Current password is incorrect");
    }

    const newHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        updatedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "PASSWORD_CHANGED",
        details: `User changed their password`,
      },
    });

    return { message: "Password changed successfully." };
  }
}
