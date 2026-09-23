import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service.js';
import { OAuthProvider } from '../../users/entities/user.entity.js';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID', 'dev_google_client_id'),
      clientSecret: configService.get<string>(
        'GOOGLE_CLIENT_SECRET',
        'dev_google_client_secret',
      ),
      callbackURL: configService.get<string>(
        'GOOGLE_CALLBACK_URL',
        'http://localhost:3000/api/v1/auth/google/callback',
      ),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const email = profile.emails?.[0]?.value || `${profile.id}@google.local`;
      const fullName = profile.displayName || profile.name?.givenName || 'Google User';
      const oauthId = profile.id;

      const user = await this.authService.validateOrCreateOAuthUser({
        provider: OAuthProvider.GOOGLE,
        oauthId,
        email,
        fullName,
      });

      done(null, user);
    } catch (err) {
      done(err as Error, false);
    }
  }
}
