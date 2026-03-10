import { SetMetadata } from "@nestjs/common";

export const THROTTLE_KEY = "throttle";

/**
 * Custom rate limit decorator for specific endpoints
 * @param limit - Number of requests allowed
 * @param ttl - Time window in seconds
 *
 * @example
 * @Throttle(5, 60) // 5 requests per 60 seconds
 * @Post('login')
 */
export const Throttle = (limit: number, ttl: number) =>
  SetMetadata(THROTTLE_KEY, { limit, ttl });

/**
 * Skip rate limiting for specific endpoints
 *
 * @example
 * @SkipThrottle()
 * @Get('health')
 */
export const SkipThrottle = () => SetMetadata("skipThrottle", true);
