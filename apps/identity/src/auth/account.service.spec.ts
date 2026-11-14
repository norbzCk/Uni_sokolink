import { describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
import type { IdentityEnvironment } from '../environment';

const meta = { ipAddress: '203.0.113.7', userAgent: 'vitest', correlationId: 'account-test' };
const user = {
  id: 'user-1',
  fullName: 'Amina Hassan',
  email: 'amina@example.com',
  emailNormalized: 'amina@example.com',
  phone: '+255712345678',
  phoneNormalized: '+255712345678',
  passwordHash: 'old-hash',
  status: 'ACTIVE',
  emailVerifiedAt: new Date('2026-01-01T00:00:00Z'),
  phoneVerifiedAt: new Date('2026-01-01T00:00:00Z'),
  failedLoginCount: 0,
  lockedUntil: null,
  lastLoginAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  roles: [{ userId: 'user-1', role: 'CUSTOMER', createdAt: new Date('2026-01-01T00:00:00Z') }],
};

function build() {
  const tx = {
    user: { update: vi.fn().mockResolvedValue(user) },
    refreshSession: { updateMany: vi.fn().mockResolvedValue({ count: 2 }) },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
    outboxEvent: { create: vi.fn().mockResolvedValue({}) },
  };
  const prisma = {
    user: {
      findUnique: vi.fn().mockResolvedValue(user),
      findUniqueOrThrow: vi.fn().mockResolvedValue(user),
      update: vi.fn().mockResolvedValue({ ...user, fullName: 'Amina H.' }),
    },
    $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
  };
  const passwords = {
    verify: vi.fn().mockImplementation(async (hash: string, password: string) =>
      hash === 'old-hash' && password === 'CurrentPassword123'),
    validate: vi.fn().mockReturnValue([]),
    hash: vi.fn().mockResolvedValue('new-hash'),
  };
  const tokens = {};
  const sessions = {};
  const verification = {};
  const rateLimit = {};
  const audit = { record: vi.fn().mockResolvedValue(undefined) };
  const environment = {} as IdentityEnvironment;
  const service = new AuthService(
    prisma as never,
    passwords as never,
    tokens as never,
    sessions as never,
    verification as never,
    rateLimit as never,
    audit as never,
    environment,
  );
  return { service, prisma, passwords, tx };
}

describe('authenticated account management', () => {
  it('updates only the current user profile and records an audit event', async () => {
    const { service, prisma } = build();

    const result = await service.updateProfile('user-1', ' Amina H. ', meta);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { fullName: 'Amina H.' },
      include: { roles: true },
    });
    expect(result.fullName).toBe('Amina H.');
  });

  it('requires the current password and revokes every refresh session atomically', async () => {
    const { service, passwords, tx, prisma } = build();

    await service.changePassword(
      'user-1',
      'CurrentPassword123',
      'NewSecurePassword456',
      'NewSecurePassword456',
      meta,
    );

    expect(passwords.hash).toHaveBeenCalledWith('NewSecurePassword456');
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(tx.user.update).toHaveBeenCalledWith({ where: { id: 'user-1' }, data: { passwordHash: 'new-hash' } });
    expect(tx.refreshSession.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', revokedAt: null },
      data: expect.objectContaining({ revocationReason: 'password_changed' }),
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ actorId: 'user-1', action: 'identity.password_changed' }),
    });
    expect(tx.outboxEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'user.password_changed' }),
    });
  });

  it('rejects an incorrect current password without changing credentials', async () => {
    const { service, passwords, prisma } = build();

    await expect(
      service.changePassword('user-1', 'wrong', 'NewSecurePassword456', 'NewSecurePassword456', meta),
    ).rejects.toMatchObject({ response: { code: 'CURRENT_PASSWORD_INVALID' } });

    expect(passwords.hash).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
