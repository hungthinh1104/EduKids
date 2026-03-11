import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

/**
 * Validates the refresh token sent via the Authorization header
 * (Bearer) or the `refresh_token` cookie.
 */
@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    // Try Authorization header first, then cookie
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    } else if (req.cookies?.refresh_token) {
      token = req.cookies.refresh_token as string;
    }

    if (!token) {
      throw new UnauthorizedException("Missing refresh token");
    }

    try {
      const payload = this.jwtService.verify(token);
      req["user"] = payload;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }
}
