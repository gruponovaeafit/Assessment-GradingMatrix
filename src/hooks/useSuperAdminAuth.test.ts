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
  });

  it('should initialize as not super admin if API returns non-admin role', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ 
      ok: true, 
      json: async () => ({ role: 'not-admin', isSuperAdmin: false }) 
    }));

    const { result } = renderHook(() => useSuperAdminAuth());
    await waitFor(() => {
      expect(result.current.isSuperAdmin).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should identify super admin if API returns admin role and isSuperAdmin true', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ 
      ok: true, 
      json: async () => ({ role: 'admin', isSuperAdmin: true }) 
    }));

    const { result } = renderHook(() => useSuperAdminAuth());
    
    await waitFor(() => {
      expect(result.current.isSuperAdmin).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should identify as NOT super admin if API returns admin role but isSuperAdmin false', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ 
      ok: true, 
      json: async () => ({ role: 'admin', isSuperAdmin: false }) 
    }));

    const { result } = renderHook(() => useSuperAdminAuth());
    
    await waitFor(() => {
      expect(result.current.isSuperAdmin).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should identify as NOT super admin if API request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ 
      ok: false,
      status: 401
    }));

    const { result } = renderHook(() => useSuperAdminAuth());
    
    await waitFor(() => {
      expect(result.current.isSuperAdmin).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('logout should call api, clear state and redirect', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ 
      ok: true, 
      json: async () => ({ role: 'admin', isSuperAdmin: true }) 
    }));

    const { result } = renderHook(() => useSuperAdminAuth());
    await waitFor(() => expect(result.current.isSuperAdmin).toBe(true));

    await act(async () => {
      result.current.logout();
    });

    expect(result.current.isSuperAdmin).toBe(false);
    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });
});
