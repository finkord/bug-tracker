import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service.js';
import { User, OAuthProvider } from '../../users/entities/user.entity.js';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID =
      configService?.get<string>?.('GITHUB_CLIENT_ID') || process.env.GITHUB_CLIENT_ID || '';
    const clientSecret =
      configService?.get<string>?.('GITHUB_CLIENT_SECRET') || process.env.GITHUB_CLIENT_SECRET || '';
    const callbackURL =
      configService?.get<string>?.('GITHUB_CALLBACK_URL') ||
      process.env.GITHUB_CALLBACK_URL ||
      '';

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: unknown, user?: User | false, info?: unknown) => void,
  ): Promise<User | void> {
    try {
      const email =
        profile.emails?.[0]?.value || `${profile.username || profile.id}@github.local`;
      const fullName = profile.displayName || profile.username || 'GitHub User';
      const oauthId = profile.id;

      const user = await this.authService.validateOrCreateOAuthUser({
        provider: OAuthProvider.GITHUB,
        oauthId,
        email,
        fullName,
      });

      done(null, user);
    } catch (err) {
      done(err, false);
    }
  }
}
