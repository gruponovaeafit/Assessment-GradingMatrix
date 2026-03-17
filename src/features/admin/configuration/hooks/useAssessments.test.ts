import { renderHook, act } from '@testing-library/react';
import { useAssessments } from './useAssessments';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { authFetch } from '@/lib/auth/authFetch';

vi.mock('@/lib/auth/authFetch', () => ({
  authFetch: vi.fn(),
}));

describe('useAssessments', () => {
  const logout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty assessments and not loading', () => {
    const { result } = renderHook(() => useAssessments(logout));
    
    expect(result.current.assessments).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should fetch and set assessments correctly on success', async () => {
    const mockData = [
      { id: 1, nombre: 'Assessment 1', activo: true },
      { id: 2, nombre: 'Assessment 2', activo: false },
    ];

    vi.mocked(authFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const { result } = renderHook(() => useAssessments(logout));

    await act(async () => {
      await result.current.refreshAssessments();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.assessments).toEqual(mockData);
    expect(authFetch).toHaveBeenCalledWith(
      '/api/assessment/list',
      {},
      expect.any(Function)
    );
  });

  it('should handle validation errors (invalid data shape)', async () => {
    const invalidMockData = [
      { id: 1, name: 'Wrong Property Name' } // Missing 'activo' and wrong property 'name'
    ];

    vi.mocked(authFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => invalidMockData,
    } as Response);

    const { result } = renderHook(() => useAssessments(logout));

    await act(async () => {
      await result.current.refreshAssessments();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.assessments).toEqual([]); // Fallback to empty array on validation error
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(authFetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    const { result } = renderHook(() => useAssessments(logout));

    await act(async () => {
      await result.current.refreshAssessments();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.assessments).toEqual([]);
  });
});
