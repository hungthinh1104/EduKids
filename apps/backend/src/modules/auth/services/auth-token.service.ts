import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  generateTokens(
    userId: number,
    email: string,
    role: string,
  ): {
    accessToken: string;
    refreshToken: string;
  } {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: "15m",
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: "7d",
    });

    return { accessToken, refreshToken };
  }

  async createRefreshSession(
    userId: number,
    refreshToken: string,
  ): Promise<void> {
    await this.prisma.session.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    let payload: { sub: number; email: string; role: string };
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException("Session expired, please log in again");
    }

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
      await this.prisma.session.delete({ where: { id: session.id } });
      throw new UnauthorizedException("Session expired, please log in again");
    }

    const accessToken = this.jwtService.sign(
      {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      },
      { expiresIn: "15m" },
    );

    return { accessToken };
  }
}
