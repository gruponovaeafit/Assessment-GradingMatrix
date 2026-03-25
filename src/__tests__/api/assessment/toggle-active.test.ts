import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockReq, createMockRes, mockAdminToken, mockSuperAdminToken, setupRevokedTokenMock, buildSupabaseChain } from '@/__tests__/helpers/mockApiContext';

vi.mock('@/lib/supabase/server', () => ({
  supabase: { from: vi.fn() },
}));

vi.mock('@/lib/auth', () => ({
  verifyToken: vi.fn(),
}));

vi.mock('@/lib/auth/cookie', () => ({
  clearSessionCookie: vi.fn(),
  setSessionCookie: vi.fn(),
  COOKIE_NAME: 'session',
}));

import handler from '@/pages/api/assessment/toggle-active';
import { verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase/server';

const mockVerifyToken = verifyToken as ReturnType<typeof vi.fn>;
const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

describe('POST /api/assessment/toggle-active', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupRevokedTokenMock(supabase);
  });

  it('returns 405 for non-POST requests', async () => {
    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('returns 401 when unauthenticated', async () => {
    mockVerifyToken.mockReturnValue(null);
    const req = createMockReq({ method: 'POST', body: { assessmentId: 1, activo: true } });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 400 when activo is missing', async () => {
    mockVerifyToken.mockReturnValue(mockAdminToken(1));
    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'tok' },
      body: { assessmentId: 1 },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'activo es obligatorio' });
  });

  it('returns 403 when regular admin tries to toggle a different assessment', async () => {
    mockVerifyToken.mockReturnValue(mockAdminToken(10));
    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'tok' },
      body: { assessmentId: 99, activo: true },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Solo puedes activar/desactivar tu propio assessment' });
  });

  it('activates assessment and calls deactivation of siblings', async () => {
    mockVerifyToken.mockReturnValue(mockAdminToken(5));
    mockFrom.mockImplementation((table: string) => {
      if (table === 'RevokedTokens') {
        return buildSupabaseChain({ data: null, error: null });
      }
      if (table === 'Staff') {
        return buildSupabaseChain({
          data: { Active: true, Assessment: { Activo_Assessment: true } },
          error: null,
        });
      }
      if (table === 'Assessment') {
        // First assessment call is the update
        return {
          update: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValueOnce({
            data: { ID_Assessment: 5, Activo_Assessment: true, ID_GrupoEstudiantil: 2 },
            error: null,
          }).mockResolvedValue({ // Fallback for sibling deactivation call
            error: null,
          }),
        };
      }
      return buildSupabaseChain();
    });

    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'tok' },
      body: { assessmentId: 5, activo: true },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    // Calls: 1. RevokedTokens, 2. Staff check, 3. Assessment update, 4. Sibling deactivation
    expect(mockFrom).toHaveBeenCalledTimes(4);
  });

  it('deactivating does NOT trigger sibling deactivation', async () => {
    mockVerifyToken.mockReturnValue(mockAdminToken(5));
    mockFrom.mockImplementation((table: string) => {
      if (table === 'RevokedTokens') {
        return buildSupabaseChain({ data: null, error: null });
      }
      if (table === 'Staff') {
        return buildSupabaseChain({
          data: { Active: true, Assessment: { Activo_Assessment: true } },
          error: null,
        });
      }
      if (table === 'Assessment') {
        return {
          update: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ID_Assessment: 5, Activo_Assessment: false, ID_GrupoEstudiantil: 2 },
            error: null,
          }),
        };
      }
      return buildSupabaseChain();
    });

    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'tok' },
      body: { assessmentId: 5, activo: false },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    // Calls: 1. RevokedTokens, 2. Staff check, 3. Assessment update
    expect(mockFrom).toHaveBeenCalledTimes(3);
  });

  it('returns 500 when Supabase update fails', async () => {
    mockVerifyToken.mockReturnValue(mockAdminToken(5));
    mockFrom.mockImplementation((table: string) => {
      if (table === 'RevokedTokens') {
        return buildSupabaseChain({ data: null, error: null });
      }
      if (table === 'Staff') {
        return buildSupabaseChain({
          data: { Active: true, Assessment: { Activo_Assessment: true } },
          error: null,
        });
      }
      if (table === 'Assessment') {
        return {
          update: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
        };
      }
      return buildSupabaseChain();
    });
    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'tok' },
      body: { assessmentId: 5, activo: true },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('super-admin can toggle any assessment without assessmentId in their token', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken({ assessmentId: undefined })); 
    mockFrom.mockImplementation((table: string) => {
      if (table === 'RevokedTokens') {
        return buildSupabaseChain({ data: null, error: null });
      }
      if (table === 'Assessment') {
        return {
          update: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ID_Assessment: 7, Activo_Assessment: true, ID_GrupoEstudiantil: 3 },
            error: null,
          }),
        };
      }
      return buildSupabaseChain();
    });
    const req = createMockReq({
      method: 'POST',
      url: '/api/assessment/toggle-active',
      cookies: { session: 'tok' },
      body: { assessmentId: 7, activo: false },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
