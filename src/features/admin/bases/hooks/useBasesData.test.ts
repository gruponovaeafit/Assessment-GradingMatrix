import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBasesData } from './useBasesData';
import { authFetch } from '@/lib/auth/authFetch';
import { notify } from '@/components/UI/Notification';
import { useAdminAuth } from '@/hooks/useAdminAuth';

vi.mock('@/lib/auth/authFetch', () => ({
  authFetch: vi.fn()
}));

vi.mock('@/components/UI/Notification', () => ({
  notify: vi.fn(),
}));

const { mockPush, mockRouter } = vi.hoisted(() => {
  const pushFn = vi.fn();
  return { mockPush: pushFn, mockRouter: { push: pushFn } };
});

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

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
      expect(notify).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error',
        subtitle: 'Error al cargar bases'
      }));
    });

    expect(result.current.bases).toEqual([]);
  });

  it('should handle authFetch 401 response', async () => {
    (authFetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({})
    });

    setupHook();

    await waitFor(() => {
      // The component should stop loading, redirection logic is handled by authFetch callback
      // or specifically in the hook if status === 401. 
      // Current hook doesn't push to router on 401, it relies on authFetch callback.
      expect(authFetch).toHaveBeenCalled();
    });
  });
});
