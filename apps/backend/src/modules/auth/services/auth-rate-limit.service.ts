import { ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { createClient, RedisClientType } from "redis";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 5 * 60;

@Injectable()
export class AuthRateLimitService {
  private readonly logger = new Logger(AuthRateLimitService.name);
  private redisClient: RedisClientType | null = null;
  private readonly localLoginAttemptStore = new Map<
    string,
    { count: number; expiresAt: number }
  >();

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async getRedisClient(): Promise<RedisClientType | null> {
    if (!process.env.REDIS_URL) return null;

    if (!this.redisClient) {
      this.redisClient = createClient({
        url: process.env.REDIS_URL,
      }) as RedisClientType;
      this.redisClient.on("error", (err) =>
        this.logger.error(
          "Rate limit client error",
          err instanceof Error ? err.stack : String(err),
        ),
      );
      await this.redisClient.connect();
    }

    return this.redisClient;
  }

  private getLocalAttempts(
    email: string,
  ): { count: number; expiresAt: number } | null {
    const key = this.normalizeEmail(email);
    const entry = this.localLoginAttemptStore.get(key);
    if (!entry) return null;

    if (entry.expiresAt <= Date.now()) {
      this.localLoginAttemptStore.delete(key);
      return null;
    }

    return entry;
  }

  private recordLocalFailedAttempt(email: string): void {
    const key = this.normalizeEmail(email);
    const current = this.getLocalAttempts(key);

    if (!current) {
      this.localLoginAttemptStore.set(key, {
        count: 1,
        expiresAt: Date.now() + LOCKOUT_SECONDS * 1000,
      });
      return;
    }

    this.localLoginAttemptStore.set(key, {
      count: current.count + 1,
      expiresAt: current.expiresAt,
    });
  }

  private resetLocalFailedAttempts(email: string): void {
    this.localLoginAttemptStore.delete(this.normalizeEmail(email));
  }

  async checkRateLimit(email: string): Promise<void> {
    const normalizedEmail = this.normalizeEmail(email);
    const redis = await this.getRedisClient();

    if (!redis) {
      const localEntry = this.getLocalAttempts(normalizedEmail);
      if (!localEntry) return;

      if (localEntry.count >= MAX_LOGIN_ATTEMPTS) {
        const minutesLeft = Math.ceil(
          (localEntry.expiresAt - Date.now()) / 60000,
        );
        throw new ForbiddenException(
          `Account temporarily locked. Try again in ${Math.max(1, minutesLeft)} minute(s).`,
        );
      }
      return;
    }

    const key = `login_attempts:${normalizedEmail}`;
    const attemptsStr = await redis.get(key);
    if (!attemptsStr) return;

    const attempts = parseInt(attemptsStr as string, 10);
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      const ttl = await redis.ttl(key);
      const minutesLeft = Math.ceil(ttl / 60);
      throw new ForbiddenException(
        `Account temporarily locked. Try again in ${minutesLeft} minute(s).`,
      );
    }
  }

  async recordFailedAttempt(email: string): Promise<void> {
    const normalizedEmail = this.normalizeEmail(email);
    const redis = await this.getRedisClient();

    if (!redis) {
      this.recordLocalFailedAttempt(normalizedEmail);
      return;
    }

    const key = `login_attempts:${normalizedEmail}`;
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, LOCKOUT_SECONDS);
    }
  }

  async resetRateLimit(email: string): Promise<void> {
    const normalizedEmail = this.normalizeEmail(email);
    this.resetLocalFailedAttempts(normalizedEmail);

    const redis = await this.getRedisClient();
    if (!redis) return;

    await redis.del(`login_attempts:${normalizedEmail}`);
  }
}
