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
import { User, SystemRole, OAuthProvider } from '../../users/entities/user.entity.js';
import { LoginAttemptStatus } from '../../security-audit/entities/login-audit-log.entity.js';
import { RegisterDto } from '../dto/register.dto.js';
import { LoginDto } from '../dto/login.dto.js';
import { TokenSessionService, type AuthTokens } from './token-session.service.js';
import { TwoFactorAuthService } from './two-factor-auth.service.js';

@Injectable()
export class LocalAuthService {
  private readonly logger = new Logger(LocalAuthService.name);
  private readonly recentlyActivatedTokens = new Map<string, number>();

  constructor(
    private readonly usersService: UsersService,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly securityAuditService: SecurityAuditService,
    private readonly captchaService: CaptchaService,
    private readonly tokenSessionService: TokenSessionService,
    private readonly twoFactorAuthService: TwoFactorAuthService,
  ) {}

  /**
   * Registers a new user with complex password policy, CAPTCHA, and email activation link.
   */
  async register(dto: RegisterDto, ipAddress: string) {
    if (dto.captchaToken) {
      const isCaptchaValid = await this.captchaService.validateToken(dto.captchaToken, ipAddress);
      if (!isCaptchaValid) {
        throw new BadRequestException('Security verification failed: Invalid or expired CAPTCHA code.');
      }
    }

    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('An account with this email address already exists.');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

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

    try {
      await this.mailerService.sendMail({
        to: newUser.email,
        subject: 'Activate Your BugTracker Account',
        template: 'activation',
        context: {
          fullName: newUser.fullName,
          activationUrl,
          expiresInHours: 24,
        },
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
   * Activates an account using single-use email token.
   */
  async activateAccount(token: string) {
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

    this.recentlyActivatedTokens.set(token, Date.now());

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
   * Authenticates user with brute-force protection and optional 2FA challenge.
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

    // 2. Blocked by admin
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

    // 3. Brute-force lockout active
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
      const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
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

    // 5. Successful password: reset lockout counters
    await this.usersService.update(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

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
