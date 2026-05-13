import type { Request } from "express";

export interface JwtUser {
  sub: number;
  userId?: number;
  childId?: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/** Express request with authenticated user attached by JwtStrategy */
export type RequestWithUser = Request & { user: JwtUser };
