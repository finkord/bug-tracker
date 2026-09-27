import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { UsersService } from '../../users/users.service.js';
import { SystemRole, OAuthProvider, User } from '../../users/entities/user.entity.js';
import { TokenSessionService, type AuthTokens } from './token-session.service.js';
import { SecurityAuditService } from '../../security-audit/security-audit.service.js';
import { LoginAttemptStatus } from '../../security-audit/entities/login-audit-log.entity.js';
import { OAuthMockDto } from '../dto/oauth-mock.dto.js';

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly tokenSessionService: TokenSessionService,
    private readonly securityAuditService: SecurityAuditService,
  ) {}

  /**
   * Validates or provisions a user account based on OAuth provider claims (SDSecurity Task 6).
   */
  async validateOrCreateOAuthUser(profileOrDto: {
    provider?: OAuthProvider;
    oauthId?: string;
    email: string;
    fullName?: string;
    avatarUrl?: string;
    systemRole?: SystemRole;
  }): Promise<User> {
    const email = profileOrDto.email;
    let user = await this.usersService.findByEmail(email);

    if (user) {
      if (user.isBlocked) {
        throw new UnauthorizedException('This account has been blocked by an administrator.');
      }

      await this.usersService.update(user.id, {
        oauthProvider: profileOrDto.provider || OAuthProvider.GITHUB,
        oauthId: profileOrDto.oauthId ? String(profileOrDto.oauthId) : user.oauthId,
        avatarUrl: profileOrDto.avatarUrl || user.avatarUrl,
        isActivated: true,
      });

      return (await this.usersService.findById(user.id)) as User;
    }

    user = await this.usersService.create({
      email,
      fullName: profileOrDto.fullName || email.split('@')[0],
      systemRole: profileOrDto.systemRole || SystemRole.DEVELOPER,
      oauthProvider: profileOrDto.provider || OAuthProvider.GITHUB,
      oauthId: profileOrDto.oauthId ? String(profileOrDto.oauthId) : 'oauth-id',
      avatarUrl: profileOrDto.avatarUrl || null,
      isActivated: true,
    });

    return user;
  }

  /**
   * Completes OAuth user login, records audit event, and returns JWT tokens.
   */
  async loginOAuthUser(
    user: User,
    ipAddress: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    if (user.isBlocked) {
      await this.securityAuditService.recordLoginAttempt({
        userId: user.id,
        attemptedEmail: user.email,
        ipAddress,
        userAgent,
        status: LoginAttemptStatus.BLOCKED_BY_ADMIN,
        failureReason: 'OAuth login blocked by administrator',
      });
      throw new UnauthorizedException('This account has been blocked by an administrator.');
    }

    await this.securityAuditService.recordLoginAttempt({
      userId: user.id,
      attemptedEmail: user.email,
      ipAddress,
      userAgent,
      status: LoginAttemptStatus.SUCCESS,
      failureReason: 'OAuth federated authentication successful',
    });

    return await this.tokenSessionService.generateTokens(user);
  }

  /**
   * Handles GitHub OAuth profile login.
   */
  async handleGitHubLogin(
    profile: {
      id: string;
      username: string;
      displayName?: string;
      emails?: Array<{ value: string }>;
      photos?: Array<{ value: string }>;
    },
    ipAddress: string,
  ): Promise<AuthTokens> {
    const email = profile.emails?.[0]?.value || `${profile.username.toLowerCase()}@github.local`;
    const fullName = profile.displayName || profile.username;
    const avatarUrl = profile.photos?.[0]?.value || undefined;

    const user = await this.validateOrCreateOAuthUser({
      provider: OAuthProvider.GITHUB,
      oauthId: profile.id,
      email,
      fullName,
      avatarUrl,
    });

    return await this.loginOAuthUser(user, ipAddress);
  }

  /**
   * Mock OAuth2 authentication for testing and demo.
   */
  async handleMockOAuth(dto: OAuthMockDto, ipAddress: string): Promise<AuthTokens> {
    const user = await this.validateOrCreateOAuthUser({
      provider: dto.provider || OAuthProvider.GITHUB,
      oauthId: dto.oauthId || 'mock-id-123',
      email: dto.email,
      fullName: dto.fullName || 'OAuth User',
    });

    return await this.loginOAuthUser(user, ipAddress);
  }
}
