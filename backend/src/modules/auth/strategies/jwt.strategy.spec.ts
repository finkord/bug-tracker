import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy.js';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service.js';
import { RedisService } from '../../redis/redis.service.js';
import { User, SystemRole, OAuthProvider } from '../../users/entities/user.entity.js';

describe('JwtStrategy Security Hardening', () => {
  let strategy: JwtStrategy;
  let usersService: Partial<UsersService>;
  let configService: Partial<ConfigService>;
  let redisService: Partial<RedisService>;

  const mockUser = {
    id: 42,
    fullName: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashed_pw',
    systemRole: SystemRole.USER,
    jobTitle: 'Software Engineer',
    avatarUrl: null,
    isActivated: true,
    activationToken: null,
    activationTokenExpiresAt: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    isBlocked: false,
    twoFactorEnabled: true,
    twoFactorSecret: 'VALID_2FA_SECRET',
    twoFactorPendingSecret: null,
    tokenVersion: 2,
    oauthProvider: OAuthProvider.LOCAL,
    oauthId: null,
    resetPasswordToken: null,
    resetPasswordExpiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as User;

  beforeEach(() => {
    configService = {
      get: vi.fn().mockImplementation((key: string, defaultVal: string) => defaultVal),
    };
    usersService = {
      findById: vi.fn().mockResolvedValue(mockUser),
    };
    redisService = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
    };

    strategy = new JwtStrategy(
      configService as ConfigService,
      usersService as UsersService,
      redisService as RedisService,
    );
  });

  it('should accept valid JWT payload and populate cache on cache miss', async () => {
    const payload = {
      sub: 42,
      email: 'test@example.com',
      role: 'DEVELOPER',
      tokenVersion: 2,
    };

    const user = await strategy.validate(payload);
    expect(user).toBeDefined();
    expect(user.id).toBe(42);
    expect(usersService.findById).toHaveBeenCalledWith(42);
    expect(redisService.set).toHaveBeenCalledWith(
      'user:session:42',
      expect.any(String),
      300,
    );
  });

  it('should read from Redis cache on cache hit without querying PostgreSQL', async () => {
    redisService.get = vi.fn().mockResolvedValue(JSON.stringify(mockUser));

    const payload = {
      sub: 42,
      email: 'test@example.com',
      role: 'DEVELOPER',
      tokenVersion: 2,
    };

    const user = await strategy.validate(payload);
    expect(user).toBeDefined();
    expect(user.id).toBe(42);
    expect(redisService.get).toHaveBeenCalledWith('user:session:42');
    expect(usersService.findById).not.toHaveBeenCalled();
  });

  it('should reject temporary 2FA challenge tokens to prevent 2FA bypass', async () => {
    const payload = {
      sub: 42,
      email: 'test@example.com',
      role: 'DEVELOPER',
      is2faPending: true,
      tokenType: '2fa_challenge',
    };

    await expect(strategy.validate(payload)).rejects.toThrow(
      new UnauthorizedException(
        'Two-factor authentication challenge pending. Please complete 2FA verification.',
      ),
    );
  });

  it('should reject tokens with stale tokenVersion (revoked session after logout)', async () => {
    const payload = {
      sub: 42,
      email: 'test@example.com',
      role: 'DEVELOPER',
      tokenVersion: 1, // user.tokenVersion is 2
    };

    await expect(strategy.validate(payload)).rejects.toThrow(
      new UnauthorizedException('Session has been revoked. Please sign in again.'),
    );
  });

  it('should reject blocked users', async () => {
    usersService.findById = vi.fn().mockResolvedValue(
      Object.assign(new User(), mockUser, { isBlocked: true }),
    );

    const payload = {
      sub: 42,
      email: 'test@example.com',
      role: 'DEVELOPER',
      tokenVersion: 2,
    };

    await expect(strategy.validate(payload)).rejects.toThrow(
      new UnauthorizedException('Account has been blocked by administrator'),
    );
  });

  it('should reject unactivated users', async () => {
    usersService.findById = vi.fn().mockResolvedValue(
      Object.assign(new User(), mockUser, { isActivated: false }),
    );

    const payload = {
      sub: 42,
      email: 'test@example.com',
      role: 'DEVELOPER',
      tokenVersion: 2,
    };

    await expect(strategy.validate(payload)).rejects.toThrow(
      new UnauthorizedException('Account has not been activated via email'),
    );
  });
});
