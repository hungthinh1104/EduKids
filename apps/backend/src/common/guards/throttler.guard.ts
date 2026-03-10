import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

type TrackerRequest = {
  user?: {
    userId?: string | number;
    sub?: string | number;
    id?: string | number;
  };
  ip?: string;
};

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  // Override to customize rate limiting behavior per endpoint
  protected async getTracker(req: TrackerRequest): Promise<string> {
    // Track by IP + User ID (if authenticated)
    const userId = req.user?.userId ?? req.user?.sub ?? req.user?.id;
    const ip = req.ip ?? "unknown-ip";
    return userId ? `${userId}-${ip}` : ip;
  }
}
