import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireRoles } from '@/lib/auth/apiAuth';
import { supabase } from '@/lib/supabase/server';
import { verifyToken } from '@/lib/auth';
import { setupAuthMocks, buildSupabaseChain } from '@/__tests__/helpers/mockApiContext';

vi.mock('@/lib/supabase/server', () => ({
  supabase: {
    from: vi.fn()
  }
}));

vi.mock('@/lib/auth', () => ({
  verifyToken: vi.fn(),
}));

vi.mock('@/lib/auth/cookie', () => ({
  clearSessionCookie: vi.fn(),
  COOKIE_NAME: 'session',
}));

describe('Blacklist Security (RevokedTokens)', () => {
  const mockReq = (cookie: string) => ({
    cookies: { session: cookie },
    headers: {}
  } as any);

  const mockRes = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setupAuthMocks(supabase);
  });

  it('should deny access if token is in RevokedTokens table', async () => {
    const token = 'revoked-token-123';
    const req = mockReq(token);
    const res = mockRes();

    // Simular que el token es válido por firma
    (verifyToken as any).mockReturnValue({ id: 1, role: 'admin' });

    // Simular que el token ESTÁ en la blacklist
    supabase.from.mockImplementation((table: string) => {
      if (table === 'RevokedTokens') {
        return buildSupabaseChain({ data: { Token: token }, error: null });
      }
      // Return default active status for other checks in requireRoles
      if (table === 'Staff') {
        return buildSupabaseChain({ data: { Active: true, Assessment: { Activo_Assessment: true } }, error: null });
      }
      return buildSupabaseChain();
    });

    const result = await requireRoles(req, res, ['admin']);

    expect(result).toBeNull();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Sesión terminada' });
  });

  it('should allow access if token is NOT in RevokedTokens table', async () => {
    const token = 'valid-token-456';
    const req = mockReq(token);
    const res = mockRes();

    (verifyToken as any).mockReturnValue({ id: 1, role: 'admin' });

    // setupAuthMocks already sets RevokedTokens to return null data
    const result = await requireRoles(req, res, ['admin']);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
