import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { requestMeta } from '../common/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '../common/auth.types';
import { AuthService, type RegistrationResponse } from './auth.service';
import type { AuthResponse, UserSummary } from './auth.types';
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from './auth-cookie';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  ForgotPasswordDto,
  ResendEmailVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
  VerifyPhoneDto,
} from './dto/verification.dto';
import type { IdentityEnvironment } from '../environment';
import { IDENTITY_ENVIRONMENT } from '../environment.provider';

type RequestWithCookies = Request & { cookies?: Record<string, string> };

@ApiTags('authentication')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(IDENTITY_ENVIRONMENT) private readonly environment: IdentityEnvironment,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a customer account and start contact verification' })
  async register(@Body() dto: RegisterDto, @Req() request: Request): Promise<RegistrationResponse> {
    return this.auth.register(dto, requestMeta(request));
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with an email address or phone number' })
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const result = await this.auth.login(dto, requestMeta(request));
    this.setRefreshCookie(response, result.refreshToken);
    return result.auth;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate the refresh session and issue a new access token' })
  async refresh(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const token = request.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) {
      throw new UnauthorizedException({
        code: 'SESSION_INVALID',
        message: 'Your session is invalid or has expired. Sign in again.',
      });
    }
    const result = await this.auth.refresh(token, requestMeta(request));
    this.setRefreshCookie(response, result.refreshToken);
    return result.auth;
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the current refresh session' })
  async logout(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.auth.logout(request.cookies?.[REFRESH_COOKIE_NAME], requestMeta(request));
    response.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions(this.environment));
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify an email address using the emailed token' })
  async verifyEmail(@Body() dto: VerifyEmailDto, @Req() request: Request): Promise<{ verified: true }> {
    await this.auth.verifyEmail(dto.token, requestMeta(request));
    return { verified: true };
  }

  @Public()
  @Post('resend-email-verification')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request another verification email without disclosing account state' })
  async resendEmailVerification(
    @Body() dto: ResendEmailVerificationDto,
    @Req() request: Request,
  ): Promise<{ message: string }> {
    await this.auth.resendEmailVerification(dto.email, requestMeta(request));
    return {
      message: 'If that address belongs to an unverified account, a new verification email is on its way.',
    };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request a password reset without disclosing account state' })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Req() request: Request,
  ): Promise<{ message: string }> {
    await this.auth.forgotPassword(dto.email, requestMeta(request));
    return {
      message: 'If that address belongs to an account, password reset instructions are on their way.',
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete a password reset and revoke existing sessions' })
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() request: Request): Promise<{ reset: true }> {
    await this.auth.resetPassword(
      dto.token,
      dto.password,
      dto.passwordConfirmation,
      requestMeta(request),
    );
    return { reset: true };
  }

  @RequirePermissions('auth.profile.read')
  @Get('me')
  @ApiOperation({ summary: 'Read the authenticated account summary' })
  async me(@CurrentUser() user: AuthenticatedUser): Promise<{ user: UserSummary }> {
    return { user: await this.auth.getMe(user.id) };
  }

  @RequirePermissions('auth.sessions.manage')
  @Post('phone/request')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send a phone verification code to the current account' })
  async requestPhoneVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ): Promise<{ sent: true }> {
    await this.auth.requestPhoneVerification(user.id, requestMeta(request));
    return { sent: true };
  }

  @RequirePermissions('auth.sessions.manage')
  @Post('phone/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify the current account phone number' })
  async verifyPhone(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyPhoneDto,
    @Req() request: Request,
  ): Promise<{ user: UserSummary }> {
    return { user: await this.auth.verifyPhone(user.id, dto.code, requestMeta(request)) };
  }

  private setRefreshCookie(response: Response, token: string): void {
    response.cookie(REFRESH_COOKIE_NAME, token, {
      ...refreshCookieOptions(this.environment),
      maxAge: this.environment.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    });
  }
}
