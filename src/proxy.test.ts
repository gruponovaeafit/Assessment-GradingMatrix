import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock verifyTokenEdge before importing middleware
vi.mock('@/lib/auth/verifyTokenEdge', () => ({
  verifyTokenEdge: vi.fn(),
}));

import { proxy } from './proxy';
import { verifyTokenEdge } from '@/lib/auth/verifyTokenEdge';

// Helper to create a mock NextRequest
function makeRequest(path: string, sessionCookie?: string): NextRequest {
  const url = new URL(path, 'http://localhost:3000');
  const req = new NextRequest(url);
  if (sessionCookie) {
    req.cookies.set('session', sessionCookie);
  }
  return req;
}

describe('proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('ADMIN_EMAIL', 'admin@assessment.com');
  });

  it('should redirect to login when no session cookie exists', async () => {
    const req = makeRequest('/admin/gestion');
    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/auth/login');
  });

  it('should allow admin to access /admin/gestion', async () => {
    (verifyTokenEdge as any).mockResolvedValue({
      id: 1, email: 'admin@test.com', role: 'admin',
    });

    const req = makeRequest('/admin/gestion', 'valid-admin-token');
    const res = await proxy(req);

    // NextResponse.next() returns 200
    expect(res.status).toBe(200);
  });

  it('should redirect calificador trying to access /admin/gestion', async () => {
    (verifyTokenEdge as any).mockResolvedValue({
      id: 2, email: 'grader@test.com', role: 'calificador',
    });

    const req = makeRequest('/admin/gestion', 'valid-grader-token');
    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/auth/login');
  });

  it('should allow calificador to access /grader', async () => {
    (verifyTokenEdge as any).mockResolvedValue({
      id: 2, email: 'grader@test.com', role: 'calificador',
    });

    const req = makeRequest('/grader', 'valid-grader-token');
    const res = await proxy(req);

    expect(res.status).toBe(200);
  });

  it('should allow registrador to access /register', async () => {
    (verifyTokenEdge as any).mockResolvedValue({
      id: 3, email: 'registrador@test.com', role: 'registrador',
    });

    const req = makeRequest('/register', 'valid-registrador-token');
    const res = await proxy(req);

    expect(res.status).toBe(200);
  });

  it('should redirect calificador trying to access /register', async () => {
    (verifyTokenEdge as any).mockResolvedValue({
      id: 2, email: 'grader@test.com', role: 'calificador',
    });

    const req = makeRequest('/register', 'valid-grader-token');
    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/auth/login');
  });

  it('should allow admin to access superadmin route', async () => {
    (verifyTokenEdge as any).mockResolvedValue({
      id: 1, email: 'admin@assessment.com', role: 'admin',
    });

    const req = makeRequest('/super-admin', 'valid-admin-token');
    const res = await proxy(req);

    expect(res.status).toBe(200);
  });

  it('should redirect non-admin from superadmin route', async () => {
    (verifyTokenEdge as any).mockResolvedValue({
      id: 2, email: 'other@test.com', role: 'admin',
    });

    const req = makeRequest('/super-admin', 'valid-admin-token');
    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/auth/login');
  });
});
