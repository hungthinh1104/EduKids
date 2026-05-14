import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new WsException("Unauthorized: missing token");
    }

    try {
      const secret = this.configService.get<string>("JWT_SECRET");
      const payload = this.jwtService.verify(token, { secret });
      client.data.user = payload;
      client.data.userId = String(payload.sub ?? payload.userId ?? payload.id);
      return true;
    } catch {
      this.logger.warn("WsJwtGuard: invalid token");
      throw new WsException("Unauthorized: invalid token");
    }
  }
}
