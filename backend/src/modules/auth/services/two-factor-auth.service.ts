import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import { UsersService } from '../../users/users.service.js';
import { SecurityAuditService } from '../../security-audit/security-audit.service.js';
import { LoginAttemptStatus } from '../../security-audit/entities/login-audit-log.entity.js';
import { TokenSessionService, type AuthTokens } from './token-session.service.js';
import { Verify2faDto, Enable2faDto } from '../dto/verify-2fa.dto.js';
import { User } from '../../users/entities/user.entity.js';

@Injectable()
export class TwoFactorAuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly securityAuditService: SecurityAuditService,
    private readonly tokenSessionService: TokenSessionService,
  ) {}

  /**
   * Generates a new TOTP secret and QR code data URL for 2FA onboarding (SDSecurity Task 5).
   */
  async generate2faSecret(userOrEmail: User | string) {
    const email = typeof userOrEmail === 'string' ? userOrEmail : userOrEmail.email;
    const userId = typeof userOrEmail === 'object' && userOrEmail?.id ? userOrEmail.id : null;

    const secret = generateSecret();
    const otpAuthUrl = generateURI({
      issuer: 'BugTracker',
      label: email,
      secret,
    });

    const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    if (userId) {
      await this.usersService.update(userId, {
        twoFactorPendingSecret: secret,
      });
    }

    return {
      secret,
      otpAuthUrl,
      otpauthUrl: otpAuthUrl,
      qrCodeUrl,
      qrCodeDataUrl: qrCodeUrl,
    };
  }

  /**
   * Enables 2FA for the user after confirming a valid TOTP code (SDSecurity Task 5).
   */
  async enable2fa(user: User, dto: Enable2faDto) {
    const code = dto.code || (dto as any).totpCode;
    if (!code) {
      throw new BadRequestException('6-digit verification code is required');
    }

    const latestUser = (await this.usersService.findById(user.id)) || user;
    const secret = dto.secret || latestUser.twoFactorPendingSecret || latestUser.twoFactorSecret;
    if (!secret) {
      throw new BadRequestException('Two-factor secret is missing. Please generate a QR code first.');
    }

    const isValid = verifySync({ token: code, secret });
    if (!isValid) {
      throw new BadRequestException('Invalid 6-digit TOTP verification code');
    }

    await this.usersService.update(user.id, {
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      twoFactorPendingSecret: null,
    });

    return {
      message: 'Two-factor authentication successfully enabled',
      twoFactorEnabled: true,
    };
  }

  /**
   * Disables 2FA on the user account (SDSecurity Task 5).
   */
  async disable2fa(user: User, _dto?: Enable2faDto) {
    await this.usersService.update(user.id, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorPendingSecret: null,
    });

    return {
      message: 'Two-factor authentication disabled',
      twoFactorEnabled: false,
    };
  }

  /**
   * Creates a time-bounded 5-minute 2FA challenge token.
   */
  createChallengeToken(userId: number, email: string): string {
    return this.jwtService.sign(
      { sub: userId, email, is2faPending: true, tokenType: '2fa_challenge' },
      { expiresIn: '5m' },
    );
  }

  /**
   * Verifies the 6-digit 2FA code during login to issue full JWT tokens (SDSecurity Task 5).
   */
  async verify2fa(
    dto: Verify2faDto,
    ipAddress: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    let payload: any;
    try {
      payload = this.jwtService.verify(dto.tempToken);
    } catch {
      throw new UnauthorizedException('2FA challenge session expired. Please sign in again.');
    }

    if (!payload.is2faPending || payload.tokenType !== '2fa_challenge') {
      throw new UnauthorizedException('Invalid 2FA challenge token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException('2FA configuration error for this account');
    }

    const isValid = verifySync({
      token: dto.code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      await this.securityAuditService.recordLoginAttempt({
        userId: user.id,
        attemptedEmail: user.email,
        ipAddress,
        userAgent,
        status: LoginAttemptStatus.TWO_FACTOR_FAILED,
        failureReason: 'Invalid 6-digit TOTP code provided',
      });
      throw new UnauthorizedException('Invalid 6-digit authentication code');
    }

    await this.securityAuditService.recordLoginAttempt({
      userId: user.id,
      attemptedEmail: user.email,
      ipAddress,
      userAgent,
      status: LoginAttemptStatus.TWO_FACTOR_SUCCESS,
      failureReason: null,
    });

    return await this.tokenSessionService.generateTokens(user);
  }
}
