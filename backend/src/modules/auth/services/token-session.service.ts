import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, SystemRole, OAuthProvider } from '../../users/entities/user.entity.js';
import { UsersService } from '../../users/users.service.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
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
   * Generates JWT Access Token (8 hours) and Refresh Token (7 days) with Zero-Trust claims.
   */
  async generateTokens(user: User): Promise<AuthTokens> {
    const isAdmin = user.systemRole === SystemRole.ADMIN;
    const groups = [user.systemRole.toLowerCase(), 'all-users'];

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.systemRole,
      groups,
      isAdmin,
      tokenVersion: user.tokenVersion || 0,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '8h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
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
   * Refreshes JWT tokens using a valid refresh token.
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>(
          'JWT_SECRET',
          'super_secret_jwt_access_key_change_in_production_min_32_chars',
        ),
      });

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
