export const SUPPORTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
export const SUPPORTED_VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov"];
export const MAX_VIDEO_FILE_SIZE_BYTES = 500 * 1024 * 1024;

export type VideoUploadAsset = {
  file: File;
  objectUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  width: number;
  height: number;
};

export type VideoUploadValidation = {
  ok: boolean;
  error?: string;
};

function extensionFor(file: File) {
  const dotIndex = file.name.lastIndexOf(".");
  return dotIndex >= 0 ? file.name.slice(dotIndex).toLowerCase() : "";
}

export function formatVideoFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes > 100 * 1024 * 1024 ? 0 : 1)} MB`;
}

export function validateWorkoutVideo(file: File): VideoUploadValidation {
  const extension = extensionFor(file);
  const typeSupported = SUPPORTED_VIDEO_TYPES.includes(file.type);
  const extensionSupported = SUPPORTED_VIDEO_EXTENSIONS.includes(extension);

  if (!typeSupported && !extensionSupported) {
    return {
      ok: false,
      error: "Unsupported video format. Upload an MP4, WebM, or MOV workout video.",
    };
  }

  if (file.size > MAX_VIDEO_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: `Video is too large. Max size is ${formatVideoFileSize(MAX_VIDEO_FILE_SIZE_BYTES)}.`,
    };
  }

  return { ok: true };
}

function waitForVideoEvent(video: HTMLVideoElement, eventName: string) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener(eventName, handleEvent);
      video.removeEventListener("error", handleError);
    };
    const handleEvent = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error("Could not read video metadata."));
    };
    video.addEventListener(eventName, handleEvent, { once: true });
    video.addEventListener("error", handleError, { once: true });
  });
}

async function loadPreviewVideo(objectUrl: string) {
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;
  video.src = objectUrl;
  await waitForVideoEvent(video, "loadedmetadata");
  return video;
}

async function createVideoThumbnail(video: HTMLVideoElement) {
  const seekTarget = Math.min(Math.max(video.duration * 0.08, 0.1), 2);
  if (Number.isFinite(seekTarget) && seekTarget > 0) {
    video.currentTime = seekTarget;
    await waitForVideoEvent(video, "seeked").catch(() => undefined);
  }

  const canvas = document.createElement("canvas");
  const maxWidth = 960;
  const scale = Math.min(1, maxWidth / Math.max(1, video.videoWidth));
  canvas.width = Math.max(1, Math.round((video.videoWidth || 1280) * scale));
  canvas.height = Math.max(1, Math.round((video.videoHeight || 720) * scale));
  const context = canvas.getContext("2d");
  if (!context) return "";
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.78);
}

export async function prepareWorkoutVideo(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<VideoUploadAsset> {
  const validation = validateWorkoutVideo(file);
  if (!validation.ok) throw new Error(validation.error);

  onProgress?.(8);
  const objectUrl = URL.createObjectURL(file);

  try {
    onProgress?.(28);
    const video = await loadPreviewVideo(objectUrl);
    onProgress?.(58);
    const thumbnailUrl = await createVideoThumbnail(video);
    onProgress?.(86);

    return {
      file,
      objectUrl,
      thumbnailUrl,
      durationSeconds: Number.isFinite(video.duration) ? video.duration : 0,
      width: video.videoWidth || 0,
      height: video.videoHeight || 0,
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  } finally {
    onProgress?.(100);
  }
}

export function revokeWorkoutVideoAsset(asset: VideoUploadAsset | null) {
  if (!asset) return;
  URL.revokeObjectURL(asset.objectUrl);
}
