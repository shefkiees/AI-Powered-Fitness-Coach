export function parseJsonObject<T extends Record<string, unknown>>(content: string, fallback: T): T {
  try {
    return { ...fallback, ...(JSON.parse(content) as Record<string, unknown>) } as T;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return fallback;
    try {
      return { ...fallback, ...(JSON.parse(match[0]) as Record<string, unknown>) } as T;
    } catch {
      return fallback;
    }
  }
}

export function stringList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 6);
  return items.length ? items : fallback;
}

export function cleanText(value: unknown, fallback = "", maxChars = 240) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return fallback;
  return text.length > maxChars ? `${text.slice(0, maxChars).trim()}...` : text;
}

export function cleanNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function dateDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export function isoDateDaysAgo(days: number) {
  return dateDaysAgo(days).toISOString();
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
