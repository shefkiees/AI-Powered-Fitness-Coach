/* eslint-disable @typescript-eslint/no-require-imports */
const { consumeRateLimit } = require("./rateLimit");

const DEFAULT_LIMIT = 8;
const DEFAULT_WINDOW_MS = 60 * 1000;

function parsePositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback;
}

function routeKeyToEnvSegment(routeKey) {
  return String(routeKey || "default")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

function getAiRateLimitConfig(routeKey, env = process.env) {
  const routeSegment = routeKeyToEnvSegment(routeKey);
  const limit = parsePositiveInt(
    env[`AI_RATE_LIMIT_${routeSegment}_LIMIT`] ?? env.AI_RATE_LIMIT_LIMIT,
    DEFAULT_LIMIT,
  );
  const windowMs = parsePositiveInt(
    env[`AI_RATE_LIMIT_${routeSegment}_WINDOW_MS`] ?? env.AI_RATE_LIMIT_WINDOW_MS,
    DEFAULT_WINDOW_MS,
  );

  return { limit, windowMs };
}

function shouldUseLocalRateLimitFallback(env = process.env) {
  return env.NODE_ENV !== "production";
}

function normalizePersistentResult(raw) {
  const row = Array.isArray(raw) ? raw[0] : raw;
  if (!row || typeof row !== "object") {
    throw new Error("Persistent rate limit did not return a result row.");
  }

  const requestCount = Number(row.request_count ?? row.requestCount ?? 0);
  const retryAfterMs = Number(row.retry_after_ms ?? row.retryAfterMs ?? 0);
  const allowed = Boolean(row.allowed ?? row.ok);
  const remainingValue = Number(row.remaining ?? Number.NaN);
  const limitValue = Number(row.limit ?? Number.NaN);
  const remaining = Number.isFinite(remainingValue)
    ? remainingValue
    : Number.isFinite(limitValue)
      ? Math.max(0, limitValue - requestCount)
      : 0;

  return {
    ok: allowed,
    remaining,
    retryAfterMs: Math.max(0, retryAfterMs),
    requestCount,
    windowStart: row.window_start ?? row.windowStart ?? null,
  };
}

async function consumePersistentRateLimit({
  supabase,
  userId,
  endpoint,
  limit,
  windowMs,
  allowLocalFallback = shouldUseLocalRateLimitFallback(),
}) {
  try {
    if (!supabase || typeof supabase.rpc !== "function") {
      throw new Error("Supabase RPC client is unavailable.");
    }

    const { data, error } = await supabase.rpc("consume_ai_endpoint_rate_limit", {
      p_endpoint: endpoint,
      p_limit: limit,
      p_window_ms: windowMs,
    });

    if (error) throw error;
    return normalizePersistentResult(data);
  } catch (error) {
    if (!allowLocalFallback) throw error;

    const fallback = consumeRateLimit({
      key: `${userId}:${endpoint}`,
      limit,
      windowMs,
    });

    return {
      ...fallback,
      source: "local",
    };
  }
}

module.exports = {
  consumePersistentRateLimit,
  getAiRateLimitConfig,
  routeKeyToEnvSegment,
  shouldUseLocalRateLimitFallback,
};
