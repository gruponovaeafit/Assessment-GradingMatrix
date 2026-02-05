import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ONE_WEEK = 60 * 60 * 24 * 7;

export async function getSignedImageUrl(
  bucket: string,
  path: string
): Promise<string | null> {
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, ONE_WEEK);

  if (error) {
    console.error("❌ Signed URL error:", error);
    return null;
  }

  return data.signedUrl;
}
