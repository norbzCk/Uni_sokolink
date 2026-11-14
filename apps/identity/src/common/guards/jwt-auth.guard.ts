import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RoleName } from '@prisma/client';
import type { AuthenticatedRequest } from '../auth.types';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { permissionsForRoles } from '../permissions';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../../auth/services/token.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.header('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Sign in to continue.',
      });
    }

    const claims = this.tokenService.verifyAccessToken(authorization.slice('Bearer '.length));
    const user = await this.prisma.user.findUnique({
      where: { id: claims.sub },
      include: { roles: true },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'SESSION_INVALID',
        message: 'Your session is no longer valid. Sign in again.',
      });
    }
    const session = await this.prisma.refreshSession.findUnique({
      where: { id: claims.sid },
      select: { userId: true, revokedAt: true, expiresAt: true },
    });
    if (
      !session ||
      session.userId !== user.id ||
      session.revokedAt !== null ||
      session.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException({
        code: 'SESSION_INVALID',
        message: 'Your session is no longer valid. Sign in again.',
      });
    }
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException({
        code: 'ACCOUNT_NOT_ACTIVE',
        message: 'This account is not active. Contact support if you need help.',
      });
    }

    const roles = user.roles.map((assignment) => assignment.role) as RoleName[];
    request.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles,
      permissions: permissionsForRoles(roles),
    };
    return true;
  }
}
