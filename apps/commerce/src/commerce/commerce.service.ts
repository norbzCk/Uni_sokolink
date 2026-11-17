import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { Prisma, type OrderStatus } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { loadEnvironment } from '../environment';
import type { ServiceUser } from '@sokolink/platform';
import type { CreateOrderDto, SellerOrdersQuery, UpdateSellerOrderStatusDto } from './commerce.dto';

const MOBILE_MONEY_PAYMENT_CODES = ['MPESA', 'AIRTEL_MONEY', 'MIXX_BY_YAS'];
const SELLER_DELIVERY_PAYMENT_CODES = new Set([
  'CASH_ON_DELIVERY',
  ...MOBILE_MONEY_PAYMENT_CODES,
]);
const PICKUP_PAYMENT_CODES = new Set(['PAY_ON_PICKUP', ...MOBILE_MONEY_PAYMENT_CODES]);

type ProductSnapshot = {
  id: string;
  sellerId: string;
  sellerName: string;
  name: string;
  slug: string;
  unit: string;
  priceTzs: number;
  currency: string;
  imageUrl: string | null;
};

type OrderWithDetails = Prisma.OrderGetPayload<{
  include: { sellerOrders: { include: { items: true } } };
}>;

type SellerOrderWithOrder = Prisma.SellerOrderGetPayload<{
  include: { order: true; items: true };
}>;

@Injectable()
export class CommerceService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(user: ServiceUser, dto: CreateOrderDto) {
    const existing = await this.prisma.order.findUnique({
      where: { buyerId_idempotencyKey: { buyerId: user.id, idempotencyKey: dto.idempotencyKey } },
      include: { sellerOrders: { include: { items: true } } },
    });
    if (existing) {
      return this.presentOrder(existing);
    }

    if (dto.deliveryMethod === 'SELLER_DELIVERY') {
      if (!dto.region?.trim() || !dto.district?.trim() || !dto.addressLine?.trim()) {
        throw new BadRequestException({
          code: 'DELIVERY_ADDRESS_REQUIRED',
          message: 'Enter the region, district and delivery address for a seller-delivered order.',
          fieldErrors: { addressLine: 'Enter the region, district and delivery address.' },
        });
      }
    }
    this.assertPaymentMethodForDelivery(dto.deliveryMethod, dto.paymentMethodCode);

    const merged = new Map<string, number>();
    for (const item of dto.items) {
      merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
    }
    const requested = [...merged.entries()].map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
    const products = await this.fetchProducts(requested.map((item) => item.productId));
    const productById = new Map(products.map((product) => [product.id, product]));
    for (const item of requested) {
      if (!productById.has(item.productId)) {
        throw new BadRequestException({
          code: 'PRODUCT_UNAVAILABLE',
          message: 'One or more products in your cart are no longer available.',
          fieldErrors: { items: 'Remove unavailable products and try again.' },
        });
      }
    }

    const method = await this.validatePaymentMethod(dto.paymentMethodCode);
    const orderNumber = this.orderNumber();
    const reference = orderNumber;

    let reserved = false;
    try {
      await this.reserveStock(requested, reference);
      reserved = true;

      const sellerGroups = new Map<string, { sellerName: string; items: typeof requested }>();
      for (const item of requested) {
        const product = productById.get(item.productId)!;
        const group = sellerGroups.get(product.sellerId) ?? {
          sellerName: product.sellerName,
          items: [],
        };
        group.items.push(item);
        sellerGroups.set(product.sellerId, group);
      }

      const subtotal = requested.reduce(
        (sum, item) => sum + productById.get(item.productId)!.priceTzs * item.quantity,
        0,
      );

      const order = await this.prisma.order.create({
        data: {
          orderNumber,
          buyerId: user.id,
          buyerName: user.fullName,
          buyerEmail: user.email,
          buyerPhone: dto.contactPhone,
          deliveryMethod: dto.deliveryMethod,
          contactName: dto.contactName,
          contactPhone: dto.contactPhone,
          region: dto.region ?? null,
          district: dto.district ?? null,
          addressLine: dto.addressLine ?? null,
          landmark: dto.landmark ?? null,
          notes: dto.notes ?? null,
          paymentMethodCode: method.code,
          paymentMethodName: method.name,
          paymentStatus: 'PENDING',
          status: 'PLACED',
          subtotalTzs: subtotal,
          deliveryFeeTzs: 0,
          totalTzs: subtotal,
          currency: 'TZS',
          idempotencyKey: dto.idempotencyKey,
          sellerOrders: {
            create: [...sellerGroups.entries()].map(([sellerId, group]) => ({
              sellerId,
              sellerName: group.sellerName,
              subtotalTzs: group.items.reduce(
                (sum, item) => sum + productById.get(item.productId)!.priceTzs * item.quantity,
                0,
              ),
              status: 'PLACED',
              items: {
                create: group.items.map((item) => {
                  const product = productById.get(item.productId)!;
                  return {
                    productId: product.id,
                    productName: product.name,
                    productSlug: product.slug,
                    imageUrl: product.imageUrl,
                    unit: product.unit,
                    unitPriceTzs: product.priceTzs,
                    quantity: item.quantity,
                    lineTotalTzs: product.priceTzs * item.quantity,
                  };
                }),
              },
            })),
          },
        },
        include: { sellerOrders: { include: { items: true } } },
      });

      try {
        await this.createPayment(order.id, user.id, order.totalTzs, method.code);
      } catch {
        await this.prisma.order.delete({ where: { id: order.id } }).catch(() => undefined);
        await this.releaseStock(requested, reference).catch(() => undefined);
        reserved = false;
        throw new BadGatewayException({
          code: 'PAYMENT_SETUP_FAILED',
          message: 'Checkout could not be completed because payment setup failed. Try again.',
        });
      }

      return this.presentOrder(order);
    } catch (error) {
      if (reserved) {
        await this.releaseStock(requested, reference).catch(() => undefined);
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const raced = await this.prisma.order.findUnique({
          where: {
            buyerId_idempotencyKey: { buyerId: user.id, idempotencyKey: dto.idempotencyKey },
          },
          include: { sellerOrders: { include: { items: true } } },
        });
        if (raced) return this.presentOrder(raced);
      }
      throw error;
    }
  }

  async listBuyerOrders(user: ServiceUser) {
    const orders = await this.prisma.order.findMany({
      where: { buyerId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { sellerOrders: { include: { items: true } } },
      take: 100,
    });
    return orders.map((order) => this.presentOrder(order));
  }

  async getBuyerOrder(user: ServiceUser, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, buyerId: user.id },
      include: { sellerOrders: { include: { items: true } } },
    });
    if (!order) {
      throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'Order not found.' });
    }
    return this.presentOrder(order);
  }

  async listSellerOrders(user: ServiceUser, query: SellerOrdersQuery) {
    const orders = await this.prisma.sellerOrder.findMany({
      where: { sellerId: user.id, ...(query.status ? { status: query.status } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { order: true, items: true },
      take: 200,
    });
    return orders.map((order) => this.presentSellerOrder(order));
  }

  async getSellerOrder(user: ServiceUser, sellerOrderId: string) {
    const order = await this.prisma.sellerOrder.findFirst({
      where: { id: sellerOrderId, sellerId: user.id },
      include: { order: true, items: true },
    });
    if (!order) {
      throw new NotFoundException({
        code: 'SELLER_ORDER_NOT_FOUND',
        message: 'Seller order not found.',
      });
    }
    return this.presentSellerOrder(order);
  }

  async sellerStats(user: ServiceUser) {
    const grouped = await this.prisma.sellerOrder.groupBy({
      by: ['status'],
      where: { sellerId: user.id },
      _count: { _all: true },
      _sum: { subtotalTzs: true },
    });
    const counts: Record<OrderStatus, number> = {
      PLACED: 0,
      CONFIRMED: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    let deliveredSalesTzs = 0;
    for (const group of grouped) {
      counts[group.status] = group._count._all;
      if (group.status === 'DELIVERED') {
        deliveredSalesTzs = group._sum.subtotalTzs ?? 0;
      }
    }
    return {
      counts,
      deliveredSalesTzs,
      actionRequired: counts.PLACED + counts.CONFIRMED,
    };
  }

  async updateSellerOrderStatus(
    user: ServiceUser,
    sellerOrderId: string,
    dto: UpdateSellerOrderStatusDto,
  ) {
    const sellerOrder = await this.prisma.sellerOrder.findFirst({
      where: { id: sellerOrderId, sellerId: user.id },
      include: { order: true, items: true },
    });
    if (!sellerOrder) {
      throw new NotFoundException({
        code: 'SELLER_ORDER_NOT_FOUND',
        message: 'Seller order not found.',
      });
    }
    if (!this.isAllowedTransition(sellerOrder.status, dto.status)) {
      throw new ConflictException({
        code: 'INVALID_ORDER_TRANSITION',
        message:
          'This order cannot move from ' + sellerOrder.status + ' to ' + dto.status + '.',
      });
    }

    const items = sellerOrder.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));
    const reference = sellerOrder.order.orderNumber + '/' + sellerOrder.id;
    if (dto.status === 'DELIVERED') {
      await this.commitStock(items, reference);
    }
    if (dto.status === 'CANCELLED') {
      await this.releaseStock(items, reference);
    }

    await this.prisma.sellerOrder.update({
      where: { id: sellerOrder.id },
      data: { status: dto.status },
    });
    await this.recomputeParentStatus(sellerOrder.orderId);

    const updated = await this.prisma.sellerOrder.findUnique({
      where: { id: sellerOrder.id },
      include: { order: true, items: true },
    });
    if (!updated) {
      throw new NotFoundException({
        code: 'SELLER_ORDER_NOT_FOUND',
        message: 'Seller order not found.',
      });
    }
    return this.presentSellerOrder(updated);
  }

  private async recomputeParentStatus(orderId: string): Promise<void> {
    const suborders = await this.prisma.sellerOrder.findMany({
      where: { orderId },
      select: { status: true },
    });
    const statuses = suborders.map((order) => order.status);
    const active = statuses.filter((value) => value !== 'CANCELLED');
    let status: OrderStatus = 'PLACED';
    if (active.length === 0) {
      status = 'CANCELLED';
    } else if (active.every((value) => value === 'DELIVERED')) {
      status = 'DELIVERED';
    } else if (active.includes('SHIPPED')) {
      status = 'SHIPPED';
    } else if (active.includes('PROCESSING')) {
      status = 'PROCESSING';
    } else if (active.includes('CONFIRMED')) {
      status = 'CONFIRMED';
    }
    await this.prisma.order.update({ where: { id: orderId }, data: { status } });
  }

  private isAllowedTransition(from: OrderStatus, to: OrderStatus): boolean {
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      PLACED: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['DELIVERED'],
      DELIVERED: [],
      CANCELLED: [],
    };
    return transitions[from].includes(to);
  }

  private orderNumber(): string {
    const now = new Date();
    const date =
      now.getUTCFullYear().toString() +
      String(now.getUTCMonth() + 1).padStart(2, '0') +
      String(now.getUTCDate()).padStart(2, '0');
    return 'SL-' + date + '-' + randomBytes(4).toString('hex').toUpperCase();
  }

  private presentOrder(order: OrderWithDetails) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      buyerId: order.buyerId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethodCode: order.paymentMethodCode,
      paymentMethodName: order.paymentMethodName,
      deliveryMethod: order.deliveryMethod,
      contactName: order.contactName,
      contactPhone: order.contactPhone,
      region: order.region,
      district: order.district,
      addressLine: order.addressLine,
      landmark: order.landmark,
      notes: order.notes,
      subtotalTzs: order.subtotalTzs,
      deliveryFeeTzs: order.deliveryFeeTzs,
      totalTzs: order.totalTzs,
      currency: order.currency,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      sellerOrders: order.sellerOrders.map((sellerOrder) => ({
        id: sellerOrder.id,
        sellerId: sellerOrder.sellerId,
        sellerName: sellerOrder.sellerName,
        status: sellerOrder.status,
        subtotalTzs: sellerOrder.subtotalTzs,
        items: sellerOrder.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          productSlug: item.productSlug,
          imageUrl: item.imageUrl,
          unit: item.unit,
          unitPriceTzs: item.unitPriceTzs,
          quantity: item.quantity,
          lineTotalTzs: item.lineTotalTzs,
        })),
      })),
    };
  }

  private presentSellerOrder(order: SellerOrderWithOrder) {
    return {
      id: order.id,
      orderId: order.orderId,
      sellerId: order.sellerId,
      sellerName: order.sellerName,
      status: order.status,
      subtotalTzs: order.subtotalTzs,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      order: {
        orderNumber: order.order.orderNumber,
        buyerName: order.order.buyerName,
        contactName: order.order.contactName,
        contactPhone: order.order.contactPhone,
        deliveryMethod: order.order.deliveryMethod,
        region: order.order.region,
        district: order.order.district,
        addressLine: order.order.addressLine,
        landmark: order.order.landmark,
        notes: order.order.notes,
        paymentMethodName: order.order.paymentMethodName,
        paymentStatus: order.order.paymentStatus,
        totalTzs: order.order.totalTzs,
        createdAt: order.order.createdAt.toISOString(),
      },
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productSlug: item.productSlug,
        imageUrl: item.imageUrl,
        unit: item.unit,
        unitPriceTzs: item.unitPriceTzs,
        quantity: item.quantity,
        lineTotalTzs: item.lineTotalTzs,
      })),
    };
  }

  private internalHeaders(): Record<string, string> {
    const env = loadEnvironment();
    return {
      'content-type': 'application/json',
      'x-internal-token': env.INTERNAL_SERVICE_TOKEN,
    };
  }

  private async fetchProducts(ids: string[]): Promise<ProductSnapshot[]> {
    const env = loadEnvironment();
    let response: Response;
    try {
      response = await fetch(env.CATALOGUE_SERVICE_URL + '/api/v1/catalogue/internal/products/batch', {
        method: 'POST',
        headers: this.internalHeaders(),
        body: JSON.stringify({ ids }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      throw new BadGatewayException({
        code: 'CATALOGUE_UNAVAILABLE',
        message: 'The marketplace catalogue is unavailable. Try again shortly.',
      });
    }
    if (!response.ok) {
      throw new BadGatewayException({
        code: 'CATALOGUE_UNAVAILABLE',
        message: 'The marketplace catalogue is unavailable. Try again shortly.',
      });
    }
    const body = (await response.json()) as { items?: ProductSnapshot[] };
    return body.items ?? [];
  }

  private assertPaymentMethodForDelivery(
    deliveryMethod: CreateOrderDto['deliveryMethod'],
    paymentMethodCode: string,
  ): void {
    const allowed =
      deliveryMethod === 'PICKUP' ? PICKUP_PAYMENT_CODES : SELLER_DELIVERY_PAYMENT_CODES;
    if (!allowed.has(paymentMethodCode)) {
      const message =
        deliveryMethod === 'PICKUP'
          ? 'Choose a payment method available for campus pickup.'
          : 'Choose a payment method available for seller-arranged delivery.';
      throw new BadRequestException({
        code: 'PAYMENT_METHOD_NOT_ALLOWED_FOR_DELIVERY',
        message,
        fieldErrors: { paymentMethodCode: message },
      });
    }
  }

  private async validatePaymentMethod(code: string): Promise<{ code: string; name: string }> {
    const env = loadEnvironment();
    let response: Response;
    try {
      response = await fetch(env.PAYMENT_SERVICE_URL + '/api/v1/payment/internal/validate-method', {
        method: 'POST',
        headers: this.internalHeaders(),
        body: JSON.stringify({ code }),
        signal: AbortSignal.timeout(4000),
      });
    } catch {
      throw new BadGatewayException({
        code: 'PAYMENT_UNAVAILABLE',
        message: 'Payment methods are unavailable. Try again shortly.',
      });
    }
    if (!response.ok) {
      throw new BadRequestException({
        code: 'PAYMENT_METHOD_UNAVAILABLE',
        message: 'Choose an available payment method.',
        fieldErrors: { paymentMethodCode: 'Choose an available payment method.' },
      });
    }
    return (await response.json()) as { code: string; name: string };
  }

  private async createPayment(
    orderId: string,
    buyerId: string,
    amountTzs: number,
    methodCode: string,
  ): Promise<void> {
    const env = loadEnvironment();
    const response = await fetch(env.PAYMENT_SERVICE_URL + '/api/v1/payment/internal/payments', {
      method: 'POST',
      headers: this.internalHeaders(),
      body: JSON.stringify({ orderId, buyerId, amountTzs, methodCode }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      throw new Error('Payment record creation failed');
    }
  }

  private async reserveStock(
    items: { productId: string; quantity: number }[],
    reference: string,
  ): Promise<void> {
    const env = loadEnvironment();
    let response: Response;
    try {
      response = await fetch(env.INVENTORY_SERVICE_URL + '/api/v1/inventory/internal/reserve', {
        method: 'POST',
        headers: this.internalHeaders(),
        body: JSON.stringify({ items, reference }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      throw new BadGatewayException({
        code: 'INVENTORY_UNAVAILABLE',
        message: 'Stock availability could not be checked. Try again shortly.',
      });
    }
    if (response.status === 409) {
      throw new ConflictException({
        code: 'STOCK_UNAVAILABLE',
        message: 'One or more products no longer have enough stock. Review your cart and try again.',
        fieldErrors: { stock: 'Insufficient stock for one or more cart items.' },
      });
    }
    if (!response.ok) {
      throw new BadGatewayException({
        code: 'INVENTORY_UNAVAILABLE',
        message: 'Stock availability could not be checked. Try again shortly.',
      });
    }
  }

  private async releaseStock(
    items: { productId: string; quantity: number }[],
    reference: string,
  ): Promise<void> {
    const env = loadEnvironment();
    const response = await fetch(env.INVENTORY_SERVICE_URL + '/api/v1/inventory/internal/release', {
      method: 'POST',
      headers: this.internalHeaders(),
      body: JSON.stringify({ items, reference }),
      signal: AbortSignal.timeout(4000),
    }).catch(() => undefined);
    if (!response?.ok) {
      throw new BadGatewayException({
        code: 'INVENTORY_UNAVAILABLE',
        message: 'Reserved stock could not be released. Try again shortly.',
      });
    }
  }

  private async commitStock(
    items: { productId: string; quantity: number }[],
    reference: string,
  ): Promise<void> {
    const env = loadEnvironment();
    const response = await fetch(env.INVENTORY_SERVICE_URL + '/api/v1/inventory/internal/commit', {
      method: 'POST',
      headers: this.internalHeaders(),
      body: JSON.stringify({ items, reference }),
      signal: AbortSignal.timeout(4000),
    }).catch(() => undefined);
    if (!response?.ok) {
      throw new BadGatewayException({
        code: 'INVENTORY_UNAVAILABLE',
        message: 'Stock could not be updated. Try again shortly.',
      });
    }
  }
}
