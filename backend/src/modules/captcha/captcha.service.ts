import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';

export interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
  metadata?: {
    ephemeral_id?: string;
  };
}

export interface TurnstileVerifyOptions {
  expectedAction?: string;
  expectedHostname?: string;
  expectedCData?: string;
  idempotencyKey?: string;
  maxRetries?: number;
}

export interface TurnstileVerificationResult {
  success: boolean;
  errorCodes?: string[];
  challengeTs?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
  tokenAgeSeconds?: number;
  failureReason?: string;
}

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);
  private readonly siteverifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

  constructor(private readonly configService: ConfigService) {}

  /**
   * Detailed Turnstile token verification following the official Cloudflare specification:
   * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
   */
  async verifyToken(
    token: string,
    remoteIp?: string,
    options: TurnstileVerifyOptions = {},
  ): Promise<TurnstileVerificationResult> {
    const {
      expectedAction = 'signup',
      expectedHostname,
      maxRetries = 3,
    } = options;

    // 1. Input format & length validation
    if (!token || typeof token !== 'string') {
      this.logger.warn('Rejected Turnstile token: Token is missing or not a string.');
      return {
        success: false,
        errorCodes: ['missing-input-response'],
        failureReason: 'Token is missing or malformed',
      };
    }

    const trimmedToken = token.trim();
    if (trimmedToken.length === 0 || trimmedToken.length > 2048) {
      this.logger.warn(`Rejected Turnstile token with invalid length: ${trimmedToken.length} (max 2048)`);
      return {
        success: false,
        errorCodes: ['invalid-input-response'],
        failureReason: 'Token length out of bounds',
      };
    }

    // 2. Resolve Secret Key
    const secretKey =
      this.configService.get<string>('TURNSTILE_SECRET') ||
      this.configService.get<string>('CAPTCHA_SECRET_KEY');

    if (!secretKey || secretKey === 'placeholder_turnstile_secret_key') {
      this.logger.error('Turnstile secret key is not configured. Failing closed.');
      return {
        success: false,
        errorCodes: ['missing-input-secret'],
        failureReason: 'Turnstile secret key is not configured',
      };
    }

    // 4. Resolve Allowed Hostnames
    const configuredHostnames =
      expectedHostname ||
      this.configService.get<string>('TURNSTILE_HOSTNAMES', 'localhost,127.0.0.1');

    const expectedHostnamesSet = new Set(
      configuredHostnames
        .split(',')
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean),
    );

    // 5. Generate Idempotency Key for Safe Retry Operations
    const idempotencyKey = options.idempotencyKey || randomUUID();

    // 6. Execute Request with Retry & Exponential Backoff
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const formParams = new URLSearchParams({
          secret: secretKey,
          response: trimmedToken,
          idempotency_key: idempotencyKey,
        });

        if (remoteIp) {
          formParams.append('remoteip', remoteIp);
        }

        const response = await fetch(this.siteverifyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          signal: AbortSignal.timeout(10_000),
          body: formParams,
        });

        if (!response.ok) {
          this.logger.error(`Turnstile siteverify HTTP error: ${response.status} (attempt ${attempt}/${maxRetries})`);
          if (attempt === maxRetries) {
            return {
              success: false,
              errorCodes: ['internal-error'],
              failureReason: `Siteverify HTTP error status ${response.status}`,
            };
          }
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 500));
          continue;
        }

        const outcome = (await response.json()) as TurnstileVerifyResponse;

        if (!outcome.success) {
          const errorCodes = outcome['error-codes'] || [];
          this.logger.warn(`Turnstile validation rejected token: ${JSON.stringify(errorCodes)}`);
          return {
            success: false,
            errorCodes,
            failureReason: `Turnstile rejected verification: ${errorCodes.join(', ')}`,
          };
        }

        // 7. Token Age Verification (300 seconds / 5 minutes validity period)
        let tokenAgeSeconds: number | undefined;
        if (outcome.challenge_ts) {
          const challengeTime = new Date(outcome.challenge_ts).getTime();
          const now = Date.now();
          tokenAgeSeconds = Math.max(0, (now - challengeTime) / 1000);

          if (tokenAgeSeconds > 300) {
            this.logger.warn(`Turnstile token expired: ${tokenAgeSeconds.toFixed(1)}s old (max 300s allowed)`);
            return {
              success: false,
              errorCodes: ['timeout-or-duplicate'],
              challengeTs: outcome.challenge_ts,
              tokenAgeSeconds,
              failureReason: 'Turnstile token expired (> 300 seconds)',
            };
          }

          if (tokenAgeSeconds > 240) {
            this.logger.warn(`Turnstile token near expiration: ${tokenAgeSeconds.toFixed(1)}s old`);
          }
        }

        // 8. Action Matching
        if (expectedAction && outcome.action && outcome.action !== expectedAction) {
          this.logger.warn(
            `Turnstile action mismatch: expected "${expectedAction}", got "${outcome.action}"`,
          );
          return {
            success: false,
            errorCodes: ['bad-request'],
            action: outcome.action,
            failureReason: `Action mismatch: expected "${expectedAction}", received "${outcome.action}"`,
          };
        }

        // 9. Hostname Matching
        if (outcome.hostname && expectedHostnamesSet.size > 0) {
          const normalizedHostname = outcome.hostname.toLowerCase();
          if (!expectedHostnamesSet.has(normalizedHostname)) {
            this.logger.warn(
              `Turnstile hostname "${outcome.hostname}" not in allowed hostnames: ${Array.from(expectedHostnamesSet).join(', ')}`,
            );
            return {
              success: false,
              errorCodes: ['bad-request'],
              hostname: outcome.hostname,
              failureReason: `Hostname "${outcome.hostname}" is not authorized`,
            };
          }
        }

        // 10. Optional CData Matching
        if (options.expectedCData && outcome.cdata && outcome.cdata !== options.expectedCData) {
          this.logger.warn(`Turnstile cdata mismatch: expected "${options.expectedCData}", got "${outcome.cdata}"`);
          return {
            success: false,
            errorCodes: ['bad-request'],
            cdata: outcome.cdata,
            failureReason: 'Custom payload data mismatch',
          };
        }

        return {
          success: true,
          challengeTs: outcome.challenge_ts,
          hostname: outcome.hostname,
          action: outcome.action,
          cdata: outcome.cdata,
          tokenAgeSeconds,
        };
      } catch (error) {
        const errorMsg = (error as Error).message;
        this.logger.error(`Turnstile request attempt ${attempt}/${maxRetries} failed: ${errorMsg}`);
        if (attempt === maxRetries) {
          return {
            success: false,
            errorCodes: ['internal-error'],
            failureReason: `Turnstile verification failed after ${maxRetries} attempts: ${errorMsg}`,
          };
        }
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 500));
      }
    }

    return {
      success: false,
      errorCodes: ['internal-error'],
      failureReason: 'Turnstile verification failed due to internal error',
    };
  }

  /**
   * Convenience validator returning boolean for route guards and authentication services.
   */
  async validateToken(
    token: string,
    remoteIp?: string,
    expectedAction = 'signup',
  ): Promise<boolean> {
    const result = await this.verifyToken(token, remoteIp, { expectedAction });
    return result.success;
  }
}
