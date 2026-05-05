export const goalLabels = {
  lose_weight: "Lose weight",
  build_muscle: "Build muscle",
  maintain: "Maintain",
  improve_fitness: "Improve fitness",
};

export const fitnessLevelLabels = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const genderLabels = {
  female: "Female",
  male: "Male",
  non_binary: "Non-binary",
  prefer_not_say: "Prefer not to say",
};

export function titleCase(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatGoal(value) {
  return goalLabels[value] || titleCase(value) || "Not set";
}

export function formatLevel(value) {
  return fitnessLevelLabels[value] || titleCase(value) || "Not set";
}

export function formatNumber(value, suffix = "") {
  if (value === null || value === undefined || value === "") return "--";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "--";
  return `${Number.isInteger(numeric) ? numeric : numeric.toFixed(1)}${suffix}`;
}

export function startOfWeek(date = new Date()) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function isoDateTime(date = new Date()) {
  return date.toISOString();
}

export function toDateInputValue(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

