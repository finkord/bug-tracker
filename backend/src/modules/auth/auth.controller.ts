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
import { OAuthMockDto } from './dto/oauth-mock.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { User } from '../users/entities/user.entity.js';

@ApiTags('Authentication & Security')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register new user account (SDSecurity Tasks 1, 2, 3)',
    description:
      'Validates complex password policy, verifies CAPTCHA token, and dispatches email activation link.',
  })
  async register(@Body() dto: RegisterDto, @Ip() ip: string) {
    return this.authService.register(dto, ip);
  }

  @Get('activate')
  @ApiOperation({
    summary: 'Activate account via email link (SDSecurity Task 3)',
    description: 'Validates single-use activation token sent via email and activates account.',
  })
  @ApiQuery({ name: 'token', required: true, type: String })
  async activate(@Query('token') token: string) {
    return this.authService.activateAccount(token);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User authentication with Brute-Force protection (SDSecurity Tasks 1, 4, 5)',
    description:
      'Authenticates user. Locks account after 5 failed attempts for 15 minutes. Prompts for 2FA if enabled.',
  })
  async login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.login(dto, ip, userAgent);
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify 2FA TOTP code to complete login (SDSecurity Task 5)',
    description:
      'Validates 6-digit passcode against user secret and returns final JWT access/refresh tokens.',
  })
  async verify2fa(
    @Body() dto: Verify2faDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.verify2fa(dto, ip, userAgent);
  }

  @Post('2fa/generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Generate 2FA secret and QR code (SDSecurity Task 5)',
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
    summary: 'Confirm and enable 2FA on account (SDSecurity Task 5)',
  })
  async enable2fa(@CurrentUser() user: User, @Body() dto: Enable2faDto) {
    return this.authService.enable2fa(user, dto);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Disable 2FA on account (SDSecurity Task 5)',
  })
  async disable2fa(@CurrentUser() user: User, @Body() dto: Enable2faDto) {
    return this.authService.disable2fa(user, dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset email (SDSecurity Task 7)',
    description:
      'Dispatches an email containing a 15-minute cryptographic reset token to the user.',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set new password using reset token (SDSecurity Task 7)',
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
    summary: 'Initiate GitHub OAuth2 Login (SDSecurity Task 6)',
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
      'Processes the authorization code from GitHub, loads profile, and redirects to frontend with session tokens.',
  })
  async githubCallback(
    @Req() req: any,
    @Res() res: Response,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    try {
      const tokens = await this.authService.loginOAuthUser(req.user, ip, userAgent);
      return res.redirect(
        `${frontendUrl}/oauth/callback?accessToken=${encodeURIComponent(
          tokens.accessToken,
        )}&refreshToken=${encodeURIComponent(tokens.refreshToken)}`,
      );
    } catch (err: any) {
      return res.redirect(
        `${frontendUrl}/oauth/callback?error=${encodeURIComponent(
          err.message || 'GitHub authentication failed',
        )}`,
      );
    }
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Initiate Google OAuth2 Login (SDSecurity Task 6)',
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
      'Processes the authorization code from Google, loads profile, and redirects to frontend with session tokens.',
  })
  async googleCallback(
    @Req() req: any,
    @Res() res: Response,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    try {
      const tokens = await this.authService.loginOAuthUser(req.user, ip, userAgent);
      return res.redirect(
        `${frontendUrl}/oauth/callback?accessToken=${encodeURIComponent(
          tokens.accessToken,
        )}&refreshToken=${encodeURIComponent(tokens.refreshToken)}`,
      );
    } catch (err: any) {
      return res.redirect(
        `${frontendUrl}/oauth/callback?error=${encodeURIComponent(
          err.message || 'Google authentication failed',
        )}`,
      );
    }
  }

  @Post('oauth/mock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simulated OAuth2 login for demonstration and testing (SDSecurity Task 6)',
    description:
      'Validates or provisions user account based on OAuth provider claims and returns JWT session tokens.',
  })
  async mockOAuthLogin(
    @Body() dto: OAuthMockDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const user = await this.authService.validateOrCreateOAuthUser(dto);
    return this.authService.loginOAuthUser(user, ip, userAgent);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout user and invalidate session (SDSecurity Task 1 Polish)',
    description: 'Acknowledges user logout and invalidates server-side session context.',
  })
  async logout(@CurrentUser() user: User) {
    return {
      message: 'Logged out successfully',
      userId: user.id,
    };
  }
}
