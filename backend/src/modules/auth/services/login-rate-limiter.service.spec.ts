import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LoginRateLimiterService } from './login-rate-limiter.service.js';
import { RedisService } from '../../redis/redis.service.js';

describe('LoginRateLimiterService', () => {
  let service: LoginRateLimiterService;
  let mockRedisService: Partial<RedisService>;

  beforeEach(() => {
    mockRedisService = {
      get: vi.fn(),
      set: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
      incr: vi.fn(),
      expire: vi.fn().mockResolvedValue(1),
      ttl: vi.fn(),
    };

    service = new LoginRateLimiterService(mockRedisService as RedisService);
  });

  describe('isLocked', () => {
    it('should return locked=true with remainingSeconds when lockout key exists', async () => {
      mockRedisService.get = vi.fn().mockResolvedValue('1');
      mockRedisService.ttl = vi.fn().mockResolvedValue(600);

      const result = await service.isLocked('user@example.com');

      expect(mockRedisService.get).toHaveBeenCalledWith('auth:lockout:user@example.com');
      expect(mockRedisService.ttl).toHaveBeenCalledWith('auth:lockout:user@example.com');
      expect(result).toEqual({ isLocked: true, remainingSeconds: 600 });
    });

    it('should return locked=false when lockout key does not exist', async () => {
      mockRedisService.get = vi.fn().mockResolvedValue(null);

      const result = await service.isLocked('user@example.com');

      expect(result).toEqual({ isLocked: false, remainingSeconds: 0 });
    });
  });

  describe('recordFailedAttempt', () => {
    it('should increment attempt counter and set expiry on first failure', async () => {
      mockRedisService.incr = vi.fn().mockResolvedValue(1);

      const result = await service.recordFailedAttempt('user@example.com');

      expect(mockRedisService.incr).toHaveBeenCalledWith('auth:attempts:user@example.com');
      expect(mockRedisService.expire).toHaveBeenCalledWith('auth:attempts:user@example.com', 900);
      expect(result).toEqual({ isLocked: false, attempts: 1, remainingSeconds: 0 });
    });

    it('should lock account and delete attempt counter when reaching 5 attempts', async () => {
      mockRedisService.incr = vi.fn().mockResolvedValue(5);

      const result = await service.recordFailedAttempt('user@example.com');

      expect(mockRedisService.set).toHaveBeenCalledWith(
        'auth:lockout:user@example.com',
        '1',
        900,
      );
      expect(mockRedisService.del).toHaveBeenCalledWith('auth:attempts:user@example.com');
      expect(result).toEqual({ isLocked: true, attempts: 5, remainingSeconds: 900 });
    });
  });

  describe('resetAttempts', () => {
    it('should delete both attempt and lockout keys', async () => {
      await service.resetAttempts('user@example.com');

      expect(mockRedisService.del).toHaveBeenCalledWith(
        'auth:attempts:user@example.com',
        'auth:lockout:user@example.com',
      );
    });
  });
});
