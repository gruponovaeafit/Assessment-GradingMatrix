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

import handler from '@/pages/api/assessment/list';
import { verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase/server';

const mockVerifyToken = verifyToken as ReturnType<typeof vi.fn>;
const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

const SAMPLE_ASSESSMENTS = [
  { ID_Assessment: 1, Nombre_Assessment: 'A', Activo_Assessment: true },
  { ID_Assessment: 2, Nombre_Assessment: 'B', Activo_Assessment: false },
];

/**
 * Build a thenable chain that resolves to { data, error } when awaited directly.
 * Every chainable method returns `this` but the object's Promise protocol is preserved.
 */
function buildThenable(data: unknown, error: unknown = null) {
  const resolved = Promise.resolve({ data, error });
  const chain: Record<string, unknown> = {
    select: vi.fn(),
    order: vi.fn(),
    eq: vi.fn(),
    then: resolved.then.bind(resolved),
    catch: resolved.catch.bind(resolved),
    finally: resolved.finally.bind(resolved),
  };
  // All builder methods return `chain` itself
  (chain.select as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  (chain.order as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  (chain.eq as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  return chain;
}

describe('GET /api/assessment/list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 405 for non-GET requests', async () => {
    const req = createMockReq({ method: 'POST' });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('returns 401 when unauthenticated', async () => {
    mockVerifyToken.mockReturnValue(null);
    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('super-admin gets all assessments', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    // Super-admin never calls getAuthorizedAssessmentId, so only 1 from() call
    mockFrom.mockReturnValue(buildThenable(SAMPLE_ASSESSMENTS));
    const req = createMockReq({ method: 'GET', cookies: { session: 'tok' } });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(payload).toHaveLength(2);
    expect(payload[0]).toMatchObject({ id: 1, nombre: 'A', activo: true });
  });

  it('regular admin sees only their own assessment', async () => {
    // For regular admin, getAuthorizedAssessmentId does NOT call supabase — it reads from JWT.
    // So only one from() call for the actual query.
    mockVerifyToken.mockReturnValue(mockAdminToken(1));
    mockFrom.mockReturnValue(buildThenable([SAMPLE_ASSESSMENTS[0]]));
    const req = createMockReq({ method: 'GET', cookies: { session: 'tok' } });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(payload).toHaveLength(1);
    expect(payload[0].id).toBe(1);
  });

  it('returns empty array when no assessments exist', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    mockFrom.mockReturnValue(buildThenable([]));
    const req = createMockReq({ method: 'GET', cookies: { session: 'tok' } });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect((res.json as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual([]);
  });

  it('returns 500 when Supabase query fails', async () => {
    mockVerifyToken.mockReturnValue(mockSuperAdminToken());
    mockFrom.mockReturnValue(buildThenable(null, { message: 'db error' }));
    const req = createMockReq({ method: 'GET', cookies: { session: 'tok' } });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
