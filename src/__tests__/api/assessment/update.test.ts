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

import handler from '@/pages/api/assessment/update';
import { verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase/server';

const mockVerifyToken = verifyToken as ReturnType<typeof vi.fn>;
const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

function setupSupabase({
  updateResult = { data: { ID_Assessment: 10 }, error: null },
  fetchGroupResult = { data: { ID_GrupoEstudiantil: 5 }, error: null },
  deactivateResult = { error: null },
} = {}) {
  let callCount = 0;
  mockFrom.mockImplementation(() => {
    callCount++;
    return {
      update: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      // 1st call = update, 2nd = fetchGroup, 3rd = deactivate siblings
      single: vi.fn().mockResolvedValue(callCount === 1 ? updateResult : fetchGroupResult),
      // deactivate siblings resolves without .single()
      mockResolvedValue: vi.fn().mockResolvedValue(deactivateResult),
    };
  });
}

describe('PUT /api/assessment/update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 405 for non-PUT requests', async () => {
    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('returns 401 when unauthenticated', async () => {
    mockVerifyToken.mockReturnValue(null);
    const req = createMockReq({ method: 'PUT', body: { nombre: 'Test' } });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 400 when no fields are provided', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken({ assessmentId: 10 } as any));
    const req = createMockReq({
      method: 'PUT',
      cookies: { session: 'tok' },
      body: { assessmentId: 10 },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'No hay campos para actualizar' });
  });

  it('returns 400 when grupoEstudiantilId is NaN', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken({ assessmentId: 10 } as any));
    const req = createMockReq({
      method: 'PUT',
      cookies: { session: 'tok' },
      body: { assessmentId: 10, grupoEstudiantilId: 'abc' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'grupoEstudiantilId inválido' });
  });

  it('returns 403 when regular admin tries to update a different assessment', async () => {
    mockVerifyToken.mockReturnValue(mockAdminToken(10));
    const req = createMockReq({
      method: 'PUT',
      cookies: { session: 'tok' },
      body: { assessmentId: 99, nombre: 'Other Assessment' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Solo puedes actualizar tu propio assessment' });
  });

  it('updates successfully with only nombre', async () => {
    mockVerifyToken.mockReturnValue(mockAdminToken(10));
    mockFrom.mockImplementation(() => ({
      update: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { ID_Assessment: 10 }, error: null }),
    }));
    const req = createMockReq({
      method: 'PUT',
      cookies: { session: 'tok' },
      body: { assessmentId: 10, nombre: 'Nuevo Nombre' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Assessment actualizado', id: 10 });
  });

  it('returns 500 when Supabase update fails', async () => {
    mockVerifyToken.mockReturnValue(mockAdminToken(10));
    mockFrom.mockImplementation(() => ({
      update: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'db fail' } }),
    }));
    const req = createMockReq({
      method: 'PUT',
      cookies: { session: 'tok' },
      body: { assessmentId: 10, nombre: 'Fail' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('super-admin can update any assessment without assessmentId in their token', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken()); // No assessmentId in token
    mockFrom.mockImplementation(() => ({
      update: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { ID_Assessment: 7 }, error: null }),
    }));
    const req = createMockReq({
      method: 'PUT',
      cookies: { session: 'tok' },
      body: { assessmentId: 7, nombre: 'Super Admin Update' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Assessment actualizado', id: 7 });
  });
});
