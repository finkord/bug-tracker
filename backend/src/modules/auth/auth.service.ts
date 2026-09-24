import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import crypto from 'node:crypto';
import * as argon2 from 'argon2';
import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';

import { UsersService } from '../users/users.service.js';
import { SecurityAuditService } from '../security-audit/security-audit.service.js';
import { CaptchaService } from '../captcha/captcha.service.js';
import { User, SystemRole, OAuthProvider } from '../users/entities/user.entity.js';
import { LoginAttemptStatus } from '../security-audit/entities/login-audit-log.entity.js';

import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { Verify2faDto, Enable2faDto } from './dto/verify-2fa.dto.js';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto.js';
import { SetPasswordDto } from './dto/set-password.dto.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    systemRole: SystemRole;
    isActivated: boolean;
    isBlocked: boolean;
    twoFactorEnabled: boolean;
    oauthProvider: OAuthProvider;
    hasPassword: boolean;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  // Cache of recently activated tokens to gracefully handle duplicate requests and double-clicks
  private readonly recentlyActivatedTokens = new Map<string, number>();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
    private readonly securityAuditService: SecurityAuditService,
    private readonly captchaService: CaptchaService,
  ) {}

  /**
   * Registers a new user account with complex password policies and CAPTCHA (SDSecurity Tasks 1, 2, 3).
   */
  async register(dto: RegisterDto, ipAddress: string): Promise<{ message: string }> {
    // 1. Validate CAPTCHA (SDSecurity Task 2)
    const isCaptchaValid = await this.captchaService.validateToken(dto.captchaToken, ipAddress);
    if (!isCaptchaValid) {
      throw new BadRequestException('CAPTCHA verification failed. Please try again.');
    }

    // 2. Check if email is already registered
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('An account with this email address already exists');
    }

    // 3. Hash password using Argon2id (SDSecurity Task 1)
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });

    // 4. Generate single-use, time-limited activation token (SDSecurity Task 3)
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours TTL

    // First registered user becomes ADMIN, subsequent users receive standard USER role
    const { total } = await this.usersService.findAll(1, 1);
    const systemRole = total === 0 ? SystemRole.ADMIN : SystemRole.USER;

    const newUser = await this.usersService.create({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
      systemRole,
      isActivated: false,
      activationToken,
      activationTokenExpiresAt: activationExpiresAt,
      failedLoginAttempts: 0,
      isBlocked: false,
    });

    // 5. Dispatch activation email with token link via Mailpit (SDSecurity Task 3)
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const activationUrl = `${frontendUrl}/activate?token=${activationToken}`;
    try {
      await this.mailerService.sendMail({
        to: newUser.email,
        subject: 'Activate Your Bug Tracker Account',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Welcome to Bug / Issue Tracker!</h2>
            <p>Hello ${newUser.fullName},</p>
            <p>Thank you for registering. Please click the button below to activate your account:</p>
            <p style="margin: 24px 0;">
              <a href="${activationUrl}" style="background-color: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Activate Account
              </a>
            </p>
            <p>Or copy this link to your browser:</p>
            <p><code>${activationUrl}</code></p>
            <p>This single-use link expires in 24 hours.</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send activation email: ${(error as Error).message}`);
    }

    return {
      message: 'Registration successful! An activation link has been sent to your email address.',
    };
  }

  /**
   * Activates a registered user account via the cryptographic token (SDSecurity Task 3).
   */
  async activateAccount(token: string): Promise<{ message: string; isActivated: boolean }> {
    // 1. Return success if token was activated very recently (graceful idempotency for React StrictMode / duplicate calls)
    const recentActivationTime = this.recentlyActivatedTokens.get(token);
    if (recentActivationTime && Date.now() - recentActivationTime < 5 * 60 * 1000) {
      return {
        message: 'Account successfully activated! You can now log into the system.',
        isActivated: true,
      };
    }

    const user = await this.usersService.findByActivationToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired activation token');
    }

    if (user.activationTokenExpiresAt && user.activationTokenExpiresAt < new Date()) {
      throw new BadRequestException('Activation token has expired. Please request a new one.');
    }

    // Record token in cache to handle duplicate or concurrent requests smoothly
    this.recentlyActivatedTokens.set(token, Date.now());
    if (this.recentlyActivatedTokens.size > 1000) {
      const cutoff = Date.now() - 10 * 60 * 1000;
      for (const [key, timestamp] of this.recentlyActivatedTokens.entries()) {
        if (timestamp < cutoff) {
          this.recentlyActivatedTokens.delete(key);
        }
      }
    }

    await this.usersService.update(user.id, {
      isActivated: true,
      activationToken: null,
      activationTokenExpiresAt: null,
    });

    return {
      message: 'Account successfully activated! You can now log into the system.',
      isActivated: true,
    };
  }

  /**
   * Authenticates user with brute-force protection and optional 2FA challenge (SDSecurity Tasks 1, 4, 5).
   */
  async login(
    dto: LoginDto,
    ipAddress: string,
    userAgent?: string,
  ): Promise<AuthTokens | { require2fa: true; tempToken: string; message: string }> {
    const user = await this.usersService.findByEmail(dto.email);

    // 1. Handle user not found
    if (!user) {
      await this.securityAuditService.recordLoginAttempt({
        attemptedEmail: dto.email,
        ipAddress,
        userAgent,
        status: LoginAttemptStatus.USER_NOT_FOUND,
        failureReason: 'Account does not exist',
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    // 2. Check if account is blocked by administrator (SDSecurity Task 4)
    if (user.isBlocked) {
      await this.securityAuditService.recordLoginAttempt({
        userId: user.id,
        attemptedEmail: dto.email,
        ipAddress,
        userAgent,
        status: LoginAttemptStatus.BLOCKED_BY_ADMIN,
        failureReason: 'Account is blocked by administrator',
      });
      throw new UnauthorizedException('This account has been blocked by an administrator.');
    }

    // 3. Check brute-force lockout status (SDSecurity Task 4)
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingSeconds = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
      await this.securityAuditService.recordLoginAttempt({
        userId: user.id,
        attemptedEmail: dto.email,
        ipAddress,
        userAgent,
        status: LoginAttemptStatus.ACCOUNT_LOCKED,
        failureReason: `Account locked. Remaining seconds: ${remainingSeconds}`,
      });
      throw new UnauthorizedException(
        `Account is temporarily locked due to multiple failed login attempts. Try again in ${remainingSeconds} seconds.`,
      );
    }

    // 4. Verify password hash using Argon2id / bcrypt
    let isPasswordValid = false;
    if (user.passwordHash) {
      try {
        isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
      } catch {
        isPasswordValid = false;
      }
    }

    if (!isPasswordValid) {
      const newFailedAttempts = user.failedLoginAttempts + 1;
      const shouldLock = newFailedAttempts >= 5;
      const lockDurationMs = 15 * 60 * 1000; // 15 minutes lockout
      const lockedUntil = shouldLock ? new Date(Date.now() + lockDurationMs) : null;

      await this.usersService.update(user.id, {
        failedLoginAttempts: newFailedAttempts,
        lockedUntil,
      });

      await this.securityAuditService.recordLoginAttempt({
        userId: user.id,
        attemptedEmail: dto.email,
        ipAddress,
        userAgent,
        status: shouldLock ? LoginAttemptStatus.ACCOUNT_LOCKED : LoginAttemptStatus.FAILED_PASSWORD,
        failureReason: shouldLock
          ? 'Exceeded 5 failed attempts. Account locked for 15 minutes.'
          : `Failed password attempt ${newFailedAttempts}/5`,
      });

      if (shouldLock) {
        throw new UnauthorizedException(
          'Account has been temporarily locked for 15 minutes due to 5 consecutive failed login attempts.',
        );
      }

      throw new UnauthorizedException('Invalid email or password');
    }

    // 5. Successful password verification: reset lockout counters
    await this.usersService.update(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    // 6. Verify account activation status via email verification link (SDSecurity Task 3)
    if (!user.isActivated) {
      await this.securityAuditService.recordLoginAttempt({
        userId: user.id,
        attemptedEmail: dto.email,
        ipAddress,
        userAgent,
        status: LoginAttemptStatus.NOT_ACTIVATED,
        failureReason: 'Account has not been activated via email verification link',
      });
      throw new UnauthorizedException(
        'Your account has not been activated yet. Please check your email for the activation link.',
      );
    }

    // 7. Handle Two-Factor Authentication (2FA) Challenge (SDSecurity Task 5)
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      await this.securityAuditService.recordLoginAttempt({
        userId: user.id,
        attemptedEmail: dto.email,
        ipAddress,
        userAgent,
        status: LoginAttemptStatus.REQUIRE_2FA,
        failureReason: 'Password verified; waiting for 2FA TOTP code',
      });

      const tempToken = this.jwtService.sign(
        { sub: user.id, email: user.email, is2faPending: true },
        { expiresIn: '5m' },
      );

      return {
        require2fa: true,
        tempToken,
        message: 'Password verified. Please enter the 6-digit TOTP code from your authenticator app.',
      };
    }

    // 8. Successful login without 2FA
    await this.securityAuditService.recordLoginAttempt({
      userId: user.id,
      attemptedEmail: dto.email,
      ipAddress,
      userAgent,
      status: LoginAttemptStatus.SUCCESS,
      failureReason: null,
    });

    return this.generateTokens(user);
  }

  /**
   * Verifies the 6-digit 2FA TOTP code and completes authentication (SDSecurity Task 5).
   */
  async verify2fa(dto: Verify2faDto, ipAddress: string, userAgent?: string): Promise<AuthTokens> {
    let payload: { sub: number; is2faPending?: boolean };
    try {
      payload = this.jwtService.verify(dto.tempToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired 2FA challenge token. Please log in again.');
    }

    if (!payload.is2faPending) {
      throw new UnauthorizedException('Invalid challenge token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException('Two-factor authentication is not configured for this user');
    }

    if (!user.isActivated) {
      throw new UnauthorizedException('Your account has not been activated yet.');
    }

    const isCodeValid = verifySync({ secret: user.twoFactorSecret, token: dto.code }).valid;
    if (!isCodeValid) {
      await this.securityAuditService.recordLoginAttempt({
        userId: user.id,
        attemptedEmail: user.email,
        ipAddress,
        userAgent,
        status: LoginAttemptStatus.TWO_FACTOR_FAILED,
        failureReason: 'Invalid 6-digit TOTP passcode',
      });
      throw new UnauthorizedException('Invalid two-factor authentication code');
    }

    await this.securityAuditService.recordLoginAttempt({
      userId: user.id,
      attemptedEmail: user.email,
      ipAddress,
      userAgent,
      status: LoginAttemptStatus.TWO_FACTOR_SUCCESS,
      failureReason: null,
    });

    return this.generateTokens(user);
  }

  /**
   * Generates a new TOTP secret and QR code for configuring Google Authenticator/Authy (SDSecurity Task 5).
   */
  async generate2faSecret(user: User): Promise<{ secret: string; qrCodeDataUrl: string }> {
    const secret = generateSecret();
    const appName = this.configService.get<string>('TWO_FACTOR_APP_NAME', 'BugTracker-PPofSE');
    const otpAuthUrl = generateURI({ issuer: appName, label: user.email, secret });
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    // Save temporary secret until confirmed by the user
    await this.usersService.update(user.id, { twoFactorSecret: secret });

    return { secret, qrCodeDataUrl };
  }

  /**
   * Confirms and activates 2FA on the user account (SDSecurity Task 5).
   */
  async enable2fa(user: User, dto: Enable2faDto): Promise<{ message: string; twoFactorEnabled: boolean }> {
    const freshUser = await this.usersService.findById(user.id);
    if (!freshUser || !freshUser.twoFactorSecret) {
      throw new BadRequestException('Please generate a 2FA secret before enabling it');
    }

    const isValid = verifySync({ secret: freshUser.twoFactorSecret, token: dto.code }).valid;
    if (!isValid) {
      throw new BadRequestException('Invalid confirmation code. Verify that your device clock is synchronized.');
    }

    await this.usersService.update(user.id, { twoFactorEnabled: true });
    return {
      message: 'Two-factor authentication has been successfully enabled for your account.',
      twoFactorEnabled: true,
    };
  }

  /**
   * Disables 2FA on the user account after code verification (SDSecurity Task 5).
   */
  async disable2fa(user: User, dto: Enable2faDto): Promise<{ message: string; twoFactorEnabled: boolean }> {
    const freshUser = await this.usersService.findById(user.id);
    if (!freshUser || !freshUser.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication is not active');
    }

    const isValid = verifySync({ secret: freshUser.twoFactorSecret, token: dto.code }).valid;
    if (!isValid) {
      throw new BadRequestException('Invalid confirmation code');
    }

    await this.usersService.update(user.id, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });

    return {
      message: 'Two-factor authentication has been disabled.',
      twoFactorEnabled: false,
    };
  }

  /**
   * Initiates password recovery by generating a time-limited token and sending email (SDSecurity Task 7).
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // For security, do not disclose whether user exists
      return {
        message: 'If an account exists with this email address, a password reset link has been dispatched.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes TTL

    await this.usersService.update(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpiresAt: resetExpiresAt,
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Password Reset Request</h2>
            <p>Hello ${user.fullName},</p>
            <p>We received a request to reset your password. Click the button below to proceed:</p>
            <p style="margin: 24px 0;">
              <a href="${resetUrl}" style="background-color: #dc2626; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Reset Password
              </a>
            </p>
            <p>Or use this token directly in your request:</p>
            <p><code>${resetToken}</code></p>
            <p>This link is valid for 15 minutes.</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send password reset email: ${(error as Error).message}`);
    }

    return {
      message: 'If an account exists with this email address, a password reset link has been dispatched.',
    };
  }

  /**
   * Resets account password with new complex password policy (SDSecurity Task 7).
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByResetPasswordToken(dto.token);
    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    if (user.resetPasswordExpiresAt && user.resetPasswordExpiresAt < new Date()) {
      throw new BadRequestException('Password reset token has expired. Please request a new one.');
    }

    const passwordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    await this.usersService.update(user.id, {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpiresAt: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    return { message: 'Your password has been successfully updated. You can now log in.' };
  }

  /**
   * Sets or updates user password (supports adding password to OAuth accounts or changing existing password).
   */
  async setPassword(
    user: User,
    dto: SetPasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ message: string; hasPassword: boolean }> {
    // If account already has a password set, currentPassword is required and verified
    if (user.passwordHash) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Current password is required to change your password');
      }
      const isCurrentValid = await argon2.verify(user.passwordHash, dto.currentPassword);
      if (!isCurrentValid) {
        throw new BadRequestException('Current password does not match');
      }
    }

    const passwordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    await this.usersService.update(user.id, {
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    await this.securityAuditService.recordLoginAttempt({
      userId: user.id,
      attemptedEmail: user.email,
      ipAddress: ipAddress || '::1',
      userAgent,
      status: LoginAttemptStatus.SUCCESS,
      failureReason: user.passwordHash
        ? 'Password updated successfully'
        : 'Password established for OAuth account',
    });

    return {
      message: user.passwordHash
        ? 'Your password has been successfully updated.'
        : 'Password has been set for your account. You can now log in using either OAuth or your email and password.',
      hasPassword: true,
    };
  }

  /**
   * Validates existing OAuth user or provisions new account (SDSecurity Task 6).
   */
  async validateOrCreateOAuthUser(details: {
    provider: OAuthProvider;
    oauthId: string;
    email: string;
    fullName: string;
  }): Promise<User> {
    let user = await this.usersService.findByOAuthId(details.provider, details.oauthId);
    if (!user) {
      user = await this.usersService.findByEmail(details.email);
      if (user) {
        await this.usersService.update(user.id, {
          oauthProvider: details.provider,
          oauthId: details.oauthId,
          isActivated: true,
        });
        user = await this.usersService.findById(user.id);
      } else {
        user = await this.usersService.createOAuthUser({
          email: details.email,
          fullName: details.fullName,
          oauthProvider: details.provider,
          oauthId: details.oauthId,
          isActivated: true,
        });
      }
    }

    if (user && user.isBlocked) {
      throw new UnauthorizedException('Account has been blocked by administrator');
    }

    return user!;
  }

  /**
   * Completes login for authenticated OAuth user and records audit log (SDSecurity Task 6).
   */
  async loginOAuthUser(user: User, ipAddress?: string, userAgent?: string): Promise<AuthTokens> {
    await this.securityAuditService.recordLoginAttempt({
      userId: user.id,
      attemptedEmail: user.email,
      ipAddress: ipAddress || '::1',
      userAgent,
      status: LoginAttemptStatus.SUCCESS,
      failureReason: `OAuth2 Authentication via ${user.oauthProvider}`,
    });

    return this.generateTokens(user);
  }

  /**
   * Generates JWT access and refresh token pair.
   */
  
  /**
   * Refreshes JWT access token using a valid refresh token.
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>(
          'JWT_REFRESH_SECRET',
          'super_secret_jwt_refresh_key_change_in_production_min_32_chars',
        ),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user || user.isBlocked || !user.isActivated) {
        throw new UnauthorizedException('User account invalid, blocked or inactive.');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token. Please sign in again.');
    }
  }

  private generateTokens(user: User): AuthTokens {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.systemRole,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN', '8h') as any),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>(
        'JWT_REFRESH_SECRET',
        'super_secret_jwt_refresh_key_change_in_production_min_32_chars',
      ),
      expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        systemRole: user.systemRole,
        isActivated: user.isActivated,
        isBlocked: user.isBlocked,
        twoFactorEnabled: user.twoFactorEnabled,
        oauthProvider: user.oauthProvider || OAuthProvider.LOCAL,
        hasPassword: !!user.passwordHash,
      },
    };
  }
}
