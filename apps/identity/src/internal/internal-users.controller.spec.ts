import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { InternalUsersController } from './internal-users.controller';

const originalToken = process.env.INTERNAL_SERVICE_TOKEN;
const request = { header: () => 'test-internal-token' } as never;

beforeAll(() => {
  process.env.INTERNAL_SERVICE_TOKEN = 'test-internal-token';
});

afterAll(() => {
  if (originalToken === undefined) delete process.env.INTERNAL_SERVICE_TOKEN;
  else process.env.INTERNAL_SERVICE_TOKEN = originalToken;
});

function build(user: Record<string, unknown> | null) {
  const userModel = { findUnique: vi.fn().mockResolvedValue(user), upsert: vi.fn() };
  const prisma = { user: userModel, userRole: { upsert: vi.fn() } };
  return { controller: new InternalUsersController(prisma as never), prisma };
}

describe('internal seller eligibility', () => {
  it('approves verified IFM students', async () => {
    const { controller } = build({
      customerCategory: 'STUDENT',
      institution: 'Institute of Finance Management',
      studentRegistrationNumber: '2024/12345',
      emailVerifiedAt: new Date('2026-01-01T00:00:00Z'),
    });

    await expect(controller.sellerEligibility('user-1', request)).resolves.toMatchObject({
      eligible: true,
    });
  });

  it('rejects staff accounts and non-IFM students', async () => {
    const staff = build({
      customerCategory: 'STAFF',
      institution: 'IFM',
      studentRegistrationNumber: null,
      emailVerifiedAt: new Date('2026-01-01T00:00:00Z'),
    });
    await expect(staff.controller.sellerEligibility('user-1', request)).resolves.toMatchObject({
      eligible: false,
      reason: 'Only IFM students can sell at launch.',
    });

    const other = build({
      customerCategory: 'STUDENT',
      institution: 'Other University',
      studentRegistrationNumber: '2024/12345',
      emailVerifiedAt: new Date('2026-01-01T00:00:00Z'),
    });
    await expect(other.controller.sellerEligibility('user-2', request)).resolves.toMatchObject({
      eligible: false,
    });
  });
});
