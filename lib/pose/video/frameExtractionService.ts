export type FrameScheduleOptions = {
  targetFps?: number;
  maxFrames?: number;
};

export function createFrameSchedule(
  durationSeconds: number,
  { targetFps = 8, maxFrames = 720 }: FrameScheduleOptions = {},
) {
  const duration = Math.max(0, Number(durationSeconds) || 0);
  if (!duration) return [0];

  const requestedInterval = 1 / Math.max(1, targetFps);
  const minimumIntervalForCap = duration / Math.max(1, maxFrames);
  const interval = Math.max(requestedInterval, minimumIntervalForCap);
  const times: number[] = [];

  for (let time = 0; time < duration; time += interval) {
    times.push(Math.min(duration, Number(time.toFixed(3))));
  }

  if (times[times.length - 1] !== duration) {
    times.push(duration);
  }

  return times;
}

export function estimateRemainingSeconds(startedAt: number, percentage: number) {
  if (percentage <= 2) return null;
  const elapsed = (performance.now() - startedAt) / 1000;
  const remainingRatio = Math.max(0, 100 - percentage) / percentage;
  return Math.max(0, Math.round(elapsed * remainingRatio));
}

function aborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Video analysis was cancelled.", "AbortError");
}

export function yieldToMainThread() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, 0));
}

export async function loadVideoElementForAnalysis(src: string, signal?: AbortSignal) {
  aborted(signal);

  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = src;

  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener("loadedmetadata", handleLoaded);
      video.removeEventListener("error", handleError);
      signal?.removeEventListener("abort", handleAbort);
    };
    const handleLoaded = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error("Could not load the uploaded video for analysis."));
    };
    const handleAbort = () => {
      cleanup();
      reject(new DOMException("Video analysis was cancelled.", "AbortError"));
    };
    video.addEventListener("loadedmetadata", handleLoaded, { once: true });
    video.addEventListener("error", handleError, { once: true });
    signal?.addEventListener("abort", handleAbort, { once: true });
  });

  return video;
}

export async function seekVideoToTime(video: HTMLVideoElement, timeSeconds: number, signal?: AbortSignal) {
  aborted(signal);

  const duration = Number.isFinite(video.duration) ? video.duration : timeSeconds;
  const target = Math.max(0, Math.min(timeSeconds, duration || timeSeconds));

  if (Math.abs(video.currentTime - target) < 0.025 && video.readyState >= 2) {
    await waitForDecodedFrame(video, signal);
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("error", handleError);
      signal?.removeEventListener("abort", handleAbort);
    };
    const handleSeeked = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error("Could not extract a video frame."));
    };
    const handleAbort = () => {
      cleanup();
      reject(new DOMException("Video analysis was cancelled.", "AbortError"));
    };
    video.addEventListener("seeked", handleSeeked, { once: true });
    video.addEventListener("error", handleError, { once: true });
    signal?.addEventListener("abort", handleAbort, { once: true });
    video.currentTime = target;
  });

  await waitForDecodedFrame(video, signal);
}

function waitForDecodedFrame(video: HTMLVideoElement, signal?: AbortSignal) {
  aborted(signal);

  const frameVideo = video as HTMLVideoElement & {
    requestVideoFrameCallback?: (callback: () => void) => number;
    cancelVideoFrameCallback?: (handle: number) => void;
  };

  if (!frameVideo.requestVideoFrameCallback) {
    return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }

  return new Promise<void>((resolve, reject) => {
    let callbackId = 0;
    const cleanup = () => {
      if (callbackId && frameVideo.cancelVideoFrameCallback) {
        frameVideo.cancelVideoFrameCallback(callbackId);
      }
      signal?.removeEventListener("abort", handleAbort);
    };
    const handleAbort = () => {
      cleanup();
      reject(new DOMException("Video analysis was cancelled.", "AbortError"));
    };
    signal?.addEventListener("abort", handleAbort, { once: true });
    callbackId = frameVideo.requestVideoFrameCallback(() => {
      cleanup();
      resolve();
    });
  });
}

export function disposeAnalysisVideo(video: HTMLVideoElement) {
  video.pause();
  video.removeAttribute("src");
  video.load();
}
