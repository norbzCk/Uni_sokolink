import { describe, expect, it, vi } from 'vitest';
import type { IdentityEnvironment } from '../../environment';
import { SessionService } from './session.service';

const meta = { ipAddress: '203.0.113.5', userAgent: 'vitest', correlationId: 'test' };
const environment = { REFRESH_TOKEN_TTL_DAYS: 30 } as unknown as IdentityEnvironment;

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: 'session-1',
    familyId: '11111111-1111-4111-8111-111111111111',
    userId: 'user-1',
    tokenHash: 'hash',
    replacedBySessionId: null,
    revokedAt: null,
    revocationReason: null,
    expiresAt: new Date(Date.now() + 86_400_000),
    createdAt: new Date(),
    lastUsedAt: null,
    ipAddress: null,
    userAgent: null,
    user: {
      id: 'user-1',
      email: 'amina@example.com',
      fullName: 'Amina Hassan',
      status: 'ACTIVE',
      roles: [{ role: 'CUSTOMER' }],
    },
    ...overrides,
  };
}

function build(storedSession: ReturnType<typeof session>) {
  const committed: { familyId: string; reason: string | null }[] = [];
  const pending: { familyId: string; reason: string | null }[] = [];
  const tx = {
    refreshSession: {
      findUnique: vi.fn().mockResolvedValue(storedSession),
      updateMany: vi.fn(async (args: { where: { familyId?: string }; data: { revocationReason?: string } }) => {
        if (args.where.familyId) {
          pending.push({ familyId: args.where.familyId, reason: args.data.revocationReason ?? null });
        }
        return { count: 1 };
      }),
      create: vi.fn().mockResolvedValue({ id: 'session-2' }),
      update: vi.fn().mockResolvedValue({}),
    },
  };
  const prisma = {
    $transaction: vi.fn(async (callback: (client: unknown) => Promise<unknown>) => {
      const result = await callback(tx);
      committed.push(...pending);
      return result;
    }),
  };
  const tokens = {
    hashToken: vi.fn().mockReturnValue('hash'),
    createOpaqueToken: vi.fn().mockReturnValue('next-refresh-token'),
  };
  const audit = { record: vi.fn().mockResolvedValue(undefined) };
  const service = new SessionService(prisma as never, tokens as never, audit as never, environment as never);
  return { service, audit, committed, tokens };
}

describe('SessionService rotation', () => {
  it('commits family revocation when a reused refresh token is detected', async () => {
    const { service, audit, committed } = build(session({ revokedAt: new Date() }));

    await expect(service.rotate('reused-token', meta)).rejects.toMatchObject({
      response: { code: 'SESSION_REUSE_DETECTED' },
    });

    expect(committed).toContainEqual({
      familyId: '11111111-1111-4111-8111-111111111111',
      reason: 'reuse_detected',
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.refresh.reuse_detected' }),
    );
  });

  it('commits expiry revocation before returning the error', async () => {
    const { service, committed } = build(session({ expiresAt: new Date(Date.now() - 1000) }));

    await expect(service.rotate('expired-token', meta)).rejects.toMatchObject({
      response: { code: 'SESSION_EXPIRED' },
    });
    expect(committed).toContainEqual({
      familyId: '11111111-1111-4111-8111-111111111111',
      reason: 'expired',
    });
  });

  it('rejects unknown refresh tokens without leaking session existence', async () => {
    const { service } = build(session());
    const prisma = {
      $transaction: vi.fn(),
    };
    const tokens = { hashToken: vi.fn().mockReturnValue('hash'), createOpaqueToken: vi.fn() };
    const audit = { record: vi.fn() };
    const isolated = new SessionService(prisma as never, tokens as never, audit as never, environment as never);
    prisma.$transaction.mockResolvedValue({ kind: 'invalid' });

    await expect(isolated.rotate('missing-token', meta)).rejects.toMatchObject({
      response: { code: 'SESSION_INVALID' },
    });
    expect(audit.record).not.toHaveBeenCalled();
    void service;
  });

  it('rotates an active session and links the replacement', async () => {
    const { service, tokens, committed } = build(session());

    const rotated = await service.rotate('active-token', meta);

    expect(rotated.refreshToken).toBe('next-refresh-token');
    expect(rotated.user.id).toBe('user-1');
    expect(tokens.createOpaqueToken).toHaveBeenCalledOnce();
    expect(committed).toHaveLength(0);
  });
});
