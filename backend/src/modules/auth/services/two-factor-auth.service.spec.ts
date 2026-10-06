import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { TwoFactorAuthService } from './two-factor-auth.service.js';
import { User, SystemRole } from '../../users/entities/user.entity.js';

describe('TwoFactorAuthService', () => {
  let service: TwoFactorAuthService;
  let mockUsersService: any;
  let mockJwtService: any;
  let mockTokenSessionService: any;
  let mockSecurityAuditService: any;
  let mockLoginRateLimiter: any;

  const mockUser: User = {
    id: 1,
    email: 'julia@julia.com',
    fullName: 'Julia User',
    systemRole: SystemRole.USER,
    twoFactorEnabled: true,
    twoFactorSecret: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
    isActivated: true,
    isBlocked: false,
  } as User;

  beforeEach(() => {
    mockUsersService = {
      findById: vi.fn().mockResolvedValue(mockUser),
      update: vi.fn().mockResolvedValue(mockUser),
    };
    mockJwtService = {
      sign: vi.fn().mockReturnValue('mock_token'),
      verify: vi.fn().mockReturnValue({ sub: 1, is2faPending: true, tokenType: '2fa_challenge' }),
    };
    mockTokenSessionService = {
      generateTokens: vi.fn().mockResolvedValue({
        accessToken: 'access_123',
        refreshToken: 'refresh_123',
        tokenType: 'Bearer',
        expiresIn: 900,
        user: mockUser,
      }),
    };
    mockSecurityAuditService = {
      recordLoginAttempt: vi.fn().mockResolvedValue(undefined),
    };
    mockLoginRateLimiter = {
      isLocked: vi.fn().mockResolvedValue({ isLocked: false, remainingSeconds: 0 }),
      recordFailedAttempt: vi.fn().mockResolvedValue({ isLocked: false, attempts: 1, remainingSeconds: 0 }),
      resetAttempts: vi.fn().mockResolvedValue(undefined),
    };

    service = new TwoFactorAuthService(
      mockUsersService,
      mockJwtService,
      mockSecurityAuditService,
      mockTokenSessionService,
      mockLoginRateLimiter,
    );
  });

  describe('verify2fa parameter compatibility', () => {
    it('should throw BadRequestException if neither tempToken nor challengeToken is supplied', async () => {
      await expect(
        service.verify2fa({ code: '123456' } as any, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if neither code nor totpCode is supplied', async () => {
      await expect(
        service.verify2fa({ tempToken: 'valid_jwt' } as any, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept challengeToken and totpCode aliases without error', async () => {
      // Mock verifySync inside @scure/bip39 or otplib if needed, or check error is about code correctness
      // verify2fa should proceed to jwtService.verify with challengeToken
      try {
        await service.verify2fa(
          { challengeToken: 'valid_jwt', totpCode: '123456' },
          '127.0.0.1',
        );
      } catch (err: any) {
        // If code doesn't match secret, UnauthorizedException is expected, not BadRequestException
        expect(err).toBeInstanceOf(UnauthorizedException);
      }
      expect(mockJwtService.verify).toHaveBeenCalledWith('valid_jwt');
    });

    it('should accept tempToken and code directly', async () => {
      try {
        await service.verify2fa(
          { tempToken: 'valid_jwt_temp', code: '123456' },
          '127.0.0.1',
        );
      } catch (err: any) {
        expect(err).toBeInstanceOf(UnauthorizedException);
      }
      expect(mockJwtService.verify).toHaveBeenCalledWith('valid_jwt_temp');
    });
  });

  describe('verify2fa brute-force protection', () => {
    it('should throw UnauthorizedException when identifier is already locked out in Redis', async () => {
      mockLoginRateLimiter.isLocked.mockResolvedValue({
        isLocked: true,
        remainingSeconds: 600,
      });

      await expect(
        service.verify2fa(
          { tempToken: 'valid_jwt', code: '123456' },
          '127.0.0.1',
        ),
      ).rejects.toThrow(/Account is temporarily locked due to multiple failed verification attempts/);

      expect(mockLoginRateLimiter.isLocked).toHaveBeenCalledWith('julia@julia.com');
    });

    it('should record failed attempt and lock account after 5 invalid attempts', async () => {
      mockLoginRateLimiter.isLocked.mockResolvedValue({
        isLocked: false,
        remainingSeconds: 0,
      });
      mockLoginRateLimiter.recordFailedAttempt.mockResolvedValue({
        isLocked: true,
        attempts: 5,
        remainingSeconds: 900,
      });

      await expect(
        service.verify2fa(
          { tempToken: 'valid_jwt', code: '000000' },
          '127.0.0.1',
        ),
      ).rejects.toThrow(/temporarily locked for 15 minutes due to 5 consecutive failed verification attempts/);

      expect(mockLoginRateLimiter.recordFailedAttempt).toHaveBeenCalledWith('julia@julia.com');
    });
  });
});

