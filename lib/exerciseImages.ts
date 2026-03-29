/**
 * Curated Unsplash URLs for exercise cards (next/image + remotePatterns).
 * Fallback: generic training image.
 */

const FALLBACK =
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80&auto=format&fit=crop";

/** Keyword → image (fitness-related stock) */
const BY_KEYWORD: Record<string, string> = {
  squat:
    "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80&auto=format&fit=crop",
  push:
    "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800&q=80&auto=format&fit=crop",
  plank:
    "https://images.unsplash.com/photo-1566241140909-7e72a5731561?w=800&q=80&auto=format&fit=crop",
  lunge:
    "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=800&q=80&auto=format&fit=crop",
  burpee:
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80&auto=format&fit=crop",
  jump:
    "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=800&q=80&auto=format&fit=crop",
  jack:
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80&auto=format&fit=crop",
  knee:
    "https://images.unsplash.com/photo-1599058945522-41d42a61d463?w=800&q=80&auto=format&fit=crop",
  walk:
    "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80&auto=format&fit=crop",
  jog:
    "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80&auto=format&fit=crop",
  row:
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80&auto=format&fit=crop",
  pull:
    "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=800&q=80&auto=format&fit=crop",
  press:
    "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80&auto=format&fit=crop",
  deadlift:
    "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=800&q=80&auto=format&fit=crop",
  goblet:
    "https://images.unsplash.com/photo-1583454155184-870a1f63ae8b?w=800&q=80&auto=format&fit=crop",
  romanian:
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80&auto=format&fit=crop",
  arm:
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80&auto=format&fit=crop",
  leg:
    "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=800&q=80&auto=format&fit=crop",
  cat:
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80&auto=format&fit=crop",
  fold:
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80&auto=format&fit=crop",
  chest:
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80&auto=format&fit=crop",
  stretch:
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80&auto=format&fit=crop",
  dip:
    "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800&q=80&auto=format&fit=crop",
  pike:
    "https://images.unsplash.com/photo-1599058945522-41d42a61d463?w=800&q=80&auto=format&fit=crop",
  mountain:
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80&auto=format&fit=crop",
  skater:
    "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=800&q=80&auto=format&fit=crop",
  butt:
    "https://images.unsplash.com/photo-1599058945522-41d42a61d463?w=800&q=80&auto=format&fit=crop",
  bridge:
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80&auto=format&fit=crop",
  wall:
    "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80&auto=format&fit=crop",
  bug:
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80&auto=format&fit=crop",
  bicycle:
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80&auto=format&fit=crop",
  side:
    "https://images.unsplash.com/photo-1566241140909-7e72a5731561?w=800&q=80&auto=format&fit=crop",
  russian:
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80&auto=format&fit=crop",
  shoulder:
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80&auto=format&fit=crop",
  wide:
    "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800&q=80&auto=format&fit=crop",
  incline:
    "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80&auto=format&fit=crop",
  reverse:
    "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=800&q=80&auto=format&fit=crop",
  single:
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80&auto=format&fit=crop",
  triceps:
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80&auto=format&fit=crop",
};

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();
}

export function getExerciseImageUrl(exerciseName: string): string {
  const n = normalize(exerciseName);
  const tokens = n.split(/\s+/).filter(Boolean);
  for (const t of tokens) {
    if (t.length >= 4 && BY_KEYWORD[t]) return BY_KEYWORD[t];
  }
  for (const t of tokens) {
    for (const [key, url] of Object.entries(BY_KEYWORD)) {
      if (t.includes(key) || key.includes(t)) return url;
    }
  }
  if (n.includes("squat")) return BY_KEYWORD.squat;
  if (n.includes("push")) return BY_KEYWORD.push;
  if (n.includes("plank")) return BY_KEYWORD.plank;
  if (n.includes("lunge")) return BY_KEYWORD.lunge;
  return FALLBACK;
}

export function getExerciseImageAlt(name: string): string {
  return `${name} — fitness exercise`;
}
