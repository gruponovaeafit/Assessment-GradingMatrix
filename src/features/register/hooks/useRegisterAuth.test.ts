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
    localStorage.clear();
  });

  it('should redirect to login when no token exists', async () => {
    const { result } = renderHook(() => useRegisterAuth());

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
    expect(result.current.checkingAuth).toBe(true);
  });

  it('should redirect to login when role is invalid', async () => {
    localStorage.setItem('authToken', 'valid-token');
    localStorage.setItem('authRole', 'calificador');

    renderHook(() => useRegisterAuth());

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('should stop checking auth for registrador role', async () => {
    localStorage.setItem('authToken', 'valid-token');
    localStorage.setItem('authRole', 'registrador');

    const { result } = renderHook(() => useRegisterAuth());

    await waitFor(() => {
      expect(result.current.checkingAuth).toBe(false);
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should stop checking auth for admin role', async () => {
    localStorage.setItem('authToken', 'valid-token');
    localStorage.setItem('authRole', 'admin');

    const { result } = renderHook(() => useRegisterAuth());

    await waitFor(() => {
      expect(result.current.checkingAuth).toBe(false);
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
