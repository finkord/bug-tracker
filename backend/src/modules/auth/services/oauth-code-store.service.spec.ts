import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OAuthCodeStoreService } from './oauth-code-store.service.js';
import { RedisService } from '../../redis/redis.service.js';
import type { AuthTokens } from './token-session.service.js';
import { SystemRole, OAuthProvider } from '../../users/entities/user.entity.js';

describe('OAuthCodeStoreService', () => {
  let service: OAuthCodeStoreService;
  let mockRedisService: Partial<RedisService>;

  const mockTokens: AuthTokens = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    tokenType: 'Bearer',
    expiresIn: 900,
    user: {
      id: 1,
      fullName: 'Test User',
      email: 'test@example.com',
      systemRole: SystemRole.USER,
      isActivated: true,
      isBlocked: false,
      twoFactorEnabled: false,
      oauthProvider: OAuthProvider.GITHUB,
      hasPassword: true,
    },
  };

  beforeEach(() => {
    mockRedisService = {
      set: vi.fn().mockResolvedValue('OK'),
      getdel: vi.fn(),
    };

    service = new OAuthCodeStoreService(mockRedisService as RedisService);
  });

  it('should generate a 64-char hex code and store tokens in Redis with 60s TTL', async () => {
    const code = await service.createCode(mockTokens);

    expect(code).toBeDefined();
    expect(code).toHaveLength(64);
    expect(mockRedisService.set).toHaveBeenCalledWith(
      `oauth:code:${code}`,
      JSON.stringify(mockTokens),
      60,
    );
  });

  it('should atomically retrieve and delete tokens on consumeCode', async () => {
    const testCode = 'a'.repeat(64);
    mockRedisService.getdel = vi.fn().mockResolvedValue(JSON.stringify(mockTokens));

    const result = await service.consumeCode(testCode);

    expect(mockRedisService.getdel).toHaveBeenCalledWith(`oauth:code:${testCode}`);
    expect(result).toEqual(mockTokens);
  });

  it('should return null when code is not found or already consumed', async () => {
    mockRedisService.getdel = vi.fn().mockResolvedValue(null);

    const result = await service.consumeCode('non-existent-code');

    expect(result).toBeNull();
  });

  it('should return null when invalid code string is provided', async () => {
    const result = await service.consumeCode('');

    expect(result).toBeNull();
    expect(mockRedisService.getdel).not.toHaveBeenCalled();
  });
});
