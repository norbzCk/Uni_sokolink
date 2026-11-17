import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { User, VerificationPurpose } from '@prisma/client';
import type { IdentityEnvironment } from '../../environment';
import { IDENTITY_ENVIRONMENT } from '../../environment.provider';
import type { RequestMeta } from '../../common/auth.types';
import { PrismaService } from '../../prisma/prisma.service';
import { MailerService } from './mailer.service';
import { SmsService } from './sms.service';
import { TokenService } from './token.service';
import { normalizeEmail } from '../validation';

function invalidToken(message: string, code = 'INVALID_VERIFICATION_TOKEN'): BadRequestException {
  return new BadRequestException({ code, message });
}

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly mailer: MailerService,
    private readonly sms: SmsService,
    @Inject(IDENTITY_ENVIRONMENT) private readonly environment: IdentityEnvironment,
  ) {}

  async issueEmailVerification(user: User, purpose: VerificationPurpose): Promise<void> {
    await this.assertResendAllowed(user.id, 'EMAIL', purpose);

    if (purpose === 'PASSWORD_RESET') {
      const token = this.tokens.createOpaqueToken();
      const expiresAt = new Date(
        Date.now() + this.environment.PASSWORD_RESET_TTL_MINUTES * 60 * 1000,
      );
      await this.prisma.verificationToken.create({
        data: {
          userId: user.id,
          channel: 'EMAIL',
          purpose,
          tokenHash: this.tokens.hashToken(token),
          expiresAt,
          maxAttempts: 1,
        },
      });
      await this.mailer.sendPasswordReset(user.email, user.fullName, token, expiresAt);
      return;
    }

    await this.invalidateOutstanding(user.id, purpose, 'EMAIL');
    const code = this.tokens.createOneTimeCode();
    const expiresAt = new Date(
      Date.now() + this.environment.EMAIL_VERIFICATION_TTL_MINUTES * 60 * 1000,
    );
    const record = await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        channel: 'EMAIL',
        purpose,
        tokenHash: this.tokens.createOpaqueToken(),
        expiresAt,
        requestIp: null,
        maxAttempts: 5,
      },
    });
    await this.prisma.verificationToken.update({
      where: { id: record.id },
      data: { tokenHash: this.tokens.hmac(`${record.id}:${code}`) },
    });
    await this.mailer.sendEmailVerification(user.email, user.fullName, code, expiresAt);
  }

  async issuePhoneVerification(user: User, meta: RequestMeta): Promise<void> {
    await this.assertResendAllowed(user.id, 'PHONE', 'REGISTRATION');

    const code = this.tokens.createOneTimeCode();
    const expiresAt = new Date(
      Date.now() + this.environment.PHONE_VERIFICATION_TTL_MINUTES * 60 * 1000,
    );

    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        channel: 'PHONE',
        purpose: 'REGISTRATION',
        tokenHash: this.tokens.hmac(code),
        expiresAt,
        requestIp: meta.ipAddress,
        maxAttempts: 5,
      },
    });

    try {
      await this.sms.sendVerificationCode(user.phone, code);
    } catch (error) {
      throw new HttpException(
        {
          code: 'SMS_DELIVERY_FAILED',
          message:
            'The verification code could not be sent. Try again later or contact support.',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
        { cause: error },
      );
    }
  }

  async verifyEmail(email: string, code: string, meta: RequestMeta): Promise<string> {
    const emailNormalized = normalizeEmail(email);
    const user = await this.prisma.user.findUnique({ where: { emailNormalized } });
    if (!user || user.emailVerifiedAt || user.status === 'SUSPENDED' || user.status === 'DISABLED') {
      throw invalidToken('This verification code is invalid or has already been used.', 'INVALID_VERIFICATION_CODE');
    }

    const record = await this.prisma.verificationToken.findFirst({
      where: {
        userId: user.id,
        channel: 'EMAIL',
        purpose: 'REGISTRATION',
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) {
      throw invalidToken('Request a new verification code.', 'INVALID_VERIFICATION_CODE');
    }
    if (record.expiresAt <= new Date()) {
      throw invalidToken(
        'This verification code has expired. Request a new verification email.',
        'VERIFICATION_TOKEN_EXPIRED',
      );
    }
    if (record.attemptCount >= record.maxAttempts) {
      throw invalidToken(
        'Too many incorrect attempts. Request a new verification code.',
        'VERIFICATION_ATTEMPTS_EXCEEDED',
      );
    }

    if (!this.tokens.safeEqualHex(record.tokenHash, this.tokens.hmac(`${record.id}:${code}`))) {
      const attempt = await this.prisma.verificationToken.updateMany({
        where: {
          id: record.id,
          consumedAt: null,
          attemptCount: { lt: record.maxAttempts },
        },
        data: { attemptCount: { increment: 1 } },
      });
      if (attempt.count !== 1) {
        throw invalidToken(
          'Too many incorrect attempts. Request a new verification code.',
          'VERIFICATION_ATTEMPTS_EXCEEDED',
        );
      }
      throw invalidToken('The verification code is incorrect.', 'INVALID_VERIFICATION_CODE');
    }

    return this.prisma.$transaction(async (transaction) => {
      const claimed = await transaction.verificationToken.updateMany({
        where: {
          id: record.id,
          consumedAt: null,
          attemptCount: { lt: record.maxAttempts },
          expiresAt: { gt: new Date() },
        },
        data: { consumedAt: new Date() },
      });
      if (claimed.count !== 1) {
        throw invalidToken('This verification code is invalid or has already been used.', 'INVALID_VERIFICATION_CODE');
      }

      const currentUser = await transaction.user.findUniqueOrThrow({ where: { id: record.userId } });
      const updatedUser = await transaction.user.update({
        where: { id: currentUser.id },
        data: {
          emailVerifiedAt: currentUser.emailVerifiedAt ?? new Date(),
          status: currentUser.status === 'PENDING_VERIFICATION' ? 'ACTIVE' : currentUser.status,
        },
      });
      await transaction.outboxEvent.create({
        data: {
          type: 'user.email_verified',
          version: 1,
          correlationId: meta.correlationId,
          payload: { userId: currentUser.id, email: currentUser.email, status: updatedUser.status },
        },
      });
      if (currentUser.status === 'PENDING_VERIFICATION' && updatedUser.status === 'ACTIVE') {
        await transaction.outboxEvent.create({
          data: {
            type: 'user.account_status_changed',
            version: 1,
            correlationId: meta.correlationId,
            payload: { userId: currentUser.id, from: 'PENDING_VERIFICATION', to: 'ACTIVE' },
          },
        });
      }

      await transaction.auditLog.create({
        data: {
          actorId: currentUser.id,
          action: 'identity.email.verified',
          targetType: 'user',
          targetId: currentUser.id,
          ipAddress: meta.ipAddress,
          correlationId: meta.correlationId,
        },
      });
      return currentUser.id;
    });
  }

  async verifyPhone(userId: string, code: string, meta: RequestMeta): Promise<void> {
    const record = await this.prisma.verificationToken.findFirst({
      where: {
        userId,
        channel: 'PHONE',
        purpose: 'REGISTRATION',
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw invalidToken('Request a new verification code.', 'PHONE_VERIFICATION_REQUIRED');
    }
    if (record.expiresAt <= new Date()) {
      throw invalidToken(
        'This verification code has expired. Request a new code.',
        'VERIFICATION_TOKEN_EXPIRED',
      );
    }
    if (record.attemptCount >= record.maxAttempts) {
      throw invalidToken(
        'Too many incorrect attempts. Request a new verification code.',
        'VERIFICATION_ATTEMPTS_EXCEEDED',
      );
    }

    if (!this.tokens.safeEqualHex(record.tokenHash, this.tokens.hmac(code))) {
      const attempt = await this.prisma.verificationToken.updateMany({
        where: { id: record.id, consumedAt: null, attemptCount: { lt: record.maxAttempts } },
        data: { attemptCount: { increment: 1 } },
      });
      if (attempt.count !== 1) {
        throw invalidToken(
          'Too many incorrect attempts. Request a new verification code.',
          'VERIFICATION_ATTEMPTS_EXCEEDED',
        );
      }
      throw invalidToken('The verification code is incorrect.', 'INVALID_VERIFICATION_CODE');
    }

    await this.prisma.$transaction(async (transaction) => {
      const claimed = await transaction.verificationToken.updateMany({
        where: {
          id: record.id,
          consumedAt: null,
          attemptCount: { lt: record.maxAttempts },
          expiresAt: { gt: new Date() },
        },
        data: { consumedAt: new Date() },
      });
      if (claimed.count !== 1) {
        throw invalidToken('The verification code has already been used.');
      }
      const updatedUser = await transaction.user.update({
        where: { id: userId },
        data: { phoneVerifiedAt: new Date() },
      });
      await transaction.outboxEvent.create({
        data: {
          type: 'user.phone_verified',
          version: 1,
          correlationId: meta.correlationId,
          payload: { userId, status: updatedUser.status },
        },
      });
      await transaction.auditLog.create({
        data: {
          actorId: userId,
          action: 'identity.phone.verified',
          targetType: 'user',
          targetId: userId,
          ipAddress: meta.ipAddress,
          correlationId: meta.correlationId,
        },
      });
    });
  }

  async consumePasswordReset(token: string): Promise<string> {
    const tokenHash = this.tokens.hashToken(token);
    const record = await this.prisma.verificationToken.findUnique({ where: { tokenHash } });
    if (
      !record ||
      record.channel !== 'EMAIL' ||
      record.purpose !== 'PASSWORD_RESET' ||
      record.consumedAt
    ) {
      throw invalidToken('This password reset link is invalid or has already been used.');
    }
    if (record.expiresAt <= new Date()) {
      throw invalidToken(
        'This password reset link has expired. Request a new one.',
        'VERIFICATION_TOKEN_EXPIRED',
      );
    }

    const claimed = await this.prisma.verificationToken.updateMany({
      where: { id: record.id, consumedAt: null, expiresAt: { gt: new Date() } },
      data: { consumedAt: new Date() },
    });
    if (claimed.count !== 1) {
      throw invalidToken('This password reset link is invalid or has already been used.');
    }
    return record.userId;
  }

  async invalidateOutstanding(userId: string, purpose: VerificationPurpose, channel: 'EMAIL' | 'PHONE'): Promise<void> {
    await this.prisma.verificationToken.updateMany({
      where: { userId, purpose, channel, consumedAt: null },
      data: { consumedAt: new Date() },
    });
  }

  private async assertResendAllowed(
    userId: string,
    channel: 'EMAIL' | 'PHONE',
    purpose: VerificationPurpose,
  ): Promise<void> {
    const now = new Date();
    const last = await this.prisma.verificationToken.findFirst({
      where: { userId, channel, purpose },
      orderBy: { createdAt: 'desc' },
    });
    if (
      last &&
      last.createdAt.getTime() > now.getTime() - this.environment.VERIFICATION_RESEND_SECONDS * 1000
    ) {
      const retryAfter = Math.ceil(
        (last.createdAt.getTime() +
          this.environment.VERIFICATION_RESEND_SECONDS * 1000 -
          now.getTime()) /
          1000,
      );
      throw new HttpException(
        {
          code: 'VERIFICATION_RESEND_TOO_SOON',
          message: 'Wait before requesting another verification message.',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const count = await this.prisma.verificationToken.count({
      where: {
        userId,
        channel,
        purpose,
        createdAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) },
      },
    });
    if (count >= this.environment.VERIFICATION_MAX_PER_HOUR) {
      throw new HttpException(
        {
          code: 'VERIFICATION_RATE_LIMITED',
          message: 'Too many verification requests. Try again later.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
