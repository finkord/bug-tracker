import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy.js';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service.js';
import { User, SystemRole, OAuthProvider } from '../../users/entities/user.entity.js';

describe('JwtStrategy Security Hardening', () => {
  let strategy: JwtStrategy;
  let usersService: Partial<UsersService>;
  let configService: Partial<ConfigService>;

  const mockUser = {
    id: 42,
    fullName: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashed_pw',
    systemRole: SystemRole.DEVELOPER,
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

    strategy = new JwtStrategy(
      configService as ConfigService,
      usersService as UsersService,
    );
  });

  it('should accept valid JWT payload with matching tokenVersion', async () => {
    const payload = {
      sub: 42,
      email: 'test@example.com',
      role: 'DEVELOPER',
      tokenVersion: 2,
    };

    const user = await strategy.validate(payload);
    expect(user).toBeDefined();
    expect(user.id).toBe(42);
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
    usersService.findById = vi.fn().mockResolvedValue({
      ...mockUser,
      isBlocked: true,
    });

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
    usersService.findById = vi.fn().mockResolvedValue({
      ...mockUser,
      isActivated: false,
    });

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
