import type { RoleName, UserStatus } from '@prisma/client';

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  roles: RoleName[];
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: UserSummary;
}

export interface AccessTokenClaims {
  sub: string;
  sid: string;
  email: string;
  fullName: string;
  roles: RoleName[];
  type: 'access';
  iat: number;
  exp: number;
}

export interface RequestContext {
  ipAddress: string | null;
  userAgent: string | null;
  correlationId: string | null;
}
