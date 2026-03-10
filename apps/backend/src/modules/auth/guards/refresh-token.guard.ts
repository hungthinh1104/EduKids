import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    // TODO: Validate refresh token
    return true;
  }
}
