import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRegisterAuth } from './useRegisterAuth';
import { useAuth } from '@/lib/auth/AuthContext';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/lib/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('useRegisterAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to login when context indicates not authorized', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAdmin: false,
      isRegistrar: false,
      isLoading: false,
      logout: vi.fn(),
    } as any);

    const { result } = renderHook(() => useRegisterAuth());

    expect(mockPush).toHaveBeenCalledWith('/auth/login');
    expect(result.current.checkingAuth).toBe(false);
  });

  it('should stop checking auth for registrador role', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAdmin: false,
      isRegistrar: true,
      isLoading: false,
      logout: vi.fn(),
    } as any);

    const { result } = renderHook(() => useRegisterAuth());

    expect(result.current.checkingAuth).toBe(false);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should stop checking auth for admin role', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAdmin: true,
      isRegistrar: false,
      isLoading: false,
      logout: vi.fn(),
    } as any);

    const { result } = renderHook(() => useRegisterAuth());

    expect(result.current.checkingAuth).toBe(false);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should return loading state from context', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAdmin: false,
      isRegistrar: false,
      isLoading: true,
      logout: vi.fn(),
    } as any);

    const { result } = renderHook(() => useRegisterAuth());
    expect(result.current.checkingAuth).toBe(true);
  });
});
