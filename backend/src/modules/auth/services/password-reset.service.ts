import { Injectable, BadRequestException, UnauthorizedException, Logger, Optional } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import crypto from 'node:crypto';
import * as argon2 from 'argon2';
import { UsersService } from '../../users/users.service.js';
import { SecurityAuditService } from '../../security-audit/security-audit.service.js';
import { LoginAttemptStatus } from '../../security-audit/entities/login-audit-log.entity.js';
import { ForgotPasswordDto, ResetPasswordDto } from '../dto/password-reset.dto.js';
import { SetPasswordDto } from '../dto/set-password.dto.js';
import { User } from '../../users/entities/user.entity.js';
import { ARGON2_OPTIONS } from '../constants/argon2.constants.js';
import { LoginRateLimiterService } from './login-rate-limiter.service.js';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly mailerService: MailerService,
    private readonly securityAuditService: SecurityAuditService,
    @Optional()
    private readonly loginRateLimiter?: LoginRateLimiterService,
  ) {}

  /**
   * Dispatches password recovery link with time-limited single-use token.
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // Anti-enumeration security: return generic success message
      return { message: 'If an account exists with this email, a recovery link has been sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    await this.usersService.update(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpiresAt: resetExpiresAt,
    });

    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;

    const textContent = `Hello ${user.fullName},

We received a request to reset your BugTracker account password. Click the link below or copy it into your browser to choose a new password:

${resetUrl}

This link is valid for 60 minutes.

If you did not request a password reset, you can safely ignore this email.

Best regards,
The BugTracker Team`;

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>BugTracker Password Reset Request</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="margin-bottom: 24px; text-align: center;">
      <h1 style="color: #4f46e5; font-size: 24px; font-weight: 800; margin: 0 0 8px;">BugTracker</h1>
      <p style="color: #64748b; font-size: 14px; margin: 0;">Enterprise Project Management</p>
    </div>
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 12px;">Reset your password</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 16px;">
        Hi <strong>${user.fullName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 24px;">
        We received a request to reset your BugTracker account password. Click the button below to set a new password.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 32px; border-radius: 9999px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);">
          Reset Password
        </a>
      </div>
      <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 0 0 8px;">
        Or copy and paste this link into your browser:
      </p>
      <p style="font-size: 12px; line-height: 1.5; color: #4f46e5; word-break: break-all; margin: 0 0 24px;">
        ${resetUrl}
      </p>
      <p style="font-size: 12px; color: #94a3b8; margin: 0;">
        This password reset link is valid for 60 minutes. If you did not request a password reset, you can safely ignore this email.
      </p>
    </div>
  </div>
</body>
</html>`;

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'BugTracker Password Reset Request',
        text: textContent,
        html: htmlContent,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to send password reset email to ${user.email}: ${message}`);
    }

    return {
      message: 'If an account exists with this email, a recovery link has been sent.',
    };
  }

  /**
   * Resets password using valid single-use token.
   */
  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByResetPasswordToken(dto.token);
    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    if (user.resetPasswordExpiresAt && user.resetPasswordExpiresAt < new Date()) {
      throw new BadRequestException('Password reset token has expired. Please request a new one.');
    }

    const passwordHash = await argon2.hash(dto.newPassword, ARGON2_OPTIONS);

    // Revoke previous sessions by bumping tokenVersion & clear lockout counters
    await this.usersService.update(user.id, {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpiresAt: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      tokenVersion: (user.tokenVersion || 0) + 1,
    });

    if (this.loginRateLimiter) {
      await this.loginRateLimiter.resetAttempts(user.email);
    }

    return { message: 'Password has been successfully updated. You can now sign in with your new password.' };
  }

  /**
   * Sets or updates password for logged-in user (supports adding password to OAuth accounts).
   */
  async setPassword(
    userOrId: User | number,
    dto: SetPasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const userId = typeof userOrId === 'number' ? userOrId : userOrId.id;
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const newPassword = dto.newPassword || dto.password;
    if (!newPassword) {
      throw new BadRequestException('New password is required');
    }

    if (user.passwordHash) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Current password is required to change password');
      }
      const isCurrentValid = await argon2.verify(user.passwordHash, dto.currentPassword);
      if (!isCurrentValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
    }

    const passwordHash = await argon2.hash(newPassword, ARGON2_OPTIONS);

    await this.usersService.update(userId, {
      passwordHash,
      tokenVersion: (user.tokenVersion || 0) + 1,
    });

    if (ipAddress) {
      await this.securityAuditService.recordLoginAttempt({
        userId: user.id,
        attemptedEmail: user.email,
        ipAddress,
        userAgent,
        status: LoginAttemptStatus.SUCCESS,
        failureReason: 'Password changed successfully',
      });
    }

    return { message: 'Password has been successfully updated.' };
  }
}
