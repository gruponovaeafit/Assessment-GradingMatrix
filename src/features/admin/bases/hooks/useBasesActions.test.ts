import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBasesActions } from './useBasesActions';
import { authFetch } from '@/lib/auth/authFetch';
import { notify } from '@/components/UI/Notification';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useConfirmModal } from '@/components/UI/ConfirmModal';
import { type Base } from '../schemas/basesSchemas';

vi.mock('@/lib/auth/authFetch', () => ({
  authFetch: vi.fn()
}));

vi.mock('@/components/UI/Notification', () => ({
  notify: vi.fn(),
}));

vi.mock('@/hooks/useAdminAuth', () => ({
  useAdminAuth: vi.fn(),
}));

vi.mock('@/components/UI/ConfirmModal', () => ({
  useConfirmModal: vi.fn(),
}));

describe('useBasesActions', () => {
  const mockLogout = vi.fn();
  const mockSetBases = vi.fn();
  const mockConfirm = vi.fn();
  const mockSetIsLoading = vi.fn();

  const mockBases: Base[] = [
    {
      ID_Base: 1,
      ID_Assessment: 1,
      Numero_Base: 1,
      Nombre_Base: 'Base 1',
      Competencia_Base: 'Comp 1',
      Descripcion_Base: 'Desc 1',
      Comportamiento1_Base: 'C1',
      Comportamiento2_Base: 'C2',
      Comportamiento3_Base: 'C3',
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAdminAuth as vi.Mock).mockReturnValue({
      logout: mockLogout,
    });
    
    (useConfirmModal as vi.Mock).mockReturnValue({
      confirm: mockConfirm,
      setIsLoading: mockSetIsLoading,
      ConfirmModalComponent: () => null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const setupHook = () => {
    return renderHook(() => useBasesActions({
      bases: mockBases,
      setBases: mockSetBases,
    }));
  };

  it('handleOpenCreate should open modal and reset form', () => {
    const { result } = setupHook();

    act(() => {
      // Set some dirty data first
      result.current.setFormData({ ...result.current.formData, nombre: 'Dirty' });
    });

    act(() => {
      result.current.handleOpenCreate();
    });

    expect(result.current.showModal).toBe(true);
    expect(result.current.formData.nombre).toBe('');
    expect(result.current.editingBase).toBeNull();
  });

  it('handleOpenEdit should set form data correctly and open modal', () => {
    const { result } = setupHook();

    act(() => {
      result.current.handleOpenEdit(mockBases[0]);
    });

    expect(result.current.editingBase).toEqual(mockBases[0]);
    expect(result.current.showModal).toBe(true);
    expect(result.current.formData.nombre).toBe('Base 1');
    expect(result.current.formData.numeroBase).toBe('1');
  });

  it('handleSubmit should successfully call update API when editingBase is set', async () => {
    const { result } = setupHook();

    (authFetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    act(() => {
      result.current.handleOpenEdit(mockBases[0]);
    });

    act(() => {
      result.current.setFormData({ ...result.current.formData, nombre: 'Base 1 Edited' });
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(authFetch).toHaveBeenCalledWith(
      '/api/base/update',
      expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('Base 1 Edited')
      }),
      expect.any(Function)
    );
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Base actualizada'
    }));
    expect(mockSetBases).toHaveBeenCalledWith(expect.any(Function));
    
    // Verify state update function maps fields correctly
    const stateUpdateFn = mockSetBases.mock.calls[0][0];
    const updatedBases = stateUpdateFn(mockBases);
    expect(updatedBases[0]).toEqual(expect.objectContaining({
      Nombre_Base: 'Base 1 Edited',
      Competencia_Base: 'Comp 1',
      Descripcion_Base: 'Desc 1',
      Comportamiento1_Base: 'C1',
      Comportamiento2_Base: 'C2',
      Comportamiento3_Base: 'C3',
    }));
    
    expect(result.current.showModal).toBe(false);
  });

  it('handleSubmit should handle API errors gracefully', async () => {
    const { result } = setupHook();

    (authFetch as vi.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Error del servidor' })
    });

    act(() => {
      result.current.handleOpenEdit(mockBases[0]);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(notify).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Error',
      subtitle: 'Error del servidor'
    }));
  });

  it('handleDelete should not delete if confirm is false', async () => {
    mockConfirm.mockResolvedValueOnce(false);
    const { result } = setupHook();

    await act(async () => {
      await result.current.handleDelete(1);
    });

    expect(authFetch).not.toHaveBeenCalled();
  });

  it('handleDelete should successfully call delete API', async () => {
    mockConfirm.mockResolvedValueOnce(true);
    const { result } = setupHook();

    (authFetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    await act(async () => {
      await result.current.handleDelete(1);
    });

    expect(authFetch).toHaveBeenCalledWith(
      '/api/base/delete',
      expect.objectContaining({
        method: 'DELETE',
        body: JSON.stringify({ idBase: 1 })
      }),
      expect.any(Function)
    );
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Base eliminada'
    }));
    expect(mockSetBases).toHaveBeenCalledWith(expect.any(Function));
    
    // Verify state update function removes the correct base
    const stateUpdateFn = mockSetBases.mock.calls[0][0];
    const updatedBases = stateUpdateFn(mockBases);
    expect(updatedBases).toHaveLength(0);
  });
});
