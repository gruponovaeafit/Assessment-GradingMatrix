import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRegisterAuth } from './useRegisterAuth';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('useRegisterAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to login when fetch fails (not authorized)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const { result } = renderHook(() => useRegisterAuth());

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
    expect(result.current.checkingAuth).toBe(true);
  });

  it('should redirect to login when role is invalid', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ 
      ok: true, 
      json: async () => ({ role: 'calificador' }) 
    }));

    renderHook(() => useRegisterAuth());

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('should stop checking auth for registrador role', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ 
      ok: true, 
      json: async () => ({ role: 'registrador' }) 
    }));

    const { result } = renderHook(() => useRegisterAuth());

    await waitFor(() => {
      expect(result.current.checkingAuth).toBe(false);
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should stop checking auth for admin role', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ 
      ok: true, 
      json: async () => ({ role: 'admin' }) 
    }));

    const { result } = renderHook(() => useRegisterAuth());

    await waitFor(() => {
      expect(result.current.checkingAuth).toBe(false);
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
