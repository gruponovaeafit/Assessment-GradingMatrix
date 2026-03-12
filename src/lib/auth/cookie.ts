import type { NextApiResponse } from 'next';
import { serialize } from 'cookie';

const COOKIE_NAME = 'session';
const ROLE_COOKIE_NAME = 'authRole';

// 8 hours in seconds
const MAX_AGE = 8 * 60 * 60;

/**
 * Set the session cookie (HttpOnly) and role cookie (readable by client).
 */
export function setSessionCookie(
  res: NextApiResponse,
  token: string,
  role: string
): void {
  const isProduction = process.env.NODE_ENV === 'production';

  const sessionCookie = serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });

  const roleCookie = serialize(ROLE_COOKIE_NAME, role, {
    httpOnly: false, // Client needs to read role for routing
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });

  res.setHeader('Set-Cookie', [sessionCookie, roleCookie]);
}

/**
 * Clear both session and role cookies.
 */
export function clearSessionCookie(res: NextApiResponse): void {
  const sessionCookie = serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  const roleCookie = serialize(ROLE_COOKIE_NAME, '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  res.setHeader('Set-Cookie', [sessionCookie, roleCookie]);
}

export { COOKIE_NAME, ROLE_COOKIE_NAME };
