import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

@Injectable()
export class AccessTokenGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    // TODO: Validate access token
    return true;
  }
}
