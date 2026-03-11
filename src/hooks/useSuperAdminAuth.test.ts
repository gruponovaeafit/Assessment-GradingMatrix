import { renderHook, act } from '@testing-library/react';
import { useSuperAdminAuth } from './useSuperAdminAuth';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useRouter } from 'next/navigation';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('useSuperAdminAuth', () => {
  const mockPush = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  it('should initialize as not super admin if localStorage is empty', () => {
    const { result } = renderHook(() => useSuperAdminAuth());
    expect(result.current.isSuperAdmin).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should identify super admin from localStorage if valid and not expired', () => {
    const validAuth = {
      isAdmin: true,
      isSuperAdmin: true,
      timestamp: Date.now()
    };
    localStorage.setItem('adminAuth', JSON.stringify(validAuth));
    localStorage.setItem('authToken', 'test-token');

    const { result } = renderHook(() => useSuperAdminAuth());
    
    expect(result.current.isSuperAdmin).toBe(true);
    expect(result.current.token).toBe('test-token');
  });

  it('should identify as NOT super admin if isSuperAdmin flag is missing', () => {
    const invalidAuth = {
      isAdmin: true,
      // isSuperAdmin: true, // Missing
      timestamp: Date.now()
    };
    localStorage.setItem('adminAuth', JSON.stringify(invalidAuth));

    const { result } = renderHook(() => useSuperAdminAuth());
    
    expect(result.current.isSuperAdmin).toBe(false);
  });

  it('should identify as NOT super admin if session expired', () => {
    const expiredAuth = {
      isAdmin: true,
      isSuperAdmin: true,
      timestamp: Date.now() - (9 * 60 * 60 * 1000) // 9 hours ago
    };
    localStorage.setItem('adminAuth', JSON.stringify(expiredAuth));

    const { result } = renderHook(() => useSuperAdminAuth());
    
    expect(result.current.isSuperAdmin).toBe(false);
  });

  it('requireSuperAdmin should redirect if not authorized', () => {
    const { result } = renderHook(() => useSuperAdminAuth());
    
    act(() => {
      result.current.requireSuperAdmin();
    });

    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });

  it('logout should clear storage and redirect', async () => {
    localStorage.setItem('authToken', 'token');
    const { result } = renderHook(() => useSuperAdminAuth());

    await act(async () => {
      result.current.logout();
    });

    expect(localStorage.getItem('authToken')).toBeNull();
    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });
});
