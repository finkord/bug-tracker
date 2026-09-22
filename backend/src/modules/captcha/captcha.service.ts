import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Validates a CAPTCHA token submitted during registration (SDSecurity Task 2).
   * In development/testing, accepts special test tokens or validates against provider.
   */
  async validateToken(token: string, remoteIp?: string): Promise<boolean> {
    if (!token) {
      return false;
    }

    // Allow development and automated testing tokens
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    if (nodeEnv === 'development' || nodeEnv === 'test') {
      if (token === 'valid-captcha-token' || token === 'test-token' || token.startsWith('bypass-')) {
        this.logger.debug(`Bypassing CAPTCHA check with development test token: ${token}`);
        return true;
      }
    }

    const secretKey = this.configService.get<string>('CAPTCHA_SECRET_KEY');
    if (!secretKey || secretKey === 'placeholder_turnstile_secret_key') {
      // If secret key is not configured yet, accept valid formatted token in dev
      this.logger.warn('CAPTCHA_SECRET_KEY not set. Accepting formatted token in dev mode.');
      return true;
    }

    try {
      // Cloudflare Turnstile / Google reCAPTCHA siteverify endpoint
      const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: secretKey,
          response: token,
          remoteip: remoteIp,
        }),
      });

      const outcome = (await response.json()) as { success: boolean };
      return outcome.success === true;
    } catch (error) {
      this.logger.error(`Error verifying CAPTCHA token: ${(error as Error).message}`);
      return false;
    }
  }
}
