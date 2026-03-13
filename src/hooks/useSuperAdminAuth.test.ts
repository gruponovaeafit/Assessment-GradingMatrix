import { renderHook, act, waitFor } from '@testing-library/react';
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
    // Default mock: not super admin
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ 
      ok: true, 
      json: async () => ({ role: 'not-admin' }) 
    }));
  });

  it('should initialize as not super admin if localStorage is empty', async () => {
    const { result } = renderHook(() => useSuperAdminAuth());
    await waitFor(() => {
      expect(result.current.isSuperAdmin).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should identify super admin from localStorage if valid and not expired', async () => {
    const validAuth = {
      isAdmin: true,
      isSuperAdmin: true,
      timestamp: Date.now()
    };
    localStorage.setItem('adminAuth', JSON.stringify(validAuth));

    const { result } = renderHook(() => useSuperAdminAuth());
    
    await waitFor(() => {
      expect(result.current.isSuperAdmin).toBe(true);
    });
  });

  it('should identify as NOT super admin if isSuperAdmin flag is missing', async () => {
    const invalidAuth = {
      isAdmin: true,
      timestamp: Date.now()
    };
    localStorage.setItem('adminAuth', JSON.stringify(invalidAuth));

    const { result } = renderHook(() => useSuperAdminAuth());
    
    await waitFor(() => {
      expect(result.current.isSuperAdmin).toBe(false);
    });
  });

  it('should identify as NOT super admin if session expired', async () => {
    const expiredAuth = {
      isAdmin: true,
      isSuperAdmin: true,
      timestamp: Date.now() - (9 * 60 * 60 * 1000) // 9 hours ago
    };
    localStorage.setItem('adminAuth', JSON.stringify(expiredAuth));

    const { result } = renderHook(() => useSuperAdminAuth());
    
    await waitFor(() => {
      expect(result.current.isSuperAdmin).toBe(false);
    });
  });

  it('requireSuperAdmin should redirect if not authorized', async () => {
    const { result } = renderHook(() => useSuperAdminAuth());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.requireSuperAdmin();
    });

    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });

  it('logout should clear storage and redirect', async () => {
    localStorage.setItem('adminAuth', JSON.stringify({ isAdmin: true, isSuperAdmin: true, timestamp: Date.now() }));
    const { result } = renderHook(() => useSuperAdminAuth());

    await act(async () => {
      result.current.logout();
    });

    expect(localStorage.getItem('adminAuth')).toBeNull();
    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });
});
