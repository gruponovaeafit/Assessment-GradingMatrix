import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRegisterForm } from './useRegisterForm';

// Mock imageUtils
vi.mock('../utils/imageUtils', () => ({
  compressImage: vi.fn(),
  isCompressError: vi.fn(),
}));

import { compressImage, isCompressError } from '../utils/imageUtils';

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');

describe('useRegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch = vi.fn();
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

    expect(result.current.mensaje).toBe('Por favor completa los campos obligatorios');
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

    expect(result.current.mensaje).toBe('❌ Error al conectar con el servidor');
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
});
