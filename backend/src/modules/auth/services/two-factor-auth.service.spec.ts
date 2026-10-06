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
        user: mockUser,
      }),
    };
    mockSecurityAuditService = {
      recordLoginAttempt: vi.fn().mockResolvedValue(undefined),
    };

    service = new TwoFactorAuthService(
      mockUsersService,
      mockJwtService,
      mockSecurityAuditService,
      mockTokenSessionService,
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
});
