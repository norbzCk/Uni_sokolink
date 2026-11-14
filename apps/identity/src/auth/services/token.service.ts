import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { RoleName } from '@prisma/client';
import { createHash, createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { IdentityEnvironment } from '../../environment';
import { IDENTITY_ENVIRONMENT } from '../../environment.provider';
import type { AccessTokenClaims } from '../auth.types';

interface AccessTokenInput {
  id: string;
  sessionId: string;
  email: string;
  fullName: string;
  roles: RoleName[];
}

@Injectable()
export class TokenService {
  constructor(
    @Inject(IDENTITY_ENVIRONMENT) private readonly environment: IdentityEnvironment,
  ) {}

  signAccessToken(user: AccessTokenInput): { token: string; expiresIn: number } {
    const expiresIn = this.environment.ACCESS_TOKEN_TTL_SECONDS;
    const token = jwt.sign(
      {
        sub: user.id,
        sid: user.sessionId,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles,
        type: 'access',
      },
      this.environment.ACCESS_TOKEN_SIGNING_KEY,
      {
        algorithm: 'HS256',
        issuer: this.environment.ACCESS_TOKEN_ISSUER,
        audience: this.environment.ACCESS_TOKEN_AUDIENCE,
        expiresIn,
        jwtid: randomUUID(),
      },
    );
    return { token, expiresIn };
  }

  verifyAccessToken(token: string): AccessTokenClaims {
    const keys = [
      this.environment.ACCESS_TOKEN_SIGNING_KEY,
      ...(this.environment.ACCESS_TOKEN_SIGNING_KEY_PREVIOUS
        ? [this.environment.ACCESS_TOKEN_SIGNING_KEY_PREVIOUS]
        : []),
    ];

    for (const key of keys) {
      try {
        const decoded = jwt.verify(token, key, {
          algorithms: ['HS256'],
          issuer: this.environment.ACCESS_TOKEN_ISSUER,
          audience: this.environment.ACCESS_TOKEN_AUDIENCE,
        });
        if (!this.isAccessTokenClaims(decoded)) {
          throw new Error('Unexpected access token claims');
        }
        return decoded;
      } catch {
        continue;
      }
    }

    throw new UnauthorizedException({
      code: 'SESSION_INVALID',
      message: 'Your session is invalid or has expired. Sign in again.',
    });
  }

  createOpaqueToken(): string {
    return randomBytes(48).toString('base64url');
  }

  createOneTimeCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  hashToken(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  hmac(value: string): string {
    return createHmac('sha256', this.environment.ACCESS_TOKEN_SIGNING_KEY)
      .update(value)
      .digest('hex');
  }

  safeEqualHex(left: string, right: string): boolean {
    if (left.length !== right.length) {
      return false;
    }
    const leftBuffer = Buffer.from(left, 'hex');
    const rightBuffer = Buffer.from(right, 'hex');
    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
  }

  private isAccessTokenClaims(decoded: string | JwtPayload): decoded is JwtPayload & AccessTokenClaims {
    return (
      typeof decoded === 'object' &&
      decoded !== null &&
      decoded.type === 'access' &&
      typeof decoded.sub === 'string' &&
      typeof decoded.sid === 'string' &&
      typeof decoded.email === 'string' &&
      typeof decoded.fullName === 'string' &&
      Array.isArray(decoded.roles) &&
      decoded.roles.every((role) => typeof role === 'string') &&
      typeof decoded.iat === 'number' &&
      typeof decoded.exp === 'number'
    );
  }
}
