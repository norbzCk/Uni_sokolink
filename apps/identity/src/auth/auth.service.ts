import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, type RoleName } from '@prisma/client';
import type { RequestMeta } from '../common/auth.types';
import type { IdentityEnvironment } from '../environment';
import { IDENTITY_ENVIRONMENT } from '../environment.provider';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthResponse, UserSummary } from './auth.types';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuditService } from './services/audit.service';
import { PasswordService } from './services/password.service';
import { RateLimitService } from './services/rate-limit.service';
import { SessionService } from './services/session.service';
import { TokenService } from './services/token.service';
import { VerificationService } from './services/verification.service';
import { isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from './validation';

type UserWithRoles = Prisma.UserGetPayload<{ include: { roles: true } }>;

export interface RegistrationResponse {
  userId: string;
  email: string;
  status: string;
  verificationEmailSent: boolean;
  phoneVerificationSent: boolean;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly sessions: SessionService,
    private readonly verification: VerificationService,
    private readonly rateLimit: RateLimitService,
    private readonly audit: AuditService,
    @Inject(IDENTITY_ENVIRONMENT) private readonly environment: IdentityEnvironment,
  ) {}

  async register(dto: RegisterDto, meta: RequestMeta): Promise<RegistrationResponse> {
    if (!isValidEmail(dto.email)) {
      throw new BadRequestException({
        code: 'INVALID_EMAIL',
        message: 'Enter a valid email address.',
        fieldErrors: { email: 'Enter a valid email address.' },
      });
    }
    if (!isValidPhone(dto.phone)) {
      throw new BadRequestException({
        code: 'INVALID_PHONE',
        message: 'Enter a valid phone number, for example +255 7xx xxx xxx.',
        fieldErrors: { phone: 'Enter a valid phone number, for example +255 7xx xxx xxx.' },
      });
    }
    if (dto.password !== dto.passwordConfirmation) {
      throw new BadRequestException({
        code: 'PASSWORD_MISMATCH',
        message: 'The passwords do not match.',
        fieldErrors: { passwordConfirmation: 'The passwords do not match.' },
      });
    }

    const passwordIssues = this.passwords.validate(dto.password, {
      email: dto.email,
      fullName: dto.fullName,
    });
    if (passwordIssues.length > 0) {
      throw new BadRequestException({
        code: 'WEAK_PASSWORD',
        message: 'Choose a stronger password.',
        fieldErrors: { password: passwordIssues.join(' ') },
      });
    }

    const emailNormalized = normalizeEmail(dto.email);
    const phoneNormalized = normalizePhone(dto.phone);
    await this.rateLimit.consume(
      'registration',
      [meta.ipAddress, emailNormalized],
      this.environment.REGISTRATION_RATE_LIMIT,
      this.environment.REGISTRATION_RATE_WINDOW_MINUTES * 60,
    );

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ emailNormalized }, { phoneNormalized }] },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException({
        code: 'ACCOUNT_EXISTS',
        message: 'An account with these details already exists. Sign in or recover your account.',
      });
    }

    const passwordHash = await this.passwords.hash(dto.password);
    let user: UserWithRoles;
    try {
      user = await this.prisma.$transaction(async (transaction) => {
        const created = await transaction.user.create({
          data: {
            fullName: dto.fullName.trim(),
            email: dto.email.trim(),
            emailNormalized,
            phone: dto.phone.trim(),
            phoneNormalized,
            passwordHash,
            status: 'PENDING_VERIFICATION',
            roles: { create: { role: 'CUSTOMER' } },
          },
          include: { roles: true },
        });
        await transaction.outboxEvent.create({
          data: {
            type: 'user.registered',
            version: 1,
            correlationId: meta.correlationId,
            payload: {
              userId: created.id,
              email: created.email,
              phone: created.phone,
              roles: ['CUSTOMER'],
            },
          },
        });
        return created;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          code: 'ACCOUNT_EXISTS',
          message: 'An account with these details already exists. Sign in or recover your account.',
        });
      }
      throw error;
    }

    let verificationEmailSent = true;
    try {
      await this.verification.issueEmailVerification(user, 'REGISTRATION');
    } catch (error) {
      verificationEmailSent = false;
      this.logger.error({ err: error, userId: user.id }, 'verification email could not be sent');
      await this.audit.record({
        actorId: user.id,
        action: 'identity.verification.email_delivery_failed',
        targetType: 'user',
        targetId: user.id,
        meta,
      });
    }

    let phoneVerificationSent = true;
    try {
      await this.verification.issuePhoneVerification(user, meta);
    } catch (error) {
      phoneVerificationSent = false;
      this.logger.error({ err: error, userId: user.id }, 'phone verification could not be sent');
      await this.audit.record({
        actorId: user.id,
        action: 'identity.verification.phone_delivery_failed',
        targetType: 'user',
        targetId: user.id,
        meta,
      });
    }

    await this.audit.record({
      actorId: user.id,
      action: 'identity.registration.submitted',
      targetType: 'user',
      targetId: user.id,
      metadata: { verificationEmailSent, phoneVerificationSent },
      meta,
    });

    return {
      userId: user.id,
      email: user.email,
      status: user.status,
      verificationEmailSent,
      phoneVerificationSent,
    };
  }

  async login(dto: LoginDto, meta: RequestMeta): Promise<{ auth: AuthResponse; refreshToken: string }> {
    const usesEmail = dto.identifier.includes('@');
    const normalizedIdentifier = usesEmail
      ? normalizeEmail(dto.identifier)
      : normalizePhone(dto.identifier);
    const identifierHash = this.tokens.hmac(normalizedIdentifier);

    await this.assertLoginRateLimit(identifierHash, meta.ipAddress);

    const user = await this.prisma.user.findFirst({
      where: usesEmail
        ? { emailNormalized: normalizedIdentifier }
        : { phoneNormalized: normalizedIdentifier },
      include: { roles: true },
    });

    if (!user) {
      await this.passwords.verifyDummy(dto.password);
      await this.recordLoginAttempt(identifierHash, meta.ipAddress, false, 'unknown_account');
      throw this.invalidCredentials();
    }

    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      const retryAfter = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 1000);
      await this.recordLoginAttempt(identifierHash, meta.ipAddress, false, 'account_locked');
      throw new HttpException(
        {
          code: 'ACCOUNT_TEMPORARILY_LOCKED',
          message: 'Too many failed attempts. Try again later.',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const passwordValid = await this.passwords.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      const failedLoginCount = user.failedLoginCount + 1;
      const lockedUntil =
        failedLoginCount >= this.environment.AUTH_MAX_FAILED_LOGINS
          ? new Date(now.getTime() + this.environment.AUTH_LOCK_MINUTES * 60 * 1000)
          : null;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: lockedUntil ? 0 : failedLoginCount,
          lockedUntil,
        },
      });
      await this.recordLoginAttempt(identifierHash, meta.ipAddress, false, 'invalid_password');
      await this.audit.record({
        actorId: user.id,
        action: lockedUntil ? 'identity.login.locked' : 'identity.login.failed',
        targetType: 'user',
        targetId: user.id,
        meta,
      });
      throw this.invalidCredentials();
    }

    if (user.status === 'PENDING_VERIFICATION' || !user.emailVerifiedAt) {
      await this.recordLoginAttempt(identifierHash, meta.ipAddress, false, 'email_not_verified');
      throw new ForbiddenException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Verify your email address before signing in.',
      });
    }
    if (!usesEmail && !user.phoneVerifiedAt) {
      await this.recordLoginAttempt(identifierHash, meta.ipAddress, false, 'phone_not_verified');
      throw new ForbiddenException({
        code: 'PHONE_NOT_VERIFIED',
        message: 'Verify your phone number before signing in with it.',
      });
    }
    if (user.status !== 'ACTIVE') {
      await this.recordLoginAttempt(identifierHash, meta.ipAddress, false, 'account_inactive');
      throw new ForbiddenException({
        code: 'ACCOUNT_INACTIVE',
        message: 'This account is not active. Contact support if you need help.',
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: now },
    });
    await this.recordLoginAttempt(identifierHash, meta.ipAddress, true, 'success');

    const session = await this.sessions.create(user.id, meta);
    const access = this.tokens.signAccessToken({
      id: user.id,
      sessionId: session.sessionId,
      email: user.email,
      fullName: user.fullName,
      roles: this.rolesOf(user),
    });

    await this.audit.record({
      actorId: user.id,
      action: 'identity.login.succeeded',
      targetType: 'user',
      targetId: user.id,
      meta,
    });

    return {
      auth: {
        accessToken: access.token,
        expiresIn: access.expiresIn,
        user: this.toUserSummary(user),
      },
      refreshToken: session.refreshToken,
    };
  }

  async refresh(refreshToken: string, meta: RequestMeta): Promise<{ auth: AuthResponse; refreshToken: string }> {
    const rotated = await this.sessions.rotate(refreshToken, meta);
    const access = this.tokens.signAccessToken({
      id: rotated.user.id,
      sessionId: rotated.sessionId,
      email: rotated.user.email,
      fullName: rotated.user.fullName,
      roles: rotated.user.roles.map((assignment) => assignment.role),
    });
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: rotated.user.id },
      include: { roles: true },
    });

    return {
      auth: {
        accessToken: access.token,
        expiresIn: access.expiresIn,
        user: this.toUserSummary(user),
      },
      refreshToken: rotated.refreshToken,
    };
  }

  async logout(refreshToken: string | undefined, meta: RequestMeta): Promise<void> {
    if (!refreshToken) {
      return;
    }
    const userId = await this.sessions.revokeByToken(refreshToken, 'logout');
    if (userId) {
      await this.audit.record({
        actorId: userId,
        action: 'identity.logout',
        targetType: 'user',
        targetId: userId,
        meta,
      });
    }
  }

  async logoutAll(userId: string, meta: RequestMeta): Promise<void> {
    await this.sessions.revokeAllForUser(userId, 'logout_all');
    await this.audit.record({
      actorId: userId,
      action: 'identity.logout_all',
      targetType: 'user',
      targetId: userId,
      meta,
    });
  }

  async listSessions(userId: string, currentToken?: string) {
    return this.sessions.listActiveForUser(userId, currentToken);
  }

  async revokeSession(
    userId: string,
    sessionId: string,
    currentToken: string | undefined,
    meta: RequestMeta,
  ): Promise<{ revoked: boolean; current: boolean }> {
    const result = await this.sessions.revokeOneForUser(userId, sessionId, currentToken);
    if (result.revoked) {
      await this.audit.record({
        actorId: userId,
        action: 'identity.session.revoked',
        targetType: 'refresh_session',
        targetId: sessionId,
        meta,
      });
    }
    return result;
  }

  async resendEmailVerification(email: string, meta: RequestMeta): Promise<void> {
    const emailNormalized = normalizeEmail(email);
    await this.rateLimit.consume(
      'email_verification_resend',
      [meta.ipAddress, emailNormalized],
      5,
      60 * 60,
    );

    const user = await this.prisma.user.findUnique({ where: { emailNormalized } });
    if (!user || user.emailVerifiedAt || user.status === 'DISABLED') {
      return;
    }

    try {
      await this.verification.issueEmailVerification(user, 'REGISTRATION');
    } catch (error) {
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.TOO_MANY_REQUESTS
      ) {
        return;
      }
      this.logger.error({ err: error, userId: user.id }, 'verification email resend failed');
      await this.audit.record({
        actorId: user.id,
        action: 'identity.verification.email_delivery_failed',
        targetType: 'user',
        targetId: user.id,
        meta,
      });
      return;
    }

    await this.audit.record({
      actorId: user.id,
      action: 'identity.verification.email_resent',
      targetType: 'user',
      targetId: user.id,
      meta,
    });
  }

  async verifyEmail(email: string, code: string, meta: RequestMeta): Promise<void> {
    await this.verification.verifyEmail(email, code, meta);
  }

  async requestPhoneVerification(userId: string, meta: RequestMeta): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException({
        code: 'SESSION_INVALID',
        message: 'Your session is no longer valid. Sign in again.',
      });
    }
    if (user.phoneVerifiedAt) {
      return;
    }
    await this.verification.issuePhoneVerification(user, meta);
  }

  async verifyPhone(userId: string, code: string, meta: RequestMeta): Promise<UserSummary> {
    await this.verification.verifyPhone(userId, code, meta);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { roles: true },
    });
    return this.toUserSummary(user);
  }

  async forgotPassword(email: string, meta: RequestMeta): Promise<void> {
    const emailNormalized = normalizeEmail(email);
    await this.rateLimit.consume(
      'password_reset_request',
      [meta.ipAddress, emailNormalized],
      5,
      60 * 60,
    );

    const user = await this.prisma.user.findUnique({ where: { emailNormalized } });
    if (!user || user.status === 'DISABLED' || !user.emailVerifiedAt) {
      return;
    }

    try {
      await this.verification.issueEmailVerification(user, 'PASSWORD_RESET');
    } catch (error) {
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.TOO_MANY_REQUESTS
      ) {
        return;
      }
      this.logger.error({ err: error, userId: user.id }, 'password reset email failed');
      return;
    }

    await this.audit.record({
      actorId: user.id,
      action: 'identity.password_reset.requested',
      targetType: 'user',
      targetId: user.id,
      meta,
    });
  }

  async resetPassword(
    token: string,
    password: string,
    passwordConfirmation: string,
    meta: RequestMeta,
  ): Promise<void> {
    if (password !== passwordConfirmation) {
      throw new BadRequestException({
        code: 'PASSWORD_MISMATCH',
        message: 'The passwords do not match.',
        fieldErrors: { passwordConfirmation: 'The passwords do not match.' },
      });
    }

    const tokenHash = this.tokens.hashToken(token);
    const record = await this.prisma.verificationToken.findUnique({ where: { tokenHash } });
    if (
      !record ||
      record.channel !== 'EMAIL' ||
      record.purpose !== 'PASSWORD_RESET' ||
      record.consumedAt
    ) {
      throw new BadRequestException({
        code: 'INVALID_RESET_TOKEN',
        message: 'This password reset link is invalid or has already been used.',
      });
    }
    if (record.expiresAt <= new Date()) {
      throw new BadRequestException({
        code: 'RESET_TOKEN_EXPIRED',
        message: 'This password reset link has expired. Request a new one.',
      });
    }

    const user = await this.prisma.user.findUnique({ where: { id: record.userId } });
    if (!user) {
      throw new BadRequestException({
        code: 'INVALID_RESET_TOKEN',
        message: 'This password reset link is invalid or has already been used.',
      });
    }

    const passwordIssues = this.passwords.validate(password, {
      email: user.email,
      fullName: user.fullName,
    });
    if (passwordIssues.length > 0) {
      throw new BadRequestException({
        code: 'WEAK_PASSWORD',
        message: 'Choose a stronger password.',
        fieldErrors: { password: passwordIssues.join(' ') },
      });
    }

    const passwordHash = await this.passwords.hash(password);
    await this.prisma.$transaction(async (transaction) => {
      const claimed = await transaction.verificationToken.updateMany({
        where: { id: record.id, consumedAt: null, expiresAt: { gt: new Date() } },
        data: { consumedAt: new Date() },
      });
      if (claimed.count !== 1) {
        throw new BadRequestException({
          code: 'INVALID_RESET_TOKEN',
          message: 'This password reset link is invalid or has already been used.',
        });
      }
      await transaction.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          failedLoginCount: 0,
          lockedUntil: null,
        },
      });
      await transaction.outboxEvent.create({
        data: {
          type: 'user.password_changed',
          version: 1,
          correlationId: meta.correlationId,
          payload: { userId: user.id, reason: 'password_reset' },
        },
      });
      await transaction.refreshSession.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date(), revocationReason: 'password_reset' },
      });
      await transaction.auditLog.create({
        data: {
          actorId: user.id,
          action: 'identity.password_reset.completed',
          targetType: 'user',
          targetId: user.id,
          ipAddress: meta.ipAddress,
          correlationId: meta.correlationId,
        },
      });
    });
  }

  async getMe(userId: string): Promise<UserSummary> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { roles: true },
    });
    return this.toUserSummary(user);
  }

  async updateProfile(userId: string, fullName: string, meta: RequestMeta): Promise<UserSummary> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { fullName: fullName.trim() },
      include: { roles: true },
    });
    await this.audit.record({
      actorId: userId,
      action: 'identity.profile.updated',
      targetType: 'user',
      targetId: userId,
      meta,
    });
    return this.toUserSummary(user);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    password: string,
    passwordConfirmation: string,
    meta: RequestMeta,
  ): Promise<void> {
    if (password !== passwordConfirmation) {
      throw new BadRequestException({
        code: 'PASSWORD_MISMATCH',
        message: 'The passwords do not match.',
        fieldErrors: { passwordConfirmation: 'The passwords do not match.' },
      });
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await this.passwords.verify(user.passwordHash, currentPassword))) {
      throw new UnauthorizedException({
        code: 'CURRENT_PASSWORD_INVALID',
        message: 'The current password is incorrect.',
      });
    }
    if (await this.passwords.verify(user.passwordHash, password)) {
      throw new BadRequestException({
        code: 'PASSWORD_UNCHANGED',
        message: 'Choose a password different from your current password.',
      });
    }
    const passwordIssues = this.passwords.validate(password, {
      email: user.email,
      fullName: user.fullName,
    });
    if (passwordIssues.length > 0) {
      throw new BadRequestException({
        code: 'WEAK_PASSWORD',
        message: 'Choose a stronger password.',
        fieldErrors: { password: passwordIssues.join(' ') },
      });
    }

    const passwordHash = await this.passwords.hash(password);
    await this.prisma.$transaction(async (transaction) => {
      await transaction.user.update({ where: { id: userId }, data: { passwordHash } });
      await transaction.outboxEvent.create({
        data: {
          type: 'user.password_changed',
          version: 1,
          correlationId: meta.correlationId,
          payload: { userId, reason: 'password_changed' },
        },
      });
      await transaction.refreshSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date(), revocationReason: 'password_changed' },
      });
      await transaction.auditLog.create({
        data: {
          actorId: userId,
          action: 'identity.password_changed',
          targetType: 'user',
          targetId: userId,
          ipAddress: meta.ipAddress,
          correlationId: meta.correlationId,
        },
      });
    });
  }

  private async assertLoginRateLimit(identifierHash: string, ipAddress: string | null): Promise<void> {
    const since = new Date(
      Date.now() - this.environment.AUTH_LOCK_MINUTES * 60 * 1000,
    );
    const [byIdentifier, byIp] = await Promise.all([
      this.prisma.authAttempt.count({
        where: { identifierHash, successful: false, createdAt: { gte: since } },
      }),
      ipAddress
        ? this.prisma.authAttempt.count({
            where: { ipAddress, successful: false, createdAt: { gte: since } },
          })
        : Promise.resolve(0),
    ]);

    if (byIdentifier >= this.environment.AUTH_MAX_FAILED_LOGINS * 2 || byIp >= 50) {
      throw new HttpException(
        {
          code: 'LOGIN_RATE_LIMITED',
          message: 'Too many failed attempts. Try again later.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async recordLoginAttempt(
    identifierHash: string,
    ipAddress: string | null,
    successful: boolean,
    reason: string,
  ): Promise<void> {
    await this.prisma.authAttempt.create({
      data: { identifierHash, ipAddress, successful, reason },
    });
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException({
      code: 'INVALID_CREDENTIALS',
      message: 'The email or phone number or password is incorrect.',
    });
  }

  private rolesOf(user: UserWithRoles): RoleName[] {
    return user.roles.map((assignment) => assignment.role);
  }

  private toUserSummary(user: UserWithRoles): UserSummary {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      status: user.status,
      emailVerified: Boolean(user.emailVerifiedAt),
      phoneVerified: Boolean(user.phoneVerifiedAt),
      roles: this.rolesOf(user),
      createdAt: user.createdAt.toISOString(),
    };
  }
}
