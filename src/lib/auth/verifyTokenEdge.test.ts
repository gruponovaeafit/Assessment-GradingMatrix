import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need to mock jose before importing verifyTokenEdge
vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
}));

import { verifyTokenEdge } from './verifyTokenEdge';
import { jwtVerify } from 'jose';

describe('verifyTokenEdge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('JWT_SECRET', 'test-secret-key-for-unit-tests');
  });

  it('should return decoded payload for a valid JWT', async () => {
    const mockPayload = { id: 1, email: 'admin@test.com', role: 'admin' };
    (jwtVerify as any).mockResolvedValue({
      payload: mockPayload,
    });

    const result = await verifyTokenEdge('valid.jwt.token');

    expect(result).toEqual(mockPayload);
    expect(jwtVerify).toHaveBeenCalledOnce();
  });

  it('should return null for an expired JWT', async () => {
    (jwtVerify as any).mockRejectedValue(new Error('JWTExpired'));

    const result = await verifyTokenEdge('expired.jwt.token');

    expect(result).toBeNull();
  });

  it('should return null for a malformed string', async () => {
    (jwtVerify as any).mockRejectedValue(new Error('JWSInvalid'));

    const result = await verifyTokenEdge('not-a-jwt');

    expect(result).toBeNull();
  });
});
