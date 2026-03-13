import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { compressImage, isCompressError } from './imageUtils';

vi.mock('browser-image-compression', () => ({
  default: vi.fn(),
}));

import imageCompression from 'browser-image-compression';

describe('compressImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return compressed file when size is under limit', async () => {
    const mockFile = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
    const compressedFile = new File(['compressed'], 'photo.webp', { type: 'image/webp' });
    // Mock: size under 600KB
    Object.defineProperty(compressedFile, 'size', { value: 200 * 1024 });

    (imageCompression as unknown as Mock).mockResolvedValueOnce(compressedFile);

    const result = await compressImage(mockFile);

    expect(isCompressError(result)).toBe(false);
    if (!isCompressError(result)) {
      expect(result.file).toBe(compressedFile);
    }

    expect(imageCompression).toHaveBeenCalledWith(mockFile, expect.objectContaining({
      maxSizeMB: 0.4,
      maxWidthOrHeight: 512,
    }));
  });

  it('should return error when compressed file exceeds 600KB', async () => {
    const mockFile = new File(['test'], 'huge.jpg', { type: 'image/jpeg' });
    const largeFile = new File(['big'], 'huge.webp', { type: 'image/webp' });
    Object.defineProperty(largeFile, 'size', { value: 700 * 1024 });

    (imageCompression as unknown as Mock).mockResolvedValueOnce(largeFile);

    const result = await compressImage(mockFile);

    expect(isCompressError(result)).toBe(true);
    if (isCompressError(result)) {
      expect(result.error).toBe('La imagen es muy pesada. Usa una foto más pequeña.');
    }
  });

  it('should return error when compression throws', async () => {
    const mockFile = new File(['test'], 'broken.jpg', { type: 'image/jpeg' });
    (imageCompression as unknown as Mock).mockRejectedValueOnce(new Error('Boom'));

    const result = await compressImage(mockFile);

    expect(isCompressError(result)).toBe(true);
    if (isCompressError(result)) {
      expect(result.error).toBe('Error procesando la imagen');
    }
  });
});

describe('isCompressError', () => {
  it('should return true for error objects', () => {
    expect(isCompressError({ error: 'test' })).toBe(true);
  });

  it('should return false for success objects', () => {
    const file = new File(['x'], 'x.webp');
    expect(isCompressError({ file })).toBe(false);
  });
});
