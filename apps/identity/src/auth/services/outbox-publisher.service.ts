import {
  Injectable,
  Logger,
  Inject,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import amqp, { type ChannelModel, type ConfirmChannel } from 'amqplib';
import { IDENTITY_ENVIRONMENT } from '../../environment.provider';
import type { IdentityEnvironment } from '../../environment';
import { PrismaService } from '../../prisma/prisma.service';

const EXCHANGE = 'sokolink.domain.events';

@Injectable()
export class OutboxPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxPublisherService.name);
  private connection: ChannelModel | null = null;
  private channel: ConfirmChannel | null = null;
  private timer: NodeJS.Timeout | null = null;
  private publishing = false;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(IDENTITY_ENVIRONMENT) private readonly environment: IdentityEnvironment,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.publishPending(), 1500);
    this.timer.unref();
    void this.publishPending();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    await this.closeBroker();
  }

  private async publishPending(): Promise<void> {
    if (this.publishing) return;
    this.publishing = true;
    try {
      const channel = await this.getChannel();
      const events = await this.prisma.outboxEvent.findMany({
        where: { publishedAt: null },
        orderBy: { occurredAt: 'asc' },
        take: 50,
      });
      for (const event of events) {
        const envelope = {
          id: event.id,
          type: event.type,
          version: event.version,
          occurredAt: event.occurredAt.toISOString(),
          producer: 'identity',
          correlationId: event.correlationId ?? event.id,
          payload: event.payload,
        };
        try {
          await new Promise<void>((resolve, reject) => {
            channel.publish(
              EXCHANGE,
              event.type,
              Buffer.from(JSON.stringify(envelope)),
              {
                appId: 'identity',
                contentType: 'application/json',
                deliveryMode: 2,
                messageId: event.id,
                timestamp: Math.floor(event.occurredAt.getTime() / 1000),
                type: event.type,
                headers: { schemaVersion: event.version, correlationId: envelope.correlationId },
              },
              (error) => (error ? reject(error) : resolve()),
            );
          });
          await this.prisma.outboxEvent.updateMany({
            where: { id: event.id, publishedAt: null },
            data: { publishedAt: new Date(), attempts: { increment: 1 }, lastError: null },
          });
        } catch (error) {
          await this.prisma.outboxEvent.updateMany({
            where: { id: event.id, publishedAt: null },
            data: { attempts: { increment: 1 }, lastError: 'publish_failed' },
          });
          throw error;
        }
      }
    } catch {
      this.logger.warn('identity outbox publication is unavailable; pending events will be retried');
      await this.closeBroker();
    } finally {
      this.publishing = false;
    }
  }

  private async getChannel(): Promise<ConfirmChannel> {
    if (this.channel) return this.channel;
    const connection = await amqp.connect(this.environment.AMQP_URL, { timeout: 2000 });
    this.connection = connection;
    connection.on('error', () => {
      this.channel = null;
      this.connection = null;
    });
    const channel = await connection.createConfirmChannel();
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    const queue = 'sokolink.identity.events';
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, EXCHANGE, 'user.*');
    this.channel = channel;
    return channel;
  }

  private async closeBroker(): Promise<void> {
    const channel: ConfirmChannel | null = this.channel;
    const connection = this.connection;
    this.channel = null;
    this.connection = null;
    await channel?.close().catch(() => undefined);
    await connection?.close().catch(() => undefined);
  }
}
