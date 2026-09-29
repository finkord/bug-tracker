import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import crypto from 'node:crypto';
import * as argon2 from 'argon2';
import { UsersService } from '../../users/users.service.js';
import { SecurityAuditService } from '../../security-audit/security-audit.service.js';
import { LoginAttemptStatus } from '../../security-audit/entities/login-audit-log.entity.js';
import { ForgotPasswordDto, ResetPasswordDto } from '../dto/password-reset.dto.js';
import { SetPasswordDto } from '../dto/set-password.dto.js';
import { User } from '../../users/entities/user.entity.js';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly mailerService: MailerService,
    private readonly securityAuditService: SecurityAuditService,
  ) {}

  /**
   * Dispatches password recovery link with time-limited single-use token (SDSecurity Task 7).
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

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'BugTracker Password Reset Request',
        template: 'password-reset',
        context: {
          fullName: user.fullName,
          resetUrl,
          expiresInMinutes: 60,
        },
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
   * Resets password using valid single-use token (SDSecurity Task 7).
   */
  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByResetPasswordToken(dto.token);
    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    if (user.resetPasswordExpiresAt && user.resetPasswordExpiresAt < new Date()) {
      throw new BadRequestException('Password reset token has expired. Please request a new one.');
    }

    const passwordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // Revoke previous sessions by bumping tokenVersion & clear lockout counters
    await this.usersService.update(user.id, {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpiresAt: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      tokenVersion: (user.tokenVersion || 0) + 1,
    });

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

    const passwordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

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
