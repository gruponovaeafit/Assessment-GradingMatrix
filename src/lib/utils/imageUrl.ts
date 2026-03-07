import type { SupabaseClient } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase/server';

const DEFAULT_BUCKET = 'imagenes_participantes';
const PARTICIPANT_SIGNED_URL_EXPIRY_SEC = 60 * 60;
const DEFAULT_SIGNED_URL_EXPIRY_SEC = 60 * 60 * 24 * 7;

function pathFromPublicUrl(url: string): string | null {
  const match = url.match(/\/(?:object\/public\/)?(?:images|imagenes_participantes)\/(.+)$/i);
  return match ? match[1].replace(/^\/+/, '') : null;
}

export async function getSignedImageUrl(
  bucket: string,
  path: string,
  expiresInSeconds = DEFAULT_SIGNED_URL_EXPIRY_SEC,
  client?: SupabaseClient
): Promise<string | null> {
  if (!path) return null;

  const storageClient = client ?? supabase;

  const { data, error } = await storageClient.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

export async function resolveParticipantPhotoUrl(
  supabase: SupabaseClient,
  fotoUrl: string | null | undefined
): Promise<string | null> {
  if (!fotoUrl || typeof fotoUrl !== 'string' || fotoUrl.trim() === '') return null;
  const trimmed = fotoUrl.trim();

  let path: string;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const extracted = pathFromPublicUrl(trimmed);
    if (!extracted) return trimmed;
    path = extracted;
  } else {
    path = trimmed;
  }

  return getSignedImageUrl(DEFAULT_BUCKET, path, PARTICIPANT_SIGNED_URL_EXPIRY_SEC, supabase);
}

export async function resolveParticipantPhotoUrls(
  supabase: SupabaseClient,
  fotoUrls: (string | null | undefined)[]
): Promise<(string | null)[]> {
  return Promise.all(fotoUrls.map((url) => resolveParticipantPhotoUrl(supabase, url)));
}
