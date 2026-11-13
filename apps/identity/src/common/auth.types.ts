import type { RoleName } from '@prisma/client';
import type { Request } from 'express';
import type { Permission } from './permissions';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  roles: RoleName[];
  permissions: Permission[];
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export interface RequestMeta {
  ipAddress: string | null;
  userAgent: string | null;
  correlationId: string | null;
}

function cleanHeader(value: string | undefined, maxLength: number): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLength) : null;
}

export function requestMeta(request: Request): RequestMeta {
  const forwarded = request.header('x-forwarded-for')?.split(',')[0];
  const correlationId = request.res?.locals.correlationId;
  return {
    ipAddress: cleanHeader(forwarded, 64) ?? cleanHeader(request.ip, 64),
    userAgent: cleanHeader(request.header('user-agent'), 300),
    correlationId:
      cleanHeader(typeof correlationId === 'string' ? correlationId : undefined, 128) ??
      cleanHeader(request.header('x-correlation-id'), 128),
  };
}
