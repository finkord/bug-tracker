import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  Res,
  Ip,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  Delete,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { Verify2faDto, Enable2faDto } from './dto/verify-2fa.dto.js';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto.js';
import { SetPasswordDto } from './dto/set-password.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { User } from '../users/entities/user.entity.js';
import { OAuthCodeStoreService } from './services/oauth-code-store.service.js';
import { SecurityAuditService } from '../security-audit/security-audit.service.js';
import type { AuthTokens } from './services/token-session.service.js';

interface OAuthAuthenticatedRequest extends Request {
  user?: User;
}

const ACCESS_TOKEN_COOKIE_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes (aligned with JWT access token lifespan)
const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@ApiTags('Authentication & Security')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly oauthCodeStore: OAuthCodeStoreService,
    private readonly securityAuditService: SecurityAuditService,
  ) {}

  private setAuthCookies(res: Response, tokens: Partial<AuthTokens>): void {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    if (tokens.accessToken) {
      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE_MS,
      });
    }
    if (tokens.refreshToken) {
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
      });
    }
  }

  private clearAuthCookies(res: Response): void {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    });
  }

  @Post('register')
  @ApiOperation({
    summary: 'Register new user account',
    description:
      'Validates complex password policy, verifies CAPTCHA token, and dispatches email activation link.',
  })
  async register(@Body() dto: RegisterDto, @Ip() ip: string) {
    return this.authService.register(dto, ip);
  }

  @Get('activate')
  @ApiOperation({
    summary: 'Activate account via email link',
    description: 'Validates single-use activation token sent via email and activates account.',
  })
  @ApiQuery({ name: 'token', required: true, type: String })
  async activate(@Query('token') token: string) {
    return this.authService.activateAccount(token);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User authentication with Brute-Force protection',
    description:
      'Authenticates user. Locks account after 5 failed attempts for 15 minutes. Prompts for 2FA if enabled.',
  })
  async login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
    @Headers('user-agent') userAgent?: string,
  ) {
    const result = await this.authService.login(dto, ip, userAgent);
    if ('accessToken' in result && typeof result.accessToken === 'string') {
      this.setAuthCookies(res, result);
    }
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh JWT access token using valid refresh token',
    description: 'Issues a fresh 15-minute access token without requiring user to re-enter credentials.',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body('refreshToken') bodyRefreshToken?: string,
  ) {
    const cookieRefreshToken = (req.cookies as Record<string, string> | undefined)?.refreshToken;
    const tokenToUse = bodyRefreshToken || cookieRefreshToken;
    if (!tokenToUse) {
      throw new BadRequestException('Refresh token is required');
    }
    const tokens = await this.authService.refreshTokens(tokenToUse);
    this.setAuthCookies(res, tokens);
    return tokens;
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify 2FA TOTP code to complete login',
    description:
      'Validates 6-digit passcode against user secret and returns final JWT access/refresh tokens.',
  })
  async verify2fa(
    @Body() dto: Verify2faDto,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
    @Headers('user-agent') userAgent?: string,
  ) {
    const tokens = await this.authService.verify2fa(dto, ip, userAgent);
    this.setAuthCookies(res, tokens);
    return tokens;
  }

  @Post('2fa/generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Generate 2FA secret and QR code',
    description:
      'Returns a base32 TOTP secret and data URL QR code to scan with Google Authenticator or Authy.',
  })
  async generate2fa(@CurrentUser() user: User) {
    return this.authService.generate2faSecret(user);
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Confirm and enable 2FA on account',
  })
  async enable2fa(@CurrentUser() user: User, @Body() dto: Enable2faDto) {
    return this.authService.enable2fa(user, dto);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Disable 2FA on account',
  })
  async disable2fa(@CurrentUser() user: User, @Body() dto: Enable2faDto) {
    return this.authService.disable2fa(user, dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset email',
    description:
      'Dispatches an email containing a 15-minute cryptographic reset token to the user.',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set new password using reset token',
    description:
      'Enforces strict password policy on new password and resets account lockout status.',
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('set-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set or update account password (supports adding password to OAuth accounts)',
    description:
      'Allows accounts created via OAuth to establish an Argon2id password, or existing password users to update theirs.',
  })
  async setPassword(
    @CurrentUser() user: User,
    @Body() dto: SetPasswordDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.setPassword(user, dto, ip, userAgent);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({
    summary: 'Initiate GitHub OAuth2 Login',
    description: 'Redirects browser to GitHub for federated identity authentication.',
  })
  async githubLogin() {
    // Handled automatically by Passport GitHub strategy redirect
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({
    summary: 'GitHub OAuth2 callback endpoint',
    description:
      'Processes the authorization code from GitHub, issues a short-lived one-time exchange code, and redirects the browser to the frontend. The frontend then POSTs /auth/oauth/exchange to retrieve the actual JWT tokens — tokens never appear in URLs or server logs.',
  })
  async githubCallback(
    @Req() req: OAuthAuthenticatedRequest,
    @Res() res: Response,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    try {
      if (!req.user) {
        throw new BadRequestException('GitHub authenticated user payload not found');
      }
      const tokens = await this.authService.loginOAuthUser(req.user, ip, userAgent);
      const code = await this.oauthCodeStore.createCode(tokens);
      return res.redirect(`${frontendUrl}/oauth/callback?code=${code}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'GitHub authentication failed';
      return res.redirect(`${frontendUrl}/oauth/callback?error=${encodeURIComponent(message)}`);
    }
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Initiate Google OAuth2 Login',
    description: 'Redirects browser to Google for federated identity authentication.',
  })
  async googleLogin() {
    // Handled automatically by Passport Google strategy redirect
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Google OAuth2 callback endpoint',
    description:
      'Processes the authorization code from Google, issues a short-lived one-time exchange code, and redirects the browser to the frontend. The frontend then POSTs /auth/oauth/exchange to retrieve the actual JWT tokens — tokens never appear in URLs or server logs.',
  })
  async googleCallback(
    @Req() req: OAuthAuthenticatedRequest,
    @Res() res: Response,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    try {
      if (!req.user) {
        throw new BadRequestException('Google authenticated user payload not found');
      }
      const tokens = await this.authService.loginOAuthUser(req.user, ip, userAgent);
      const code = await this.oauthCodeStore.createCode(tokens);
      return res.redirect(`${frontendUrl}/oauth/callback?code=${code}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google authentication failed';
      return res.redirect(`${frontendUrl}/oauth/callback?error=${encodeURIComponent(message)}`);
    }
  }

  @Post('oauth/exchange')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exchange one-time OAuth code for JWT tokens',
    description:
      'Accepts the short-lived code issued after a successful OAuth redirect and returns the JWT access and refresh tokens. The code is single-use and expires after 60 seconds.',
  })
  async exchangeOAuthCode(
    @Body('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!code || typeof code !== 'string') {
      throw new BadRequestException('OAuth exchange code is required');
    }
    const tokens = await this.oauthCodeStore.consumeCode(code);
    if (!tokens) {
      throw new NotFoundException('OAuth exchange code is invalid or has already been used');
    }
    this.setAuthCookies(res, tokens);
    return tokens;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout user and invalidate session',
    description: 'Acknowledges user logout, clears auth cookies, and invalidates server-side session context.',
  })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.clearAuthCookies(res);
    const authHeader = req.headers['authorization'];
    const bearerToken =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : undefined;
    const cookieToken = (req.cookies as Record<string, string> | undefined)?.accessToken;
    const token = bearerToken || cookieToken;

    return this.authService.logoutByToken(token);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get active device sessions for current user',
    description: 'Returns device sessions with device footprint, browser/OS deduction, and active device indicator.',
  })
  async getMySessions(
    @CurrentUser() user: User,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.securityAuditService.getUserSessions(user.id, ip, userAgent);
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Revoke a specific device session',
  })
  async revokeSession(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.securityAuditService.revokeSession(user.id, id);
  }

  @Post('sessions/revoke-others')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Revoke all other device sessions except current one',
  })
  async revokeOtherSessions(
    @CurrentUser() user: User,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.securityAuditService.revokeOtherSessions(user.id, ip, userAgent);
  }
}
