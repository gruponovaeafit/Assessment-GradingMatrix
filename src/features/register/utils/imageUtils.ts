import imageCompression from 'browser-image-compression';

export interface CompressResult {
  file: File;
}

export interface CompressError {
  error: string;
}

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.4,
  maxWidthOrHeight: 512,
  useWebWorker: true,
  fileType: 'image/webp' as const,
  initialQuality: 0.85,
};

const MAX_COMPRESSED_SIZE = 600 * 1024; // 600 KB

/**
 * Compress an image file for upload.
 * Returns the compressed file or an error string.
 */
export async function compressImage(
  file: File
): Promise<CompressResult | CompressError> {
  try {
    const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS);

    if (compressedFile.size > MAX_COMPRESSED_SIZE) {
      return { error: 'La imagen es muy pesada. Usa una foto más pequeña.' };
    }

    return { file: compressedFile };
  } catch (error) {
    console.error('Error al comprimir imagen', error);
    return { error: 'Error procesando la imagen' };
  }
}

/** Type guard */
export function isCompressError(
  result: CompressResult | CompressError
): result is CompressError {
  return 'error' in result;
}
