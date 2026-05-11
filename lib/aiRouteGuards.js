/* eslint-disable @typescript-eslint/no-require-imports */
const { NextResponse } = require("next/server");
const { isStrictBackendMode } = require("./backendMode");
const { consumePersistentRateLimit, getAiRateLimitConfig } = require("./persistentRateLimit");

async function enforceAiRateLimit({
  supabase,
  routeKey,
  userId,
}) {
  const { limit, windowMs } = getAiRateLimitConfig(routeKey);
  let result;

  try {
    result = await consumePersistentRateLimit({
      supabase,
      userId,
      endpoint: routeKey,
      limit,
      windowMs,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Could not validate the AI rate limit. Try again shortly.",
      },
      { status: 503 },
    );
  }

  if (result.ok) return null;

  const retryAfterSeconds = Math.max(1, Math.ceil(result.retryAfterMs / 1000));
  return NextResponse.json(
    {
      error: "Rate limit reached for AI requests. Try again shortly.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}

function strictBackendFallbackResponse(message) {
  if (!isStrictBackendMode()) return null;
  return NextResponse.json(
    {
      error: message,
    },
    { status: 503 },
  );
}

module.exports = {
  enforceAiRateLimit,
  strictBackendFallbackResponse,
};
