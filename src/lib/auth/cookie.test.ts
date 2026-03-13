import { describe, it, expect, vi } from 'vitest';
import { setSessionCookie, clearSessionCookie } from './cookie';
import type { NextApiResponse } from 'next';

function createMockRes() {
  return {
    setHeader: vi.fn(),
  } as unknown as NextApiResponse;
}

describe('setSessionCookie', () => {
  it('should set session and role cookies with correct flags', () => {
    const res = createMockRes();
    setSessionCookie(res, 'jwt-token-123', 'admin');

    expect(res.setHeader).toHaveBeenCalledTimes(1);
    const [headerName, cookies] = (res.setHeader as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(headerName).toBe('Set-Cookie');
    expect(cookies).toHaveLength(2);

    // Session cookie: HttpOnly, token value
    const sessionCookie = cookies[0] as string;
    expect(sessionCookie).toContain('session=jwt-token-123');
    expect(sessionCookie).toContain('HttpOnly');
    expect(sessionCookie).toContain('SameSite=Lax');
    expect(sessionCookie).toContain('Path=/');
    expect(sessionCookie).toContain('Max-Age=28800');

    // Role cookie: NOT HttpOnly
    const roleCookie = cookies[1] as string;
    expect(roleCookie).toContain('authRole=admin');
    expect(roleCookie).not.toContain('HttpOnly');
    expect(roleCookie).toContain('SameSite=Lax');
  });

  it('should set Secure flag in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const res = createMockRes();
    setSessionCookie(res, 'token', 'calificador');

    const [, cookies] = (res.setHeader as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((cookies[0] as string)).toContain('Secure');
    expect((cookies[1] as string)).toContain('Secure');

    process.env.NODE_ENV = originalEnv;
  });
});

describe('clearSessionCookie', () => {
  it('should set cookies with Max-Age=0 and empty value', () => {
    const res = createMockRes();
    clearSessionCookie(res);

    expect(res.setHeader).toHaveBeenCalledTimes(1);
    const [, cookies] = (res.setHeader as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(cookies).toHaveLength(2);

    const sessionCookie = cookies[0] as string;
    expect(sessionCookie).toContain('session=');
    expect(sessionCookie).toContain('Max-Age=0');

    const roleCookie = cookies[1] as string;
    expect(roleCookie).toContain('authRole=');
    expect(roleCookie).toContain('Max-Age=0');
  });
});
