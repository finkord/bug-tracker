import { Injectable, Logger } from '@nestjs/common';
import crypto from 'node:crypto';
import type { AuthTokens } from './token-session.service.js';

/** Duration the one-time OAuth code remains valid (milliseconds). */
const CODE_TTL_MS = 60_000;

/** Interval for purging expired codes from memory (milliseconds). */
const CLEANUP_INTERVAL_MS = 120_000;

interface StoredCode {
  tokens: AuthTokens;
  expiresAt: number;
}

/**
 * Secure in-memory store for short-lived OAuth exchange codes.
 *
 * Flow:
 *  1. Backend generates a cryptographically random code and stores tokens under it.
 *  2. Browser is redirected to /oauth/callback?code=<code> — no tokens in URL.
 *  3. Frontend POSTs /auth/oauth/exchange { code } to receive the actual tokens.
 *  4. Code is consumed on first use and expires after 60 seconds.
 */
@Injectable()
export class OAuthCodeStoreService {
  private readonly logger = new Logger(OAuthCodeStoreService.name);
  private readonly store = new Map<string, StoredCode>();
  private cleanupTimer: NodeJS.Timeout;

  constructor() {
    this.cleanupTimer = setInterval(
      () => this.purgeExpiredCodes(),
      CLEANUP_INTERVAL_MS,
    );
    // Prevent timer from blocking process exit
    this.cleanupTimer.unref();
  }

  /**
   * Stores OAuth tokens and returns a single-use exchange code.
   */
  createCode(tokens: AuthTokens): string {
    const code = crypto.randomBytes(32).toString('hex');
    this.store.set(code, {
      tokens,
      expiresAt: Date.now() + CODE_TTL_MS,
    });
    return code;
  }

  /**
   * Retrieves and immediately invalidates tokens for a given code.
   * Returns null when the code is unknown or expired.
   */
  consumeCode(code: string): AuthTokens | null {
    const entry = this.store.get(code);

    if (!entry) {
      return null;
    }

    this.store.delete(code);

    if (Date.now() > entry.expiresAt) {
      this.logger.warn(`OAuth code ${code.slice(0, 8)}… was expired at consumption`);
      return null;
    }

    return entry.tokens;
  }

  /** Removes all codes that have passed their TTL. */
  private purgeExpiredCodes(): void {
    const now = Date.now();
    for (const [code, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(code);
      }
    }
  }
}
