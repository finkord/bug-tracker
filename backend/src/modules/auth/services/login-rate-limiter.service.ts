import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service.js';

export interface LockoutStatus {
  isLocked: boolean;
  remainingSeconds: number;
}

export interface FailedAttemptResult {
  isLocked: boolean;
  attempts: number;
  remainingSeconds: number;
}

/**
 * Distributed sliding window rate limiter for login brute-force protection.
 *
 * Prevents PostgreSQL database row lock contention by managing attempt counters
 * and lockout timers entirely in Redis.
 */
@Injectable()
export class LoginRateLimiterService {
  private readonly logger = new Logger(LoginRateLimiterService.name);

  static readonly MAX_ATTEMPTS = 5;
  static readonly LOCKOUT_SECONDS = 900; // 15 minutes
  static readonly WINDOW_SECONDS = 900; // 15 minutes
  static readonly ATTEMPTS_PREFIX = 'auth:attempts:';
  static readonly LOCKOUT_PREFIX = 'auth:lockout:';

  constructor(private readonly redisService: RedisService) {}

  private normalizeIdentifier(identifier: string): string {
    return identifier.toLowerCase().trim();
  }

  /**
   * Checks whether the user identifier (email) is currently locked out in Redis.
   */
  async isLocked(identifier: string): Promise<LockoutStatus> {
    const key = `${LoginRateLimiterService.LOCKOUT_PREFIX}${this.normalizeIdentifier(identifier)}`;
    const value = await this.redisService.get(key);

    if (!value) {
      return { isLocked: false, remainingSeconds: 0 };
    }

    const ttl = await this.redisService.ttl(key);
    return {
      isLocked: true,
      remainingSeconds: ttl > 0 ? ttl : LoginRateLimiterService.LOCKOUT_SECONDS,
    };
  }

  /**
   * Records a failed login attempt in Redis using atomic operations.
   * If failed attempts reach the threshold, locks the identifier for LOCKOUT_SECONDS.
   */
  async recordFailedAttempt(identifier: string): Promise<FailedAttemptResult> {
    const normalized = this.normalizeIdentifier(identifier);
    const attemptsKey = `${LoginRateLimiterService.ATTEMPTS_PREFIX}${normalized}`;
    const lockoutKey = `${LoginRateLimiterService.LOCKOUT_PREFIX}${normalized}`;

    const attempts = await this.redisService.incr(attemptsKey);

    if (attempts === 1) {
      await this.redisService.expire(attemptsKey, LoginRateLimiterService.WINDOW_SECONDS);
    }

    if (attempts >= LoginRateLimiterService.MAX_ATTEMPTS) {
      await this.redisService.set(
        lockoutKey,
        '1',
        LoginRateLimiterService.LOCKOUT_SECONDS,
      );
      await this.redisService.del(attemptsKey);

      this.logger.warn(
        `Account locked for ${normalized} due to ${attempts} failed attempts for ${LoginRateLimiterService.LOCKOUT_SECONDS}s`,
      );

      return {
        isLocked: true,
        attempts,
        remainingSeconds: LoginRateLimiterService.LOCKOUT_SECONDS,
      };
    }

    return {
      isLocked: false,
      attempts,
      remainingSeconds: 0,
    };
  }

  /**
   * Resets both failed attempt counters and lockout records in Redis upon successful login or admin unlock.
   */
  async resetAttempts(identifier: string): Promise<void> {
    const normalized = this.normalizeIdentifier(identifier);
    const attemptsKey = `${LoginRateLimiterService.ATTEMPTS_PREFIX}${normalized}`;
    const lockoutKey = `${LoginRateLimiterService.LOCKOUT_PREFIX}${normalized}`;

    await this.redisService.del(attemptsKey, lockoutKey);
  }
}
