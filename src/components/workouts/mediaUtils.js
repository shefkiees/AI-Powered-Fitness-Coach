export function getDisplayTitle(title) {
  const raw = String(title || "Workout").trim();
  return raw.replace(/^day\s*\d+\s*[:\-]\s*/i, "").trim() || raw;
}

export function getDayLabel(title) {
  const match = String(title || "").match(/^(day\s*\d+)/i);
  return match ? match[1].replace(/\s+/g, " ") : "";
}

export function getWorkoutImage(workout) {
  return (
    workout?.coverImage ||
    workout?.cover_image ||
    workout?.thumbnailUrl ||
    workout?.thumbnail_url ||
    workout?.image_url ||
    null
  );
}

export function getWorkoutPreviewVideo(workout) {
  const media = workout?.workout_media?.find?.((item) => item.media_type === "video");
  return workout?.previewVideoUrl || workout?.preview_video_url || workout?.video_url || media?.media_url || null;
}

export function getExerciseImage(exercise, workout = null) {
  return exercise?.imageUrl || exercise?.image_url || getWorkoutImage(workout);
}

export function getExerciseVideo(exercise) {
  return exercise?.videoUrl || exercise?.video_url || null;
}

export function getRestSeconds(exercise) {
  return exercise?.restSeconds ?? exercise?.rest_seconds ?? null;
}

export function formatRest(seconds) {
  const value = Number(seconds || 0);
  return value > 0 ? `${value}s rest` : "guided rest";
}

export function estimateWorkoutCalories(workout) {
  const direct = Number(workout?.calories || workout?.calories_estimate || workout?.calories_burned || 0);
  if (direct > 0) return Math.round(direct);
  return Math.max(90, Math.round(Number(workout?.duration_minutes || 25) * 7.2));
}

export function splitMuscles(value, exercises = []) {
  const fromWorkout = String(value || "")
    .split(/[,+/•]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const fromExercises = exercises
    .map((exercise) => exercise?.targetMuscles || exercise?.muscle_group)
    .filter(Boolean)
    .flatMap((item) => String(item).split(/[,+/•]/))
    .map((item) => item.trim())
    .filter(Boolean);

  const unique = Array.from(new Set([...(fromWorkout.length ? fromWorkout : fromExercises)]));
  return unique.length ? unique.slice(0, 4) : ["Full body"];
}

export function youtubeVideoId(value) {
  const raw = String(value || "");
  const match =
    raw.match(/[?&]v=([^&]+)/) ||
    raw.match(/youtu\.be\/([^?&]+)/) ||
    raw.match(/embed\/([^?&]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

export function isYouTubeUrl(value) {
  return /youtube\.com|youtu\.be|youtube-nocookie\.com/i.test(String(value || ""));
}

export function toYouTubeEmbed(value, { autoplay = false } = {}) {
  const id = youtubeVideoId(value);
  if (!id) return String(value || "");
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  if (autoplay) {
    params.set("autoplay", "1");
    params.set("mute", "1");
    params.set("loop", "1");
    params.set("playlist", id);
  }
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}
