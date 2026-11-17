import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ServiceUser } from '@sokolink/platform';
import { PrismaService } from '../prisma/prisma.service';
import type { PaymentMethodKind } from '../generated/prisma';
import type { CreatePaymentDto } from './payment.dto';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublicMethods() {
    const methods = await this.prisma.paymentMethod.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' },
    });
    return methods.map((method) => ({
      code: method.code,
      name: method.name,
      description: method.description,
      kind: method.kind,
      instructions: method.instructions,
    }));
  }

  async validateMethod(code: string) {
    const method = await this.prisma.paymentMethod.findUnique({ where: { code } });
    if (!method || !method.enabled) {
      throw new BadRequestException({
        code: 'PAYMENT_METHOD_UNAVAILABLE',
        message: 'Choose an available payment method.',
        fieldErrors: { paymentMethodCode: 'Choose an available payment method.' },
      });
    }
    return method;
  }

  async createPayment(dto: CreatePaymentDto) {
    const method = await this.validateMethod(dto.methodCode);
    const existing = await this.prisma.payment.findUnique({
      where: { orderId: dto.orderId },
      include: { method: true },
    });
    if (existing) {
      return this.present(existing);
    }
    const payment = await this.prisma.payment.create({
      data: {
        orderId: dto.orderId,
        buyerId: dto.buyerId,
        amountTzs: dto.amountTzs,
        methodCode: method.code,
        methodName: method.name,
        status: 'PENDING',
        instructions: method.instructions,
      },
      include: { method: true },
    });
    return this.present(payment);
  }

  async getPayment(user: ServiceUser, orderId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
      include: { method: true },
    });
    if (!payment) {
      throw new NotFoundException({ code: 'PAYMENT_NOT_FOUND', message: 'Payment not found.' });
    }
    const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');
    if (!isAdmin && payment.buyerId !== user.id) {
      throw new ForbiddenException({
        code: 'PAYMENT_ACCESS_DENIED',
        message: 'You do not have access to this payment.',
      });
    }
    return this.present(payment);
  }

  private present(payment: {
    id: string;
    orderId: string;
    buyerId: string;
    amountTzs: number;
    currency: string;
    methodCode: string;
    methodName: string;
    method: { kind: PaymentMethodKind };
    status: string;
    instructions: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: payment.id,
      orderId: payment.orderId,
      buyerId: payment.buyerId,
      amountTzs: payment.amountTzs,
      currency: payment.currency,
      methodCode: payment.methodCode,
      methodName: payment.methodName,
      kind: payment.method.kind,
      status: payment.status,
      instructions: payment.instructions,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    };
  }
}
