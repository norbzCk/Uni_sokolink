import { describe, expect, it } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateOrderDto } from './commerce.dto';

const base = {
  items: [{ productId: 'f7c6d7d4-503f-4b2d-8d8d-3f7c1a1d5e51', quantity: 1 }],
  deliveryMethod: 'SELLER_DELIVERY',
  contactName: 'Amina Hassan',
  contactPhone: '+255712345678',
  paymentMethodCode: 'CASH_ON_DELIVERY',
  idempotencyKey: 'checkout-12345678',
};

function fieldErrors(overrides: Record<string, unknown> = {}): string[] {
  const dto = plainToInstance(CreateOrderDto, { ...base, ...overrides });
  return validateSync(dto).flatMap((error) => Object.keys(error.constraints ?? {}));
}

describe('checkout business fields', () => {
  it('accepts seller-arranged delivery and campus pickup', () => {
    expect(fieldErrors()).toEqual([]);
    expect(fieldErrors({ deliveryMethod: 'PICKUP' })).toEqual([]);
  });

  it('rejects legacy generic delivery and partner delivery', () => {
    expect(fieldErrors({ deliveryMethod: 'DELIVERY' })).toContain('isIn');
    expect(fieldErrors({ deliveryMethod: 'PARTNER_DELIVERY' })).toContain('isIn');
  });
});
