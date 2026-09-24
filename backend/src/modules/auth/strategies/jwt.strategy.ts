import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service.js';
import { User } from '../../users/entities/user.entity.js';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  is2faPending?: boolean;
  tokenType?: string;
  tokenVersion?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_SECRET',
        'super_secret_jwt_access_key_change_in_production_min_32_chars',
      ),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    // 1. Immediately reject temporary 2FA challenge tokens to prevent 2FA bypass
    if (payload.is2faPending || payload.tokenType === '2fa_challenge') {
      throw new UnauthorizedException(
        'Two-factor authentication challenge pending. Please complete 2FA verification.',
      );
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User account no longer exists');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('Account has been blocked by administrator');
    }

    if (!user.isActivated) {
      throw new UnauthorizedException('Account has not been activated via email');
    }

    // 2. Validate session token version to support instant revocation on logout and password reset
    if (
      typeof payload.tokenVersion === 'number' &&
      typeof user.tokenVersion === 'number' &&
      payload.tokenVersion < user.tokenVersion
    ) {
      throw new UnauthorizedException('Session has been revoked. Please sign in again.');
    }

    return user;
  }
}
