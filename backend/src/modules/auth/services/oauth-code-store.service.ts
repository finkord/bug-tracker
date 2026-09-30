import { Injectable, Logger } from '@nestjs/common';
import crypto from 'node:crypto';
import type { AuthTokens } from './token-session.service.js';
import { RedisService } from '../../redis/redis.service.js';

/**
 * Distributed Redis store for short-lived, single-use OAuth exchange codes.
 *
 * Flow:
 *  1. Backend generates a cryptographically random code and stores tokens in Redis under it.
 *  2. Browser is redirected to /oauth/callback?code=<code> — no sensitive tokens in URL.
 *  3. Frontend POSTs /auth/oauth/exchange { code } to receive the actual tokens.
 *  4. Code is consumed on first use via Redis GETDEL (atomic retrieval and deletion) and expires after 60 seconds.
 */
@Injectable()
export class OAuthCodeStoreService {
  private readonly logger = new Logger(OAuthCodeStoreService.name);
  private static readonly CODE_PREFIX = 'oauth:code:';
  private static readonly CODE_TTL_SECONDS = 60;

  constructor(private readonly redisService: RedisService) {}

  /**
   * Stores OAuth tokens in Redis and returns a single-use exchange code.
   */
  async createCode(tokens: AuthTokens): Promise<string> {
    const code = crypto.randomBytes(32).toString('hex');
    const key = `${OAuthCodeStoreService.CODE_PREFIX}${code}`;
    await this.redisService.set(
      key,
      JSON.stringify(tokens),
      OAuthCodeStoreService.CODE_TTL_SECONDS,
    );
    return code;
  }

  /**
   * Atomically retrieves and invalidates tokens for a given code using Redis GETDEL.
   * Returns null when the code is unknown, already consumed, or expired.
   */
  async consumeCode(code: string): Promise<AuthTokens | null> {
    if (!code || typeof code !== 'string') {
      return null;
    }

    const key = `${OAuthCodeStoreService.CODE_PREFIX}${code}`;
    const rawTokens = await this.redisService.getdel(key);

    if (!rawTokens) {
      return null;
    }

    try {
      return JSON.parse(rawTokens) as AuthTokens;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to parse OAuth tokens from Redis for code ${code.slice(0, 8)}...: ${message}`,
      );
      return null;
    }
  }
}
