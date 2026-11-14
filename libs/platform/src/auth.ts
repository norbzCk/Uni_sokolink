import {
  CanActivate,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

export type ServiceRole = 'CUSTOMER' | 'SELLER' | 'DELIVERY_PARTNER' | 'ADMIN' | 'SUPER_ADMIN';

export interface ServiceUser {
  id: string;
  email: string;
  fullName: string;
  roles: ServiceRole[];
}

export interface AuthenticatedRequest extends Request {
  user?: ServiceUser;
}

interface AccessTokenClaims extends JwtPayload {
  sub: string;
  sid: string;
  email: string;
  fullName: string;
  roles: ServiceRole[];
  type: 'access';
}

export const IS_PUBLIC_KEY = 'sokolink:isPublic';
export const REQUIRED_ROLES_KEY = 'sokolink:requiredRoles';

type DecoratorTarget = object;
type DecoratorFunction = (
  target: DecoratorTarget,
  propertyKey?: string | symbol,
  descriptor?: PropertyDescriptor,
) => void;

export function Public(): DecoratorFunction {
  return (target, propertyKey, descriptor) => {
    const metadataTarget = descriptor?.value ?? (propertyKey ? undefined : target);
    if (metadataTarget !== undefined) {
      Reflect.defineMetadata(IS_PUBLIC_KEY, true, metadataTarget);
    }
  };
}

export function RequireRoles(...roles: ServiceRole[]): DecoratorFunction {
  return (target, propertyKey, descriptor) => {
    const metadataTarget = descriptor?.value ?? (propertyKey ? undefined : target);
    if (metadataTarget !== undefined) {
      Reflect.defineMetadata(REQUIRED_ROLES_KEY, roles, metadataTarget);
    }
  };
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): ServiceUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new UnauthorizedException({
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Sign in to continue.',
      });
    }
    return request.user;
  },
);

function tokenKeys(): string[] {
  const current = process.env.ACCESS_TOKEN_SIGNING_KEY;
  if (!current) {
    throw new Error('ACCESS_TOKEN_SIGNING_KEY is required to verify access tokens');
  }
  const previous = process.env.ACCESS_TOKEN_SIGNING_KEY_PREVIOUS;
  return previous ? [current, previous] : [current];
}

function isClaims(decoded: string | JwtPayload): decoded is AccessTokenClaims {
  return (
    typeof decoded === 'object' &&
    decoded !== null &&
    decoded.type === 'access' &&
    typeof decoded.sub === 'string' &&
    typeof decoded.email === 'string' &&
    typeof decoded.fullName === 'string' &&
    Array.isArray(decoded.roles) &&
    decoded.roles.every((role) => typeof role === 'string') &&
    typeof decoded.exp === 'number'
  );
}

export function verifyServiceAccessToken(token: string): ServiceUser {
  for (const key of tokenKeys()) {
    try {
      const decoded = jwt.verify(token, key, {
        algorithms: ['HS256'],
        issuer: process.env.ACCESS_TOKEN_ISSUER ?? 'http://localhost:3000',
        audience: process.env.ACCESS_TOKEN_AUDIENCE ?? 'sokolink-web',
      });
      if (!isClaims(decoded)) {
        continue;
      }
      return {
        id: decoded.sub,
        email: decoded.email,
        fullName: decoded.fullName,
        roles: decoded.roles,
      };
    } catch {
      continue;
    }
  }
  throw new UnauthorizedException({
    code: 'SESSION_INVALID',
    message: 'Your session is invalid or has expired. Sign in again.',
  });
}

@Injectable()
export class ServiceAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
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

    const user = verifyServiceAccessToken(authorization.slice('Bearer '.length));
    request.user = user;

    const required = this.reflector.getAllAndOverride<ServiceRole[]>(REQUIRED_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (required && required.length > 0) {
      const granted = new Set(user.roles);
      const superAdmin = granted.has('SUPER_ADMIN');
      if (!superAdmin && !required.some((role) => granted.has(role))) {
        throw new ForbiddenException({
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to perform this action.',
        });
      }
    }
    return true;
  }
}

export function requireInternalToken(value: string | undefined): void {
  const expected = process.env.INTERNAL_SERVICE_TOKEN ?? 'local-internal-token';
  if (!value || value !== expected) {
    throw new UnauthorizedException({
      code: 'INTERNAL_ACCESS_DENIED',
      message: 'Internal service access is not authorised.',
    });
  }
}
