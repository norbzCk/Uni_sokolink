import { describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
import type { IdentityEnvironment } from '../environment';

const meta = { ipAddress: '203.0.113.5', userAgent: 'vitest', correlationId: 'test-correlation' };

const environment = {
  REGISTRATION_RATE_LIMIT: 10,
  REGISTRATION_RATE_WINDOW_MINUTES: 60,
  AUTH_MAX_FAILED_LOGINS: 5,
  AUTH_LOCK_MINUTES: 15,
} as unknown as IdentityEnvironment;

const persistedUser = {
  id: 'user-1',
  fullName: 'Amina Hassan',
  email: 'amina@example.com',
  emailNormalized: 'amina@example.com',
  phone: '+255712345678',
  phoneNormalized: '+255712345678',
  passwordHash: 'stored-hash',
  status: 'ACTIVE',
  emailVerifiedAt: new Date('2026-01-01T00:00:00Z'),
  phoneVerifiedAt: null,
  failedLoginCount: 0,
  lockedUntil: null,
  lastLoginAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  roles: [{ userId: 'user-1', role: 'CUSTOMER', createdAt: new Date('2026-01-01T00:00:00Z') }],
};

function build() {
  const userModel = {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    create: vi.fn(),
    update: vi.fn().mockResolvedValue(persistedUser),
  };
  const outboxEvent = { create: vi.fn().mockResolvedValue({}) };
  const prisma = {
    user: userModel,
    authAttempt: { count: vi.fn().mockResolvedValue(0), create: vi.fn().mockResolvedValue({}) },
    $transaction: vi.fn(async (callback: (client: unknown) => Promise<unknown>) =>
      callback({ user: userModel, outboxEvent }),
    ),
  };
  const passwords = {
    validate: vi.fn().mockReturnValue([]),
    hash: vi.fn().mockResolvedValue('new-hash'),
    verify: vi.fn().mockResolvedValue(true),
    verifyDummy: vi.fn().mockResolvedValue(undefined),
  };
  const tokens = {
    hmac: vi.fn().mockReturnValue('identifier-hash'),
    signAccessToken: vi.fn().mockReturnValue({ token: 'access-token', expiresIn: 900 }),
  };
  const sessions = {
    create: vi.fn().mockResolvedValue({ sessionId: 'session-1', refreshToken: 'refresh-token' }),
    rotate: vi.fn(),
    revokeByToken: vi.fn(),
  };
  const verification = {
    issueEmailVerification: vi.fn().mockResolvedValue(undefined),
    issuePhoneVerification: vi.fn().mockResolvedValue(undefined),
    verifyEmail: vi.fn(),
    verifyPhone: vi.fn(),
  };
  const rateLimit = { consume: vi.fn().mockResolvedValue(undefined) };
  const audit = { record: vi.fn().mockResolvedValue(undefined) };

  const service = new AuthService(
    prisma as never,
    passwords as never,
    tokens as never,
    sessions as never,
    verification as never,
    rateLimit as never,
    audit as never,
    environment as never,
  );

  return { service, prisma, passwords, tokens, sessions, verification, rateLimit, audit, outboxEvent };
}

const registration = {
  fullName: 'Amina Hassan',
  email: 'Amina@Example.com',
  phone: '0712 345 678',
  password: 'ValidPassword123',
  passwordConfirmation: 'ValidPassword123',
};

describe('AuthService registration', () => {
  it('creates a customer with normalized identifiers and issues both verifications', async () => {
    const { service, prisma, passwords, verification, rateLimit, audit, outboxEvent } = build();
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ ...persistedUser, status: 'PENDING_VERIFICATION' });

    const result = await service.register(registration, meta);

    expect(result).toMatchObject({
      userId: 'user-1',
      email: 'amina@example.com',
      status: 'PENDING_VERIFICATION',
      verificationEmailSent: true,
      phoneVerificationSent: true,
    });
    expect(rateLimit.consume).toHaveBeenCalledWith('registration', ['203.0.113.5', 'amina@example.com'], 10, 3600);
    expect(passwords.hash).toHaveBeenCalledWith('ValidPassword123');
    const createCall = prisma.user.create.mock.calls[0]?.[0] as {
      data: { emailNormalized: string; phoneNormalized: string; roles: { create: { role: string } } };
    };
    expect(createCall.data.emailNormalized).toBe('amina@example.com');
    expect(createCall.data.phoneNormalized).toBe('+255712345678');
    expect(createCall.data.roles.create.role).toBe('CUSTOMER');
    expect(verification.issueEmailVerification).toHaveBeenCalledOnce();
    expect(verification.issuePhoneVerification).toHaveBeenCalledOnce();
    expect(outboxEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'user.registered',
        payload: expect.objectContaining({ userId: 'user-1', roles: ['CUSTOMER'] }),
      }),
    });
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'identity.registration.submitted' }));
  });

  it('rejects duplicate accounts without creating another user', async () => {
    const { service, prisma, passwords } = build();
    prisma.user.findFirst.mockResolvedValue({ id: 'existing-user' });

    await expect(service.register(registration, meta)).rejects.toMatchObject({
      response: { code: 'ACCOUNT_EXISTS' },
    });
    expect(passwords.hash).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('rejects mismatched and weak passwords before touching the database', async () => {
    const { service, prisma, passwords } = build();
    await expect(
      service.register({ ...registration, passwordConfirmation: 'DifferentPassword123' }, meta),
    ).rejects.toMatchObject({ response: { code: 'PASSWORD_MISMATCH' } });

    passwords.validate.mockReturnValue(['Use at least 12 characters.']);
    await expect(service.register(registration, meta)).rejects.toMatchObject({
      response: { code: 'WEAK_PASSWORD' },
    });
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('keeps registration successful when a verification message cannot be delivered', async () => {
    const { service, prisma, verification, audit } = build();
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ ...persistedUser, status: 'PENDING_VERIFICATION' });
    verification.issueEmailVerification.mockRejectedValue(new Error('smtp unavailable'));

    const result = await service.register(registration, meta);

    expect(result.verificationEmailSent).toBe(false);
    expect(result.phoneVerificationSent).toBe(true);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'identity.verification.email_delivery_failed' }),
    );
  });
});

describe('AuthService login', () => {
  it('signs in a verified active account and creates a refresh session', async () => {
    const { service, prisma, sessions, tokens, audit } = build();
    prisma.user.findFirst.mockResolvedValue(persistedUser);

    const result = await service.login({ identifier: 'Amina@Example.com', password: 'ValidPassword123' }, meta);

    expect(result.refreshToken).toBe('refresh-token');
    expect(result.auth.accessToken).toBe('access-token');
    expect(result.auth.user).toMatchObject({ id: 'user-1', emailVerified: true, roles: ['CUSTOMER'] });
    expect(sessions.create).toHaveBeenCalledWith('user-1', meta);
    expect(tokens.signAccessToken).toHaveBeenCalledOnce();
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ failedLoginCount: 0, lockedUntil: null }) }),
    );
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'identity.login.succeeded' }));
  });

  it('performs a dummy password check for unknown accounts to reduce timing leaks', async () => {
    const { service, prisma, passwords } = build();
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.login({ identifier: 'missing@example.com', password: 'ValidPassword123' }, meta),
    ).rejects.toMatchObject({ response: { code: 'INVALID_CREDENTIALS' } });
    expect(passwords.verifyDummy).toHaveBeenCalledWith('ValidPassword123');
    expect(passwords.verify).not.toHaveBeenCalled();
  });

  it('blocks unverified email addresses before creating a session', async () => {
    const { service, prisma, sessions } = build();
    prisma.user.findFirst.mockResolvedValue({
      ...persistedUser,
      status: 'PENDING_VERIFICATION',
      emailVerifiedAt: null,
    });

    await expect(
      service.login({ identifier: 'amina@example.com', password: 'ValidPassword123' }, meta),
    ).rejects.toMatchObject({ response: { code: 'EMAIL_NOT_VERIFIED' } });
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it('requires phone verification before accepting a phone-based login', async () => {
    const { service, prisma, sessions } = build();
    prisma.user.findFirst.mockResolvedValue({ ...persistedUser, phoneVerifiedAt: null });

    await expect(
      service.login({ identifier: '+255712345678', password: 'ValidPassword123' }, meta),
    ).rejects.toMatchObject({ response: { code: 'PHONE_NOT_VERIFIED' } });
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it('increments failed attempts and locks the account at the configured threshold', async () => {
    const { service, prisma, passwords, audit } = build();
    prisma.user.findFirst.mockResolvedValue({ ...persistedUser, failedLoginCount: 4 });
    passwords.verify.mockResolvedValue(false);

    await expect(
      service.login({ identifier: 'amina@example.com', password: 'WrongPassword123' }, meta),
    ).rejects.toMatchObject({ response: { code: 'INVALID_CREDENTIALS' } });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ failedLoginCount: 0, lockedUntil: expect.any(Date) }),
      }),
    );
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'identity.login.locked' }));
  });

  it('refuses logins while an account lock is active', async () => {
    const { service, prisma } = build();
    prisma.user.findFirst.mockResolvedValue({
      ...persistedUser,
      lockedUntil: new Date(Date.now() + 60_000),
    });

    await expect(
      service.login({ identifier: 'amina@example.com', password: 'ValidPassword123' }, meta),
    ).rejects.toMatchObject({ response: { code: 'ACCOUNT_TEMPORARILY_LOCKED' } });
  });
});
