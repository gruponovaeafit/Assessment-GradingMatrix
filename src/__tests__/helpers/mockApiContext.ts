import { vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { TokenPayload } from '@/lib/auth';

export function createMockReq(overrides: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    method: 'GET',
    cookies: {},
    headers: {},
    query: {},
    body: {},
    ...overrides,
  } as NextApiRequest;
}

export function createMockRes(): NextApiResponse & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> } {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as NextApiResponse & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
}

export function mockSuperAdminToken(overrides: Partial<TokenPayload> = {}): TokenPayload {
  return {
    id: 0,
    email: 'superadmin@nova.com',
    role: 'admin',
    assessmentId: 1, // Default assessment for super-admin in tests
    ...overrides,
  } as unknown as TokenPayload;
}

export function mockAdminToken(assessmentId: number, overrides: Partial<TokenPayload> = {}): TokenPayload {
  return {
    id: 99,
    email: 'admin@assessment.com',
    role: 'admin',
    assessmentId,
    ...overrides,
  } as unknown as TokenPayload;
}

/** Builds a Supabase chain that resolves with { data, error } at .single() */
export function buildSupabaseChain(result: { data: unknown; error: unknown } = { data: null, error: null }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
  };
  return chain;
}

/** 
 * Helper to setup default auth mocks for requireRoles (revocation, account status, assessment status).
 * Call this in beforeEach for API tests that use requireRoles.
 */
export function setupAuthMocks(supabase: any) {
  // Default non-revoked, active account and active assessment
  supabase.from.mockImplementation((table: string) => {
    if (table === 'RevokedTokens') {
      return buildSupabaseChain({ data: null, error: null });
    }
    if (table === 'Staff') {
      return buildSupabaseChain({ 
        data: { 
          Active: true, 
          Assessment: { Activo_Assessment: true } 
        }, 
        error: null 
      });
    }
    if (table === 'Assessment') {
      return buildSupabaseChain({ 
        data: { Activo_Assessment: true }, 
        error: null 
      });
    }
    // Para otras tablas, retornar el mock por defecto o dejar que el test lo defina
    return buildSupabaseChain({ data: null, error: null });
  });
}

/** Legacy alias for setupAuthMocks */
export const setupRevokedTokenMock = setupAuthMocks;
