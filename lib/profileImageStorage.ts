import { supabase } from "@/lib/supabaseClient";

const BUCKET = "avatars";

function validateImageFile(file: File): string | null {
  if (!file) return "No file selected.";

  if (!file.type.startsWith("image/")) {
    return "Only image files are allowed.";
  }

  if (file.size > 5 * 1024 * 1024) {
    return "Image must be smaller than 5MB.";
  }

  return null;
}

function generateAvatarPath(userId: string, file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";

  const safeName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  return `${userId}/${safeName}`;
}

function extractAvatarPath(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const index = url.pathname.indexOf(marker);

    if (index === -1) return null;

    return decodeURIComponent(url.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

export async function uploadProfileImage(
  userId: string,
  file: File,
): Promise<{
  publicUrl: string | null;
  error: string | null;
  success: string | null;
}> {
  const validationError = validateImageFile(file);

  if (validationError) {
    return { publicUrl: null, error: validationError, success: null };
  }

  try {
    const path = generateAvatarPath(userId, file);

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      return {
        publicUrl: null,
        error: error.message,
        success: null,
      };
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return {
      publicUrl: data.publicUrl,
      error: null,
      success: "Profile image uploaded successfully.",
    };
  } catch {
    return {
      publicUrl: null,
      error: "Unexpected error while uploading image.",
      success: null,
    };
  }
}

export async function removeProfileImageFromStorage(
  publicUrl: string,
): Promise<{ error: string | null; success: string | null }> {
  const path = extractAvatarPath(publicUrl);

  if (!path) {
    return { error: "Invalid image link.", success: null };
  }

  try {
    const { error } = await supabase.storage.from(BUCKET).remove([path]);

    if (error) {
      return {
        error: "Failed to delete image. Try again.",
        success: null,
      };
    }

    return {
      error: null,
      success: "Image deleted successfully.",
    };
  } catch {
    return {
      error: "Unexpected error while deleting image.",
      success: null,
    };
  }
}
