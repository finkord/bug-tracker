import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { LocalAuthService } from './local-auth.service.js';
import { User, SystemRole } from '../../users/entities/user.entity.js';
import { RegisterDto } from '../dto/register.dto.js';
import { LoginDto } from '../dto/login.dto.js';
import { ARGON2_OPTIONS } from '../constants/argon2.constants.js';

describe('LocalAuthService', () => {
  let service: LocalAuthService;
  let mockUsersService: any;
  let mockMailerService: any;
  let mockConfigService: any;
  let mockSecurityAuditService: any;
  let mockCaptchaService: any;
  let mockTokenSessionService: any;
  let mockTwoFactorAuthService: any;
  let mockLoginRateLimiter: any;
  let mockRedisService: any;

  const mockUser: User = {
    id: 1,
    email: 'engineer@company.com',
    fullName: 'Test Engineer',
    passwordHash: '',
    systemRole: SystemRole.USER,
    isActivated: true,
    isBlocked: false,
    failedLoginAttempts: 0,
    lockedUntil: null,
    twoFactorEnabled: false,
    twoFactorSecret: null,
  } as User;

  beforeEach(async () => {
    const defaultPasswordHash = await argon2.hash('SecurePassword123!', ARGON2_OPTIONS);
    mockUser.passwordHash = defaultPasswordHash;
    mockUser.failedLoginAttempts = 0;
    mockUser.lockedUntil = null;
    mockUser.isActivated = true;
    mockUser.isBlocked = false;
    mockUser.twoFactorEnabled = false;

    mockUsersService = {
      findByEmail: vi.fn(),
      create: vi.fn((data: any) => Promise.resolve({ id: 1, ...data })),
      findByActivationToken: vi.fn(),
      update: vi.fn((id: number, data: any) => {
        Object.assign(mockUser, data);
        return Promise.resolve(mockUser);
      }),
    };

    mockMailerService = {
      sendMail: vi.fn().mockResolvedValue(true),
    };

    mockConfigService = {
      get: vi.fn((key: string, defaultValue?: string) => {
        if (key === 'FRONTEND_URL') return 'http://localhost:5173';
        return defaultValue;
      }),
    };

    mockSecurityAuditService = {
      recordLoginAttempt: vi.fn().mockResolvedValue(undefined),
    };

    mockCaptchaService = {
      validateToken: vi.fn().mockResolvedValue(true),
    };

    mockTokenSessionService = {
      generateTokens: vi.fn().mockResolvedValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      }),
    };

    mockTwoFactorAuthService = {
      createChallengeToken: vi.fn().mockReturnValue('mock-temp-2fa-token'),
    };

    mockLoginRateLimiter = {
      isLocked: vi.fn().mockResolvedValue({ isLocked: false, remainingSeconds: 0 }),
      recordFailedAttempt: vi.fn().mockResolvedValue({ isLocked: false, attempts: 1, remainingSeconds: 0 }),
      resetAttempts: vi.fn().mockResolvedValue(undefined),
    };

    mockRedisService = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
    };

    service = new LocalAuthService(
      mockUsersService,
      mockMailerService,
      mockConfigService,
      mockSecurityAuditService,
      mockCaptchaService,
      mockTokenSessionService,
      mockTwoFactorAuthService,
      mockLoginRateLimiter,
      mockRedisService,
    );
  });

  describe('register', () => {
    it('should successfully register a user without leaking tokens or password hashes', async () => {
      // Arrange
      const inputDto: RegisterDto = {
        fullName: 'New User',
        email: 'newuser@company.com',
        password: 'ValidPassword123!',
        captchaToken: 'valid-captcha-token',
      };
      mockUsersService.findByEmail.mockResolvedValue(null);

      // Act
      const actualResult = await service.register(inputDto, '127.0.0.1');

      // Assert
      expect(actualResult).toEqual({
        message: 'Account created successfully! Please check your email to activate your account.',
        userId: 1,
        email: 'newuser@company.com',
      });
      expect(actualResult).not.toHaveProperty('activationToken');
      expect(actualResult).not.toHaveProperty('passwordHash');
      expect(mockUsersService.create).toHaveBeenCalledOnce();
      expect(mockMailerService.sendMail).toHaveBeenCalledOnce();
    });

    it('should throw BadRequestException if email is already taken', async () => {
      // Arrange
      const inputDto: RegisterDto = {
        fullName: 'Duplicate User',
        email: 'engineer@company.com',
        password: 'ValidPassword123!',
        captchaToken: 'valid-captcha-token',
      };
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(inputDto, '127.0.0.1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('activateAccount', () => {
    it('should deduplicate activation requests via Redis without updating DB again', async () => {
      mockRedisService.get.mockResolvedValue('1');

      const result = await service.activateAccount('test-token');

      expect(result).toEqual({
        message: 'Account successfully activated! You can now log into the system.',
        isActivated: true,
      });
      expect(mockUsersService.findByActivationToken).not.toHaveBeenCalled();
    });

    it('should activate user and set Redis deduplication key', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockUsersService.findByActivationToken.mockResolvedValue(mockUser);

      const result = await service.activateAccount('valid-token');

      expect(result).toEqual({
        message: 'Account successfully activated! You can now log into the system.',
        isActivated: true,
      });
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'auth:activation:valid-token',
        '1',
        300,
      );
      expect(mockUsersService.update).toHaveBeenCalledWith(mockUser.id, {
        isActivated: true,
        activationToken: null,
        activationTokenExpiresAt: null,
      });
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException when user does not exist', async () => {
      // Arrange
      const inputDto: LoginDto = {
        email: 'unknown@company.com',
        password: 'Password123!',
      };
      mockUsersService.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(inputDto, '127.0.0.1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when account is blocked', async () => {
      // Arrange
      const inputDto: LoginDto = {
        email: 'engineer@company.com',
        password: 'SecurePassword123!',
      };
      mockUser.isBlocked = true;
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.login(inputDto, '127.0.0.1')).rejects.toThrow(
        'This account has been blocked by an administrator.',
      );
    });

    it('should lock account after 5 consecutive failed login attempts via Redis without DB row locks', async () => {
      // Arrange
      const inputDto: LoginDto = {
        email: 'engineer@company.com',
        password: 'WrongPassword!',
      };
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockLoginRateLimiter.recordFailedAttempt.mockResolvedValue({
        isLocked: true,
        attempts: 5,
        remainingSeconds: 900,
      });

      // Act & Assert
      await expect(service.login(inputDto, '127.0.0.1')).rejects.toThrow(
        'Account has been temporarily locked for 15 minutes due to 5 consecutive failed login attempts.',
      );
      expect(mockLoginRateLimiter.recordFailedAttempt).toHaveBeenCalledWith('engineer@company.com');
      // Crucial: usersService.update is NOT called on failed attempts, preventing PostgreSQL row lock contention!
      expect(mockUsersService.update).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if account is currently locked in Redis', async () => {
      // Arrange
      const inputDto: LoginDto = {
        email: 'engineer@company.com',
        password: 'SecurePassword123!',
      };
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockLoginRateLimiter.isLocked.mockResolvedValue({
        isLocked: true,
        remainingSeconds: 600,
      });

      // Act & Assert
      await expect(service.login(inputDto, '127.0.0.1')).rejects.toThrow(
        /Account is temporarily locked due to multiple failed login attempts/,
      );
      expect(mockUsersService.update).not.toHaveBeenCalled();
    });

    it('should require email verification if account is not activated', async () => {
      // Arrange
      const inputDto: LoginDto = {
        email: 'engineer@company.com',
        password: 'SecurePassword123!',
      };
      mockUser.isActivated = false;
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.login(inputDto, '127.0.0.1')).rejects.toThrow(
        'Your account has not been activated yet. Please check your email for the activation link.',
      );
    });

    it('should return 2FA challenge when two-factor authentication is enabled', async () => {
      // Arrange
      const inputDto: LoginDto = {
        email: 'engineer@company.com',
        password: 'SecurePassword123!',
      };
      mockUser.twoFactorEnabled = true;
      mockUser.twoFactorSecret = 'MOCK_SECRET';
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      // Act
      const actualResult = await service.login(inputDto, '127.0.0.1');

      // Assert
      expect(actualResult).toEqual({
        require2fa: true,
        tempToken: 'mock-temp-2fa-token',
        message: 'Password verified. Please enter the 6-digit TOTP code from your authenticator app.',
      });
      expect(mockLoginRateLimiter.resetAttempts).toHaveBeenCalledWith('engineer@company.com');
    });

    it('should return access and refresh tokens on valid credentials and reset Redis attempts', async () => {
      // Arrange
      const inputDto: LoginDto = {
        email: 'engineer@company.com',
        password: 'SecurePassword123!',
      };
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      // Act
      const actualResult = await service.login(inputDto, '127.0.0.1');

      // Assert
      expect(actualResult).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });
      expect(mockLoginRateLimiter.resetAttempts).toHaveBeenCalledWith('engineer@company.com');
    });
  });
});
