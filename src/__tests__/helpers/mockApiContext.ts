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
    assessmentId: undefined,
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
export function buildSupabaseChain(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  return chain;
}

/** 
 * Helper to setup a default non-revoked token mock for requireRoles.
 * Call this in beforeEach for API tests that use requireRoles.
 */
export function setupRevokedTokenMock(supabase: any) {
  // Por defecto, el token NO está revocado
  supabase.from.mockImplementation((table: string) => {
    if (table === 'RevokedTokens') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
      };
    }
    // Para otras tablas, retornar el mock por defecto o dejar que el test lo defina
    return buildSupabaseChain({ data: null, error: null });
  });
}
