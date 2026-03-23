import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockReq, createMockRes, mockAdminToken, mockSuperAdminToken } from '@/__tests__/helpers/mockApiContext';

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
    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) {
        // First call: update + select + single → returns the updated assessment
        return {
          update: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ID_Assessment: 5, Activo_Assessment: true, ID_GrupoEstudiantil: 2 },
            error: null,
          }),
        };
      }
      // Second call: deactivate siblings
      return {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockResolvedValue({ error: null }),
      };
    });

    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'tok' },
      body: { assessmentId: 5, activo: true },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    // Two from() calls: one for update, one for sibling deactivation
    expect(mockFrom).toHaveBeenCalledTimes(2);
  });

  it('deactivating does NOT trigger sibling deactivation', async () => {
    mockVerifyToken.mockReturnValue(mockAdminToken(5));
    mockFrom.mockImplementation(() => ({
      update: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ID_Assessment: 5, Activo_Assessment: false, ID_GrupoEstudiantil: 2 },
        error: null,
      }),
    }));

    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'tok' },
      body: { assessmentId: 5, activo: false },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    // Only ONE from() call: no sibling deactivation when setting activo=false
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('returns 500 when Supabase update fails', async () => {
    mockVerifyToken.mockReturnValue(mockAdminToken(5));
    mockFrom.mockImplementation(() => ({
      update: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
    }));
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
    mockVerifyToken.mockReturnValue(mockSuperAdminToken()); // No assessmentId in token
    mockFrom.mockImplementation(() => ({
      update: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ID_Assessment: 7, Activo_Assessment: true, ID_GrupoEstudiantil: 3 },
        error: null,
      }),
    }));
    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'tok' },
      body: { assessmentId: 7, activo: false },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
