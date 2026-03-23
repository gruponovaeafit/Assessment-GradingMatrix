import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockReq, createMockRes, mockAdminToken, mockSuperAdminToken, setupRevokedTokenMock } from '@/__tests__/helpers/mockApiContext';

// ── Mocks ───────────────────────────────────────────────────────────────────

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

import handler from '@/pages/api/assessment/delete';
import { verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase/server';

const mockVerifyToken = verifyToken as ReturnType<typeof vi.fn>;
const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

const TABLES_IN_ORDER = ['CalificacionesPorPersona', 'Participante', 'Staff', 'Bases', 'GrupoAssessment', 'Assessment'];

/** Sets up all 6 DELETE calls to succeed. Pass `failAt` to make one fail. */
function setupCascadeSupabase(failAt?: string, failMsg = 'DB error') {
  mockFrom.mockImplementation((table: string) => {
    const chain = {
      delete: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
    };

    if (table === 'RevokedTokens') {
      chain.maybeSingle.mockResolvedValue({ data: null, error: null });
      return chain;
    }

    chain.eq.mockResolvedValue(
      table === failAt ? { error: { message: failMsg } } : { error: null }
    );
    return chain;
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('DELETE /api/assessment/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('ADMIN_DELETE_PASSWORD', 'correct-password');
    setupRevokedTokenMock(supabase);
  });

  it('returns 405 for non-DELETE requests', async () => {
    const req = createMockReq({ method: 'POST' });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('returns 401 when unauthenticated', async () => {
    mockVerifyToken.mockReturnValue(null);
    const req = createMockReq({ method: 'DELETE', body: { id: 1, password: 'correct-password' } });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 403 when authenticated but not super-admin', async () => {
    mockVerifyToken.mockReturnValue(mockAdminToken(1));
    const req = createMockReq({
      method: 'DELETE',
      cookies: { session: 'tok' },
      body: { id: 1, password: 'correct-password' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Solo el super-admin puede eliminar assessments' });
  });

  it('returns 400 when id is missing', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    const req = createMockReq({
      method: 'DELETE',
      cookies: { session: 'tok' },
      body: { password: 'correct-password' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'ID de Assessment inválido' });
  });

  it('returns 400 when id is non-numeric', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    const req = createMockReq({
      method: 'DELETE',
      cookies: { session: 'tok' },
      body: { id: 'abc', password: 'correct-password' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 when ADMIN_DELETE_PASSWORD is not configured', async () => {
    vi.stubEnv('ADMIN_DELETE_PASSWORD', '');
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    const req = createMockReq({
      method: 'DELETE',
      cookies: { session: 'tok' },
      body: { id: 1, password: '' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Configuración de seguridad incompleta en el servidor' });
  });

  it('returns 401 when password is wrong', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    const req = createMockReq({
      method: 'DELETE',
      cookies: { session: 'tok' },
      body: { id: 5, password: 'wrong-password' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Contraseña de borrado incorrecta' });
  });

  it('returns 200 and deletes all tables in order when password is correct', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    setupCascadeSupabase(); // all succeed
    const req = createMockReq({
      method: 'DELETE',
      cookies: { session: 'tok' },
      body: { id: 5, password: 'correct-password' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Assessment y todos sus datos eliminados con éxito' });
    // Every table should have been targeted
    const calledTables = mockFrom.mock.calls.map((c: unknown[]) => c[0]);
    for (const table of TABLES_IN_ORDER) {
      expect(calledTables).toContain(table);
    }
  });

  it('returns 500 when CalificacionesPorPersona delete fails', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    setupCascadeSupabase('CalificacionesPorPersona');
    const req = createMockReq({
      method: 'DELETE',
      cookies: { session: 'tok' },
      body: { id: 5, password: 'correct-password' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    const errArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(errArg.error).toContain('calificaciones');
  });

  it('returns 500 when Assessment (final) delete fails', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    setupCascadeSupabase('Assessment');
    const req = createMockReq({
      method: 'DELETE',
      cookies: { session: 'tok' },
      body: { id: 5, password: 'correct-password' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    const errArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(errArg.error).toContain('assessment');
  });
});
