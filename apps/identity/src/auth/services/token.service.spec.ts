import { describe, expect, it } from 'vitest';
import type { IdentityEnvironment } from '../../environment';
import { TokenService } from './token.service';
import { refreshCookieOptions } from '../auth-cookie';

const environment = {
  ACCESS_TOKEN_SIGNING_KEY: 'a'.repeat(48),
  ACCESS_TOKEN_SIGNING_KEY_PREVIOUS: 'b'.repeat(48),
  ACCESS_TOKEN_ISSUER: 'http://localhost:3000',
  ACCESS_TOKEN_AUDIENCE: 'sokolink-web',
  ACCESS_TOKEN_TTL_SECONDS: 900,
  COOKIE_SECURE: false,
} as unknown as IdentityEnvironment;

describe('TokenService', () => {
  const tokens = new TokenService(environment);

  it('signs and verifies access tokens with expected claims', () => {
    const signed = tokens.signAccessToken({
      id: 'user-1',
      sessionId: 'session-1',
      email: 'student@example.com',
      fullName: 'Amina Hassan',
      roles: ['CUSTOMER', 'SELLER'],
    });
    const claims = tokens.verifyAccessToken(signed.token);
    expect(signed.expiresIn).toBe(900);
    expect(claims.sub).toBe('user-1');
    expect(claims.sid).toBe('session-1');
    expect(claims.type).toBe('access');
    expect(claims.roles).toEqual(['CUSTOMER', 'SELLER']);
  });

  it('rejects tampered tokens', () => {
    const signed = tokens.signAccessToken({
      id: 'user-1',
      sessionId: 'session-1',
      email: 'student@example.com',
      fullName: 'Amina Hassan',
      roles: ['CUSTOMER'],
    });
    const parts = signed.token.split('.');
    const tampered = [parts[0], parts[1], 'invalidsignature'].join('.');
    expect(() => tokens.verifyAccessToken(tampered)).toThrow();
  });

  it('creates opaque tokens, numeric one-time codes and stable hashes', () => {
    const token = tokens.createOpaqueToken();
    expect(token.length).toBeGreaterThan(50);
    expect(tokens.hashToken(token)).toBe(tokens.hashToken(token));
    expect(tokens.hashToken(token)).not.toBe(tokens.hashToken(token + 'x'));
    expect(tokens.createOneTimeCode()).toMatch(/^\d{6}$/);
    expect(tokens.safeEqualHex(tokens.hashToken('a'), tokens.hashToken('a'))).toBe(true);
    expect(tokens.safeEqualHex(tokens.hashToken('a'), tokens.hashToken('b'))).toBe(false);
  });
});

describe('refresh cookie', () => {
  it('is HTTP-only, path-scoped and same-site protected', () => {
    expect(refreshCookieOptions(environment)).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      path: '/api/v1/auth',
    });
  });
});
