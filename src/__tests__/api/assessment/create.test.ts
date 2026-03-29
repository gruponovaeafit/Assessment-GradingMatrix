import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockReq, createMockRes, mockAdminToken, mockSuperAdminToken, setupRevokedTokenMock } from '@/__tests__/helpers/mockApiContext';

// ── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@/lib/supabase/server', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/lib/auth', () => ({
  verifyToken: vi.fn(),
}));

vi.mock('@/lib/auth/cookie', () => ({
  clearSessionCookie: vi.fn(),
  setSessionCookie: vi.fn(),
  COOKIE_NAME: 'session',
}));

import handler from '@/pages/api/assessment/create';
import { verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase/server';

const mockVerifyToken = verifyToken as ReturnType<typeof vi.fn>;
const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

// ── Supabase helpers ─────────────────────────────────────────────────────────

function setupSupabase({
  grupoResult = { data: { ID_GrupoEstudiantil: 1 }, error: null },
  insertResult = { data: { ID_Assessment: 42 }, error: null },
} = {}) {
  mockFrom.mockImplementation((table: string) => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    };
    if (table === 'RevokedTokens') {
      chain.maybeSingle.mockResolvedValue({ data: null, error: null });
      return chain;
    }
    if (table === 'GrupoEstudiantil') {
      chain.single.mockResolvedValue(grupoResult);
    } else if (table === 'Assessment') {
        chain.single.mockImplementation(() => {
            // If it's the insert call from handler, use insertResult
            if (chain.insert.mock.calls.length > 0) {
                return Promise.resolve(insertResult);
            }
            // If it's the status check from requireRoles, return active status
            return Promise.resolve({ data: { Activo_Assessment: true }, error: null });
        });
    } else {
      chain.single.mockResolvedValue(insertResult);
    }
    return chain;
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/assessment/create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupRevokedTokenMock(supabase);
  });

  it('returns 405 for non-POST requests', async () => {
    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Método no permitido' });
  });

  it('returns 401 when no auth cookie is present', async () => {
    mockVerifyToken.mockReturnValue(null);
    const req = createMockReq({ method: 'POST', body: { grupoEstudiantilId: 1, nombre: 'Test' } });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 400 when grupoEstudiantilId is missing', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'tok' },
      body: { nombre: 'Test' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'grupoEstudiantilId y nombre son obligatorios' });
  });

  it('returns 400 when nombre is missing', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'tok' },
      body: { grupoEstudiantilId: 1 },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'grupoEstudiantilId y nombre son obligatorios' });
  });

  it('returns 400 when GrupoEstudiantil does not exist in DB', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    setupSupabase({ grupoResult: { data: null, error: { message: 'Not found' } } as any });
    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'tok' },
      body: { grupoEstudiantilId: 999, nombre: 'Test' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'ID de GrupoEstudiantil no existe' });
  });

  it('returns 403 when a regular admin tries to create an assessment (Super Admin only action)', async () => {
    mockVerifyToken.mockReturnValue(mockAdminToken(5));
    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'tok' },
      body: { grupoEstudiantilId: 1, nombre: 'Assessment EAFIT' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Solo el super-admin puede crear assessments' });
  });

  it('creates assessment successfully as super-admin', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    setupSupabase();
    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'tok' },
      body: { grupoEstudiantilId: 1, nombre: 'Assessment Nuevo' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 500 when Supabase insert fails', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    setupSupabase({ insertResult: { data: null, error: { message: 'DB error' } } as any });
    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'tok' },
      body: { grupoEstudiantilId: 1, nombre: 'Fail Test' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'DB error' });
  });
});
