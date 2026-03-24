import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockReq, createMockRes, mockAdminToken, setupRevokedTokenMock } from '@/__tests__/helpers/mockApiContext';
import handler from '@/pages/api/staff/create';
import { verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase/server';

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

const mockVerifyToken = verifyToken as ReturnType<typeof vi.fn>;
const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

function setupMocks(insertResult: { data: any; error: any }) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'RevokedTokens') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
      };
    }
    if (table === 'Staff') {
      return {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(insertResult),
      };
    }
    return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
  });
}

const VALID_BODY = {
  correo: 'newstaff@example.com',
  password: 'Password123!',
  rol: 'calificador',
};

describe('POST /api/staff/create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupRevokedTokenMock(supabase);
  });

  it('creates staff with Active: true by default', async () => {
    const assessmentId = 10;
    mockVerifyToken.mockReturnValue(mockAdminToken(assessmentId));
    
    let capturedStaffData: any = null;
    mockFrom.mockImplementation((table: string) => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      if (table === 'Staff') {
        mockChain.insert = vi.fn().mockImplementation((data) => {
          capturedStaffData = data;
          return {
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { ID_Staff: 123 }, error: null }),
          };
        });
      }
      
      return mockChain;
    });

    const req = createMockReq({
      method: 'POST',
      cookies: { session: 'valid-token' },
      body: VALID_BODY,
    });
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(capturedStaffData).not.toBeNull();
    expect(capturedStaffData.Active).toBe(true);
    expect(capturedStaffData.ID_Assessment).toBe(assessmentId);
  });
});
