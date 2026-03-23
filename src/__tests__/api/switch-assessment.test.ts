import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextApiRequest, NextApiResponse } from 'next';
import http from 'http';

vi.mock('@/lib/supabase/server', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'RevokedTokens') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { ID_Assessment: 5 }, error: null }),
      };
    }),
  },
}));

vi.mock('@/lib/auth', () => ({
  verifyToken: vi.fn(),
  generateToken: vi.fn(() => 'new-jwt-token'),
}));

vi.mock('@/lib/auth/cookie', () => ({
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
  COOKIE_NAME: 'session',
}));

import handler from '@/pages/api/auth/switch-assessment/index';
import { verifyToken, generateToken } from '@/lib/auth';
import { setSessionCookie } from '@/lib/auth/cookie';

function createMockReq(overrides: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    method: 'POST',
    cookies: {},
    headers: {},
    body: {},
    ...overrides,
  } as NextApiRequest;
}

function createMockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as NextApiResponse;
}

describe('/api/auth/switch-assessment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('ADMIN_EMAIL', 'admin@test.com');
  });

  it('returns 405 for non-POST requests', async () => {
    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Método no permitido' });
  });

  it('returns 400 when assessmentId is missing', async () => {
    const req = createMockReq({ body: {} });
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'assessmentId es obligatorio y debe ser un número' });
  });

  it('returns 400 when assessmentId is not a number', async () => {
    const req = createMockReq({ body: { assessmentId: 'invalid' } });
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'assessmentId es obligatorio y debe ser un número' });
  });

  it('returns 401 when no token provided', async () => {
    const req = createMockReq({ body: { assessmentId: 5 }, cookies: {} });
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No autorizado' });
  });

  it('returns 401 for invalid token', async () => {
    const req = createMockReq({
      body: { assessmentId: 5 },
      cookies: { session: 'invalid-token' },
    });
    const res = createMockRes();
    (verifyToken as ReturnType<typeof vi.fn>).mockReturnValue(null);

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido o expirado' });
  });

  it('returns 403 for non-super-admin user', async () => {
    const req = createMockReq({
      body: { assessmentId: 5 },
      cookies: { session: 'valid-token' },
    });
    const res = createMockRes();
    (verifyToken as ReturnType<typeof vi.fn>).mockReturnValue({
      id: 5,
      email: 'admin@test.com',
      role: 'admin',
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Solo el super-admin puede cambiar de assessment' });
  });

  it('returns 404 when assessment does not exist', async () => {
    const req = createMockReq({
      body: { assessmentId: 999 },
      cookies: { session: 'valid-superadmin-token' },
    });
    const res = createMockRes();
    (verifyToken as ReturnType<typeof vi.fn>).mockReturnValue({
      id: 0,
      email: 'admin@test.com',
      role: 'admin',
    });

    const { supabase } = await import('@/lib/supabase/server');
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Assessment no encontrado' });
  });

  it('super admin can switch to valid assessment', async () => {
    const { supabase } = await import('@/lib/supabase/server');
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { ID_Assessment: 5 }, error: null }),
    });

    const req = createMockReq({
      body: { assessmentId: 5 },
      cookies: { session: 'valid-superadmin-token' },
    });
    const res = createMockRes();
    
    (verifyToken as ReturnType<typeof vi.fn>).mockReturnValue({
      id: 0,
      email: 'admin@test.com',
      role: 'admin',
    });

    await handler(req, res);

    expect(verifyToken).toHaveBeenCalledWith('valid-superadmin-token');
    expect(setSessionCookie).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Assessment switched successfully',
      assessmentId: 5,
    });
  });
});
