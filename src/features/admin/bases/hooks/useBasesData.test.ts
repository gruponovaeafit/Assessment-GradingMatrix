import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useBasesData } from './useBasesData';
import { authFetch } from '@/lib/auth/authFetch';
import { showToast } from '@/components/UI/Toast';

vi.mock('@/lib/auth/authFetch', () => ({
  authFetch: vi.fn()
}));

vi.mock('@/components/UI/Toast', () => ({
  showToast: {
    error: vi.fn(),
    success: vi.fn(),
  }
}));

const { mockPush, mockRouter } = vi.hoisted(() => {
  const pushFn = vi.fn();
  return { mockPush: pushFn, mockRouter: { push: pushFn } };
});

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

import { useAdminAuth } from '@/hooks/useAdminAuth';

vi.mock('@/hooks/useAdminAuth', () => ({
  useAdminAuth: vi.fn(),
}));

describe('useBasesData', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupHook = (isAdmin = true, authLoading = false) => {
    (useAdminAuth as any).mockReturnValue({
      isAdmin,
      isLoading: authLoading,
      logout: mockLogout,
    });
    
    return renderHook(() => useBasesData());
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not fetch anything if auth is loading or not admin', async () => {
    setupHook(false, true);
    expect(authFetch).not.toHaveBeenCalled();

    setupHook(false, false);
    expect(authFetch).not.toHaveBeenCalled();
  });

  it('should fetch bases on mount if auth is ready and user is admin', async () => {
    const mockBases = [{ ID_Base: 10, Nombre_Base: 'Base 1' }];
    (authFetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockBases
    });

    const { result } = setupHook();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.bases).toEqual(mockBases);
    });

    expect(authFetch).toHaveBeenCalledTimes(1);
    expect(authFetch).toHaveBeenCalledWith(
      '/api/base/list',
      expect.any(Object),
      expect.any(Function)
    );
  });

  it('should handle bases fetch errors gracefully', async () => {
    (authFetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Error' })
    });

    const { result } = setupHook();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(showToast.error).toHaveBeenCalledWith('Error al cargar bases');
    });

    expect(result.current.bases).toEqual([]);
  });

  it('should redirect to login if authFetch returns 401', async () => {
    (authFetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({})
    });

    setupHook();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });
});
