import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { CaptchaService } from './captcha.service.js';

describe('CaptchaService', () => {
  let service: CaptchaService;
  let mockConfigService: { get: ReturnType<typeof vi.fn> };
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    mockConfigService = {
      get: vi.fn(),
    };
    service = new CaptchaService(mockConfigService as unknown as ConfigService);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('input format validation', () => {
    it('should reject missing or non-string tokens', async () => {
      expect(await service.validateToken('')).toBe(false);
      expect(await service.validateToken(null as unknown as string)).toBe(false);
      expect(await service.validateToken(undefined as unknown as string)).toBe(false);
    });

    it('should reject tokens longer than 2048 characters', async () => {
      const longToken = 'a'.repeat(2049);
      const result = await service.verifyToken(longToken);
      expect(result.success).toBe(false);
      expect(result.errorCodes).toContain('invalid-input-response');
    });
  });

  describe('secret key enforcement', () => {
    it('should fail closed if secret key is missing', async () => {
      mockConfigService.get.mockImplementation((key: string, defaultValue?: string) => {
        if (key === 'TURNSTILE_SECRET' || key === 'CAPTCHA_SECRET_KEY') return undefined;
        return defaultValue;
      });

      const result = await service.verifyToken('valid-looking-token-12345');
      expect(result.success).toBe(false);
      expect(result.errorCodes).toContain('missing-input-secret');
    });

    it('should fail closed if secret key is placeholder', async () => {
      mockConfigService.get.mockImplementation((key: string, defaultValue?: string) => {
        if (key === 'TURNSTILE_SECRET') return 'placeholder_turnstile_secret_key';
        return defaultValue;
      });

      const result = await service.verifyToken('valid-looking-token-12345');
      expect(result.success).toBe(false);
      expect(result.errorCodes).toContain('missing-input-secret');
    });
  });

  describe('server-side verification with Siteverify API', () => {
    beforeEach(() => {
      mockConfigService.get.mockImplementation((key: string, defaultValue?: string) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'TURNSTILE_SECRET') return '0x4AAAAAAtestSecretKey';
        if (key === 'TURNSTILE_HOSTNAMES') return 'localhost,example.com';
        return defaultValue;
      });
    });

    it('should successfully validate a legitimate token with idempotency key and correct action', async () => {
      let sentBody = '';
      global.fetch = vi.fn().mockImplementation(async (_url, options) => {
        sentBody = options.body.toString();
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            challenge_ts: new Date().toISOString(),
            hostname: 'example.com',
            action: 'signup',
          }),
        };
      });

      const result = await service.verifyToken('valid-token-from-cf', '203.0.113.1', {
        expectedAction: 'signup',
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('signup');
      expect(result.hostname).toBe('example.com');

      // Verify request payload contains secret, response, remoteip, and idempotency_key
      const params = new URLSearchParams(sentBody);
      expect(params.get('secret')).toBe('0x4AAAAAAtestSecretKey');
      expect(params.get('response')).toBe('valid-token-from-cf');
      expect(params.get('remoteip')).toBe('203.0.113.1');
      expect(params.get('idempotency_key')).toBeTruthy();
    });

    it('should reject when Cloudflare returns failure and error codes', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: false,
          'error-codes': ['invalid-input-response'],
        }),
      });

      const result = await service.verifyToken('invalid-token', '127.0.0.1');
      expect(result.success).toBe(false);
      expect(result.errorCodes).toContain('invalid-input-response');
    });

    it('should reject tokens older than 300 seconds (5-minute expiration period)', async () => {
      const sixMinutesAgo = new Date(Date.now() - 360 * 1000).toISOString();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          challenge_ts: sixMinutesAgo,
          hostname: 'example.com',
          action: 'signup',
        }),
      });

      const result = await service.verifyToken('expired-token', '127.0.0.1');
      expect(result.success).toBe(false);
      expect(result.errorCodes).toContain('timeout-or-duplicate');
    });

    it('should reject when action does not match expected action', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          challenge_ts: new Date().toISOString(),
          hostname: 'example.com',
          action: 'login', // Expected: signup
        }),
      });

      const result = await service.verifyToken('valid-token', '127.0.0.1', {
        expectedAction: 'signup',
      });
      expect(result.success).toBe(false);
      expect(result.failureReason).toContain('Action mismatch');
    });

    it('should reject when hostname is not in the allowed hostnames list', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          challenge_ts: new Date().toISOString(),
          hostname: 'malicious-domain.com',
          action: 'signup',
        }),
      });

      const result = await service.verifyToken('valid-token', '127.0.0.1', {
        expectedAction: 'signup',
      });
      expect(result.success).toBe(false);
      expect(result.failureReason).toContain('is not authorized');
    });

    it('should retry transient network errors with the same idempotency key', async () => {
      const idempotencyKeys: string[] = [];

      let attempt = 0;
      global.fetch = vi.fn().mockImplementation(async (_url, options) => {
        attempt++;
        const params = new URLSearchParams(options.body.toString());
        idempotencyKeys.push(params.get('idempotency_key')!);

        if (attempt === 1) {
          throw new Error('Network timeout');
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            challenge_ts: new Date().toISOString(),
            hostname: 'example.com',
            action: 'signup',
          }),
        };
      });

      const result = await service.verifyToken('retry-token', '127.0.0.1', {
        maxRetries: 2,
      });

      expect(result.success).toBe(true);
      expect(attempt).toBe(2);
      expect(idempotencyKeys.length).toBe(2);
      expect(idempotencyKeys[0]).toBe(idempotencyKeys[1]); // Preserves idempotency key across retries
    });
  });
});
