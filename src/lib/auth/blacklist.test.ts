import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireRoles } from '@/lib/auth/apiAuth';
import { supabase } from '@/lib/supabase/server';
import { verifyToken } from '@/lib/auth';

vi.mock('@/lib/supabase/server', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn()
        }))
      }))
    }))
  }
}));

vi.mock('@/lib/auth', () => ({
  verifyToken: vi.fn(),
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
  });

  it('should deny access if token is in RevokedTokens table', async () => {
    const token = 'revoked-token-123';
    const req = mockReq(token);
    const res = mockRes();

    // Simular que el token es válido por firma
    (verifyToken as any).mockReturnValue({ id: 1, role: 'admin' });

    // Simular que el token ESTÁ en la blacklist
    const maybeSingleMock = vi.fn().mockResolvedValue({ 
      data: { Token: token }, 
      error: null 
    });
    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: maybeSingleMock
        }))
      }))
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

    // Simular que el token NO está en la blacklist
    const maybeSingleMock = vi.fn().mockResolvedValue({ 
      data: null, 
      error: null 
    });
    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: maybeSingleMock
        }))
      }))
    });

    const result = await requireRoles(req, res, ['admin']);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
