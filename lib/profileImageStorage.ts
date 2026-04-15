import { supabase } from "@/lib/supabaseClient";

const BUCKET = "avatars";

/**
 * Validate image file (BUG FIX + HARDENING)
 */
function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Only image files are allowed.";
  }

  if (file.size > 5 * 1024 * 1024) {
    return "Image size must be under 5MB.";
  }

  return null;
}

/**
 * Generate safe avatar path (REFACTORED)
 */
function generateAvatarPath(userId: string, file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";

  const safeName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  return `${userId}/${safeName}`;
}

/**
 * Upload profile image (UX + BUG FIX + IMPROVED FEEDBACK)
 */
export async function uploadProfileImage(
  userId: string,
  file: File
): Promise<{
  publicUrl: string | null;
  error: string | null;
  success: string | null;
}> {
  try {
    // Validation
    const validationError = validateImageFile(file);
    if (validationError) {
      return { publicUrl: null, error: validationError, success: null };
    }

    const path = generateAvatarPath(userId, file);

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    // Improved error feedback
    if (upErr) {
      return {
        publicUrl: null,
        error: upErr.message || "Upload failed. Please try again.",
        success: null,
      };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return {
      publicUrl,
      error: null,
      success: "Image uploaded successfully.",
    };
  } catch {
    return {
      publicUrl: null,
      error: "Unexpected error occurred while uploading image.",
      success: null,
    };
  }
}

/**
 * Convert public URL to storage path (REFACTORED)
 */
function extractAvatarPath(publicUrl: string): string | null {
  const match = publicUrl.match(
    /\/storage\/v1\/object\/public\/avatars\/(.+?)(?:\?|$)/
  );

  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Remove profile image (UX IMPROVED + BETTER ERRORS)
 */
export async function removeProfileImageFromStorage(
  publicUrl: string
): Promise<{ error: string | null; success: string | null }> {
  try {
    const path = extractAvatarPath(publicUrl);

    if (!path) {
      return { error: "Invalid image link.", success: null };
    }

    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([path]);

    if (error) {
      return {
        error: error.message || "Could not delete image. Try again.",
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