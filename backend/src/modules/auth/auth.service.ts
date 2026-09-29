import { Injectable } from '@nestjs/common';
import { LocalAuthService } from './services/local-auth.service.js';
import { TwoFactorAuthService } from './services/two-factor-auth.service.js';
import { PasswordResetService } from './services/password-reset.service.js';
import { TokenSessionService, type AuthTokens } from './services/token-session.service.js';
import { OAuthService, type GitHubProfile } from './services/oauth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { Verify2faDto, Enable2faDto } from './dto/verify-2fa.dto.js';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto.js';
import { SetPasswordDto } from './dto/set-password.dto.js';
import { User, OAuthProvider, SystemRole } from '../users/entities/user.entity.js';

export { AuthTokens };

/**
 * Authentication Service Facade.
 * Coordinates domain subservices adhering to Clean Architecture and Single Responsibility:
 * - LocalAuthService (Password policy, Argon2id, lockout, activation)
 * - TwoFactorAuthService (TOTP generation, QR code, 2FA challenge & verification)
 * - PasswordResetService (Tokenized password recovery, password updates)
 * - TokenSessionService (JWT token generation, refresh, session invalidation)
 * - OAuthService (GitHub, Google, and mock OAuth federation)
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly localAuthService: LocalAuthService,
    private readonly twoFactorAuthService: TwoFactorAuthService,
    private readonly passwordResetService: PasswordResetService,
    private readonly tokenSessionService: TokenSessionService,
    private readonly oauthService: OAuthService,
  ) {}

  async register(dto: RegisterDto, ipAddress: string) {
    return this.localAuthService.register(dto, ipAddress);
  }

  async activateAccount(token: string) {
    return this.localAuthService.activateAccount(token);
  }

  async login(dto: LoginDto, ipAddress: string, userAgent?: string) {
    return this.localAuthService.login(dto, ipAddress, userAgent);
  }

  async refreshTokens(refreshToken: string) {
    return this.tokenSessionService.refreshTokens(refreshToken);
  }

  async generate2faSecret(user: User | string) {
    return this.twoFactorAuthService.generate2faSecret(user);
  }

  async enable2fa(user: User, dto: Enable2faDto) {
    return this.twoFactorAuthService.enable2fa(user, dto);
  }

  async disable2fa(user: User, dto?: Enable2faDto) {
    return this.twoFactorAuthService.disable2fa(user, dto);
  }

  async verify2fa(dto: Verify2faDto, ipAddress: string, userAgent?: string) {
    return this.twoFactorAuthService.verify2fa(dto, ipAddress, userAgent);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    return this.passwordResetService.forgotPassword(dto);
  }

  async resetPassword(dto: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(dto);
  }

  async setPassword(user: User, dto: SetPasswordDto, ip?: string, userAgent?: string) {
    return this.passwordResetService.setPassword(user, dto, ip, userAgent);
  }

  async validateOrCreateOAuthUser(profileOrDto: {
    provider?: OAuthProvider;
    oauthId?: string;
    email: string;
    fullName?: string;
    avatarUrl?: string;
    systemRole?: SystemRole;
  }) {
    return this.oauthService.validateOrCreateOAuthUser(profileOrDto);
  }

  async loginOAuthUser(user: User, ipAddress: string, userAgent?: string) {
    return this.oauthService.loginOAuthUser(user, ipAddress, userAgent);
  }

  async handleGitHubLogin(profile: GitHubProfile, ipAddress: string) {
    return this.oauthService.handleGitHubLogin(profile, ipAddress);
  }

  async logout(userId: number) {
    return this.tokenSessionService.logout(userId);
  }

  async logoutByToken(token?: string) {
    return this.tokenSessionService.logoutByToken(token);
  }
}
