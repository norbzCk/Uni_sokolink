import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { RequestMeta } from '../../common/auth.types';

interface AuditInput {
  actorId: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
  meta: RequestMeta;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: input.actorId,
          action: input.action,
          targetType: input.targetType ?? null,
          targetId: input.targetId ?? null,
          ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
          ipAddress: input.meta.ipAddress,
          correlationId: input.meta.correlationId,
        },
      });
    } catch (error) {
      this.logger.error({ err: error, action: input.action }, 'failed to persist audit record');
    }
  }
}
