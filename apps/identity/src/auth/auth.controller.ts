import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
import { ChangePasswordDto } from './dto/account.dto';
import {
  AuthResponseDto,
  MessageResponseDto,
  RegistrationResponseDto,
  SessionListResponseDto,
  UserEnvelopeResponseDto,
} from './dto/response.dto';
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
  @ApiResponse({ status: 201, type: RegistrationResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input or password policy failure' })
  @ApiResponse({ status: 409, description: 'Email address or phone number is already registered' })
  async register(@Body() dto: RegisterDto, @Req() request: Request): Promise<RegistrationResponse> {
    return this.auth.register(dto, requestMeta(request));
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with an email address or phone number' })
  @ApiResponse({ status: 200, type: AuthResponseDto, description: 'Refresh token is set in an HttpOnly cookie' })
  @ApiResponse({ status: 401, description: 'Credentials are invalid' })
  @ApiResponse({ status: 403, description: 'Account is unverified or inactive' })
  @ApiResponse({ status: 429, description: 'Login rate limit reached' })
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
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Refresh token is invalid, expired, or was reused' })
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
  @ApiResponse({ status: 204, description: 'Current refresh session revoked and cookie cleared' })
  async logout(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.auth.logout(request.cookies?.[REFRESH_COOKIE_NAME], requestMeta(request));
    response.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions(this.environment));
  }

  @RequirePermissions('auth.sessions.manage')
  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke every active refresh session for the authenticated account' })
  @ApiResponse({ status: 204, description: 'All refresh sessions revoked and cookie cleared' })
  async logoutAll(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.auth.logoutAll(user.id, requestMeta(request));
    response.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions(this.environment));
  }

  @RequirePermissions('auth.sessions.manage')
  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active sessions for the authenticated account' })
  @ApiResponse({ status: 200, type: SessionListResponseDto })
  async sessions(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithCookies,
  ) {
    return { sessions: await this.auth.listSessions(user.id, request.cookies?.[REFRESH_COOKIE_NAME]) };
  }

  @RequirePermissions('auth.sessions.manage')
  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke one active session owned by the authenticated account' })
  @ApiResponse({ status: 204, description: 'The owned session was revoked' })
  @ApiResponse({ status: 400, description: 'Session id is not a UUID' })
  async revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const result = await this.auth.revokeSession(
      user.id,
      sessionId,
      request.cookies?.[REFRESH_COOKIE_NAME],
      requestMeta(request),
    );
    if (result.current) {
      response.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions(this.environment));
    }
  }

  @RequirePermissions('auth.profile.update')
  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change the authenticated account password and revoke all sessions' })
  @ApiResponse({ status: 204, description: 'Password changed; all refresh sessions revoked' })
  @ApiResponse({ status: 400, description: 'Password confirmation or policy validation failed' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.auth.changePassword(
      user.id,
      dto.currentPassword,
      dto.password,
      dto.passwordConfirmation,
      requestMeta(request),
    );
    response.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions(this.environment));
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify an email address using the emailed one-time code' })
  @ApiResponse({ status: 200, description: 'Email address verified' })
  @ApiResponse({ status: 400, description: 'Code is invalid, expired, or already used' })
  async verifyEmail(@Body() dto: VerifyEmailDto, @Req() request: Request): Promise<{ verified: true }> {
    await this.auth.verifyEmail(dto.email, dto.code, requestMeta(request));
    return { verified: true };
  }

  @Public()
  @Post('resend-email-verification')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request another verification email without disclosing account state' })
  @ApiResponse({ status: 202, type: MessageResponseDto })
  @ApiResponse({ status: 429, description: 'Resend limit reached' })
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
  @ApiResponse({ status: 202, type: MessageResponseDto })
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
  @ApiResponse({ status: 200, description: 'Password reset completed' })
  @ApiResponse({ status: 400, description: 'Reset token is invalid, expired, or already used' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Read the authenticated account summary' })
  @ApiResponse({ status: 200, type: UserEnvelopeResponseDto })
  async me(@CurrentUser() user: AuthenticatedUser): Promise<{ user: UserSummary }> {
    return { user: await this.auth.getMe(user.id) };
  }

  @RequirePermissions('auth.sessions.manage')
  @Post('phone/request')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a phone verification code to the current account' })
  @ApiResponse({ status: 202, description: 'Phone verification request accepted' })
  @ApiResponse({ status: 503, description: 'No SMS provider is available' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify the current account phone number' })
  @ApiResponse({ status: 200, type: UserEnvelopeResponseDto })
  @ApiResponse({ status: 400, description: 'Code is invalid, expired, or attempts are exhausted' })
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
