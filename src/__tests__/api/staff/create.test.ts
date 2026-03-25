import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockReq, createMockRes, mockAdminToken, setupAuthMocks, buildSupabaseChain } from '@/__tests__/helpers/mockApiContext';
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

const VALID_BODY = {
  correo: 'newstaff@example.com',
  password: 'Password123!',
  rol: 'calificador',
};

describe('POST /api/staff/create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuthMocks(supabase);
  });

  it('creates staff with Active: true by default', async () => {
    const assessmentId = 10;
    mockVerifyToken.mockReturnValue(mockAdminToken(assessmentId));
    
    let capturedStaffData: any = null;
    mockFrom.mockImplementation((table: string) => {
      // Keep requireRoles happy
      if (table === 'RevokedTokens') return buildSupabaseChain({ data: null, error: null });
      if (table === 'Staff') {
        return {
          ...buildSupabaseChain(),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation((col, val) => {
             // If checking status for requireRoles
             if (col === 'ID_Staff') {
               return buildSupabaseChain({ 
                 data: { Active: true, Assessment: { Activo_Assessment: true } } 
               });
             }
             return buildSupabaseChain();
          }),
          single: vi.fn().mockImplementation(async () => {
             // If this is the final insert check
             if (capturedStaffData) {
               return { data: { ID_Staff: 123 }, error: null };
             }
             // Fallback for requireRoles status check if eq didn't catch it
             return { data: { Active: true, Assessment: { Activo_Assessment: true } }, error: null };
          }),
          insert: vi.fn().mockImplementation((data) => {
            capturedStaffData = data;
            return {
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: { ID_Staff: 123 }, error: null }),
            };
          }),
        };
      }
      if (table === 'Bases') return buildSupabaseChain({ data: { ID_Assessment: assessmentId }, error: null });
      
      return buildSupabaseChain();
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
