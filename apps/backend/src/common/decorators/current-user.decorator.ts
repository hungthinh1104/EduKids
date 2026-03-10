import { createParamDecorator, ExecutionContext } from "@nestjs/common";

interface JwtPayload {
  sub: number;
  userId?: number;
  childId?: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload | unknown => {
    const request = ctx.switchToHttp().getRequest();
    const user: JwtPayload | undefined = request.user;

    if (!data || !user) {
      return user;
    }

    if (typeof data === "string") {
      if (data === "id") {
        return user.userId ?? user.sub;
      }
      return user[data];
    }

    return user;
  },
);
