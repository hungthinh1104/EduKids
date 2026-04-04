import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../../prisma/prisma.service";

interface JwtPayload {
  sub: number; // userId
  email: string;
  role: string;
  childId?: number; // For learner tokens
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    // [C-2 Security Fix] JWT_SECRET is validated at module load time in auth.module.ts.
    // By this point, process.env.JWT_SECRET is guaranteed to exist.
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  /**
   * Validate JWT payload and attach user to request
   * UC-00: Role-based access control
   */
  async validate(payload: JwtPayload) {
    // Verify user exists and is active
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid token or user inactive");
    }

    // Return user data attached to request.user
    return {
      sub: payload.sub,
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      childId: payload.childId, // Present only for learner tokens
    };
  }
}
