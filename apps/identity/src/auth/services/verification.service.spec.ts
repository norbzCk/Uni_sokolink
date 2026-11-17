import { describe, expect, it, vi } from 'vitest';
import type { IdentityEnvironment } from '../../environment';
import { VerificationService } from './verification.service';

const meta = { ipAddress: '203.0.113.11', userAgent: 'vitest', correlationId: 'verification-test' };
const user = {
  id: 'user-1',
  email: 'amina@example.com',
  fullName: 'Amina User',
  phone: '+255712345678',
  status: 'PENDING_VERIFICATION',
  emailVerifiedAt: null,
};

function build() {
  const otpRecord = {
    id: 'verification-1',
    userId: 'user-1',
    channel: 'EMAIL',
    purpose: 'REGISTRATION',
    tokenHash: 'expected-hmac',
    expiresAt: new Date(Date.now() + 60_000),
    consumedAt: null,
    attemptCount: 0,
    maxAttempts: 5,
    createdAt: new Date(),
  };
  const tx = {
    verificationToken: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    user: {
      findUniqueOrThrow: vi.fn().mockResolvedValue(user),
      update: vi.fn().mockResolvedValue({ ...user, status: 'ACTIVE' }),
    },
    outboxEvent: { create: vi.fn().mockResolvedValue({}) },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  };
  const prisma = {
    user: { findUnique: vi.fn().mockResolvedValue(user) },
    verificationToken: {
      findUnique: vi.fn(),
      findFirst: vi.fn().mockResolvedValue(otpRecord),
      findMany: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue(otpRecord),
      update: vi.fn().mockResolvedValue(otpRecord),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
  };
  const tokens = {
    createOpaqueToken: vi.fn().mockReturnValue('pending-token-placeholder'),
    createOneTimeCode: vi.fn().mockReturnValue('123456'),
    hashToken: vi.fn().mockReturnValue('stored-hash'),
    hmac: vi.fn().mockReturnValue('expected-hmac'),
    safeEqualHex: vi.fn().mockReturnValue(true),
  };
  const mailer = {
    sendEmailVerification: vi.fn().mockResolvedValue(undefined),
    sendPasswordReset: vi.fn().mockResolvedValue(undefined),
  };
  const sms = { sendVerificationCode: vi.fn().mockResolvedValue(undefined) };
  const environment = {
    EMAIL_VERIFICATION_TTL_MINUTES: 60,
    PASSWORD_RESET_TTL_MINUTES: 60,
    VERIFICATION_RESEND_SECONDS: 60,
    VERIFICATION_MAX_PER_HOUR: 5,
  } as IdentityEnvironment;
  const service = new VerificationService(
    prisma as never,
    tokens as never,
    mailer as never,
    sms as never,
    environment,
  );
  return { service, prisma, tokens, mailer, tx, otpRecord };
}

describe('VerificationService email OTP', () => {
  it('stores a record-bound code hash and emails the six digit code', async () => {
    const { service, prisma, tokens, mailer, otpRecord } = build();
    prisma.verificationToken.findFirst.mockResolvedValue(null);

    await service.issueEmailVerification(user as never, 'REGISTRATION');

    expect(tokens.createOneTimeCode).toHaveBeenCalledOnce();
    expect(prisma.verificationToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        channel: 'EMAIL',
        purpose: 'REGISTRATION',
        tokenHash: 'pending-token-placeholder',
        maxAttempts: 5,
      }),
    });
    expect(prisma.verificationToken.update).toHaveBeenCalledWith({
      where: { id: otpRecord.id },
      data: { tokenHash: 'expected-hmac' },
    });
    expect(mailer.sendEmailVerification).toHaveBeenCalledWith(
      'amina@example.com',
      'Amina User',
      '123456',
      expect.any(Date),
    );
  });

  it('rejects an expired email verification code', async () => {
    const { service, prisma, otpRecord } = build();
    prisma.verificationToken.findFirst.mockResolvedValue({
      ...otpRecord,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(service.verifyEmail('amina@example.com', '123456', meta)).rejects.toMatchObject({
      response: { code: 'VERIFICATION_TOKEN_EXPIRED' },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('increments attempts for an incorrect email verification code', async () => {
    const { service, tokens, prisma } = build();
    tokens.safeEqualHex.mockReturnValue(false);

    await expect(service.verifyEmail('amina@example.com', '000000', meta)).rejects.toMatchObject({
      response: { code: 'INVALID_VERIFICATION_CODE' },
    });
    expect(tokens.hmac).toHaveBeenCalledWith('verification-1:000000');
    expect(prisma.verificationToken.updateMany).toHaveBeenCalledWith({
      where: { id: 'verification-1', consumedAt: null, attemptCount: { lt: 5 } },
      data: { attemptCount: { increment: 1 } },
    });
  });

  it('claims a valid email code once and writes verification events atomically', async () => {
    const { service, tokens, tx } = build();

    await service.verifyEmail('AMINA@example.com', '123456', meta);

    expect(tokens.hmac).toHaveBeenCalledWith('verification-1:123456');
    expect(tx.verificationToken.updateMany).toHaveBeenCalledOnce();
    expect(tx.user.update).toHaveBeenCalledOnce();
    expect(tx.outboxEvent.create).toHaveBeenCalledTimes(2);
    expect(tx.outboxEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'user.email_verified' }),
    });
    expect(tx.outboxEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'user.account_status_changed' }),
    });
  });

  it('increments phone-code attempts atomically without exposing the code', async () => {
    const { service, tokens, prisma } = build();
    tokens.safeEqualHex.mockReturnValue(false);

    await expect(service.verifyPhone('user-1', '123456', meta)).rejects.toMatchObject({
      response: { code: 'INVALID_VERIFICATION_CODE' },
    });
    expect(tokens.hmac).toHaveBeenCalledWith('123456');
    expect(prisma.verificationToken.updateMany).toHaveBeenCalledWith({
      where: { id: 'verification-1', consumedAt: null, attemptCount: { lt: 5 } },
      data: { attemptCount: { increment: 1 } },
    });
  });
});
