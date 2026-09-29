import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { LocalAuthService } from './services/local-auth.service.js';
import { TwoFactorAuthService } from './services/two-factor-auth.service.js';
import { PasswordResetService } from './services/password-reset.service.js';
import { TokenSessionService } from './services/token-session.service.js';
import { OAuthService } from './services/oauth.service.js';
import { OAuthCodeStoreService } from './services/oauth-code-store.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { GithubStrategy } from './strategies/github.strategy.js';
import { GoogleStrategy } from './strategies/google.strategy.js';
import { UsersModule } from '../users/users.module.js';
import { SecurityAuditModule } from '../security-audit/security-audit.module.js';
import { CaptchaModule } from '../captcha/captcha.module.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(
          'JWT_SECRET',
          'super_secret_jwt_access_key_change_in_production_min_32_chars',
        ),
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN', '8h') as unknown as import('jsonwebtoken').SignOptions['expiresIn']),
        },
      }),
    }),
    UsersModule,
    SecurityAuditModule,
    CaptchaModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalAuthService,
    TwoFactorAuthService,
    PasswordResetService,
    TokenSessionService,
    OAuthService,
    OAuthCodeStoreService,
    JwtStrategy,
    GithubStrategy,
    GoogleStrategy,
  ],
  exports: [
    AuthService,
    LocalAuthService,
    TwoFactorAuthService,
    PasswordResetService,
    TokenSessionService,
    OAuthService,
    OAuthCodeStoreService,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}
