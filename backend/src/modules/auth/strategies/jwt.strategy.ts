import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service.js';
import { RedisService } from '../../redis/redis.service.js';
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
  private readonly logger = new Logger(JwtStrategy.name);
  private static readonly SESSION_CACHE_TTL_SECONDS = 300; // 5 minutes
  private static readonly SESSION_PREFIX = 'user:session:';

  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request): string | null => {
          return (req?.cookies as Record<string, string> | undefined)?.accessToken ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey:
        configService?.get<string>?.('JWT_SECRET') ||
        process.env.JWT_SECRET ||
        'super_secret_jwt_access_key_change_in_production_min_32_chars',
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    // 1. Immediately reject temporary 2FA challenge tokens to prevent 2FA bypass
    if (payload.is2faPending || payload.tokenType === '2fa_challenge') {
      throw new UnauthorizedException(
        'Two-factor authentication challenge pending. Please complete 2FA verification.',
      );
    }

    const sessionKey = `${JwtStrategy.SESSION_PREFIX}${payload.sub}`;
    let user: User | null = null;

    // 2. Fast Redis session cache lookup to prevent hitting PostgreSQL on every request
    const cachedUserJson = await this.redisService.get(sessionKey);
    if (cachedUserJson) {
      try {
        user = JSON.parse(cachedUserJson) as User;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Failed to parse cached session for user ${payload.sub}: ${message}`);
        user = null;
      }
    }

    // 3. Fallback to database on cache miss or cache deserialization error
    if (!user) {
      user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User account no longer exists');
      }

      // Cache user session in Redis only if active and valid
      if (!user.isBlocked && user.isActivated) {
        await this.redisService.set(
          sessionKey,
          JSON.stringify(user),
          JwtStrategy.SESSION_CACHE_TTL_SECONDS,
        );
      }
    }

    // 4. Validate administrative status and activation
    if (user.isBlocked) {
      throw new UnauthorizedException('Account has been blocked by administrator');
    }

    if (!user.isActivated) {
      throw new UnauthorizedException('Account has not been activated via email');
    }

    // 5. Validate session token version to support instant revocation on logout and password reset
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
