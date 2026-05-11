export type PoseDetectorLike = {
  estimatePoses: (
    video: HTMLVideoElement,
    config?: object,
  ) => Promise<{ keypoints?: { x: number; y: number; score?: number }[] }[]>;
  dispose: () => void | Promise<void>;
};

type LoadPoseDetectorOptions = {
  timeoutMs?: number;
  onProgress?: (progress: number, label: string) => void;
};

let detector: PoseDetectorLike | null = null;
let loadingPromise: Promise<PoseDetectorLike> | null = null;

export function isPoseDetectorReady() {
  return Boolean(detector);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeoutId = 0;

  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error("Pose model failed to load"));
      }, timeoutMs);
    }),
  ]).finally(() => {
    if (timeoutId) window.clearTimeout(timeoutId);
  });
}

async function createMoveNetDetector(onProgress?: LoadPoseDetectorOptions["onProgress"]) {
  onProgress?.(12, "Loading TensorFlow");
  const tf = await import("@tensorflow/tfjs");

  onProgress?.(28, "Loading WebGL backend");
  await import("@tensorflow/tfjs-backend-webgl");

  try {
    await tf.setBackend("webgl");
  } catch {
    await tf.setBackend("cpu");
  }

  onProgress?.(52, "Preparing TensorFlow");
  await tf.ready();

  onProgress?.(72, "Loading MoveNet model");
  const poseDetection = await import("@tensorflow-models/pose-detection");
  const loadedDetector = (await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      enableSmoothing: true,
    },
  )) as PoseDetectorLike;

  onProgress?.(100, "Pose model ready");
  return loadedDetector;
}

export async function loadSharedPoseDetector(options: LoadPoseDetectorOptions = {}) {
  const timeoutMs = options.timeoutMs ?? 30000;

  if (detector) {
    options.onProgress?.(100, "Pose model ready");
    return { detector, reused: true };
  }

  if (!loadingPromise) {
    loadingPromise = createMoveNetDetector(options.onProgress).catch((error) => {
      loadingPromise = null;
      console.error("[pose-detector] model load failed", error);
      throw new Error("Pose model failed to load");
    });
  }

  detector = await withTimeout(loadingPromise, timeoutMs);
  return { detector, reused: false };
}
