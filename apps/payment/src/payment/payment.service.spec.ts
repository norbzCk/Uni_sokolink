import { describe, expect, it, vi } from 'vitest';
import { PaymentService } from './payment.service';

function build(methods: Array<Record<string, unknown>>) {
  const findMany = vi.fn().mockResolvedValue(methods);
  const findUnique = vi.fn(async ({ where }: { where: { code: string } }) =>
    methods.find((method) => method.code === where.code) ?? null,
  );
  const prisma = {
    paymentMethod: { findMany, findUnique },
    payment: { findUnique: vi.fn(), create: vi.fn() },
  };
  return { service: new PaymentService(prisma as never), findMany };
}

const methods = [
  {
    code: 'CASH_ON_DELIVERY',
    name: 'Cash on delivery',
    description: 'Cash',
    kind: 'CASH',
    enabled: true,
    instructions: null,
  },
  {
    code: 'BANK_TRANSFER',
    name: 'Bank transfer',
    description: 'Bank',
    kind: 'BANK_TRANSFER',
    enabled: true,
    instructions: null,
  },
];

describe('payment method allowlist', () => {
  it('queries only cash and mobile money methods for public checkout', async () => {
    const { service, findMany } = build(methods);

    await service.listPublicMethods();

    expect(findMany).toHaveBeenCalledWith({
      where: { enabled: true, kind: { in: ['CASH', 'MOBILE_MONEY'] } },
      orderBy: { sortOrder: 'asc' },
    });
  });

  it('rejects bank transfer validation even when the record is enabled', async () => {
    const { service } = build(methods);

    await expect(service.validateMethod('BANK_TRANSFER')).rejects.toMatchObject({
      response: { code: 'PAYMENT_METHOD_UNAVAILABLE' },
    });
  });
});
