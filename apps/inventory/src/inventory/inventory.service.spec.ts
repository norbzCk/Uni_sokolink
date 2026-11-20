import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InventoryService } from './inventory.service';

const sellerId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const productA = '11111111-1111-1111-1111-111111111111';
const productB = '22222222-2222-2222-2222-222222222222';
const productC = '33333333-3333-3333-3333-333333333333';

function movement(input: {
  productId: string;
  type: 'OPENING' | 'ADJUSTMENT' | 'RESERVATION' | 'RELEASE' | 'FULFILMENT';
  onHandDelta: number;
  reservedDelta: number;
  createdAt: string;
}) {
  return { ...input, createdAt: new Date(input.createdAt) };
}

describe('InventoryService analytics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-20T12:00:00.000Z'));
  });

  it('summarises stock health and ledger movement for the requested window', async () => {
    const prisma = {
      stockItem: {
        findMany: vi.fn().mockResolvedValue([
          { productId: productA, onHand: 15, reserved: 2, lowStockThreshold: 5, unit: 'piece' },
          { productId: productB, onHand: 6, reserved: 5, lowStockThreshold: 2, unit: 'piece' },
          { productId: productC, onHand: 1, reserved: 1, lowStockThreshold: 0, unit: 'piece' },
        ]),
      },
      stockMovement: {
        findMany: vi.fn().mockResolvedValue([
          movement({ productId: productA, type: 'OPENING', onHandDelta: 20, reservedDelta: 0, createdAt: '2026-11-20T08:00:00.000Z' }),
          movement({ productId: productA, type: 'RESERVATION', onHandDelta: 0, reservedDelta: 5, createdAt: '2026-11-20T09:00:00.000Z' }),
          movement({ productId: productA, type: 'FULFILMENT', onHandDelta: -3, reservedDelta: -3, createdAt: '2026-11-20T10:00:00.000Z' }),
          movement({ productId: productB, type: 'ADJUSTMENT', onHandDelta: -2, reservedDelta: 0, createdAt: '2026-11-20T11:00:00.000Z' }),
          movement({ productId: productC, type: 'RESERVATION', onHandDelta: 0, reservedDelta: 4, createdAt: '2026-11-19T09:00:00.000Z' }),
          movement({ productId: productC, type: 'RELEASE', onHandDelta: 0, reservedDelta: -4, createdAt: '2026-11-19T10:00:00.000Z' }),
          movement({ productId: productB, type: 'ADJUSTMENT', onHandDelta: 1, reservedDelta: 0, createdAt: '2026-11-19T11:00:00.000Z' }),
        ]),
      },
    };
    const service = new InventoryService(prisma as never);

    const result = await service.analytics(sellerId, 7);

    expect(result.range).toMatchObject({ days: 7, from: '2026-11-14T00:00:00.000Z' });
    expect(result.trend).toHaveLength(7);
    expect(result.trend[6]).toMatchObject({ date: '2026-11-20', stockIn: 20, stockOut: 5, net: 15 });
    expect(result.summary).toMatchObject({
      products: 3,
      onHand: 22,
      reserved: 8,
      available: 14,
      healthyProducts: 1,
      lowStockProducts: 1,
      outOfStockProducts: 1,
      movementCount: 7,
      stockIn: 21,
      stockOut: 5,
      reservations: 9,
      releases: 4,
      netOnHand: 16,
    });
    expect(result.topMoved[0]).toMatchObject({ productId: productA, stockIn: 20, stockOut: 3 });
    expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sellerId, createdAt: { gte: new Date('2026-11-14T00:00:00.000Z') } } }),
    );
  });

  it('falls back to a 30 day window when an unsupported range is supplied', async () => {
    const prisma = {
      stockItem: { findMany: vi.fn().mockResolvedValue([]) },
      stockMovement: { findMany: vi.fn().mockResolvedValue([]) },
    };
    const service = new InventoryService(prisma as never);

    const result = await service.analytics(sellerId, 14);

    expect(result.range.days).toBe(30);
    expect(result.trend).toHaveLength(30);
    expect(result.trend[0]?.date).toBe('2026-10-22');
  });
});
