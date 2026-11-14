import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { Prisma} from '@prisma/client';
import { type RoleName } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type { IdentityEnvironment } from '../../environment';
import { IDENTITY_ENVIRONMENT } from '../../environment.provider';
import { PrismaService } from '../../prisma/prisma.service';
import type { RequestMeta } from '../../common/auth.types';
import { AuditService } from './audit.service';
import { TokenService } from './token.service';

interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  status: string;
  roles: { role: RoleName }[];
}

export interface IssuedRefreshSession {
  sessionId: string;
  refreshToken: string;
  expiresAt: Date;
  familyId: string;
}

export interface RotatedRefreshSession extends IssuedRefreshSession {
  user: SessionUser;
}

export interface SessionSummary {
  id: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
  userAgent: string | null;
  current: boolean;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
    @Inject(IDENTITY_ENVIRONMENT) private readonly environment: IdentityEnvironment,
  ) {}

  private expiryDate(): Date {
    return new Date(Date.now() + this.environment.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  }

  async create(userId: string, meta: RequestMeta, familyId = randomUUID()): Promise<IssuedRefreshSession> {
    const refreshToken = this.tokens.createOpaqueToken();
    const expiresAt = this.expiryDate();
    const session = await this.prisma.refreshSession.create({
      data: {
        familyId,
        userId,
        tokenHash: this.tokens.hashToken(refreshToken),
        expiresAt,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });
    return { sessionId: session.id, refreshToken, expiresAt, familyId };
  }

  async rotate(refreshToken: string, meta: RequestMeta): Promise<RotatedRefreshSession> {
    const tokenHash = this.tokens.hashToken(refreshToken);
    const outcome = await this.prisma.$transaction(
      async (transaction): Promise<
        | { kind: 'invalid' }
        | { kind: 'expired' }
        | { kind: 'inactive' }
        | { kind: 'reuse'; sessionId: string; userId: string; familyId: string }
        | { kind: 'rotated'; session: RotatedRefreshSession }
      > => {
        const session = await transaction.refreshSession.findUnique({
          where: { tokenHash },
          include: { user: { include: { roles: true } } },
        });

        if (!session) {
          return { kind: 'invalid' };
        }

        const now = new Date();
        if (session.revokedAt || session.replacedBySessionId) {
          await this.revokeFamily(transaction, session.familyId, 'reuse_detected');
          return {
            kind: 'reuse',
            sessionId: session.id,
            userId: session.userId,
            familyId: session.familyId,
          };
        }

        if (session.expiresAt <= now) {
          await this.revokeFamily(transaction, session.familyId, 'expired');
          return { kind: 'expired' };
        }

        if (session.user.status !== 'ACTIVE') {
          await this.revokeFamily(transaction, session.familyId, 'account_inactive');
          return { kind: 'inactive' };
        }

        const claim = await transaction.refreshSession.updateMany({
          where: { id: session.id, revokedAt: null, replacedBySessionId: null },
          data: { revokedAt: now, revocationReason: 'rotated', lastUsedAt: now },
        });
        if (claim.count !== 1) {
          await this.revokeFamily(transaction, session.familyId, 'reuse_detected');
          return {
            kind: 'reuse',
            sessionId: session.id,
            userId: session.userId,
            familyId: session.familyId,
          };
        }

        const nextToken = this.tokens.createOpaqueToken();
        const expiresAt = this.expiryDate();
        const nextSession = await transaction.refreshSession.create({
          data: {
            familyId: session.familyId,
            userId: session.userId,
            tokenHash: this.tokens.hashToken(nextToken),
            expiresAt,
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
          },
        });
        await transaction.refreshSession.update({
          where: { id: session.id },
          data: { replacedBySessionId: nextSession.id },
        });

        return {
          kind: 'rotated',
          session: {
            sessionId: nextSession.id,
            refreshToken: nextToken,
            expiresAt,
            familyId: session.familyId,
            user: session.user,
          },
        };
      },
    );

    if (outcome.kind === 'invalid') {
      throw new UnauthorizedException({
        code: 'SESSION_INVALID',
        message: 'Your session is invalid or has expired. Sign in again.',
      });
    }

    if (outcome.kind === 'reuse') {
      this.logger.warn(
        { userId: outcome.userId, familyId: outcome.familyId },
        'refresh token reuse detected; session family revoked',
      );
      await this.audit.record({
        actorId: outcome.userId,
        action: 'auth.refresh.reuse_detected',
        targetType: 'refresh_session',
        targetId: outcome.sessionId,
        meta,
      });
      throw new UnauthorizedException({
        code: 'SESSION_REUSE_DETECTED',
        message: 'Your session was revoked for security reasons. Sign in again.',
      });
    }

    if (outcome.kind === 'expired') {
      throw new UnauthorizedException({
        code: 'SESSION_EXPIRED',
        message: 'Your session has expired. Sign in again.',
      });
    }

    if (outcome.kind === 'inactive') {
      throw new ForbiddenException({
        code: 'ACCOUNT_NOT_ACTIVE',
        message: 'This account is not active. Contact support if you need help.',
      });
    }

    return outcome.session;
  }

  async revokeByToken(refreshToken: string, reason: string): Promise<string | null> {
    const tokenHash = this.tokens.hashToken(refreshToken);
    const session = await this.prisma.refreshSession.findUnique({
      where: { tokenHash },
      select: { familyId: true, userId: true },
    });
    if (!session) {
      return null;
    }
    await this.revokeFamily(this.prisma, session.familyId, reason);
    return session.userId;
  }

  async revokeAllForUser(userId: string, reason: string): Promise<void> {
    await this.prisma.refreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revocationReason: reason },
    });
  }

  async listActiveForUser(userId: string, currentToken?: string): Promise<SessionSummary[]> {
    const current = currentToken
      ? await this.prisma.refreshSession.findUnique({
          where: { tokenHash: this.tokens.hashToken(currentToken) },
          select: { id: true, userId: true },
        })
      : null;
    const sessions = await this.prisma.refreshSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true, lastUsedAt: true, expiresAt: true, userAgent: true },
    });
    return sessions.map((session) => ({
      id: session.id,
      createdAt: session.createdAt.toISOString(),
      lastUsedAt: session.lastUsedAt?.toISOString() ?? null,
      expiresAt: session.expiresAt.toISOString(),
      userAgent: session.userAgent,
      current: current?.userId === userId && current.id === session.id,
    }));
  }

  async revokeOneForUser(
    userId: string,
    sessionId: string,
    currentToken: string | undefined,
  ): Promise<{ revoked: boolean; current: boolean }> {
    const current = currentToken
      ? await this.prisma.refreshSession.findUnique({
          where: { tokenHash: this.tokens.hashToken(currentToken) },
          select: { id: true, userId: true },
        })
      : null;
    const result = await this.prisma.refreshSession.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date(), revocationReason: 'user_revoked' },
    });
    return {
      revoked: result.count === 1,
      current: current?.userId === userId && current.id === sessionId,
    };
  }

  private async revokeFamily(
    client: Prisma.TransactionClient | PrismaService,
    familyId: string,
    reason: string,
  ): Promise<void> {
    await client.refreshSession.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date(), revocationReason: reason },
    });
  }
}
