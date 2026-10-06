import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import crypto from 'node:crypto';
import * as argon2 from 'argon2';
import { UsersService } from '../../users/users.service.js';
import { SecurityAuditService } from '../../security-audit/security-audit.service.js';
import { CaptchaService } from '../../captcha/captcha.service.js';
import { RedisService } from '../../redis/redis.service.js';
import { SystemRole, OAuthProvider } from '../../users/entities/user.entity.js';
import { LoginAttemptStatus } from '../../security-audit/entities/login-audit-log.entity.js';
import { RegisterDto } from '../dto/register.dto.js';
import { LoginDto } from '../dto/login.dto.js';
import { TokenSessionService, type AuthTokens } from './token-session.service.js';
import { TwoFactorAuthService } from './two-factor-auth.service.js';
import { LoginRateLimiterService } from './login-rate-limiter.service.js';
import { ARGON2_OPTIONS } from '../constants/argon2.constants.js';

@Injectable()
export class LocalAuthService {
  private readonly logger = new Logger(LocalAuthService.name);
  private static readonly ACTIVATION_DEDUP_TTL_SECONDS = 300; // 5 minutes

  constructor(
    private readonly usersService: UsersService,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly securityAuditService: SecurityAuditService,
    private readonly captchaService: CaptchaService,
    private readonly tokenSessionService: TokenSessionService,
    private readonly twoFactorAuthService: TwoFactorAuthService,
    private readonly loginRateLimiter: LoginRateLimiterService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Registers a new user with complex password policy, CAPTCHA, and email activation link.
   * Utilizes RFC 9106 / OWASP recommended Argon2id parameters to avoid thread pool starvation.
   */
  async register(dto: RegisterDto, ipAddress: string) {
    const isCaptchaValid = await this.captchaService.validateToken(
      dto.captchaToken,
      ipAddress,
      'signup',
    );
    if (!isCaptchaValid) {
      throw new BadRequestException('Security verification failed: Invalid or expired CAPTCHA code.');
    }

    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('An account with this email address already exists.');
    }

    const passwordHash = await argon2.hash(dto.password, ARGON2_OPTIONS);

    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newUser = await this.usersService.create({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
      systemRole: SystemRole.USER,
      jobTitle: 'Software Engineer',
      isActivated: false,
      activationToken,
      activationTokenExpiresAt,
      oauthProvider: OAuthProvider.LOCAL,
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const activationUrl = `${frontendUrl}/activate?token=${activationToken}`;

    const textContent = `Hello ${newUser.fullName},

Welcome to BugTracker! Please activate your account by clicking the link below or copying it into your browser:

${activationUrl}

This activation link will expire in 24 hours.

If you did not sign up for a BugTracker account, please disregard this email.

Best regards,
The BugTracker Team`;

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Activate Your BugTracker Account</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="margin-bottom: 24px; text-align: center;">
      <h1 style="color: #4f46e5; font-size: 24px; font-weight: 800; margin: 0 0 8px;">BugTracker</h1>
      <p style="color: #64748b; font-size: 14px; margin: 0;">Enterprise Project Management</p>
    </div>
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 12px;">Confirm your email address</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 16px;">
        Hi <strong>${newUser.fullName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 24px;">
        Thank you for creating an account on BugTracker. Please click the button below to activate your account and access your workspace.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${activationUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 32px; border-radius: 9999px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);">
          Activate Account
        </a>
      </div>
      <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 0 0 8px;">
        Or copy and paste this link into your browser:
      </p>
      <p style="font-size: 12px; line-height: 1.5; color: #4f46e5; word-break: break-all; margin: 0 0 24px;">
        ${activationUrl}
      </p>
      <p style="font-size: 12px; color: #94a3b8; margin: 0;">
        This activation link expires in 24 hours. If you did not create this account, no further action is required.
      </p>
    </div>
  </div>
</body>
</html>`;

    try {
      await this.mailerService.sendMail({
        to: newUser.email,
        subject: 'Activate Your BugTracker Account',
        text: textContent,
        html: htmlContent,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to send activation email to ${newUser.email}: ${message}`);
    }

    await this.securityAuditService.recordLoginAttempt({
      userId: newUser.id,
      attemptedEmail: newUser.email,
      ipAddress,
      status: LoginAttemptStatus.SUCCESS,
      failureReason: 'Account created; activation email dispatched',
    });

    return {
      message: 'Account created successfully! Please check your email to activate your account.',
      userId: newUser.id,
      email: newUser.email,
    };
  }

  /**
   * Activates an account using single-use email token with distributed Redis deduplication.
   */
  async activateAccount(token: string) {
    const activationKey = `auth:activation:${token}`;
    const isRecentlyActivated = await this.redisService.get(activationKey);
    if (isRecentlyActivated) {
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

    await this.redisService.set(activationKey, '1', LocalAuthService.ACTIVATION_DEDUP_TTL_SECONDS);

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
   * Authenticates user with distributed Redis brute-force protection and optional 2FA challenge.
   * Eliminates database row lock contention by delegating failed attempts to Redis sliding window.
   */
  async login(
    dto: LoginDto,
    ipAddress: string,
    userAgent?: string,
  ): Promise<AuthTokens | { require2fa: true; tempToken: string; message: string }> {
    const user = await this.usersService.findByEmail(dto.email);

    // 1. User not found
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

    // 2. Blocked by administrator
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

    // 3. Brute-force lockout active via Redis sliding window (zero database row lock contention)
    const lockoutStatus = await this.loginRateLimiter.isLocked(dto.email);
    if (lockoutStatus.isLocked) {
      await this.securityAuditService.recordLoginAttempt({
        userId: user.id,
        attemptedEmail: dto.email,
        ipAddress,
        userAgent,
        status: LoginAttemptStatus.ACCOUNT_LOCKED,
        failureReason: `Account locked. Remaining seconds: ${lockoutStatus.remainingSeconds}`,
      });
      throw new UnauthorizedException(
        `Account is temporarily locked due to multiple failed login attempts. Try again in ${lockoutStatus.remainingSeconds} seconds.`,
      );
    }

    // Legacy fallback check for database lockout timestamps created prior to Redis migration
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

    // 4. Verify password hash using Argon2id
    let isPasswordValid = false;
    if (user.passwordHash) {
      try {
        isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
      } catch {
        isPasswordValid = false;
      }
    }

    if (!isPasswordValid) {
      const failedResult = await this.loginRateLimiter.recordFailedAttempt(dto.email);

      await this.securityAuditService.recordLoginAttempt({
        userId: user.id,
        attemptedEmail: dto.email,
        ipAddress,
        userAgent,
        status: failedResult.isLocked ? LoginAttemptStatus.ACCOUNT_LOCKED : LoginAttemptStatus.FAILED_PASSWORD,
        failureReason: failedResult.isLocked
          ? 'Exceeded 5 failed attempts. Account locked for 15 minutes.'
          : `Failed password attempt ${failedResult.attempts}/5`,
      });

      if (failedResult.isLocked) {
        throw new UnauthorizedException(
          'Account has been temporarily locked for 15 minutes due to 5 consecutive failed login attempts.',
        );
      }

      throw new UnauthorizedException('Invalid email or password');
    }

    // 5. Successful password: reset lockout counters in Redis
    await this.loginRateLimiter.resetAttempts(dto.email);

    // Clean up legacy database counters if present
    if ((user.failedLoginAttempts && user.failedLoginAttempts > 0) || user.lockedUntil) {
      await this.usersService.update(user.id, {
        failedLoginAttempts: 0,
        lockedUntil: null,
      });
    }

    // 6. Check activation status
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

    // 7. Handle 2FA Challenge
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      await this.securityAuditService.recordLoginAttempt({
        userId: user.id,
        attemptedEmail: dto.email,
        ipAddress,
        userAgent,
        status: LoginAttemptStatus.REQUIRE_2FA,
        failureReason: 'Password verified; waiting for 2FA TOTP code',
      });

      const tempToken = this.twoFactorAuthService.createChallengeToken(user.id, user.email);

      return {
        require2fa: true,
        tempToken,
        message: 'Password verified. Please enter the 6-digit TOTP code from your authenticator app.',
      };
    }

    // 8. Successful login
    await this.securityAuditService.recordLoginAttempt({
      userId: user.id,
      attemptedEmail: dto.email,
      ipAddress,
      userAgent,
      status: LoginAttemptStatus.SUCCESS,
      failureReason: null,
    });

    return await this.tokenSessionService.generateTokens(user);
  }
}
