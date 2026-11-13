import type { CookieOptions } from 'express';
import type { IdentityEnvironment } from '../environment';

export const REFRESH_COOKIE_NAME = 'sokolink_refresh';

export function refreshCookieOptions(environment: IdentityEnvironment): CookieOptions {
  return {
    httpOnly: true,
    secure: environment.COOKIE_SECURE,
    sameSite: 'lax',
    path: '/api/v1/auth',
  };
}
