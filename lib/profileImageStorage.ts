import { requireSupabase } from "@/src/lib/supabaseClient";

const BUCKET = "avatars";

function uploadErrorMessage(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("row-level security") || lower.includes("rls")) {
    return "Profile photo upload is blocked by Supabase Storage policy. Apply docs/avatar-storage-policies.sql in Supabase SQL Editor, then sign in again and retry.";
  }

  if (lower.includes("bucket not found")) {
    return "Supabase Storage bucket 'avatars' is missing. Apply docs/avatar-storage-policies.sql in Supabase SQL Editor, then retry.";
  }

  if (lower.includes("jwt") || lower.includes("session") || lower.includes("unauthorized")) {
    return "Your login session could not be used for this upload. Sign out, sign in again, and retry.";
  }

  return message;
}

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

function readImageDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not prepare image preview."));
    image.src = src;
  });
}

function canvasToDataUrl(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not compress profile image."));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Could not encode profile image."));
        reader.readAsDataURL(blob);
      },
      "image/jpeg",
      0.82,
    );
  });
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

export async function compressProfileImageToDataUrl(
  file: File,
): Promise<{ dataUrl: string | null; error: string | null }> {
  const validationError = validateImageFile(file);

  if (validationError) {
    return { dataUrl: null, error: validationError };
  }

  try {
    const source = await readImageDataUrl(file);
    const image = await loadImage(source);
    const maxSize = 512;
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return { dataUrl: null, error: "Could not compress profile image." };
    }

    context.drawImage(image, 0, 0, width, height);
    return { dataUrl: await canvasToDataUrl(canvas), error: null };
  } catch (error) {
    return {
      dataUrl: null,
      error: error instanceof Error ? error.message : "Could not prepare profile image.",
    };
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
    const supabase = requireSupabase();
    const path = generateAvatarPath(userId, file);

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      return {
        publicUrl: null,
        error: uploadErrorMessage(error.message),
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
    const supabase = requireSupabase();
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
