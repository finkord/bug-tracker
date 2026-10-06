import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { TokenSessionService } from './token-session.service.js';
import { User, SystemRole, OAuthProvider } from '../../users/entities/user.entity.js';

describe('TokenSessionService', () => {
  let service: TokenSessionService;
  let mockJwtService: any;
  let mockConfigService: any;
  let mockUsersService: any;

  const mockUser: User = {
    id: 42,
    email: 'developer@example.com',
    fullName: 'Jane Developer',
    systemRole: SystemRole.USER,
    jobTitle: 'Backend Engineer',
    avatarUrl: null,
    isActivated: true,
    isBlocked: false,
    twoFactorEnabled: false,
    oauthProvider: OAuthProvider.LOCAL,
    passwordHash: 'hash123',
    tokenVersion: 1,
  } as User;

  beforeEach(() => {
    mockJwtService = {
      sign: vi.fn().mockImplementation((payload, options) => {
        return `signed_${payload.token_type}_token`;
      }),
      verify: vi.fn(),
      decode: vi.fn(),
    };

    mockConfigService = {
      get: vi.fn((key: string, defaultValue?: string) => {
        if (key === 'JWT_SECRET') return 'custom_jwt_secret_32_chars_long';
        if (key === 'JWT_REFRESH_SECRET') return 'custom_refresh_secret_32_chars';
        if (key === 'JWT_EXPIRES_IN') return '15m';
        if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
        return defaultValue;
      }),
    };

    mockUsersService = {
      findById: vi.fn().mockResolvedValue(mockUser),
      update: vi.fn().mockResolvedValue(mockUser),
    };

    service = new TokenSessionService(
      mockJwtService,
      mockConfigService,
      mockUsersService,
    );
  });

  describe('generateTokens (RFC 6749 & OWASP Compliance)', () => {
    it('should generate access and refresh tokens with cryptographic secret separation and token typing', async () => {
      const result = await service.generateTokens(mockUser);

      expect(result).toMatchObject({
        accessToken: 'signed_access_token',
        refreshToken: 'signed_refresh_token',
        tokenType: 'Bearer',
        expiresIn: 900,
        token_type: 'Bearer',
        expires_in: 900,
      });

      // Verify Access Token signature options (JWT_SECRET, 15m, token_type: access)
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 42,
          email: 'developer@example.com',
          role: SystemRole.USER,
          token_type: 'access',
          tokenVersion: 1,
        }),
        {
          secret: 'custom_jwt_secret_32_chars_long',
          expiresIn: '15m',
        },
      );

      // Verify Refresh Token signature options (JWT_REFRESH_SECRET, 7d, token_type: refresh)
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 42,
          email: 'developer@example.com',
          role: SystemRole.USER,
          token_type: 'refresh',
          tokenVersion: 1,
        }),
        {
          secret: 'custom_refresh_secret_32_chars',
          expiresIn: '7d',
        },
      );
    });
  });

  describe('refreshTokens', () => {
    it('should verify refresh token using JWT_REFRESH_SECRET and issue fresh tokens', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 42,
        token_type: 'refresh',
        tokenVersion: 1,
      });

      const result = await service.refreshTokens('valid_refresh_token');

      expect(mockJwtService.verify).toHaveBeenCalledWith('valid_refresh_token', {
        secret: 'custom_refresh_secret_32_chars',
      });
      expect(result.accessToken).toBe('signed_access_token');
      expect(result.tokenType).toBe('Bearer');
    });

    it('should reject token substitution attacks if token_type is not refresh', async () => {
      // Attacker attempts to pass access token to refresh endpoint
      mockJwtService.verify.mockReturnValue({
        sub: 42,
        token_type: 'access',
        tokenVersion: 1,
      });

      await expect(service.refreshTokens('access_token_as_refresh')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject refresh token if tokenVersion does not match (session revoked)', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 42,
        token_type: 'refresh',
        tokenVersion: 0, // stale version
      });

      await expect(service.refreshTokens('revoked_refresh_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject refresh token if user is blocked', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 42,
        token_type: 'refresh',
        tokenVersion: 1,
      });
      mockUsersService.findById.mockResolvedValue({ ...mockUser, isBlocked: true });

      await expect(service.refreshTokens('blocked_user_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout & logoutByToken', () => {
    it('should increment tokenVersion on logout to invalidate all active refresh tokens', async () => {
      const result = await service.logout(42);

      expect(result).toEqual({ message: 'Successfully logged out' });
      expect(mockUsersService.update).toHaveBeenCalledWith(42, {
        tokenVersion: 2,
      });
    });

    it('should extract sub from token on logoutByToken and invalidate session', async () => {
      mockJwtService.decode.mockReturnValue({ sub: 42 });

      const result = await service.logoutByToken('some_bearer_jwt');

      expect(result).toEqual({ message: 'Successfully logged out' });
      expect(mockUsersService.update).toHaveBeenCalledWith(42, {
        tokenVersion: 2,
      });
    });
  });
});
