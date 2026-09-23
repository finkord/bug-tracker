import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Validates a Cloudflare Turnstile token submitted during registration (SDSecurity Task 2).
   * Follows the canonical Cloudflare Turnstile siteverify specification:
   * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
   */
  async validateToken(
    token: string,
    remoteIp?: string,
    expectedAction = 'signup',
  ): Promise<boolean> {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // Token length bounds checking
    if (token.length === 0 || token.length > 2048) {
      this.logger.warn(`Rejected Turnstile token with invalid length: ${token.length}`);
      return false;
    }

    // Allow development and automated testing tokens if configured
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    if (nodeEnv === 'development' || nodeEnv === 'test') {
      if (
        token === 'valid-captcha-token' ||
        token === 'test-token' ||
        token.startsWith('bypass-')
      ) {
        this.logger.debug(`Bypassing CAPTCHA check with development test token: ${token}`);
        return true;
      }
    }

    const secretKey =
      this.configService.get<string>('TURNSTILE_SECRET') ||
      this.configService.get<string>('CAPTCHA_SECRET_KEY');

    if (!secretKey || secretKey === 'placeholder_turnstile_secret_key') {
      if (nodeEnv === 'production') {
        this.logger.error('Turnstile secret key is not configured in production mode. Failing closed.');
        return false;
      }
      this.logger.warn('Turnstile secret key not set. Accepting formatted token in dev mode.');
      return true;
    }

    // Allowed frontend hostnames (e.g. 'localhost,127.0.0.1')
    const configuredHostnames = this.configService.get<string>(
      'TURNSTILE_HOSTNAMES',
      'localhost,127.0.0.1',
    );
    const expectedHostnames = new Set(
      configuredHostnames
        .split(',')
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean),
    );

    try {
      const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
      const formParams = new URLSearchParams({
        secret: secretKey,
        response: token,
      });
      if (remoteIp) {
        formParams.append('remoteip', remoteIp);
      }

      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: AbortSignal.timeout(10_000),
        body: formParams,
      });

      if (!response.ok) {
        this.logger.error(`Turnstile siteverify HTTP error: ${response.status}`);
        return false;
      }

      const outcome = (await response.json()) as TurnstileVerifyResponse;

      if (!outcome.success) {
        this.logger.warn(
          `Turnstile validation rejected token: ${JSON.stringify(outcome['error-codes'] || [])}`,
        );
        return false;
      }

      // Check action if provided by Cloudflare
      if (outcome.action && outcome.action !== expectedAction) {
        this.logger.warn(
          `Turnstile action mismatch: expected "${expectedAction}", got "${outcome.action}"`,
        );
        return false;
      }

      // Check hostname if provided by Cloudflare and hostnames are configured
      if (outcome.hostname && expectedHostnames.size > 0) {
        const normalizedHostname = outcome.hostname.toLowerCase();
        if (!expectedHostnames.has(normalizedHostname)) {
          this.logger.warn(
            `Turnstile hostname "${outcome.hostname}" not in allowed hostnames: ${Array.from(expectedHostnames).join(', ')}`,
          );
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`Error verifying Turnstile token: ${(error as Error).message}`);
      return false;
    }
  }
}
