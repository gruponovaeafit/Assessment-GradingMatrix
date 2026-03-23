import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockReq, createMockRes, mockAdminToken, mockSuperAdminToken } from '@/__tests__/helpers/mockApiContext';

vi.mock('@/lib/supabase/server', () => ({
  supabase: { from: vi.fn() },
}));

vi.mock('@/lib/auth', () => ({
  verifyToken: vi.fn(),
  hashPassword: vi.fn().mockResolvedValue('hashed-pw'),
}));

vi.mock('@/lib/auth/cookie', () => ({
  clearSessionCookie: vi.fn(),
  setSessionCookie: vi.fn(),
  COOKIE_NAME: 'session',
}));

// hashPassword is imported separately in the handler via '@/lib/auth'
import handler from '@/pages/api/super-admin/staff-create';
import { verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase/server';

const mockVerifyToken = verifyToken as ReturnType<typeof vi.fn>;
const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

function setupInsert(result: { data: unknown; error: unknown }) {
  mockFrom.mockReturnValue({
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  });
}

const VALID_BODY = {
  assessmentId: 5,
  correo: 'admin@eafit.edu.co',
  password: 'SecurePass123',
  rol: 'admin',
};

describe('POST /api/super-admin/staff-create', () => {
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
    const req = createMockReq({ method: 'POST', body: VALID_BODY });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 403 when called by a regular admin (not super-admin)', async () => {
    mockVerifyToken.mockReturnValue(mockAdminToken(5));
    const req = createMockReq({ method: 'POST', cookies: { session: 'tok' }, body: VALID_BODY });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Solo el super-admin puede usar este endpoint' });
  });

  it('returns 400 when assessmentId is missing', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'tok' },
      body: { correo: 'a@b.com', password: 'pw', rol: 'admin' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'assessmentId inválido o ausente' });
  });

  it('returns 400 when assessmentId is NaN', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'tok' },
      body: { ...VALID_BODY, assessmentId: 'not-a-number' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'assessmentId inválido o ausente' });
  });

  it('returns 400 when correo is missing', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'tok' },
      body: { assessmentId: 5, password: 'pw', rol: 'admin' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'correo es obligatorio' });
  });

  it('returns 400 when correo is blank (whitespace only)', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'tok' },
      body: { ...VALID_BODY, correo: '   ' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'correo es obligatorio' });
  });

  it('returns 400 when email format is invalid (no @)', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'tok' },
      body: { ...VALID_BODY, correo: 'notanemail' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'El formato del correo no es válido' });
  });

  it('returns 400 when email contains an emoji', async () => {
    // Standard email regex will reject this; server guards against it
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'tok' },
      body: { ...VALID_BODY, correo: 'test🎉@mail.com' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when email has internal spaces', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'tok' },
      body: { ...VALID_BODY, correo: 'test @mail.com' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when password is missing', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'tok' },
      body: { assessmentId: 5, correo: 'a@b.com', rol: 'admin' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'password es obligatorio' });
  });

  it('returns 400 when rol is missing', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'tok' },
      body: { assessmentId: 5, correo: 'a@b.com', password: 'pw' },
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'rol es obligatorio' });
  });

  it('returns 409 when email already exists in assessment (duplicate constraint)', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    setupInsert({ data: null, error: { code: '23505', message: 'duplicate key' } });
    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'tok' },
      body: VALID_BODY,
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Ya existe un administrador con ese correo en este assessment',
    });
  });

  it('creates staff successfully with valid input', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    setupInsert({ data: { ID_Staff: 77 }, error: null });
    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'tok' },
      body: VALID_BODY,
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Administrador creado', ID_Staff: 77 });
  });

  it('returns 500 when Supabase insert fails with a non-constraint error', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    setupInsert({ data: null, error: { code: '50000', message: 'unexpected db error' } });
    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'tok' },
      body: VALID_BODY,
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
