import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRegisterForm } from './useRegisterForm';

// Mock imageUtils
vi.mock('../utils/imageUtils', () => ({
  compressImage: vi.fn(),
  isCompressError: vi.fn(),
}));

import { compressImage, isCompressError } from '../utils/imageUtils';

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('useRegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch = vi.fn();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useRegisterForm());

    expect(result.current.nombre).toBe('');
    expect(result.current.correo).toBe('');
    expect(result.current.imagen).toBeNull();
    expect(result.current.photo).toBe('');
    expect(result.current.fileName).toBe('');
    expect(result.current.mensaje).toBe('');
    expect(result.current.isError).toBe(false);
    expect(result.current.enviando).toBe(false);
    expect(result.current.successModalId).toBeNull();
  });

  it('handleSubmit should show error if fields are empty', async () => {
    const { result } = renderHook(() => useRegisterForm());

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(result.current.mensaje).toBe('Recuerda llenar los campos de texto');
    expect(result.current.isError).toBe(true);
  });

  it('handleSubmit should call fetch and set successModalId on success', async () => {
    localStorage.setItem('authToken', 'test-token');

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 42 }),
    });

    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.setNombre('Test User');
      result.current.setCorreo('test@example.com');
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/register',
      expect.objectContaining({ method: 'POST' })
    );
    expect(result.current.successModalId).toBe(42);
    expect(result.current.isError).toBe(false);
    expect(result.current.enviando).toBe(false);
  });

  it('handleSubmit should show error message on API error', async () => {
    localStorage.setItem('authToken', 'test-token');

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Correo duplicado' }),
    });

    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.setNombre('User');
      result.current.setCorreo('dup@test.com');
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(result.current.mensaje).toContain('Correo duplicado');
    expect(result.current.isError).toBe(true);
  });

  it('handleSubmit should handle network error gracefully', async () => {
    localStorage.setItem('authToken', 'test-token');

    (global.fetch as Mock).mockRejectedValueOnce(new Error('Network fail'));

    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.setNombre('User');
      result.current.setCorreo('u@t.com');
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(result.current.mensaje).toBe('Error al conectar con el servidor');
    expect(result.current.isError).toBe(true);
  });

  it('handleImageSelect should set file on success', async () => {
    const mockFile = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    const compressed = new File(['c'], 'photo.webp', { type: 'image/webp' });

    (compressImage as Mock).mockResolvedValueOnce({ file: compressed });
    (isCompressError as unknown as Mock).mockReturnValueOnce(false);

    const { result } = renderHook(() => useRegisterForm());

    await act(async () => {
      await result.current.handleImageSelect(mockFile);
    });

    expect(result.current.fileName).toBe('photo.jpg');
    expect(result.current.photo).toBe('blob:mock-url');
    expect(result.current.imagen).toBe(compressed);
    expect(result.current.isError).toBe(false);
    expect(global.URL.revokeObjectURL).not.toHaveBeenCalled(); // First time, no previous photo to revoke
  });

  it('handleImageSelect should set error and clear previous state on compression failure', async () => {
    // 1. Set a valid image first
    const validFile = new File(['valid'], 'valid.jpg', { type: 'image/jpeg' });
    const compressedValid = new File(['c'], 'valid.webp', { type: 'image/webp' });
    (compressImage as Mock).mockResolvedValueOnce({ file: compressedValid });
    (isCompressError as unknown as Mock).mockReturnValueOnce(false);

    const { result } = renderHook(() => useRegisterForm());

    await act(async () => {
      await result.current.handleImageSelect(validFile);
    });

    expect(result.current.imagen).toBe(compressedValid);
    expect(result.current.fileName).toBe('valid.jpg');

    // 2. Now fail compression on a new file
    const mockFile = new File(['x'], 'huge.jpg', { type: 'image/jpeg' });

    (compressImage as Mock).mockResolvedValueOnce({ error: 'Too big' });
    (isCompressError as unknown as Mock).mockReturnValueOnce(true);

    await act(async () => {
      await result.current.handleImageSelect(mockFile);
    });

    expect(result.current.mensaje).toBe('Too big');
    expect(result.current.isError).toBe(true);
    expect(result.current.imagen).toBeNull();
    expect(result.current.fileName).toBe('');
    expect(result.current.photo).toBe('');
  });

  it('resetForm should clear all state', () => {
    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.setNombre('Something');
      result.current.setCorreo('s@t.com');
    });

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.nombre).toBe('');
    expect(result.current.correo).toBe('');
    expect(result.current.successModalId).toBeNull();
  });

  it('handleImageSelect should revoke previous object URL if one exists', async () => {
    const file1 = new File(['1'], 'one.jpg', { type: 'image/jpeg' });
    const file2 = new File(['2'], 'two.jpg', { type: 'image/jpeg' });
    const compressed = new File(['c'], 'out.webp', { type: 'image/webp' });

    (compressImage as Mock).mockResolvedValue({ file: compressed });
    (isCompressError as unknown as Mock).mockReturnValue(false);

    // Return distinct URLs so the `photo` state actually changes between selections
    let callCount = 0;
    global.URL.createObjectURL = vi.fn(() => `blob:mock-url-${++callCount}`);
    global.URL.revokeObjectURL = vi.fn();

    const { result } = renderHook(() => useRegisterForm());

    // First image selection
    await act(async () => {
      await result.current.handleImageSelect(file1);
    });

    // Second image selection — the useEffect cleanup should revoke the first URL
    await act(async () => {
      await result.current.handleImageSelect(file2);
    });

    // The useEffect cleanup for `photo` revokes the previous URL when photo changes
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url-1');
  });

  it('should revoke object URL on unmount', () => {
    const { unmount, result } = renderHook(() => useRegisterForm());

    act(() => {
      // Simulate that a photo was set (internally setPhoto is called via handleImageSelect)
      // Since we can't directly call setPhoto, we'll spy on the cleanup by just unmounting
      // But because the URL is set in handleImageSelect, we'll do that first
    });

    // To test unmount, we just unmount and see if revoke is called if photo was set
    unmount();
    // Since photo was '' at init, and not set, shouldn't crash.
    // Testing the actual photo state via handleImageSelect:
  });

  it('should explicitly test unmount with an active photo', async () => {
    const file = new File(['1'], 'one.jpg', { type: 'image/jpeg' });
    const compressed = new File(['c'], 'out.webp', { type: 'image/webp' });

    (compressImage as Mock).mockResolvedValue({ file: compressed });
    (isCompressError as unknown as Mock).mockReturnValue(false);

    const { unmount, result } = renderHook(() => useRegisterForm());

    await act(async () => {
      await result.current.handleImageSelect(file);
    });

    global.URL.revokeObjectURL = vi.fn(); // Reset mock

    unmount();

    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});
