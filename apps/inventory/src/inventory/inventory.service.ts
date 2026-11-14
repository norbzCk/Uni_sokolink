import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AdjustStockDto, StockMovementBatchDto, StockSettingsDto } from './inventory.dto';

type StockRow = {
  productId: string;
  sellerId: string;
  onHand: number;
  reserved: number;
  lowStockThreshold: number;
  unit: string;
};

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async initialize(input: {
    productId: string;
    sellerId: string;
    quantity: number;
    lowStockThreshold: number;
    unit: string;
  }) {
    const existing = await this.prisma.stockItem.findUnique({
      where: { productId: input.productId },
    });
    if (existing) {
      return this.present(existing);
    }
    const item = await this.prisma.$transaction(async (tx) => {
      const created = await tx.stockItem.create({
        data: {
          productId: input.productId,
          sellerId: input.sellerId,
          onHand: input.quantity,
          reserved: 0,
          lowStockThreshold: input.lowStockThreshold,
          unit: input.unit,
        },
      });
      await tx.stockMovement.create({
        data: {
          productId: created.productId,
          sellerId: created.sellerId,
          type: 'OPENING',
          onHandDelta: input.quantity,
          reservedDelta: 0,
          onHandAfter: input.quantity,
          reservedAfter: 0,
          reason: 'Opening stock',
          reference: 'PRODUCT_CREATED',
        },
      });
      return created;
    });
    return this.present(item);
  }

  async levels(productIds: string[]) {
    const items = await this.prisma.stockItem.findMany({
      where: { productId: { in: productIds } },
    });
    return items.map((item) => this.present(item));
  }

  async reserve(batch: StockMovementBatchDto) {
    return this.prisma.$transaction(async (tx) => {
      const results: StockRow[] = [];
      for (const item of this.mergeItems(batch.items)) {
        const applied = await tx.stockMovement.findFirst({
          where: { productId: item.productId, type: 'RESERVATION', reference: batch.reference },
          select: { id: true },
        });
        if (applied) {
          const current = await tx.stockItem.findUnique({ where: { productId: item.productId } });
          if (current) results.push(current);
          continue;
        }
        const rows = await tx.$queryRaw<StockRow[]>`
          UPDATE "StockItem"
          SET "reserved" = "reserved" + ${item.quantity}, "updatedAt" = NOW()
          WHERE "productId" = ${item.productId}::uuid
            AND "onHand" - "reserved" >= ${item.quantity}
          RETURNING "productId", "sellerId", "onHand", "reserved", "lowStockThreshold", "unit"
        `;
        const row = rows[0];
        if (!row) {
          throw new ConflictException({
            code: 'STOCK_UNAVAILABLE',
            message: 'One or more products no longer have enough stock. Review your cart and try again.',
            fieldErrors: { stock: 'Insufficient stock for product ' + item.productId + '.' },
          });
        }
        await tx.stockMovement.create({
          data: {
            productId: row.productId,
            sellerId: row.sellerId,
            type: 'RESERVATION',
            onHandDelta: 0,
            reservedDelta: item.quantity,
            onHandAfter: row.onHand,
            reservedAfter: row.reserved,
            reason: 'Stock reserved for checkout',
            reference: batch.reference,
          },
        });
        results.push(row);
      }
      return results.map((row) => this.present(row));
    });
  }

  async release(batch: StockMovementBatchDto) {
    return this.prisma.$transaction(async (tx) => {
      const results: StockRow[] = [];
      for (const item of this.mergeItems(batch.items)) {
        const applied = await tx.stockMovement.findFirst({
          where: { productId: item.productId, type: 'RELEASE', reference: batch.reference },
          select: { id: true },
        });
        if (applied) {
          const current = await tx.stockItem.findUnique({ where: { productId: item.productId } });
          if (current) results.push(current);
          continue;
        }
        const rows = await tx.$queryRaw<StockRow[]>`
          UPDATE "StockItem"
          SET "reserved" = GREATEST("reserved" - ${item.quantity}, 0), "updatedAt" = NOW()
          WHERE "productId" = ${item.productId}::uuid
          RETURNING "productId", "sellerId", "onHand", "reserved", "lowStockThreshold", "unit"
        `;
        const row = rows[0];
        if (!row) continue;
        await tx.stockMovement.create({
          data: {
            productId: row.productId,
            sellerId: row.sellerId,
            type: 'RELEASE',
            onHandDelta: 0,
            reservedDelta: -item.quantity,
            onHandAfter: row.onHand,
            reservedAfter: row.reserved,
            reason: 'Stock reservation released',
            reference: batch.reference,
          },
        });
        results.push(row);
      }
      return results.map((row) => this.present(row));
    });
  }

  async commitSale(batch: StockMovementBatchDto) {
    return this.prisma.$transaction(async (tx) => {
      const results: StockRow[] = [];
      for (const item of this.mergeItems(batch.items)) {
        const applied = await tx.stockMovement.findFirst({
          where: { productId: item.productId, type: 'FULFILMENT', reference: batch.reference },
          select: { id: true },
        });
        if (applied) {
          const current = await tx.stockItem.findUnique({ where: { productId: item.productId } });
          if (current) results.push(current);
          continue;
        }
        const rows = await tx.$queryRaw<StockRow[]>`
          UPDATE "StockItem"
          SET "onHand" = "onHand" - ${item.quantity},
              "reserved" = GREATEST("reserved" - ${item.quantity}, 0),
              "updatedAt" = NOW()
          WHERE "productId" = ${item.productId}::uuid
            AND "onHand" >= ${item.quantity}
            AND "reserved" >= ${item.quantity}
          RETURNING "productId", "sellerId", "onHand", "reserved", "lowStockThreshold", "unit"
        `;
        const row = rows[0];
        if (!row) continue;
        await tx.stockMovement.create({
          data: {
            productId: row.productId,
            sellerId: row.sellerId,
            type: 'FULFILMENT',
            onHandDelta: -item.quantity,
            reservedDelta: -item.quantity,
            onHandAfter: row.onHand,
            reservedAfter: row.reserved,
            reason: 'Order delivered',
            reference: batch.reference,
          },
        });
        results.push(row);
      }
      return results.map((row) => this.present(row));
    });
  }

  async sellerItems(sellerId: string) {
    const items = await this.prisma.stockItem.findMany({
      where: { sellerId },
      orderBy: { updatedAt: 'desc' },
    });
    return items.map((item) => this.present(item));
  }

  async movements(sellerId: string, productId: string) {
    const item = await this.prisma.stockItem.findFirst({ where: { productId, sellerId } });
    if (!item) {
      throw new NotFoundException({ code: 'STOCK_NOT_FOUND', message: 'Stock item not found.' });
    }
    const movements = await this.prisma.stockMovement.findMany({
      where: { productId, sellerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return {
      item: this.present(item),
      movements: movements.map((movement) => ({
        id: movement.id,
        type: movement.type,
        onHandDelta: movement.onHandDelta,
        reservedDelta: movement.reservedDelta,
        onHandAfter: movement.onHandAfter,
        reservedAfter: movement.reservedAfter,
        reason: movement.reason,
        reference: movement.reference,
        createdAt: movement.createdAt.toISOString(),
      })),
    };
  }

  async adjust(sellerId: string, productId: string, dto: AdjustStockDto) {
    if (dto.quantityDelta === 0) {
      throw new ConflictException({
        code: 'NO_STOCK_CHANGE',
        message: 'Enter a positive or negative stock adjustment.',
      });
    }
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<StockRow[]>`
        UPDATE "StockItem"
        SET "onHand" = "onHand" + ${dto.quantityDelta}, "updatedAt" = NOW()
        WHERE "productId" = ${productId}::uuid
          AND "sellerId" = ${sellerId}::uuid
          AND "onHand" + ${dto.quantityDelta} >= 0
        RETURNING "productId", "sellerId", "onHand", "reserved", "lowStockThreshold", "unit"
      `;
      const row = rows[0];
      if (!row) {
        throw new ConflictException({
          code: 'INVALID_STOCK_ADJUSTMENT',
          message: 'That adjustment would make on-hand stock negative or the stock item does not exist.',
        });
      }
      await tx.stockMovement.create({
        data: {
          productId,
          sellerId,
          type: 'ADJUSTMENT',
          onHandDelta: dto.quantityDelta,
          reservedDelta: 0,
          onHandAfter: row.onHand,
          reservedAfter: row.reserved,
          reason: dto.reason,
          reference: 'MANUAL_ADJUSTMENT',
          actorId: sellerId,
        },
      });
      return this.present(row);
    });
  }

  async updateSettings(sellerId: string, productId: string, dto: StockSettingsDto) {
    const item = await this.prisma.stockItem.findFirst({ where: { productId, sellerId } });
    if (!item) {
      throw new NotFoundException({ code: 'STOCK_NOT_FOUND', message: 'Stock item not found.' });
    }
    const updated = await this.prisma.stockItem.update({
      where: { productId },
      data: {
        ...(dto.lowStockThreshold !== undefined
          ? { lowStockThreshold: dto.lowStockThreshold }
          : {}),
        ...(dto.unit !== undefined ? { unit: dto.unit } : {}),
      },
    });
    return this.present(updated);
  }

  private mergeItems(items: { productId: string; quantity: number }[]) {
    const merged = new Map<string, number>();
    for (const item of items) {
      merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
    }
    return [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity }));
  }

  private present(item: {
    productId: string;
    onHand: number;
    reserved: number;
    lowStockThreshold: number;
    unit: string;
  }) {
    const available = item.onHand - item.reserved;
    return {
      productId: item.productId,
      onHand: item.onHand,
      reserved: item.reserved,
      available,
      lowStockThreshold: item.lowStockThreshold,
      unit: item.unit,
      lowStock: available <= item.lowStockThreshold,
      outOfStock: available <= 0,
    };
  }
}
