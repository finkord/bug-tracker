import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, SystemRole, OAuthProvider } from '../../users/entities/user.entity.js';
import { UsersService } from '../../users/users.service.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  token_type?: string;
  expires_in?: number;
  user: {
    id: number;
    fullName: string;
    email: string;
    systemRole: SystemRole;
    jobTitle?: string | null;
    avatarUrl?: string | null;
    groups?: string[];
    isAdmin?: boolean;
    isActivated: boolean;
    isBlocked: boolean;
    twoFactorEnabled: boolean;
    oauthProvider: OAuthProvider;
    hasPassword: boolean;
  };
}

@Injectable()
export class TokenSessionService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Generates short-lived JWT Access Token (15 minutes) and Refresh Token (7 days) with Zero-Trust claims
   * and RFC 6749 OAuth 2.0 compliant response format.
   */
  async generateTokens(user: User): Promise<AuthTokens> {
    const isAdmin = user.systemRole === SystemRole.ADMIN;
    const roleStr = user.systemRole ? user.systemRole.toLowerCase() : 'user';
    const groups = [roleStr, 'all-users'];

    const basePayload = {
      sub: user.id,
      email: user.email,
      role: user.systemRole,
      groups,
      isAdmin,
      tokenVersion: user.tokenVersion || 0,
    };

    const accessExpiresIn =
      (this.configService.get<string>('JWT_EXPIRES_IN', '15m') as unknown as import('jsonwebtoken').SignOptions['expiresIn']) ||
      '15m';
    const refreshExpiresIn =
      (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as unknown as import('jsonwebtoken').SignOptions['expiresIn']) ||
      '7d';

    const accessSecret = this.configService.get<string>(
      'JWT_SECRET',
      'super_secret_jwt_access_key_change_in_production_min_32_chars',
    );
    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'super_secret_jwt_refresh_key_change_in_production_min_32_chars',
    );

    // Cryptographic secret separation and token typing (OWASP & RFC 6749)
    const accessToken = this.jwtService.sign(
      { ...basePayload, token_type: 'access' },
      { secret: accessSecret, expiresIn: accessExpiresIn },
    );
    const refreshToken = this.jwtService.sign(
      { ...basePayload, token_type: 'refresh' },
      { secret: refreshSecret, expiresIn: refreshExpiresIn },
    );

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900,
      token_type: 'Bearer',
      expires_in: 900,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        systemRole: user.systemRole,
        jobTitle: user.jobTitle,
        avatarUrl: user.avatarUrl,
        groups,
        isAdmin,
        isActivated: user.isActivated,
        isBlocked: user.isBlocked,
        twoFactorEnabled: user.twoFactorEnabled,
        oauthProvider: user.oauthProvider,
        hasPassword: Boolean(user.passwordHash),
      },
    };
  }

  /**
   * Refreshes JWT tokens using a valid refresh token verified with JWT_REFRESH_SECRET.
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const refreshSecret = this.configService.get<string>(
        'JWT_REFRESH_SECRET',
        'super_secret_jwt_refresh_key_change_in_production_min_32_chars',
      );

      const payload = this.jwtService.verify<{
        sub: number;
        tokenVersion?: number;
        token_type?: string;
      }>(refreshToken, {
        secret: refreshSecret,
      });

      // Prevent token substitution / confusion attacks
      if (payload.token_type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user || user.isBlocked) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      if (user.tokenVersion !== undefined && payload.tokenVersion !== user.tokenVersion) {
        throw new UnauthorizedException('Session has been revoked. Please sign in again.');
      }

      return await this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Invalidates all active user sessions by bumping tokenVersion (Zero-Trust session management).
   */
  async logout(userId: number): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);
    if (user) {
      await this.usersService.update(userId, {
        tokenVersion: (user.tokenVersion || 0) + 1,
      });
    }
    return { message: 'Successfully logged out' };
  }

  /**
   * Gracefully invalidates user sessions by token or userId without throwing errors.
   */
  async logoutByToken(token?: string): Promise<{ message: string }> {
    if (token) {
      try {
        const decoded = this.jwtService.decode(token) as { sub?: number } | null;
        if (decoded?.sub) {
          return await this.logout(decoded.sub);
        }
      } catch {
        // Token could not be decoded, proceed gracefully
      }
    }
    return { message: 'Successfully logged out' };
  }
}
