import { renderHook, act } from '@testing-library/react';
import { useSuperAdminAuth } from './useSuperAdminAuth';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAuth } from '@/lib/auth/AuthContext';

vi.mock('@/lib/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('useSuperAdminAuth', () => {
  const mockLogout = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return isSuperAdmin false when context returns isSuperAdmin false', () => {
    vi.mocked(useAuth).mockReturnValue({
      isSuperAdmin: false,
      isLoading: false,
      logout: mockLogout,
    } as any);

    const { result } = renderHook(() => useSuperAdminAuth());
    expect(result.current.isSuperAdmin).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should return isSuperAdmin true when context returns isSuperAdmin true', () => {
    vi.mocked(useAuth).mockReturnValue({
      isSuperAdmin: true,
      isLoading: false,
      logout: mockLogout,
    } as any);

    const { result } = renderHook(() => useSuperAdminAuth());
    expect(result.current.isSuperAdmin).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should return loading state from context', () => {
    vi.mocked(useAuth).mockReturnValue({
      isSuperAdmin: false,
      isLoading: true,
      logout: mockLogout,
    } as any);

    const { result } = renderHook(() => useSuperAdminAuth());
    expect(result.current.isLoading).toBe(true);
  });

  it('logout should call logout from context', async () => {
    vi.mocked(useAuth).mockReturnValue({
      isSuperAdmin: true,
      isLoading: false,
      logout: mockLogout,
    } as any);

    const { result } = renderHook(() => useSuperAdminAuth());
    
    await act(async () => {
      await result.current.logout();
    });

    expect(mockLogout).toHaveBeenCalled();
  });
});
