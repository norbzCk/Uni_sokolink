import { describe, expect, it, vi } from 'vitest';
import type { IdentityEnvironment } from '../../environment';
import { VerificationService } from './verification.service';

const meta = { ipAddress: '203.0.113.11', userAgent: 'vitest', correlationId: 'verification-test' };
const user = {
  id: 'user-1',
  email: 'amina@example.com',
  phone: '+255712345678',
  status: 'PENDING_VERIFICATION',
  emailVerifiedAt: null,
};

function build() {
  const tokenRecord = {
    id: 'verification-1',
    userId: 'user-1',
    channel: 'EMAIL',
    purpose: 'REGISTRATION',
    tokenHash: 'stored-hash',
    expiresAt: new Date(Date.now() + 60_000),
    consumedAt: null,
    attemptCount: 0,
    maxAttempts: 1,
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
    verificationToken: {
      findUnique: vi.fn().mockResolvedValue(tokenRecord),
      findFirst: vi.fn().mockResolvedValue({
        ...tokenRecord,
        channel: 'PHONE',
        tokenHash: 'expected-hmac',
        attemptCount: 0,
        maxAttempts: 5,
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
  };
  const tokens = {
    hashToken: vi.fn().mockReturnValue('stored-hash'),
    hmac: vi.fn().mockReturnValue('wrong-hmac'),
    safeEqualHex: vi.fn().mockReturnValue(false),
  };
  const mailer = {};
  const sms = {};
  const environment = { EMAIL_VERIFICATION_TTL_MINUTES: 60 } as IdentityEnvironment;
  const service = new VerificationService(
    prisma as never,
    tokens as never,
    mailer as never,
    sms as never,
    environment,
  );
  return { service, prisma, tokens, tx, tokenRecord };
}

describe('VerificationService', () => {
  it('rejects expired email verification tokens', async () => {
    const { service, prisma, tokenRecord } = build();
    prisma.verificationToken.findUnique.mockResolvedValue({
      ...tokenRecord,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(service.verifyEmail('raw-token', meta)).rejects.toMatchObject({
      response: { code: 'VERIFICATION_TOKEN_EXPIRED' },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('claims a valid email token once and writes verification events atomically', async () => {
    const { service, tx } = build();

    await service.verifyEmail('raw-token', meta);

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

    await expect(service.verifyPhone('user-1', '123456', meta)).rejects.toMatchObject({
      response: { code: 'INVALID_VERIFICATION_CODE' },
    });
    expect(tokens.hmac).toHaveBeenCalledWith('123456');
    expect(prisma.verificationToken.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'verification-1',
        consumedAt: null,
        attemptCount: { lt: 5 },
      },
      data: { attemptCount: { increment: 1 } },
    });
  });
});
