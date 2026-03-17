import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyAssessmentAccess } from './assessment';
import type { TokenPayload } from './auth';
import type { NextApiResponse } from 'next';

vi.mock('@/lib/supabase/server', () => ({
  supabase: { from: vi.fn() },
}));

vi.mock('@/lib/auth/cookie', () => ({
  clearSessionCookie: vi.fn(),
}));

function createMockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as NextApiResponse;
}

describe('verifyAssessmentAccess', () => {
  let mockRes: NextApiResponse;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRes = createMockRes();
  });

  describe('super admin access', () => {
    it('super admin with id 0 can access any assessment', () => {
      const superAdmin: TokenPayload = {
        id: 0,
        email: 'admin@test.com',
        role: 'admin',
      };

      const result = verifyAssessmentAccess(superAdmin, 999, mockRes);

      expect(result).toBe(true);
    });
  });

  describe('regular admin access', () => {
    it('admin with matching assessmentId can access', () => {
      const admin: TokenPayload = {
        id: 5,
        email: 'admin@test.com',
        role: 'admin',
        assessmentId: 5,
      };

      const result = verifyAssessmentAccess(admin, 5, mockRes);

      expect(result).toBe(true);
    });

    it('admin with mismatched assessmentId is denied', () => {
      const admin: TokenPayload = {
        id: 5,
        email: 'admin@test.com',
        role: 'admin',
        assessmentId: 5,
      };

      const result = verifyAssessmentAccess(admin, 10, mockRes);

      expect(result).toBe(false);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'No tienes acceso a este assessment' });
    });

    it('admin without assessmentId in token is denied', () => {
      const admin: TokenPayload = {
        id: 5,
        email: 'admin@test.com',
        role: 'admin',
      };

      const result = verifyAssessmentAccess(admin, 5, mockRes);

      expect(result).toBe(false);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Sin acceso a ningún assessment' });
    });
  });

  describe('calificador access', () => {
    it('calificador with matching assessmentId can access', () => {
      const calificador: TokenPayload = {
        id: 10,
        email: 'calificador@test.com',
        role: 'calificador',
        assessmentId: 3,
      };

      const result = verifyAssessmentAccess(calificador, 3, mockRes);

      expect(result).toBe(true);
    });

    it('calificador with mismatched assessmentId is denied', () => {
      const calificador: TokenPayload = {
        id: 10,
        email: 'calificador@test.com',
        role: 'calificador',
        assessmentId: 3,
      };

      const result = verifyAssessmentAccess(calificador, 7, mockRes);

      expect(result).toBe(false);
    });
  });

  describe('registrador access', () => {
    it('registrador with matching assessmentId can access', () => {
      const registrador: TokenPayload = {
        id: 15,
        email: 'registrador@test.com',
        role: 'registrador',
        assessmentId: 8,
      };

      const result = verifyAssessmentAccess(registrador, 8, mockRes);

      expect(result).toBe(true);
    });

    it('registrador with mismatched assessmentId is denied', () => {
      const registrador: TokenPayload = {
        id: 15,
        email: 'registrador@test.com',
        role: 'registrador',
        assessmentId: 8,
      };

      const result = verifyAssessmentAccess(registrador, 12, mockRes);

      expect(result).toBe(false);
    });
  });
});
