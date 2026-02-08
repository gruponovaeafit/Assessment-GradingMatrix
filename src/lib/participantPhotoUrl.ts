import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'imagenes_participantes';
const SIGNED_URL_EXPIRY_SEC = 60 * 60; // 1 hora

/** Extrae el path del bucket desde una URL pública de Supabase (legacy). */
function pathFromPublicUrl(url: string): string | null {
  // .../object/public/BUCKET/participantes/xxx.webp o .../BUCKET/participantes/xxx.webp
  const match = url.match(/\/(?:object\/public\/)?(?:images|imagenes_participantes)\/(.+)$/i);
  return match ? match[1].replace(/^\/+/, '') : null;
}

/**
 * Convierte FotoUrl_Participante (path o URL legacy) en una URL que el navegador pueda cargar.
 * - Si es path (ej. "participantes/xxx.webp") → genera URL firmada (funciona con bucket privado).
 * - Si es URL completa (legacy): extrae el path y genera URL firmada del bucket correcto.
 */
export async function resolveParticipantPhotoUrl(
  supabase: SupabaseClient,
  fotoUrl: string | null | undefined
): Promise<string | null> {
  if (!fotoUrl || typeof fotoUrl !== 'string' || fotoUrl.trim() === '') return null;
  const trimmed = fotoUrl.trim();

  let path: string;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const extracted = pathFromPublicUrl(trimmed);
    if (!extracted) return trimmed; // URL rara, devolver tal cual
    path = extracted;
  } else {
    path = trimmed;
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRY_SEC);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/**
 * Resuelve las URLs de foto para un array de participantes en paralelo.
 */
export async function resolveParticipantPhotoUrls(
  supabase: SupabaseClient,
  fotoUrls: (string | null | undefined)[]
): Promise<(string | null)[]> {
  return Promise.all(
    fotoUrls.map((url) => resolveParticipantPhotoUrl(supabase, url))
  );
}
