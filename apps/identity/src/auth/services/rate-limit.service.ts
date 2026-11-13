import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from './token.service';

@Injectable()
export class RateLimitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  async consume(
    action: string,
    keyParts: readonly (string | null)[],
    limit: number,
    windowSeconds: number,
  ): Promise<void> {
    const keyHash = this.tokens.hmac(keyParts.map((part) => part ?? 'unknown').join('|'));
    const since = new Date(Date.now() - windowSeconds * 1000);
    const count = await this.prisma.rateLimitEvent.count({
      where: { action, keyHash, createdAt: { gte: since } },
    });

    if (count >= limit) {
      throw new HttpException(
        {
          code: 'RATE_LIMITED',
          message: 'Too many attempts. Wait a while before trying again.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.prisma.rateLimitEvent.create({ data: { action, keyHash } });
  }
}
