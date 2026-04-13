import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextApiRequest, NextApiResponse } from 'next';
import { requireRoles } from '@/lib/auth/apiAuth';
import loginHandler from '@/pages/api/auth/login/index';
import { supabase } from '@/lib/supabase/server';
import { verifyToken, comparePassword } from '@/lib/auth';
import { clearSessionCookie, COOKIE_NAME } from '@/lib/auth/cookie';

vi.mock('@/lib/supabase/server', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/lib/auth', () => ({
  verifyToken: vi.fn(),
  comparePassword: vi.fn(),
  generateToken: vi.fn(() => 'mock-token'),
  hashPassword: vi.fn(),
}));

vi.mock('@/lib/auth/cookie', () => ({
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
  COOKIE_NAME: 'session',
}));

vi.mock('@/lib/utils/audit', () => ({
  logAudit: vi.fn(),
  AuditActions: {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
    UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  },
  getClientIP: vi.fn(() => '127.0.0.1'),
}));

function createMockReq(overrides: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    method: 'GET',
    cookies: {},
    headers: {},
    body: {},
    url: '/api/test',
    ...overrides,
  } as NextApiRequest;
}

function createMockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn(),
  };
  return res as unknown as NextApiResponse;
}

describe('Access Control Status Enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('ADMIN_EMAIL', 'admin@test.com');
    vi.stubEnv('ADMIN_PASSWORD', 'admin123');
  });

  describe('requireRoles enforcement', () => {
    it('returns 403 and clears cookie when account is disabled', async () => {
      const req = createMockReq({ cookies: { [COOKIE_NAME]: 'valid-token' } });
      const res = createMockRes();
      
      (verifyToken as any).mockReturnValue({ id: 1, email: 'user@test.com', role: 'calificador' });

      // Mock RevokedTokens check
      const mockFrom = (supabase.from as any);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'RevokedTokens') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        if (table === 'Staff') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: { Active: false, Assessment: { Activo_Assessment: true } }, 
              error: null 
            }),
          };
        }
      });

      const result = await requireRoles(req, res, ['calificador']);

      expect(result).toBeNull();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
        error: 'Tu cuenta ha sido desactivada por el administrador.' 
      }));
      expect(clearSessionCookie).toHaveBeenCalledWith(res);
    });

    it('returns 403 and clears cookie when assessment is disabled (normal user)', async () => {
      const req = createMockReq({ cookies: { [COOKIE_NAME]: 'valid-token' } });
      const res = createMockRes();
      
      (verifyToken as any).mockReturnValue({ id: 1, email: 'user@test.com', role: 'calificador' });

      const mockFrom = (supabase.from as any);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'RevokedTokens') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        if (table === 'Staff') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: { Active: true, Assessment: { Activo_Assessment: false } }, 
              error: null 
            }),
          };
        }
      });

      const result = await requireRoles(req, res, ['calificador']);

      expect(result).toBeNull();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
        error: 'Este assessment se encuentra desactivado.' 
      }));
      expect(clearSessionCookie).toHaveBeenCalledWith(res);
    });

    it('returns 403 for Super-Admin on POST when assessment is disabled', async () => {
      const req = createMockReq({ 
        method: 'POST',
        cookies: { [COOKIE_NAME]: 'superadmin-token' } 
      });
      const res = createMockRes();
      
      (verifyToken as any).mockReturnValue({ id: 0, email: 'admin@test.com', role: 'admin', assessmentId: 5 });

      const mockFrom = (supabase.from as any);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'RevokedTokens') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        if (table === 'Assessment') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: { Activo_Assessment: false }, 
              error: null 
            }),
          };
        }
      });

      const result = await requireRoles(req, res, ['admin']);

      expect(result).toBeNull();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
        error: 'Assessment desactivado: Solo lectura permitido.' 
      }));
    });

    it('allows (200) Super-Admin on GET even when assessment is disabled', async () => {
      const req = createMockReq({ 
        method: 'GET',
        cookies: { [COOKIE_NAME]: 'superadmin-token' } 
      });
      const res = createMockRes();
      
      (verifyToken as any).mockReturnValue({ id: 0, email: 'admin@test.com', role: 'admin', assessmentId: 5 });

      const mockFrom = (supabase.from as any);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'RevokedTokens') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        if (table === 'Assessment') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: { Activo_Assessment: false }, 
              error: null 
            }),
          };
        }
      });

      const result = await requireRoles(req, res, ['admin']);

      expect(result).not.toBeNull();
      expect(res.status).not.toHaveBeenCalledWith(403);
    });
  });

  describe('login handler enforcement', () => {
    it('fails login for disabled account', async () => {
      const req = createMockReq({ 
        method: 'POST',
        body: { email: 'user@test.com', password: 'password123' }
      });
      const res = createMockRes();

      (comparePassword as any).mockResolvedValue(true);

      const mockFrom = (supabase.from as any);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'Staff') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: { 
                ID_Staff: 1, 
                Correo_Staff: 'user@test.com', 
                Contrasena_Staff: '$2a$10$validhash', 
                Active: false 
              }, 
              error: null 
            }),
          };
        }
      });

      await loginHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
        error: 'Tu cuenta ha sido desactivada por el administrador.' 
      }));
    });

    it('fails login for disabled assessment (normal user)', async () => {
      const req = createMockReq({ 
        method: 'POST',
        body: { email: 'user@test.com', password: 'password123' }
      });
      const res = createMockRes();

      (comparePassword as any).mockResolvedValue(true);

      const mockFrom = (supabase.from as any);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'Staff') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: { 
                ID_Staff: 1, 
                Correo_Staff: 'user@test.com', 
                Contrasena_Staff: '$2a$10$validhash', 
                Active: true,
                ID_Assessment: 5
              }, 
              error: null 
            }),
          };
        }
        if (table === 'Assessment') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: { Activo_Assessment: false }, 
              error: null 
            }),
          };
        }
      });

      await loginHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
        error: 'Este assessment se encuentra desactivado.' 
      }));
    });
  });
});
