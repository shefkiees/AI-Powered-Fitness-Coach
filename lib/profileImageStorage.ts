import { supabase } from "@/lib/supabaseClient";

const BUCKET = "avatars";

/**
 * Upload a profile image to Supabase Storage. Path: `{userId}/{timestamp}-{safeName}`.
 * Requires bucket `avatars` (public) and storage policies from migration.
 */
export async function uploadProfileImage(
  userId: string,
  file: File,
): Promise<{ publicUrl: string | null; error: string | null }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safe =
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`.replace(
      /[^a-zA-Z0-9._-]/g,
      "",
    );
  const path = `${userId}/${safe}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (upErr) return { publicUrl: null, error: upErr.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { publicUrl, error: null };
}

/** Extract storage object path from a public avatars URL, or null if not ours. */
export function publicUrlToAvatarsPath(publicUrl: string): string | null {
  const m = publicUrl.match(
    /\/storage\/v1\/object\/public\/avatars\/(.+?)(?:\?|$)/,
  );
  return m ? decodeURIComponent(m[1]) : null;
}

export async function removeProfileImageFromStorage(
  publicUrl: string,
): Promise<void> {
  try {
    const path = publicUrlToAvatarsPath(publicUrl);
    if (!path) return;
    await supabase.storage.from(BUCKET).remove([path]);
  } catch {
    /* ignore */
  }
}
